"""Export everything the public (GitHub Pages) site needs to run the model in the browser.

Writes public/static/:
  model.json  - SegmentMLP weights, input standardisation, training-mean latent slots
  clips.json  - 8x88 segment features and segment times for the 15 bundled clips
  metrics.json, pilot.json - saved training metrics/curves and pilot-study results

The browser re-implements the forward pass (src/browserModel.js), so predictions and the
evidence probe on the public page are computed live from these weights.
    python3 scripts/export_static.py
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training import features as F          # noqa: E402
from training.inference import Predictor    # noqa: E402
from model_api import ModelService          # noqa: E402

OUT = ROOT / 'public' / 'static'


def r(a, nd=5):
    return np.round(np.asarray(a, dtype=float), nd).tolist()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    P = Predictor(ROOT / 'model' / 'segment_mlp.pt')
    sd = {k: v.numpy() for k, v in P.model.state_dict().items()}
    enc = []
    for i, layer in enumerate(P.model.encoder):
        if hasattr(layer, 'weight'):
            enc.append({'W': r(sd[f'encoder.{i}.weight']), 'b': r(sd[f'encoder.{i}.bias'])})
    model = {
        'activation': P.config['activation'], 'k': P.model.k, 'latent': P.model.latent,
        'classes': [F.EMOTION_NAMES[c] for c in P.classes], 'codes': list(P.classes),
        'feature_idx': list(map(int, P.fidx)), 'mean': r(P.mean, 6), 'std': r(P.std, 6),
        'encoder': enc, 'head': {'W': r(sd['head.weight']), 'b': r(sd['head.bias'])},
        'train_mean_slots': r(P.train_mean_slots.numpy()),
    }
    (OUT / 'model.json').write_text(json.dumps(model, separators=(',', ':')))

    clips, check = {}, []
    for wav in sorted((ROOT / 'public' / 'audio').glob('*.wav')):
        X, times = F.extract(F.load(str(wav)), return_bounds=True)
        clips[wav.stem] = {'X': r(X), 'times': r(times, 3)}
        check.append((wav.stem, P.predict_features(X[None])[0][0]))
    (OUT / 'clips.json').write_text(json.dumps(clips, separators=(',', ':')))
    (ROOT / 'model' / 'js_parity_check.json').write_text(json.dumps({k: r(v, 4) for k, v in check}))  # parity check for the JS port

    svc = ModelService()
    info = svc.info()
    info['active'] = 'default'
    (OUT / 'metrics.json').write_text(json.dumps(info, separators=(',', ':')))
    (OUT / 'pilot.json').write_text(json.dumps(svc.pilot_summary(), separators=(',', ':')))
    for f in sorted(OUT.glob('*.json')):
        print(f'{f.name:14s} {f.stat().st_size / 1024:7.1f} KB')


if __name__ == '__main__':
    main()
