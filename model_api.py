"""Model service used by server.py: prediction, interactive training, and evidence probes.

Heavy dependencies (torch, librosa) are imported lazily so the annotation server still
starts when they are not installed; the model endpoints then report what is missing.
"""
import io
import json
import re
import threading
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AUDIO_DIR = ROOT / 'public' / 'audio'
CORPUS_DIR = ROOT / 'data' / 'crema'
MODEL_DIR = ROOT / 'model'
RUNS_DIR = MODEL_DIR / 'runs'
SOURCE_RE = re.compile(r'^\d{4}_[A-Z]{3}_[A-Z]{3}_[A-Z]{2}$')

TRAIN_LIMITS = {
    'lr': (float, 1e-4, 1.0), 'epochs': (int, 1, 200), 'hidden': (int, 8, 512),
    'latent': (int, 8, 256), 'layers': (int, 1, 4), 'dropout': (float, 0.0, 0.9),
    'weight_decay': (float, 0.0, 0.1), 'momentum': (float, 0.0, 0.99), 'batch_size': (int, 8, 512),
}
ACTIVATIONS = ('relu', 'tanh', 'gelu', 'sigmoid')
FEATURE_SETS = ('all', 'mfcc')


class ModelError(Exception):
    """Raised for user-facing problems (missing model, bad input)."""


def validate_train_config(raw):
    if not isinstance(raw, dict):
        raise ModelError('Expected a JSON object of hyperparameters')
    cfg = {}
    for key, (kind, low, high) in TRAIN_LIMITS.items():
        if key in raw:
            value = raw[key]
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ModelError(f'{key} must be a number')
            value = kind(value)
            if not low <= value <= high:
                raise ModelError(f'{key} must be between {low} and {high}')
            cfg[key] = value
    if 'activation' in raw:
        if raw['activation'] not in ACTIVATIONS:
            raise ModelError(f'activation must be one of {ACTIVATIONS}')
        cfg['activation'] = raw['activation']
    if 'feature_set' in raw:
        if raw['feature_set'] not in FEATURE_SETS:
            raise ModelError(f'feature_set must be one of {FEATURE_SETS}')
        cfg['feature_set'] = raw['feature_set']
    return cfg


