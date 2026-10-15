// Browser port of SegmentMLP inference (no server needed). Used when the Python API is
// unavailable, e.g. on GitHub Pages. Weights and clip features come from
// public/static/*.json, written by scripts/export_static.py.
const base = import.meta.env.BASE_URL;
let cache = null;

async function json(name) {
  const r = await fetch(`${base}static/${name}`);
  if (!r.ok) throw Error(`Missing static/${name}`);
  return r.json();
}

export async function loadStatic() {
  if (!cache) cache = Promise.all(['model.json', 'clips.json', 'metrics.json', 'pilot.json'].map(json))
    .then(([model, clips, metrics, pilot]) => ({model, clips, metrics, pilot}));
  return cache;
}

function erf(x) { // Abramowitz–Stegun 7.1.26, |error| < 1.5e-7
  const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const ACT = {
  relu: v => Math.max(0, v), tanh: Math.tanh, sigmoid: v => 1 / (1 + Math.exp(-v)),
  gelu: v => 0.5 * v * (1 + erf(v / Math.SQRT2)),
};

function linear(W, b, x) { return W.map((row, i) => row.reduce((s, w, j) => s + w * x[j], b[i])); }

/** Raw (K, 88) features -> latent slots (K, H). */
export function encode(model, X) {
  const act = ACT[model.activation];
  return X.map(seg => {
    let h = model.feature_idx.map((f, i) => (seg[f] - model.mean[i]) / model.std[i]);
    for (const layer of model.encoder) h = linear(layer.W, layer.b, h).map(act);
    return h;
  });
}

/** Latent slots -> {probs, readout (K x C)}; logits = sum_t readout[t] + b. */
export function classify(model, Z) {
  const H = model.latent, C = model.classes.length, W = model.head.W;
  const readout = Z.map((z, t) => Array.from({length: C}, (_, c) => z.reduce((s, v, h) => s + v * W[c][t * H + h], 0)));
  const logits = model.head.b.map((b, c) => readout.reduce((s, r) => s + r[c], b));
  const m = Math.max(...logits), e = logits.map(l => Math.exp(l - m)), sum = e.reduce((a, b) => a + b, 0);
  return {probs: e.map(v => v / sum), readout};
}

/** Same JSON shape as the Python server's Predictor.describe(). */
export function describe(model, {probs, readout}, times) {
  const top = probs.indexOf(Math.max(...probs));
  return {
    classes: model.classes, codes: model.codes, probs: probs.map(p => +p.toFixed(4)), top: model.classes[top],
    segments: readout.map((r, t) => {
      const others = r.filter((_, c) => c !== top);
      return {contribution: r.map(v => +v.toFixed(4)),
        contrast: +Math.max(0, r[top] - others.reduce((a, b) => a + b, 0) / others.length).toFixed(4),
        start: times[t][0], end: times[t][1]};
    }),
  };
}

export async function staticPredict(sourceId) {
  const {model, clips} = await loadStatic();
  const clip = clips[sourceId];
  if (!clip) throw Error('This clip is not part of the public demo set.');
  return describe(model, classify(model, encode(model, clip.X)), clip.times);
}

/** Fixed-context interventions on latent slots, mirroring model_api.ModelService.probe. */
export async function staticProbe(req) {
  const {model, clips} = await loadStatic();
  const clip = clips[req.sourceId];
  if (!clip) throw Error('This clip is not part of the public demo set.');
  const Z = encode(model, clip.X), before = describe(model, classify(model, Z), clip.times);
  const zz = Z.map(z => z.slice());
  let changed;
  if (req.op === 'replace') {
    const order = req.ranking === 'random'
      ? seededShuffle([...Array(model.k).keys()], req.seed || 0)
      : before.segments.map((s, t) => [s.contrast, t]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    changed = order.slice(0, req.k);
    changed.forEach(t => { zz[t] = model.train_mean_slots[t].slice(); });
  } else if (req.op === 'swap') {
    const donor = clips[req.donorId];
    if (!donor) throw Error('Donor clip not available in the public demo.');
    const Zd = encode(model, donor.X);
    changed = req.segments;
    changed.forEach(t => { zz[t] = Zd[t]; });
  } else throw Error("op must be 'replace' or 'swap'");
  return {before, after: describe(model, classify(model, zz), clip.times), changed};
}

function seededShuffle(a, seed) {
  let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
