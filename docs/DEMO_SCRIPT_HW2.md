# HW2 demo video — target 2:45 (hard limit 3:00)

Record the running app (`python3 server.py`, http://127.0.0.1:8000). The assignment asks the video to show
(1) which model and why, (2) how well or poorly it performs and why, (3) the new features the model enables,
and (4) the optional challenges. Narration below is a draft — say it in your own words.

**Before recording（录制前）:** start the server; open the Workspace on clip 01 (speaker 1001, anger);
keep the Model & training tab at default settings; set epochs to 30 so a live run finishes in ~15 s.

## 0:00–0:30 — The model and why（模型与理由）

"In HW1 Emotion Dynamics Lab was a viewer for emotional speech. In HW2 it learns: a small neural network predicts
the intended emotion of an utterance. I cut each recording into eight time segments and describe each one with
MFCCs plus pitch and energy features — I add pitch explicitly because MFCCs barely encode it. A shared MLP with
one hidden layer encodes every segment into a latent slot, and a linear layer reads all eight slots to predict
six emotions. I chose it because it is small enough to explain and to train live in the app, and the segment
slots let me ask *where* the evidence comes from."

Show: Workspace → panel 06.

## 0:30–1:10 — How well it performs（效果如何、为什么）

"I split CREMA-D by speaker, so the test set is 18 actors the model never heard. It reaches 54.8% accuracy on six
classes, above logistic regression on the same features at 52.6% and far above chance at 17%. Training loss keeps
falling while validation loss flattens, so I use dropout, weight decay and keep the best-validation epoch.
Anger and sadness are easiest; fear and happiness are often confused with each other and with sadness."

Show: Model & training tab → saved curves, scoreboard, confusion matrix (point at Fea/Hap rows).

## 1:10–1:50 — New features in the app（模型带来的新功能）

"Back in the workspace, the model's probabilities appear next to the dataset label and my own annotation. The
evidence strip shows which time segments push the answer; clicking one jumps the audio there. In the evidence
probe I swap the strongest segments with the neutral delivery of the same sentence — and the prediction moves
away from anger. Imported audio files go through the same model."

Show: reveal label → strip → click a dark segment → Evidence probe → choose the neutral delivery → Swap.

## 1:50–2:25 — Optional challenges: interactive training + monitor（加分项）

"Here I can change the learning rate, epochs, hidden units, number of layers, activation, dropout and even the
input features. When I start training, the server streams training and validation loss and accuracy every epoch.
When it finishes I see train, validation and test accuracy, the benchmark comparison and the confusion matrix, and
I can make this run the model the app uses."

Show: change activation to gelu, layers to 2 → Start → curves grow live → results → "Use this run" → back to Workspace.

## 2:25–2:50 — Pilot: does it listen to the right evidence?（Pilot 发现）

"Finally a pilot inspired by a 2026 paper on latent reasoning in vision-language models. Using the same sentence
spoken with different emotions as natural counterfactuals: when only the words change, the prediction still flips
almost half the time; and noise or volume changes move the model more than removing pitch. But the segments the
model reads really are load-bearing — swapping just one of them transfers the other emotion three times more than a
random one. So the model learns emotion, but it is also listening to things it shouldn't."

Show: Pilot study panel, pointing at the three tables.
