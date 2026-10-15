"""Local-only server: SQLite annotation API, model API (HW2), and the built React app.

The annotation API uses only the standard library. Model endpoints (/api/predict,
/api/train, /api/probe, ...) need the packages in requirements.txt and are loaded lazily.
"""
import argparse
import json
import math
import sqlite3
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

from model_api import ModelError, ModelService

ROOT = Path(__file__).resolve().parent

def validate(row):
    if not isinstance(row, dict):
        raise ValueError('Expected an annotation object')
    for key in ('id', 'clipId', 'emotion', 'createdAt'):
        if not isinstance(row.get(key), str) or not row[key].strip():
            raise ValueError(f'Missing {key}')
    for key, low, high in [('valence', -1, 1), ('arousal', 0, 1), ('confidence', 1, 5), ('start', 0, 86400), ('end', 0, 86400)]:
        value = row.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
            raise ValueError(f'Invalid {key}')
    if row['end'] <= row['start']:
        raise ValueError('End must follow start')

class Handler(SimpleHTTPRequestHandler):
    def respond(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == '/api/health':
            return self.respond(200, {'status': 'ok', 'storage': 'sqlite', 'model': True})
        if url.path == '/api/annotations':
            with sqlite3.connect(self.server.db_path) as db:
                rows = db.execute('SELECT payload FROM annotations ORDER BY rowid').fetchall()
            return self.respond(200, [json.loads(r[0]) for r in rows])
        model_routes = {
            '/api/model/info': lambda: self.server.models.info(),
            '/api/train/status': lambda: self.server.models.training_status(
                int(parse_qs(url.query).get('since', ['0'])[0] or 0)),
            '/api/probe/summary': lambda: self.server.models.pilot_summary(),
        }
        if url.path in model_routes:
            return self.model_call(model_routes[url.path])
        if url.path.startswith('/api/'):
            return self.respond(404, {'error': 'Unknown endpoint'})
        return super().do_GET()

    def model_call(self, fn):
        try:
            return self.respond(200, fn())
        except ModelError as error:
            return self.respond(400, {'error': str(error)})
        except Exception as error:  # never leak a stack trace to the browser
            self.log_error('model endpoint failed: %r', error)
            return self.respond(500, {'error': f'{type(error).__name__}: {error}'})

    def read_body(self, limit):
        length = int(self.headers.get('Content-Length', '0'))
        if not 0 < length <= limit:
            raise ValueError('Invalid request size')
        return self.rfile.read(length)

    def do_POST(self):
        path = urlparse(self.path).path
        # Reject browser requests originating from another website.
        origin = self.headers.get('Origin')
        if origin and origin not in ('http://127.0.0.1:5173', 'http://localhost:5173', f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}'):
            return self.respond(403, {'error': 'Origin not allowed'})
        models = self.server.models
        try:
            if path == '/api/annotations':
                row = json.loads(self.read_body(100000))
                validate(row)
                with sqlite3.connect(self.server.db_path) as db:
                    db.execute('INSERT INTO annotations(id,payload) VALUES(?,?) ON CONFLICT(id) DO NOTHING', (row['id'], json.dumps(row, ensure_ascii=False)))
                return self.respond(201, {'saved': row['id']})
            if path == '/api/predict':
                if self.headers.get('Content-Type', '').startswith('application/json'):
                    req = json.loads(self.read_body(10000))
                    return self.model_call(lambda: models.predict_clip(req.get('sourceId')))
                body = self.read_body(20_000_000)     # raw audio upload (imported file)
                return self.model_call(lambda: models.predict_upload(body))
            json_routes = {
                '/api/train': models.start_training,
                '/api/train/stop': lambda req: models.stop_training(),
                '/api/model/use': lambda req: models.use_model(req.get('model')),
                '/api/probe': models.probe,
            }
            if path in json_routes:
                req = json.loads(self.read_body(10000) or b'{}')
                if not isinstance(req, dict):
                    raise ValueError('Expected a JSON object')
                return self.model_call(lambda: json_routes[path](req))
            return self.respond(404, {'error': 'Unknown endpoint'})
        except (ValueError, UnicodeDecodeError) as error:
            self.respond(400, {'error': str(error)})

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--db', type=Path, default=ROOT / 'data' / 'annotations.sqlite3')
    args = parser.parse_args()
    args.db.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(args.db) as db:
        db.execute('CREATE TABLE IF NOT EXISTS annotations(id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT / 'dist')))
    server.db_path = str(args.db)
    server.models = ModelService()
    print(f'Emotion Dynamics Lab: http://127.0.0.1:{args.port}', flush=True)
    server.serve_forever()

if __name__ == '__main__':
    main()
