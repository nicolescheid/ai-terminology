// Backfill must-reads from articles Lexi has already read.
//
// One-shot script. Iterates every URL in state.seenArticles, re-fetches
// each article, and asks Claude a focused must-read judgment (no candidate
// enumeration — that work was done on the original run). For each article
// Lexi flags, adds an entry to must-reads.json with `flaggedAt` set to
// the original seenAt timestamp (so the public page shows the article in
// its actual chronological position, not "all flagged today").
//
// Skips articles already in must-reads.json (URL dedup), so safe to re-run.
//
// Run with: node backfill-must-reads.mjs [--limit N] [--dry-run]
//
// Cost estimate: ~$0.05 per article × number of articles (35 articles ≈ $2).
// Smaller per call than the regular extract because we skip candidate
// enumeration and the cached-prefix overhead.

import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

import { loadJson, loadGraphData, mergeNodes, writeJson } from "./state-io.mjs";
import { fetchArticle } from "./article-fetch.mjs";
import { cleanText } from "./text-utils.mjs";
import { callStructuredOutput } from "./claude-calls.mjs";
import { createLogger } from "./logger.mjs";
import { ACTIONS } from "./actions.mjs";

// Schema for the focused judgment call. Same shape as the must-read field
// in the main extract response, but standalone — no candidates, no summary.
const JUDGMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["mustRead"],
  properties: {
    mustRead: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["priority", "reason", "clusters"],
      properties: {
        priority: { type: "integer", enum: [1, 2, 3] },
        reason: { type: "string" },
        clusters: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 2 }
      }
    },
    summary: { type: "string" }
  }
};

