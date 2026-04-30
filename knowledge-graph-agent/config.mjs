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
  // Bumped from 7 → 30 on 2026-04-30 after the original cap suppressed
  // ~56 candidates in 3 days from the AI-labs source pool. 30/week roughly
  // matches the natural extraction rate from the current ~10 source feeds.
  throughputCaps: {
    longlistAdditionsPer7d: 30,
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
    // The labs themselves (concentrated, share opinions, single-domain echo
    // chambers — useful as primary signal but cannot meet the credibility bar
    // alone, which is why the diverse independent voices below were added).
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
    { type: "rss", label: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", limit: 4 },
    // Independent voices — different domains. These unlock the credibility
    // bar (≥2 independent sources from different domains) for terms that
    // are genuinely circulating in the field, not just being announced
    // by their manufacturers.
    { type: "rss", label: "Simon Willison's Weblog", url: "https://simonwillison.net/atom/everything/", limit: 4 },
    { type: "rss", label: "Stratechery", url: "https://stratechery.com/feed/", limit: 3 },
    { type: "rss", label: "AI Snake Oil", url: "https://www.aisnakeoil.com/feed", limit: 3 },
    { type: "rss", label: "Last Week in AI", url: "https://lastweekin.ai/feed", limit: 3 },
    { type: "rss", label: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", limit: 3 },
    { type: "rss", label: "The Verge — AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", limit: 4 }
  ]
};
