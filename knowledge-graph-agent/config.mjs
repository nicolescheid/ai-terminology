import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  graphDataPath: path.resolve(__dirname, "../graph-data.js"),
  agentPatchPath: path.resolve(__dirname, "../graph-data-agent.js"),
  patchJsonPath: path.resolve(__dirname, "./agent-patch.json"),
  longlistPath: path.resolve(__dirname, "./longlist.json"),
  proposalsPath: path.resolve(__dirname, "./proposals.json"),
  statePath: path.resolve(__dirname, "./state.json"),
  reportPath: path.resolve(__dirname, "./out/latest-report.json"),
  // Lexi phase per lexi-spec.md §8. Drives the permissions matrix in actions.mjs.
  // 0 = hand-run, 1 = batch automation (Nicole-triggered), 2 = autonomous + public.
  phase: Number.parseInt(process.env.LEXI_PHASE || "1", 10),
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
