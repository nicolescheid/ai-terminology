window.AGENT_GRAPH_PATCH = {
  "meta": {
    "generatedAt": "2026-05-03T08:04:27.840Z",
    "sourceCount": 6,
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
    }
  ],
  "definitionOverrides": []
};
