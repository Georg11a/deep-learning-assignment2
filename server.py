"""Local-only SQLite annotation API and production static server. No dependencies."""
import argparse
import json
import math
import sqlite3
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

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
        if self.path == '/api/health':
            return self.respond(200, {'status': 'ok', 'storage': 'sqlite'})
        if self.path == '/api/annotations':
            with sqlite3.connect(self.server.db_path) as db:
                rows = db.execute('SELECT payload FROM annotations ORDER BY rowid').fetchall()
            return self.respond(200, [json.loads(r[0]) for r in rows])
        if self.path.startswith('/api/'):
            return self.respond(404, {'error': 'Unknown endpoint'})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/annotations':
            return self.respond(404, {'error': 'Unknown endpoint'})
        # Reject browser requests originating from another website.
        origin = self.headers.get('Origin')
        if origin and origin not in ('http://127.0.0.1:5173', 'http://localhost:5173', f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}'):
            return self.respond(403, {'error': 'Origin not allowed'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 100000:
                raise ValueError('Invalid request size')
            row = json.loads(self.rfile.read(length))
            validate(row)
            with sqlite3.connect(self.server.db_path) as db:
                db.execute('INSERT INTO annotations(id,payload) VALUES(?,?) ON CONFLICT(id) DO NOTHING', (row['id'], json.dumps(row, ensure_ascii=False)))
            self.respond(201, {'saved': row['id']})
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
    print(f'Emotion Dynamics Lab: http://127.0.0.1:{args.port}', flush=True)
    server.serve_forever()

if __name__ == '__main__':
    main()
