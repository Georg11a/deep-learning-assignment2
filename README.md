# Emotion Dynamics Lab

DS7400 Deep Learning — Homework 1. A React web-based audio data viewer for exploring how vocal delivery, words, and contextual information contribute to perceived emotion. This submission is a foundation for later deep learning work, not a trained emotion model or a validated benchmark.

**Public viewer:** https://georg11a.github.io/deep-learning-assignments/

The public GitHub Pages version is a static frontend: annotations persist in that browser and can be exported as JSON. SQLite is available only when the project is run locally with `server.py`; GitHub Pages cannot run the Python backend.

## Run locally

Requirements: a current Node.js LTS release compatible with Vite 7 (Node 20.19+ or 22.12+), npm, and Python 3.10+. No GPU, API key, paid service, or Python package installation is needed.

```bash
npm ci
npm run build
python3 server.py
```

Open http://127.0.0.1:8000. Keep the terminal running. Stop with Ctrl+C. The server serves the built React app and the SQLite API. If bundled WAV files are missing, run `python3 scripts/download_samples.py` with an internet connection before building.

For development, run `python3 server.py` in one terminal and `npm run dev` in another; open http://127.0.0.1:5173. Vite forwards `/api` requests to port 8000. After editing source files, production mode requires `npm run build` and a browser refresh. Do not open index.html directly with a file URL.

## What the application does

- Browse 15 real acted speech clips; search transcripts and filter speakers.
- Play/pause/seek audio; inspect a decoded waveform, zoom/pan, and view a short-window frequency spectrum at the playhead.
- Compare alternate deliveries of the same text by the same speaker.
- Hide/show the main transcript and reveal the dataset's intended-performance label separately.
- Switch illustrative contexts or write a custom situation without changing the recording.
- Annotate perceived emotion, valence (−1 unpleasant to +1 pleasant), arousal (0 calm to 1 activated), confidence, evidence sources, notes, and a temporal region.
- Save annotations in browser storage and, when connected, a real SQLite database. View saved browser annotations and export JSON.
- Import local audio for the current session and edit its transcript. Audio stays in the browser; annotation text is sent only to the local server when enabled. Imported files must be reselected after reloading.

The spectrum uses a 512-sample Hann-window DFT, displays the lower quarter of the decoded sample rate, and is intended for qualitative inspection. Its magnitude scale is not calibrated sound-pressure level. It is neither a pitch tracker nor an emotion detector. Browser decoding may resample audio; the displayed rate is the decoded rate.

## Data and interpretation

The bundled demonstration subset is from [CREMA-D](https://github.com/CheyneyComputerScience/CREMA-D), with speakers 1001/1002, sentences DFA/TIE, and intended anger/happiness/neutral/sadness performances. The upstream `1002_TIE_NEU_XX.wav` URL was unavailable, so this subset has 15 rather than 16 clips. It is deliberately small and unbalanced, not a training/evaluation split. See [DATA_ATTRIBUTION.md](DATA_ATTRIBUTION.md).

The two transcripts are “Don't forget a jacket.” and “That is exactly what happened.” Public UI identifiers such as sample-01 map to source files in `src/data.js`; the source paths still contain label codes. This is an exploration tool, **not a blinded human experiment**: the library still shows transcripts, and label order/source assets can expose information. The hide-transcript toggle only hides the central transcript.

Added contexts are invented interpretation exercises, not original dialogue. Their plausibility must be checked for each utterance before any study. Dataset labels describe intended acted expression; saved labels describe a listener's judgment. Neither establishes a speaker's true internal state. Default VA sliders are not predictions, and the app does not fabricate model outputs or human label distributions.

## Architecture and components

| File/component | Responsibility |
| --- | --- |
| `src/main.jsx` / App | Clip selection, playback coordination, context controls, annotation state, JSON export |
| `src/main.jsx` / Signal | Web Audio decoding, waveform canvas, zoom/pan, frequency display |
| `src/data.js` | Sample manifest, source-to-display ID mapping, labels, illustrative contexts |
| `src/style.css` | Responsive interface styles |
| `server.py` | Python standard-library HTTP API, validation, SQLite persistence, static serving |
| `scripts/download_samples.py` | Reproducible download of the small source subset |

React manages interface state; Vite builds the frontend; native HTML audio provides playback; Web Audio decodes signals; Canvas/SVG draw the waveform, spectrum and VA marker. Python's sqlite3 and http.server avoid extra backend dependencies. No cloud hosting or Docker is required for this local implementation.

### Storage and API

- `GET /api/health`: storage availability.
- `POST /api/annotations`: validate and store one JSON annotation; duplicate UUIDs are idempotent.
- `GET /api/annotations`: retrieve database records.
- SQLite file: `data/annotations.sqlite3` (git-ignored).
- Browser key: `edl-annotations-v1`. The annotation table/export shows this browser's records; it does not automatically synchronize other browsers' records from SQLite.

Each record preserves clip ID, transcript, context, main-transcript visibility, source-label visibility, comparison ID, categorical emotion, VA, confidence, evidence, region, notes and timestamp. Context changes do not automatically create a new record: review your rating and save again. Changing clips resets the unsaved draft. Export a backup before clearing browser data. Local imports themselves are not stored in SQLite. This server is a localhost coursework prototype, not a secure public deployment or participant-management service.

## HW1 requirement mapping

| Assignment component | Implementation |
| --- | --- |
| Functional web data viewer (80 points) | React audio library, playback, waveform, spectrum, navigation and filtering |
| Interactive annotation (+10) | Emotion/VA/confidence/notes and temporal region labels, JSON export |
| Backend/database foundation (+10) | Working local HTTP API with SQLite persistence |
| GitHub README | This document covers purpose, data, setup, frameworks, features and storage |
| ≤3-minute demo | Recording outline and narration in `docs/DEMO_SCRIPT.md`; video still needs to be recorded |

This maps implemented features to the rubric; it is not a guarantee of awarded points. HW1 deadline in the supplied PDF: September 21, 2026, 11:59 PM Eastern; late penalty 5 points/day. Submit a GitHub repository and the short demo as directed by the course. The website is the deliverable application; a prose document alone is not sufficient.

## Semester direction (provisional)

The broad goal is to investigate evidence use in speech emotion understanding. Possible later additions include text-only and audio-aware baselines, model-output comparison, a controlled 20–30-item exploratory pilot, and Mandarin examples. One candidate asks whether structured appraisal reasoning helps models integrate context or overweights what a speaker is expected to feel. Another concerns lexical tone versus emotional prosody in Mandarin. These are alternatives to evaluate after reading—not established novel contributions and not required HW1 functionality.

See [the research brief](docs/RESEARCH_BRIEF_ZH.md), [paper list](docs/PAPER_LIST_ZH.md), and [demo script](docs/DEMO_SCRIPT.md). AI assistance was used to scaffold the code and documentation. Before submitting, personally run the app and be able to explain the components, data provenance, annotation meaning, storage path and planned model integration.

## Before submission

- Run the app from these instructions and listen to both alternative deliveries.
- Save a rating, refresh, open Annotations and export a backup.
- Confirm the SQLite connection and retrieval endpoint.
- Record a demo of no more than three minutes, using the script as a guide.
- Create/push the project to your chosen GitHub repository; do not commit node_modules, dist, personal audio, database files or private annotations.
- Keep source-data attribution and license links with any redistributed samples.
- Add the actual repository/video links wherever the course requires them. This project has not been uploaded or submitted on your behalf.
