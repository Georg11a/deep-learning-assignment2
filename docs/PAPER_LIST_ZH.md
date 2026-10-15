# Emotion Dynamics Lab — Paper List

整理日期：2026-09-19。沿用你原 Google Doc 的阅读笔记风格：英文标题＋中文说明＋与你的研究的关系＋原文链接。此文件独立保存，没有修改你的 Google Doc。

范围：前面讨论中提到的核心论文与 agenda 延伸文献，并补充紧邻的相关工作。以下是选题筛查笔记，不是逐篇全文复现或系统综述；不能据此断言某个 gap 尚无人研究。会议、期刊与预印本分开写；未发表内容单独标注。★ 为最先读的六篇。

## 1. AI emotion / audio understanding

### ★ 1. Do Audio LLMs Really LISTEN, or Just Transcribe? Measuring Lexical vs. Acoustic Emotion Cues Reliance

EACL 2026 · [论文](https://aclanthology.org/2026.eacl-long.274/)

**中文笔记：** LISTEN 将词汇情绪与声学情绪线索分开，研究音频大模型究竟依赖哪种信息。它是“相同/中性文字＋不同情绪声音”想法的直接前例。

**研究关联：** 必须细看刺激构造、模态消融、模型输入和评价目标。我们不能把 lexical–acoustic conflict 本身当作新问题；可进一步检查合理语境、推理策略与声音证据的交互。

### ★ 2. Benchmarking Contextual and Paralinguistic Reasoning in Speech-LLMs: A Case Study with In-the-Wild Data

Findings of EMNLP 2025 · CP-Bench · [论文](https://aclanthology.org/2025.findings-emnlp.760/)

**中文笔记：** 将 contextual reasoning 与 paralinguistic understanding 放在实际语音场景中评估。不能把“音频＋上下文”描述成从未出现过的研究设置。

**研究关联：** 对照其任务是否区分当前表达、语境推断和交际意图，再判断我们的干预变量与标签是否真正不同。

### 3. MuSaG: A Multimodal German Sarcasm Dataset with Full-Modal Annotations

LREC 2026 · [论文](https://aclanthology.org/2026.lrec-1.25/)

**中文笔记：** 德语多模态讽刺数据，提供不同模态下的标注与模型比较。不同输入模态可能使听者和模型产生不同解释。

**研究关联：** 适合参考分模态标注设计；讽刺不等于某一种情绪，不能直接用 sarcasm label 替代 emotion label。

### 4. AudioBench: A Universal Benchmark for Audio Large Language Models

NAACL 2025 · [论文](https://aclanthology.org/2025.naacl-long.218/)

**中文笔记：** 面向多类音频理解任务的统一评测。

**研究关联：** 帮助选择音频模型和任务接口；通用音频能力高不自动代表能够利用细微情绪韵律。

### 5. Beyond Classification: Towards Speech Emotion Reasoning with Multitask AudioLLMs

IJCNLP 2025 · [论文](https://aclanthology.org/2025.ijcnlp-long.62/)

**中文笔记：** 从分类扩展到语音情绪推理与多任务学习。

**研究关联：** 比较解释输出与分类性能的关系；合理的解释文本本身不是模型正确使用声音的证据。

### 6. AEQ-Bench: Measuring Empathy of Omni-Modal Large Models

Findings of ACL 2026 · [论文](https://aclanthology.org/2026.findings-acl.1813/)

**中文笔记：** 将全模态模型的 empathy 放到评测框架中。

**研究关联：** 对应 agenda 的理解到互动，但 empathy response、emotion perception 与用户信任是不同构念。作为延伸，不作为 HW1 主任务。

## 2. Belief / appraisal / social cognition

### ★ 7. Beyond Linguistic Cues: Fine-grained Conversational Emotion Recognition via Belief-Desire Modelling

LREC-COLING 2024 · [论文](https://aclanthology.org/2024.lrec-main.207/)

**中文笔记：** 直接把 belief–desire modelling 引入对话情绪识别，证明这条联系并不牵强，但已经有明确先例。

**研究关联：** 这里是对事件的认知与愿望，不是观点空间的 belief embedding。重点读心理变量如何构造、是否提供额外信息、以及怎样与普通推理比较。

### ★ 8. Why Do Emotions Change? Appraisal-Guided Reasoning for Emotion–Cause Triplet Extraction in Conversations

ACL 2026 · ECFlow · [论文](https://aclanthology.org/2026.acl-long.539/)

**中文笔记：** 在**多模态**对话情绪—原因三元组抽取中使用 appraisal-guided 中间推理轨迹和图结构强化学习，关注情绪变化与事件一致性。

**研究关联：** 非常接近，不能说它只是文本工作。我们的候选问题需进一步区别“完成 emotion–cause extraction”与“冲突证据下如何权衡声音和情境预期”，并确认已有实验是否已覆盖后者。

### 9. Dimensional Modeling of Emotions in Text with Appraisal Theories: Corpus Creation, Annotation Reliability, and Prediction

Computational Linguistics 2023 · [论文](https://aclanthology.org/2023.cl-1.1/)

**中文笔记：** 用 appraisal theory 建立文本情绪维度、语料标注与预测任务。

**研究关联：** 理论入口：目标一致性、预期、责任、控制等事件评价维度。它们不同于 VA；不能把 appraisal reasoning 简化为先猜 valence/arousal。

## 3. Emotion dynamics / ambiguity / contextual bias

### 10. Handling Ambiguity in Emotion: From Out-of-Domain Detection to Distribution Estimation

ACL 2024 · [论文](https://aclanthology.org/2024.acl-long.114/)

**中文笔记：** 将情绪歧义与分布估计放到建模目标中，而不是始终强迫单标签判断。

**研究关联：** 参考如何区分 human disagreement、模型不确定性和分布外样例。模型生成的一串概率，不等于实测人类分歧分布。

### 11. EmoTrans: Emotional Transition-based Model for Emotion Recognition in Conversation

LREC-COLING 2024 · [论文](https://aclanthology.org/2024.lrec-main.508/)

**中文笔记：** 利用情绪转移结构改善对话情绪识别。

**研究关联：** 是“历史通常有用”的参照。可追问历史何时帮助、何时带来过度延续；不能预先把 transition modelling 判定为 bias。

### 12. An Iterative Emotion Interaction Network for Emotion Recognition in Conversations

COLING 2020 · [论文](https://aclanthology.org/2020.coling-main.360/)

**中文笔记：** 通过迭代交互建模对话中的情绪关联。

**研究关联：** 帮助理解传统 ERC 如何利用交互与上下文。不要只比较新 Audio LLM 而忽略已有结构化对话方法。

### 13. Multi-Task Learning for Emotion Recognition in Conversation with Emotion Shift

PACLIC 2023 · [论文](https://aclanthology.org/2023.paclic-1.26/)

**中文笔记：** 将 emotion shift 与 ERC 联系起来进行多任务学习。

**研究关联：** “情绪变化”不是尚未研究的现象。延迟跟随历史的假说需要与真实 shift detection 及正常情绪持续性区分。

### 14. A Training-Free Debiasing Framework with Counterfactual Reasoning for Conversational Emotion Detection

EMNLP 2023 · [论文](https://aclanthology.org/2023.emnlp-main.967/)

**中文笔记：** 使用反事实推理处理对话情绪检测中的偏差。

**研究关联：** 参考 contextual bias 的操作化与对照设计。任意替换历史可能生成不合理对话，不能把这种输入上的变化直接叫因果证据。

### 15. Pre-trained Speech Processing Models Contain Human-Like Biases that Propagate to Speech Emotion Recognition

Findings of EMNLP 2023 · [论文](https://aclanthology.org/2023.findings-emnlp.602/)

**中文笔记：** 研究预训练语音表征中的社会关联偏差及其对情绪识别的传递。

**研究关联：** 为 demographic/voice bias 提供依据，但不应与 contextual inertia 混为一件事。改变声音身份也可能改变韵律和自然度，需独立控制。

## 4. 中文 / lexical tone / emotional prosody

### ★ 16. Emotional tones of voice affect the acoustics and perception of Mandarin tones

2023 · [PubMed 记录](https://pubmed.ncbi.nlm.nih.gov/37018230/)

**中文笔记：** 研究情绪表达与普通话词汇声调的声学实现、感知之间的关系。

**研究关联：** 支持“语言信息与情绪信息共享声学线索”的动机；不是“中文音高变化都属于情绪”。需要全文确认具体 tone × emotion 条件和刺激控制。

### ★ 17. Encoding of lexical tone in self-supervised models of spoken language

NAACL 2024 · [论文](https://aclanthology.org/2024.naacl-long.239/)

**中文笔记：** 研究语音自监督模型对普通话、越南语词汇声调的编码，并与人类感知模式比较。

**研究关联：** 是表征分析路线的起点，不是 Audio LLM 已经能正确区分情绪与声调的证据。可以考虑把 tone probing 与情绪条件结合，但需先检查后续工作。

### 18. The perception of emotional prosody in Mandarin Chinese words and sentences

[期刊论文 / DOI](https://doi.org/10.1177/02676583241286748)

**中文笔记：** 普通话词语与句子层级的情绪韵律感知研究。在线出版与卷期年份可能不同，正式 BibTeX 以期刊页面为准。

**研究关联：** 帮助选择词/短句/整句作为刺激单位，避免把层级差异误认为模型能力差异。

### 19. MES-P: an Emotional Tonal Speech Dataset in Mandarin Chinese with Distal and Proximal Labels

arXiv 2018 · [预印本](https://arxiv.org/abs/1808.10095)

**中文笔记：** 普通话情绪声调语音资源，区分不同层面的情绪标签。

**研究关联：** 检查是否适合同文本、多情绪设计，以及标签指的是说话者意图还是听者感知。先核查音频可得性与使用条件再决定采用。

### 20. Seen and Unseen Emotional Style Transfer for Voice Conversion with a New Emotional Speech Dataset

ESD · arXiv 2020 · [预印本](https://arxiv.org/abs/2010.14794)

**中文笔记：** 情绪声音转换与情绪语音数据集工作。

**研究关联：** 潜在的配对表达数据入口。生成/转换语音可能引入合成痕迹，不能自动视作只改变 emotion 的干净干预。

### 21. EmotionTalk: An Interactive Chinese Multimodal Emotion Dataset With Rich Annotations

Findings of ACL 2026 · [论文](https://aclanthology.org/2026.findings-acl.440/)

**中文笔记：** 中文交互式多模态情绪数据与丰富标注。

**研究关联：** 比孤立短句更接近 emotion dynamics；需检查表演方式、上下文、说话者划分和标注定义，不能直接等同自然发生的真实内心。

### 22. “Actors Challenge”: Collecting Data to Study Prosodic Patterns and Their Mappings to Meanings Across Languages

GAMES 2024 · [论文](https://aclanthology.org/2024.games-1.1/)

**中文笔记：** 通过表演任务收集跨语言韵律及其意义映射材料。

**研究关联：** 最贴近你提到的“同样文字，不同情绪/意图朗读”的数据收集形式之一。关键不只是录音，而是目标意义、自然度与听者理解的验证。

## 5. Interesting NLP / sarcasm / cultural pragmatics

### 23. Towards Multimodal Sarcasm Detection (An Obviously Perfect Paper)

ACL 2019 · MUStARD · [论文](https://aclanthology.org/P19-1455/)

**中文笔记：** 多模态讽刺识别的经典资源与任务。

**研究关联：** 连接字面内容、语音与上下文。提醒我们 irony/sarcasm、情绪类别和交际意图并不是可以互换的标签。

### 24. A Multimodal Corpus for Emotion Recognition in Sarcasm

LREC 2022 · [论文](https://aclanthology.org/2022.lrec-1.756/)

**中文笔记：** 将情绪识别放在讽刺表达中考察的多模态语料。

**研究关联：** 适合研究表达与字面意义不一致，但先区分讽刺识别、表达情绪与推测内心三个任务。

## 6. Speech generation / singing / influence

### 25. Towards Controllable Speech Synthesis in the Era of Large Language Models: A Systematic Survey

EMNLP 2025 · [论文](https://aclanthology.org/2025.emnlp-main.40/)

**中文笔记：** 可控语音合成的综述入口。

**研究关联：** 如果后续要生成同文本不同 prosody 的材料，先看控制粒度、模型依赖、自然度与说话者保持。当前 HW1 不需要部署合成模型。

### 26. TCSinger: Zero-Shot Singing Voice Synthesis with Style Transfer and Multi-Level Style Control

EMNLP 2024 · [论文](https://aclanthology.org/2024.emnlp-main.117/)

**中文笔记：** 歌声合成、风格迁移和多层次风格控制。

**研究关联：** 回应你对“如何模仿歌曲并传递情绪”的兴趣。歌声的旋律约束不同于普通会话 prosody，不宜直接作为对话理解主实验。

### 27. TCSinger 2: Customizable Multilingual Zero-shot Singing Voice Synthesis

Findings of ACL 2025 · [论文及完整题名](https://aclanthology.org/2025.findings-acl.687/)

**中文笔记：** TCSinger 后续歌声生成工作。

**研究关联：** 作为生成侧扩展阅读；先确定研究的是生成可控性还是听者情绪理解，避免范围蔓延。

### 28. Prompt-Singer: Controllable Singing-Voice-Synthesis with Natural Language Prompt

NAACL 2024 · [论文及完整题名](https://aclanthology.org/2024.naacl-long.268/)

**中文笔记：** 与自然语言提示控制歌声生成相关的工作。

**研究关联：** 可帮助理解 text prompt 如何映射到声音风格，但生成器宣称的 emotion condition 必须经听者验证。

### 29. Aligning Paralinguistic Understanding and Generation in Speech LLMs via Multi-Task Reinforcement Learning

EACL Industry 2026 · [论文](https://aclanthology.org/2026.eacl-industry.49/)

**中文笔记：** 联系语音模型的副语言理解与生成。

**研究关联：** 适合“理解是否帮助表达”的未来方向；理解性能与生成可控性仍需分别衡量。

### 30. Voice and Choice: Investigating the Role of Prosodic Variation in Request Compliance and Perceived Politeness Using Conversational TTS

SIGDIAL 2024 · [论文](https://aclanthology.org/2024.sigdial-1.40/)

**中文笔记：** 用对话 TTS 研究韵律、礼貌感知与请求服从的关系。

**研究关联：** 直接连接你的 influence/persuasion agenda。若主张声音改变信任或行为，不能只测模型的 emotion classification；需要相应的人类行为证据与伦理审查。

## 7. Memory / belief embedding / broader agenda

以下属于之前讨论的 broader agenda，不是当前音频 HW1 必做项。

### 31. Know Me, Respond to Me: Benchmarking LLMs for Dynamic User Profiling and Personalized Responses at Scale

PERSONAMEM · [arXiv 版本](https://arxiv.org/abs/2504.14225)

**中文笔记：** 动态用户画像与个性化响应评测。

**研究关联：** 以后把 emotion 放进 memory 时，必须区别瞬时状态与稳定偏好，记录时间与证据，允许更新，而非一次听感即永久人格标签。

### 32. LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory

[arXiv 版本](https://arxiv.org/abs/2410.10813)

**中文笔记：** 长期交互记忆的评测框架。

**研究关联：** 支持未来研究跨轮更新、时间信息与遗忘；不意味着 HW1 应现在实现长期 agent memory。

### 33. CIMemories: A Compositional Benchmark For Contextual Integrity In LLMs

ICLR 2026 · [会议页面及完整题名](https://proceedings.iclr.cc/paper_files/paper/2026/hash/9a2bcfaf383638e166162a25b6dff125-Abstract-Conference.html)

**中文笔记：** 原 agenda 中与 contextual integrity / memory 相关的延伸项；建议进入记忆阶段再读全文。

**研究关联：** 用户状态推断不只关乎是否准确，还涉及在哪种情境下允许保留与使用。此处不把它作为音频推理有效性的证据。

### 34. Supersede: Diagnosing and Training the Memory-Update Gap in LLM Agents

arXiv 2026 · [预印本](https://arxiv.org/abs/2606.27472)

**中文笔记：** 关注 agent 的记忆更新差距。

**研究关联：** 可类比“新证据出现后是否更新旧判断”，但 memory updating 与单轮情绪推理不是同一个实验任务。

### 35. A Semantic Embedding Space Based on Large Language Models for Modelling Human Beliefs

Nature Human Behaviour · [期刊页面](https://www.nature.com/articles/s41562-025-02228-z)

**中文笔记：** 用语义 embedding 表示人的信念关系。

**研究关联：** 更接近你的 attitude/value/belief-space agenda。与 appraisal 中“知道什么、希望什么”存在联系，但不能因为都叫 belief 就视为同一对象。

### 36. The Geometry of Persuasion: Quantifying Belief Change in a Latent Embedding Space

**未按已发表论文处理。** 原 agenda 的研究/报告线索 · [SFI seminar 页面](https://www.santafe.edu/events/seminar-byunghwee-lee-2026)

**中文笔记：** 围绕潜在空间中的 belief change 与 persuasion 的研究线索；不能把 seminar 或 in-preparation title 当作已同行评审的论文引用。

**研究关联：** 长期可连接“声音表达如何影响理解与信念”，但这已进入 influence，而非当前 perception viewer。

### 37. Privacy as Contextual Integrity

Helen Nissenbaum, 2004 · [论文](https://digitalcommons.law.uw.edu/wlr/vol79/iss1/10/)

**中文笔记：** 从情境与信息流规范理解隐私。

**研究关联：** 以后保存声音、推断与用户状态时，不把“模型能推断”当作“允许长期记住和跨场景使用”。当前演示避免上传私人录音到外部服务。

## 8. 当前 HW1 数据来源

### 38. CREMA-D: Crowd-sourced Emotional Multimodal Actors Dataset

Cao et al., 2014 · [论文](https://doi.org/10.1109/TAFFC.2014.2336244) · [官方数据仓库](https://github.com/CheyneyComputerScience/CREMA-D)

**中文笔记：** 同一组句子由演员以不同情绪表达，是低成本搭建同文本比较 viewer 的合适起点。

**研究关联：** 这里仅使用15条原始音频作为工具演示。演员目标、可感知表达和真实内在感受必须分开；不能拿这个英语小子集声称完成中文四声或自然对话研究。

## 阅读时统一记这六项

1. **预测对象：** expressed emotion、internal state、intent、sarcasm，还是响应质量？
2. **证据条件：** audio、text、history、speaker metadata 分别提供了什么？
3. **控制：** 相同文本/说话者/音频是否真的保持？替换后语境自然吗？
4. **标签：** 演员意图、单一听者、多听者分布、模型标签，还是自报告？
5. **比较：** 是否区分推理策略、额外输入、预算、模型能力与合成伪影？
6. **与我们的区别：** 一个具体尚待验证的差异，而不是“中文版”“加入情绪”“加上 belief”这种宽泛描述。
