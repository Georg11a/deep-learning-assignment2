# Data provenance and licensing

Bundled audio is a small unchanged subset of **CREMA-D: Crowd-sourced Emotional Multimodal Actors Dataset** by Houwei Cao, David G. Cooper, Michael K. Keutmann, Ruben C. Gur, Ani Nenkova, and Ragini Verma (2014). [Paper](https://doi.org/10.1109/TAFFC.2014.2336244) · [Official repository](https://github.com/CheyneyComputerScience/CREMA-D).

The source database is made available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Individual database contents are licensed under the [Database Contents License 1.0](https://opendatacommons.org/licenses/dbcl/1-0/). This notice does not relicense the recordings. Preserve attribution and applicable license obligations when redistributing the subset or a derivative database. The selection manifest is in `src/data.js`; the reproducible source-download script is `scripts/download_samples.py`.

Selected speakers: 1001, 1002. Sentence codes: DFA, TIE. Emotion codes: ANG, HAP, NEU, SAD. Intensity suffix: XX. `1002_TIE_NEU_XX.wav` is excluded because the source URL returned 404 during preparation. No acoustic transformations were applied to the stored files. Browser playback/decoding may resample them.

Do not infer protected characteristics, personality, or true mental states from these examples. They are acted utterances, not natural conversations. The user interface's added scenarios are authored demonstrations and are not CREMA-D metadata.
