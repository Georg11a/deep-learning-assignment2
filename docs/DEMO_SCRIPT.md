# HW1 demo — target 2:40–2:55

Record the running app, not a slide deck. Rehearse once; do not exceed three minutes. The script below is a draft you should understand and adapt. No video has yet been recorded.

## 0:00–0:20 — Purpose

“My project is Emotion Dynamics Lab, a web-based viewer for emotion-related speech data. For Homework 1, it focuses on exploring audio, transcripts, context and listener annotations. It does not yet run a deep learning model.”

Show the workspace and clip library.

## 0:20–0:55 — View and navigate real data

“This demonstration uses fifteen acted recordings from CREMA-D. I can search by transcript, filter by speaker, choose a clip, play it, and inspect its waveform. I can zoom and pan, seek through the recording, and inspect a short-window frequency spectrum.”

Play one clip, change zoom to 2×, pan, and return to 1×. Explain that the spectrum is an acoustic visualization—not an emotion prediction.

## 0:55–1:25 — Compare delivery and context

“Here I compare two deliveries of the same sentence by the same speaker. The words stay the same while the performance changes. I can hide the central transcript or switch the added scenario. These contexts are illustrative, not original conversation data.”

Choose an alternative delivery, play it, toggle the central transcript, then select a context. Explain that source labels remain optional and are intended acted emotions, not true inner feelings.

## 1:25–2:10 — Annotation

“I can mark a temporal region and annotate the emotion I perceive, its valence and arousal, my confidence, and the evidence I relied on. These are listener judgments. Saving preserves the current context and display conditions.”

Select an emotion, move VA sliders, select Voice/prosody, enter a brief listening note and save. Open Annotations and export JSON. Do not represent a demonstration rating as a genuine study result.

## 2:10–2:35 — Backend

“The application uses React and Vite, native browser audio, and Canvas signal visualizations. A local Python API stores annotations in SQLite. Browser storage also preserves a local copy. This version requires no GPU or paid model API.”

Show the connection indicator at a wide viewport or briefly open `http://127.0.0.1:8000/api/health`. The database file is `data/annotations.sqlite3`.

## 2:35–2:55 — Future work

“Later, I plan to add text-only and audio-aware model comparisons. One possible study asks whether contextual reasoning helps emotion understanding or causes a model to overlook vocal evidence. Mandarin tone and emotional prosody are another candidate direction. The current viewer provides the data-exploration and annotation foundation.”

## 录制前中文自查

能解释：数据哪里来、标签是什么意思、React 管什么、波形怎么画、SQLite 存什么、如何启动，以及目前哪些功能尚未实现。不要说已经有模型结果、已完成 human study，或已经证明 context bias。
