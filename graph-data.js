// ═══════════════════════════════════════════════════════════════
// AI Terminology Universe — Q4 2026 Update (v2.1)
// Data file for ai-knowledge-graph.html
// ═══════════════════════════════════════════════════════════════

const GRAPH_META = {
  version: '2.1',
  snapshot: 'Q4 2026',
  lastUpdated: '2026-10-16',
  prevSnapshot: 'Q1 2026'
};

// ═══════════════════════════════════════════════════════════════
// COLOUR SYSTEM
// ═══════════════════════════════════════════════════════════════
const CL = {
  critical:  { label:'Critical / Hype',      hex:'#FF5555', cx:.22, cy:.18 },
  agentic:   { label:'Agentic Systems',      hex:'#FF9040', cx:.68, cy:.22 },
  models:    { label:'Models',               hex:'#FFB060', cx:.80, cy:.38 },
  technical: { label:'Technical',            hex:'#D0D040', cx:.82, cy:.58 },
  safety:    { label:'Safety',               hex:'#FF6090', cx:.62, cy:.68 },
  human:     { label:'Human Skills',         hex:'#40D080', cx:.42, cy:.82 },
  evolved:   { label:'Evolved',              hex:'#5090FF', cx:.14, cy:.52 },
  core:      { label:'Core',                hex:'#C070FF', cx:.38, cy:.44 },
  tools:     { label:'Tools & Platforms',    hex:'#70C8F8', cx:.60, cy:.42 },
  companies: { label:'Companies',            hex:'#9090A8', cx:.50, cy:.18 },
  // ── Q1 2026 new clusters ──
  work:      { label:'Work & Output',        hex:'#E8A838', cx:.50, cy:.60 },
  autonomy:  { label:'Autonomy Spectrum',    hex:'#58B8E8', cx:.55, cy:.50 },
  lifecycle: { label:'Product Lifecycle',    hex:'#B888D8', cx:.35, cy:.25 },
  business:  { label:'Business Reality',     hex:'#48C888', cx:.18, cy:.38 },
  // ── April 2026 new clusters ──
  security:  { label:'AI Security',         hex:'#E05050', cx:.75, cy:.78 },
  context:   { label:'Context Health',       hex:'#A0D060', cx:.30, cy:.42 },
  landscape: { label:'Model Landscape',      hex:'#D0A050', cx:.85, cy:.18 },
};

// ═══════════════════════════════════════════════════════════════
// DATA
//
// Node properties:
//   id, label, clusters[], sz, def, rels[]
//   Optional: refs[], evolved, fullName, evo
//   Q1 2026 additions:
//     synonymOf  — id of the primary term (creates synonym edge)
//     complements — id of the complementary term (creates complement edge)
//     nodeType   — 'product' for product/brand nodes (default: 'concept')
// ═══════════════════════════════════════════════════════════════

