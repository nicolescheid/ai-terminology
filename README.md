# ai-terminology.com

The home of the **AI Terminology Knowledge Graph** and **Lexi** — the AI lexicographer that curates it.

Public site: https://ai-terminology.com (deployed via Cloudflare Pages)

## Repo layout

| Path | What it is |
|---|---|
| `index.html` | The public knowledge graph viewer. Self-contained except for the three JS files below. |
| `graph-data.js` | Curated base graph (Tier 1 nodes). Hand-edited by Nicole. |
| `graph-data-agent.js` | Agent-managed overlay (currently empty under propose-only discipline). |
| `d3.min.js` | Visualization library. |
| `knowledge-graph-agent/` | Lexi — the agent that observes AI sources and curates the graph + longlist. See its [README](./knowledge-graph-agent/README.md). |
| `lexi-spec.md` | The full design + operating spec. The source of truth for what Lexi is and how it should behave. Re-read sections 2, 5, and 11 at the start of any Lexi build session. |

## Local development

The site is static — open `index.html` in a browser, or serve the directory with any static HTTP server.

The agent is a Node.js script:

```powershell
cd knowledge-graph-agent
npm install
$env:ANTHROPIC_API_KEY="sk-ant-..."
node run.mjs
```

See [knowledge-graph-agent/README.md](./knowledge-graph-agent/README.md) for what the agent does, the tier model, the permissions matrix, and the proposals queue.

## Deployment

Cloudflare Pages auto-deploys on push to the `main` branch. The site root is the repo root; no build step is required.

## Project history

This repo extracts the AI Terminology Knowledge Graph from `dyadicmind.com` (its original home) into a dedicated domain so the curatorial discipline has a front door of its own. The graph viewer was migrated as-is; the agent (formerly the Codex prototype, then migrated to the Claude API and refactored against `lexi-spec.md`) lives alongside it as `knowledge-graph-agent/`.
