// HW2 model panels: prediction, evidence probe, interactive training + live monitor, pilot results.
// All model work happens in the local Python server (server.py -> model_api.py).
import React, {useState, useEffect, useRef} from 'react';

const SERIES = {train: '#3987e5', val: '#d95926'};   // validated dark-surface categorical pair
const SEQ = '#3987e5';                                 // single-hue sequential (bars, heat)
const pct = v => `${(100 * v).toFixed(1)}%`;

async function api(path, options) {
  const r = await fetch(path, options);
  const body = await r.json().catch(() => ({error: `HTTP ${r.status}`}));
  if (!r.ok) throw Error(body.error || `HTTP ${r.status}`);
  return body;
}
const post = (path, data) => api(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});

export function useModelInfo() {
  const [info, setInfo] = useState(null), [error, setError] = useState('');
  const refresh = () => api('/api/model/info').then(x => {setInfo(x); setError('')}).catch(e => setError(e.message));
  useEffect(() => {refresh()}, []);
  return {info, error, refresh};
}

async function predictClip(clip) {
  if (clip.source === 'CREMA-D') return post('/api/predict', {sourceId: clip.sourceId});
  const blob = await (await fetch(clip.url)).blob();          // imported local file: upload the bytes
  return api('/api/predict', {method: 'POST', headers: {'Content-Type': blob.type || 'audio/wav'}, body: blob});
}

// ------------------------------------------------------------------ small chart pieces
function ProbBars({result, compare, highlight}) {
  return <div className="probs">{result.classes.map((c, i) => {
    const p = result.probs[i], q = compare?.probs[i];
    return <div className="prob-row" key={c} title={`${c}: ${pct(p)}${q != null ? ` (before ${pct(q)})` : ''}`}>
      <span className={c === result.top ? 'prob-label top' : 'prob-label'}>{c}{c === highlight && <em> · label</em>}</span>
      <span className="prob-track">
        {q != null && <span className="prob-ghost" style={{width: `${100 * q}%`}}/>}
        <span className="prob-fill" style={{width: `${100 * p}%`, background: SEQ}}/>
      </span>
      <span className="prob-value">{pct(p)}</span>
    </div>})}
  </div>;
}

function SegmentStrip({result, duration, onSeek, marked = []}) {
  const max = Math.max(...result.segments.map(s => s.contrast), 1e-6);
  const total = duration || result.segments.at(-1)?.end || 1;
  return <div className="seg-strip" aria-label="Evidence credit per segment">
    <div className="seg-track">{result.segments.map((s, t) => <button key={t}
      className={`seg ${marked.includes(t) ? 'marked' : ''}`}
      style={{left: `${100 * s.start / total}%`, width: `${100 * (s.end - s.start) / total}%`,
        background: `rgba(57,135,229,${0.12 + 0.88 * s.contrast / max})`}}
      title={`Segment ${t + 1} · ${s.start.toFixed(2)}–${s.end.toFixed(2)} s · evidence credit ${s.contrast.toFixed(2)}`}
      onClick={() => onSeek?.(s.start)}>{t + 1}</button>)}</div>
    <div className="axis"><span>0.00 s</span><span>Evidence credit for “{result.top}” · darker = segment reads more for this answer</span><span>{total.toFixed(2)} s</span></div>
  </div>;
}