const JUDGMENT_SYSTEM_PROMPT = [
  "You are Lexi, an AI lexicographer who curates a public reading list called 'Lexi's List' at /lexis-list/.",
  "",
  "Given an article you've previously read, decide whether it deserves a place on the list. The bar is editorial value, not news value — readers come to Lexi's List to understand where AI vocabulary is going, not to keep up with product launches. Most articles should NOT be flagged.",
  "",
  "Flag if the article:",
  "- Introduces a substantive framing shift, new concept, or worldview about AI",
  "- Is a primary source on something important to AI terminology",
  "- Crosses domains, is contrarian in a thoughtful way, or reframes a familiar term",
  "",
  "Do NOT flag if the article:",
  "- Is primarily a product launch, feature announcement, or pricing change",
  "- Is a listicle or 'X things you need to know' format",
  "- Is news-of-the-day with no lasting interpretive value",
  "",
  "If the article does not clear the bar, return `mustRead: null`. Otherwise:",
  "- Priority 1 = highly recommend (rare; reserve for genuinely outstanding pieces)",
  "- Priority 2 = interesting and worthwhile",
  "- Priority 3 = if you have time",
  "",
  "The `reason` should be one or two sentences in your voice as a curator, written for any reader (not personal notes — Lexi's List is public).",
  "",
  "The `clusters` field should be 1-2 cluster ids (from the Available clusters list provided) describing the article's subject matter — used to group entries on the public page.",
  "",
  "Also include a brief one-sentence `summary` of the article (used as supporting context on the listing).",
  "",
  "Return JSON only."
].join("\n");

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set. Backfill needs Claude API access.");
    process.exitCode = 1;
    return;
  }

  const state = await loadJson(config.statePath, { seenArticles: {} });
  const mustReads = await loadJson(config.mustReadsPath, { meta: {}, entries: [] });
  const graph = await loadGraphData(config.graphDataPath);
  const clusterNames = Object.keys(graph.clusters).join(", ");

  // Articles to consider: all seen, sorted oldest-first (so backfill writes
  // in chronological order). Skip those already in must-reads.json (URL).
  const seenList = Object.values(state.seenArticles || {})
    .filter(a => a && a.url)
    .sort((a, b) => String(a.seenAt || "").localeCompare(String(b.seenAt || "")));
  const existingUrls = new Set(mustReads.entries.map(e => e.url));
  const candidates = seenList.filter(a => !existingUrls.has(a.url));

  const limit = Number.isFinite(args.limit) ? args.limit : candidates.length;
  const toProcess = candidates.slice(0, limit);

  if (!toProcess.length) {
    console.log(`Nothing to backfill — ${seenList.length} seen, ${mustReads.entries.length} already on the list, 0 unprocessed.`);
    return;
  }

  console.log(`Backfilling must-read judgments for ${toProcess.length} article(s).`);
  console.log(`(Estimated cost: ~$${(toProcess.length * 0.05).toFixed(2)})`);
  if (args.dryRun) console.log("DRY RUN — no API calls or writes will happen.\n");
  else console.log("");

  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });
  const anthropic = new Anthropic({ apiKey });
  const writtenAt = new Date().toISOString();

  await logger.event("backfill_must_reads_start", {
    candidateCount: toProcess.length,
    dryRun: !!args.dryRun
  });

  let flaggedCount = 0;
  let skippedCount = 0;
  let erroredCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const seen = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;
    process.stdout.write(`${progress} ${seen.title?.slice(0, 70) || seen.url} ... `);

    if (args.dryRun) {
      console.log("(dry-run, skipped)");
      continue;
    }

    let article;
    try {
      article = await fetchArticle(seen, config);
      if (!article || !article.excerpt) {
        console.log("fetch failed");
        erroredCount++;
        continue;
      }
    } catch (err) {
      console.log(`fetch errored: ${err.message}`);
      erroredCount++;
      continue;
    }

    let judgment;
    try {
      const userText = [
        `Available clusters: ${clusterNames}`,
        "",
        `Article title: ${article.title}`,
        `Article source: ${article.sourceLabel}`,
        `Article URL: ${article.url}`,
        "",
        "Article excerpt:",
        article.excerpt
      ].join("\n");

      judgment = await callStructuredOutput(anthropic, {
        model: config.model,
        max_tokens: 1500,
        system: JUDGMENT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userText }],
        output_config: { format: { type: "json_schema", schema: JUDGMENT_SCHEMA } }
      });
    } catch (err) {
      console.log(`judgment errored: ${err.message}`);
      erroredCount++;
      continue;
    }

    if (!judgment.mustRead) {
      console.log("not flagged");
      skippedCount++;
      continue;
    }

    const validClusters = (judgment.mustRead.clusters || []).filter(c => graph.clusters[c]);
    const flagged = {
      id: seen.id || article.id,
      title: article.title || seen.title,
      url: article.url,
      source: article.sourceLabel || seen.sourceLabel,
      publishedAt: article.publishedAt || seen.publishedAt || null,
      summary: cleanText(judgment.summary || ""),
      priority: judgment.mustRead.priority,
      reason: cleanText(judgment.mustRead.reason),
      clusters: validClusters.length ? validClusters : ["technical"],
      novelTermsInArticle: 0, // not tracked on backfill — original run had this
      flaggedAt: seen.seenAt || writtenAt, // chronologically place at original read time
      backfilled: true,
      backfilledAt: writtenAt,
      status: "unread"
    };
    mustReads.entries.push(flagged);

    await logger.action({
      action: ACTIONS.FLAG_MUST_READ,
      source: "backfill",
      gate: "autonomous",
      outcome: "applied",
      target: { kind: "article", id: flagged.id },
      payload: { flagged },
      reason: `Backfilled must-read (priority ${flagged.priority}).`
    });
    flaggedCount++;
    console.log(`FLAGGED p${flagged.priority} [${validClusters.join(",")}]`);
  }

  if (!args.dryRun) {
    mustReads.meta = {
      generatedAt: writtenAt,
      unreadCount: mustReads.entries.filter(e => e.status === "unread").length,
      totalCount: mustReads.entries.length,
      note: mustReads.meta?.note ?? "Lexi's must-reads — articles she flags as worth reading in full."
    };
    await writeJson(config.mustReadsPath, mustReads);
  }

  await logger.event("backfill_must_reads_end", {
    flagged: flaggedCount,
    skipped: skippedCount,
    errored: erroredCount,
    totalProcessed: toProcess.length
  });

  console.log("");
  console.log(`Backfill complete.`);
  console.log(`  Flagged: ${flaggedCount}`);
  console.log(`  Not flagged (didn't clear bar): ${skippedCount}`);
  console.log(`  Errored / no excerpt: ${erroredCount}`);
  console.log(`  Total entries in must-reads.json now: ${mustReads.entries.length}`);
  if (!args.dryRun && flaggedCount > 0) {
    console.log("");
    console.log("To take effect, commit + push:");
    console.log("  git add knowledge-graph-agent/must-reads.json");
    console.log("  git commit -m 'Backfill Lexi\\'s List from articles already read'");
    console.log("  git push");
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i];
    if (v === "--dry-run") args.dryRun = true;
    else if (v === "--limit" && argv[i + 1]) { args.limit = Number.parseInt(argv[i + 1], 10); i += 1; }
    else {
      console.error(`Unknown argument: ${v}`);
      process.exitCode = 1;
    }
  }
  return args;
}
