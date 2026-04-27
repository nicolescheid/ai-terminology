import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  graphDataPath: path.resolve(__dirname, "../graph-data.js"),
  agentPatchPath: path.resolve(__dirname, "../graph-data-agent.js"),
  patchJsonPath: path.resolve(__dirname, "./agent-patch.json"),
  longlistPath: path.resolve(__dirname, "./longlist.json"),
  proposalsPath: path.resolve(__dirname, "./proposals.json"),
  notesForNicolePath: path.resolve(__dirname, "./notes-for-nicole.json"),
  statePath: path.resolve(__dirname, "./state.json"),
  reportPath: path.resolve(__dirname, "./out/latest-report.json"),
  // Deterministic event log (spec §11). Append-only NDJSON. Gitignored —
  // this is operational forensics data, not source code.
  logPath: path.resolve(__dirname, "./log/events.ndjson"),
  // Lexi phase per lexi-spec.md §8. Drives the permissions matrix in actions.mjs.
  // 0 = hand-run, 1 = batch automation (Nicole-triggered), 2 = autonomous + public.
  phase: Number.parseInt(process.env.LEXI_PHASE || "1", 10),
  // Manager-absent mode (spec §12). When true, all autonomous publication is
  // paused; Lexi continues observing but does not mutate the longlist or graph.
  // Override at runtime with env var LEXI_MANAGER_ABSENT=1.
  managerAbsent: false,
  // Throughput caps (spec §12.4). Tunable. Cap-hit suppresses the offending
  // action and writes a THROUGHPUT_CAP_HIT note to Notes for Nicole.
  throughputCaps: {
    longlistAdditionsPer7d: 7,
    pendingProposalsBeforePause: 10
  },
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  maxTokensPerCall: 16000,
  maxArticlesPerRun: 6,
  maxTermsPerArticle: 4,
  maxNodesToReviewPerRun: 10,
  requestTimeoutMs: 45000,
  userAgent: "DyadicMindKnowledgeGraphAgent/1.0",
  sources: [
    { type: "rss", label: "OpenAI News", url: "https://openai.com/news/rss.xml", limit: 4 },
    {
      type: "html_index",
      label: "Anthropic Newsroom",
      url: "https://www.anthropic.com/news",
      includeUrlPatterns: ["^https://www\\.anthropic\\.com/news/(?!$)"],
      limit: 4
    },
    {
      type: "html_index",
      label: "Google DeepMind News",
      url: "https://deepmind.google/blog/",
      includeUrlPatterns: ["^https://deepmind\\.google/(blog|discover/blog)/"],
      limit: 4
    },
    { type: "rss", label: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", limit: 4 }
  ]
};