function LineChart({history, keys, title, yLabel, format = v => v.toFixed(2), baseline}) {
  const [hover, setHover] = useState(null);
  const W = 460, H = 200, L = 44, R = 12, T = 12, B = 28;
  if (!history.length) return <div className="chart-empty">{title}: waiting for the first epoch…</div>;
  const vals = history.flatMap(h => keys.map(k => h[k])).concat(baseline != null ? [baseline] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.08 || 0.05; lo -= pad; hi += pad;
  const n = Math.max(history.length, 2), x = i => L + (W - L - R) * i / (n - 1), y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const ticks = [lo + pad, (lo + hi) / 2, hi - pad];
  return <figure className="chart">
    <figcaption>{title}</figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} over ${history.length} epochs`}
      onMouseLeave={() => setHover(null)}
      onMouseMove={e => {const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; setHover(Math.max(0, Math.min(history.length - 1, Math.round((px - L) / (W - L - R) * (n - 1)))))}}>
      {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid"/><text x={L - 6} y={y(t) + 4} textAnchor="end" className="tick">{format(t)}</text></g>)}
      <text x={L} y={H - 6} className="tick">epoch 1</text><text x={W - R} y={H - 6} textAnchor="end" className="tick">epoch {history.length}</text>
      {baseline != null && <g><line x1={L} x2={W - R} y1={y(baseline)} y2={y(baseline)} className="baseline"/><text x={L + 6} y={y(baseline) - 5} className="tick">logistic regression (val)</text></g>}
      {keys.map(k => <polyline key={k} fill="none" stroke={SERIES[k.split('_')[0]]} strokeWidth="2" strokeLinejoin="round"
        points={history.map((h, i) => `${x(i)},${y(h[k])}`).join(' ')}/>)}
      {hover != null && <g><line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="crosshair"/>
        {keys.map(k => <circle key={k} cx={x(hover)} cy={y(history[hover][k])} r="4" fill={SERIES[k.split('_')[0]]} stroke="#17232b" strokeWidth="2"/>)}</g>}
    </svg>
    <div className="legend">{keys.map(k => <span key={k}><i style={{background: SERIES[k.split('_')[0]]}}/>{k.startsWith('train') ? 'Training' : 'Validation'}</span>)}
      {hover != null && <span className="readout">epoch {history[hover].epoch}: {keys.map(k => `${k.startsWith('train') ? 'train' : 'val'} ${format(history[hover][k])}`).join(' · ')}</span>}
    </div>
  </figure>;
}

function Confusion({matrix, classes}) {
  const names = classes.map(c => ({ANG: 'Ang', DIS: 'Dis', FEA: 'Fea', HAP: 'Hap', NEU: 'Neu', SAD: 'Sad'}[c] || c));
  return <figure className="confusion"><figcaption>Test confusion matrix <small>rows = true label, share of row</small></figcaption>
    <table><thead><tr><th/>{names.map(n => <th key={n}>{n}</th>)}</tr></thead><tbody>{matrix.map((row, i) => {
      const s = row.reduce((a, b) => a + b, 0) || 1;
      return <tr key={i}><th>{names[i]}</th>{row.map((v, j) => <td key={j} title={`true ${names[i]} → predicted ${names[j]}: ${v} clips (${pct(v / s)})`}
        style={{background: `rgba(57,135,229,${v / s})`, color: v / s > 0.45 ? '#fff' : '#c7d4da'}}>{Math.round(100 * v / s)}</td>)}</tr>})}</tbody></table>
  </figure>;
}

function Scoreboard({res}) {
  const b = res.baselines;
  const rows = [['SegmentMLP (this model)', res.test.acc, true], ['Logistic regression · 8 segments', b.logreg_concat.test_acc],
    ['Logistic regression · utterance mean', b.logreg_mean.test_acc], ['Chance (6 classes)', b.chance]];
  return <div className="scoreboard"><div className="hero"><strong>{pct(res.test.acc)}</strong><span>test accuracy · unseen speakers</span></div>
    {rows.map(([name, v, me]) => <div className="score-row" key={name} title={`${name}: ${pct(v)}`}>
      <span>{name}</span><span className="prob-track"><span className="prob-fill" style={{width: `${100 * v}%`, background: me ? SEQ : '#4c5d66'}}/></span><span className="prob-value">{pct(v)}</span></div>)}
    <p className="muted small">Train {pct(res.train.acc)} · validation {pct(res.val.acc)} · test macro-F1 {res.test.macro_f1.toFixed(3)} · best epoch {res.best_epoch}</p>
  </div>;
}

// ------------------------------------------------------------------ prediction + evidence probe (workspace)
export function PredictPanel({clip, duration, onSeek, reveal, perceived, peers, modelInfo}) {
  const [result, setResult] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const run = () => {setBusy(true); setError(''); predictClip(clip).then(setResult).catch(e => setError(e.message)).finally(() => setBusy(false))};
  useEffect(() => {setResult(null); setError(''); if (modelInfo?.available) run()}, [clip.id, modelInfo?.active]);
  return <article className="panel model-panel">
    <div className="section-label">06 / MODEL PREDICTION <span>SegmentMLP · {modelInfo?.active === 'default' ? 'default model' : `run ${modelInfo?.active || '—'}`}</span></div>
    {!result && !error && <p className="muted">{busy ? 'Running the model…' : 'Start the local server to get predictions.'}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {result && <>
      <div className="verdicts">
        <div><small>Model</small><strong>{result.top}</strong></div>
        <div><small>Intended (dataset)</small><strong>{clip.source === 'CREMA-D' ? (reveal ? clip.intended : 'hidden') : 'n/a'}</strong></div>
        <div><small>Your annotation</small><strong>{perceived || '—'}</strong></div>
      </div>
      <ProbBars result={result} highlight={reveal ? clip.intended : null}/>
      <SegmentStrip result={result} duration={duration} onSeek={onSeek}/>
      <p className="caution">The model predicts the <em>intended acted</em> category from 8 time segments of acoustic features. It is not a measure of the speaker's inner state.</p>
      {clip.source === 'CREMA-D' && <EvidenceProbe clip={clip} base={result} peers={peers} reveal={reveal}/>}
    </>}
    <button onClick={run} disabled={busy}>{busy ? 'Predicting…' : '↻ Predict again'}</button>
  </article>;
}

function EvidenceProbe({clip, base, peers, reveal}) {
  const order = base.segments.map((s, t) => [s.contrast, t]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const [k, setK] = useState(2), [ranking, setRanking] = useState('contrast'), [donor, setDonor] = useState(''),
    [segs, setSegs] = useState(order.slice(0, 2)), [out, setOut] = useState(null), [error, setError] = useState('');
  useEffect(() => {setOut(null); setDonor(''); setSegs(order.slice(0, 2))}, [clip.id]);
  const go = req => post('/api/probe', {sourceId: clip.sourceId, ...req}).then(r => {setOut({...r, req}); setError('')}).catch(e => setError(e.message));
  return <details className="probe"><summary>Evidence probe · which segments does the answer depend on?</summary>
    <div className="probe-row"><strong>Replace</strong> the top
      <input type="number" min="0" max="8" value={k} onChange={e => setK(+e.target.value)}/> segments ranked by
      <select value={ranking} onChange={e => setRanking(e.target.value)}><option value="contrast">evidence credit</option><option value="random">random order</option></select>
      with the training-average segment <button onClick={() => go({op: 'replace', k, ranking})}>Run</button></div>
    <div className="probe-row"><strong>Swap</strong> segments
      <span className="seg-picks">{[...Array(8)].map((_, t) => <label key={t}><input type="checkbox" checked={segs.includes(t)} onChange={e => setSegs(v => e.target.checked ? [...v, t] : v.filter(x => x !== t))}/>{t + 1}</label>)}</span>
      from <select value={donor} onChange={e => setDonor(e.target.value)}><option value="">another delivery…</option>{peers.filter(p => p.source === 'CREMA-D').map((p, i) => <option key={p.id} value={p.sourceId}>{reveal ? p.intended : `Alternative ${i + 1}`}</option>)}</select>
      <button disabled={!donor || !segs.length} onClick={() => go({op: 'swap', donorId: donor, segments: segs})}>Swap</button></div>
    {error && <p className="error">{error}</p>}
    {out && <div className="probe-out"><p><strong>{out.before.top}</strong> → <strong>{out.after.top}</strong> after changing segment{out.changed.length === 1 ? '' : 's'} {out.changed.map(t => t + 1).join(', ') || 'none'}. Grey bars show the original probabilities.</p>
      <ProbBars result={out.after} compare={out.before}/></div>}
    <p className="caution">Fixed-context intervention adapted from ReaLVR (Xiao et al., 2026): other segments stay unchanged, so a large change means the answer depends on the edited segments.</p>
  </details>;
}

// ------------------------------------------------------------------ Model tab: training + monitor + pilot
const LRS = [0.001, 0.003, 0.01, 0.02, 0.05, 0.1, 0.3];

export function ModelTab({info, refresh}) {
  const [cfg, setCfg] = useState({lr: 0.02, epochs: 40, hidden: 128, layers: 1, activation: 'relu', dropout: 0.5, feature_set: 'all'});
  const [job, setJob] = useState(null), [history, setHistory] = useState([]), [error, setError] = useState(''), [msg, setMsg] = useState('');
  const timer = useRef(), since = useRef(0);
  const set = (key, value) => setCfg(c => ({...c, [key]: value}));
  useEffect(() => () => clearTimeout(timer.current), []);
  function poll() {
    api(`/api/train/status?since=${since.current}`).then(s => {
      since.current += s.history.length;
      setHistory(h => [...h, ...s.history]); setJob(s);
      if (s.state === 'running') timer.current = setTimeout(poll, 600);
      if (s.state === 'error') setError(s.error);
    }).catch(e => setError(e.message));
  }
  function start() {
    setError(''); setMsg(''); setHistory([]); since.current = 0;
    post('/api/train', cfg).then(() => poll()).catch(e => setError(e.message));
  }
  const running = job?.state === 'running', res = job?.results;
  const current = info?.available ? info : null;
  const shownHistory = job ? history : (current?.history || []);
  const baseline = (res || current)?.baselines?.logreg_concat?.val_acc;
  return <main className="model-view">
    <section className="panel train-controls">
      <div className="section-label">TRAIN A MODEL <span>runs on the local server</span></div>
      <label>Learning rate<select value={cfg.lr} onChange={e => set('lr', +e.target.value)}>{LRS.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
      <label>Epochs <output>{cfg.epochs}</output><input type="range" min="5" max="120" step="5" value={cfg.epochs} onChange={e => set('epochs', +e.target.value)}/></label>
      <label>Hidden units <output>{cfg.hidden}</output><input type="range" min="16" max="512" step="16" value={cfg.hidden} onChange={e => set('hidden', +e.target.value)}/></label>
      <label>Hidden layers <output>{cfg.layers}</output><input type="range" min="1" max="4" value={cfg.layers} onChange={e => set('layers', +e.target.value)}/></label>
      <label>Activation<select value={cfg.activation} onChange={e => set('activation', e.target.value)}>{['relu', 'gelu', 'tanh', 'sigmoid'].map(a => <option key={a}>{a}</option>)}</select></label>
      <label>Dropout <output>{cfg.dropout.toFixed(1)}</output><input type="range" min="0" max="0.8" step="0.1" value={cfg.dropout} onChange={e => set('dropout', +e.target.value)}/></label>
      <label>Input features<select value={cfg.feature_set} onChange={e => set('feature_set', e.target.value)}><option value="all">MFCC + prosody (pitch, energy)</option><option value="mfcc">MFCC only (ablation)</option></select></label>
      <div className="row-buttons"><button className="primary" disabled={running} onClick={start}>{running ? 'Training…' : '▶ Start training'}</button>
        {running && <button onClick={() => post('/api/train/stop', {}).catch(e => setError(e.message))}>■ Stop</button>}</div>
      {job && <p className="muted small">Run {job.id} · {job.state} · epoch {job.epochs_done}/{job.config.epochs || '—'} · {job.elapsed}s</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {res && <div className="row-buttons"><button onClick={() => post('/api/model/use', {model: 'latest'}).then(() => {setMsg('Predictions now use this run.'); refresh()}).catch(e => setError(e.message))}>Use this run for predictions</button>
        <button className="text-button" onClick={() => post('/api/model/use', {model: 'default'}).then(() => {setMsg('Back to the default model.'); refresh()})}>Revert to default</button></div>}
      {msg && <p className="save-status">{msg}</p>}
      <p className="caution">SGD with momentum, cross-entropy loss, cosine learning-rate schedule. Speakers are split into train / validation / test; the checkpoint with the best validation accuracy is kept and evaluated once on the test speakers.</p>
    </section>
    <section className="panel monitor">
      <div className="section-label">TRAINING MONITOR <span>{job ? (running ? 'live' : job.state) : 'default model · saved history'}</span></div>
      <div className="charts">
        <LineChart history={shownHistory} keys={['train_loss', 'val_loss']} title="Cross-entropy loss"/>
        <LineChart history={shownHistory} keys={['train_acc', 'val_acc']} title="Accuracy" format={v => `${Math.round(100 * v)}%`} baseline={baseline}/>
      </div>
      {(res || (!job && current)) && <div className="results-grid">
        <Scoreboard res={res || current}/>
        <Confusion matrix={(res || current).test.confusion} classes={(res || current).classes}/>
      </div>}
      {running && <p className="muted">Test-set results appear when training finishes.</p>}
    </section>
    <PilotResults/>
  </main>;
}

function PilotResults() {
  const [r, setR] = useState(null), [error, setError] = useState('');
  useEffect(() => {api('/api/probe/summary').then(setR).catch(e => setError(e.message))}, []);
  if (error) return <section className="panel pilot"><div className="section-label">PILOT STUDY</div><p className="muted">{error}</p></section>;
  if (!r) return null;
  const models = Object.keys(r.paired), label = {all: 'MFCC + prosody', mfcc_only: 'MFCC only'};
  const perts = [['noise_20dB', 'Add noise (20 dB SNR)', 'nuisance'], ['gain_minus6dB', 'Lower volume (−6 dB)', 'nuisance'],
    ['neutralise_f0', 'Remove pitch features', 'evidence'], ['neutralise_energy', 'Remove energy features', 'evidence'],
    ['flatten_f0_contour', 'Flatten pitch contour', 'evidence'], ['flatten_energy_contour', 'Flatten energy contour', 'evidence']];
  const ex = r.exchange.all;
  return <section className="panel pilot">
    <div className="section-label">PILOT STUDY · DOES THE MODEL USE THE RIGHT EVIDENCE? <span>held-out test speakers · adapted from ReaLVR (arXiv:2609.34563)</span></div>
    <div className="pilot-grid">
      <div><h3>1 · Paired counterfactuals</h3>
        <p className="muted small">C pairs: same speaker and sentence, different emotion (answer should change). U pairs: same speaker and emotion, different sentence (answer should not change).</p>
        <table className="data"><thead><tr><th>Measure</th>{models.map(m => <th key={m}>{label[m] || m}</th>)}</tr></thead><tbody>
          {[['strict_correct_flip_C', 'Strict correct flip on C ↑'], ['prediction_change_C', 'Prediction change on C'], ['false_flip_U', 'False flip on U ↓'],
            ['latent_distance_C', 'Latent distance, C pairs'], ['latent_distance_U', 'Latent distance, U pairs']].map(([k, name]) =>
            <tr key={k}><td>{name}</td>{models.map(m => <td key={m}>{k.startsWith('latent') ? r.paired[m][k].toFixed(3) : pct(r.paired[m][k])}</td>)}</tr>)}
        </tbody></table>
        <p className="small">Caution: these flip rates equal what a 55%-accurate model with independent errors would give (shuffle control: 48.8% / 30.7%). Latent slots, however, encode speaker and sentence about as well as emotion.</p></div>
      <div><h3>2 · Perturbations</h3>
        <p className="muted small">Share of test predictions that change. Nuisance edits should not matter; evidence edits remove prosodic cues.</p>
        <table className="data"><thead><tr><th>Edit</th><th>Type</th>{models.map(m => <th key={m}>{label[m] || m}</th>)}</tr></thead><tbody>
          {perts.map(([k, name, type]) => <tr key={k}><td>{name}</td><td>{type}</td>{models.map(m => <td key={m}>{pct(r.perturbation[m][k].prediction_change)}</td>)}</tr>)}
        </tbody></table>
        <p className="small">Recording level and noise move the model more than removing pitch evidence. The MFCC-only model is blind to every pitch edit.</p></div>
      <div><h3>3 · Segment exchange</h3>
        <p className="muted small">Copy k segments from the other delivery of the same sentence into this clip. Lift = change in how often the model outputs the donor's emotion.</p>
        <table className="data"><thead><tr><th>Segments</th><th>By evidence credit</th><th>Random</th></tr></thead><tbody>
          {[1, 2, 4].map(k => <tr key={k}><td>k = {k}</td><td>+{ex[`contrast_k${k}`].donor_answer_lift_pp.toFixed(1)} pp</td><td>+{ex[`random_k${k}`].donor_answer_lift_pp.toFixed(1)} pp</td></tr>)}
          <tr><td>all 8</td><td colSpan="2">+{ex.full_span_k8.donor_answer_lift_pp.toFixed(1)} pp (unrelated donor: {ex.unrelated_donor_k8.donor_answer_lift_pp >= 0 ? '+' : ''}{ex.unrelated_donor_k8.donor_answer_lift_pp.toFixed(1)} pp)</td></tr>
        </tbody></table>
        <p className="small">The segments the answer reads most are load-bearing: swapping them transfers the other emotion 2–3× more than swapping random segments.</p></div>
    </div>
  </section>;
}