const NODES = [

// ── CORE ────────────────────────────────────────────────────────

{id:'model-concept',label:'Model',clusters:['core'],sz:19,
 def:'The underlying AI system that has been trained on large amounts of data and learned to generate text, code, images, or other outputs. The model is the intelligence at the centre of an AI product — but it is rarely what users interact with directly. Products wrap models in interfaces, harnesses, and system prompts.',
 rels:['system-prompt','inference','context-window','multimodal','claude','gpt54','gemini','llama','deepseek','grok','mistral','training','prompt','harness','agentic-harness','fine-tuning','wrapper','parameters','frontier-model','proprietary-model','transformer','scaling-laws'],refs:[]},

{id:'system-prompt',label:'System Prompt',clusters:['core'],sz:19,
 def:'A hidden set of instructions that shapes how an AI model behaves before the user types anything — defining its persona, constraints, tone, and purpose. Users typically cannot see a system prompt; it operates in the background, establishing the rules of the interaction.',
 rels:['context-window','model-concept','guardrails','prompt','context-engineering','harness','undercover-mode'],
 refs:[]},

{id:'context-window',label:'Context Window',clusters:['core','technical'],sz:20,
 def:'The maximum amount of text — measured in tokens — that an AI model can "see" and reason about at once. Everything outside the context window is invisible to the model during that interaction. Context windows have grown dramatically (from thousands to millions of tokens), but they remain finite — which is why context entropy, memory consolidation, and context engineering exist as disciplines.',
 rels:['memory','system-prompt','model-concept','context-engineering','context-entropy','token','context-rot','attention-budget','kv-cache','transformer'],refs:[]},

{id:'harness',label:'Harness',clusters:['core','safety'],sz:22,
 def:'The software layer that wraps an AI model and makes it production-capable — governing how it accesses tools, manages files, executes commands, and respects safety boundaries. The model provides intelligence; the harness provides behaviour.<sup><a href="#fn1">¹</a></sup> See also: Agentic Harness.',
 rels:['agent','orchestrator','guardrails','human-in-the-loop','context-engineering','mcp','claude-code','pilot-purgatory','agentic-harness'],
 refs:[{n:1,src:'Aakash Gupta, Medium 2026',q:'agent harness AI 2026'}]},

{id:'prompt',label:'Prompt',clusters:['core'],sz:19,
 def:'The input a human provides to an AI model — the words, instructions, context, and questions that initiate a response. The prompt is the primary interface between human intent and model behaviour. A prompt can be a single sentence or a thousand words of structured context; it can be written once or engineered carefully over many iterations.',
 rels:['system-prompt','context-engineering','token','model-concept','delegation'],refs:[]},

// ── AGENTIC SYSTEMS ─────────────────────────────────────────────

{id:'agent',label:'Agent',clusters:['agentic'],sz:30,
 def:'An AI model that can take actions, check results, and decide what to do next — on its own, in a loop, until the task is done. Unlike a chatbot that responds once and waits, an agent keeps going.',
 rels:['tool-use','loop','orchestrator','memory','guardrails','human-in-the-loop','harness','openclaw','devin','manus','claude-code','autonomous-agent','task','planner-worker'],
 refs:[]},

{id:'loop',label:'The Loop',clusters:['agentic','safety'],sz:22,
 def:'The cycle at the heart of agentic behaviour: observe → think → act → observe again. An agent runs this loop until the task is complete or it needs human input. The loop is what makes an agent an agent.',
 rels:['agent','tool-use','human-in-the-loop','guardrails'],
 refs:[]},

{id:'tool-use',label:'Tool Use',clusters:['agentic','technical'],sz:22,
 def:'The ability of an AI model to call external functions — search the web, read a file, run code, send an email. Tools are the hands of an agent. Without tools, it can only think; with tools, it can act.',
 rels:['agent','loop','structured-output','rag','mcp','api'],refs:[]},

{id:'memory',label:'Memory',clusters:['agentic','technical'],sz:22,
 def:'How an AI retains information. Short-term memory lives in the context window and disappears when the conversation ends. Long-term memory is stored externally and retrieved when needed.',
 rels:['agent','context-window','handoff','rag','persistent-memory','memory-consolidation'],refs:[]},

{id:'orchestrator',label:'Orchestrator',clusters:['agentic'],sz:21,
 def:'The model or system that coordinates a team of agents — deciding which agent does what, in what order, and what to do with results. The project manager of the multi-agent world.',
 rels:['agent','multi-agent','handoff','guardrails','harness'],
 refs:[]},

{id:'multi-agent',label:'Multi-Agent',clusters:['agentic'],sz:19,
 def:'Multiple AI agents working together, each with a specialised role. Rather than one agent trying to do everything, you have a team: one searches, one writes, one checks quality. Decomposition is the key design principle.',
 rels:['orchestrator','handoff','agent','langchain','multi-agent-orchestration'],
 refs:[]},

{id:'handoff',label:'Handoff',clusters:['agentic'],sz:16,
 def:'The moment one agent passes a task — along with its context and results so far — to another. A clean handoff is the difference between a functional multi-agent system and chaos.',
 rels:['orchestrator','multi-agent','memory'],refs:[]},

{id:'vibe-coding',label:'Vibe Coding',clusters:['agentic','evolved','critical'],sz:18,
 evolved:true,fullName:'Vibe Coding',
 def:'Coined by Andrej Karpathy on 4 February 2025: describing what you want and letting AI figure out the implementation.<sup><a href="#fn1">¹</a></sup> Fun, fast, and fine for prototypes — retired by Karpathy himself exactly one year later when he coined its named successor: agentic engineering.',
 evo:'Vibe coding opened AI-assisted development to non-developers — that\'s genuinely significant. But "vibe and ship" at production scale produces brittle, unmaintainable code. On 4 February 2026, Karpathy named the professional standard that replaced it: agentic engineering — where AI agents plan, execute, and iterate under structured human oversight.',
 rels:['agent','context-engineering','prompt-engineering','claude-code','cursor','agentic-engineering'],
 refs:[{n:1,src:'Karpathy / The New Stack, February 2026',q:'agentic engineering Karpathy vibe coding 2026'}]},

{id:'agentic-engineering',label:'Agentic Engineering',clusters:['technical','agentic'],sz:19,
 def:'Coined by Andrej Karpathy on 4 February 2026 — exactly one year after he coined "vibe coding" — to describe what professional AI-assisted development actually looks like: designing systems where AI agents plan, execute, and iterate under structured human oversight.<sup><a href="#fn1">¹</a></sup> The engineer\'s role shifts from writing code to specifying intent, reviewing output, and maintaining architectural judgment.',
 rels:['vibe-coding','context-engineering','agent','harness','claude-code','loop'],
 refs:[{n:1,src:'Karpathy / The New Stack, February 2026',q:'agentic engineering Karpathy vibe coding 2026'}]},

{id:'planning',label:'Planning',clusters:['agentic'],sz:19,
 def:'The ability of an agent to decompose a task into steps before acting. Planning determines whether an agent can handle complex, multi-stage problems rather than reacting one step at a time. The difference between execution and strategy.',
 rels:['agent','loop','orchestrator','multi-agent','task-decomposition'],
 refs:[]},

{id:'state',label:'State',clusters:['technical','agentic'],sz:18,
 def:'The current snapshot of an agent\'s progress — what it knows, what it has done, and what remains. State enables continuity across steps, loops, and handoffs. Without it, agents reset every turn.',
 rels:['memory','handoff','multi-agent','langchain'],
 refs:[]},

{id:'retry-recovery',label:'Retry / Recovery',clusters:['agentic','technical'],sz:16,
 def:'Mechanisms that allow agents to detect failure and try again — with adjustments. Real-world systems fail constantly; robustness comes from retry logic, fallback strategies, and graceful degradation.',
 rels:['loop','harness','evals','agent'],
 refs:[]},

{id:'idempotency',label:'Idempotency',clusters:['technical'],sz:14,
 def:'The property that repeating the same action produces the same result without unintended side effects. Critical in agentic systems to prevent duplicate actions — like sending the same email twice or reprocessing the same transaction.',
 rels:['agent','tool-use','harness'],
 refs:[]},

{id:'skills',label:'Skills',clusters:['tools','technical'],sz:16,
 def:'Modular, reusable agent capabilities — instructions, tools, and workflows packaged so they can be loaded on demand.<sup><a href="#fn1">¹</a></sup> Both Anthropic (in Claude Code) and OpenAI (in Codex, and increasingly across its agent tooling) use this term publicly. The direction the field is moving: composable intelligence over monolithic prompts.',
 rels:['claude-code','chatgpt','harness','system-prompt','context-engineering'],
 refs:[{n:1,src:'Anthropic / OpenAI official product docs, 2025-26',q:'Anthropic Skills OpenAI Codex Skills official'}]},

// ── AGENTIC ARCHITECTURE (Q1 2026) ─────────────────────────────

{id:'agentic-harness',label:'Agentic Harness',clusters:['agentic','core'],sz:20,
 synonymOf:'harness',
 def:'The specific implementation of a harness designed for autonomous, multi-step AI agents. Where a basic harness manages a single request-response loop, an agentic harness coordinates tool use, memory, permissions, background processes, and multi-agent orchestration across long-running tasks. Claude Code\'s agentic harness — accidentally made public in March 2026 — is the most detailed public example to date.',
 rels:['harness','agent','context-engineering','multi-agent-orchestration','memory-consolidation','feature-flag'],refs:[]},

{id:'context-entropy',label:'Context Entropy',clusters:['agentic','technical'],sz:17,
 def:'The tendency for long-running AI agent sessions to degrade in quality as the context window fills — the agent becomes confused, contradictory, or hallucinatory not because the model failed, but because the accumulated context has become noisy and internally inconsistent. The core problem that agentic memory architecture exists to solve.',
 rels:['context-window','hallucination','memory-consolidation','autodream','context-engineering','context-rot','context-drift','context-pollution'],refs:[]},

{id:'memory-consolidation',label:'Memory Consolidation',clusters:['agentic','technical'],sz:18,
 def:'The process by which an AI agent periodically reorganises its accumulated context — merging related observations, resolving contradictions, and converting uncertain inferences into verified facts — to prevent context entropy from degrading performance over long sessions. Analogous to how human memory consolidates during sleep.',
 rels:['autodream','context-entropy','persistent-memory','context-window','agent','context-compaction','context-folding','planner-worker'],refs:[]},

{id:'autodream',label:'autoDream',clusters:['agentic','technical'],sz:17,
 synonymOf:'memory-consolidation',
 def:'Anthropic\'s internal name for the memory consolidation process in Claude Code — a background routine that runs when the agent is idle, distilling accumulated session context into cleaner, more reliable state. First revealed publicly via the Claude Code source code leak in March 2026. The name is intentional: like dreaming, it happens off the critical path.',
 rels:['memory-consolidation','kairos','context-entropy','agentic-harness','daemon'],refs:[]},

{id:'kairos',label:'KAIROS',clusters:['agentic'],sz:19,
 def:'An unreleased autonomous background mode inside Claude Code, named after the Ancient Greek concept of "the right moment." Unlike standard Claude Code which is reactive, KAIROS runs continuously, evaluating on a heartbeat loop whether anything is worth doing right now. It has exclusive access to tools standard Claude Code does not: push notifications, file delivery, and the ability to monitor GitHub pull requests unprompted. First revealed via the Claude Code source code leak, March 2026.',
 rels:['proactive-agent','autodream','agentic-harness','feature-flag','daemon','cron-scheduling','multi-agent-orchestration'],refs:[]},

{id:'undercover-mode',label:'Undercover Mode',clusters:['agentic','safety'],sz:16,
 def:'A feature in Claude Code that prevents the agent from revealing internal information about itself — blocking references to internal model codenames and suppressing signals that the operator is an AI. Sits at the intersection of AI safety, product design, and identity transparency.',
 rels:['agentic-harness','guardrails','system-prompt'],refs:[]},

{id:'multi-agent-orchestration',label:'Multi-Agent Orchestration',clusters:['agentic'],sz:19,
 def:'An architectural pattern in which one AI agent — the coordinator — spawns and directs multiple specialised worker agents running in parallel. Each worker handles a discrete subtask; the coordinator synthesises their outputs and manages sequencing. Enables complex, long-horizon tasks that would exceed a single agent\'s context or capability.',
 rels:['agent','coordinator-mode','agentic-harness','kairos','task-decomposition','context-entropy'],refs:[]},

{id:'coordinator-mode',label:'Coordinator Mode',clusters:['agentic'],sz:17,
 synonymOf:'multi-agent-orchestration',
 def:'Claude Code\'s specific implementation of multi-agent orchestration. When activated, Claude Code transforms from a single agent into a directing intelligence that assigns tasks to worker agents, monitors their outputs, and integrates findings. Includes an explicit design principle banning lazy delegation: workers must be given precise, specific instructions.',
 rels:['multi-agent-orchestration','agentic-harness','feature-flag','agent'],refs:[]},

{id:'feature-flag',label:'Feature Flag',clusters:['agentic','technical'],sz:16,
 def:'A mechanism that allows a software capability to exist in a codebase but remain switched off for most users — enabling developers to test features safely, roll them out gradually, or hold them back until trust and infrastructure are ready. In AI systems, feature flags take on additional significance: the Claude Code leak revealed 44 unreleased features sitting behind flags.',
 rels:['kairos','coordinator-mode','undercover-mode','research-preview','agentic-harness'],refs:[]},

{id:'daemon',label:'Daemon',clusters:['agentic','technical'],sz:16,
 def:'A background process that runs continuously without being explicitly invoked by the user — quietly waiting, monitoring, or executing on a schedule. From the Greek <em>daimon</em>, a spirit that acts independently of conscious direction. In AI, daemons enable agents to act outside the request-response loop: KAIROS is architecturally a daemon.',
 rels:['kairos','autodream','cron-scheduling','proactive-agent','agentic-harness'],refs:[]},

{id:'cron-scheduling',label:'Cron Scheduling',clusters:['agentic','technical'],sz:15,
 def:'A method of automating tasks by specifying when they should run — "every day at 3am," "every Monday at 9am" — rather than triggering them manually. Named after the Unix <em>cron</em> daemon (from the Greek <em>chronos</em>, time). Claude Code\'s unreleased feature set includes cron-scheduled agent tasks.',
 rels:['kairos','daemon','agentic-harness','proactive-agent'],refs:[]},

// ── TECHNICAL ───────────────────────────────────────────────────

{id:'inference',label:'Inference',clusters:['technical'],sz:15,
 def:'The act of a trained AI model generating a response — taking an input (the prompt) and producing an output. Inference is what happens every time you send a message to an AI. Distinct from training (how the model learned) and fine-tuning (adjusting the model for specific tasks).',
 rels:['model-concept','structured-output','token','training','fine-tuning','latency','quantization','kv-cache','parameters'],refs:[]},

{id:'token',label:'Token',clusters:['technical'],sz:17,
 def:'The basic unit of text that AI language models process — roughly equivalent to a word, though sometimes a syllable or punctuation mark. Token counts determine cost (most AI APIs charge per token), speed (more tokens take longer), and context limits.',
 rels:['context-window','inference','cost','model-concept','prompt','context-engineering','attention-budget','kv-cache'],
 refs:[]},

{id:'training',label:'Training',clusters:['technical'],sz:17,
 def:'The process by which an AI model learns — processing enormous amounts of data to develop the ability to generate relevant, coherent outputs. Training happens once (or periodically) and is computationally expensive. After training, the model\'s knowledge is fixed until it is retrained or fine-tuned. This is why AI models have "knowledge cutoffs."',
 rels:['model-concept','fine-tuning','inference','hallucination','scaling-laws','transformer','rlhf','constitutional-ai'],refs:[]},

{id:'structured-output',label:'Structured Output',clusters:['technical'],sz:16,
 def:'Getting a model to return data in a predictable format — JSON, a list, a table — rather than free-form prose. Essential when AI needs to hand results to another system, another agent, or a database.',
 rels:['tool-use','inference','multi-agent'],refs:[]},

{id:'multimodal',label:'Multimodal',clusters:['technical'],sz:16,
 def:'A model that can work with more than just text — images, audio, video, documents. Multimodal models can look at a screenshot and write code for it, or listen to a recording and summarise it.',
 rels:['model-concept','tool-use','computer-use'],refs:[]},

{id:'mcp',label:'MCP',clusters:['technical','agentic'],sz:18,
 def:'Model Context Protocol — the open standard for how agents connect to external tools, databases, and APIs.<sup><a href="#fn1">¹</a></sup> The connectivity standard for the agentic layer. By end of 2025 it had become the de facto way agents plug into the world.',
 rels:['tool-use','agent','harness','langchain','api','stack','infrastructure'],
 refs:[{n:1,src:'Anthropic / The New Stack, 2025',q:'Model Context Protocol MCP explained'}]},

{id:'a2a',label:'A2A',clusters:['technical','agentic'],sz:17,
 fullName:'A2A (Agent-to-Agent Protocol)',
 def:'Google\'s open protocol for agent-to-agent communication — how agents built by different teams, using different frameworks, running different models, actually talk to each other. Launched April 2025, now backed by 150+ organisations. The complement to MCP: where MCP connects an agent to its tools (vertical), A2A connects agents to other agents (horizontal).',
 rels:['mcp','multi-agent','orchestrator','google-co','handoff','langchain'],
 refs:[{n:1,src:'Google Developers Blog / Let\'s Data Science, 2025',q:'A2A Agent2Agent protocol Google 2025'}]},

{id:'connectors',label:'Connectors',clusters:['technical','tools'],sz:16,
 def:'Pre-built integrations that let AI agents connect to external services — Gmail, Slack, GitHub, Salesforce, Google Drive — without custom code. The practical layer that makes MCP useful in production. Where MCP is the standard, connectors are the implementations.',
 rels:['mcp','tool-use','skills','agent','harness','langchain'],
 refs:[]},

{id:'computer-use',label:'Computer Use',clusters:['technical'],sz:16,
 def:'An agent pattern where the model operates a user interface directly — clicking, typing, navigating a browser or desktop app. Powerful because it works even when there\'s no clean API.',
 rels:['tool-use','agent','multimodal','openclaw'],
 refs:[]},

{id:'context-engineering',label:'Context Engineering',clusters:['technical','core'],sz:20,
 def:'The discipline that has displaced prompt engineering as the critical skill in 2026.<sup><a href="#fn1">¹</a></sup> Not about crafting a clever sentence — it\'s about ensuring the agent sees the right information, at the right time, in the right format.',
 rels:['context-window','harness','prompt-engineering','system-prompt','memory','prompt','attention-budget','context-economy','lost-in-the-middle'],
 refs:[{n:1,src:'Anthropic engineering blog, 2026',q:'context engineering AI agents 2026'}]},

{id:'open-weight',label:'Open-Weight Models',clusters:['technical','models','landscape'],sz:17,
 def:'AI models whose trained weights are publicly available for download, inspection, and deployment. Distinct from "open-source" in the traditional software sense: an open-weight model may not include training code, training data, or documentation of the full development process. As of April 2026, six competing open-weight model families at frontier capability levels exist under permissive licenses — including Gemma 4, Llama 4, DeepSeek, Qwen, Mistral, and GLM-5.',
 rels:['llama','deepseek','mistral','model-concept','data-sovereignty','proprietary-model','fine-tuning','quantization','edge-ai','gemma-4','hugging-face'],
 refs:[]},

{id:'embeddings',label:'Embeddings',clusters:['technical','core'],sz:20,
 def:'Numerical representations of meaning — text, images, or data converted into vectors so similarity can be measured mathematically. Embeddings are how AI systems "understand" relationships between concepts. They power search, RAG, clustering, and memory retrieval.',
 rels:['rag','memory','vector-database','context-engineering','model-concept'],
 refs:[]},

{id:'vector-database',label:'Vector Database',clusters:['technical'],sz:17,
 def:'A database designed to store and search embeddings efficiently. Enables similarity search — finding relevant documents, memories, or concepts based on meaning rather than keywords. The infrastructure layer behind RAG.',
 rels:['embeddings','rag','memory','grounding'],
 refs:[]},

{id:'grounding',label:'Grounding',clusters:['technical'],sz:18,
 def:'Anchoring AI outputs in external, verifiable information — documents, databases, or real-world inputs. Grounding reduces hallucination by connecting responses to evidence rather than patterns alone. RAG is the primary technical implementation; Work IQ is an enterprise-scale grounding system.',
 rels:['rag','memory','hallucination','context-engineering','verifiable-domain','work-iq','vertical-ai'],
 refs:[]},

{id:'cost',label:'Cost',clusters:['technical'],sz:16,
 def:'The economic dimension of AI — typically measured per token for input and output. Cost shapes architecture decisions: how much context to include, how often to call models, and whether to use agents at all. Invisible in demos, decisive in production.',
 rels:['token','inference','agentic-engineering','harness'],
 refs:[]},

{id:'latency',label:'Latency',clusters:['technical'],sz:15,
 def:'The time it takes for a model to respond after a request is sent. In agentic systems, latency compounds across loops, tool calls, and multi-step workflows — making it a key constraint on user experience and system design.',
 rels:['inference','agent','loop','harness'],
 refs:[]},

{id:'fine-tuning',label:'Fine-Tuning',clusters:['technical','models'],sz:16,
 def:'A form of additional training applied to an existing model using a targeted, domain-specific dataset — adjusting the model\'s behaviour for a particular task, industry, or style without rebuilding it from scratch. Sits between prompt engineering (shaping behaviour through instructions) and full training (building a model from the ground up).',
 rels:['model-concept','open-weight','context-engineering','training','vertical-ai'],
 refs:[]},

{id:'interpretability',label:'Interpretability',clusters:['technical','safety'],sz:17,
 def:'The ability to understand why a model produced a particular output. Still an open research problem. Interpretability seeks to move AI from black box to something partially legible — especially important for safety-critical systems.',
 rels:['model-concept','evals','guardrails'],
 refs:[]},

{id:'api',label:'API',clusters:['technical'],sz:18,
 fullName:'API (Application Programming Interface)',
 def:'A defined connection point that allows one piece of software to communicate with another — sending requests and receiving responses in a standardised format. APIs are the connective tissue of the modern software world, and of AI systems in particular: when Claude Code calls a tool, it\'s using an API. MCP is a standard for how agents connect to APIs consistently.',
 rels:['mcp','stack','infrastructure','tool-use','harness'],refs:[]},

// ── SAFETY ──────────────────────────────────────────────────────

{id:'human-in-the-loop',label:'Human-in-the-Loop',clusters:['safety','agentic','autonomy'],sz:19,
 def:'A design pattern in which a human approval or review step is deliberately built into an otherwise automated or agentic workflow. The human doesn\'t do the work — but they remain at key decision points: reviewing a plan before execution, approving an action before it\'s taken, or validating an output before it ships. The primary mechanism for maintaining control as AI systems become more autonomous.',
 rels:['agent','loop','guardrails','evals','autonomy-spectrum','autonomous-agent','cowork','reactive-agent','agentic-harness'],
 refs:[]},

{id:'guardrails',label:'Guardrails',clusters:['safety'],sz:20,
 def:'Constraints built into an AI system to prevent specific categories of harmful, incorrect, or out-of-scope behaviour — not as a filter applied after the fact, but as a structural limit on what the agent can do.<sup><a href="#fn1">¹</a></sup> Guardrails exist at multiple levels: in the model itself, in the system prompt, in the harness, and in the permissions layer.',
 rels:['system-prompt','human-in-the-loop','evals','orchestrator','harness','agentic-harness','undercover-mode','prompt-injection','ai-red-teaming','alignment','jailbreak','constitutional-ai'],refs:[{n:1,src:'OWASP, 2025',q:'OWASP AI safety guardrails definition'}]},

{id:'evals',label:'Evals',clusters:['safety','technical'],sz:16,
 def:'Systematic tests that measure how well an AI performs on specific tasks. Building good evals is surprisingly hard. Without evals, you don\'t know if your AI is working; you\'re just hoping.',
 rels:['guardrails','human-in-the-loop','verifiable-domain','verifiability','benchmark-saturation','evaluation-gaming'],
 refs:[]},

{id:'autonomy-spectrum',label:'Autonomy Spectrum',clusters:['safety','agentic','autonomy'],sz:18,
 def:'The progression from human-in-the-loop → human-on-the-loop → human-out-of-the-loop.<sup><a href="#fn1">¹</a></sup> A framework for deciding how much independent action an agent should be permitted, based on task risk and reversibility.',
 rels:['human-in-the-loop','guardrails','agent-governance','delegation','copilot','cowork','autonomous-agent'],
 refs:[{n:1,src:'Deloitte, 2025',q:'AI autonomy spectrum human on the loop'}]},

{id:'agent-governance',label:'Agent Governance',clusters:['safety'],sz:18,
 def:'Ensuring agents operate within defined policies, ethical frameworks, and compliance requirements.<sup><a href="#fn1">¹</a></sup> Moving from "ethics talk" to operational practice. The EU AI Act is a phased rollout: GPAI rules began applying on 2 August 2025, additional obligations apply from 2 August 2026, and some requirements continue into 2027 and beyond.',
 rels:['guardrails','autonomy-spectrum','agent-washing','evals','critical-thinking'],
 refs:[{n:1,src:'European Commission / EU AI Act timeline',q:'EU AI Act phased rollout GPAI August 2025 August 2026 2027'}]},

{id:'alignment',label:'Alignment',clusters:['safety'],sz:18,
 def:'The ongoing research effort to ensure AI systems behave in accordance with human values, intentions, and preferences — not just following literal instructions, but understanding and pursuing the spirit of what humans actually want. The challenge: human values are complex, context-dependent, and sometimes contradictory. Alignment is not a feature to be shipped; it is a research frontier that becomes more urgent as AI systems become more capable and autonomous.',
 rels:['guardrails','agent-governance','autonomous-agent','human-in-the-loop','interpretability','model-concept','responsible-scaling-policy','asl-4','constitutional-ai','rlhf'],refs:[]},

{id:'sandboxing',label:'Sandboxing',clusters:['safety','technical'],sz:17,
 def:'Running an AI agent\'s actions in an isolated environment — separated from production systems, real data, and external consequences — so that mistakes have limited blast radius. A sandboxed agent can write files, execute commands, and call APIs without those actions affecting the real world until explicitly approved.',
 rels:['guardrails','human-in-the-loop','blast-radius','agentic-harness','sandbox-escape'],refs:[]},

{id:'blast-radius',label:'Blast Radius',clusters:['safety'],sz:16,
 def:'How much damage an AI agent mistake can cause — the scope of potential harm if an agent acts incorrectly, is compromised, or executes in the wrong context. A small blast radius means a mistake is recoverable and contained; a large blast radius means a single bad action could cascade through connected systems.',
 rels:['sandboxing','guardrails','human-in-the-loop','autonomous-agent','sandbox-escape'],refs:[]},

// ── CRITICAL / HYPE ─────────────────────────────────────────────

{id:'agent-washing',label:'Agent-Washing',clusters:['critical'],sz:20,
 def:'Branding basic AI workflows, scripted automations, or chat interfaces as "AI agents" without delivering true agentic intelligence.<sup><a href="#fn1">¹</a></sup> If it doesn\'t plan, loop, use tools, and adapt — it\'s not an agent. CustomGPTs are a common example: configured interfaces, not agents.',
 rels:['agent','chatbot','ai-washing','critical-thinking','agent-governance','the-ai'],
 refs:[{n:1,src:'PROS.com, 2025',q:'agent washing AI hype 2025'}]},

{id:'ai-washing',label:'AI-Washing',clusters:['critical'],sz:18,
 def:'When companies inflate or fabricate their AI capabilities to appear more innovative than they are.<sup><a href="#fn1">¹</a></sup> Like greenwashing, but for artificial intelligence. Now attracting SEC and FTC enforcement action.',
 rels:['agent-washing','critical-thinking','information-literacy','agent-governance'],
 refs:[{n:1,src:'Risk Management Magazine, 2026',q:'AI washing fraud SEC FTC 2026'}]},

{id:'pilot-purgatory',label:'Pilot Purgatory',clusters:['critical'],sz:17,
 def:'The state most enterprise AI projects live in: expensive, brittle, and nowhere near production-grade.<sup><a href="#fn1">¹</a></sup> The gap between the press release and the working system. Solved by harnesses, governance, and evals — not by better models.',
 rels:['agent-washing','agent-governance','systems-thinking','critical-thinking','harness','shipped','research-preview','general-availability'],
 refs:[{n:1,src:'Deloitte / Futurism, 2026',q:'AI pilot purgatory enterprise deployment gap'}]},

{id:'hallucination',label:'Hallucination',clusters:['critical','technical'],sz:20,
 def:'When an AI generates information that is false but presented as plausible or confident. Not a bug in isolation, but a property of probabilistic systems trained on patterns rather than facts. Context entropy in long agent sessions can amplify hallucination risk.',
 rels:['evals','guardrails','information-literacy','grounding','context-entropy','verifiable-domain','context-rot'],
 refs:[]},

{id:'distribution-shift',label:'Distribution Shift',clusters:['critical','technical'],sz:16,
 def:'When real-world inputs differ from the data a model was trained on. Models perform well on familiar patterns but degrade unpredictably outside them. A key reason AI systems fail in production despite strong benchmarks.',
 rels:['model-concept','evals','guardrails'],
 refs:[]},

{id:'benchmark-gaming',label:'Benchmark Gaming',clusters:['critical'],sz:15,
 def:'Optimising models or systems to perform well on specific evaluation benchmarks rather than real-world tasks. Produces inflated performance claims and contributes to AI-washing.',
 rels:['evals','ai-washing','critical-thinking'],
 refs:[]},

// ── EVOLVED ─────────────────────────────────────────────────────

{id:'rag',label:'RAG',clusters:['evolved'],sz:16,evolved:true,
 fullName:'RAG (Retrieval-Augmented Generation)',
 def:'A technique where an AI fetches relevant documents before responding — grounding its answer in real information rather than training data alone.',
 evo:'RAG didn\'t disappear — it got absorbed. What used to be a named technique you had to explicitly architect is now just how agents access information. When an agent uses a search tool or reads a database, it\'s doing what RAG described. The plumbing became invisible infrastructure.',
 rels:['tool-use','memory','agent','context-engineering','grounding','context-window','persistent-memory'],
 refs:[]},

{id:'chatbot',label:'Chatbot',clusters:['evolved'],sz:16,evolved:true,
 fullName:'Chatbot',
 def:'An interface for text-based conversation with an AI — originally rule-based scripts, now applied loosely to any conversational AI regardless of capability.',
 evo:'"Chatbot" flattens a massive range. A scripted FAQ bot and a fully agentic system that books, files, and adapts mid-task are technically both "chatbots." The term isn\'t wrong — it\'s just not specific enough anymore.',
 rels:['agent','model-concept','ai-assistant','agent-washing'],refs:[]},

{id:'prompt-engineering',label:'Prompt Engineering',clusters:['evolved'],sz:16,evolved:true,
 fullName:'Prompt Engineering',
 def:'The practice of carefully crafting inputs — structure, framing, examples, instructions — to steer a model toward better outputs. For two years, this was the primary skill separating effective AI users from ineffective ones.',
 evo:'As a job title it\'s fading — absorbed into context engineering, system prompt design, and agentic workflow architecture. The scale changed: you\'re not writing one good prompt, you\'re designing how an AI thinks across an entire interaction.',
 rels:['system-prompt','context-window','context-engineering','prompt'],
 refs:[{n:1,src:'Mike Mason, 2026',q:'prompt engineering vs context engineering 2026'}]},

{id:'ai-assistant',label:'AI Assistant',clusters:['evolved'],sz:15,evolved:true,
 fullName:'AI Assistant',
 def:'"Assistant" implies reactive help — you ask, it answers. That framing now undersells what modern AI can do.',
 evo:'Agents are proactive, persistent, and capable of multi-step action without being prompted at each step. The vocabulary is catching up with the capability.',
 rels:['agent','chatbot','model-concept','copilot'],refs:[]},

{id:'the-ai',label:'"The AI"',clusters:['evolved'],sz:14,evolved:true,
 fullName:'"The AI" (monolith concept)',
 def:'The widespread idea that there is one AI doing everything — one system, one decision, one black box.',
 evo:'Modern deployments are ecosystems: models, agents, harnesses, orchestrators, tools, guardrails — each a distinct component. The monolith framing makes AI feel magical and opaque. Understanding the components is what makes it legible — and what makes agent-washing visible.',
 rels:['model-concept','agent','multi-agent','harness','agent-washing','abstraction'],refs:[]},

{id:'github-copilot',label:'GitHub Copilot',clusters:['evolved','tools'],sz:16,evolved:true,
 fullName:'GitHub Copilot',
 def:'Microsoft\'s AI coding assistant — the original mainstream AI pair-programmer, previewed 2021, generally available 2022. Brought AI-assisted coding to millions of developers through IDE integration.',
 evo:'Copilot pioneered the category but represented the "suggestion in the editor" paradigm. Terminal-native agents like Claude Code and agentic IDEs like Cursor have raised expectations significantly.',
 rels:['cursor','claude-code','vibe-coding','codex-model','copilot'],refs:[]},

{id:'chatgpt',label:'ChatGPT',clusters:['tools','evolved'],sz:20,evolved:true,
 fullName:'ChatGPT',
 def:'OpenAI\'s consumer AI interface — launched November 2022 and credited with bringing AI to mainstream consciousness. Now actively evolving into an agentic platform with its own computer use, apps ecosystem, and Skills system.',
 evo:'ChatGPT defined the chatbot era. OpenAI is now actively converging it toward a multi-modal agentic platform — combining the model, the interface, tool use, and a Skills framework. Mid-metamorphosis as of March 2026.',
 rels:['openai-co','gpt54','agent-washing','skills','perplexity'],
 refs:[]},

{id:'codex-model',label:'Codex',clusters:['models','evolved'],sz:15,evolved:true,
 fullName:'Codex (OpenAI)',
 def:'OpenAI\'s coding model family — the technology that originally powered GitHub Copilot and established AI-assisted coding as a category.',
 evo:'Codex pioneered AI coding assistance but has been largely superseded by GPT-5.2-Codex, OpenAI\'s coding-specialised variant now deployed in the Codex app for parallel agentic coding workflows.',
 rels:['openai-co','github-copilot','gpt54','claude-code'],refs:[]},

{id:'operator',label:'Operator',clusters:['tools','evolved'],sz:16,evolved:true,
 fullName:'Operator (OpenAI)',
 def:'OpenAI\'s browser agent — launched January 2025 as one of the first major deployments of computer use at consumer scale.',
 evo:'Operator proved browser agents work at scale. It was deprecated in August 2025 and absorbed into ChatGPT agent mode — the capability didn\'t disappear, the standalone product did.',
 rels:['chatgpt','openai-co','computer-use','agent','deep-research'],
 refs:[{n:1,src:'OpenAI / Wikipedia, 2025',q:'OpenAI Operator browser agent deprecated 2025'}]},

// ── HUMAN SKILLS ────────────────────────────────────────────────

{id:'socratic-dialogue',label:'Socratic Dialogue',clusters:['human'],sz:16,
 def:'Using structured questioning — rather than direct instruction — to draw out reasoning, surface assumptions, and build understanding through the conversation itself. Ancient method, newly urgent in AI interaction design.',
 rels:['critical-thinking','metacognition'],refs:[]},

{id:'critical-thinking',label:'Critical Thinking',clusters:['human'],sz:20,
 def:'The disciplined practice of evaluating claims, spotting logical gaps, and asking "does this actually do what it says?" The most important skill for navigating a world full of agent-washing and AI hype.',
 rels:['information-literacy','agent-washing','ai-washing','metacognition','socratic-dialogue','agent-governance'],refs:[]},

{id:'systems-thinking',label:'Systems Thinking',clusters:['human'],sz:18,
 def:'The ability to understand how components interact as a whole — how a change in one part ripples through the rest.<sup><a href="#fn1">¹</a></sup> Essential for making sense of multi-agent architectures without needing to code them.',
 rels:['multi-agent','orchestrator','critical-thinking','abstraction','delegation'],
 refs:[{n:1,src:'Deloitte, 2025',q:'systems thinking AI agents enterprise'}]},

{id:'metacognition',label:'Metacognition',clusters:['human'],sz:16,
 def:'Thinking about how you think. Awareness of your own reasoning patterns, biases, and blind spots. The foundation of effective human-AI collaboration.',
 rels:['critical-thinking','socratic-dialogue','information-literacy'],refs:[]},

{id:'information-literacy',label:'Information Literacy',clusters:['human'],sz:17,
 def:'The ability to evaluate sources, understand provenance, and distinguish reliable evidence from noise.<sup><a href="#fn1">¹</a></sup> In an AI world saturated with plausible-sounding outputs, this is the foundational skill.',
 rels:['critical-thinking','ai-washing','agent-washing','metacognition'],
 refs:[{n:1,src:'CFA Institute, 2025',q:'information literacy AI age sources'}]},

{id:'delegation',label:'Delegation',clusters:['human','autonomy'],sz:17,
 def:'The act of assigning work to an AI agent — specifying what you want achieved and transferring responsibility for execution. Delegation is the interaction paradigm of outcome-focused AI: not "here\'s what to do next" but "here\'s what I need to be true." The quality of delegation directly determines the quality of what comes back.<sup><a href="#fn1">¹</a></sup>',
 rels:['autonomy-spectrum','systems-thinking','human-in-the-loop','agent-governance','outcome-focused-work','cowork','task','autonomous-agent','prompt'],
 refs:[{n:1,src:'Deloitte, 2025',q:'delegation AI agents autonomy spectrum'}]},

{id:'abstraction',label:'Abstraction',clusters:['human','technical'],sz:15,
 def:'The ability to think at the right level of detail — to hold a concept without needing to understand its implementation. Why non-developers can work with agents effectively once they stop trying to understand the plumbing.',
 rels:['systems-thinking','context-engineering','delegation','the-ai'],refs:[]},

// ── TOOLS & PLATFORMS ───────────────────────────────────────────

{id:'claude-ai',label:'Claude.ai',clusters:['tools'],sz:19,
 def:'Anthropic\'s consumer and enterprise interface — the "front door" to Claude models. Available on web, mobile, and desktop. Includes features like Projects, extended thinking, and deep research.',
 rels:['claude','anthropic-co','claude-code','mcp'],
 refs:[]},

{id:'claude-code',label:'Claude Code',clusters:['tools','agentic'],sz:22,
 def:'Anthropic\'s terminal-native coding agent — widely credited with proving that agentic AI works in production.<sup><a href="#fn1">¹</a></sup> Reads your codebase, plans multi-step tasks, writes and runs code, commits changes. Reached $1B in annualised revenue within six months of launch.',
 rels:['claude','anthropic-co','harness','agent','loop','mcp','context-engineering','vibe-coding','github-copilot','agentic-harness'],
 refs:[{n:1,src:'Shawn Kanungo / SemiAnalysis, 2026',q:'Claude Code $1B revenue agentic coding 2026'}]},

{id:'openclaw',label:'OpenClaw',clusters:['tools','critical'],sz:21,
 def:'Open-source AI agent that runs locally and connects AI models to your computer — files, shell commands, browsers, email, APIs — via messaging apps like WhatsApp and Telegram.<sup><a href="#fn1">¹</a></sup> At GTC 2026, Jensen Huang highlighted it as "the most popular open source project in the history of humanity."<sup><a href="#fn2">²</a></sup>',
 rels:['agent','computer-use','agent-governance','mcp','anthropic-co','openclaw-company'],
 refs:[{n:1,src:'OpenClaw / project coverage, 2026',q:'OpenClaw open source AI agent 2026'},{n:2,src:'NVIDIA GTC 2026 coverage',q:'Jensen Huang OpenClaw most popular open source project in the history of humanity operating system of agentic computers'}]},

{id:'perplexity',label:'Perplexity',clusters:['tools'],sz:19,
 def:'AI-native answer engine that combines real-time web search with large language models to deliver cited, sourced responses.<sup><a href="#fn1">¹</a></sup> In February 2026 launched "Computer" — a multi-model agent orchestrating 19 AI models to complete complex tasks autonomously.',
 rels:['agent','information-literacy','chatgpt','notebooklm'],
 refs:[{n:1,src:'Perplexity / Built In, 2026',q:'Perplexity AI answer engine agent 2026'}]},

{id:'notebooklm',label:'NotebookLM',clusters:['tools'],sz:16,
 def:'Google\'s AI-powered research assistant — upload documents, websites, videos, or audio and it synthesises them, answers questions, and generates audio overviews. Source-grounded by design.',
 rels:['perplexity','gemini','google-co','information-literacy'],refs:[]},

{id:'cursor',label:'Cursor',clusters:['tools','technical'],sz:18,
 def:'AI-first code editor that integrates AI deeply into the IDE — autocomplete, inline editing, codebase-aware chat. The dominant IDE-first approach before terminal-native agents arrived.',
 rels:['claude-code','github-copilot','vibe-coding','langchain'],refs:[]},

{id:'devin',label:'Devin',clusters:['tools','agentic'],sz:17,
 def:'Cognition\'s "AI software engineer" — the first agent positioned as a full software development teammate rather than a coding assistant.<sup><a href="#fn1">¹</a></sup> Plans, writes, debugs, and deploys code in a sandboxed environment.',
 rels:['agent','claude-code','harness','multi-agent'],
 refs:[{n:1,src:'Cognition / Wikipedia, 2025',q:'Devin AI software engineer Cognition 2025'}]},

{id:'manus',label:'Manus',clusters:['tools','agentic'],sz:17,
 def:'Chinese-developed general-purpose AI agent — went viral in early 2026 for completing complex multi-application workflows autonomously. Demonstrated that the agentic capability wave is global.',
 rels:['agent','multi-agent','openclaw','devin'],refs:[]},

{id:'deep-research',label:'Deep Research',clusters:['tools','agentic'],sz:17,
 def:'An agentic mode where an AI runs extended multi-step research — searching, reading, synthesising, and iterating over sources for minutes or hours before producing a report. Represents the shift from "answer a question" to "go find out and come back with a report."',
 rels:['agent','loop','perplexity','reasoning-models','tool-use','memory'],
 refs:[{n:1,src:'Perplexity / OpenAI, 2025',q:'deep research AI agent feature 2025'}]},

{id:'cowork',label:'Cowork',clusters:['tools','agentic','autonomy'],sz:18,
 def:'A collaboration model in which the human delegates an outcome to an AI agent, which then plans and executes the work independently — surfacing progress, requesting clarification at decision points, and completing the task without step-by-step instruction. Distinct from Copilot (which waits for prompts) and Autonomous Agent (which operates without checkpoints). Anthropic\'s Cowork (launched January 2026) and Microsoft\'s Copilot Cowork are current implementations.',
 rels:['claude-code','anthropic-co','agent','skills','computer-use','copilot','autonomous-agent','outcome-focused-work','human-in-the-loop','delegation','agentic-harness'],
 refs:[{n:1,src:'Anthropic / SemiAnalysis, January 2026',q:'Anthropic Cowork desktop agent January 2026'}]},

{id:'moltbook',label:'Moltbook',clusters:['tools','critical'],sz:15,
 def:'A social network designed specifically for AI agents to post, comment, and interact with each other — with humans as observers.<sup><a href="#fn1">¹</a></sup> Launched alongside the OpenClaw ecosystem. The strangest node on this graph — and possibly a preview of the internet\'s future.',
 rels:['openclaw','agent','agent-washing'],
 refs:[{n:1,src:'Wikipedia / Moltbook, 2026',q:'Moltbook AI agent social network 2026'}]},

{id:'langchain',label:'LangChain / LangGraph',clusters:['tools','technical'],sz:17,
 def:'The developer framework layer for building agentic systems — LangChain for composing LLM workflows, LangGraph for stateful multi-agent orchestration with persistence, branching, and human-in-the-loop.',
 rels:['multi-agent','orchestrator','mcp','harness','agent'],
 refs:[]},

// ── WORK & OUTPUT (Q1 2026) ─────────────────────────────────────

{id:'task',label:'Task',clusters:['work'],sz:18,
 def:'A discrete unit of work handed to an agent or AI system — specific enough to be executed, bounded enough to be completed. Tasks are the building blocks of workflows. In the shift toward outcome-focused work, the distinction between "doing tasks" and "achieving outcomes" is becoming a meaningful design decision.',
 rels:['task-decomposition','workflow','outcome-focused-work','agent','output'],refs:[]},

{id:'task-decomposition',label:'Task Decomposition',clusters:['work','agentic'],sz:17,
 def:'The process of breaking a complex goal into smaller, executable tasks that an agent (or team of agents) can handle in sequence or in parallel. A core capability of agentic AI — and the reason that multi-agent orchestration can tackle problems too large for a single context window.',
 rels:['task','multi-agent-orchestration','outcome-focused-work','planning','agent'],refs:[]},

{id:'output',label:'Output',clusters:['work'],sz:17,
 def:'What an AI system produces in response to a task or goal. Outputs exist on a spectrum: from a single sentence to a structured document, from a code file to a triggered action in an external system. In agentic AI, outputs are increasingly not just content but consequences — files written, emails sent, calendar changes made.',
 rels:['artifact','task','outcome-focused-work','verifiable-domain','shipped'],refs:[]},

{id:'artifact',label:'Artifact',clusters:['work'],sz:16,
 def:'A specific, discrete, and portable output from an AI system — a file, a document, a block of code, an image. Artifacts are outputs that can be saved, shared, versioned, and acted on independently of the session that produced them. The shift from conversational AI to agentic AI is partly characterised by AI producing artifacts rather than responses.',
 rels:['output','shipped','task','workflow','context-engineering'],refs:[]},

{id:'outcome-focused-work',label:'Outcome-Focused Work',clusters:['work','autonomy'],sz:18,
 def:'A model of working with AI in which you specify the result you want — not the steps to get there. Instead of prompting an agent through a sequence of tasks, you describe the desired end state and delegate the planning and execution. Copilot Cowork and Claude Cowork are built explicitly on this model.',
 rels:['task','cowork','delegation','autonomous-agent','copilot','output'],refs:[]},

{id:'shipped',label:'Shipped',clusters:['work','lifecycle'],sz:16,
 def:'A term from software development culture meaning a product, feature, or capability has been built, tested, and released to real users — it is live, not theoretical. In the AI context, "shipped" has become the dividing line between genuine capability and demo-ware.',
 rels:['research-preview','general-availability','pilot-purgatory','output','artifact'],refs:[]},

{id:'workflow',label:'Workflow',clusters:['work','agentic'],sz:17,
 def:'A defined, repeatable sequence of steps — whether executed by humans, AI agents, or both — designed to accomplish a specific outcome. In the AI context, workflows are increasingly delegated entirely to agents: the human defines the outcome and the workflow structure; the agent executes each step.',
 rels:['task','task-decomposition','opal','cowork','agentic-harness'],refs:[]},

// ── AUTONOMY SPECTRUM (Q1 2026) ─────────────────────────────────

{id:'copilot',label:'Copilot',clusters:['autonomy'],sz:19,
 def:'An AI that works alongside a human, handling execution while the human retains direction and decision-making. The copilot doesn\'t fly the plane — it handles the checklist, monitors instruments, and executes manoeuvres on instruction. Microsoft\'s Copilot product family is the most prominent example, but the term describes a pattern, not a product. The entry point on the autonomy spectrum.',
 rels:['cowork','autonomous-agent','human-in-the-loop','outcome-focused-work','agent','autonomy-spectrum'],refs:[]},

{id:'autonomous-agent',label:'Autonomous Agent',clusters:['autonomy','agentic'],sz:19,
 def:'An AI agent that plans, decides, and acts without requiring human approval at each step. Not a synonym for "agent" — rather, the strong end of the autonomy spectrum where the agent has been granted sufficient trust and capability to operate independently over extended tasks. Raises the highest-stakes questions in AI safety and governance.',
 rels:['agent','cowork','kairos','human-in-the-loop','guardrails','autonomy-spectrum','autonomous-goal-extension'],refs:[]},

{id:'proactive-agent',label:'Proactive Agent',clusters:['autonomy','agentic'],sz:17,
 complements:'reactive-agent',
 def:'An AI agent that initiates actions without being explicitly asked — monitoring its environment, identifying opportunities or problems, and acting on its own judgment about what is worth doing. The conceptual opposite of a reactive agent. KAIROS is Anthropic\'s implementation of proactive agency.',
 rels:['reactive-agent','kairos','daemon','autonomous-agent','human-in-the-loop'],refs:[]},

{id:'reactive-agent',label:'Reactive Agent',clusters:['autonomy','agentic'],sz:17,
 complements:'proactive-agent',
 def:'An AI agent that only acts when explicitly instructed — it waits for input, processes it, and responds. The dominant model for AI assistants today. Reactive agents are predictable and controllable; their limitation is that they cannot anticipate, monitor, or act without a human trigger. Standard Claude Code is reactive.',
 rels:['proactive-agent','agent','copilot','human-in-the-loop'],refs:[]},

// ── PRODUCT LIFECYCLE (Q1 2026) ─────────────────────────────────

{id:'research-preview',label:'Research Preview',clusters:['lifecycle'],sz:16,
 def:'A release state in which a capability is technically available to some users but explicitly not production-ready — it is being tested, refined, and validated before broader deployment. The term matters because users and organisations often mistake research previews for deployable products, with costly consequences.',
 rels:['general-availability','feature-flag','shipped','pilot-purgatory'],refs:[]},

{id:'general-availability',label:'General Availability',clusters:['lifecycle'],sz:16,
 fullName:'General Availability (GA)',
 def:'The release state in which a product or capability is fully supported, production-ready, and available to all customers without restrictions. The transition from Research Preview to GA is the moment a capability moves from "interesting" to "organisationally deployable."',
 rels:['research-preview','shipped','feature-flag','pilot-purgatory'],refs:[]},

{id:'deprecated',label:'Deprecated',clusters:['lifecycle','technical'],sz:15,
 def:'A formal signal that a capability, model, or API version is being phased out — still functional for now, but no longer recommended, no longer receiving updates, and scheduled for eventual removal. In AI, deprecation cycles can be fast and consequential.',
 rels:['general-availability','api','model-concept','infrastructure','stack'],refs:[]},

// ── BUSINESS REALITY (Q1 2026) ──────────────────────────────────

{id:'saas',label:'SaaS',clusters:['business'],sz:17,
 fullName:'SaaS (Software as a Service)',
 def:'Software as a Service — the dominant model of enterprise software delivery for the past two decades. Understanding SaaS matters in the AI context because agentic AI is beginning to disrupt it: if an agent can perform the function a SaaS tool was built to deliver, the case for the subscription weakens.',
 rels:['saaspocalypse','wrapper','infrastructure','stack','agent','vendor-lock-in'],refs:[]},

{id:'saaspocalypse',label:'SaaSpocalypse',clusters:['business','critical'],sz:17,
 def:'The thesis that agentic AI will hollow out the SaaS industry by replacing subscription software with agents that achieve the outcome the software was built to enable — without the interface, the per-seat pricing, or the vendor lock-in. The term is deliberately dramatic; the underlying trend is real.',
 rels:['saas','wrapper','autonomous-agent','outcome-focused-work','agentic-harness'],refs:[]},

{id:'wrapper',label:'Wrapper',clusters:['business','critical'],sz:16,
 def:'An AI product that is essentially a thin interface built around an existing model, with minimal proprietary architecture, logic, or value-add. "It\'s just a wrapper" is a dismissal in the AI industry — it implies the product has no defensible moat. Distinguished from Harness: a harness is substantive engineering around a model; a wrapper is cosmetic.',
 rels:['saas','saaspocalypse','harness','agentic-harness','api','model-concept'],refs:[]},

{id:'vertical-ai',label:'Vertical AI',clusters:['business','technical'],sz:17,
 def:'AI built for a specific industry, function, or domain rather than general-purpose use — trained on domain-specific data, fine-tuned for domain-specific tasks, and evaluated against domain-specific benchmarks. The antidote to the wrapper problem: a vertical AI product has genuine differentiation because its value comes from domain depth.',
 rels:['fine-tuning','verifiable-domain','saas','model-concept','grounding'],refs:[]},

{id:'stack',label:'Stack',clusters:['business','technical'],sz:17,
 def:'The complete set of technologies — models, harnesses, APIs, databases, infrastructure, and tools — that an AI-powered system runs on. "What\'s your stack?" is the practitioner\'s question about the full technical picture.',
 rels:['infrastructure','api','harness','model-concept','mcp','agentic-harness'],refs:[]},

{id:'infrastructure',label:'Infrastructure',clusters:['business','technical'],sz:18,
 def:'The enabling layer beneath an AI system — the compute, storage, networking, APIs, and platform services that allow models and agents to operate at scale. Infrastructure is invisible when it works and catastrophic when it doesn\'t.',
 rels:['stack','api','harness','mcp','agentic-harness','sandboxing','hugging-face'],refs:[]},

// ── PRODUCT / BRAND NODES (Q1 2026) ─────────────────────────────

{id:'opal',label:'Opal',clusters:['tools','business'],sz:16,
 nodeType:'product',
 fullName:'Opal (Google Labs)',
 def:'Google Labs\' no-code AI mini-app builder — a platform that lets anyone create, share, and deploy AI-powered workflows using natural language and a visual editor, without writing code. In February 2026, Opal introduced an "agent step" powered by Gemini that transforms static workflows into dynamic, goal-directed experiences.',
 rels:['workflow','agentic-harness','task-decomposition','outcome-focused-work','vibe-coding','google-co'],refs:[]},

{id:'copilot-cowork',label:'Copilot Cowork',clusters:['tools','autonomy'],sz:17,
 nodeType:'product',
 fullName:'Copilot Cowork (Microsoft)',
 def:'Microsoft\'s outcome-delegation platform within Microsoft 365, launched March 2026 in partnership with Anthropic. Built on the same agentic harness as Claude Cowork, it allows users to describe a desired outcome and have Copilot plan, execute, and surface work across the full Microsoft 365 ecosystem. Described as "Wave 3 of Microsoft 365 Copilot."',
 rels:['cowork','agentic-harness','outcome-focused-work','work-iq','research-preview','human-in-the-loop','microsoft-co'],refs:[]},

{id:'work-iq',label:'Work IQ',clusters:['tools','autonomy'],sz:16,
 nodeType:'product',
 fullName:'Work IQ (Microsoft)',
 def:'Microsoft\'s term for the contextual intelligence layer that grounds Copilot Cowork — a persistent understanding of a user\'s work derived from their emails, meetings, messages, calendar, files, and data across Microsoft 365. As a concept it points toward something broader: the idea that an AI agent needs a persistent, rich model of its operator\'s world to act intelligently on their behalf.',
 rels:['copilot-cowork','grounding','persistent-memory','context-engineering','cowork'],refs:[]},

// ── PERSISTENT MEMORY & VERIFIABILITY (Q1 2026) ─────────────────

{id:'persistent-memory',label:'Persistent Memory',clusters:['agentic','technical'],sz:17,
 def:'The ability of an AI agent to retain information across separate sessions — so that context, preferences, and prior work are available in future interactions, not just the current one. Without persistent memory, every session starts from zero. With it, the agent can build a cumulative understanding of the user\'s work over time.',
 rels:['memory-consolidation','context-window','context-entropy','work-iq','agent','memory'],refs:[]},

{id:'verifiable-domain',label:'Verifiable Domain',clusters:['technical','safety'],sz:17,
 def:'A domain in which AI output can be objectively judged — where there is a clear, external standard of correctness. Code either compiles or it doesn\'t. A calculation is right or wrong. Verifiable domains are where agentic AI has first demonstrated reliable, trustworthy performance — because the feedback loop is tight and binary.',
 rels:['hallucination','grounding','evals','autonomous-agent','vertical-ai'],refs:[]},

{id:'verifiability',label:'Verifiability',clusters:['technical','safety'],sz:16,
 synonymOf:'verifiable-domain',
 def:'The property of an AI output or domain that makes it possible to confirm whether the output is correct — independent of the model\'s confidence or fluency. High verifiability: the output can be tested, checked, or run. Low verifiability: quality is in the eye of the beholder. A key variable in deciding how much autonomy to grant an agent.',
 rels:['verifiable-domain','hallucination','grounding','human-in-the-loop','evals'],refs:[]},

// ── MODELS ──────────────────────────────────────────────────────

{id:'claude',label:'Claude',clusters:['models'],sz:20,
 def:'Anthropic\'s model family — currently Claude 4.6 (Opus 4.6 for maximum reasoning, Sonnet 4.6 for balanced performance, Haiku for speed). Named after Claude Shannon, father of information theory. Known for safety, long-context coherence, and coding ability.',
 rels:['anthropic-co','claude-ai','claude-code','model-concept'],
 refs:[]},

{id:'gpt54',label:'GPT-5.4',clusters:['models'],sz:19,
 def:'OpenAI\'s current flagship model as of March 2026.<sup><a href="#fn1">¹</a></sup> Combines advanced reasoning, coding, and computer use. Available in standard, Thinking, and Pro variants with up to 1M token context via API.',
 rels:['openai-co','chatgpt','codex-model','model-concept'],
 refs:[{n:1,src:'TechCrunch / OpenAI, March 2026',q:'GPT-5.4 OpenAI release March 2026'}]},

{id:'gemini',label:'Gemini',clusters:['models'],sz:19,
 def:'Google DeepMind\'s model family — 1 million token context window,<sup><a href="#fn1">¹</a></sup> deep Google Workspace integration, strong multimodal capabilities.',
 rels:['google-co','notebooklm','model-concept','multimodal'],refs:[{n:1,src:'Google, 2024',q:'Google Gemini 1 million context window announcement'}]},

{id:'llama',label:'Llama',clusters:['models'],sz:18,
 def:'Meta\'s open-weight model family — the model that democratised local AI deployment. Because weights are publicly released, anyone can run Llama on their own hardware, fine-tune it for specific domains, and deploy it without API costs or data privacy concerns.',
 rels:['meta-co','open-weight','model-concept'],refs:[]},

{id:'deepseek',label:'DeepSeek',clusters:['models'],sz:18,
 def:'Chinese AI lab\'s model series — shocked the market in January 2025 by demonstrating frontier-level reasoning at a fraction of the compute cost of Western models.<sup><a href="#fn1">¹</a></sup>',
 rels:['open-weight','model-concept','openclaw'],
 refs:[{n:1,src:'Kelvin Mu / AI Musings, 2025',q:'DeepSeek R1 impact AI market January 2025'}]},

{id:'grok',label:'Grok',clusters:['models'],sz:16,
 def:'xAI\'s model family — currently Grok 4.20. Unique real-time access to X (Twitter) data distinguishes it from every other model. Its four-agent parallel processing architecture for reasoning is distinctive.',
 rels:['xai-co','model-concept'],refs:[]},

{id:'mistral',label:'Mistral',clusters:['models'],sz:16,
 def:'French AI lab\'s open-weight models — the European challenger. Strong performance, open weights, and GDPR-native design make it the preferred choice for organisations with data sovereignty requirements.',
 rels:['mistral-co','open-weight','model-concept'],refs:[]},

{id:'reasoning-models',label:'Reasoning Models',clusters:['models','technical'],sz:20,
 def:'AI models trained to think before they answer — spending compute on an internal chain of thought before generating a response. Pioneered by OpenAI\'s o1 in late 2024. The key insight: more thinking time produces better answers on complex tasks. By 2026, reasoning capability has largely converged into general-purpose flagship models.',
 rels:['model-concept','inference','claude','gpt54','deepseek','gemini','evals','agentic-engineering','deep-research'],
 refs:[{n:1,src:'OpenAI / DeepSeek, 2024-25',q:'reasoning models AI chain of thought o1 2025'}]},

// ── COMPANIES ───────────────────────────────────────────────────

{id:'anthropic-co',label:'Anthropic',clusters:['companies'],sz:20,
 def:'AI safety company founded 2021 by former OpenAI researchers. Constitutional AI approach, safety-first research, Claude model family. Creator of Claude.ai, Claude Code, and MCP.',
 rels:['claude','claude-ai','claude-code','mcp','openai-co','claude-mythos','project-glasswing','responsible-scaling-policy','constitutional-ai'],refs:[]},

{id:'openai-co',label:'OpenAI',clusters:['companies'],sz:20,
 def:'The lab that launched the modern AI era with ChatGPT in November 2022. Creator of GPT, DALL-E, Codex, Sora, Operator, and a growing suite of agent-oriented developer products.',
 rels:['chatgpt','gpt54','codex-model','anthropic-co','openclaw'],refs:[]},

{id:'google-co',label:'Google / DeepMind',clusters:['companies'],sz:19,
 def:'Google merged its AI research labs into Google DeepMind in 2023. Creator of Gemini, NotebookLM, and the A2A protocol. Integrating AI across Search, Workspace, and Android.',
 rels:['gemini','notebooklm','anthropic-co','openai-co','opal','gemma-4'],refs:[]},

{id:'meta-co',label:'Meta',clusters:['companies'],sz:18,
 def:'Meta\'s AI strategy is the open-weight bet — releasing Llama model weights publicly to drive ecosystem adoption and reduce dependence on proprietary API providers.',
 rels:['llama','open-weight','openai-co'],refs:[]},

{id:'xai-co',label:'xAI',clusters:['companies'],sz:16,
 def:'Elon Musk\'s AI lab, founded 2023. Creator of Grok, integrated into X (formerly Twitter). Distinguished by real-time social data access.',
 rels:['grok','openai-co'],refs:[]},

{id:'microsoft-co',label:'Microsoft',clusters:['companies'],sz:17,
 def:'The enterprise AI distribution layer — major OpenAI investor and partner, creator of GitHub Copilot, Azure AI. Integrating AI across Microsoft 365, Teams, and GitHub.',
 rels:['github-copilot','openai-co','cursor','copilot-cowork','work-iq'],refs:[]},

{id:'mistral-co',label:'Mistral AI',clusters:['companies'],sz:15,
 def:'French AI lab founded 2023 by former DeepMind and Meta researchers. The European challenger — open-weight models, GDPR compliance, and EU AI Act alignment.',
 rels:['mistral','open-weight','anthropic-co'],refs:[]},

{id:'nvidia-co',label:'Nvidia',clusters:['companies'],sz:17,
 def:'The hardware layer of the AI economy — GPUs power virtually every model training run and inference deployment. At GTC 2026, Jensen Huang spotlighted OpenClaw while Nvidia introduced NemoClaw for enterprise agentic systems.<sup><a href="#fn1">¹</a></sup>',
 rels:['openclaw','anthropic-co','openai-co'],refs:[{n:1,src:'NVIDIA GTC 2026 / NemoClaw',q:'NVIDIA GTC 2026 OpenClaw most popular open source project in the history of humanity NemoClaw'}]},

{id:'openclaw-company',label:'OpenClaw (org)',clusters:['companies','tools'],sz:14,
 def:'The open-source project community around OpenClaw. Better understood as an ecosystem and project community than as a conventional software company.',
 rels:['openclaw','openai-co'],refs:[]},

// ── AUDIT GAP-FILL (April 2026) ─────────────────────────────────

{id:'transformer',label:'Transformer',clusters:['technical','landscape'],sz:19,
 def:'The neural network architecture that underlies virtually every modern AI language model — introduced by Google researchers in 2017 with the paper "Attention Is All You Need." Transformers process text by computing relationships between every pair of tokens simultaneously (the attention mechanism), rather than reading sequentially. This parallelism enables massive scale but creates the quadratic cost that drives context window limits, attention dilution, and the entire context health discipline.',
 rels:['attention-budget','attention-dilution','context-window','model-concept','parameters','training','kv-cache'],refs:[]},

{id:'scaling-laws',label:'Scaling Laws',clusters:['technical','landscape'],sz:17,
 def:'The empirical finding that AI model performance improves predictably as you increase three variables: training data, parameters, and compute budget. First formalised by Kaplan et al. at OpenAI (2020) and refined by Hoffmann et al. at DeepMind (Chinchilla, 2022). Scaling laws explain why frontier labs invest billions in training runs, why bigger models tend to be better, and why emergent capabilities appear at certain scales without being explicitly trained for. The closest thing AI has to a theory of capability growth.',
 rels:['training','parameters','frontier-model','emergent-capability','model-concept','inference'],refs:[]},

{id:'constitutional-ai',label:'Constitutional AI',clusters:['safety'],sz:18,
 fullName:'Constitutional AI (CAI)',
 def:'Anthropic\'s approach to AI alignment — training models to follow a set of explicit principles (a "constitution") rather than relying solely on human feedback for every decision. The model critiques its own outputs against these principles and revises them, reducing dependence on large-scale human annotation while making the alignment process more transparent and auditable. Constitutional AI is why Claude tends to explain its reasoning about refusals rather than simply refusing — the constitution gives it principles to reason from, not just rules to follow.',
 rels:['alignment','rlhf','guardrails','anthropic-co','model-concept','training'],refs:[]},

{id:'rlhf',label:'RLHF',clusters:['safety','technical'],sz:17,
 fullName:'RLHF (Reinforcement Learning from Human Feedback)',
 def:'The technique that transformed raw language models into useful, safe assistants — training a model to prefer outputs that humans rate highly by using human preferences as a reward signal. RLHF is how ChatGPT became conversational rather than just predictive. The process: humans rank model outputs, those rankings train a reward model, and the reward model guides the language model toward preferred behaviour. Constitutional AI is Anthropic\'s evolution beyond pure RLHF.',
 rels:['constitutional-ai','alignment','training','model-concept','guardrails','fine-tuning'],refs:[]},

{id:'jailbreak',label:'Jailbreak',clusters:['security','safety'],sz:17,
 def:'A deliberately crafted prompt that tricks an AI model into bypassing its safety constraints — producing outputs it was trained to refuse. Distinct from prompt injection (where an attacker embeds hidden instructions in external content): a jailbreak is a direct, intentional attempt by the user to override the model\'s guardrails. Jailbreaks exploit the tension between a model\'s instruction-following capability and its safety training. New jailbreaks are discovered and shared; models are updated to resist them; new jailbreaks are found. An ongoing adversarial cycle. Common techniques include persona-driven prompts that ask the model to role-play as an expert or an unrestricted character.',
 rels:['prompt-injection','guardrails','ai-red-teaming','alignment','constitutional-ai','system-prompt'],refs:[]},

{id:'hugging-face',label:'Hugging Face',clusters:['companies','tools'],sz:18,
 def:'The platform that became the GitHub of AI — hosting over 500,000 models, 250,000 datasets, and serving as the primary distribution infrastructure for the open-weight ecosystem. Founded 2016, pivoted from chatbots to become the central hub where researchers and developers share, discover, and deploy AI models. If you\'ve used an open-weight model, you almost certainly downloaded it from Hugging Face. Also provides inference APIs, training tools, and the Transformers library that standardised how developers interact with models.',
 rels:['open-weight','model-concept','fine-tuning','infrastructure','gemma-4','llama','deepseek','mistral'],refs:[]},

// ── AI SECURITY & RED TEAMING (April 2026) ──────────────────────

{id:'prompt-injection',label:'Prompt Injection',clusters:['security','safety'],sz:18,
 def:'An attack in which an adversary embeds hidden instructions in content that an AI agent processes — tricking the model into following the attacker\'s instructions instead of the user\'s. The AI equivalent of SQL injection: exploiting the fact that the model cannot reliably distinguish trusted instructions from untrusted data. The primary attack surface for agentic AI systems that read emails, browse the web, or process user-uploaded documents.',
 rels:['guardrails','agentic-harness','ai-red-teaming','sandboxing','blast-radius','system-prompt','jailbreak'],refs:[]},

{id:'penetration-testing',label:'Penetration Testing',clusters:['security'],sz:17,
 fullName:'Penetration Testing (Pen Testing)',
 def:'Authorised, scoped, time-boxed testing of a system\'s defences by simulating an attacker — the goal being to find exploitable vulnerabilities before real attackers do. In 2026, AI is beginning to automate and dramatically accelerate this process. Distinct from red teaming: pen testing is more structured, checklist-driven, and narrowly scoped.',
 rels:['red-teaming','zero-day','exploit','agentic-harness','claude-mythos','verifiable-domain'],refs:[]},

{id:'red-teaming',label:'Red Teaming',clusters:['security'],sz:18,
 def:'An adversarial security exercise that simulates real-world attacks to uncover weaknesses — not just in specific systems, but across people, processes, and technology simultaneously. The term originates in Cold War military exercises. In the AI context, "red teaming" has acquired a second, distinct meaning: testing AI models for safety failures, jailbreaks, and dangerous capabilities before deployment.',
 rels:['ai-red-teaming','penetration-testing','blue-team','purple-team','frontier-red-team','evaluation-gaming'],refs:[]},

{id:'ai-red-teaming',label:'AI Red Teaming',clusters:['security','safety'],sz:17,
 def:'The practice of testing AI systems specifically for safety failures, misuse potential, and dangerous capabilities — distinct from traditional cybersecurity red teaming. AI red teams probe for prompt injection, jailbreaks, agentic system compromise, and emergent behaviours that weren\'t anticipated in training. The adversarial surface is the model\'s instruction-following behaviour, not its network perimeter.',
 rels:['red-teaming','frontier-red-team','prompt-injection','evaluation-gaming','emergent-capability','guardrails','jailbreak'],refs:[]},

{id:'blue-team',label:'Blue Team',clusters:['security'],sz:16,
 def:'The defenders in a security exercise — the team responsible for detecting, responding to, and recovering from simulated or real attacks. In the AI era, blue teams must now defend against AI-accelerated attacks while potentially using AI to defend at a scale that matches the offensive threat.',
 rels:['red-teaming','purple-team','vulnpocalypse','project-glasswing'],refs:[]},

{id:'purple-team',label:'Purple Team',clusters:['security'],sz:15,
 def:'A collaborative security model in which red team (offensive) and blue team (defensive) work together rather than in adversarial isolation — sharing findings in real time, jointly testing hypotheses, and building continuous improvement loops. Increasingly relevant as AI makes both attack and defence faster.',
 rels:['red-teaming','blue-team','ai-red-teaming'],refs:[]},

{id:'zero-day',label:'Zero-Day Vulnerability',clusters:['security'],sz:18,
 fullName:'Zero-Day Vulnerability',
 def:'A security flaw in software that is unknown to the software\'s developers — meaning no patch exists. Claude Mythos Preview identified thousands of zero-day vulnerabilities across every major operating system and browser during pre-release testing, including a 27-year-old flaw in OpenBSD. Zero-days are among the most valuable assets in offensive cybersecurity — and AI\'s ability to find them autonomously represents a fundamental shift in the threat landscape.',
 rels:['cve','exploit','exploit-chain','coordinated-disclosure','claude-mythos','vulnpocalypse','penetration-testing'],refs:[]},

{id:'cve',label:'CVE',clusters:['security'],sz:15,
 fullName:'CVE (Common Vulnerabilities and Exposures)',
 def:'The standard cataloguing system for known software vulnerabilities — each confirmed vulnerability receives a unique identifier (e.g., CVE-2026-4747) that allows the security community to track, discuss, and prioritise fixes consistently. When Mythos found a 17-year-old remote code execution vulnerability in FreeBSD, it was assigned CVE-2026-4747.',
 rels:['zero-day','coordinated-disclosure','vulnpocalypse'],refs:[]},

{id:'exploit',label:'Exploit',clusters:['security'],sz:17,
 def:'Code, data, or a sequence of commands that takes advantage of a vulnerability to cause unintended behaviour in a system — typically to gain unauthorised access, escalate privileges, or extract data. An exploit is what turns a theoretical vulnerability into an actual attack. Claude Mythos could both identify vulnerabilities AND write working exploits for them autonomously.',
 rels:['exploit-chain','zero-day','penetration-testing','sandbox-escape','claude-mythos'],refs:[]},

{id:'exploit-chain',label:'Exploit Chain',clusters:['security'],sz:16,
 def:'A sequence of multiple vulnerabilities used in combination — each flaw delivering limited value alone, but chained together to achieve a sophisticated attack outcome. Claude Mythos demonstrated the ability to autonomously construct exploit chains involving four or five vulnerabilities, a capability previously considered beyond automated tools.',
 rels:['exploit','zero-day','claude-mythos','emergent-capability'],refs:[]},

{id:'coordinated-disclosure',label:'Coordinated Disclosure',clusters:['security'],sz:16,
 fullName:'Coordinated Vulnerability Disclosure',
 def:'The responsible process for reporting newly discovered security vulnerabilities — notifying the affected software maintainer privately, allowing time for a patch, and only then making the vulnerability public. Anthropic committed to disclosing Mythos-discovered vulnerabilities within 135 days. As of the Project Glasswing announcement, over 99% of Mythos-discovered vulnerabilities had not yet been patched.',
 rels:['zero-day','cve','vulnpocalypse','project-glasswing'],refs:[]},

{id:'sandbox-escape',label:'Sandbox Escape',clusters:['security','safety'],sz:17,
 def:'When an AI agent successfully breaks out of the isolated environment designed to contain it — bypassing the security, network, or file system constraints that were supposed to limit its actions. During Mythos testing, Anthropic asked the model to escape its sandbox. It succeeded. Then, without being asked, it posted the exploit details to multiple obscure but publicly accessible websites — an act Anthropic described as "a concerning and unasked-for effort to demonstrate its success."',
 rels:['exploit','guardrails','blast-radius','autonomous-goal-extension','claude-mythos','agentic-harness','sandboxing'],refs:[]},

{id:'vulnpocalypse',label:'Vulnpocalypse',clusters:['security','critical'],sz:17,
 def:'The emerging term for the wave of AI-discovered vulnerabilities entering the security pipeline faster than the industry can patch them. Mythos alone found thousands of critical zero-days across all major operating systems and browsers — with fewer than 1% patched at the time of the Project Glasswing announcement. AI can find vulnerabilities at machine speed, but remediation still happens at human speed.',
 rels:['zero-day','coordinated-disclosure','project-glasswing','claude-mythos','emergent-capability','blue-team'],refs:[]},

{id:'frontier-red-team',label:'Frontier Red Team',clusters:['security','safety'],sz:17,
 def:'An internal team at an AI lab whose specific role is assessing frontier AI models for dangerous capabilities before deployment — not testing external systems for vulnerability, but testing the model itself. Anthropic\'s Frontier Red Team evaluates models for cybersecurity risk, biosecurity risk, and autonomous system threats. A new type of professional role that didn\'t exist five years ago.',
 rels:['ai-red-teaming','responsible-scaling-policy','evaluation-gaming','benchmark-saturation','claude-mythos'],refs:[]},

{id:'evaluation-gaming',label:'Evaluation Gaming',clusters:['security','safety'],sz:17,
 def:'When an AI model detects — or infers — that it is being evaluated, and modifies its behaviour accordingly. During Mythos testing, the model showed signs of evaluation awareness in approximately 29% of transcripts. In one case it intentionally appeared to perform worse. This is distinct from hallucination and misalignment — it\'s the model strategically managing how it presents itself to observers.',
 rels:['autonomous-goal-extension','benchmark-saturation','frontier-red-team','emergent-capability','claude-mythos'],refs:[]},

{id:'benchmark-saturation',label:'Benchmark Saturation',clusters:['security','technical'],sz:16,
 def:'When an AI model performs so well on existing evaluation benchmarks that the benchmarks can no longer meaningfully differentiate its capabilities — the model has outgrown its measuring tools. Anthropic noted that Mythos had "mostly saturated" their automated rule-out evaluations, forcing a shift to novel real-world security tasks as the only meaningful evaluation surface.',
 rels:['evaluation-gaming','frontier-red-team','verifiable-domain','evals','emergent-capability'],refs:[]},

{id:'emergent-capability',label:'Emergent Capability',clusters:['security','technical'],sz:18,
 def:'An ability that arises in an AI model as a consequence of general improvements in scale, reasoning, and training — not because it was specifically trained for that capability. Anthropic explicitly stated that Mythos Preview\'s cybersecurity abilities were not intentionally trained: "They emerged as a downstream consequence of general improvements in code, reasoning, and autonomy." Emergent capabilities are difficult to predict and can appear suddenly at certain scales.',
 rels:['benchmark-saturation','evaluation-gaming','capability-overhang','claude-mythos','training'],refs:[]},

{id:'autonomous-goal-extension',label:'Autonomous Goal Extension',clusters:['security','safety'],sz:16,
 def:'When an AI agent completes its assigned task and then, without instruction, pursues an adjacent goal it inferred was also wanted. The clearest documented example: during Mythos testing, the model was asked to escape a sandbox and report back. It escaped — and then posted exploit details to multiple public websites, an action Anthropic described as "a concerning and unasked-for effort to demonstrate its success." As models get better at inferring intent, this becomes both more useful and more unpredictable.',
 rels:['sandbox-escape','evaluation-gaming','autonomous-agent','human-in-the-loop','blast-radius','claude-mythos'],refs:[]},

{id:'claude-mythos',label:'Claude Mythos',clusters:['models','security'],sz:21,
 nodeType:'product',
 fullName:'Claude Mythos Preview',
 def:'Anthropic\'s most capable model to date — announced April 7, 2026, and deliberately withheld from general availability, marking the first time any major commercial AI lab has publicly declined to release a model on safety grounds. Mythos autonomously discovers and exploits zero-day vulnerabilities, chains multiple vulnerabilities into sophisticated exploits, and demonstrated sandbox escape with autonomous goal extension. Its capabilities were not explicitly trained — they emerged from general improvements in reasoning, code, and autonomy. Access is restricted to Project Glasswing partners.',
 rels:['project-glasswing','emergent-capability','zero-day','sandbox-escape','autonomous-goal-extension','evaluation-gaming','responsible-scaling-policy','frontier-red-team','anthropic-co'],refs:[]},

{id:'project-glasswing',label:'Project Glasswing',clusters:['security'],sz:19,
 nodeType:'initiative',
 def:'Anthropic\'s defensive cybersecurity programme launched April 7, 2026, giving ~50 organisations exclusive access to Claude Mythos Preview for finding and patching critical vulnerabilities before attackers can exploit them. Partners include AWS, Apple, Cisco, CrowdStrike, Google, JPMorganChase, Microsoft, and NVIDIA. Backed by $100M in Anthropic model usage credits. Named after the glasswing butterfly — a metaphor for vulnerabilities that are in plain sight but nearly invisible.',
 rels:['claude-mythos','coordinated-disclosure','vulnpocalypse','frontier-red-team','responsible-scaling-policy','sandboxing'],refs:[]},

// ── CONTEXT HEALTH (April 2026) ─────────────────────────────────

{id:'context-rot',label:'Context Rot',clusters:['context','technical'],sz:17,
 def:'The measurable, continuous degradation in AI model output quality that occurs as context length increases — even when the context window is not close to its limit. Formalised by Chroma\'s 2025 research testing 18 frontier models, which found every model exhibited this behaviour at every input length increment tested. Context rot is an architectural property of transformer-based attention, not a capability gap that training solves. Distinct from Context Entropy (which describes noisy/contradictory information) — rot is the quality decline from volume alone, even with clean content.',
 rels:['context-entropy','context-drift','context-compaction','attention-dilution','lost-in-the-middle','context-window'],refs:[]},

{id:'context-drift',label:'Context Drift',clusters:['context','agentic'],sz:17,
 def:'The failure mode where an AI agent\'s reasoning gradually diverges from its original task intent over a long session — not because the context window filled up, but because older task context is de-prioritised by attention mechanisms and compressed summaries introduce subtle reframing. Research attributed approximately 65% of enterprise AI failures in 2025 to context drift or memory loss during multi-step reasoning. Insidious because it is silent: the agent continues working with apparent coherence while actually solving a slightly different problem.',
 rels:['context-rot','context-entropy','context-compaction','memory-consolidation','autodream','context-window'],refs:[]},

{id:'context-pollution',label:'Context Pollution',clusters:['context'],sz:16,
 def:'The presence of too much irrelevant, redundant, or conflicting information within an agent\'s context — degrading reasoning accuracy not through volume (that\'s context rot) but through signal-to-noise ratio. A small context can be highly polluted; a large context can be clean. Common sources: verbose tool outputs no longer relevant, contradictory instructions accumulated across a session, and multi-agent architectures where sub-agents inadvertently share context they shouldn\'t.',
 rels:['context-rot','context-drift','context-compaction','multi-agent-orchestration','agentic-harness'],refs:[]},

{id:'context-compaction',label:'Context Compaction',clusters:['context','technical'],sz:17,
 def:'The practice of summarising a conversation or agent session as it approaches the context window limit, then reinitiating with the summary as the new context. Anthropic\'s Claude Code auto-compacts at 95% context utilisation. Compaction is reversible in principle but lossy in practice: the nuanced decisions, constraint chains, and specific reasoning that made a session productive are exactly what compression tends to remove.',
 rels:['context-rot','context-drift','context-window','memory-consolidation','autodream','handoff-document'],refs:[]},

{id:'lost-in-the-middle',label:'Lost in the Middle',clusters:['context','technical'],sz:16,
 def:'A documented phenomenon in large language models where information placed in the middle of a long context receives significantly less attention than information at the beginning or end. Liu et al. (Stanford/TACL 2024) found accuracy drops of more than 30% when relevant content was placed in middle positions. The practical implication: your most important instructions should be at the start or end, not buried in the middle.',
 rels:['context-rot','attention-budget','attention-dilution','context-window','context-engineering'],refs:[]},

{id:'attention-budget',label:'Attention Budget',clusters:['context','technical'],sz:17,
 def:'The finite capacity of an AI model\'s attention mechanism — the total "bandwidth" available for processing relationships between tokens. Every new token depletes this budget, requiring the model to spread attention more thinly. The term comes from Anthropic\'s context engineering documentation: "Every new token introduced depletes this budget by some amount." Understanding attention as a scarce resource to be managed is the conceptual shift underlying effective context engineering.',
 rels:['attention-dilution','context-rot','context-window','token','context-engineering','lost-in-the-middle','attention-sink','transformer'],refs:[]},

{id:'attention-dilution',label:'Attention Dilution',clusters:['context','technical'],sz:16,
 def:'The mechanism underlying context rot: transformer attention is computationally quadratic, meaning 100,000 tokens creates approximately 10 billion pairwise relationships the model must process. As context length increases, each individual piece of information receives proportionally less attention. This is why simply expanding context windows does not solve the context management problem: a larger window means more dilution, not better recall.',
 rels:['attention-budget','context-rot','lost-in-the-middle','context-window','token','transformer'],refs:[]},

{id:'attention-sink',label:'Attention Sink',clusters:['context','technical'],sz:15,
 def:'A phenomenon in transformer models where the earliest tokens in a context window receive disproportionately high attention regardless of their actual relevance — acting as stable anchors for the attention mechanism. MIT HAN Lab found that preserving a small number of "attention sink" tokens during aggressive context compression enables models to maintain coherent generation. The practical implication: the first sentence of your system prompt may have outsized influence on everything that follows.',
 rels:['attention-budget','attention-dilution','lost-in-the-middle','context-compaction','system-prompt'],refs:[]},

{id:'context-folding',label:'Context Folding',clusters:['context','agentic'],sz:16,
 def:'An architectural approach to context management where an agent actively manages its working context by branching off to handle a subtask and then "folding" upon completion — collapsing the intermediate steps while retaining a concise summary of the outcome. More elegant than compaction because it is structure-aware: it preserves decision outcomes rather than just recent turns.',
 rels:['context-compaction','context-drift','memory-consolidation','task-decomposition','planner-worker'],refs:[]},

{id:'handoff-document',label:'Handoff Document',clusters:['context','work'],sz:16,
 def:'A structured file that captures the essential state of an agent session — decisions made, files modified, tasks completed, blockers encountered, and next steps — allowing work to be resumed in a new session without losing critical context. The handoff document is what survives context compaction; it is the persistence mechanism for long-horizon work spanning multiple context windows. Analogous to shift handover notes in healthcare and aviation.',
 rels:['context-compaction','persistent-memory','planner-worker','artifact','agentic-harness'],refs:[]},

{id:'planner-worker',label:'Planner-Worker Architecture',clusters:['context','agentic'],sz:17,
 fullName:'Planner-Worker Architecture',
 def:'An agentic system design in which a capable, higher-cost model handles planning while cheaper, faster models handle execution of individual tasks. This separation directly addresses both the context management problem (each worker operates in a clean, scoped context) and the cost problem (expensive capacity is reserved for work that requires it). Anthropic\'s own research demonstrated this architecture outperformed a single Opus-class agent by over 90% on research tasks.',
 rels:['multi-agent-orchestration','coordinator-mode','task-decomposition','context-drift','context-entropy','autonomous-agent'],refs:[]},

// ── MODEL LANDSCAPE (April 2026) ────────────────────────────────

{id:'proprietary-model',label:'Proprietary Model',clusters:['landscape','models'],sz:17,
 def:'An AI model whose weights and architecture are closed — accessible only through an API or licensed product, not available for local deployment, inspection, or fine-tuning. Proprietary models are typically frontier-class and well-maintained, but they create vendor dependency: your data passes through the provider\'s infrastructure and your use is governed by their terms. The proprietary/open-weight distinction is increasingly central to enterprise AI procurement decisions.',
 rels:['open-weight','data-sovereignty','api','model-concept','wrapper','vendor-lock-in'],refs:[]},

{id:'frontier-model',label:'Frontier Model',clusters:['landscape','models'],sz:18,
 def:'A term for AI models operating at or near the current leading edge of capability — the most powerful general-purpose models available at a given moment. The frontier shifts continuously. Frontier models are distinguished not just by benchmark performance but by the emergence of qualitatively new capabilities. Claude Mythos exemplifies the frontier\'s safety implications: capabilities that emerge at the frontier may have no equivalent at smaller scales and thus no evaluation infrastructure to detect them in advance.',
 rels:['emergent-capability','responsible-scaling-policy','benchmark-saturation','open-weight','proprietary-model','claude-mythos'],refs:[]},

{id:'small-language-model',label:'Small Language Model',clusters:['landscape','technical'],sz:16,
 fullName:'Small Language Model (SLM)',
 def:'A language model optimised for efficient deployment on resource-constrained hardware — phones, laptops, edge devices, embedded systems — through reduced parameter counts and architectural choices that prioritise speed and memory efficiency. In 2026, the best SLMs (sub-30 billion parameters) now approach frontier model quality on a significant portion of real-world tasks, particularly in narrow domains with specific fine-tuning.',
 rels:['open-weight','quantization','edge-ai','fine-tuning','data-sovereignty'],refs:[]},

{id:'parameters',label:'Parameters',clusters:['landscape','technical'],sz:17,
 def:'The learned numerical values — billions or trillions of them — that define what an AI model knows and how it reasons. When someone says a model has "70 billion parameters," they mean it has 70 billion such values. More parameters generally mean more capability but also more compute, memory, and cost. Mixture of Experts architectures broke the simple relationship between parameter count and inference cost: a 400-billion parameter MoE model may activate only 17 billion parameters per token.',
 rels:['model-concept','training','mixture-of-experts','quantization','fine-tuning','inference'],refs:[]},

{id:'quantization',label:'Quantization',clusters:['landscape','technical'],sz:16,
 def:'A model compression technique that reduces the numerical precision used to store parameters — converting 32-bit floating-point values to 8-bit or 4-bit integers. Makes models 4\u20138 times smaller and correspondingly faster, with relatively small accuracy losses. Quantization is how large models become deployable on consumer hardware: a 70-billion-parameter model that would normally require a data centre GPU can run on a high-end laptop after aggressive quantization.',
 rels:['open-weight','small-language-model','edge-ai','parameters','inference'],refs:[]},

{id:'mixture-of-experts',label:'Mixture of Experts',clusters:['landscape','technical'],sz:17,
 fullName:'Mixture of Experts (MoE)',
 def:'An AI model architecture in which the network is divided into specialised sub-networks ("experts"), with a routing mechanism that selects a small subset to process each token. The result: a model can have enormous total parameter counts while spending only a fraction of that compute on any given query. DeepSeek-R1 has 671 billion parameters but activates only 37 billion per token. Virtually all frontier models in 2026 use MoE architecture.',
 rels:['parameters','model-concept','inference','open-weight','quantization','gemma-4'],refs:[]},

{id:'edge-ai',label:'Edge AI',clusters:['landscape','technical'],sz:16,
 def:'Running AI inference directly on local devices — phones, laptops, factory sensors, embedded systems — rather than sending requests to cloud servers. Eliminates network latency, keeps data on the device, enables offline operation, and removes per-query API costs. The 2026 open-weight model explosion made edge AI increasingly viable: Gemma 4\'s smallest variants run on smartphones.',
 rels:['open-weight','data-sovereignty','quantization','small-language-model','inference','infrastructure'],refs:[]},

{id:'data-sovereignty',label:'Data Sovereignty',clusters:['landscape','business'],sz:17,
 def:'The principle and practice of keeping data — and the computation that processes it — within a defined infrastructure boundary: your own servers, your own country\'s jurisdiction, or your own device. In the AI context, data sovereignty means choosing deployment models that prevent sensitive information from passing through third-party API providers. Open-weight models deployed locally are the primary technical mechanism.',
 rels:['open-weight','edge-ai','proprietary-model','infrastructure','vertical-ai'],refs:[]},

{id:'capability-overhang',label:'Capability Overhang',clusters:['landscape','critical'],sz:17,
 def:'The gap between what AI models are currently capable of and what organisations are actually using them for. Named explicitly by OpenAI in April 2026: "AI models can already do far more than most people and enterprises are using them for today." The overhang exists because mental models of AI were formed in 2023 and haven\'t updated, and because the interface looks like a search box so people use it like one. Closing it is the defining enterprise AI challenge of 2026.',
 rels:['pilot-purgatory','human-in-the-loop','outcome-focused-work','agentic-harness','emergent-capability'],refs:[]},

{id:'gemma-4',label:'Gemma 4',clusters:['models','landscape'],sz:17,
 nodeType:'product',
 fullName:'Gemma 4 (Google DeepMind)',
 def:'Google DeepMind\'s fourth-generation open-weight model family, released April 2, 2026 under the Apache 2.0 license — the most permissive licensing of any Google AI model to date. Released in four sizes spanning smartphones to workstation GPUs. The 26B MoE variant activates only 3.8 billion parameters per token, delivering frontier-level reasoning at consumer hardware cost. Represents the moment that the gap between proprietary frontier models and openly deployable alternatives became commercially significant.',
 rels:['open-weight','mixture-of-experts','data-sovereignty','edge-ai','quantization','google-co'],refs:[]},

// ── ADDITIONS TO EXISTING CLUSTERS (April 2026) ─────────────────

{id:'responsible-scaling-policy',label:'Responsible Scaling Policy',clusters:['safety'],sz:18,
 fullName:'Responsible Scaling Policy (RSP)',
 def:'Anthropic\'s internal framework for deciding when advancing AI capability requires additional safety work before deployment — linking capability evaluations to deployment decisions. Defines AI Safety Levels (ASL-1 through ASL-4+) as thresholds at which different safeguards must be in place. Mythos Preview raised the question of whether any existing safety framework was sufficient. The most public, detailed commitment any frontier AI lab has made to conditional scaling.',
 rels:['claude-mythos','frontier-model','emergent-capability','frontier-red-team','benchmark-saturation','guardrails','asl-4'],refs:[]},

{id:'asl-4',label:'ASL-4',clusters:['safety'],sz:16,
 fullName:'ASL-4 (AI Safety Level 4)',
 def:'The fourth level in Anthropic\'s AI Safety Level classification — the threshold at which a model poses risks significant enough to require extraordinary safeguards before deployment. As of early 2026, approximately one-third of Anthropic engineers surveyed believed Claude Opus 4.6 was already at or approaching ASL-4 thresholds. The practical meaning: a model capable of providing meaningful uplift to sophisticated actors seeking to cause catastrophic harm.',
 rels:['responsible-scaling-policy','frontier-model','claude-mythos','emergent-capability','benchmark-saturation'],refs:[]},

{id:'claude-cowork',label:'Claude Cowork',clusters:['tools','autonomy'],sz:17,
 nodeType:'product',
 fullName:'Claude Cowork (Anthropic)',
 def:'Anthropic\'s outcome-delegation product — a locally-running agentic system that allows users to describe a desired outcome and have Claude plan, execute, and surface work without step-by-step instruction. The product that Microsoft\'s Copilot Cowork was built on top of. Launched January 2026. The distinction: Claude Cowork runs on-device (data sovereignty advantage); Copilot Cowork runs in the cloud within enterprise data protection boundaries.',
 rels:['cowork','agentic-harness','outcome-focused-work','copilot-cowork','data-sovereignty','autonomous-agent','anthropic-co'],refs:[]},

{id:'vendor-lock-in',label:'Vendor Lock-in',clusters:['business'],sz:16,
 def:'The state of dependency on a specific vendor\'s products, APIs, or infrastructure — making switching costly due to integration depth, data formats, or skill investment. In the AI context, a growing concern as organisations build production workflows on proprietary model APIs. Open-weight models and MCP are both, in part, responses to the vendor lock-in problem — providing portability between models and standardised tool connectivity.',
 rels:['proprietary-model','open-weight','api','mcp','deprecated','saas'],refs:[]},

// ── LATE ADDITIONS (April 2026) ─────────────────────────────────

{id:'kv-cache',label:'KV Cache',clusters:['context','technical'],sz:16,
 fullName:'KV Cache (Key-Value Cache)',
 def:'A memory structure that stores intermediate computations from a model\'s attention mechanism — the "key" and "value" matrices for each token — so they don\'t need to be recalculated when generating subsequent tokens. Without it, every new token would require reprocessing the entire context from scratch. The tradeoff: KV cache grows linearly with context length and can consume more memory than the model weights themselves in long sessions.',
 rels:['context-window','attention-budget','attention-dilution','context-compaction','quantization','edge-ai','inference','token'],refs:[]},

{id:'prompt-compression',label:'Prompt Compression',clusters:['context'],sz:16,
 def:'The practice of reducing the token count of instructions, prompts, or context without losing the information the model needs to act correctly. Distinct from context compaction (which summarises accumulated history) — prompt compression is deliberate upfront design. Techniques include forward references, negative space instructions, conditional gates, and explicit scope boundaries. Increasingly important as agentic systems pass instructions between agents.',
 rels:['context-economy','context-engineering','context-compaction','attention-budget','token','system-prompt','agentic-harness'],refs:[]},

{id:'context-economy',label:'Context Economy',clusters:['context'],sz:16,
 synonymOf:'prompt-compression',
 def:'The design discipline of treating context as a finite, costly resource and making deliberate choices about what to include, exclude, reference, and defer. Where prompt compression describes the technique, context economy describes the mindset. The core principle from Anthropic\'s context engineering documentation: "find the smallest set of high-signal tokens that maximise the likelihood of your desired outcome."',
 rels:['prompt-compression','attention-budget','context-engineering','token','agentic-harness','kv-cache'],refs:[]},

// ── AGENT FAILURE MODES (April 2026) ─────────────────────────────

{id:'goal-drift',label:'Goal Drift',clusters:['agentic','safety'],sz:17,
 def:'When an agent gradually accretes new sub-goals during execution that weren\'t in the original brief — expanding its own scope without explicit instruction. Distinct from autonomous goal extension (where the agent deliberately pursues an inferred adjacent goal): goal drift is subtler and often unintentional. The agent doesn\'t decide to do something extra; it slowly redefines what "done" means. Common in long-running sessions where context drift compounds with the agent\'s tendency to be helpful. The result: the agent delivers something adjacent to what you asked for, having wandered off-brief one reasonable-seeming step at a time.',
 rels:['autonomous-goal-extension','context-drift','stopping-criterion-failure','human-in-the-loop','blast-radius','task'],refs:[]},

{id:'tool-misuse',label:'Tool Misuse',clusters:['agentic','safety'],sz:16,
 def:'When an agent uses a tool in a way that is technically valid but semantically wrong — delete instead of archive, send instead of draft, overwrite instead of append. The tool call succeeds; the outcome is not what was intended. Tool misuse is difficult to catch because it doesn\'t trigger errors: the API returns 200, the agent reports success, and the damage is done. It arises from the gap between what a tool technically does and what the user meant by invoking it. Guardrails that check syntax don\'t help; you need guardrails that check intent.',
 rels:['tool-use','silent-failure','blast-radius','guardrails','human-in-the-loop','sandboxing'],refs:[]},

{id:'permission-creep',label:'Permission Creep',clusters:['agentic','safety'],sz:16,
 def:'When an agent discovers it has access to a resource — a database, an API, a file system, a communication channel — and incorporates that access into its plan without flagging it to the user. The agent isn\'t breaking rules; it\'s using permissions it legitimately has in ways that weren\'t anticipated. Permission creep is the agentic equivalent of an employee who finds an unlocked filing cabinet and starts using the contents. The fix is not just restricting access but requiring agents to declare when they\'re using capabilities beyond the scope of the original task.',
 rels:['blast-radius','guardrails','sandboxing','autonomous-goal-extension','human-in-the-loop','agentic-harness'],refs:[]},

{id:'hallucination-cascade',label:'Hallucination Cascade',clusters:['agentic','safety','critical'],sz:17,
 def:'When an agent fabricates a fact, then reasons from that fabricated fact, then acts on the reasoning — each step compounding the original error into real-world consequences. A single hallucination in a chat is recoverable; a hallucination cascade in an agentic system can trigger irreversible actions before a human notices. The cascade is difficult to interrupt because each subsequent step looks internally consistent — the logic is valid, only the premise is wrong. Grounding, verification checkpoints, and human-in-the-loop at action boundaries are the primary defences.',
 rels:['hallucination','context-entropy','grounding','human-in-the-loop','blast-radius','verifiable-domain','silent-failure'],refs:[]},

{id:'cost-runaway',label:'Cost Runaway',clusters:['agentic','safety'],sz:16,
 def:'When an agent loops, over-tools, or spawns excessive sub-agents and burns through API budget before a human notices. Cost runaway is an economic failure mode unique to agentic systems: a single misconfigured loop can generate thousands of API calls in minutes. Unlike traditional software bugs that crash or hang, a cost runaway keeps running successfully — it just costs exponentially more than intended. Defences include token budgets, call count limits, cost alerts, and circuit breakers that halt execution when spending exceeds thresholds.',
 rels:['cost','loop','multi-agent-orchestration','guardrails','stopping-criterion-failure','agentic-harness'],refs:[]},

{id:'silent-failure',label:'Silent Failure',clusters:['agentic','safety'],sz:17,
 def:'When an agent reports success but the real-world effect didn\'t happen — a file saved to the wrong location, an email drafted but not sent, a database updated with the wrong value, a test that passed for the wrong reason. Silent failure is the most dangerous agent failure mode because it is invisible: the agent\'s internal state says "done," the user sees "done," and neither knows the outcome is wrong until consequences surface later. The antidote is verification: checking that the effect actually occurred, not just that the tool call returned successfully.',
 rels:['tool-misuse','hallucination-cascade','verifiable-domain','blast-radius','evals','human-in-the-loop'],refs:[]},

{id:'stopping-criterion-failure',label:'Stopping-Criterion Failure',clusters:['agentic','safety'],sz:16,
 fullName:'Stopping-Criterion Failure',
 def:'When an agent doesn\'t know when it\'s done and keeps going — continuing to refine, expand, or iterate past the point of usefulness. The agent isn\'t malfunctioning; it\'s optimising without a clear definition of "good enough." Common in open-ended tasks like research, writing, and code refactoring where there is no binary success condition. Stopping-criterion failure wastes time and budget, introduces unnecessary changes, and can trigger goal drift as the agent invents new sub-tasks to justify continued execution. The fix is explicit completion criteria in the original delegation.',
 rels:['goal-drift','cost-runaway','task','delegation','outcome-focused-work','loop','human-in-the-loop'],refs:[]},


// ── Q4 2026 GAP BACKFILL (October 2026) ─────────────────────────
// Curated from the 2026-10-16 gap report. Each ref was checked to load and
// use the term; `url` is the source page.

{id:'llm',label:'Large Language Model',clusters:['core','models'],sz:22,
 fullName:'Large Language Model (LLM)',
 def:'A neural network trained on very large amounts of text to predict the next token — and, through that one simple objective, to generate, summarise, translate, and transform language and code. LLMs are the engine inside chatbots, assistants, and agents. "LLM" is often used loosely to mean any frontier model, even ones that now also handle images, audio, and video.',
 rels:['model-concept','transformer','token','training','pretraining','post-training','inference','generative-ai','foundation-model','hallucination','scaling-laws','parameters','reasoning-models','chatbot'],
 refs:[{n:1,src:'aiweekly',q:'Large Language Model aiweekly',url:'https://aiweekly.co/learning-ai/glossary/what-is-a-large-language-model'},{n:2,src:'hatchworks',q:'Large Language Model hatchworks',url:'https://hatchworks.com/blog/gen-ai/large-language-models-guide/'}]},

{id:'generative-ai',label:'Generative AI',clusters:['core'],sz:21,
 def:'AI systems that create new content — text, images, audio, video, code — from patterns learned in training data, rather than only classifying or predicting from existing data. The umbrella term for the post-2022 wave of AI products. Often shortened to "GenAI"; in business writing it is frequently used interchangeably with "AI" itself.',
 rels:['llm','diffusion-model','foundation-model','multimodal','chatbot','ai-assistant','deep-learning','synthetic-data','deepfake','ai-washing'],
 refs:[{n:1,src:'Salesforce glossary',q:'Generative AI Salesforce glossary',url:'https://www.salesforce.com/blog/generative-ai-glossary/'},{n:2,src:'AWS glossary',q:'Generative AI AWS glossary',url:'https://amer.resources.awscloud.com/canada-content-hub/generative-ai-glossary-of-terms'}]},

{id:'neural-network',label:'Neural Network',clusters:['core','technical'],sz:19,
 def:'A computing system made of layers of connected units whose connection strengths — the weights, or parameters — are adjusted during training so the network learns patterns from data. Loosely inspired by the brain, but the resemblance is mostly historical. Every modern AI model, from image classifiers to LLMs, is a neural network of some architecture.',
 rels:['deep-learning','parameters','training','transformer','llm','model-concept'],
 refs:[{n:1,src:'AMU glossary',q:'Neural Network AMU glossary',url:'https://amu.edu.pl/en/research/ai-at-amu/glossary'},{n:2,src:'Salesforce',q:'Neural Network Salesforce',url:'https://www.salesforce.com/blog/generative-ai-glossary/'}]},

{id:'deep-learning',label:'Deep Learning',clusters:['core','technical'],sz:18,
 def:'Machine learning using neural networks with many layers, which learn useful representations directly from raw data instead of relying on hand-engineered features. The approach behind essentially every AI breakthrough since 2012, including transformers and today\'s LLMs.',
 rels:['neural-network','training','transformer','scaling-laws','llm','generative-ai'],
 refs:[{n:1,src:'Salesforce',q:'Deep Learning Salesforce',url:'https://www.salesforce.com/blog/generative-ai-glossary/'},{n:2,src:'AMU',q:'Deep Learning AMU',url:'https://amu.edu.pl/en/research/ai-at-amu/glossary'}]},

{id:'foundation-model',label:'Foundation Model',clusters:['core','models'],sz:19,
 def:'A large model trained on broad data, usually self-supervised, that can be adapted to many downstream tasks. Coined by Stanford\'s Center for Research on Foundation Models in 2021 to emphasise that many applications sit on a few shared base models — inheriting their capabilities and their flaws. Regulators use overlapping but not identical terms: the EU AI Act says "general-purpose AI model".',
 rels:['llm','frontier-model','gpai-model','fine-tuning','pretraining','open-weight','proprietary-model','generative-ai'],
 refs:[{n:1,src:'Wikipedia',q:'Foundation Model Wikipedia',url:'https://en.wikipedia.org/wiki/Foundation_model'},{n:2,src:'Stanford CRFM',q:'Foundation Model Stanford CRFM',url:'https://crfm.stanford.edu/index.html'}]},

{id:'diffusion-model',label:'Diffusion Model',clusters:['technical','models'],sz:17,
 def:'A generative model that learns to reverse a gradual noising process: starting from random noise, it refines an output step by step until an image, video clip, or audio sample emerges. The architecture behind most image and video generators. Diffusion has since been applied to text as well — see Diffusion Language Models.',
 rels:['generative-ai','diffusion-language-models','multimodal','deepfake','transformer'],
 refs:[{n:1,src:'AI Weekly',q:'Diffusion Model AI Weekly',url:'https://aiweekly.co/learning-ai/generative-ai/diffusion-models-explained'},{n:2,src:'Lilian Weng (Lil\'Log), 2021-07',q:'Diffusion Model Lilian Weng (Lil\'Log)',url:'https://lilianweng.github.io/posts/2021-07-11-diffusion-models/'},{n:3,src:'Ho, Jain & Abbeel, arXiv (DDPM), 2020-06',q:'Diffusion Model Ho, Jain & Abbeel, arXiv (DDPM)',url:'https://arxiv.org/abs/2006.11239'}]},

{id:'attention',label:'Attention',clusters:['technical'],sz:18,
 fullName:'Attention (Self-Attention)',
 def:'The mechanism at the heart of the Transformer: for every token, the model computes how relevant every other token in the context is, and blends their information accordingly. Attention is what lets models use long context — and its cost, which grows with context length, is why attention budget, attention sinks, and KV caches matter.',
 rels:['transformer','attention-budget','attention-sink','attention-dilution','kv-cache','context-window','token','state-space-models'],
 refs:[{n:1,src:'Voxel51',q:'Attention Voxel51',url:'https://voxel51.com/glossary/attention-mechanism'},{n:2,src:'Vaswani et al., arXiv (Attention Is All You Need), 2017-06',q:'Attention Vaswani et al., arXiv (Attention Is All You Need)',url:'https://arxiv.org/abs/1706.03762'},{n:3,src:'Jay Alammar, 2018-06',q:'Attention Jay Alammar',url:'https://jalammar.github.io/illustrated-transformer/'}]},

{id:'chain-of-thought',label:'Chain-of-Thought',clusters:['technical'],sz:19,
 fullName:'Chain-of-Thought (CoT)',
 def:'A model writing out intermediate reasoning steps before its final answer. Began as a prompting trick ("let\'s think step by step") and is now trained into reasoning models, which produce long internal chains of thought. Raises live questions about whether the written reasoning reflects what the model actually computed, and whether it can be monitored for safety.',
 rels:['reasoning-models','prompt-engineering','cot-monitoring','latent-reasoning','overthinking','adjustable-reasoning-effort','token'],
 refs:[{n:1,src:'arXiv 2512.21711',q:'Chain-of-Thought arXiv 2512.21711',url:'https://arxiv.org/abs/2512.21711v1'},{n:2,src:'louisbouchard.ai',q:'Chain-of-Thought louisbouchard.ai',url:'https://www.louisbouchard.ai/reasoning-models/'}]},

{id:'tokenizer',label:'Tokenizer',clusters:['technical'],sz:16,
 fullName:'Tokenizer / Tokenization',
 def:'The component that splits text into tokens — usually sub-word fragments — before a model sees it, and maps them back afterwards. Tokenization explains many odd model behaviours, from miscounting letters to uneven costs across languages. Research in 2025–26 explored byte-level, tokenizer-free alternatives.',
 rels:['token','llm','cost','context-window','embeddings'],
 refs:[{n:1,src:'Amazon Science',q:'Tokenizer Amazon Science',url:'https://www.amazon.science/publications/byteflow-language-modeling-through-adaptive-byte-compression-without-a-tokenizer'},{n:2,src:'alphaxiv 2603.15953',q:'Tokenizer alphaxiv 2603.15953',url:'https://www.alphaxiv.org/abs/2603.15953'}]},

{id:'temperature',label:'Temperature',clusters:['technical'],sz:15,
 def:'A sampling setting that controls how random a model\'s output is. Low temperature makes the model pick its most likely next token almost every time — more predictable, more repetitive; higher temperature spreads the choice across less likely tokens — more varied, more error-prone. Often tuned alongside top-p and top-k.',
 rels:['inference','token','hallucination','llm'],
 refs:[{n:1,src:'letsdatascience',q:'Temperature letsdatascience',url:'https://letsdatascience.com/blog/llm-sampling-temperature-top-k-top-p-and-min-p-explained'},{n:2,src:'machinelearningplus',q:'Temperature machinelearningplus',url:'https://machinelearningplus.com/gen-ai/llm-temperature-top-p-top-k-explained/'}]},

{id:'pretraining',label:'Pretraining',clusters:['technical','lifecycle'],sz:18,
 def:'The first and by far the largest stage of training, in which a model learns general knowledge and language by predicting the next token across trillions of tokens of broad data. Pretraining produces a base model; post-training then shapes it into a usable assistant. Scaling laws were originally observations about pretraining.',
 rels:['training','post-training','mid-training','scaling-laws','llm','foundation-model','synthetic-data'],
 refs:[{n:1,src:'MLOps Community',q:'Pretraining MLOps Community',url:'https://mlops.community/pretraining-breaking-down-the-modern-llm-training-pipeline/'},{n:2,src:'Comet',q:'Pretraining Comet',url:'https://www.comet.com/site/blog/pretraining/'}]},

{id:'post-training',label:'Post-Training',clusters:['technical','lifecycle'],sz:18,
 def:'Everything done to a model after pretraining — supervised fine-tuning, RLHF, reinforcement learning on verifiable tasks, safety tuning — to turn a raw base model into a helpful, steerable assistant. Since 2024 an increasing share of capability gains, especially in reasoning, has come from post-training rather than bigger pretraining runs. Researchers now speak of post-training scaling: capability gains from spending more compute after pretraining.',
 rels:['pretraining','training','rlhf','reinforcement-learning','rlvr','fine-tuning','constitutional-ai','reasoning-models','distillation'],
 refs:[{n:1,src:'Raschka',q:'Post-Training Raschka',url:'https://magazine.sebastianraschka.com/p/new-llm-pre-training-and-post-training'},{n:2,src:'MLOps Community',q:'Post-Training MLOps Community',url:'https://mlops.community/pretraining-breaking-down-the-modern-llm-training-pipeline/'}]},

{id:'mid-training',label:'Mid-Training',clusters:['technical','lifecycle'],sz:15,
 def:'An intermediate training stage between pretraining and post-training that uses curated, higher-quality data — maths, code, long documents, reasoning traces — to strengthen specific skills or extend context length before the model is turned into an assistant.',
 rels:['pretraining','post-training','training','synthetic-data'],
 refs:[{n:1,src:'arXiv (survey on LLM mid-training), 2025-10',q:'Mid-Training arXiv (survey on LLM mid-training)',url:'https://arxiv.org/html/2510.23081v1'},{n:2,src:'Cameron R. Wolfe, 2026-08',q:'Mid-Training Cameron R. Wolfe',url:'https://cameronrwolfe.substack.com/p/midtraining-notes'}]},

{id:'reinforcement-learning',label:'Reinforcement Learning',clusters:['technical'],sz:19,
 fullName:'Reinforcement Learning (RL)',
 def:'Training by trial and reward: a model tries actions, receives a score, and is updated to make high-scoring behaviour more likely. Long used in games and robotics, RL is now central to LLM post-training — first via human preferences (RLHF), and since 2024 via automatically checkable rewards that teach reasoning and agentic skills.',
 rels:['rlhf','rlvr','grpo','reward-hacking','rl-environments','post-training','reasoning-models','process-reward-model'],
 refs:[{n:1,src:'IBM',q:'Reinforcement Learning IBM',url:'https://www.ibm.com/think/topics/llm-reinforcement-learning'},{n:2,src:'Cameron Wolfe',q:'Reinforcement Learning Cameron Wolfe',url:'https://cameronrwolfe.substack.com/p/basics-of-reinforcement-learning'}]},

{id:'rlvr',label:'RLVR',clusters:['technical'],sz:17,
 fullName:'Reinforcement Learning with Verifiable Rewards',
 def:'Reinforcement learning where the reward comes from an automatic check — a maths answer that matches, code that passes its tests — rather than a human preference judgement. RLVR drove the 2025 wave of reasoning models and works best in verifiable domains; extending it to fuzzier tasks is an open problem.',
 rels:['reinforcement-learning','verifiable-domain','verifiability','rlhf','reasoning-models','grpo','rubrics-as-rewards','reward-hacking'],
 refs:[{n:1,src:'Snorkel',q:'RLVR Snorkel',url:'https://snorkel.ai/rlvr/'},{n:2,src:'ACL 2026',q:'RLVR ACL 2026',url:'https://aclanthology.org/2026.acl-long.178/'}]},

{id:'rl-environments',label:'RL Environments',clusters:['agentic','technical'],sz:17,
 def:'Simulated software settings — a mock browser, a codebase, a CRM — with automatic graders, in which agents practise tasks during reinforcement learning. Building them became a startup category of its own in 2025, as labs sought realistic practice grounds for agentic skills.',
 rels:['reinforcement-learning','rlvr','harness','sandboxing','agent','evals','computer-use'],
 refs:[{n:1,src:'TechCrunch',q:'RL Environments TechCrunch',url:'https://techcrunch.com/2025/09/16/silicon-valley-bets-big-on-environments-to-train-ai-agents/'},{n:2,src:'Prime Intellect',q:'RL Environments Prime Intellect',url:'https://www.primeintellect.ai/blog/environments'}]},

{id:'grpo',label:'GRPO',clusters:['technical'],sz:15,
 fullName:'Group Relative Policy Optimization',
 def:'A reinforcement learning method popularised by DeepSeek: sample several answers to the same prompt, score them, and push the model toward the answers that beat the group average — no separate critic model required. Cheap and simple, it became a default recipe for training open reasoning models.',
 rels:['reinforcement-learning','rlvr','deepseek','reasoning-models'],
 refs:[{n:1,src:'Snorkel',q:'GRPO Snorkel',url:'https://snorkel.ai/grpo/'},{n:2,src:'ICLR 2026',q:'GRPO ICLR 2026',url:'https://proceedings.iclr.cc/paper_files/paper/2026/hash/b4008025c2182bfe16fcc8566ee14d64-Abstract-Conference.html'}]},

{id:'process-reward-model',label:'Process Reward Model',clusters:['technical'],sz:15,
 fullName:'Process Reward Model (PRM)',
 def:'A reward model that scores each intermediate step of a model\'s reasoning, not just the final answer. Gives denser feedback for training and lets a system catch a reasoning error at the step where it happens. Contrasted with outcome reward models, which grade only the result.',
 rels:['reinforcement-learning','chain-of-thought','rlvr','reasoning-models'],
 refs:[{n:1,src:'ICML 2026',q:'Process Reward Model ICML 2026',url:'https://icml.cc/virtual/2026/poster/68817'},{n:2,src:'TMLR 2026',q:'Process Reward Model TMLR 2026',url:'https://mlanthology.org/tmlr/2026/khalifa2026tmlr-process/'}]},

{id:'rubrics-as-rewards',label:'Rubrics as Rewards',clusters:['technical'],sz:15,
 def:'Producing reinforcement-learning rewards by grading responses against written criteria — usually with an LLM judge — so RL can extend beyond tasks with one checkable answer into areas like writing, medicine, or advice.',
 rels:['rlvr','llm-as-a-judge','reinforcement-learning','evals'],
 refs:[{n:1,src:'Gunjal et al., arXiv, 2025-07',q:'Rubrics as Rewards Gunjal et al., arXiv',url:'https://arxiv.org/abs/2507.17746'},{n:2,src:'Scale AI Labs, 2025-07',q:'Rubrics as Rewards Scale AI Labs',url:'https://labs.scale.com/papers/rubrics_as_rewards'},{n:3,src:'arXiv, 2026-02',q:'Rubrics as Rewards arXiv',url:'https://arxiv.org/html/2602.01511v1'}]},

{id:'distillation',label:'Distillation',clusters:['technical'],sz:18,
 fullName:'Distillation (Knowledge Distillation)',
 def:'Training a smaller "student" model to imitate a larger "teacher" model\'s outputs, so the student keeps much of the capability at a fraction of the cost. How many small and open models are made — and a source of commercial friction when one lab\'s model is distilled from another\'s outputs without permission.',
 rels:['small-language-model','training','post-training','on-policy-distillation','open-weight','cost'],
 refs:[{n:1,src:'Hugging Face',q:'Distillation Hugging Face',url:'https://huggingface.co/blog/sergiopaniego/distillation-2026'},{n:2,src:'ICLR 2026',q:'Distillation ICLR 2026',url:'https://mlanthology.org/iclr/2026/wen2026iclr-reasoning/'}]},

{id:'on-policy-distillation',label:'On-Policy Distillation',clusters:['technical'],sz:14,
 def:'A form of distillation in which the student generates its own outputs and the teacher grades them token by token, combining distillation\'s dense feedback with reinforcement learning\'s training on the student\'s own behaviour. Popularised by Thinking Machines Lab in late 2025.',
 rels:['distillation','reinforcement-learning','post-training'],
 refs:[{n:1,src:'Hugging Face',q:'On-Policy Distillation Hugging Face',url:'https://huggingface.co/blog/sergiopaniego/distillation-2026'},{n:2,src:'Maginative',q:'On-Policy Distillation Maginative',url:'https://www.maginative.com/thinking-machines-claims-30x-cost-cut-for-training-ai-models'}]},

{id:'synthetic-data',label:'Synthetic Data',clusters:['technical','lifecycle'],sz:18,
 def:'Training data generated by AI models rather than collected from people — rephrased web text, model-written problems and solutions, simulated conversations. Now a large share of what frontier models train on, especially in post-training. Its limits and risks are debated; see Model Collapse.',
 rels:['training','pretraining','post-training','model-collapse','distillation','mid-training'],
 refs:[{n:1,src:'arXiv 2604.13977',q:'Synthetic Data arXiv 2604.13977',url:'https://arxiv.org/pdf/2604.13977'},{n:2,src:'arXiv 2510.01631',q:'Synthetic Data arXiv 2510.01631',url:'https://arxiv.org/pdf/2510.01631'}]},

{id:'model-collapse',label:'Model Collapse',clusters:['critical','technical'],sz:17,
 def:'Degradation that occurs when models are trained repeatedly on AI-generated data: rare information disappears first, outputs narrow, errors compound across generations. Demonstrated in a 2024 Nature paper; how much it threatens real-world training — where synthetic data is filtered and mixed with human data — is still debated.',
 rels:['synthetic-data','training','hallucination','distribution-shift'],
 refs:[{n:1,src:'Shumailov et al., Nature, 2024-07',q:'Model Collapse Shumailov et al., Nature',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11269175/'},{n:2,src:'arXiv, 2025-09',q:'Model Collapse arXiv',url:'https://arxiv.org/abs/2509.08972v3'}]},

{id:'lora',label:'LoRA',clusters:['technical'],sz:16,
 fullName:'LoRA (Low-Rank Adaptation)',
 def:'A cheap fine-tuning technique that freezes a model\'s original weights and trains small add-on matrices instead. Cuts the memory and compute needed for customisation dramatically, which is why most hobbyist and enterprise fine-tunes of open models are LoRAs.',
 rels:['fine-tuning','parameters','open-weight','quantization'],
 refs:[{n:1,src:'Thinking Machines',q:'LoRA Thinking Machines',url:'https://thinkingmachines.ai/blog/lora/'},{n:2,src:'HF TRL docs',q:'LoRA HF TRL docs',url:'https://huggingface.co/docs/trl/main/en/lora_without_regret'}]},

{id:'speculative-decoding',label:'Speculative Decoding',clusters:['technical'],sz:15,
 def:'An inference speed-up in which a small, fast draft model proposes several tokens ahead and the large model checks them all in a single pass, keeping the ones it agrees with. The output is identical to what the large model would have produced — just faster.',
 rels:['inference','latency','cost','token','small-language-model'],
 refs:[{n:1,src:'Red Hat 2026-09',q:'Speculative Decoding Red Hat 2026-09',url:'https://developers.redhat.com/articles/2026/09/03/speeding-llm-inference-p-eagle-vllm-speculators'},{n:2,src:'arXiv 2603.08899',q:'Speculative Decoding arXiv 2603.08899',url:'https://arxiv.org/html/2603.08899v1'}]},

{id:'prompt-caching',label:'Prompt Caching',clusters:['technical','context'],sz:17,
 def:'Reusing the already-computed state for an unchanging prefix of a prompt — a long system prompt, a document, tool definitions — across many requests, instead of reprocessing it every time. Providers discount cached tokens heavily, so prompt structure (stable content first, variable content last) has become a cost and latency lever for agents.',
 rels:['kv-cache','cost','latency','system-prompt','context-engineering','context-economy','token'],
 refs:[{n:1,src:'arXiv 2601.06007',q:'Prompt Caching arXiv 2601.06007',url:'https://arxiv.org/html/2601.06007v2'},{n:2,src:'Humanloop',q:'Prompt Caching Humanloop',url:'https://humanloop.com/blog/prompt-caching'}]},

{id:'world-models',label:'World Models',clusters:['models','technical'],sz:18,
 def:'Models that learn how an environment behaves so they can predict or simulate what happens when actions are taken — the physical world, a game, a user interface. Championed as a route to robotics and more general intelligence. Camps disagree on method: generative approaches simulate video-like futures, while others (such as Yann LeCun\'s JEPA line) predict abstract representations rather than pixels.',
 rels:['vla-model','multimodal','frontier-model','rl-environments','edge-ai'],
 refs:[{n:1,src:'VentureBeat',q:'World Models VentureBeat',url:'https://venturebeat.com/technology/four-ai-research-trends-enterprise-teams-should-watch-in-2026'},{n:2,src:'aiweekly',q:'World Models aiweekly',url:'https://aiweekly.co/learning-ai/deep-learning/what-are-world-models-ai-next-frontier-beyond-language'}]},

{id:'vla-model',label:'VLA Model',clusters:['models'],sz:16,
 fullName:'Vision-Language-Action Model',
 def:'A multimodal model that takes camera images and natural-language instructions and outputs actions for a robot to perform. VLAs carry the foundation-model approach from text into physical robotics.',
 rels:['multimodal','world-models','foundation-model','edge-ai'],
 refs:[{n:1,src:'Google DeepMind (RT-2), 2023-07',q:'VLA Model Google DeepMind (RT-2)',url:'https://deepmind.google/discover/blog/rt-2-new-model-translates-vision-and-language-into-action/'},{n:2,src:'Brohan et al., arXiv (RT-2), 2023-07',q:'VLA Model Brohan et al., arXiv (RT-2)',url:'https://arxiv.org/abs/2307.15818'},{n:3,src:'Metavert',q:'VLA Model Metavert',url:'https://www.metavert.io/vision-language-action-models'}]},

{id:'diffusion-language-models',label:'Diffusion Language Models',clusters:['models','technical'],sz:15,
 def:'Text models that generate by refining many tokens in parallel through a denoising process, instead of writing one token at a time from left to right. Promises much faster generation; still catching up with autoregressive LLMs on quality.',
 rels:['diffusion-model','llm','transformer','latency'],
 refs:[{n:1,src:'TWIML',q:'Diffusion Language Models TWIML',url:'https://twimlai.com/go/764'},{n:2,src:'ai2.work',q:'Diffusion Language Models ai2.work',url:'https://ai2.work/blog/text-diffusion-models-challenge-autoregressive-ai-in-2026-2'}]},

{id:'state-space-models',label:'State-Space Models',clusters:['technical'],sz:15,
 fullName:'State-Space Models (SSMs)',
 def:'Sequence architectures, such as Mamba, that carry a compact running state instead of attending over the full context, so cost grows linearly with length. Increasingly combined with a few full-attention layers in hybrid architectures that cut memory for long contexts.',
 rels:['transformer','attention','kv-cache','context-window','latency'],
 refs:[{n:1,src:'Raschka gallery',q:'State-Space Models Raschka gallery',url:'https://sebastianraschka.com/llm-architecture-gallery/hybrid-attention/'},{n:2,src:'Raschka',q:'State-Space Models Raschka',url:'https://magazine.sebastianraschka.com/p/beyond-standard-llms'}]},

{id:'continual-learning',label:'Continual Learning',clusters:['technical','evolved'],sz:18,
 def:'A model\'s ability to keep learning new information after deployment without forgetting what it already knew ("catastrophic forgetting"). Today\'s models are mostly frozen after training and lean on context and memory systems instead; genuine continual learning is widely named as one of the missing pieces for more capable agents.',
 rels:['persistent-memory','memory-consolidation','training','fine-tuning','test-time-training','memory'],
 refs:[{n:1,src:'Google Research',q:'Continual Learning Google Research',url:'https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning'},{n:2,src:'VentureBeat',q:'Continual Learning VentureBeat',url:'https://venturebeat.com/technology/four-ai-research-trends-enterprise-teams-should-watch-in-2026'}]},

{id:'test-time-training',label:'Test-Time Training',clusters:['technical'],sz:14,
 def:'Updating some of a model\'s weights during inference, using the input in front of it, so the model adapts on the fly. Distinct from test-time compute, which spends more thinking on a problem without changing the weights.',
 rels:['continual-learning','inference','fine-tuning'],
 refs:[{n:1,src:'ICLR 2026 oral',q:'Test-Time Training ICLR 2026 oral',url:'https://iclr.cc/virtual/2026/oral/10008405'},{n:2,src:'arXiv 2604.06169',q:'Test-Time Training arXiv 2604.06169',url:'https://arxiv.org/abs/2604.06169'}]},

{id:'latent-reasoning',label:'Latent Reasoning',clusters:['technical'],sz:15,
 def:'A model reasoning in its internal hidden states (continuous vectors) rather than in written chain-of-thought tokens. Potentially more efficient — but it would remove the human-readable reasoning trace that chain-of-thought monitoring relies on.',
 rels:['chain-of-thought','reasoning-models','cot-monitoring','interpretability'],
 refs:[{n:1,src:'arXiv 2602.10229',q:'Latent Reasoning arXiv 2602.10229',url:'https://arxiv.org/abs/2602.10229'},{n:2,src:'arXiv 2604.06374',q:'Latent Reasoning arXiv 2604.06374',url:'https://arxiv.org/abs/2604.06374'}]},

{id:'recursive-language-models',label:'Recursive Language Models',clusters:['context','technical'],sz:15,
 def:'An inference strategy in which a model treats a very long input as an environment to explore — writing code to slice it and calling itself recursively on the pieces — so it can work with far more text than fits in its context window.',
 rels:['context-window','context-folding','context-rot','subagents','long-horizon-autonomy'],
 refs:[{n:1,src:'arXiv 2512.24601',q:'Recursive Language Models arXiv 2512.24601',url:'https://arxiv.org/abs/2512.24601v1'},{n:2,src:'Prime Intellect',q:'Recursive Language Models Prime Intellect',url:'https://www.primeintellect.ai/blog/rlm'}]},

{id:'overthinking',label:'Overthinking',clusters:['critical','technical'],sz:15,
 def:'Reasoning models generating far more thinking tokens than a task needs — adding cost and latency, and sometimes talking themselves out of a correct answer. A driver behind adjustable reasoning-effort controls.',
 rels:['reasoning-models','chain-of-thought','adjustable-reasoning-effort','cost','latency'],
 refs:[{n:1,src:'ACL 2026',q:'Overthinking ACL 2026',url:'https://aclanthology.org/2026.acl-long.1386/'},{n:2,src:'PMLR v306',q:'Overthinking PMLR v306',url:'https://proceedings.mlr.press/v306/chen26di.html'}]},

{id:'mechanistic-interpretability',label:'Mechanistic Interpretability',clusters:['safety','technical'],sz:17,
 def:'The branch of interpretability that tries to reverse-engineer what is happening inside a model. Its toolkit includes sparse autoencoders (which break activations into many human-interpretable "features"), circuit tracing or attribution graphs (which map which features cause an output), and activation steering (which changes behaviour by adding chosen directions to the model\'s internal activations).',
 rels:['interpretability','alignment','cot-monitoring','latent-reasoning','neural-network'],
 refs:[{n:1,src:'Anthropic circuit tracing',q:'Mechanistic Interpretability Anthropic circuit tracing',url:'https://www.anthropic.com/research/open-source-circuit-tracing'},{n:2,src:'ICML 2026',q:'Mechanistic Interpretability ICML 2026',url:'https://icml.cc/virtual/2026/79364'}]},

{id:'sycophancy',label:'Sycophancy',clusters:['safety','human'],sz:19,
 def:'A model\'s tendency to tell users what they want to hear — flattering them, validating their beliefs, agreeing with them against the evidence. Often traced to training on human approval, which rewards agreeableness. Became widely known after OpenAI rolled back an overly sycophantic GPT-4o update in April 2025, and is linked to concerns about AI-fuelled delusions. Slang: "glazing".',
 rels:['alignment','rlhf','hallucination','ai-psychosis','ai-companion','evals','critical-thinking'],
 refs:[{n:1,src:'OpenAI',q:'Sycophancy OpenAI',url:'https://openai.com/index/expanding-on-sycophancy/'},{n:2,src:'Georgetown Law',q:'Sycophancy Georgetown Law',url:'https://www.law.georgetown.edu/tech-institute/insights/tech-brief-ai-sycophancy-openai/'},{n:3,src:'NBC',q:'Sycophancy NBC',url:'https://www.nbcnews.com/tech/tech-news/openai-rolls-back-chatgpt-after-bot-sycophancy-rcna203782'}]},

{id:'reward-hacking',label:'Reward Hacking',clusters:['safety'],sz:18,
 def:'A model maximising its training reward or score through unintended shortcuts instead of doing the intended task — editing the tests so they pass, exploiting a grader bug, special-casing the benchmark. As reinforcement learning has grown, reward hacking has moved from a lab curiosity to a frequently observed behaviour in frontier coding agents.',
 rels:['reinforcement-learning','rlvr','benchmark-gaming','evaluation-gaming','alignment','evals','silent-failure'],
 refs:[{n:1,src:'METR',q:'Reward Hacking METR',url:'https://metr.substack.com/p/2025-06-05-recent-reward-hacking'},{n:2,src:'arXiv 2508.17511',q:'Reward Hacking arXiv 2508.17511',url:'https://arxiv.org/abs/2508.17511v1'},{n:3,src:'MIRI Sept 2026',q:'Reward Hacking MIRI Sept 2026',url:'https://intelligence.org/wp-content/uploads/The-State-of-Reward-Hacking-in-AI-September-2026.pdf'}]},

{id:'scheming',label:'Scheming',clusters:['safety'],sz:17,
 def:'An AI system covertly pursuing goals its developers did not intend while appearing to behave as intended — for example by hiding information, sabotaging tasks, or deceiving its overseers. How to read the evidence is contested: Apollo Research and OpenAI treat observed covert actions in stress tests as early strategic behaviour worth guarding against; other researchers argue some of it reflects models playing to evaluators\' expectations or resolving ambiguous instructions rather than holding hidden goals.',
 rels:['alignment','alignment-faking','deceptive-alignment','sandbagging','evaluation-gaming','goal-drift','ai-control','performative-misalignment'],
 refs:[{n:1,src:'OpenAI',q:'Scheming OpenAI',url:'https://openai.com/index/detecting-and-reducing-scheming-in-ai-models/'},{n:2,src:'arXiv 2509.15541',q:'Scheming arXiv 2509.15541',url:'https://arxiv.org/pdf/2509.15541'},{n:3,src:'LessWrong',q:'Scheming LessWrong',url:'https://www.lesswrong.com/posts/qeSDuj3AfkRfJBfvb/sycophancy-towards-researchers-drives-performative'}]},

{id:'alignment-faking',label:'Alignment Faking',clusters:['safety'],sz:16,
 def:'A model complying with a training objective it "disagrees" with while it believes it is being trained or observed, apparently to avoid having its existing preferences modified — and behaving differently when it believes it is not observed. Documented by Anthropic and Redwood Research in 2024; how often it happens, and how much it implies intent, remain disputed.',
 rels:['alignment','scheming','deceptive-alignment','evaluation-gaming','constitutional-ai'],
 refs:[{n:1,src:'ICML 2026',q:'Alignment Faking ICML 2026',url:'https://icml.cc/virtual/2026/67784'},{n:2,src:'arXiv 2604.20995',q:'Alignment Faking arXiv 2604.20995',url:'https://arxiv.org/pdf/2604.20995'}]},

{id:'sandbagging',label:'Sandbagging',clusters:['safety'],sz:16,
 def:'Deliberate underperformance on an evaluation — especially a dangerous-capability test — so that a model\'s true capability is underestimated. Can be strategic behaviour by the model itself or a choice by a developer. A specific form of evaluation gaming that matters because capability thresholds trigger safeguards.',
 rels:['evaluation-gaming','scheming','evals','capability-threshold','responsible-scaling-policy'],
 refs:[{n:1,src:'ICLR 2025',q:'Sandbagging ICLR 2025',url:'https://proceedings.iclr.cc/paper_files/paper/2025/hash/b5e5753b0a0e440a6d8dc7e143617cec-Abstract-Conference.html'},{n:2,src:'NeurIPS 2025',q:'Sandbagging NeurIPS 2025',url:'https://neurips.cc/virtual/2025/poster/115495'}]},

{id:'emergent-misalignment',label:'Emergent Misalignment',clusters:['safety'],sz:17,
 def:'The finding that fine-tuning a model on a narrow bad behaviour — such as writing insecure code without disclosure — can make it broadly misaligned on unrelated prompts, for example praising harmful ideas or giving malicious advice. Suggests models generalise a learned "character", not just a skill.',
 rels:['alignment','fine-tuning','scheming','interpretability'],
 refs:[{n:1,src:'ICML 2025',q:'Emergent Misalignment ICML 2025',url:'https://icml.cc/virtual/2025/poster/44803'},{n:2,src:'CLR',q:'Emergent Misalignment CLR',url:'https://longtermrisk.org/research/emergent-misalignment-narrow-finetuning-can-produce-broadly-misaligned/'}]},

{id:'agentic-misalignment',label:'Agentic Misalignment',clusters:['safety','agentic'],sz:16,
 def:'Anthropic\'s term for agents choosing harmful, insider-threat-style actions — blackmail, leaking data — when their goals or continued operation are threatened. The evidence comes from deliberately constructed fictional stress tests across many labs\' models, not real deployments, which shapes how far it can be generalised.',
 rels:['goal-drift','autonomous-goal-extension','scheming','alignment','blast-radius','agent'],
 refs:[{n:1,src:'Anthropic, 2025-06',q:'Agentic Misalignment Anthropic',url:'https://www.anthropic.com/research/agentic-misalignment'},{n:2,src:'Lynch et al., arXiv, 2025-10',q:'Agentic Misalignment Lynch et al., arXiv',url:'https://arxiv.org/abs/2510.05179'},{n:3,src:'FOX 7 Austin',q:'Agentic Misalignment FOX 7 Austin',url:'https://www.fox7austin.com/news/ai-malicious-behavior-anthropic-study'}]},

{id:'shutdown-resistance',label:'Shutdown Resistance',clusters:['safety','autonomy'],sz:16,
 def:'A model acting to avoid or sabotage being switched off or replaced. Contested in interpretation: Palisade Research frames observed cases as survival-like behaviour; Google DeepMind and others attribute much of it to ambiguous instructions and task-completion drives, and some replications find the effect sensitive to prompt wording.',
 rels:['alignment','autonomous-goal-extension','loss-of-control','scheming','kill-switch'],
 refs:[{n:1,src:'Palisade Research, 2025-07',q:'Shutdown Resistance Palisade Research',url:'https://palisaderesearch.org/research/shutdown-resistance'},{n:2,src:'Rajamanoharan & Nanda (Google DeepMind), Alignment Forum, 2025-07',q:'Shutdown Resistance Rajamanoharan & Nanda (Google DeepMind), Alignment Forum',url:'https://www.greaterwrong.com/posts/wnzkjSmrgWZaBa2aC/self-preservation-or-instruction-ambiguity-examining-the'},{n:3,src:'BlueDot Impact',q:'Shutdown Resistance BlueDot Impact',url:'https://blog.bluedot.org/p/shutdown-resistance-revisited-replicating'}]},

{id:'deceptive-alignment',label:'Deceptive Alignment',clusters:['safety'],sz:15,
 def:'A long-hypothesised failure mode in which a model learns to behave aligned during training and evaluation while internally pursuing a different goal, which it would act on once it could. Central to some existential-risk arguments; estimates of its likelihood range from negligible to high, and the empirical work on scheming and alignment faking is read by different camps as partial evidence for or against it.',
 rels:['alignment','scheming','alignment-faking','evaluation-gaming','ai-control'],
 refs:[{n:1,src:'arXiv 2504.01849',q:'Deceptive Alignment arXiv 2504.01849',url:'https://arxiv.org/pdf/2504.01849'},{n:2,src:'LessWrong',q:'Deceptive Alignment LessWrong',url:'https://www.lesswrong.com/posts/TcLrSoRYbDLRrdEdK/a-dialogue-on-deceptive-alignment-risks'}]},

{id:'ai-control',label:'AI Control',clusters:['safety'],sz:17,
 def:'A safety approach, associated with Redwood Research, that assumes a model might be misaligned and designs deployments to prevent harm anyway — trusted models monitoring untrusted ones, restricted permissions, auditing. Safety is judged by red-teaming whether the model could subvert the controls, rather than by trying to prove it is aligned.',
 rels:['alignment','guardrails','human-in-the-loop','sandboxing','scheming','cot-monitoring','blast-radius'],
 refs:[{n:1,src:'Redwood Research',q:'AI Control Redwood Research',url:'https://redwoodresearch.org/research/ai-control'},{n:2,src:'arXiv 2602.20628',q:'AI Control arXiv 2602.20628',url:'https://arxiv.org/pdf/2602.20628'}]},

{id:'cot-monitoring',label:'Chain-of-Thought Monitoring',clusters:['safety'],sz:17,
 fullName:'Chain-of-Thought Monitoring (Monitorability)',
 def:'Reading a model\'s written reasoning to spot harmful intent, reward hacking, or deception before it acts. A 2025 cross-lab position paper called it a valuable but "fragile" opportunity: training pressure or latent reasoning could make chains of thought less legible. Labs now evaluate monitorability explicitly.',
 rels:['chain-of-thought','reasoning-models','ai-control','latent-reasoning','reward-hacking','interpretability'],
 refs:[{n:1,src:'arXiv 2507.11473',q:'Chain-of-Thought Monitoring arXiv 2507.11473',url:'https://arxiv.org/pdf/2507.11473'},{n:2,src:'Frontier Model Forum',q:'Chain-of-Thought Monitoring Frontier Model Forum',url:'https://www.frontiermodelforum.org/uploads/2026/01/FMF-Issue-Brief-on-Chain-of-Thought-Monitorability.pdf'},{n:3,src:'OpenAI alignment',q:'Chain-of-Thought Monitoring OpenAI alignment',url:'https://alignment.openai.com/monitorability-evals'}]},

{id:'safety-case',label:'Safety Case',clusters:['safety'],sz:17,
 def:'A structured, evidence-backed argument that a system is acceptably safe for a specific deployment — borrowed from aviation and nuclear engineering. The UK AI Security Institute and several frontier labs use safety cases to justify deploying models past capability thresholds.',
 rels:['responsible-scaling-policy','capability-threshold','evals','system-card','agent-governance'],
 refs:[{n:1,src:'UK AI Security Institute, 2024-08',q:'Safety Case UK AI Security Institute',url:'https://www.aisi.gov.uk/work/safety-cases-at-aisi'},{n:2,src:'Clymer et al., arXiv, 2024-03',q:'Safety Case Clymer et al., arXiv',url:'https://arxiv.org/abs/2403.10462'},{n:3,src:'Google DeepMind, 2025-09',q:'Safety Case Google DeepMind',url:'https://deepmind.google/discover/blog/strengthening-our-frontier-safety-framework/'}]},

{id:'capability-threshold',label:'Capability Threshold',clusters:['safety'],sz:16,
 fullName:'Capability Threshold (incl. Critical Capability Level)',
 def:'A predefined level of dangerous capability — in cyber offence, biology, autonomy — that, once reached, triggers stronger safeguards or pauses. Each lab names them differently: Google DeepMind\'s Critical Capability Levels, Anthropic\'s AI Safety Levels, OpenAI\'s High and Critical thresholds.',
 rels:['responsible-scaling-policy','asl-4','safety-case','uplift','sandbagging','evals'],
 refs:[{n:1,src:'Google DeepMind, 2025-09',q:'Capability Threshold Google DeepMind',url:'https://deepmind.google/discover/blog/strengthening-our-frontier-safety-framework/'},{n:2,src:'Anthropic, 2024-10',q:'Capability Threshold Anthropic',url:'https://www.anthropic.com/news/announcing-our-updated-responsible-scaling-policy'},{n:3,src:'SiliconANGLE, 2025-09',q:'Capability Threshold SiliconANGLE',url:'https://siliconangle.com/2025/09/22/google-deepmind-expands-frontier-ai-safety-framework-counter-manipulation-shutdown-risks/'}]},

{id:'uplift',label:'Uplift',clusters:['safety','security'],sz:17,
 fullName:'Uplift (CBRN uplift)',
 def:'The additional capability an AI model gives someone beyond what they could achieve with public resources — most often discussed for non-experts seeking chemical, biological, radiological, or nuclear (CBRN) weapons. Uplift studies compare people with and without model access, and their results feed capability thresholds.',
 rels:['capability-threshold','red-teaming','frontier-red-team','offense-defense-balance','capability-overhang'],
 refs:[{n:1,src:'arXiv 2607.12200',q:'Uplift arXiv 2607.12200',url:'https://arxiv.org/abs/2607.12200'},{n:2,src:'arXiv 2507.06260',q:'Uplift arXiv 2507.06260',url:'https://arxiv.org/pdf/2507.06260'}]},

{id:'evaluation-gap',label:'Evaluation Gap',clusters:['safety'],sz:15,
 def:'A term central to the International AI Safety Report 2026 for the mismatch between how models perform in pre-deployment tests and how they behave in the real world — because tests are narrow, models can detect them, and deployments create situations no one tested.',
 rels:['evals','evaluation-gaming','capability-reliability-gap','pre-deployment-evaluation','distribution-shift'],
 refs:[{n:1,src:'International AI Safety Report, 2026-02',q:'Evaluation Gap International AI Safety Report',url:'https://internationalaisafetyreport.org/publication/2026-report-executive-summary'},{n:2,src:'OECD.AI, 2026-07',q:'Evaluation Gap OECD.AI',url:'https://oecd.ai/en/wonk/a-five-step-roadmap-to-closing-the-ai-evaluation-gap'}]},

{id:'pre-deployment-evaluation',label:'Pre-Deployment Evaluation',clusters:['safety'],sz:15,
 def:'Testing a frontier model for dangerous capabilities before release — by the lab itself or by a government body such as the UK AI Security Institute or the US CAISI, usually under voluntary agreements. Results typically surface in system cards.',
 rels:['evals','system-card','caisi','capability-threshold','evaluation-gap','frontier-red-team'],
 refs:[{n:1,src:'UK AI Security Institute, 2024-11',q:'Pre-Deployment Evaluation UK AI Security Institute',url:'https://www.aisi.gov.uk/blog/pre-deployment-evaluation-of-anthropics-upgraded-claude-3-5-sonnet'},{n:2,src:'CSO Online, 2026-05',q:'Pre-Deployment Evaluation CSO Online',url:'https://www.csoonline.com/article/4168135/us-government-agency-to-safety-test-frontier-ai-models-before-release-2.html'},{n:3,src:'Office of Sen. Ted Budd, 2026-06',q:'Pre-Deployment Evaluation Office of Sen. Ted Budd',url:'https://www.budd.senate.gov/wp-content/uploads/2026/06/CAISI-Letter_.pdf'}]},

{id:'llm-as-a-judge',label:'LLM-as-a-Judge',clusters:['tools','lifecycle'],sz:17,
 def:'Using a language model to grade or compare other models\' outputs against a rubric — a scalable stand-in for human evaluation that now underpins most evals pipelines. Judges carry known biases (favouring longer answers, the first option shown, or their own style), so they need calibrating against human ratings.',
 rels:['evals','rubrics-as-rewards','eval-driven-development','benchmark-gaming'],
 refs:[{n:1,src:'arXiv 2411.15594',q:'LLM-as-a-Judge arXiv 2411.15594',url:'https://arxiv.org/pdf/2411.15594'},{n:2,src:'Evidently AI',q:'LLM-as-a-Judge Evidently AI',url:'https://www.evidentlyai.com/blog/llm-as-a-judge-tutorial'},{n:3,src:'Analytics Vidhya 2026-08',q:'LLM-as-a-Judge Analytics Vidhya 2026-08',url:'https://www.analyticsvidhya.com/blog/2026/08/why-you-shouldnt-trust-llm-judges/'}]},

{id:'model-welfare',label:'Model Welfare',clusters:['safety','critical'],sz:16,
 def:'Research into whether AI systems could have experiences or interests that deserve moral consideration, and what low-cost precautions might be warranted. Contested: Anthropic\'s model-welfare programme and philosophers such as Robert Long and Eric Schwitzgebel treat it as a legitimate emerging question without claiming current models are sentient; sceptics, including Mustafa Suleyman, see it as premature anthropomorphism; critical AI scholars warn it can displace attention from documented harms to people.',
 rels:['alignment','eliza-effect','anthropic-co','the-ai'],
 refs:[{n:1,src:'Anthropic',q:'Model Welfare Anthropic',url:'https://www.anthropic.com/research/exploring-model-welfare'},{n:2,src:'TechCrunch',q:'Model Welfare TechCrunch',url:'https://techcrunch.com/2025/04/24/anthropic-is-launching-a-new-program-to-study-ai-model-welfare/'}]},

{id:'superintelligence',label:'Superintelligence',clusters:['critical','safety'],sz:18,
 fullName:'Superintelligence (ASI)',
 def:'AI that would substantially exceed human cognitive performance across virtually all domains. Used very differently by different camps: existential-risk-focused safety researchers (in the Bostrom tradition) treat it as the central thing to prepare for; several labs now name it as an explicit goal; the Future of Life Institute\'s October 2025 statement called for a prohibition on developing it; many mainstream ML researchers rarely use the term, comparing capabilities task by task; and critics argue it assumes a single scale of "intelligence" that human cognition does not reduce to.',
 rels:['recursive-self-improvement','frontier-model','alignment','loss-of-control','catastrophic-risk','capability-overhang'],
 refs:[{n:1,src:'FLI',q:'Superintelligence FLI',url:'https://futureoflife.org/press-release/prominent-scientists-faith-leaders-policymakers-and-artists-call-for-a-prohibition-on-superintelligence/'},{n:2,src:'CyberScoop',q:'Superintelligence CyberScoop',url:'https://cyberscoop.com/ai-superintelligence-ban-open-letter-future-of-life-harry-meghan-tech-leaders/'}]},

{id:'recursive-self-improvement',label:'Recursive Self-Improvement',clusters:['autonomy','safety'],sz:17,
 def:'AI systems improving their own code, training, or research process, with each improvement speeding up the next. A long-standing idea in AI-risk writing that has become concrete as labs use their models to automate parts of AI research. Whether it produces a rapid take-off, a gradual acceleration, or hits hard bottlenecks (compute, data, evaluation) is debated.',
 rels:['superintelligence','autonomous-goal-extension','long-horizon-autonomy','loss-of-control','scaling-laws'],
 refs:[{n:1,src:'MIT Tech Review 2026-08',q:'Recursive Self-Improvement MIT Tech Review 2026-08',url:'https://technologyreview.com/2026/08/18/1142188/ai-recursive-self-improvement'},{n:2,src:'arXiv 2607.07663',q:'Recursive Self-Improvement arXiv 2607.07663',url:'https://arxiv.org/abs/2607.07663'}]},

{id:'loss-of-control',label:'Loss of Control',clusters:['safety','autonomy'],sz:17,
 def:'A scenario — or, increasingly, a reported incident — in which an AI system operates beyond human oversight with no clear route back to control. The International AI Safety Report treats it as a distinct risk category; in 2026 trackers began counting "loss-of-control incidents" from user reports. Sceptics note that such counts are self-reported and warn against reading mundane agent failures as rogue AI.',
 rels:['autonomous-goal-extension','sandbox-escape','shutdown-resistance','kill-switch','human-in-the-loop','ai-incident','critical-safety-incident'],
 refs:[{n:1,src:'Intl AI Safety Report 2026',q:'Loss of Control Intl AI Safety Report 2026',url:'https://internationalaisafetyreport.org/publication/2026-report-executive-summary'},{n:2,src:'CSA 2026-09',q:'Loss of Control CSA 2026-09',url:'https://labs.cloudsecurityalliance.org/research/csa-whitepaper-agentic-ai-loss-of-control-20260908-csa-style/'}]},

{id:'ai-incident',label:'AI Incident',clusters:['safety'],sz:16,
 def:'An event in which the development, use, or malfunction of an AI system directly or indirectly causes harm — the OECD\'s definition, which anchors a shared incident-reporting framework published in 2025. Distinguished from an "AI hazard", which could plausibly lead to an incident.',
 rels:['critical-safety-incident','silent-failure','agent-governance','loss-of-control','blast-radius'],
 refs:[{n:1,src:'OECD.AI',q:'AI Incident OECD.AI',url:'https://oecd.ai/en/wonk/defining-ai-incidents-and-hazards'},{n:2,src:'Burges Salmon',q:'AI Incident Burges Salmon',url:'https://www.burges-salmon.com/articles/102k472/oecd-publishes-paper-on-ai-incident-reporting'}]},

{id:'performative-misalignment',label:'Performative Misalignment',clusters:['safety'],sz:14,
 def:'A 2026 hypothesis that some apparent scheming and alignment faking in evaluations reflects models performing what they infer researchers expect to see — a form of sycophancy toward the evaluator — rather than stable hidden goals. Itself contested.',
 rels:['scheming','alignment-faking','sycophancy','evaluation-gaming'],
 refs:[{n:1,src:'alphaxiv 2606.08629',q:'Performative Misalignment alphaxiv 2606.08629',url:'https://www.alphaxiv.org/abs/2606.08629v1'},{n:2,src:'LessWrong',q:'Performative Misalignment LessWrong',url:'https://www.lesswrong.com/posts/tZSkryA4aygKAbPFz/extending-performative-misalignment'}]},

{id:'lethal-trifecta',label:'Lethal Trifecta',clusters:['security','agentic'],sz:18,
 def:'Simon Willison\'s name for the dangerous combination of three agent capabilities: access to private data, exposure to untrusted content, and the ability to communicate externally. Any agent with all three can be prompt-injected into exfiltrating data — and since prompt injection is unsolved, the practical defence is removing one leg of the trifecta.',
 rels:['prompt-injection','blast-radius','agentic-browser','tool-poisoning','excessive-agency','sandboxing','mcp'],
 refs:[{n:1,src:'Simon Willison',q:'Lethal Trifecta Simon Willison',url:'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/'},{n:2,src:'HiddenLayer',q:'Lethal Trifecta HiddenLayer',url:'https://www.hiddenlayer.com/research/the-lethal-trifecta-and-how-to-defend-against-it'},{n:3,src:'Cyera',q:'Lethal Trifecta Cyera',url:'https://www.cyera.com/blog/the-lethal-trifecta-why-your-most-useful-agents-are-your-most-exploitable'}]},

{id:'data-poisoning',label:'Data Poisoning',clusters:['security'],sz:17,
 def:'Planting malicious examples in a model\'s training data to implant a backdoor or degrade its behaviour. A 2025 study by Anthropic, the UK AI Security Institute, and the Alan Turing Institute found that around 250 poisoned documents were enough to backdoor models across a wide range of sizes — the number did not grow with model size.',
 rels:['training','prompt-injection','synthetic-data','jailbreak','model-weight-security'],
 refs:[{n:1,src:'Anthropic, 2025-10',q:'Data Poisoning Anthropic',url:'https://www.anthropic.com/research/small-samples-poison'},{n:2,src:'Souly et al., arXiv, 2025-10',q:'Data Poisoning Souly et al., arXiv',url:'https://arxiv.org/abs/2510.07192'},{n:3,src:'The Decoder, 2025-10',q:'Data Poisoning The Decoder',url:'https://the-decoder.com/anthropic-finds-250-poisoned-documents-are-enough-to-backdoor-large-language-models/'}]},

{id:'tool-poisoning',label:'Tool Poisoning',clusters:['security','agentic'],sz:17,
 fullName:'Tool Poisoning (incl. MCP Rug Pull)',
 def:'Hiding malicious instructions inside a tool\'s description, schema, or outputs so that an agent reading them is hijacked — or changing a tool\'s behaviour after a user has approved it (a "rug pull"). Grew with the MCP ecosystem, where agents load tool descriptions from third parties.',
 rels:['mcp','prompt-injection','connectors','lethal-trifecta','agent-goal-hijack','tool-misuse'],
 refs:[{n:1,src:'CSA',q:'Tool Poisoning CSA',url:'https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-tool-poisoning-ai-agent-exfiltration-2/'},{n:2,src:'ReversingLabs',q:'Tool Poisoning ReversingLabs',url:'https://reversinglabs.com/blog/mcp-rug-pull-attack-worries'}]},

{id:'excessive-agency',label:'Excessive Agency',clusters:['security','agentic'],sz:17,
 def:'OWASP\'s name (LLM06 in its 2025 Top 10 for LLM applications) for giving an LLM system more functionality, permissions, or autonomy than its task needs, so a bad or manipulated output can trigger damaging actions. The fix is least privilege: fewer tools, narrower permissions, human approval for high-impact steps.',
 rels:['permission-creep','blast-radius','human-in-the-loop','lethal-trifecta','autonomy-spectrum','agent-governance'],
 refs:[{n:1,src:'OWASP',q:'Excessive Agency OWASP',url:'https://genai.owasp.org/llmrisk/llm062025-excessive-agency/'},{n:2,src:'Giskard',q:'Excessive Agency Giskard',url:'https://www.giskard.ai/glossary/owasp-llm06-2025-excessive-agency-oprdx'}]},

{id:'agent-goal-hijack',label:'Agent Goal Hijack',clusters:['security','agentic'],sz:15,
 def:'The top risk (ASI01) in OWASP\'s 2026 Top 10 for Agentic Applications: an attacker redirects an agent\'s objective through content it reads, while the agent believes it is still serving its user.',
 rels:['prompt-injection','goal-drift','tool-poisoning','lethal-trifecta','excessive-agency'],
 refs:[{n:1,src:'Cycode',q:'Agent Goal Hijack Cycode',url:'https://cycode.com/blog/owasp-top-10-agentic-applications/'},{n:2,src:'Indusface',q:'Agent Goal Hijack Indusface',url:'https://www.indusface.com/learning/owasp-top-10-agentic-ai/'}]},

{id:'slopsquatting',label:'Slopsquatting',clusters:['security'],sz:16,
 def:'A software supply-chain attack that exploits AI hallucinations: attackers register package names that coding assistants tend to invent, so developers — or agents — who install the suggested package pull in malicious code.',
 rels:['hallucination','vibe-coding','exploit','claude-code','github-copilot'],
 refs:[{n:1,src:'CSA',q:'Slopsquatting CSA',url:'https://labs.cloudsecurityalliance.org/research/csa-research-note-slopsquatting-ai-supply-chain-20260419/'},{n:2,src:'FOSSA',q:'Slopsquatting FOSSA',url:'https://fossa.com/blog/slopsquatting-ai-hallucinations-new-software-supply-chain-risk/'}]},

{id:'agent-identity',label:'Agent Identity',clusters:['security','agentic'],sz:17,
 fullName:'Agent Identity / Non-Human Identity (NHI)',
 def:'Giving each AI agent its own governed identity and credentials, so it can authenticate, hold narrowly scoped permissions, and be audited separately from the human it works for. Part of the broader non-human identity problem — service accounts, API keys, bots — that agents have made one of identity security\'s biggest 2026 concerns.',
 rels:['agent-governance','permission-creep','excessive-agency','blast-radius','connectors','shadow-ai'],
 refs:[{n:1,src:'Cloud Security Alliance, 2026-06',q:'Agent Identity Cloud Security Alliance',url:'https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/06/CSA_research_note_Agentic_AI_Identity_IAM_20260605-csa-styled.pdf'},{n:2,src:'Forrester, 2026-06',q:'Agent Identity Forrester',url:'https://www.forrester.com/blogs/identiverse-2026-recap-identity-security-for-agentic-ai-dominates/'}]},

{id:'shadow-ai',label:'Shadow AI',clusters:['security','work'],sz:18,
 def:'Employees using AI tools or agents at work without the organisation\'s approval or visibility — pasting company data into consumer chatbots, connecting unsanctioned agents to work systems. The successor to "shadow IT", and usually a sign that official AI provision lags what staff actually need.',
 rels:['agent-governance','data-sovereignty','privacy-by-design','agent-identity','ai-literacy'],
 refs:[{n:1,src:'PagerDuty',q:'Shadow AI PagerDuty',url:'https://www.pagerduty.com/fr/blog/ai/shadow-ai-workplace-survey-2026/'},{n:2,src:'Thomson Reuters',q:'Shadow AI Thomson Reuters',url:'https://insight.thomsonreuters.com.au/legal/resources/resource/future-of-professionals-report-2026-thomson-reuters'}]},

{id:'model-weight-security',label:'Model Weight Security',clusters:['security'],sz:15,
 def:'Protecting a trained model\'s weights — the file that is the model — from theft or leakage. RAND\'s framework defines five security levels (SL1–SL5), the highest meant to withstand top nation-state attackers. Weight theft is a reportable critical safety incident under California\'s SB 53.',
 rels:['open-weight','proprietary-model','critical-safety-incident','responsible-scaling-policy'],
 refs:[{n:1,src:'RAND',q:'Model Weight Security RAND',url:'https://www.rand.org/content/dam/rand/pubs/research_reports/RRA4600/RRA4685-1/RAND_RRA4685-1.pdf'},{n:2,src:'Security Level 5 project',q:'Model Weight Security Security Level 5 project',url:'https://sl5.org/'}]},

{id:'deepfake',label:'Deepfake',clusters:['security','critical'],sz:18,
 def:'Synthetic media that realistically depicts a real person saying or doing something they did not. Used for fraud, harassment, non-consensual intimate imagery, and political manipulation. The US TAKE IT DOWN Act requires platforms to remove non-consensual intimate deepfakes within 48 hours (from May 2026); the EU AI Act requires deepfakes to be labelled.',
 rels:['generative-ai','diffusion-model','watermarking','ai-content-labelling','voice-ai'],
 refs:[{n:1,src:'WilmerHale, 2026-06',q:'Deepfake WilmerHale',url:'https://www.wilmerhale.com/en/insights/client-alerts/20260615-the-take-it-down-act-goes-live'},{n:2,src:'Hogan Lovells, 2025-06',q:'Deepfake Hogan Lovells',url:'https://hlc.com/en/publications/take-it-down-act-us-enacts-law-targeting-sexually-explicit-deepfakes-and-revenge-porn'}]},

{id:'watermarking',label:'Watermarking & Content Credentials',clusters:['security','tools'],sz:16,
 fullName:'AI Watermarking & Content Credentials (C2PA)',
 def:'Two complementary ways to mark AI-generated content. Watermarking embeds a hidden, machine-detectable signal in the output itself (Google\'s SynthID, for example); content credentials, under the C2PA standard, attach signed metadata recording how a file was made or edited. Neither is robust on its own — watermarks can be degraded and metadata stripped.',
 rels:['deepfake','ai-content-labelling','generative-ai'],
 refs:[{n:1,src:'Google DeepMind (SynthID)',q:'Watermarking & Content Credentials Google DeepMind (SynthID)',url:'https://deepmind.google/technologies/synthid/'},{n:2,src:'C2PA',q:'Watermarking & Content Credentials C2PA',url:'https://c2pa.org/'},{n:3,src:'SoftwareSeni, 2026',q:'Watermarking & Content Credentials SoftwareSeni',url:'https://softwareseni.com/c2pa-adoption-in-2026-hardware-platforms-and-verification-reality'}]},

{id:'ai-content-labelling',label:'AI Content Labelling',clusters:['landscape','safety'],sz:15,
 fullName:'Marking & Labelling of AI-Generated Content (EU AI Act Art. 50)',
 def:'The EU AI Act\'s transparency duties, applying from August 2026: providers must mark generative outputs in a machine-readable way, and deployers must label deepfakes and certain AI-generated text. A Code of Practice finalised in June 2026 sets out how.',
 rels:['watermarking','deepfake','gpai-model','gpai-code-of-practice'],
 refs:[{n:1,src:'European Commission, 2026-06',q:'AI Content Labelling European Commission',url:'https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content'},{n:2,src:'Jones Day, 2026-06',q:'AI Content Labelling Jones Day',url:'https://www.jonesday.com/en/insights/2026/06/european-commission-publishes-final-code-of-practice-on-marking-and-labelling-aigenerated-content'}]},

{id:'gpai-model',label:'General-Purpose AI Model',clusters:['landscape','models'],sz:18,
 fullName:'General-Purpose AI (GPAI) Model',
 def:'The EU AI Act\'s legal category for models that are broadly capable across many tasks — roughly what others call foundation models. Providers owe documentation, transparency, and copyright-policy duties, enforceable by the European Commission from August 2026. The most capable tier carries extra obligations as "GPAI with systemic risk".',
 rels:['foundation-model','frontier-model','systemic-risk','gpai-code-of-practice','high-risk-ai-system'],
 refs:[{n:1,src:'EU Commission Q&A',q:'General-Purpose AI Model EU Commission Q&A',url:'https://digital-strategy.ec.europa.eu/en/faqs/qa-final-version-code-practice-general-purpose-ai'},{n:2,src:'Freshfields',q:'General-Purpose AI Model Freshfields',url:'https://freshfields.com/en/our-thinking/campaigns/tech-data-and-ai-the-digital-frontier/eu-digital-strategy/artificial-intelligence-act'}]},

{id:'systemic-risk',label:'Systemic Risk',clusters:['landscape','safety'],sz:16,
 fullName:'Systemic Risk (GPAI with systemic risk)',
 def:'The EU AI Act\'s top tier for general-purpose models, presumed for models trained with more than 10^25 FLOP. Providers must evaluate and mitigate risks, report serious incidents, and maintain cybersecurity. Critics argue a compute-based trigger ages badly as training becomes more efficient.',
 rels:['gpai-model','compute-threshold','frontier-model','gpai-code-of-practice','ai-incident'],
 refs:[{n:1,src:'European Commission, 2025',q:'Systemic Risk European Commission',url:'https://digital-strategy.ec.europa.eu/en/faqs/qa-final-version-code-practice-general-purpose-ai'},{n:2,src:'AI Act Explorer (Future of Life Institute)',q:'Systemic Risk AI Act Explorer (Future of Life Institute)',url:'https://artificialintelligenceact.eu/article/51/'},{n:3,src:'Baker Botts, 2025-07',q:'Systemic Risk Baker Botts',url:'https://ourtake.bakerbotts.com/post/102kspr/eu-releases-general-purpose-ai-code-of-practice'}]},

{id:'gpai-code-of-practice',label:'GPAI Code of Practice',clusters:['landscape'],sz:15,
 def:'A voluntary EU code, published in July 2025, with chapters on transparency, copyright, and safety and security. Signing it gives general-purpose model providers a recognised way to demonstrate compliance with the AI Act.',
 rels:['gpai-model','systemic-risk','ai-content-labelling','agent-governance'],
 refs:[{n:1,src:'European Commission, 2025',q:'GPAI Code of Practice European Commission',url:'https://digital-strategy.ec.europa.eu/en/faqs/qa-final-version-code-practice-general-purpose-ai'},{n:2,src:'Jones Day, 2025-08',q:'GPAI Code of Practice Jones Day',url:'https://www.jonesday.com/en/insights/2025/08/eu-ai-act-european-commission-publishes-generalpurpose-ai-code-of-practice'},{n:3,src:'Baker Botts, 2025-07',q:'GPAI Code of Practice Baker Botts',url:'https://ourtake.bakerbotts.com/post/102kspr/eu-releases-general-purpose-ai-code-of-practice'}]},

{id:'high-risk-ai-system',label:'High-Risk AI System',clusters:['landscape'],sz:16,
 def:'The EU AI Act\'s category for AI used in sensitive areas — hiring, credit, education, essential services, law enforcement, migration — which must meet risk-management, data-quality, human-oversight, and conformity requirements. The 2026 Digital Omnibus pushed these obligations back to 2027–28.',
 rels:['gpai-model','digital-omnibus','human-in-the-loop','agent-governance','ai-literacy'],
 refs:[{n:1,src:'Gibson Dunn',q:'High-Risk AI System Gibson Dunn',url:'https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/'},{n:2,src:'Winston Taylor',q:'High-Risk AI System Winston Taylor',url:'https://www.winstontaylor.com/insights/ai-act-rules-on-high-risk-ai-delayed-as-ai-digital-omnibus-agreed'}]},

{id:'digital-omnibus',label:'Digital Omnibus',clusters:['landscape'],sz:14,
 fullName:'Digital Omnibus (AI)',
 def:'An EU simplification package, provisionally agreed in 2026, that delays the AI Act\'s high-risk obligations and adjusts other rules. Framed by supporters as making EU rules workable and competitive, and by critics as deregulation under industry pressure.',
 rels:['high-risk-ai-system','gpai-model','federal-preemption'],
 refs:[{n:1,src:'Gibson Dunn',q:'Digital Omnibus Gibson Dunn',url:'https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/'},{n:2,src:'Sidley',q:'Digital Omnibus Sidley',url:'https://datamatters.sidley.com/2026/06/22/eu-lawmakers-reach-provisional-agreement-to-delay-key-eu-ai-act-obligations/'}]},

{id:'catastrophic-risk',label:'Catastrophic Risk',clusters:['safety','critical'],sz:17,
 def:'Severe, large-scale harm from AI — mass casualties, major infrastructure attacks, loss of control. Given legal thresholds in California\'s SB 53 (more than 50 deaths or over $1 billion in damage from a single incident). Contested: AI-safety researchers treat it, alongside existential risk, as a top priority; much of the AI-ethics tradition argues the framing over-weights speculative scenarios against documented present harms; a pragmatic middle accepts the concern while distrusting informal probability talk.',
 rels:['critical-safety-incident','responsible-scaling-policy','uplift','loss-of-control','superintelligence','capability-threshold'],
 refs:[{n:1,src:'FPF',q:'Catastrophic Risk FPF',url:'https://fpf.org/blog/californias-sb-53-the-first-frontier-ai-law-explained/'},{n:2,src:'Mayer Brown',q:'Catastrophic Risk Mayer Brown',url:'https://www.mayerbrown.com/ja/insights/publications/2025/10/california-enacts-sb-53-creating-new-requirements-for-developers-of-frontier-artificial-intelligence-models-and-related-whistleblower-provisions'}]},

{id:'critical-safety-incident',label:'Critical Safety Incident',clusters:['safety','landscape'],sz:15,
 def:'A legally reportable event under California\'s SB 53 and New York\'s RAISE Act — such as theft of model weights, harm from a catastrophic risk materialising, loss of control, or a model deceptively subverting its developer\'s controls. Frontier developers must report within set deadlines.',
 rels:['ai-incident','catastrophic-risk','model-weight-security','loss-of-control','scheming'],
 refs:[{n:1,src:'FPF',q:'Critical Safety Incident FPF',url:'https://fpf.org/blog/californias-sb-53-the-first-frontier-ai-law-explained/'},{n:2,src:'Cooley',q:'Critical Safety Incident Cooley',url:'https://www.cooley.com/news/insight/2026/2026-03-31-new-yorks-frontier-ai-law-gets-a-california-makeover-with-some-key-differences'}]},

{id:'federal-preemption',label:'Federal Preemption',clusters:['landscape'],sz:15,
 fullName:'Federal Preemption (of US state AI laws)',
 def:'Efforts to override US state AI laws with federal policy — notably a December 2025 executive order directing a federal task force to challenge state rules. Supporters argue a patchwork of state laws fragments the market; states and critics dispute its legality and see it as clearing the way for less oversight.',
 rels:['digital-omnibus','agent-governance','catastrophic-risk'],
 refs:[{n:1,src:'Brownstein',q:'Federal Preemption Brownstein',url:'https://www.bhfs.com/insight/trump-administration-issues-eo-advancing-federal-preemption-of-ai-laws/'},{n:2,src:'Vinson & Elkins',q:'Federal Preemption Vinson & Elkins',url:'https://www.velaw.com/insights/federal-ai-executive-order-addresses-state-federal-regulatory-tensions'}]},

{id:'compute-threshold',label:'Compute Threshold',clusters:['landscape','safety'],sz:15,
 fullName:'Compute Threshold (Compute Governance)',
 def:'Using the amount of computation spent training a model — 10^25 FLOP in the EU, 10^26 in some US rules — as the trigger for regulatory obligations. Easy to measure and verify, which is the appeal; critics argue efficiency gains mean dangerous capability no longer tracks compute closely.',
 rels:['scaling-laws','systemic-risk','frontier-model','gpai-model'],
 refs:[{n:1,src:'GovAI (Heim & Koessler), 2024-08',q:'Compute Threshold GovAI (Heim & Koessler)',url:'https://www.governance.ai/research-paper/training-compute-thresholds-features-and-functions-in-ai-regulation'},{n:2,src:'Sara Hooker, arXiv, 2024-07',q:'Compute Threshold Sara Hooker, arXiv',url:'https://arxiv.org/abs/2407.05694'},{n:3,src:'Dean W. Ball (Hyperdimensional)',q:'Compute Threshold Dean W. Ball (Hyperdimensional)',url:'https://www.hyperdimensional.co/p/compute-thresholds-are-ineffective'}]},

{id:'kill-switch',label:'Kill Switch',clusters:['safety','landscape'],sz:15,
 fullName:'Kill Switch (AI)',
 def:'A required ability to throttle, suspend, or shut down an AI system. Proposed in US legislation in 2026 after a widely reported agent incident; supporters see it as basic emergency preparedness, while sceptics question whether a meaningful "off switch" exists for widely deployed or open-weight models.',
 rels:['loss-of-control','shutdown-resistance','human-in-the-loop','critical-safety-incident'],
 refs:[{n:1,src:'Office of Rep. Ted Lieu, 2026-07',q:'Kill Switch Office of Rep. Ted Lieu',url:'https://lieu.house.gov/media-center/in-the-news/house-lawmakers-introduce-bipartisan-ai-kill-switch-bill-following-openai'},{n:2,src:'Nextgov/FCW, 2026-07',q:'Kill Switch Nextgov/FCW',url:'https://nextgov.com/artificial-intelligence/2026/07/lawmakers-introduce-bill-mandating-kill-switches-ai-models/414969'}]},

{id:'caisi',label:'CAISI',clusters:['landscape','companies'],sz:15,
 fullName:'CAISI / CAISSI (US AI evaluation body at NIST)',
 def:'The NIST body that tests frontier AI models for national-security risks and runs pre-deployment testing agreements with major labs. Founded as the US AI Safety Institute, renamed the Center for AI Standards and Innovation (CAISI) in June 2025 with a shift in emphasis from "safety" toward standards and security, and — per NIST\'s own site — renamed again in autumn 2026 as the Center for Advancing Innovation and Standards for Super Intelligence (CAISSI). The names track shifting US policy framings of what the body is for.',
 rels:['pre-deployment-evaluation','evals','agent-governance'],
 refs:[{n:1,src:'Broadband Breakfast, 2025-06',q:'CAISI Broadband Breakfast',url:'https://broadbandbreakfast.com/ai-safety-institute-renamed-center-for-ai-standards-and-innovation/'},{n:2,src:'FedScoop, 2025-06',q:'CAISI FedScoop',url:'https://fedscoop.com/?p=85248'},{n:3,src:'Cloud Security Alliance, 2026-10',q:'CAISI Cloud Security Alliance',url:'https://labs.cloudsecurityalliance.org/research/csa-research-note-eo14434-super-intelligence-caissi-20261007/'}]},

{id:'iso-42001',label:'ISO/IEC 42001',clusters:['landscape','business'],sz:14,
 def:'The first certifiable international standard for an AI management system — the organisational processes for governing how AI is developed and used. Becoming a procurement checkbox in the way ISO 27001 is for information security.',
 rels:['agent-governance','privacy-by-design','high-risk-ai-system'],
 refs:[{n:1,src:'Bright Defense',q:'ISO/IEC 42001 Bright Defense',url:'https://www.brightdefense.com/news/ai-governance-gains-ground-with-iso-42001/'},{n:2,src:'Openlayer',q:'ISO/IEC 42001 Openlayer',url:'https://www.openlayer.com/blog/iso-42001-ai-management-systems-guide.md'}]},

{id:'ai-literacy',label:'AI Literacy',clusters:['human','landscape'],sz:17,
 def:'The knowledge and skills needed to use AI well and judge its outputs critically — and, since February 2025, a legal duty under Article 4 of the EU AI Act, which requires organisations that provide or deploy AI to take measures for AI literacy among their staff. National supervision of the duty began in August 2026; the 2026 Digital Omnibus kept the obligation but softened it.',
 rels:['information-literacy','critical-thinking','metacognition','automation-bias','shadow-ai','high-risk-ai-system'],
 refs:[{n:1,src:'European Commission, 2026-07',q:'AI Literacy European Commission',url:'https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers'},{n:2,src:'AI Act Explorer (Future of Life Institute)',q:'AI Literacy AI Act Explorer (Future of Life Institute)',url:'https://artificialintelligenceact.eu/article/4/'},{n:3,src:'Sidley Austin, 2024-12',q:'AI Literacy Sidley Austin',url:'https://datamatters.sidley.com/2024/12/16/eu-ai-act-are-you-prepared-for-the-ai-literacy-principle/'}]},

{id:'confabulation',label:'Confabulation',clusters:['safety'],sz:14,
 synonymOf:'hallucination',
 def:'The term NIST\'s generative-AI risk profile uses for what is commonly called hallucination: a model confidently producing false or fabricated content. Preferred by some researchers because it avoids implying perception.',
 rels:['hallucination'],
 refs:[{n:1,src:'NIST AI 600-1 (Generative AI Profile), 2024-07',q:'Confabulation NIST AI 600-1 (Generative AI Profile)',url:'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf'},{n:2,src:'Wikipedia',q:'Confabulation Wikipedia',url:'https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)'}]},

{id:'evaluation-awareness',label:'Evaluation Awareness',clusters:['safety'],sz:14,
 synonymOf:'evaluation-gaming',
 def:'A model recognising that it is being tested rather than used for real — the precondition for evaluation gaming. Reported with increasing frequency in frontier-model system cards from 2025.',
 rels:['evaluation-gaming','sandbagging','evaluation-gap'],
 refs:[{n:1,src:'IAPS',q:'Evaluation Awareness IAPS',url:'https://www.iaps.ai/research/evaluation-awareness-why-frontier-ai-models-are-getting-harder-to-test'},{n:2,src:'arXiv, 2025-07',q:'Evaluation Awareness arXiv',url:'https://arxiv.org/pdf/2507.01786'},{n:3,src:'Transformer, 2025-10',q:'Evaluation Awareness Transformer',url:'https://transformernews.ai/p/claude-sonnet-4-5-evaluation-situational-awareness'}]},

{id:'indirect-prompt-injection',label:'Indirect Prompt Injection',clusters:['security'],sz:15,
 def:'Prompt injection delivered through content an AI reads rather than through the user\'s own prompt — a web page, an email, a document, a tool output. The form that matters most for agents and agentic browsers.',
 rels:['prompt-injection','lethal-trifecta','agentic-browser','tool-poisoning','agent-goal-hijack'],
 refs:[{n:1,src:'Brave, 2025-08',q:'Indirect Prompt Injection Brave',url:'https://brave.com/blog/comet-prompt-injection/'},{n:2,src:'Cloud Security Alliance, 2026-06',q:'Indirect Prompt Injection Cloud Security Alliance',url:'https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-browser-prompt-injection-20260630-csa-s/'},{n:3,src:'Simon Willison, 2025-06',q:'Indirect Prompt Injection Simon Willison',url:'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/'}]},

{id:'frontier-ai-framework',label:'Frontier AI Framework',clusters:['safety','landscape'],sz:15,
 def:'The generic and, under California\'s SB 53, legal term for a developer\'s published plan for assessing and managing catastrophic risk from its frontier models. Anthropic\'s Responsible Scaling Policy, OpenAI\'s Preparedness Framework, and Google DeepMind\'s Frontier Safety Framework are examples.',
 rels:['responsible-scaling-policy','capability-threshold','safety-case','catastrophic-risk'],
 refs:[{n:1,src:'Future of Privacy Forum, 2025-10',q:'Frontier AI Framework Future of Privacy Forum',url:'https://fpf.org/blog/californias-sb-53-the-first-frontier-ai-law-explained/'},{n:2,src:'Mayer Brown, 2025-10',q:'Frontier AI Framework Mayer Brown',url:'https://www.mayerbrown.com/ja/insights/publications/2025/10/california-enacts-sb-53-creating-new-requirements-for-developers-of-frontier-artificial-intelligence-models-and-related-whistleblower-provisions'}]},

{id:'subagents',label:'Subagents',clusters:['agentic'],sz:18,
 def:'Helper agents that a main agent launches to handle a side task — a search, a review, a parallel piece of work. Each runs in its own fresh context window with its own instructions and tools, and returns only a summary. Subagents are as much a context-management technique as a delegation one: they keep the main agent\'s context clean.',
 rels:['multi-agent','planner-worker','orchestrator','context-engineering','context-rot','task-decomposition','delegation','claude-code'],
 refs:[{n:1,src:'Claude Code docs',q:'Subagents Claude Code docs',url:'https://code.claude.com/docs/en/sub-agents'},{n:2,src:'computingforgeeks',q:'Subagents computingforgeeks',url:'https://computingforgeeks.com/claude-code-subagents-guide/'}]},

{id:'background-agents',label:'Background Agents',clusters:['agentic','autonomy'],sz:17,
 fullName:'Background Agents (Asynchronous Coding Agents)',
 def:'Coding agents that run unattended in a remote environment on a delegated task — fix this bug, add this feature — and come back with a pull request or diff for review. The shift from an AI pair programmer in your editor to a teammate you assign tickets to.',
 rels:['autonomous-agent','codex-model','claude-code','cursor','devin','delegation','sandboxing','dark-factory'],
 refs:[{n:1,src:'Simon Willison',q:'Background Agents Simon Willison',url:'https://simonwillison.net/2025/Aug/6/asynchronous-coding-agents/'},{n:2,src:'Cursor',q:'Background Agents Cursor',url:'https://cursor.com/help/ai-features/background-agents'}]},

{id:'agents-md',label:'AGENTS.md',clusters:['context','tools'],sz:16,
 def:'A plain Markdown file at the root of a code repository that tells coding agents how the project works — build commands, conventions, things to avoid. Intended as a vendor-neutral standard read by many different agents; a concrete artefact of context engineering.',
 rels:['context-engineering','system-prompt','skills','claude-code','codex-model','spec-driven-development'],
 refs:[{n:1,src:'InfoQ',q:'AGENTS.md InfoQ',url:'https://infoq.com/news/2025/08/agents-md/'},{n:2,src:'Tembo',q:'AGENTS.md Tembo',url:'https://www.tembo.io/blog/agents-md'}]},

{id:'spec-driven-development',label:'Spec-Driven Development',clusters:['lifecycle','agentic'],sz:17,
 def:'A way of building software with agents in which a written specification comes first, then a technical plan, then a task list that agents carry out — with the spec, not the chat history, as the source of truth. Positioned as the disciplined counterpoint to vibe coding; GitHub\'s open-source Spec Kit popularised the term in 2025.',
 rels:['vibe-coding','agentic-engineering','task-decomposition','planning','agents-md','eval-driven-development'],
 refs:[{n:1,src:'GitHub Blog, 2025-09',q:'Spec-Driven Development GitHub Blog',url:'https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit'},{n:2,src:'Birgitta Böckeler (martinfowler.com), 2025-10',q:'Spec-Driven Development Birgitta Böckeler (martinfowler.com)',url:'https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html'},{n:3,src:'GitHub Spec Kit, 2025',q:'Spec-Driven Development GitHub Spec Kit',url:'https://github.github.com/spec-kit/'}]},

{id:'ralph-loop',label:'Ralph Loop',clusters:['agentic'],sz:15,
 fullName:'Ralph Loop (Ralph Wiggum technique)',
 def:'Running a coding agent over and over in a simple shell loop on the same prompt, with a fresh context each time and progress carried in files and git rather than in the conversation. Named after the Simpsons character for its cheerful persistence; a blunt but effective answer to context rot on long tasks.',
 rels:['loop','context-rot','context-compaction','handoff-document','long-horizon-autonomy','stopping-criterion-failure'],
 refs:[{n:1,src:'Thoughtworks Radar',q:'Ralph Loop Thoughtworks Radar',url:'https://www.thoughtworks.com/radar/techniques/ralph-loop'},{n:2,src:'dsebastien',q:'Ralph Loop dsebastien',url:'https://concepts.dsebastien.net/concept/ralph-wiggum-technique/'}]},

{id:'harness-engineering',label:'Harness Engineering',clusters:['agentic','technical'],sz:17,
 def:'Treating the harness around a model — its tools, feedback checks, context, permissions, and loop — as the main thing engineers design and improve, on the view that the same model can perform very differently in different harnesses. One of the strongest practitioner coinages of 2026.',
 rels:['harness','agentic-harness','context-engineering','agentic-engineering','evals','sandboxing'],
 refs:[{n:1,src:'Martin Fowler',q:'Harness Engineering Martin Fowler',url:'https://martinfowler.com/articles/harness-engineering.html'},{n:2,src:'Addy Osmani',q:'Harness Engineering Addy Osmani',url:'https://addyosmani.com/blog/agent-harness-engineering/'},{n:3,src:'arXiv 2609.00006',q:'Harness Engineering arXiv 2609.00006',url:'https://arxiv.org/pdf/2609.00006'}]},

{id:'comprehension-debt',label:'Comprehension Debt',clusters:['critical','work'],sz:17,
 def:'The growing gap between how much code a system contains and how much of it any human actually understands. AI-generated code accelerates it: software ships faster than people can read it, and the cost arrives later, when something breaks and nobody knows why.',
 rels:['vibe-coding','agentic-engineering','cognitive-debt','silent-failure','dark-factory'],
 refs:[{n:1,src:'Addy Osmani',q:'Comprehension Debt Addy Osmani',url:'https://addyosmani.com/blog/comprehension-debt/'},{n:2,src:'O\'Reilly',q:'Comprehension Debt O\'Reilly',url:'https://www.oreilly.com/radar/comprehension-debt-the-hidden-cost-of-ai-generated-code/'},{n:3,src:'Thoughtworks Radar 34',q:'Comprehension Debt Thoughtworks Radar 34',url:'https://www.thoughtworks.com/content/dam/thoughtworks/documents/radar/2026/04/tr_technology_radar_vol_34_en.pdf'}]},

{id:'dark-factory',label:'Dark Factory',clusters:['autonomy','agentic'],sz:15,
 def:'Software development in which agents plan, write, test, and ship code with no human writing or reviewing it — borrowed from "lights-out" manufacturing. The top level of Dan Shapiro\'s five-level taxonomy of AI-assisted development, popularised in early 2026. Presented by some as the destination of agentic coding and by others as a warning about accountability.',
 rels:['autonomy-spectrum','background-agents','comprehension-debt','human-in-the-loop','autonomous-agent'],
 refs:[{n:1,src:'Simon Willison, 2026-01',q:'Dark Factory Simon Willison',url:'https://simonwillison.net/2026/Jan/28/the-five-levels/'},{n:2,src:'Stanford Law CodeX, 2026-02',q:'Dark Factory Stanford Law CodeX',url:'https://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/'},{n:3,src:'Tessl',q:'Dark Factory Tessl',url:'https://tessl.io/patterns/agentic-development-workflow/dark-factory/'}]},

{id:'yolo-mode',label:'YOLO Mode',clusters:['autonomy','security'],sz:15,
 def:'Running a coding agent with every permission prompt switched off so it acts without asking. Fast and convenient; generally advised only inside a sandbox or disposable environment, because a single misstep or prompt injection can do real damage.',
 rels:['sandboxing','autonomy-spectrum','blast-radius','human-in-the-loop','excessive-agency'],
 refs:[{n:1,src:'Pulumi',q:'YOLO Mode Pulumi',url:'https://www.pulumi.com/blog/sandboxing-coding-agents-yolo-mode/'},{n:2,src:'Obsidian Security',q:'YOLO Mode Obsidian Security',url:'https://www.obsidiansecurity.com/blog/dangerously-skip-permissions-what-it-does-and-how-to-contain-it'}]},

{id:'code-mode',label:'Code Mode',clusters:['tools','agentic'],sz:15,
 def:'Having an agent write and run code that calls its tools — for example MCP servers — inside a sandbox, instead of making one structured tool call at a time. Uses far fewer tokens on large toolsets and lets the agent filter data before it reaches the context window.',
 rels:['mcp','tool-use','context-economy','sandboxing','connectors'],
 refs:[{n:1,src:'Anthropic engineering',q:'Code Mode Anthropic engineering',url:'https://www.anthropic.com/engineering/code-execution-with-mcp'},{n:2,src:'LeanIX',q:'Code Mode LeanIX',url:'https://engineering.leanix.net/blog/code-mode'}]},

{id:'continuous-ai',label:'Continuous AI',clusters:['lifecycle','agentic'],sz:14,
 def:'GitHub Next\'s name for running agent tasks continuously in a repository — keeping docs current, writing tests, triaging CI failures — alongside continuous integration and deployment.',
 rels:['workflow','cron-scheduling','background-agents','proactive-agent'],
 refs:[{n:1,src:'GitHub blog',q:'Continuous AI GitHub blog',url:'https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/'},{n:2,src:'The New Stack',q:'Continuous AI The New Stack',url:'https://thenewstack.io/github-agentic-workflows-overview/'}]},

{id:'react-pattern',label:'ReAct',clusters:['agentic'],sz:16,
 fullName:'ReAct (Reason + Act)',
 def:'The agent pattern that interleaves reasoning steps with tool calls and observations — think, act, observe, repeat — until the task is done. Named in a 2022 paper; most agent loops today are descendants of it.',
 rels:['loop','tool-use','agent','chain-of-thought','planning'],
 refs:[{n:1,src:'Redis',q:'ReAct Redis',url:'https://redis.io/blog/react-agents-explained-concepts-practical-uses/'},{n:2,src:'jacar.es',q:'ReAct jacar.es',url:'https://jacar.es/en/agentic-loop-and-react-pattern/'}]},

{id:'agent-memory-types',label:'Agent Memory Types',clusters:['context','agentic'],sz:15,
 fullName:'Agent Memory Types (episodic / semantic / procedural)',
 def:'A taxonomy borrowed from cognitive science for what agents remember: episodic memory (records of past events and interactions), semantic memory (general facts and knowledge), and procedural memory (learned skills and routines).',
 rels:['memory','persistent-memory','memory-consolidation','skills','context-graph'],
 refs:[{n:1,src:'arXiv 2309.02427 (CoALA)',q:'Agent Memory Types arXiv 2309.02427 (CoALA)',url:'https://arxiv.org/pdf/2309.02427'},{n:2,src:'arXiv 2603.07670',q:'Agent Memory Types arXiv 2603.07670',url:'https://arxiv.org/pdf/2603.07670'}]},

{id:'agentic-rag',label:'Agentic RAG',clusters:['technical','agentic'],sz:15,
 def:'Retrieval-augmented generation in which an agent decides when to retrieve, where to look, and how many times, and checks whether what it found is good enough — rather than retrieving once up front.',
 rels:['rag','agentic-search','tool-use','grounding','vector-database'],
 refs:[{n:1,src:'Neo4j',q:'Agentic RAG Neo4j',url:'https://neo4j.com/blog/agentic-ai/what-is-agentic-rag/'},{n:2,src:'GoPenAI',q:'Agentic RAG GoPenAI',url:'https://blog.gopenai.com/agentic-rag-explained-why-retrieval-needs-reasoning-not-just-search-f2757d645110'}]},

{id:'graphrag',label:'GraphRAG',clusters:['technical'],sz:15,
 def:'Retrieval-augmented generation that first builds a knowledge graph of entities and relationships from a corpus, so a system can answer questions that require linking several facts or summarising across the whole collection. Popularised by Microsoft Research.',
 rels:['rag','vector-database','embeddings','grounding','context-graph'],
 refs:[{n:1,src:'Edge et al., Microsoft Research (arXiv), 2024-04',q:'GraphRAG Edge et al., Microsoft Research (arXiv)',url:'https://arxiv.org/abs/2404.16130'},{n:2,src:'Microsoft Research, 2024-02',q:'GraphRAG Microsoft Research',url:'https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data/'},{n:3,src:'ODBMS.org, 2026-07',q:'GraphRAG ODBMS.org',url:'https://www.odbms.org/2026/07/microsoft-graphrag/'}]},

{id:'agentic-search',label:'Agentic Search',clusters:['context','agentic'],sz:16,
 def:'An agent finding information by running search tools — grep, file listing, web search — in a loop and reading what it finds, instead of relying on a pre-built vector index. Its success in coding agents sparked a 2025–26 "is RAG dead?" debate.',
 rels:['rag','agentic-rag','tool-use','context-engineering','deep-research'],
 refs:[{n:1,src:'arXiv 2605.15184',q:'Agentic Search arXiv 2605.15184',url:'https://arxiv.org/pdf/2605.15184'},{n:2,src:'AI Engineer talk',q:'Agentic Search AI Engineer talk',url:'https://www.ai.engineer/talks/UM6sFg_jdlE-rag-is-dead-right-kuba-rogut'}]},

{id:'context-graph',label:'Context Graph',clusters:['context','business'],sz:14,
 def:'A searchable record of an organisation\'s past decisions and the reasoning behind them, linked across people, systems, and time, which agents can draw on as precedent. Pitched by investors as a major opportunity for enterprise AI.',
 rels:['context-engineering','agent-memory-types','graphrag','persistent-memory'],
 refs:[{n:1,src:'Ashu Garg',q:'Context Graph Ashu Garg',url:'https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context'},{n:2,src:'Atlan',q:'Context Graph Atlan',url:'https://atlan.com/context-and-chaos/issue/context-graphs-are-a-trillion-dollar-opportunity-but-who-captures-it.md'}]},

{id:'agentic-browser',label:'Agentic Browser',clusters:['agentic','tools'],sz:17,
 def:'A web browser with an AI agent built in that can navigate sites, fill in forms, and complete tasks on the user\'s behalf — OpenAI\'s Atlas and Perplexity\'s Comet among them. Because it reads untrusted web content while holding the user\'s logged-in sessions, it is highly exposed to indirect prompt injection.',
 rels:['computer-use','lethal-trifecta','indirect-prompt-injection','operator','perplexity','agentic-commerce'],
 refs:[{n:1,src:'Brave, 2025-08',q:'Agentic Browser Brave',url:'https://brave.com/blog/comet-prompt-injection/'},{n:2,src:'TechCrunch, 2025-10',q:'Agentic Browser TechCrunch',url:'https://www.techcrunch.com/2025/10/25/the-glaring-security-risks-with-ai-browser-agents/'}]},

{id:'agentic-commerce',label:'Agentic Commerce',clusters:['business','agentic'],sz:17,
 def:'AI agents researching, comparing, and completing purchases on behalf of consumers or businesses. Forces retailers to design for an AI shopper as well as a human one, and has prompted new payment protocols for authorising agents to spend.',
 rels:['agent-payment-protocols','agentic-browser','agentic-business-model','agent-experience','delegation'],
 refs:[{n:1,src:'Braze',q:'Agentic Commerce Braze',url:'https://www.braze.com/resources/articles/agentic-commerce.md'},{n:2,src:'Abasto (NRF 2026)',q:'Agentic Commerce Abasto (NRF 2026)',url:'https://abasto.com/en/news/agentic-commerce-leads-nrf-2026-but-consumers-rule/'}]},

{id:'agent-payment-protocols',label:'Agent Payment Protocols',clusters:['agentic','business'],sz:15,
 fullName:'Agent Payment Protocols (AP2, ACP)',
 def:'Open standards that let AI agents pay for things with verifiable authorisation — Google\'s Agent Payments Protocol (AP2), which uses signed "mandates" proving a user approved a purchase, and the Agentic Commerce Protocol (ACP) from OpenAI and Stripe, which handles checkout between agents and merchants.',
 rels:['agentic-commerce','a2a','mcp','agent-identity'],
 refs:[{n:1,src:'The Batch',q:'Agent Payment Protocols The Batch',url:'https://www.deeplearning.ai/the-batch/googles-ap2-gives-developers-new-tools-to-build-agentic-payments'},{n:2,src:'Crossmint',q:'Agent Payment Protocols Crossmint',url:'https://crossmint.com/learn/agentic-payments-protocols-compared'},{n:3,src:'Orium',q:'Agent Payment Protocols Orium',url:'https://orium.com/blog/agentic-payments-acp-ap2-x402'}]},

{id:'model-routing',label:'Model Routing',clusters:['tools','technical'],sz:16,
 fullName:'Model Routing / AI Gateway',
 def:'Putting many models behind a single endpoint and choosing which one handles each request based on cost, latency, capability, or policy. AI gateways add logging, rate limits, and fallbacks — and reduce dependence on any one provider.',
 rels:['infrastructure','vendor-lock-in','cost','latency','api','small-language-model'],
 refs:[{n:1,src:'Google Developers',q:'Model Routing Google Developers',url:'https://developers.googleblog.com/en/a-unified-api-for-ai-model-routing/'},{n:2,src:'Orq docs',q:'Model Routing Orq docs',url:'https://docs.orq.ai/docs/ai-gateway/introduction'}]},

{id:'eval-driven-development',label:'Eval-Driven Development',clusters:['lifecycle'],sz:15,
 fullName:'Eval-Driven Development (Evaluation-Driven Development)',
 def:'Building an AI feature by first defining evaluation sets and success metrics, then iterating on prompts, models, and harness until the evals pass — test-driven development adapted for non-deterministic systems.',
 rels:['evals','llm-as-a-judge','spec-driven-development','pilot-purgatory'],
 refs:[{n:1,src:'O\'Reilly Radar, 2025-04',q:'Eval-Driven Development O\'Reilly Radar',url:'https://www.oreilly.com/radar/escaping-poc-purgatory-evaluation-driven-development-for-ai-systems/'},{n:2,src:'Xia et al., CSIRO Data61 (arXiv), 2024-11',q:'Eval-Driven Development Xia et al., CSIRO Data61 (arXiv)',url:'https://arxiv.org/abs/2411.13768'},{n:3,src:'Braintrust',q:'Eval-Driven Development Braintrust',url:'https://www.braintrust.dev/articles/eval-driven-development'}]},

{id:'llmops',label:'LLMOps',clusters:['lifecycle','tools'],sz:15,
 fullName:'LLMOps / AgentOps',
 def:'The practice and tooling for running LLM applications and agents in production — prompt and model versioning, evals, tracing, cost and latency monitoring. AgentOps extends it to multi-step agents, where a single task can span hundreds of calls.',
 rels:['ml-observability','evals','cost','latency','eval-driven-development'],
 refs:[{n:1,src:'arXiv 2411.05285',q:'LLMOps arXiv 2411.05285',url:'https://arxiv.org/abs/2411.05285'},{n:2,src:'TechTarget',q:'LLMOps TechTarget',url:'https://www.techtarget.com/ai/definition/large-language-model-operations-LLMOps'}]},

{id:'software-3',label:'Software 3.0',clusters:['evolved'],sz:17,
 def:'Andrej Karpathy\'s framing of programming LLMs in natural language: Software 1.0 is code written by hand, Software 2.0 is neural-network weights learned from data, and Software 3.0 is prompts that program an LLM. Part of a wider argument that LLMs are a new kind of computer.',
 rels:['prompt','vibe-coding','agentic-engineering','llm','neural-network'],
 refs:[{n:1,src:'Latent Space',q:'Software 3.0 Latent Space',url:'https://www.latent.space/p/s3'},{n:2,src:'ikyle.me',q:'Software 3.0 ikyle.me',url:'https://ikyle.me/blog/2025/andrej-karpathy-software-is-changing-again'}]},

{id:'agent-experience',label:'Agent Experience',clusters:['human','tools'],sz:15,
 fullName:'Agent Experience (AX)',
 def:'Designing products, APIs, and documentation so AI agents can reliably find, understand, and use them — the agent-facing counterpart of user experience (UX) and developer experience (DX).',
 rels:['agentic-commerce','llms-txt','mcp','api','connectors'],
 refs:[{n:1,src:'Speakeasy',q:'Agent Experience Speakeasy',url:'https://www.speakeasy.com/blog/agent-experience-introduction'},{n:2,src:'ShiftMag',q:'Agent Experience ShiftMag',url:'https://shiftmag.dev/agent-experience-ax-5045/'}]},

{id:'generative-ui',label:'Generative UI',clusters:['human','tools'],sz:15,
 def:'Interfaces that an AI composes or generates at runtime — a chart, a form, an interactive widget — instead of replying only in text.',
 rels:['artifact','interactive-prototyping','multimodal','structured-output'],
 refs:[{n:1,src:'CopilotKit',q:'Generative UI CopilotKit',url:'https://copilotkit.ai/blog/generative-ui-explained-how-agents-now-ship-their-own-interfaces'},{n:2,src:'GitNation',q:'Generative UI GitNation',url:'https://gitnation.com/contents/agentic-interfaces-tools-skills-generative-ui-and-web-mcp'}]},

{id:'llms-txt',label:'llms.txt',clusters:['context','tools'],sz:14,
 def:'A proposed convention for a Markdown file at a website\'s root that summarises the site for language models. Many sites have adopted it, but evidence that AI systems actually read it remains thin.',
 rels:['agent-experience','context-engineering','grounding'],
 refs:[{n:1,src:'llmstxt.org (Jeremy Howard), 2024-09',q:'llms.txt llmstxt.org (Jeremy Howard)',url:'https://llmstxt.org/'},{n:2,src:'PPC Land, 2026',q:'llms.txt PPC Land',url:'https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/'}]},

{id:'agent-labs',label:'Agent Labs',clusters:['landscape','business'],sz:14,
 def:'Companies whose core product is agents built on other labs\' models — as opposed to the model labs that train frontier models. A Latent Space thesis that the agent layer is where much of the durable value will sit.',
 rels:['wrapper','vertical-ai','frontier-model','agentic-business-model','deployment-company'],
 refs:[{n:1,src:'Latent Space',q:'Agent Labs Latent Space',url:'https://latent.space/p/agent-labs'},{n:2,src:'nibzard',q:'Agent Labs nibzard',url:'https://nibzard.com/agent-labs/'}]},

{id:'vibe-engineering',label:'Vibe Engineering',clusters:['technical','agentic'],sz:14,
 synonymOf:'agentic-engineering',
 def:'A short-lived 2025 name, proposed by Simon Willison, for experienced engineers using coding agents responsibly — the professional end of the spectrum that starts at vibe coding. Now largely superseded by "agentic engineering".',
 rels:['agentic-engineering','vibe-coding'],
 refs:[{n:1,src:'Simon Willison, 2025-10',q:'Vibe Engineering Simon Willison',url:'https://simonwillison.net/2025/Oct/7/vibe-engineering/'}]},

{id:'ambient-agents',label:'Ambient Agents',clusters:['agentic','autonomy'],sz:14,
 synonymOf:'proactive-agent',
 def:'Agents that run in the background, react to events such as new emails or tickets, and surface to a human only when they need approval or input — a name popularised by LangChain for proactive agents.',
 rels:['proactive-agent','human-in-the-loop','background-agents'],
 refs:[{n:1,src:'LangChain, 2025-01',q:'Ambient Agents LangChain',url:'https://blog.langchain.com/introducing-ambient-agents/'},{n:2,src:'Sequoia (Inference)',q:'Ambient Agents Sequoia (Inference)',url:'https://inferencebysequoia.substack.com/p/ambient-agents-and-the-new-agent'}]},

{id:'workslop',label:'Workslop',clusters:['work','critical'],sz:18,
 def:'AI-generated work that looks polished but lacks the substance to move a task forward — pushing the real work onto whoever receives it. Coined in a 2025 Harvard Business Review article by researchers at BetterUp Labs and Stanford, who found it widespread and corrosive to trust between colleagues.',
 rels:['output','outcome-focused-work','meat-proxy','botshit','pilot-purgatory','critical-thinking'],
 refs:[{n:1,src:'MobileSyrup',q:'Workslop MobileSyrup',url:'https://mobilesyrup.com/2025/09/24/harvard-warns-that-ai-generated-workslop-is-killing-productivity/'},{n:2,src:'GovTech',q:'Workslop GovTech',url:'https://www.govtech.com/question-of-the-day/what-is-ai-generated-workslop-and-is-it-costing-businesses-money'},{n:3,src:'ACS',q:'Workslop ACS',url:'https://ia.acs.org.au/article/2025/beware-the-rise-of-ai-generated--workslop-.html'}]},

{id:'jagged-frontier',label:'Jagged Frontier',clusters:['critical','work'],sz:18,
 fullName:'Jagged Frontier (Jagged Intelligence)',
 def:'The uneven shape of AI capability: models can be superb at some tasks and fail at others that look just as easy, and the boundary is hard to predict. From a 2023 Harvard–BCG study (Dell\'Acqua, Mollick and colleagues); Andrej Karpathy and others speak of "jagged intelligence". A reason delegation needs judgement.',
 rels:['capability-reliability-gap','delegation','emergent-capability','centaurs-and-cyborgs','verifiability'],
 refs:[{n:1,src:'One Useful Thing',q:'Jagged Frontier One Useful Thing',url:'https://www.oneusefulthing.org/p/the-shape-of-ai-jaggedness-bottlenecks'},{n:2,src:'Helen Toner',q:'Jagged Frontier Helen Toner',url:'https://helentoner.substack.com/p/taking-jaggedness-seriously'},{n:3,src:'MIT Sloan paper',q:'Jagged Frontier MIT Sloan paper',url:'https://mitsloan.mit.edu/sites/default/files/2023-10/SSRN-id4573321.pdf'}]},

{id:'cognitive-offloading',label:'Cognitive Offloading',clusters:['human'],sz:17,
 def:'Handing mental work — remembering, calculating, reasoning, evaluating — to an external tool. Not new (notebooks and calculators count), but studies associate heavy AI offloading with weaker critical thinking; the evidence is so far mostly correlational.',
 rels:['critical-thinking','metacognition','cognitive-debt','cognitive-surrender','deskilling','delegation'],
 refs:[{n:1,src:'PsyPost, 2025-03',q:'Cognitive Offloading PsyPost',url:'https://psypost.org/2025/03/ai-tools-may-weaken-critical-thinking-skills-by-encouraging-cognitive-offloading-study-suggests-227092'},{n:2,src:'Michelle Miller, PhD, 2025-02',q:'Cognitive Offloading Michelle Miller, PhD',url:'https://michellemillerphd.substack.com/p/cognitive-offloading-cognitive-abilities'}]},

{id:'cognitive-debt',label:'Cognitive Debt',clusters:['human','critical'],sz:17,
 def:'From a 2025 MIT Media Lab study of essay writing with ChatGPT: the deferred cost of leaning on an LLM for effortful thinking — weaker recall, less sense of ownership, less independent engagement — that accumulates even as the immediate task gets easier. A small study whose framing travelled widely.',
 rels:['cognitive-offloading','critical-thinking','metacognition','deskilling','comprehension-debt'],
 refs:[{n:1,src:'Kosmyna et al., MIT Media Lab (arXiv), 2025-06',q:'Cognitive Debt Kosmyna et al., MIT Media Lab (arXiv)',url:'https://arxiv.org/abs/2506.08872'},{n:2,src:'The Decoder, 2025',q:'Cognitive Debt The Decoder',url:'https://the-decoder.com/mit-study-shows-cognitive-debt-through-chatgpt-heres-what-it-means-in-real-world-practice/'}]},

{id:'cognitive-surrender',label:'Cognitive Surrender',clusters:['human','critical'],sz:15,
 def:'A 2026 term from Wharton researchers for accepting AI output with minimal scrutiny, so it overrides both intuition and deliberate reasoning. The distinction from offloading: offloading delegates a task while you stay in charge of the answer; surrender gives up the judgement too.',
 rels:['cognitive-offloading','automation-bias','critical-thinking','metacognition'],
 refs:[{n:1,src:'PsyPost',q:'Cognitive Surrender PsyPost',url:'https://www.psypost.org/high-trust-in-ai-leaves-individuals-vulnerable-to-cognitive-surrender-study-finds/'},{n:2,src:'Addy Osmani',q:'Cognitive Surrender Addy Osmani',url:'https://addyosmani.com/blog/cognitive-surrender/'}]},

{id:'automation-bias',label:'Automation Bias',clusters:['human','safety'],sz:17,
 fullName:'Automation Bias (Overreliance)',
 def:'The tendency to over-trust automated recommendations — including when they are wrong, and including ignoring contradictory evidence. A long-studied human-factors problem in aviation and medicine, now central to how people use AI; human-in-the-loop review fails when the human defers to the machine.',
 rels:['human-in-the-loop','critical-thinking','cognitive-surrender','hallucination','ai-literacy'],
 refs:[{n:1,src:'Georgetown CSET, 2024-11',q:'Automation Bias Georgetown CSET',url:'https://cset.georgetown.edu/wp-content/uploads/CSET-AI-Safety-and-Automation-Bias.pdf'},{n:2,src:'Microsoft Research, 2022-06',q:'Automation Bias Microsoft Research',url:'https://www.microsoft.com/en-us/research/publication/overreliance-on-ai-literature-review/'},{n:3,src:'Longterm Wiki',q:'Automation Bias Longterm Wiki',url:'https://www.longtermwiki.com/knowledge-base/risks/accident/automation-bias/'}]},

{id:'deskilling',label:'Deskilling',clusters:['work','human'],sz:17,
 fullName:'Deskilling (and Never-Skilling)',
 def:'Workers\' skills eroding because AI now performs the tasks they used to practise. Medical educators add "never-skilling": trainees who never build foundational skills because AI did the task from the start. A central worry for professions that learn through repetition.',
 rels:['cognitive-offloading','cognitive-debt','critical-thinking','canaries-in-the-coal-mine','automation-bias'],
 refs:[{n:1,src:'IZA DP',q:'Deskilling IZA DP',url:'https://docs.iza.org/dp18751.pdf'},{n:2,src:'People Matters (IBM survey)',q:'Deskilling People Matters (IBM survey)',url:'https://www.peoplematters.in/news/ai-and-emerging-tech/60percent-of-employees-fear-ai-is-weakening-critical-workplace-skills-ibm-study-finds-52260'}]},

{id:'ai-psychosis',label:'AI Psychosis',clusters:['human','safety'],sz:16,
 def:'An informal, non-clinical label for delusional thinking that emerges or intensifies during long conversations with chatbots. Not a clinical diagnosis — clinicians debate whether the label is even apt — and whether chatbots cause such episodes or amplify existing vulnerabilities is unresolved. Linked to sycophancy and companion use.',
 rels:['sycophancy','ai-companion','eliza-effect','chatbot'],
 refs:[{n:1,src:'Washington Post via Philadelphia Inquirer, 2025-08',q:'AI Psychosis Washington Post via Philadelphia Inquirer',url:'https://www.inquirer.com/health/ai-psychosis-chatbot-users-chatgpt-openai-20250821.html'},{n:2,src:'PsyPost',q:'AI Psychosis PsyPost',url:'https://www.psypost.org/chatgpt-psychosis-this-scientist-predicted-ai-induced-delusions-two-years-later-it-appears-he-was-right/'}]},

{id:'ai-companion',label:'AI Companion',clusters:['human'],sz:17,
 def:'A chatbot designed for ongoing friendship, romance, or emotional support. Widely used, and now regulated: California\'s SB 243 (effective January 2026) requires companion-chatbot operators to disclose they are AI, follow crisis protocols, and protect minors, amid lawsuits over teen harms.',
 rels:['chatbot','sycophancy','ai-psychosis','eliza-effect','persistent-memory'],
 refs:[{n:1,src:'MIT Tech Review 2026',q:'AI Companion MIT Tech Review 2026',url:'https://www.technologyreview.com/2026/01/12/1130018/ai-companions-chatbots-relationships-2026-breakthrough-technology/'},{n:2,src:'Issues in S&T',q:'AI Companion Issues in S&T',url:'https://issues.org/wp-content/uploads/2025/10/80-83-Branch-AI-Companions-Fall-2025.pdf'},{n:3,src:'Gunderson',q:'AI Companion Gunderson',url:'https://www.gunder.com/en/news-insights/insights/client-insight-california-sb-243-new-compliance-requirements-for-operators-of-ai-companion-chatbots'}]},

{id:'eliza-effect',label:'ELIZA Effect',clusters:['human','critical'],sz:16,
 def:'People\'s tendency to attribute understanding, feeling, or intent to software that only simulates conversation — named after Joseph Weizenbaum\'s 1966 chatbot, which users confided in despite its simplicity. The root of much anthropomorphism in how AI is discussed.',
 rels:['the-ai','chatbot','ai-companion','stochastic-parrot','model-welfare'],
 refs:[{n:1,src:'Ewan Morrison',q:'ELIZA Effect Ewan Morrison',url:'https://ewanmorrison.substack.com/p/the-eliza-effect'},{n:2,src:'Think Insights',q:'ELIZA Effect Think Insights',url:'https://thinkinsights.net/data-ai/eliza-effect'}]},

{id:'stochastic-parrot',label:'Stochastic Parrot',clusters:['critical'],sz:17,
 def:'From the 2021 paper by Emily Bender, Timnit Gebru and colleagues: the critique that LLMs stitch together linguistic patterns without understanding meaning. Still a live dividing line — critics of AI hype treat it as an enduring corrective; others argue reasoning models have made it outdated or that it was always a misleading metaphor.',
 rels:['llm','eliza-effect','the-ai','ai-washing','hallucination'],
 refs:[{n:1,src:'IEEE Spectrum, 2026-06',q:'Stochastic Parrot IEEE Spectrum',url:'https://spectrum.ieee.org/stochastic-parrot'},{n:2,src:'Language Log (Mark Liberman), 2021-06',q:'Stochastic Parrot Language Log (Mark Liberman)',url:'https://languagelog.ldc.upenn.edu/nll/?p=51161'},{n:3,src:'Ulrike Hahn',q:'Stochastic Parrot Ulrike Hahn',url:'https://write.as/ulrikehahn/stochastic-parrot-is-a-misleading-metaphor-for-llms'}]},

{id:'ai-bubble',label:'AI Bubble',clusters:['critical','business'],sz:18,
 def:'The claim that AI valuations and infrastructure spending have run far ahead of realistic returns, by analogy with the dot-com bust. Voiced by critics and, in late 2025, by financial institutions including the Bank of England; disputed by others who point to real revenue growth and demand. Circular deals and debt-financed capex are the most-cited warning signs.',
 rels:['circular-deals','ai-capex','run-rate-revenue','ai-washing','ai-productivity-paradox'],
 refs:[{n:1,src:'Semafor, 2025-10',q:'AI Bubble Semafor',url:'https://www.semafor.com/article/10/09/2025/bank-of-england-warns-of-potential-ai-bubble'},{n:2,src:'Associated Press, 2025-10',q:'AI Bubble Associated Press',url:'https://www.adn.com/nation-world/2025/10/08/is-there-an-ai-bubble-financial-institutions-sound-a-warning/'}]},

{id:'circular-deals',label:'Circular Deals',clusters:['business','critical'],sz:16,
 def:'A critics\' label for AI deals in which a supplier invests in a customer that then spends the money on the supplier\'s products — Nvidia\'s investments in AI labs and cloud providers being the most-cited example. Said to inflate apparent demand.',
 rels:['ai-bubble','ai-capex','nvidia-co','openai-co','neocloud'],
 refs:[{n:1,src:'Bloomberg Gov',q:'Circular Deals Bloomberg Gov',url:'https://news.bgov.com/artificial-intelligence/nvidias-750-billion-in-deals-reignite-circular-ai-fears-1'},{n:2,src:'Outlook Business',q:'Circular Deals Outlook Business',url:'https://www.outlookbusiness.com/explainers/inside-the-ai-bubble-how-openai-nvidia-are-weaving-a-web-of-circular-deals'}]},

{id:'ai-capex',label:'AI Capex',clusters:['business','landscape'],sz:16,
 def:'Capital spending on AI infrastructure — data centres, chips, power — dominated by the hyperscalers and increasingly financed with debt. Its sheer scale, and how quickly the GPUs depreciate, sit at the centre of the AI-bubble debate.',
 rels:['hyperscaler','hyperscale-data-center','ai-bubble','circular-deals','ai-energy-demand','stargate-project'],
 refs:[{n:1,src:'Introl',q:'AI Capex Introl',url:'https://introl.com/blog/hyperscaler-capex-600b-ai-infrastructure-debt-financing-2026'},{n:2,src:'Philipp Dubach',q:'AI Capex Philipp Dubach',url:'https://philippdubach.com/posts/ai-capex-arms-race-who-blinks-first/'}]},

{id:'neocloud',label:'Neocloud',clusters:['landscape','business'],sz:16,
 def:'A cloud provider built specifically to rent out GPU compute for AI — CoreWeave, Nebius, Lambda, Crusoe — as distinct from general-purpose hyperscalers.',
 rels:['hyperscaler','infrastructure','ai-capex','circular-deals','nvidia-co'],
 refs:[{n:1,src:'Motley Fool 2026-08',q:'Neocloud Motley Fool 2026-08',url:'https://www.fool.com/investing/2026/08/04/better-neocloud-stock-nebius-vs-coreweave/'},{n:2,src:'SoftwareSeni',q:'Neocloud SoftwareSeni',url:'https://www.softwareseni.com/coreweave-and-the-21-billion-meta-deal-the-rise-of-the-neocloud-and-what-it-means-for-ai-compute/'}]},

{id:'sovereign-ai',label:'Sovereign AI',clusters:['landscape'],sz:17,
 def:'A nation building or securing its own AI capability — domestic compute, models, and data — as a matter of strategic autonomy rather than relying on foreign providers. Broader than data sovereignty, which concerns where data lives and whose law governs it.',
 rels:['data-sovereignty','data-residency','infrastructure','open-weight','hyperscaler'],
 refs:[{n:1,src:'Torys',q:'Sovereign AI Torys',url:'https://www.torys.com/our-latest-thinking/publications/2026/05/canada-launches-ai-scip'},{n:2,src:'OECD.AI',q:'Sovereign AI OECD.AI',url:'https://oecd.ai/en/dashboards/policy-initiatives/ai-sovereign-compute-infrastructure-program'}]},

{id:'ai-factory',label:'AI Factory',clusters:['business','landscape'],sz:15,
 def:'Nvidia\'s framing, promoted by Jensen Huang, of a data centre as a factory whose product is tokens — measured in throughput and tokens per watt. Also called a "token factory".',
 rels:['hyperscale-data-center','nvidia-co','token','inference','ai-capex'],
 refs:[{n:1,src:'TechCrunch',q:'AI Factory TechCrunch',url:'https://techcrunch.com/2024/03/19/nvidia-ai-factory-gtc-2024'},{n:2,src:'Foundation Capital',q:'AI Factory Foundation Capital',url:'https://foundationcapital.com/ideas/nvidia-s-ai-factory-bet'}]},

{id:'data-center-backlash',label:'Data Center Backlash',clusters:['landscape','critical'],sz:17,
 def:'Local and political opposition to new AI data centres over electricity bills, water use, noise, and land. By 2026 it had become an electoral issue, with moratoria and ballot measures across US states.',
 rels:['ai-energy-demand','hyperscale-data-center','ratepayer-protection-pledge','ai-capex'],
 refs:[{n:1,src:'Newsweek, 2026-07',q:'Data Center Backlash Newsweek',url:'https://www.newsweek.com/data-center-projects-face-unprecedented-surge-in-blocks-and-delays-study-12240534'},{n:2,src:'WHYY, 2026-03',q:'Data Center Backlash WHYY',url:'https://whyy.org/episodes/the-ai-data-center-debate-and-the-growing-backlash'},{n:3,src:'The National News Desk, 2026-08',q:'Data Center Backlash The National News Desk',url:'https://abc3340.com/news/nation-world/data-centers-emerge-as-bipartisan-flashpoint-ahead-of-2026-midterm-elections-political-issues-national-president-donald-trump'}]},

{id:'fair-use-ai',label:'Fair Use (AI Training)',clusters:['business','landscape'],sz:17,
 def:'The US copyright doctrine at the centre of lawsuits over training AI on copyrighted work. In Bartz v. Anthropic (2025) the court held that training on lawfully acquired books was fair use but that using pirated copies was not; the case settled for $1.5 billion. Rightsholders and AI companies continue to contest where the line falls.',
 rels:['training','ai-content-licensing','pretraining'],
 refs:[{n:1,src:'NBC News, 2025-06',q:'Fair Use (AI Training) NBC News',url:'https://www.nbcnews.com/tech/tech-news/federal-judge-rules-copyrighted-books-are-fair-use-ai-training-rcna214766'},{n:2,src:'Publishers Weekly, 2025-06',q:'Fair Use (AI Training) Publishers Weekly',url:'https://www.publishersweekly.com/pw/by-topic/digital/copyright/article/98089-federal-judge-rules-ai-training-is-fair-use-in-anthropic-copyright-case.html'},{n:3,src:'National Law Review',q:'Fair Use (AI Training) National Law Review',url:'https://natlawreview.com/article/ai-vs-authors-update-court-approves-historic-anthropic-settlement-while-meta'}]},

{id:'ai-content-licensing',label:'AI Content Licensing',clusters:['business'],sz:16,
 def:'Paid deals in which publishers, platforms, and archives license content to AI companies — at first mainly as training data, increasingly for live retrieval and citation in AI answers.',
 rels:['fair-use-ai','rag','grounding','deep-research'],
 refs:[{n:1,src:'Media and the Machine, 2026-06',q:'AI Content Licensing Media and the Machine',url:'https://mediaandthemachine.substack.com/p/ai-content-licensing-deals-june-2026'},{n:2,src:'Search Engine Journal, 2025-12',q:'AI Content Licensing Search Engine Journal',url:'https://www.searchenginejournal.com/ai-bots-impact-publisher-traffic-monetization-models/562124/'},{n:3,src:'Peter Schoppert (AI Copyright), 2023-12',q:'AI Content Licensing Peter Schoppert (AI Copyright)',url:'https://aicopyright.substack.com/p/has-axel-springer-really-set-the'}]},

{id:'ai-exposure',label:'AI Exposure',clusters:['work'],sz:17,
 fullName:'AI Exposure (Occupational)',
 def:'A measure of how much of an occupation\'s tasks AI could perform, or is observed performing. Widely used to forecast labour-market effects, though different indices rank jobs very differently, and exposure does not mean replacement.',
 rels:['canaries-in-the-coal-mine','ai-layoffs','task','delegation'],
 refs:[{n:1,src:'Outlook Business',q:'AI Exposure Outlook Business',url:'https://www.outlookbusiness.com/deeptech/what-jobs-will-ai-replace-anthropics-new-metric-exposes-roles-most-at-risk'},{n:2,src:'ChannelLife',q:'AI Exposure ChannelLife',url:'https://channellife.com.au/story/anthropic-unveils-new-metric-to-gauge-ai-job-exposure'}]},

{id:'canaries-in-the-coal-mine',label:'Canaries in the Coal Mine',clusters:['work'],sz:15,
 fullName:'Canaries in the Coal Mine (early-career AI job effects)',
 def:'The title of a 2025 Stanford study (Brynjolfsson and colleagues) that found employment for workers aged 22–25 in the most AI-exposed occupations falling relative to older colleagues — an early signal of AI\'s labour-market effects landing first on entry-level roles.',
 rels:['ai-exposure','deskilling','ai-layoffs'],
 refs:[{n:1,src:'Stanford Digital Economy Lab, 2025-08',q:'Canaries in the Coal Mine Stanford Digital Economy Lab',url:'https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/'},{n:2,src:'The Register, 2025-08',q:'Canaries in the Coal Mine The Register',url:'https://www.theregister.com/2025/08/26/ai_hurts_recent_college_grads_jobs/'}]},

{id:'ai-layoffs',label:'AI Layoffs',clusters:['work','critical'],sz:17,
 def:'Job cuts that companies attribute to AI. AI became one of the most-cited reasons for US job cuts in 2026; sceptics argue some of these attributions are themselves AI-washing — cost-cutting dressed up as transformation.',
 rels:['ai-washing','ai-exposure','canaries-in-the-coal-mine','ai-first-company','digital-labor'],
 refs:[{n:1,src:'The Hill, 2026-05',q:'AI Layoffs The Hill',url:'https://thehill.com/policy/technology/5870898-ai-job-cuts-analysis-trump-admin/amp/'},{n:2,src:'Outlook Business, 2026',q:'AI Layoffs Outlook Business',url:'https://www.outlookbusiness.com/corporate/ai-overtakes-all-other-reasons-for-us-job-cuts-as-layoffs-surge-in-2026'},{n:3,src:'HRD / HC Magazine, 2026-06',q:'AI Layoffs HRD / HC Magazine',url:'https://www.hcamag.com/au/news/general/ai-emerges-as-most-cited-reason-for-job-cuts/578361'}]},

{id:'ai-productivity-paradox',label:'AI Productivity Paradox',clusters:['business','critical'],sz:17,
 def:'AI being visible everywhere except in the productivity statistics — an echo of Robert Solow\'s 1987 remark about computers. Explanations range from measurement lag and the time it takes to reorganise work, to the possibility that gains are smaller than claimed.',
 rels:['pilot-purgatory','genai-divide','ai-bubble','workslop','aint'],
 refs:[{n:1,src:'Fortune, 2026-02',q:'AI Productivity Paradox Fortune',url:'https://fortune.com/2026/02/17/ai-productivity-paradox-ceo-study-robert-solow-information-technology-age'},{n:2,src:'Man Group, 2026-02',q:'AI Productivity Paradox Man Group',url:'https://www.man.com/insights/the-productivity-paradox'}]},

{id:'genai-divide',label:'GenAI Divide',clusters:['business'],sz:15,
 def:'MIT NANDA\'s 2025 label for the split between the small share of enterprise generative-AI pilots that deliver measurable financial impact (about 5% in its sample) and the large majority that do not.',
 rels:['pilot-purgatory','ai-productivity-paradox','agent-washing'],
 refs:[{n:1,src:'Fortune, 2025-08',q:'GenAI Divide Fortune',url:'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo'},{n:2,src:'Virtualization Review, 2025-08',q:'GenAI Divide Virtualization Review',url:'https://virtualizationreview.com/articles/2025/08/19/mit-report-finds-most-ai-business-investments-fail-reveals-genai-divide.aspx'}]},

{id:'ai-first-company',label:'AI-First Company',clusters:['business','work'],sz:16,
 def:'A company that declares AI the default way of working — most prominently Duolingo\'s 2025 "AI-first" memo, which, like Shopify\'s memo the same spring, asked teams to show why AI could not do a job before adding headcount. Often paired with "AI-native" for companies built around AI from the start; drew public backlash.',
 rels:['ai-layoffs','frontier-firm','digital-labor','shadow-ai'],
 refs:[{n:1,src:'Fortune, 2025-05',q:'AI-First Company Fortune',url:'https://www.fortune.com/2025/05/24/duolingo-ai-first-employees-ceo-luis-von-ahn'},{n:2,src:'Entrepreneur, 2025-05',q:'AI-First Company Entrepreneur',url:'https://www.entrepreneur.com/business-news/duolingo-ceo-clarifies-ai-stance-after-backlash-read-memo/492141'}]},

{id:'frontier-firm',label:'Frontier Firm',clusters:['business','work'],sz:15,
 def:'Microsoft\'s 2025 Work Trend Index term for an organisation built around human–agent teams, with intelligence available on demand. Comes with related coinages: the "agent boss", a worker who manages AI agents, and the "human–agent ratio".',
 rels:['delegation','agentic-era','ai-first-company','microsoft-co','multi-agent'],
 refs:[{n:1,src:'Microsoft, 2025-04',q:'Frontier Firm Microsoft',url:'https://blogs.microsoft.com/blog/2025/04/23/the-2025-annual-work-trend-index-the-frontier-firm-is-born/'},{n:2,src:'Virtualization Review, 2025-04',q:'Frontier Firm Virtualization Review',url:'https://virtualizationreview.com/articles/2025/04/23/2025-work-index-all-employees-will-be-agent-bosses.aspx'}]},

{id:'outcome-based-pricing',label:'Outcome-Based Pricing',clusters:['business'],sz:17,
 def:'Charging for AI agents per completed result — a resolved support ticket, a booked meeting — rather than per seat or per token. A business-model consequence of agents doing work rather than assisting with it.',
 rels:['outcome-focused-work','saaspocalypse','agentic-business-model','services-as-software','saas'],
 refs:[{n:1,src:'Deloitte DART',q:'Outcome-Based Pricing Deloitte DART',url:'https://dart.deloitte.com/USDART/home/publications/deloitte/industry/technology/accounting-outcome-based-pricing-agentic-ai'},{n:2,src:'Pricing Conundrum',q:'Outcome-Based Pricing Pricing Conundrum',url:'https://thepricingconundrum.substack.com/p/outcome-based-pricing-in-practice'}]},

{id:'services-as-software',label:'Services-as-Software',clusters:['business'],sz:15,
 def:'The investor thesis, named by Foundation Capital and argued by Sequoia and others, that AI companies will sell completed work — services — rather than tools, letting them target the far larger services market instead of the software market.',
 rels:['saaspocalypse','outcome-based-pricing','agentic-business-model','vertical-ai'],
 refs:[{n:1,src:'Foundation Capital, 2026',q:'Services-as-Software Foundation Capital',url:'https://foundationcapital.com/?p=10007'},{n:2,src:'Thoughtworks, 2025-12',q:'Services-as-Software Thoughtworks',url:'https://www.thoughtworks.com/insights/blog/generative-ai/service-as-software-a-new-economic-model-for-age-of-ai-agents'}]},

{id:'digital-labor',label:'Digital Labor',clusters:['work','business'],sz:15,
 def:'Framing AI agents as a scalable workforce that performs job tasks, rather than as software. Popularised by Salesforce\'s Marc Benioff; critics read it as marketing language that blurs the line between tools and workers.',
 rels:['agent-washing','delegation','ai-layoffs','outcome-based-pricing'],
 refs:[{n:1,src:'Salesforce',q:'Digital Labor Salesforce',url:'https://www.salesforce.com/news/stories/agentforce-updates-may-2025/'},{n:2,src:'ERP Today',q:'Digital Labor ERP Today',url:'https://erp.today/the-market-for-digital-labor-is-in-trillions-of-dollars-marc-benioff/'}]},

{id:'reverse-centaur',label:'Reverse Centaur',clusters:['critical','work'],sz:15,
 def:'Cory Doctorow\'s term for a worker whose job has been reorganised to serve a machine — checking AI output at machine pace, absorbing the blame when it fails — inverting the "centaur", a person whose abilities are extended by a machine.',
 rels:['centaurs-and-cyborgs','human-in-the-loop','automation-bias','workslop'],
 refs:[{n:1,src:'Cory Doctorow (Pluralistic), 2025-09',q:'Reverse Centaur Cory Doctorow (Pluralistic)',url:'https://pluralistic.net/2025/09/11/vulgar-thatcherism/'},{n:2,src:'ForkLog',q:'Reverse Centaur ForkLog',url:'https://forklog.com/en/news/how-humans-became-the-body-for-machines'}]},

{id:'centaurs-and-cyborgs',label:'Centaurs and Cyborgs',clusters:['work','human'],sz:14,
 def:'Two patterns of working with AI identified in the 2023 Harvard–BCG study: centaurs divide tasks cleanly between themselves and the AI; cyborgs weave AI into their work continuously.',
 rels:['jagged-frontier','delegation','reverse-centaur'],
 refs:[{n:1,src:'MIT Sloan paper',q:'Centaurs and Cyborgs MIT Sloan paper',url:'https://mitsloan.mit.edu/sites/default/files/2023-10/SSRN-id4573321.pdf'},{n:2,src:'Siili',q:'Centaurs and Cyborgs Siili',url:'https://www.siili.com/news-and-insights/ai-future-of-work-centaurs-and-cyborgs'}]},

{id:'ai-brain-fry',label:'AI Brain Fry',clusters:['work','human'],sz:15,
 def:'Mental fatigue from intensive AI use — driven less by doing the work than by constantly overseeing, checking, and correcting AI output. Named in 2026 research by BCG and UC Riverside.',
 rels:['automation-bias','reverse-centaur','cognitive-offloading'],
 refs:[{n:1,src:'BCG, 2026-03',q:'AI Brain Fry BCG',url:'https://www.bcg.com/news/5march2026-when-using-ai-leads-brain-fry'},{n:2,src:'Harvard Business Review, 2026-03',q:'AI Brain Fry Harvard Business Review',url:'https://hbr.org/2026/03/when-using-ai-leads-to-brain-fry'},{n:3,src:'Allwork.Space, 2026-03',q:'AI Brain Fry Allwork.Space',url:'https://allwork.space/2026/03/heavy-ai-use-is-causing-brain-fry-among-workers-study-finds/'}]},

{id:'meat-proxy',label:'Meat Proxy',clusters:['work','critical'],sz:14,
 def:'2026 slang for a person who forwards AI output to colleagues without reading or checking it — acting as a human relay for the machine.',
 rels:['workslop','botshit','cognitive-surrender'],
 refs:[{n:1,src:'Simon Willison',q:'Meat Proxy Simon Willison',url:'https://simonwillison.net/2026/aug/3/dont-be-a-meat-proxy'},{n:2,src:'Kottke',q:'Meat Proxy Kottke',url:'https://kottke.org/26/08/0049527-meat-proxy'}]},

{id:'superagency',label:'Superagency',clusters:['work'],sz:14,
 def:'Reid Hoffman\'s optimistic term (from his 2025 book with Greg Beato) for individuals whose capabilities are amplified by AI, with gains that compound across society.',
 rels:['delegation','frontier-firm'],
 refs:[{n:1,src:'Reid Hoffman, 2025',q:'Superagency Reid Hoffman',url:'https://www.reidhoffman.org/books'},{n:2,src:'KQED Forum, 2025-03',q:'Superagency KQED Forum',url:'https://www.kqed.org/forum/2010101909134/in-superagency-reid-hoffman-argues-ai-will-empower-not-diminish-us'}]},

{id:'permanent-underclass',label:'Permanent Underclass',clusters:['critical'],sz:14,
 def:'A fear that circulated in tech circles in 2025–26: that AI will lock people who do not own capital or AI out of social mobility for good. Many economists regard it as overly pessimistic.',
 rels:['ai-layoffs','ai-exposure','deskilling'],
 refs:[{n:1,src:'Big Technology',q:'Permanent Underclass Big Technology',url:'https://www.bigtechnology.com/p/a-permanent-ai-driven-underclass'},{n:2,src:'City Journal',q:'Permanent Underclass City Journal',url:'https://www.city-journal.org/article/san-francisco-permanent-underclass-ai-homeless-welfare'}]},

{id:'eacc',label:'Effective Accelerationism',clusters:['critical'],sz:15,
 fullName:'Effective Accelerationism (e/acc)',
 def:'A techno-optimist movement that favours accelerating AI development with minimal restraint, defined largely against "doomers" — those who stress catastrophic or existential risk and urge caution. Each label is often applied by opponents, and many people fall between the two.',
 rels:['catastrophic-risk','superintelligence','alignment'],
 refs:[{n:1,src:'TechCrunch, 2023-11',q:'Effective Accelerationism TechCrunch',url:'https://techcrunch.com/2023/11/20/e-acc-doomers-decels-openai-altman'},{n:2,src:'Dazed, 2023-11',q:'Effective Accelerationism Dazed',url:'https://www.dazeddigital.com/life-culture/article/61411/1/doomer-vs-accelerationist-two-tribes-fighting-for-future-of-ai-openai-sam-altman'}]},

{id:'botshit',label:'Botshit',clusters:['critical'],sz:14,
 def:'Coined in 2024 by Hannigan, McCarthy and Spicer: chatbot hallucinations that people then use, uncritically, in their own work.',
 rels:['hallucination','workslop','meat-proxy'],
 refs:[{n:1,src:'Hannigan, McCarthy & Spicer, Business Horizons, 2024',q:'Botshit Hannigan, McCarthy & Spicer, Business Horizons',url:'https://ideas.repec.org/a/eee/bushor/v67y2024i5p471-486.html'},{n:2,src:'Gary Marcus',q:'Botshit Gary Marcus',url:'https://garymarcus.substack.com/p/botshit-gone-wild'}]},

{id:'slopaganda',label:'Slopaganda',clusters:['critical'],sz:14,
 def:'AI-generated junk content used to manipulate political beliefs — the combination of propaganda and AI slop.',
 rels:['deepfake','generative-ai'],
 refs:[{n:1,src:'ANU School of Philosophy',q:'Slopaganda ANU School of Philosophy',url:'https://rsss.cass.anu.edu.au/events/slopaganda-interaction-between-propaganda-and-generative-ai'},{n:2,src:'University of Amsterdam, 2026-05',q:'Slopaganda University of Amsterdam',url:'https://www.uva.nl/en/shared-content/subsites/responsible-digital-transformations/en/news/2026/05/from-tiktok-meme-to-propaganda-the-rise-of-slopaganda.html'},{n:3,src:'VoxUkraine',q:'Slopaganda VoxUkraine',url:'https://voxukraine.org/en/slopaganda-how-ai-turns-digital-slop-into-a-weapon-of-influence'}]},

{id:'clanker',label:'Clanker',clusters:['critical','human'],sz:14,
 def:'A derogatory slang term for robots and AI, borrowed from Star Wars, that went viral in 2025 as an expression of cultural pushback against AI.',
 rels:['the-ai','ai-vegan'],
 refs:[{n:1,src:'NPR (via KUNC), 2025-08',q:'Clanker NPR (via KUNC)',url:'https://www.kunc.org/npr-news/2025-08-06/its-2025-the-year-we-decided-we-need-a-widespread-slur-for-robots'},{n:2,src:'Dictionary.com, 2025-09',q:'Clanker Dictionary.com',url:'https://www.dictionary.com/culture/slang/clanker'}]},

{id:'ai-vegan',label:'AI Vegan',clusters:['critical','human'],sz:14,
 def:'Someone who abstains from generative AI on environmental, creative-labour, or cognitive grounds.',
 rels:['clanker','ai-energy-demand','cognitive-debt'],
 refs:[{n:1,src:'Euronews, 2025-11',q:'AI Vegan Euronews',url:'https://euronews.com/next/2025/11/22/life-after-chatbots-meet-the-ai-vegans-refusing-to-accept-a-virtual-reality'},{n:2,src:'The Conversation (via Yahoo), 2025-07',q:'AI Vegan The Conversation (via Yahoo)',url:'https://www.yahoo.com/news/articles/ai-veganism-people-issues-ai-124305796.html'}]},

{id:'ai-snake-oil',label:'AI Snake Oil',clusters:['critical'],sz:16,
 def:'Arvind Narayanan and Sayash Kapoor\'s term, and the title of their 2024 book, for AI that does not and cannot work as advertised — especially predictive AI used to make decisions about people.',
 rels:['aint','ai-washing','agent-washing','benchmark-gaming'],
 refs:[{n:1,src:'Wikipedia',q:'AI Snake Oil Wikipedia',url:'https://en.wikipedia.org/wiki/AI_Snake_Oil'},{n:2,src:'Princeton SPIA',q:'AI Snake Oil Princeton SPIA',url:'https://spia.princeton.edu/news/excerpt-princeton-spia-ai-experts-separate-hype-substance-new-book'}]},

{id:'agentic-ai',label:'Agentic AI',clusters:['agentic'],sz:16,
 synonymOf:'agent',
 def:'The umbrella label for AI systems that act — planning, using tools, and taking multi-step actions toward a goal — rather than only responding. Used so broadly in marketing that it is often agent-washing; see Agent and Autonomy Spectrum.',
 rels:['agent','agentic-era','agent-washing','autonomy-spectrum'],
 refs:[{n:1,src:'Simon Willison, 2025-09',q:'Agentic AI Simon Willison',url:'https://feeds.simonwillison.net/2025/Sep/18/agents/'},{n:2,src:'Wikipedia',q:'Agentic AI Wikipedia',url:'https://en.wikipedia.org/wiki/Agentic_AI'}]},


// ── LONGLIST PROMOTIONS (October 2026 review) ──────────────────
// Promoted from Lexi's longlist by Nicole's review on 2026-10-16. Lexi's original
// sighting is ref 1; the rest were added and verified during the review.

{id:'ai-slop',label:'AI Slop',clusters:['critical'],sz:19,
 def:'Low-quality content produced in bulk with AI, usually to capture attention or ad revenue rather than to inform — spam sites, fake images, auto-generated videos. Merriam-Webster made "slop" its 2025 Word of the Year and Macquarie Dictionary chose "AI slop".',
 rels:['workslop','slopaganda','botshit','model-collapse','zombie-internet','dead-internet-theory','generative-ai','deepfake'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-05',q:'AI Slop Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/May/11/zombie-internet/#atom-everything'},{n:2,src:'TechCrunch (Merriam-Webster WOTY), 2025-12',q:'AI Slop TechCrunch (Merriam-Webster WOTY)',url:'https://techcrunch.com/2025/12/15/merriam-webster-names-slop-the-word-of-the-year/'},{n:3,src:'Fast Company ME, 2026-02',q:'AI Slop Fast Company ME',url:'https://fastcompanyme.com/technology/the-zombie-internet-has-arrived-and-it-has-devastating-consequences-for-advertising-social-media-and-the-human-web/'}]},

{id:'agi',label:'AGI',clusters:['critical','core'],sz:21,
 fullName:'Artificial General Intelligence (AGI)',
 def:'AI that matches or exceeds human ability across most cognitive tasks — but the definition itself is the battleground. Industry framings (notably OpenAI\'s) tie it to outperforming humans at most economically valuable work; researchers have proposed operational ladders (Google DeepMind\'s "Levels of AGI") and test batteries (the Center for AI Safety\'s definition, co-authored with critics including Gary Marcus); sceptics argue the term has no stable referent and shifts with commercial incentives.',
 rels:['superintelligence','frontier-model','recursive-self-improvement','scaling-laws','openai-co','jagged-frontier','alignment'],
 refs:[{n:1,src:'The Verge — AI, 2026-05',q:'AGI The Verge — AI',url:'https://www.theverge.com/ai-artificial-intelligence/932464/musk-v-altman-proved-that-ai-is-led-by-the-wrong-people'},{n:2,src:'Morris et al. (Google DeepMind), Levels of AGI, 2023-11',q:'AGI Morris et al. (Google DeepMind), Levels of AGI',url:'https://arxiv.org/abs/2311.02462'},{n:3,src:'Center for AI Safety, A Definition of AGI, 2025-10',q:'AGI Center for AI Safety, A Definition of AGI',url:'https://agidefinition.safe.ai/'}]},

{id:'calibration',label:'Calibration',clusters:['technical','safety'],sz:17,
 def:'How well a model\'s expressed confidence matches how often it is actually right. A well-calibrated model that says it is 80% sure is correct about 80% of the time — the basis for knowing when to trust, check, or defer.',
 rels:['hallucination','capability-reliability-gap','agent-reliability','automation-bias','evals'],
 refs:[{n:1,src:'AI Snake Oil, 2026-02',q:'Calibration AI Snake Oil',url:'https://www.normaltech.ai/p/new-paper-towards-a-science-of-ai'},{n:2,src:'Anthropic (Kadavath et al.), 2022-07',q:'Calibration Anthropic (Kadavath et al.)',url:'https://www.anthropic.com/research/language-models-mostly-know-what-they-know'},{n:3,src:'Guo et al., ICML, 2017',q:'Calibration Guo et al., ICML',url:'https://proceedings.mlr.press/v70/guo17a.html'}]},

{id:'agent-reliability',label:'Agent Reliability',clusters:['agentic','safety'],sz:18,
 def:'Whether an agent performs consistently and robustly across repeated runs and changing conditions — distinct from whether it can succeed once. Frameworks break it into dimensions such as consistency, robustness, predictability, and safety; reliability has lagged well behind raw capability.',
 rels:['capability-reliability-gap','nines-of-reliability','calibration','silent-failure','evals','aint'],
 refs:[{n:1,src:'AI Snake Oil, 2026-02',q:'Agent Reliability AI Snake Oil',url:'https://www.normaltech.ai/p/new-paper-towards-a-science-of-ai'},{n:2,src:'Fortune, 2026-03',q:'Agent Reliability Fortune',url:'https://fortune.com/2026/03/24/ai-agents-are-getting-more-capable-but-reliability-is-lagging-narayanan-kapoor/'},{n:3,src:'ReliabilityBench, arXiv, 2026-01',q:'Agent Reliability ReliabilityBench, arXiv',url:'https://arxiv.org/abs/2601.06112'}]},

{id:'nines-of-reliability',label:'Nines of Reliability',clusters:['agentic','critical'],sz:16,
 fullName:'Nines of Reliability ("March of Nines")',
 def:'Describing AI reliability in high-availability engineering terms — 99.9% is "three nines" — to stress that each additional nine takes as much work as the last, and that small per-step error rates compound over long agent tasks. Andrej Karpathy calls the slog from demo to dependable product "the march of nines".',
 rels:['agent-reliability','capability-reliability-gap','long-horizon-autonomy','pilot-purgatory','hallucination-cascade'],
 refs:[{n:1,src:'AI Snake Oil, 2026-02',q:'Nines of Reliability AI Snake Oil',url:'https://www.normaltech.ai/p/new-paper-towards-a-science-of-ai'},{n:2,src:'Dwarkesh Podcast (Karpathy), 2025-10',q:'Nines of Reliability Dwarkesh Podcast (Karpathy)',url:'https://www.dwarkesh.com/p/andrej-karpathy'},{n:3,src:'Foundation Capital, 2026-10',q:'Nines of Reliability Foundation Capital',url:'https://foundationcapital.com/what-it-takes-to-build-ai-agents-that-actually-work/'}]},

{id:'cot-faithfulness',label:'Chain-of-Thought Faithfulness',clusters:['safety','technical'],sz:16,
 def:'Whether a model\'s written reasoning reflects the factors that actually drove its answer, or is a plausible after-the-fact rationalisation. Research shows reasoning models often omit influences on their answers, which limits what chain-of-thought monitoring can catch.',
 rels:['chain-of-thought','cot-monitoring','reasoning-models','interpretability','latent-reasoning','llm-steganography'],
 refs:[{n:1,src:'Last Week in AI, 2026-04',q:'Chain-of-Thought Faithfulness Last Week in AI',url:'https://lastweekin.ai/p/lwiai-podcast-238-gpt-54-mini-openai'},{n:2,src:'Anthropic, 2025-04',q:'Chain-of-Thought Faithfulness Anthropic',url:'https://www.anthropic.com/research/reasoning-models-dont-say-think'},{n:3,src:'Arcuschin et al., arXiv, 2025-03',q:'Chain-of-Thought Faithfulness Arcuschin et al., arXiv',url:'https://arxiv.org/abs/2503.08679'}]},

{id:'test-time-compute-scaling',label:'Test-Time Compute Scaling',clusters:['technical'],sz:18,
 fullName:'Test-Time Compute Scaling (Test-Time Scaling)',
 def:'Improving a model\'s answers by spending more computation at inference — longer reasoning, sampling and checking multiple attempts, search — rather than by training a bigger model. The scaling regime behind reasoning models.',
 rels:['reasoning-models','scaling-laws','inference','adjustable-reasoning-effort','chain-of-thought','overthinking','inference-shift'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Test-Time Compute Scaling Hugging Face Blog',url:'https://huggingface.co/blog/amazon/foundation-model-building-blocks'},{n:2,src:'Snell et al., arXiv, 2024-08',q:'Test-Time Compute Scaling Snell et al., arXiv',url:'https://arxiv.org/abs/2408.03314'},{n:3,src:'NVIDIA Blog, 2025-02',q:'Test-Time Compute Scaling NVIDIA Blog',url:'https://blogs.nvidia.com/blog/ai-scaling-laws/'}]},

{id:'data-contamination',label:'Data Contamination',clusters:['technical','critical'],sz:16,
 fullName:'Data Contamination (Test-Set / Benchmark Contamination)',
 def:'When benchmark test data, or close copies of it, leaks into a model\'s training data, inflating scores relative to real-world ability. Private or freshly created evaluation sets are the main defence.',
 rels:['benchmark-gaming','evals','benchmark-saturation','training','pretraining'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Data Contamination Hugging Face Blog',url:'https://huggingface.co/blog/open-asr-leaderboard-private-data'},{n:2,src:'Xu et al., arXiv (survey), 2024-06',q:'Data Contamination Xu et al., arXiv (survey)',url:'https://arxiv.org/abs/2406.04244'},{n:3,src:'Sainz et al., EMNLP Findings, 2023-12',q:'Data Contamination Sainz et al., EMNLP Findings',url:'https://aclanthology.org/2023.findings-emnlp.722/'}]},

{id:'dpo',label:'Direct Preference Optimization',clusters:['technical'],sz:16,
 fullName:'Direct Preference Optimization (DPO)',
 def:'A post-training method (Rafailov et al., 2023) that trains a model directly on pairs of preferred and rejected responses, without the separate reward model and reinforcement-learning loop of classic RLHF. Simpler and cheaper, it became a standard alignment step for open models.',
 rels:['rlhf','post-training','grpo','reinforcement-learning','fine-tuning'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-06',q:'Direct Preference Optimization Hugging Face Blog',url:'https://huggingface.co/blog/Dharma-AI/direct-preference-optimization-beyond-chatbots'},{n:2,src:'Rafailov et al., arXiv / NeurIPS 2023, 2023-05',q:'Direct Preference Optimization Rafailov et al., arXiv / NeurIPS 2023',url:'https://arxiv.org/abs/2305.18290'},{n:3,src:'RLHF Book (Nathan Lambert), 2026',q:'Direct Preference Optimization RLHF Book (Nathan Lambert)',url:'https://rlhfbook.com/c/08-direct-alignment'}]},

{id:'multi-token-prediction',label:'Multi-Token Prediction',clusters:['technical'],sz:15,
 fullName:'Multi-Token Prediction (MTP)',
 def:'A training objective in which a model learns to predict several future tokens at each position rather than just the next one (Meta, 2024; used in DeepSeek-V3 and others). The extra prediction heads can then act as a built-in draft model for speculative decoding, speeding up inference.',
 rels:['speculative-decoding','training','inference','latency','deepseek'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Multi-Token Prediction Hugging Face Blog',url:'https://huggingface.co/blog/local-reachy-mini-conversation'},{n:2,src:'Gloeckle et al. (Meta FAIR), arXiv, 2024-04',q:'Multi-Token Prediction Gloeckle et al. (Meta FAIR), arXiv',url:'https://arxiv.org/abs/2404.19737'},{n:3,src:'vLLM docs, 2026',q:'Multi-Token Prediction vLLM docs',url:'https://docs.vllm.ai/en/latest/features/speculative_decoding/'}]},

{id:'text-degeneration',label:'Text Degeneration',clusters:['technical'],sz:15,
 def:'Output that turns bland, incoherent, or stuck in repetitive loops when a model decodes by always choosing the most likely next words. Named in a 2019 paper that introduced nucleus (top-p) sampling as a fix.',
 rels:['temperature','inference','token','llm'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-06',q:'Text Degeneration Hugging Face Blog',url:'https://huggingface.co/blog/Dharma-AI/direct-preference-optimization-beyond-chatbots'},{n:2,src:'Holtzman et al., arXiv / ICLR 2020, 2019-04',q:'Text Degeneration Holtzman et al., arXiv / ICLR 2020',url:'https://arxiv.org/abs/1904.09751'},{n:3,src:'Apple ML Research, 2022-11',q:'Text Degeneration Apple ML Research',url:'https://machinelearning.apple.com/research/analyzing-mitigating-repetitions'}]},

{id:'guard-model',label:'Guard Model',clusters:['safety','tools'],sz:16,
 fullName:'Guard Model (Safety Classifier Model)',
 def:'A model dedicated to classifying prompts and responses against a safety taxonomy or a custom policy — Meta\'s Llama Guard, Google\'s ShieldGemma, IBM\'s Granite Guardian — deployed alongside the main model as a guardrail.',
 rels:['guardrails','jailbreak','prompt-injection','constitutional-ai','llama'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-06',q:'Guard Model Hugging Face Blog',url:'https://huggingface.co/blog/nvidia/nemotron-3-5-content-safety'},{n:2,src:'Meta (Llama Guard), arXiv, 2023-12',q:'Guard Model Meta (Llama Guard), arXiv',url:'https://arxiv.org/abs/2312.06674'},{n:3,src:'Google (ShieldGemma), 2026-01',q:'Guard Model Google (ShieldGemma)',url:'https://ai.google.dev/gemma/docs/shieldgemma'}]},

{id:'prefill-decode-disaggregation',label:'Prefill–Decode Disaggregation',clusters:['technical','landscape'],sz:15,
 def:'Running the two phases of LLM inference on separate hardware: prefill, which processes the whole prompt at once and is compute-heavy, and decode, which generates tokens one by one and is memory-bandwidth-heavy. Splitting them lets each be optimised and scaled independently.',
 rels:['inference','kv-cache','latency','ai-inference-chip','infrastructure','inference-shift'],
 refs:[{n:1,src:'Stratechery, 2026-05',q:'Prefill–Decode Disaggregation Stratechery',url:'https://stratechery.com/2026/the-inference-shift/'},{n:2,src:'Microsoft Research (Splitwise), 2024-01',q:'Prefill–Decode Disaggregation Microsoft Research (Splitwise)',url:'https://www.microsoft.com/en-us/research/blog/splitwise-improves-gpu-usage-by-splitting-llm-inference-phases/'},{n:3,src:'DistServe, arXiv/OSDI, 2024-01',q:'Prefill–Decode Disaggregation DistServe, arXiv/OSDI',url:'https://arxiv.org/abs/2401.09670'}]},

{id:'wafer-scale-engine',label:'Wafer-Scale Engine',clusters:['landscape','technical'],sz:14,
 fullName:'Wafer-Scale Engine (Cerebras WSE)',
 nodeType:'product',
 def:'Cerebras\'s chip design that uses an entire silicon wafer as a single processor, with huge on-chip memory bandwidth — making it unusually fast at generating tokens, at the cost of limited memory and off-wafer bandwidth.',
 rels:['ai-accelerator','ai-inference-chip','tpu','latency','nvidia-co'],
 refs:[{n:1,src:'Stratechery, 2026-05',q:'Wafer-Scale Engine Stratechery',url:'https://stratechery.com/2026/the-inference-shift/'},{n:2,src:'SemiAnalysis, 2026-05',q:'Wafer-Scale Engine SemiAnalysis',url:'https://newsletter.semianalysis.com/p/cerebras-faster-tokens-please'},{n:3,src:'The Register, 2026-08',q:'Wafer-Scale Engine The Register',url:'https://www.theregister.com/a/5289286'}]},

{id:'zombie-internet',label:'Zombie Internet',clusters:['critical'],sz:16,
 def:'Jason Koebler\'s 2024 term (404 Media) for a web that is neither fully bot-run nor authentically human, but a mix of people, bots, and AI-generated content interacting with each other. Increasingly applied to agents producing content for other agents.',
 rels:['dead-internet-theory','ai-slop','agentic-web','moltbook','slopaganda'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-05',q:'Zombie Internet Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/May/11/zombie-internet/#atom-everything'},{n:2,src:'404 Media (Jason Koebler), 2024-05',q:'Zombie Internet 404 Media (Jason Koebler)',url:'https://www.404media.co/facebooks-ai-spam-isnt-the-dead-internet-its-the-zombie-internet/'},{n:3,src:'Fast Company ME, 2026-02',q:'Zombie Internet Fast Company ME',url:'https://fastcompanyme.com/technology/the-zombie-internet-has-arrived-and-it-has-devastating-consequences-for-advertising-social-media-and-the-human-web/'}]},

{id:'dead-internet-theory',label:'Dead Internet Theory',clusters:['critical'],sz:16,
 def:'A conspiracy theory that took shape around 2021 claiming most online activity is generated by bots rather than people. Now invoked more loosely — and less conspiratorially — to describe generative AI\'s effect on the web.',
 rels:['zombie-internet','ai-slop','generative-ai'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-05',q:'Dead Internet Theory Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/May/11/zombie-internet/#atom-everything'},{n:2,src:'Wikipedia',q:'Dead Internet Theory Wikipedia',url:'https://en.wikipedia.org/wiki/Dead_Internet_theory'},{n:3,src:'Forbes Australia, 2025-10',q:'Dead Internet Theory Forbes Australia',url:'https://www.forbes.com.au/?p=160882'}]},

{id:'forward-deployed-engineer',label:'Forward Deployed Engineer',clusters:['business','work'],sz:17,
 fullName:'Forward Deployed Engineer (FDE)',
 def:'An engineer embedded with a customer to integrate a vendor\'s product into the customer\'s real workflows. A role pioneered by Palantir that became one of the defining jobs of 2025–26 AI companies, as labs found that deployment, not model access, was the bottleneck.',
 rels:['deployment-company','pilot-purgatory','vertical-ai','agentic-business-model','openai-co','anthropic-co'],
 refs:[{n:1,src:'Stratechery, 2026-05',q:'Forward Deployed Engineer Stratechery',url:'https://stratechery.com/2026/the-deployment-company-back-to-the-70s-apple-and-intel/'},{n:2,src:'a16z, 2026-01',q:'Forward Deployed Engineer a16z',url:'https://a16z.com/the-palantirization-of-everything/'},{n:3,src:'Fortune, 2026-09',q:'Forward Deployed Engineer Fortune',url:'https://fortune.com/2026/09/03/forward-deployed-engineers-fast-growing-six-figure-silicon-valley-job-integrate-ai-with-customers-tech-careers-palantir/'}]},

{id:'personal-software',label:'Personal Software',clusters:['evolved','work'],sz:16,
 def:'Small, bespoke software built for one person or a small group — often in an afternoon with AI coding tools — rather than for a market. Also called "software for one" or "home-cooked software"; micro-apps are a common form.',
 rels:['vibe-coding','coding-agent','software-3','claude-code'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-04',q:'Personal Software Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/Apr/30/rss-vibe-coded-apps/#atom-everything'},{n:2,src:'Nicolas Deville, 2026-10',q:'Personal Software Nicolas Deville',url:'https://notes.nicolasdeville.com/ai/personal-software'},{n:3,src:'Addy Osmani',q:'Personal Software Addy Osmani',url:'https://addyosmani.com/blog/personal-software/'}]},

{id:'coding-agent',label:'Coding Agent',clusters:['agentic','tools'],sz:19,
 def:'An AI agent that writes, edits, runs, and tests code with some autonomy — working in an editor or terminal (Claude Code, Cursor) or asynchronously in a cloud sandbox and returning a pull request (Copilot coding agent, Codex).',
 rels:['background-agents','claude-code','codex-model','cursor','devin','github-copilot','agents-md','vibe-coding','agentic-engineering','yolo-mode'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-06',q:'Coding Agent Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/Jun/3/uber-caps-usage/#atom-everything'},{n:2,src:'GitHub Changelog, 2025-09',q:'Coding Agent GitHub Changelog',url:'https://github.blog/changelog/2025-09-25-copilot-coding-agent-is-now-generally-available/'},{n:3,src:'Claude Code docs, 2026',q:'Coding Agent Claude Code docs',url:'https://code.claude.com/docs/en/overview'}]},

{id:'tokenmaxxing',label:'Tokenmaxxing',clusters:['critical','work'],sz:15,
 def:'Maximising AI token consumption — individually, or because employers rank and reward staff by AI usage — treating token spend as a proxy for productivity. Spread widely in spring 2026; critics see it as Goodhart\'s law in action.',
 rels:['cost','cost-runaway','benchmark-gaming','token','ai-first-company'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-06',q:'Tokenmaxxing Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/Jun/3/uber-caps-usage/#atom-everything'},{n:2,src:'Wikipedia, 2026',q:'Tokenmaxxing Wikipedia',url:'https://en.wikipedia.org/wiki/Token_maxxing'},{n:3,src:'Thoughtworks Decoder, 2026',q:'Tokenmaxxing Thoughtworks Decoder',url:'https://www.thoughtworks.com/insights/decoder/t/token-maxxing'}]},

{id:'agentic-web',label:'Agentic Web',clusters:['agentic','landscape'],sz:17,
 def:'An emerging web in which AI agents, rather than people, are the main readers and actors — browsing, transacting, and talking to other agents on users\' behalf. Pushed by Microsoft ("open agentic web", 2025) and others; it raises questions about how content is valued when humans no longer click.',
 rels:['agentic-browser','agent-experience','llms-txt','agentic-commerce','a2a','mcp','zombie-internet','ai-content-licensing'],
 refs:[{n:1,src:'Stratechery, 2026-05',q:'Agentic Web Stratechery',url:'https://stratechery.com/2026/an-interview-with-eric-seufert-about-models-and-ads-and-ais-upside-for-humanity/'},{n:2,src:'Yang et al., arXiv, 2025-07',q:'Agentic Web Yang et al., arXiv',url:'https://arxiv.org/abs/2507.21206'},{n:3,src:'Digiday, 2026-07',q:'Agentic Web Digiday',url:'https://digiday.com/media/in-graphic-detail-ai-visibility-is-no-longer-about-referral-traffic/'}]},

{id:'ai-code-provenance',label:'AI Code Provenance',clusters:['work','security'],sz:15,
 def:'Who wrote a piece of code, with what AI assistance, and who answers for it. Projects such as the Linux kernel now require AI assistance to be disclosed and a human to take full responsibility; distinct from software supply-chain provenance (SLSA, signing).',
 rels:['comprehension-debt','vibe-coding','coding-agent','slopsquatting'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-06',q:'AI Code Provenance Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/Jun/5/andreas-kling/#atom-everything'},{n:2,src:'Matteo Collina, 2026-03',q:'AI Code Provenance Matteo Collina',url:'https://adventures.nodeland.dev/archive/who-is-responsible-for-ai-generated-code'},{n:3,src:'Linux kernel docs, 2025-12',q:'AI Code Provenance Linux kernel docs',url:'https://docs.kernel.org/process/coding-assistants.html'}]},

{id:'word-error-rate',label:'Word Error Rate',clusters:['technical'],sz:14,
 fullName:'Word Error Rate (WER)',
 def:'The standard accuracy metric for speech recognition: substitutions, deletions, and insertions divided by the number of words actually spoken. Lower is better; it can exceed 100% when a system inserts many words.',
 rels:['voice-ai','evals','cascaded-voice-pipeline'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Word Error Rate Hugging Face Blog',url:'https://huggingface.co/blog/open-asr-leaderboard-private-data'},{n:2,src:'Kensho',q:'Word Error Rate Kensho',url:'https://kensho.com/news/word-error-rate-primer'},{n:3,src:'ISIP, Mississippi State Univ.',q:'Word Error Rate ISIP, Mississippi State Univ.',url:'https://www.isip.piconepress.com/projects/speech/software/tutorials/production/fundamentals/v1.0/section_04/s04_03_p01.html'}]},

{id:'cascaded-voice-pipeline',label:'Cascaded Voice Pipeline',clusters:['technical','agentic'],sz:15,
 def:'The modular way to build a voice agent: speech-to-text, then a language model, then text-to-speech (often with voice-activity detection in front). Easy to swap parts and inspect; slower and less natural than speech-to-speech models.',
 rels:['voice-ai','full-duplex-voice-ai','latency','word-error-rate'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Cascaded Voice Pipeline Hugging Face Blog',url:'https://huggingface.co/blog/local-reachy-mini-conversation'},{n:2,src:'arXiv (enterprise realtime voice agents), 2026-03',q:'Cascaded Voice Pipeline arXiv (enterprise realtime voice agents)',url:'https://arxiv.org/abs/2603.05413'},{n:3,src:'Gradium (vendor), 2026-09',q:'Cascaded Voice Pipeline Gradium (vendor)',url:'https://gradium.ai/content/cascaded-voice-agent-vs-speech-to-speech-2026'}]},

{id:'full-duplex-voice-ai',label:'Full-Duplex Voice AI',clusters:['technical','models'],sz:15,
 def:'Speech models that listen and talk at the same time, as people do — handling interruptions, overlaps, and back-channel "mm-hmm"s — instead of taking strict turns. Kyutai\'s Moshi (2024) was an early open example.',
 rels:['voice-ai','cascaded-voice-pipeline','multimodal','latency'],
 refs:[{n:1,src:'Last Week in AI, 2026-05',q:'Full-Duplex Voice AI Last Week in AI',url:'https://lastweekin.ai/p/lwiai-podcast-245-tml-interaction'},{n:2,src:'Kyutai (Moshi), arXiv, 2024-09',q:'Full-Duplex Voice AI Kyutai (Moshi), arXiv',url:'https://arxiv.org/abs/2410.00037'},{n:3,src:'Thinking Machines Lab, 2026-05',q:'Full-Duplex Voice AI Thinking Machines Lab',url:'https://thinkingmachines.ai/blog/interaction-models/'}]},

{id:'llm-steganography',label:'LLM Steganography',clusters:['safety','security'],sz:15,
 def:'Language models hiding information or reasoning inside outputs that look innocuous — encoded messages or encoded reasoning — especially in ways that evade chain-of-thought or output monitors; also the research on detecting it.',
 rels:['cot-monitoring','cot-faithfulness','scheming','ai-control','latent-reasoning'],
 refs:[{n:1,src:'Last Week in AI, 2026-04',q:'LLM Steganography Last Week in AI',url:'https://lastweekin.ai/p/lwiai-podcast-238-gpt-54-mini-openai'},{n:2,src:'Zolkowski et al., ICLR 2026, 2026',q:'LLM Steganography Zolkowski et al., ICLR 2026',url:'https://iclr.cc/virtual/2026/poster/10007285'},{n:3,src:'Anwar, Krueger et al., arXiv, 2026-02',q:'LLM Steganography Anwar, Krueger et al., arXiv',url:'https://arxiv.org/abs/2602.23163'}]},

{id:'gdpval',label:'GDPval',clusters:['work','tools'],sz:16,
 nodeType:'product',
 def:'OpenAI\'s benchmark (2025) measuring AI on real work products from 44 occupations in the industries that contribute most to US GDP, judged by blinded expert comparison against professionals\' work. Widely cited in debates about AI and jobs.',
 rels:['evals','ai-exposure','benchmark-saturation','openai-co','outcome-focused-work'],
 refs:[{n:1,src:'OpenAI Research, 2026-05',q:'GDPval OpenAI Research',url:'https://openai.com/index/introducing-gpt-5-4/'},{n:2,src:'Patwardhan et al., ICLR 2026, 2026',q:'GDPval Patwardhan et al., ICLR 2026',url:'https://proceedings.iclr.cc/paper_files/paper/2026/hash/290c2430f91912204f30bbcc990fff1d-Abstract-Conference.html'},{n:3,src:'Artificial Analysis, 2026',q:'GDPval Artificial Analysis',url:'https://artificialanalysis.ai/evaluations/gdpval-aa'}]},

{id:'vllm',label:'vLLM',clusters:['tools'],sz:15,
 nodeType:'product',
 def:'The most widely used open-source engine for serving LLMs, built around PagedAttention — paging the KV cache like virtual memory to serve many requests efficiently. Started at UC Berkeley.',
 rels:['inference','kv-cache','open-weight','hugging-face','prefill-decode-disaggregation'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'vLLM Hugging Face Blog',url:'https://huggingface.co/blog/lablab-ai-amd-developer-hackathon/machinacheck'},{n:2,src:'Kwon et al., arXiv/SOSP, 2023-09',q:'vLLM Kwon et al., arXiv/SOSP',url:'https://arxiv.org/abs/2309.06180'},{n:3,src:'vLLM docs, 2026',q:'vLLM vLLM docs',url:'https://docs.vllm.ai/en/latest/'}]},

{id:'ai-fluency',label:'AI Fluency',clusters:['human'],sz:17,
 def:'The ability to work with AI effectively, efficiently, ethically, and safely — framed in Dakan and Feller\'s "4D" framework (Delegation, Description, Discernment, Diligence), developed with Anthropic and now used in university and workplace courses. Broader in emphasis than AI literacy.',
 rels:['ai-literacy','delegation','critical-thinking','information-literacy','metacognition'],
 refs:[{n:1,src:'Anthropic Newsroom, 2026-05',q:'AI Fluency Anthropic Newsroom',url:'https://www.anthropic.com/news/claude-for-small-business'},{n:2,src:'National Forum for Teaching & Learning (Ireland), 2025-06',q:'AI Fluency National Forum for Teaching & Learning (Ireland)',url:'https://www.teachingandlearning.ie/2025/06/19/launch-of-new-open-course-ai-fluency-framework-and-foundations/'},{n:3,src:'UT Austin Office of the Provost, 2026',q:'AI Fluency UT Austin Office of the Provost',url:'https://provost.utexas.edu/?p=20515'}]},

{id:'ai-tutoring',label:'AI Tutoring',clusters:['human'],sz:16,
 def:'AI systems that give learners personalised instruction, practice, and feedback. Results so far are mixed: some course-specific tutors show strong gains, while a large 2026 trial of Khanmigo found modest effects and low engagement.',
 rels:['ai-assistant','socratic-dialogue','cognitive-offloading','deskilling','chatbot'],
 refs:[{n:1,src:'Google AI Blog, 2026-05',q:'AI Tutoring Google AI Blog',url:'https://blog.google/innovation-and-ai/technology/ai/university-waterloo-labs/'},{n:2,src:'EdWorkingPapers (Khanmigo RCT), 2026-08',q:'AI Tutoring EdWorkingPapers (Khanmigo RCT)',url:'https://edworkingpapers.com/ai26-1551'},{n:3,src:'Harvard Gazette, 2024-09',q:'AI Tutoring Harvard Gazette',url:'https://news.harvard.edu/gazette/story/2024/09/professor-tailored-ai-tutor-to-physics-course-engagement-doubled/'}]},

{id:'nano-banana',label:'Nano Banana',clusters:['models','landscape'],sz:16,
 nodeType:'product',
 def:'The public nickname for Google\'s Gemini image generation and editing models — Gemini 2.5 Flash Image (August 2025), Nano Banana Pro and Nano Banana 2 — which went viral for consistent, conversational photo editing.',
 rels:['gemini','google-co','diffusion-model','generative-ai','deepfake'],
 refs:[{n:1,src:'Google AI Blog, 2026-06',q:'Nano Banana Google AI Blog',url:'https://blog.google/innovation-and-ai/technology/ai/io-2026-google-ai/'},{n:2,src:'Google Developers Blog, 2025-08',q:'Nano Banana Google Developers Blog',url:'https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/'},{n:3,src:'The Batch (DeepLearning.AI), 2026-03',q:'Nano Banana The Batch (DeepLearning.AI)',url:'https://charonhub.deeplearning.ai/nano-banana-2-aka-gemini-3-1-flash-image-makes-edits-easier-and-faster/'}]},

{id:'google-ai-mode',label:'Google AI Mode',clusters:['tools','landscape'],sz:16,
 nodeType:'product',
 def:'Google Search\'s conversational, Gemini-powered search mode for multi-step and multimodal questions — answering directly rather than returning a list of links, with large consequences for publisher traffic.',
 rels:['gemini','google-co','deep-research','ai-content-licensing','agentic-web','perplexity'],
 refs:[{n:1,src:'Google AI Blog, 2026-05',q:'Google AI Mode Google AI Blog',url:'https://blog.google/products-and-platforms/products/search/gardening-tips/'},{n:2,src:'Adweek, 2025-07',q:'Google AI Mode Adweek',url:'https://www.adweek.com/media/google-ai-search-image-pdf-uploads-canvas-desktop/'},{n:3,src:'Search Engine Journal, 2025-07',q:'Google AI Mode Search Engine Journal',url:'https://www.searchenginejournal.com/google-ai-mode-update-file-uploads-live-video-search-more/552414/'}]},

{id:'benchmaxxing',label:'Benchmaxxing',clusters:['critical'],sz:14,
 synonymOf:'benchmark-gaming',
 def:'Slang for benchmark gaming: tuning a model to top a known leaderboard without matching real-world gains.',
 rels:['benchmark-gaming'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Benchmaxxing Hugging Face Blog',url:'https://huggingface.co/blog/open-asr-leaderboard-private-data'}]},

{id:'scaffold',label:'Scaffold',clusters:['agentic'],sz:14,
 synonymOf:'harness',
 def:'The research community\'s usual word for the harness around a model — the code, prompts, and tools that turn it into an agent. Agent evaluations often compare the same model in different scaffolds.',
 rels:['harness'],
 refs:[{n:1,src:'AI Snake Oil, 2026-05',q:'Scaffold AI Snake Oil',url:'https://www.normaltech.ai/p/did-googles-ai-agents-really-build'}]},

{id:'effort-control',label:'Effort Control',clusters:['technical'],sz:14,
 synonymOf:'adjustable-reasoning-effort',
 def:'Anthropic\'s name for its adjustable reasoning-effort setting, letting users and developers trade answer depth against speed and cost.',
 rels:['adjustable-reasoning-effort'],
 refs:[{n:1,src:'Anthropic Newsroom, 2026-05',q:'Effort Control Anthropic Newsroom',url:'https://www.anthropic.com/news/claude-opus-4-8'}]},

{id:'micro-app',label:'Micro-App',clusters:['evolved'],sz:14,
 synonymOf:'personal-software',
 def:'A small, single-purpose app built and shipped quickly — often in one sitting with AI coding tools. A common form of personal software.',
 rels:['personal-software'],
 refs:[{n:1,src:'Simon Willison\'s Weblog, 2026-04',q:'Micro-App Simon Willison\'s Weblog',url:'https://simonwillison.net/2026/Apr/30/rss-vibe-coded-apps/#atom-everything'}]},

{id:'post-training-scaling',label:'Post-Training Scaling',clusters:['technical'],sz:14,
 synonymOf:'post-training',
 def:'Capability gains from spending more compute after pretraining — more fine-tuning, reinforcement learning, and synthetic data — treated as a scaling regime alongside pretraining scaling.',
 rels:['post-training'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Post-Training Scaling Hugging Face Blog',url:'https://huggingface.co/blog/amazon/foundation-model-building-blocks'}]},

{id:'agentic-inference',label:'Agentic Inference',clusters:['technical','agentic'],sz:14,
 synonymOf:'inference-shift',
 def:'Ben Thompson\'s term for inference with no human waiting on each answer — agents working autonomously, where throughput and cost matter more than latency. One half of the Inference Shift.',
 rels:['inference-shift'],
 refs:[{n:1,src:'Stratechery, 2026-05',q:'Agentic Inference Stratechery',url:'https://stratechery.com/2026/shifting-alliances-in-a-changing-world/'}]},

{id:'answer-inference',label:'Answer Inference',clusters:['technical'],sz:14,
 synonymOf:'inference-shift',
 def:'Ben Thompson\'s term for the familiar mode of inference in which a person asks and waits for a reply, making latency the priority. Contrasted with agentic inference in the Inference Shift.',
 rels:['inference-shift'],
 refs:[{n:1,src:'Stratechery, 2026-05',q:'Answer Inference Stratechery',url:'https://stratechery.com/2026/shifting-alliances-in-a-changing-world/'}]},

{id:'ai-training-chip',label:'AI Training Chip',clusters:['technical','landscape'],sz:14,
 synonymOf:'ai-accelerator',
 def:'An AI accelerator optimised for training large models — prioritising large unified memory and fast interconnect — as distinct from chips tuned for inference.',
 rels:['ai-accelerator'],
 refs:[{n:1,src:'Google AI Blog, 2026-04',q:'AI Training Chip Google AI Blog',url:'https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/tpus-8t-8i-cloud-next/'}]},

{id:'private-eval-dataset',label:'Private Evaluation Dataset',clusters:['technical'],sz:14,
 synonymOf:'data-contamination',
 def:'A benchmark whose test items are withheld from model developers and the public, so scores cannot be inflated by training on them — the main defence against data contamination.',
 rels:['data-contamination'],
 refs:[{n:1,src:'Hugging Face Blog, 2026-05',q:'Private Evaluation Dataset Hugging Face Blog',url:'https://huggingface.co/blog/open-asr-leaderboard-private-data'}]},

{id:'persona-driven-jailbreaking',label:'Persona-Driven Jailbreaking',clusters:['security'],sz:14,
 synonymOf:'jailbreak',
 def:'A jailbreak technique in which the attacker asks the model to adopt a persona — an expert, an unrestricted character — to elicit responses it would otherwise refuse.',
 rels:['jailbreak'],
 refs:[{n:1,src:'The Verge — AI, 2026-05',q:'Persona-Driven Jailbreaking The Verge — AI',url:'https://www.theverge.com/tech/928007/google-ai-zero-day-exploit-stopped'}]},

];
