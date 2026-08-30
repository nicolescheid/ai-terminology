window.AGENT_GRAPH_PATCH = {
  "meta": {
    "generatedAt": "2026-08-30T20:35:28.399Z",
    "sourceCount": 0,
    "note": "Agent-managed overlay. Graph-affecting changes are routed through the permissions matrix (actions.mjs) — see proposals.json for pending items."
  },
  "nodes": [
    {
      "id": "tpu",
      "label": "TPU (Tensor Processing Unit)",
      "clusters": [
        "technical",
        "agentic"
      ],
      "sz": 14,
      "def": "Google's custom application-specific integrated circuits (ASICs) designed to accelerate machine learning workloads, increasingly specialized for both training large models and serving fast agentic inference.",
      "rels": [
        "inference",
        "training",
        "infrastructure",
        "google-co",
        "agent"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Wed, 22 Apr 2026 12:00:00 +0000",
          "q": "We're launching two specialized TPUs for the agentic era. Google AI Blog"
        },
        {
          "n": 2,
          "src": "Google AI Blog, Thu, 23 Apr 2026 12:00:00 +0000",
          "q": "Here’s how our TPUs power increasingly demanding AI workloads. Google AI Blog"
        },
        {
          "n": 3,
          "src": "Google AI Blog, Tue, 28 Apr 2026 16:00:00 +0000",
          "q": "Celebrating 20 years of Google Translate: Fun facts, tips and new features to try Google AI Blog"
        }
      ],
      "nodeType": "product"
    },
    {
      "id": "ai-inference-chip",
      "label": "AI Inference Chip",
      "clusters": [
        "technical",
        "agentic"
      ],
      "sz": 14,
      "def": "Specialized silicon designed to run AI model inference at high speed and low latency, particularly to support responsive agentic workflows requiring rapid multi-step reasoning and execution.",
      "rels": [
        "inference",
        "latency",
        "agent",
        "edge-ai",
        "infrastructure"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Wed, 22 Apr 2026 12:00:00 +0000",
          "q": "We're launching two specialized TPUs for the agentic era. Google AI Blog"
        },
        {
          "n": 2,
          "src": "Stratechery, Thu, 30 Apr 2026 10:00:00 +0000",
          "q": "Amazon Earnings, Trainium and Commodity Markets, Additional Amazon Notes Stratechery"
        }
      ]
    },
    {
      "id": "purpose-built-ai-infrastructure",
      "label": "Purpose-Built AI Infrastructure",
      "clusters": [
        "agentic",
        "technical"
      ],
      "sz": 14,
      "def": "The full-stack design philosophy of co-optimizing custom silicon, networking, data centers, and energy systems specifically for AI workloads rather than repurposing general-purpose computing infrastructure.",
      "rels": [
        "infrastructure",
        "agent",
        "latency",
        "cost",
        "google-co"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Wed, 22 Apr 2026 12:00:00 +0000",
          "q": "We're launching two specialized TPUs for the agentic era. Google AI Blog"
        },
        {
          "n": 2,
          "src": "Google AI Blog, Thu, 23 Apr 2026 12:00:00 +0000",
          "q": "Here’s how our TPUs power increasingly demanding AI workloads. Google AI Blog"
        },
        {
          "n": 3,
          "src": "Stratechery, Wed, 29 Apr 2026 10:00:00 +0000",
          "q": "Intel Earnings, Intel’s Differentiation?, Whither Terafab Stratechery"
        }
      ]
    },
    {
      "id": "ai-accelerator",
      "label": "AI Accelerator",
      "clusters": [
        "technical"
      ],
      "sz": 14,
      "def": "Specialized hardware chip designed to accelerate AI/ML computations, including matrix multiplications and tensor operations, enabling faster and more efficient model training and inference than general-purpose CPUs or GPUs.",
      "rels": [
        "inference",
        "training",
        "infrastructure",
        "tpu",
        "edge-ai",
        "parameters"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Thu, 23 Apr 2026 12:00:00 +0000",
          "q": "Here’s how our TPUs power increasingly demanding AI workloads. Google AI Blog"
        },
        {
          "n": 2,
          "src": "OpenAI News, Wed, 29 Apr 2026 15:00:00 GMT",
          "q": "Building the compute infrastructure for the Intelligence Age OpenAI News"
        }
      ],
      "fullName": "AI Accelerator (custom silicon)"
    },
    {
      "id": "long-horizon-autonomy",
      "label": "Long-Horizon Autonomy",
      "clusters": [
        "agentic",
        "autonomy",
        "technical"
      ],
      "sz": 14,
      "def": "An AI model's capacity to execute complex, multi-step tasks coherently over extended periods without human intervention, maintaining consistency and pushing through obstacles across long runs.",
      "rels": [
        "autonomous-agent",
        "autonomy-spectrum",
        "task-decomposition",
        "planning",
        "loop",
        "stopping-criterion-failure",
        "devin"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Introducing Claude Opus 4.7 Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "AI Snake Oil, Thu, 16 Apr 2026 17:47:29 GMT",
          "q": "Open-world evaluations for measuring frontier AI capabilities AI Snake Oil"
        }
      ]
    },
    {
      "id": "claude-design",
      "label": "Claude Design",
      "clusters": [
        "tools",
        "agentic",
        "work"
      ],
      "sz": 14,
      "def": "An Anthropic Labs product that lets users collaborate with Claude to create polished visual work including designs, prototypes, slides, and marketing collateral, powered by Claude Opus 4.7 with integrated design system support.",
      "rels": [
        "claude-code",
        "claude-cowork",
        "handoff-document",
        "multimodal",
        "artifact",
        "research-preview",
        "anthropic-co"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Introducing Claude Design by Anthropic Labs Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Claude for Creative Work Anthropic Newsroom"
        }
      ],
      "fullName": "Claude Design (Anthropic Labs)",
      "nodeType": "product"
    },
    {
      "id": "handoff-bundle",
      "label": "Handoff Bundle",
      "clusters": [
        "work",
        "agentic",
        "lifecycle"
      ],
      "sz": 14,
      "def": "A packaged artifact produced by an AI design tool containing all design specifications and assets needed to pass a completed design to a code-generation agent for implementation, enabling seamless design-to-development transitions.",
      "rels": [
        "handoff-document",
        "claude-design",
        "claude-code",
        "artifact",
        "handoff"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Introducing Claude Design by Anthropic Labs Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Claude for Creative Work Anthropic Newsroom"
        }
      ],
      "fullName": "Handoff Bundle (Design-to-Code)"
    },
    {
      "id": "interactive-prototyping",
      "label": "Interactive Prototyping",
      "clusters": [
        "work",
        "tools",
        "agentic"
      ],
      "sz": 14,
      "def": "The use of AI to convert static design mockups into shareable, interactive prototypes with animations, voice, video, or 3D elements, without requiring manual code review or engineering involvement.",
      "rels": [
        "claude-design",
        "artifact",
        "computer-use",
        "multimodal",
        "vibe-coding"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Introducing Claude Design by Anthropic Labs Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Claude for Creative Work Anthropic Newsroom"
        }
      ],
      "fullName": "AI-Assisted Interactive Prototyping"
    },
    {
      "id": "behavioral-audit",
      "label": "Behavioral Audit",
      "clusters": [
        "safety",
        "technical"
      ],
      "sz": 14,
      "def": "A systematic post-hoc investigation into unexpected or undesirable model behaviors, tracing their origin through training data, reward signals, and rollout statistics to identify root causes and inform targeted fixes.",
      "rels": [
        "evals",
        "interpretability",
        "red-teaming",
        "alignment",
        "silent-failure"
      ],
      "refs": [
        {
          "n": 1,
          "src": "OpenAI News, Wed, 29 Apr 2026 20:00:00 GMT",
          "q": "Where the goblins came from OpenAI News"
        },
        {
          "n": 2,
          "src": "Simon Willison's Weblog, 2026-05-03T15:13:23+00:00",
          "q": "A quote from Anthropic Simon Willison's Weblog"
        },
        {
          "n": 3,
          "src": "OpenAI Research",
          "q": "Introducing GPT-5.5 OpenAI Research"
        }
      ],
      "fullName": "Behavioral Audit (Model)"
    },
    {
      "id": "trainium",
      "label": "Trainium",
      "clusters": [
        "technical",
        "companies"
      ],
      "sz": 14,
      "def": "AWS's purpose-built AI training chip, referenced in the context of Amazon's AI infrastructure strategy and commodity market dynamics for AI compute.",
      "rels": [
        "ai-accelerator",
        "ai-inference-chip",
        "purpose-built-ai-infrastructure"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Stratechery, Mon, 04 May 2026 10:00:00 +0000",
          "q": "Google Earnings, Meta Earnings Stratechery"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Higher usage limits for Claude and a compute deal with SpaceX Anthropic Newsroom"
        }
      ],
      "fullName": "Trainium (AWS AI Training Chip)",
      "nodeType": "product"
    },
    {
      "id": "voice-ai",
      "label": "Voice AI",
      "clusters": [
        "models",
        "tools"
      ],
      "sz": 16,
      "def": "AI systems designed for real-time spoken interaction, encompassing speech recognition, language modeling, and speech synthesis in an integrated pipeline optimized for conversational latency.",
      "rels": [
        "inference",
        "latency",
        "multimodal",
        "chatbot"
      ],
      "refs": [
        {
          "n": 1,
          "src": "OpenAI News, Mon, 04 May 2026 00:00:00 GMT",
          "q": "How OpenAI delivers low-latency voice AI at scale OpenAI News"
        },
        {
          "n": 2,
          "src": "Simon Willison's Weblog, 2026-05-09T01:03:58+00:00",
          "q": "A quote from Luke Curley Simon Willison's Weblog"
        }
      ]
    },
    {
      "id": "gpt55",
      "label": "GPT-5.5",
      "clusters": [
        "models",
        "companies"
      ],
      "sz": 14,
      "def": "A frontier language model released by OpenAI, successor in the GPT-5 family following GPT-5.4.",
      "rels": [
        "openai-co",
        "frontier-model",
        "proprietary-model",
        "gpt54"
      ],
      "refs": [
        {
          "n": 1,
          "src": "OpenAI News, Thu, 23 Apr 2026 11:00:00 GMT",
          "q": "Introducing GPT-5.5 OpenAI News"
        },
        {
          "n": 2,
          "src": "OpenAI News, Thu, 23 Apr 2026 11:00:00 GMT",
          "q": "GPT-5.5 System Card OpenAI News"
        },
        {
          "n": 3,
          "src": "OpenAI News, Tue, 28 Apr 2026 00:00:00 GMT",
          "q": "OpenAI models, Codex, and Managed Agents come to AWS OpenAI News"
        }
      ],
      "fullName": "GPT-5.5 (OpenAI)",
      "nodeType": "product"
    },
    {
      "id": "agentic-business-model",
      "label": "Agentic Business Model",
      "clusters": [
        "business",
        "agentic"
      ],
      "sz": 16,
      "def": "A commercial model in which revenue or value delivery is structured around autonomous AI agents performing tasks on behalf of customers, rather than traditional seat- or usage-based SaaS pricing.",
      "rels": [
        "agent",
        "saas",
        "saaspocalypse",
        "vertical-ai",
        "workflow"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Stratechery, Wed, 06 May 2026 10:00:00 +0000",
          "q": "Microsoft Earnings, Apple Earnings Stratechery"
        },
        {
          "n": 2,
          "src": "Stratechery, Fri, 08 May 2026 17:00:00 +0000",
          "q": "2026.19: Earning & Spending Stratechery"
        },
        {
          "n": 3,
          "src": "Stratechery, Wed, 13 May 2026 10:00:00 +0000",
          "q": "The Deployment Company, Back to the 70s, Apple and Intel Stratechery"
        }
      ]
    },
    {
      "id": "data-residency",
      "label": "Data Residency",
      "clusters": [
        "security",
        "business"
      ],
      "sz": 14,
      "def": "The requirement that data be stored and processed within a specified geographic or jurisdictional boundary, increasingly relevant for enterprise AI deployments in regulated industries.",
      "rels": [
        "data-sovereignty",
        "sandboxing",
        "infrastructure"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Higher usage limits for Claude and a compute deal with SpaceX Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "The Verge — AI, 2026-05-13T12:45:43-04:00",
          "q": "Mark Zuckerberg announces ‘completely private’ encrypted Meta AI chat The Verge — AI"
        }
      ]
    },
    {
      "id": "ai-speed-cyber-defense",
      "label": "AI-Speed Cyber Defense",
      "clusters": [
        "security",
        "critical"
      ],
      "sz": 16,
      "def": "A strategic framing — used in executive and business leadership contexts (e.g., HBR, enterprise security discourse) — for the proposition that defensive cybersecurity operations must match or exceed the tempo at which AI-assisted offensive attacks can be launched and iterated. The concept implies that traditional human-paced security operations centers (SOCs) and response workflows are structurally outpaced by AI-accelerated threat actors, requiring AI-native defensive tooling and automated response.",
      "rels": [
        "guardrails",
        "ai-red-teaming",
        "blue-team",
        "sandboxing",
        "blast-radius"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Harvard Business Review, 2026-05-08T12:25:11Z",
          "q": "“Cyber Defense Has to Move at the Speed of AI” Harvard Business Review"
        },
        {
          "n": 2,
          "src": "The Verge — AI, 2026-05-11T12:09:42-04:00",
          "q": "Google stopped a zero-day hack that it says was developed with AI The Verge — AI"
        }
      ]
    },
    {
      "id": "agentic-era",
      "label": "Agentic Era",
      "clusters": [
        "agentic",
        "landscape"
      ],
      "sz": 14,
      "def": "An industry framing — most prominently used by Google (\"the agentic era\") and adopted by other lab marketing — for the current or emerging phase of AI development centered on widespread deployment of autonomous, multi-step agents. The framing is contested: critics (notably the AI agent reliability literature) argue it asserts a periodization that outpaces measured capability, while proponents argue agentic deployment represents a genuine workflow-integration shift distinct from prior single-turn patterns.",
      "rels": [
        "agent",
        "autonomous-agent",
        "multi-agent",
        "workflow",
        "long-horizon-autonomy"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Mon, 04 May 2026 17:00:00 +0000",
          "q": "The latest AI news we announced in April 2026 Google AI Blog"
        },
        {
          "n": 2,
          "src": "Stratechery, Thu, 14 May 2026 10:00:00 +0000",
          "q": "An Interview with Ben Thompson at the MoffettNathanson Media, Internet & Communications Conference Stratechery"
        },
        {
          "n": 3,
          "src": "The Verge — AI, 2026-05-15T14:21:35-04:00",
          "q": "OpenAI keeps shuffling its executives in bid to win AI agent battle The Verge — AI"
        }
      ],
      "fullName": "The Agentic Era"
    },
    {
      "id": "privacy-by-design",
      "label": "Privacy by Design",
      "clusters": [
        "technical",
        "business"
      ],
      "sz": 14,
      "def": "An architectural principle applied in AI deployment contexts where sensitive data — such as proprietary CAD geometry — must not leave a controlled environment. In this framing, on-premise model hosting (e.g., running open-weight models on local GPU hardware) is treated not as a performance optimisation but as a compliance and confidentiality requirement. Distinct from the broader regulatory usage of the term in GDPR contexts, though related.",
      "rels": [
        "open-weight",
        "data-sovereignty",
        "infrastructure",
        "vertical-ai"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Hugging Face Blog, Sun, 10 May 2026 18:44:11 GMT",
          "q": "MachinaCheck: Building a Multi-Agent CNC Manufacturability System on AMD MI300X Hugging Face Blog"
        },
        {
          "n": 2,
          "src": "The Verge — AI, 2026-05-17T14:40:28-04:00",
          "q": "Revamped Siri will reportedly offer auto-deleting chats The Verge — AI"
        }
      ],
      "fullName": "Privacy by Design (On-Premise AI Deployment)"
    },
    {
      "id": "ml-observability",
      "label": "Observability (ML Infrastructure)",
      "clusters": [
        "technical",
        "lifecycle"
      ],
      "sz": 14,
      "def": "The practice of monitoring, visualising, and diagnosing the health and performance of large-scale machine learning infrastructure — spanning cluster hardware, network utilisation, and model training runs. In foundation model contexts, typically implemented via tools such as Prometheus (metrics collection) and Grafana (visualisation/alerting), positioned as a cross-cutting operational layer above hardware, orchestration, and ML framework tiers.",
      "rels": [
        "evals",
        "infrastructure",
        "purpose-built-ai-infrastructure",
        "workflow"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Hugging Face Blog, Mon, 11 May 2026 23:18:26 GMT",
          "q": "Building Blocks for Foundation Model Training and Inference on AWS Hugging Face Blog"
        },
        {
          "n": 2,
          "src": "Simon Willison's Weblog, 2026-05-17T15:59:41+00:00",
          "q": "GDS weighs in on the NHS’s decision to retreat from Open Source Simon Willison's Weblog"
        }
      ]
    },
    {
      "id": "hyperscale-data-center",
      "label": "Hyperscale Data Center",
      "clusters": [
        "technical",
        "landscape"
      ],
      "sz": 14,
      "def": "A very large-scale data center facility — typically tens of thousands of acres or gigawatts of power capacity — built to support cloud and AI compute at massive scale. In the AI context, hyperscale data centers are the physical substrate for frontier model training and inference infrastructure. The term is used by operators, planners, and critics alike, though 'hyperscale' has no universal threshold; usage ranges from technical capacity descriptors to policy shorthand for facilities whose energy demands rival those of entire states.",
      "rels": [
        "purpose-built-ai-infrastructure",
        "ai-accelerator",
        "inference",
        "training",
        "infrastructure"
      ],
      "refs": [
        {
          "n": 1,
          "src": "The Verge — AI, 2026-05-08T14:45:08-04:00",
          "q": "All the latest updates on AI data centers The Verge — AI"
        },
        {
          "n": 2,
          "src": "Stratechery, Mon, 18 May 2026 10:00:00 +0000",
          "q": "Data Center Discontent, Understanding the Opposition, Fixing the Problem Stratechery"
        }
      ]
    },
    {
      "id": "ai-energy-demand",
      "label": "AI Energy Demand",
      "clusters": [
        "landscape",
        "critical"
      ],
      "sz": 14,
      "def": "The aggregate electricity consumption attributable to AI compute infrastructure — primarily data centers running training and inference workloads. The term appears in policy, environmental, and utility discourse as a framing for how AI expansion strains power grids and raises residential energy bills. It is contested in scope: industry characterises data center energy growth as manageable and offset by efficiency gains, while critics and regulators (including the NAACP, bipartisan senators, and Pew survey respondents) frame it as an inequitably distributed burden on communities and ratepayers.",
      "rels": [
        "purpose-built-ai-infrastructure",
        "inference",
        "training",
        "infrastructure",
        "ai-accelerator"
      ],
      "refs": [
        {
          "n": 1,
          "src": "The Verge — AI, 2026-05-08T14:45:08-04:00",
          "q": "All the latest updates on AI data centers The Verge — AI"
        },
        {
          "n": 2,
          "src": "Stratechery, Mon, 18 May 2026 10:00:00 +0000",
          "q": "Data Center Discontent, Understanding the Opposition, Fixing the Problem Stratechery"
        }
      ],
      "fullName": "AI Energy Demand (Data Center Power Consumption)"
    },
    {
      "id": "ratepayer-protection-pledge",
      "label": "Ratepayer Protection Pledge",
      "clusters": [
        "business",
        "landscape"
      ],
      "sz": 14,
      "def": "A voluntary commitment signed by major tech companies, referenced in a Senate letter to the EIA, to protect electricity ratepayers from cost increases attributable to data center expansion. The pledge is cited by Senators Warren and Hawley as a benchmark against which mandatory energy-use disclosures would hold signatories accountable. Its voluntary nature is precisely what critics say warrants mandatory reporting requirements to verify compliance.",
      "rels": [
        "purpose-built-ai-infrastructure",
        "infrastructure",
        "agent-governance"
      ],
      "refs": [
        {
          "n": 1,
          "src": "The Verge — AI, 2026-05-08T14:45:08-04:00",
          "q": "All the latest updates on AI data centers The Verge — AI"
        },
        {
          "n": 2,
          "src": "Stratechery, Mon, 18 May 2026 10:00:00 +0000",
          "q": "Data Center Discontent, Understanding the Opposition, Fixing the Problem Stratechery"
        }
      ],
      "fullName": "Ratepayer Protection Pledge (Tech Industry Energy Commitment)"
    },
    {
      "id": "system-card",
      "label": "System Card",
      "clusters": [
        "safety",
        "lifecycle"
      ],
      "sz": 14,
      "def": "A structured documentation artifact published alongside an AI model release that details its capabilities, limitations, safety evaluations, red-teaming results, and deployment guidelines.",
      "rels": [
        "frontier-model",
        "evals",
        "red-teaming",
        "responsible-scaling-policy",
        "openai-co",
        "alignment",
        "guardrails"
      ],
      "refs": [
        {
          "n": 1,
          "src": "OpenAI News, Thu, 23 Apr 2026 11:00:00 GMT",
          "q": "GPT-5.5 System Card OpenAI News"
        },
        {
          "n": 2,
          "src": "OpenAI News, Sun, 26 Apr 2026 16:00:00 GMT",
          "q": "Our principles OpenAI News"
        },
        {
          "n": 3,
          "src": "OpenAI Research",
          "q": "OpenAI Research OpenAI Research"
        }
      ]
    },
    {
      "id": "orbital-ai-compute",
      "label": "Orbital AI Compute",
      "clusters": [
        "technical"
      ],
      "sz": 14,
      "def": "AI compute infrastructure deployed in orbital/space-based data centers, as distinct from terrestrial cloud infrastructure. Referenced here as a future development Anthropic is exploring with SpaceX.",
      "rels": [
        "purpose-built-ai-infrastructure",
        "ai-accelerator",
        "infrastructure"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Higher usage limits for Claude and a compute deal with SpaceX Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "Stratechery, Wed, 27 May 2026 10:00:00 +0000",
          "q": "The SpaceX IPO and Data Centers in Space Stratechery"
        }
      ]
    },
    {
      "id": "adjustable-reasoning-effort",
      "label": "Adjustable Reasoning Effort",
      "clusters": [
        "models",
        "technical"
      ],
      "sz": 14,
      "def": "A developer-facing inference control that lets callers select the computational reasoning depth applied to a given request — ranging from minimal to xhigh — to trade off response latency against reasoning quality. Introduced in GPT-Realtime-2 as a mechanism to balance responsiveness in simple voice interactions with deliberate reasoning for complex tasks.",
      "rels": [
        "reasoning-models",
        "latency",
        "inference",
        "cost"
      ],
      "refs": [
        {
          "n": 1,
          "src": "OpenAI News, Thu, 07 May 2026 10:00:00 GMT",
          "q": "Advancing voice intelligence with new models in the API OpenAI News"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Introducing Claude Opus 4.8 Anthropic Newsroom"
        }
      ],
      "fullName": "Adjustable Reasoning Effort (LLM Inference Control)"
    },
    {
      "id": "stargate-project",
      "label": "Stargate",
      "clusters": [
        "companies",
        "landscape"
      ],
      "sz": 14,
      "def": "OpenAI's $500 billion AI infrastructure initiative, involving partnerships with Oracle, Nvidia, Cisco, and SoftBank, to build large-scale data center capacity globally — including a $30 billion facility in Abu Dhabi. The project is cited in geopolitical, environmental, and policy contexts as an emblematic instance of frontier AI infrastructure at nation-state scale. The name 'Stargate' is used both for the overarching investment program and for specific facilities under construction.",
      "rels": [
        "openai-co",
        "purpose-built-ai-infrastructure",
        "infrastructure",
        "nvidia-co",
        "frontier-model"
      ],
      "refs": [
        {
          "n": 1,
          "src": "The Verge — AI, 2026-05-08T14:45:08-04:00",
          "q": "All the latest updates on AI data centers The Verge — AI"
        },
        {
          "n": 2,
          "src": "Stratechery, Wed, 27 May 2026 10:00:00 +0000",
          "q": "The SpaceX IPO and Data Centers in Space Stratechery"
        }
      ],
      "fullName": "Stargate (OpenAI AI Infrastructure Project)",
      "nodeType": "product"
    },
    {
      "id": "capability-reliability-gap",
      "label": "Capability-Reliability Gap",
      "clusters": [
        "agentic",
        "safety"
      ],
      "sz": 14,
      "def": "The observed divergence between rapid improvement in AI agent task accuracy/capability benchmarks and the much slower improvement in reliability dimensions such as consistency, robustness, calibration, and bounded failure severity.",
      "rels": [
        "agent",
        "evals",
        "benchmark-saturation",
        "hallucination",
        "silent-failure",
        "autonomy-spectrum",
        "guardrails"
      ],
      "refs": [
        {
          "n": 1,
          "src": "AI Snake Oil, Tue, 24 Feb 2026 13:07:19 GMT",
          "q": "New Paper: Towards a science of AI agent reliability AI Snake Oil"
        },
        {
          "n": 2,
          "src": "AI Snake Oil, Thu, 16 Apr 2026 17:47:29 GMT",
          "q": "Open-world evaluations for measuring frontier AI capabilities AI Snake Oil"
        },
        {
          "n": 3,
          "src": "Hugging Face Blog, Wed, 27 May 2026 17:20:29 GMT",
          "q": "ITBench-AA: Frontier Models Score Below 50% on the First Benchmark for Agentic Enterprise IT Tasks — by Artificial Analysis and IBM Hugging Face Blog"
        }
      ]
    },
    {
      "id": "gemini-omni",
      "label": "Gemini Omni",
      "clusters": [
        "models",
        "tools"
      ],
      "sz": 14,
      "def": "A new model family from Google announced at I/O 2026 that accepts any modality as input (images, audio, video, text) and generates high-quality video output grounded in real-world knowledge, with conversational editing. The first release is Gemini Omni Flash, available via the Gemini app, Google Flow, YouTube Shorts, and YouTube Create.",
      "rels": [
        "gemini",
        "google-co",
        "google-flow",
        "multimodal"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Thu, 28 May 2026 15:00:00 +0000",
          "q": "Catch up on 12 major I/O 2026 moments Google AI Blog"
        },
        {
          "n": 2,
          "src": "Last Week in AI, Wed, 27 May 2026 07:50:58 GMT",
          "q": "Last Week in AI #341 - Musk loses to OpenAI, Google's IO updates, OpenAI solves Erdős Last Week in AI"
        },
        {
          "n": 3,
          "src": "Google AI Blog, Fri, 29 May 2026 17:30:00 +0000",
          "q": "9 demos of Gemini Omni and Gemini 3.5 in action Google AI Blog"
        }
      ],
      "fullName": "Gemini Omni (Google)",
      "nodeType": "product"
    },
    {
      "id": "gemini-35-flash",
      "label": "Gemini 3.5 Flash",
      "clusters": [
        "models",
        "agentic"
      ],
      "sz": 14,
      "def": "The first release in Google's Gemini 3.5 model family, announced at I/O 2026. Positioned as combining frontier intelligence with agentic action, optimised for complex long-horizon tasks, coding, and agent workflows. Available via Google AI Studio, Android Studio, Gemini Enterprise Agent Platform, and AI Mode in Search.",
      "rels": [
        "gemini",
        "google-co",
        "long-horizon-autonomy",
        "gemini-enterprise-agent-platform"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Thu, 28 May 2026 15:00:00 +0000",
          "q": "Catch up on 12 major I/O 2026 moments Google AI Blog"
        },
        {
          "n": 2,
          "src": "Last Week in AI, Wed, 27 May 2026 07:50:58 GMT",
          "q": "Last Week in AI #341 - Musk loses to OpenAI, Google's IO updates, OpenAI solves Erdős Last Week in AI"
        },
        {
          "n": 3,
          "src": "Google AI Blog, Fri, 29 May 2026 17:30:00 +0000",
          "q": "9 demos of Gemini Omni and Gemini 3.5 in action Google AI Blog"
        }
      ],
      "fullName": "Gemini 3.5 Flash (Google DeepMind)",
      "nodeType": "product"
    },
    {
      "id": "google-antigravity",
      "label": "Google Antigravity",
      "clusters": [
        "tools",
        "agentic"
      ],
      "sz": 14,
      "def": "A Google platform announced at I/O 2026 that brings agentic coding capabilities into Search and other products, enabling on-the-fly generation of custom UI layouts, interactive experiences, dashboards, and mini-apps from user queries. Positioned as enabling personal software creation within Search.",
      "rels": [
        "google-co",
        "micro-app",
        "personal-software",
        "canvas-ai-mode",
        "agentic-era"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Google AI Blog, Thu, 28 May 2026 15:00:00 +0000",
          "q": "Catch up on 12 major I/O 2026 moments Google AI Blog"
        },
        {
          "n": 2,
          "src": "Google AI Blog, Fri, 29 May 2026 19:00:00 +0000",
          "q": "Take our I/O 2026 quiz, vibe coded in Google AI Studio. Google AI Blog"
        },
        {
          "n": 3,
          "src": "AI Snake Oil, Fri, 22 May 2026 22:24:18 GMT",
          "q": "Did Google’s AI agents really build an operating system for $916? AI Snake Oil"
        }
      ],
      "nodeType": "product"
    },
    {
      "id": "run-rate-revenue",
      "label": "Run-Rate Revenue",
      "clusters": [
        "business"
      ],
      "sz": 14,
      "def": "A financial reporting practice in which a company annualizes its most recent period's revenue (typically by multiplying a single month's figure by 12) to project a forward-looking revenue figure. Used by Anthropic in successive fundraise announcements to communicate growth trajectory to investors. The term is standard in startup finance but has attracted scrutiny in AI contexts because it can reflect a single high-momentum month rather than a sustained run, and companies have incentive to time announcements to favorable periods.",
      "rels": [
        "anthropic-co"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Simon Willison's Weblog, 2026-05-29T01:23:08+00:00",
          "q": "Anthropic's run-rate revenue hits $47 billion Simon Willison's Weblog"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Anthropic raises $65B in Series H funding at $965B post-money valuation Anthropic Newsroom"
        }
      ],
      "fullName": "Run-Rate Revenue (ARR Projection)"
    },
    {
      "id": "hyperscaler",
      "label": "Hyperscaler",
      "clusters": [
        "business",
        "technical"
      ],
      "sz": 14,
      "def": "A shorthand for large-scale cloud platform providers — specifically Amazon Web Services, Google Cloud, and Microsoft Azure in this context — whose infrastructure underpins AI model training and deployment. Used here to distinguish the $15B in previously committed hyperscaler investment from new investors, and to note Anthropic's position as the first frontier model available across all three.",
      "rels": [
        "anthropic-co",
        "purpose-built-ai-infrastructure",
        "claude",
        "trainium"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Anthropic Newsroom",
          "q": "Anthropic raises $65B in Series H funding at $965B post-money valuation Anthropic Newsroom"
        },
        {
          "n": 2,
          "src": "Stratechery, Fri, 29 May 2026 17:00:00 +0000",
          "q": "2026.22: Luceing Their Mind Stratechery"
        }
      ],
      "fullName": "Hyperscaler (Cloud Provider in AI Context)"
    },
    {
      "id": "offense-defense-balance",
      "label": "Offense-Defense Balance",
      "clusters": [
        "safety",
        "critical"
      ],
      "sz": 14,
      "def": "A framing borrowed from strategic studies and applied by Kapoor and Narayanan to AI misuse risk: the question of whether a given AI capability advantages attackers or defenders more, and whether defensive investments (resilience) can outpace offensive use. Used to argue that extraordinary pre-deployment restrictions are less effective than building societal resilience, since attackers can exploit capabilities without going through slow organisational adoption. The balance shifts depending on domain (e.g., cyber vs. bio), capability type, and the speed of defensive tooling development.",
      "rels": [
        "guardrails",
        "sandboxing",
        "blast-radius",
        "ai-speed-cyber-defense"
      ],
      "refs": [
        {
          "n": 1,
          "src": "AI Snake Oil, Thu, 21 May 2026 13:19:41 GMT",
          "q": "Do AI Risks Require Extraordinary Government Intervention? AI Snake Oil"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Expanding Project Glasswing Anthropic Newsroom"
        }
      ],
      "fullName": "Offense-Defense Balance (AI Misuse Risk)"
    },
    {
      "id": "deployment-company",
      "label": "Deployment Company",
      "clusters": [
        "business",
        "companies"
      ],
      "sz": 14,
      "def": "A framing used in Stratechery (Thompson, 2026) for a new organizational form — separate from the AI lab itself — dedicated to deploying AI into enterprises and workflows at scale. Thompson notes OpenAI is forming such a company, and argues other labs are likely to follow, with the thesis that AI's real impact requires 'top-down implementation' distinct from platform-layer model development.",
      "rels": [
        "vertical-ai",
        "infrastructure",
        "saas",
        "stack"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Stratechery, Fri, 15 May 2026 17:00:00 +0000",
          "q": "2026.20: Shifting Alliances in a Changing World Stratechery"
        },
        {
          "n": 2,
          "src": "Stratechery, Mon, 18 May 2026 10:00:00 +0000",
          "q": "Data Center Discontent, Understanding the Opposition, Fixing the Problem Stratechery"
        },
        {
          "n": 3,
          "src": "Anthropic Newsroom",
          "q": "Introducing the Services Track and Partner Hub of the Claude Partner Network Anthropic Newsroom"
        }
      ],
      "fullName": "AI Deployment Company"
    },
    {
      "id": "inference-shift",
      "label": "Inference Shift",
      "clusters": [
        "landscape",
        "technical"
      ],
      "sz": 14,
      "def": "A periodization framing — introduced and elaborated by Ben Thompson in this Stratechery piece — for the structural transition in AI compute demand from training-dominated GPU workloads to inference-dominated, increasingly heterogeneous hardware deployments. The framing argues that as agent usage scales, inference becomes the primary driver of compute spend, creating market conditions for specialised inference silicon distinct from Nvidia's GPU-centric stack. As a named framing by a single analyst, its adoption and durability as industry terminology remains to be seen.",
      "rels": [
        "inference",
        "ai-accelerator",
        "purpose-built-ai-infrastructure",
        "ai-inference-chip",
        "agentic-era"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Stratechery, Mon, 11 May 2026 10:00:00 +0000",
          "q": "The Inference Shift Stratechery"
        },
        {
          "n": 2,
          "src": "Stratechery, Fri, 15 May 2026 17:00:00 +0000",
          "q": "2026.20: Shifting Alliances in a Changing World Stratechery"
        },
        {
          "n": 3,
          "src": "Stratechery, Fri, 29 May 2026 17:00:00 +0000",
          "q": "2026.22: Luceing Their Mind Stratechery"
        }
      ],
      "fullName": "The Inference Shift"
    },
    {
      "id": "aint",
      "label": "AI as Normal Technology",
      "clusters": [
        "critical",
        "landscape"
      ],
      "sz": 14,
      "def": "A framework advanced by Sayash Kapoor and Arvind Narayanan (AI Snake Oil) arguing that AI's economic and social impacts follow the diffusion patterns of prior general-purpose technologies — subject to speed limits such as organisational adoption, workflow change, and regulation — rather than constituting a categorically unprecedented disruption. Used to argue against extraordinary government intervention and rapid job-displacement claims. The framework is contested: critics (including Derek Thompson and others in the AI risk tradition) argue that AI's emergent capabilities and unknown-unknown risk profile make the 'normal technology' analogy insufficient for safety policy, even if it holds for labour market analysis.",
      "rels": [
        "emergent-capability",
        "agent-washing",
        "benchmark-gaming",
        "distribution-shift"
      ],
      "refs": [
        {
          "n": 1,
          "src": "AI Snake Oil, Thu, 21 May 2026 13:19:41 GMT",
          "q": "Do AI Risks Require Extraordinary Government Intervention? AI Snake Oil"
        },
        {
          "n": 2,
          "src": "Anthropic Newsroom",
          "q": "Anthropic co-founder Chris Olah's remarks on Pope Leo XIV's encyclical \"Magnifica humanitas\" Anthropic Newsroom"
        }
      ],
      "fullName": "AI as Normal Technology (AINT)"
    },
    {
      "id": "gemini-spark",
      "label": "Gemini Spark",
      "clusters": [
        "agentic",
        "tools"
      ],
      "sz": 14,
      "def": "A 24/7 cloud-based personal AI agent launched by Google at I/O 2026, built on Gemini base models and the Antigravity agentic harness. Runs on dedicated virtual machines so it continues operating when the user's device is locked, integrates natively with Gmail, Google Docs, and Workspace via MCP, and can be emailed directly via a dedicated Gmail address.",
      "rels": [
        "google-co",
        "gemini",
        "google-antigravity",
        "mcp",
        "agentic-harness",
        "proactive-agent"
      ],
      "refs": [
        {
          "n": 1,
          "src": "Last Week in AI, Wed, 27 May 2026 07:50:58 GMT",
          "q": "Last Week in AI #341 - Musk loses to OpenAI, Google's IO updates, OpenAI solves Erdős Last Week in AI"
        },
        {
          "n": 2,
          "src": "Last Week in AI, Tue, 26 May 2026 05:10:23 GMT",
          "q": "LWiAI Podcast #246 - Gemini 3.5 + Omni, Musk Loses, OpenAI vs Erdős  Last Week in AI"
        },
        {
          "n": 3,
          "src": "Google AI Blog, Fri, 05 Jun 2026 14:45:00 +0000",
          "q": "The latest AI news we announced in May 2026 Google AI Blog"
        }
      ],
      "fullName": "Gemini Spark (Google)",
      "nodeType": "product"
    },
    {
      "id": "project-solara",
      "label": "Project Solara",
      "clusters": [
        "agentic",
        "tools"
      ],
      "sz": 14,
      "def": "An Android-based operating system developed by Microsoft in partnership with Qualcomm and MediaTek, designed to run AI agents across a variety of devices and enable cross-device task handoff. Announced at Build 2026 with prototype form factors including a desktop hub and digital badge.",
      "rels": [
        "agent",
        "handoff",
        "a2a",
        "agent-os"
      ],
      "refs": [
        {
          "n": 1,
          "src": "The Verge — AI, 2026-06-02T15:23:52-04:00",
          "q": "Microsoft Build 2026: The 7 biggest announcements The Verge — AI"
        },
        {
          "n": 2,
          "src": "Stratechery, Wed, 03 Jun 2026 10:00:00 +0000",
          "q": "The Nvidia AI PC, Project Solara, Microsoft AI Stratechery"
        },
        {
          "n": 3,
          "src": "Stratechery, Thu, 04 Jun 2026 10:00:00 +0000",
          "q": "An Interview with Microsoft CEO Satya Nadella About Finding Core Competencies Stratechery"
        }
      ],
      "fullName": "Project Solara (Microsoft Agent OS)",
      "nodeType": "product"
    }
  ],
  "definitionOverrides": [
    {
      "id": "gpt54",
      "def": "OpenAI model released prior to GPT-5.5. Combines advanced reasoning, coding, and computer use. Available in standard, Thinking, and Pro variants with up to 1M token context via API. Superseded by GPT-5.5 (released April 23, 2026) as OpenAI's flagship model.",
      "refs": [
        {
          "n": 1,
          "src": "OpenAI News, Thu, 30 Apr 2026 00:00:00 GMT",
          "q": "Introducing Advanced Account Security OpenAI News"
        },
        {
          "n": 2,
          "src": "AI Snake Oil, Thu, 12 Feb 2026 19:26:05 GMT",
          "q": "AI Won’t Automatically Make Legal Services Cheaper AI Snake Oil"
        }
      ]
    }
  ]
};