class ModelService:
    def __init__(self):
        self.lock = threading.Lock()
        self.predictor = None
        self.active = 'default'
        self.feature_cache = {}
        self.job = None            # current/last training job

    # ------------------------------------------------------------------ loading
    def _imports(self):
        try:
            from training.inference import Predictor
            from training import features
            return Predictor, features
        except ImportError as exc:
            raise ModelError(f'Model dependencies are not installed ({exc.name}). '
                             'Run: pip install -r requirements.txt') from exc

    def get_predictor(self):
        with self.lock:
            if self.predictor is None:
                Predictor, _ = self._imports()
                ckpt = MODEL_DIR / 'segment_mlp.pt'
                if not ckpt.exists():
                    raise ModelError('No trained model found. Run: python3 training/train.py')
                self.predictor = Predictor(ckpt)
                self.active = 'default'
            return self.predictor

    def info(self):
        metrics_path = MODEL_DIR / 'metrics.json'
        if self.active != 'default' and self.job and self.job.get('results'):
            metrics = self.job['results']
        else:
            metrics = json.loads(metrics_path.read_text()) if metrics_path.exists() else None
        out = {'active': self.active, 'available': metrics is not None}
        if metrics:
            out.update({k: metrics.get(k) for k in ('config', 'best_epoch', 'history', 'train', 'val',
                                                     'test', 'baselines', 'classes', 'splits', 'speakers')})
        return out

    # ------------------------------------------------------------------ prediction
    def clip_features(self, source_id):
        if not isinstance(source_id, str) or not SOURCE_RE.match(source_id):
            raise ModelError('Unknown clip id')
        if source_id in self.feature_cache:
            return self.feature_cache[source_id]
        path = AUDIO_DIR / f'{source_id}.wav'
        if not path.exists():
            path = CORPUS_DIR / f'{source_id}.wav'
        if not path.exists():
            raise ModelError(f'Audio for {source_id} not found')
        _, F = self._imports()
        X, times = F.extract(F.load(str(path)), return_bounds=True)
        self.feature_cache[source_id] = (X, times)
        return X, times

    def predict_clip(self, source_id):
        P = self.get_predictor()
        X, times = self.clip_features(source_id)
        probs, r, _ = P.predict_features(X[None])
        return P.describe(probs[0], r[0], times)

    def predict_upload(self, body):
        if not body:
            raise ModelError('Empty audio upload')
        P = self.get_predictor()
        _, F = self._imports()
        try:
            y = F.load(io.BytesIO(body))
        except Exception as exc:
            raise ModelError(f'Could not decode audio ({type(exc).__name__}). Try a WAV file.') from exc
        if len(y) < F.SR // 4:
            raise ModelError('Audio is shorter than 0.25 s')
        return P.predict_audio(y)

    # ------------------------------------------------------------------ evidence probe
    def probe(self, req):
        """Fixed-context interventions on the latent segment slots of one clip.
        op='replace': replace k slots (ranked by answer contrast, or random) with the training-mean slot.
        op='swap'   : copy the listed slots from a donor clip (e.g. another delivery of the same sentence)."""
        import numpy as np
        import torch
        P = self.get_predictor()
        X, times = self.clip_features(req.get('sourceId'))
        z = P.latents(P.standardise(X[None]))
        logp, r = P.from_latents(z)
        base = P.describe(logp.exp().numpy()[0], r.numpy()[0], times)
        op = req.get('op')
        zz = z.clone()
        if op == 'replace':
            k = int(req.get('k', 1))
            if not 0 <= k <= P.model.k:
                raise ModelError('k out of range')
            if req.get('ranking', 'contrast') == 'random':
                order = np.random.default_rng(int(req.get('seed', 0))).permutation(P.model.k)
            else:
                order = np.argsort([-s['contrast'] for s in base['segments']])
            zbar = self._train_mean_slots(P)
            for t in order[:k]:
                zz[0, t] = zbar[t]
            replaced = [int(t) for t in order[:k]]
        elif op == 'swap':
            Xd, _ = self.clip_features(req.get('donorId'))
            zd = P.latents(P.standardise(Xd[None]))
            segs = req.get('segments', [])
            if not isinstance(segs, list) or not all(isinstance(t, int) and 0 <= t < P.model.k for t in segs):
                raise ModelError('segments must be a list of slot indices')
            for t in segs:
                zz[0, t] = zd[0, t]
            replaced = segs
        else:
            raise ModelError("op must be 'replace' or 'swap'")
        logp2, r2 = P.from_latents(zz)
        after = P.describe(logp2.exp().numpy()[0], r2.numpy()[0], times)
        return {'before': base, 'after': after, 'changed': replaced}

    def _train_mean_slots(self, P):
        return P.train_mean_slots

    def pilot_summary(self):
        path = MODEL_DIR / 'probe_results.json'
        if not path.exists():
            raise ModelError('Pilot results not found. Run: python3 training/probe.py')
        r = json.loads(path.read_text())
        return {'paired': r['paired'], 'exchange': r['exchange'], 'perturbation': r['perturbation'],
                'replacement': {m: {name: {str(k): v for k, v in curve.items()} for name, curve in d.items()}
                                for m, d in r['replacement'].items()}}

    # ------------------------------------------------------------------ interactive training
    def start_training(self, raw):
        cfg = validate_train_config(raw)
        if not (ROOT / 'data' / 'features_K8.npz').exists():
            raise ModelError('Training data not prepared. Run scripts/download_crema.py then training/features.py')
        self._imports()
        with self.lock:
            if self.job and self.job['state'] == 'running':
                raise ModelError('A training run is already in progress')
            run_id = time.strftime('%Y%m%d-%H%M%S-') + uuid.uuid4().hex[:4]
            self.job = {'id': run_id, 'state': 'running', 'config': cfg, 'history': [], 'results': None,
                        'error': None, 'started': time.time(), 'stop': False}
            job = self.job
        threading.Thread(target=self._run, args=(job,), daemon=True).start()
        return {'id': run_id, 'config': cfg}

    def _run(self, job):
        try:
            from training.train import train
            def on_epoch(rec):
                job['history'].append(rec)
            _, results = train(job['config'], on_epoch=on_epoch, should_stop=lambda: job['stop'],
                               out_dir=RUNS_DIR / job['id'], verbose=False)
            job['results'] = results
            job['state'] = 'stopped' if job['stop'] else 'done'
        except Exception as exc:
            job['error'] = f'{type(exc).__name__}: {exc}'
            job['state'] = 'error'

    def stop_training(self):
        if self.job and self.job['state'] == 'running':
            self.job['stop'] = True
        return self.training_status()

    def training_status(self, since=0):
        job = self.job
        if not job:
            return {'state': 'idle'}
        out = {k: job[k] for k in ('id', 'state', 'config', 'error')}
        out['history'] = job['history'][since:]
        out['epochs_done'] = len(job['history'])
        out['elapsed'] = round(time.time() - job['started'], 1)
        if job['results']:
            res = job['results']
            out['results'] = {k: res[k] for k in ('best_epoch', 'train', 'val', 'test', 'baselines', 'classes')}
        return out

    def use_model(self, which):
        Predictor, _ = self._imports()
        with self.lock:
            if which == 'default':
                self.predictor = Predictor(MODEL_DIR / 'segment_mlp.pt')
                self.active = 'default'
            elif which == 'latest':
                if not self.job or self.job['state'] not in ('done', 'stopped'):
                    raise ModelError('No finished training run to use')
                self.predictor = Predictor(RUNS_DIR / self.job['id'] / 'segment_mlp.pt')
                self.active = self.job['id']
            else:
                raise ModelError("model must be 'default' or 'latest'")
        return {'active': self.active}
