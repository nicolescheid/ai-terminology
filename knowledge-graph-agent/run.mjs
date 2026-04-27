import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { ACTIONS, GATES, resolveGate } from "./actions.mjs";
import { createLogger, promptVersion } from "./logger.mjs";
import { ENTRY_TYPES, buildNote, detectContestedOmission } from "./notes.mjs";

const DEFAULT_STATE = {
  lastRunAt: null,
  reviewCursor: 0,
  seenArticles: {},
  nodeReviews: {}
};

const NEW_TERM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "candidates"],
  properties: {
    summary: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "clusters", "def", "rels", "reason"],
        properties: {
          label: { type: "string" },
          id: { type: "string" },
          fullName: { type: "string" },
          nodeType: { type: "string", enum: ["product", "initiative", "concept"] },
          clusters: { type: "array", items: { type: "string" } },
          sz: { type: "integer" },
          def: { type: "string" },
          rels: { type: "array", items: { type: "string" } },
          reason: { type: "string" }
        }
      }
    }
  }
};

const DEFINITION_REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "reviews"],
  properties: {
    summary: { type: "string" },
    reviews: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "reason"],
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["keep", "refresh", "insufficient_evidence"] },
          def: { type: "string" },
          reason: { type: "string" }
        }
      }
    }
  }
};

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const here = path.dirname(fileURLToPath(import.meta.url));
  const configPath = args.config ? path.resolve(args.config) : path.resolve(here, "config.mjs");
  const configModule = await import(pathToFileURL(configPath).href);
  const config = configModule.default;

  await ensureParent(config.reportPath);
  await ensureParent(config.statePath);
  await ensureParent(config.patchJsonPath);
  await ensureParent(config.agentPatchPath);
  await ensureParent(config.longlistPath);
  await ensureParent(config.proposalsPath);
  await ensureParent(config.logPath);

  // Deterministic event log (spec §11). One logger per run; runId groups all
  // events of this invocation. Lifecycle events (run_start / run_end /
  // run_errored) bracket the work; action events are emitted from route()
  // below; api_call events wrap the two model calls.
  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });
  await logger.runStart({
    model: config.model,
    sourcesConfigured: (config.sources || []).length,
    extractPromptVersion: EXTRACT_PROMPT_VERSION,
    reviewPromptVersion: REVIEW_PROMPT_VERSION
  });

  try {
    await runMain(args, config, logger);
  } catch (err) {
    await logger.runErrored(err);
    throw err;
  }
}

async function runMain(args, config, logger) {

  const graph = await loadGraphData(config.graphDataPath);
  const state = await loadJson(config.statePath, structuredClone(DEFAULT_STATE));
  const patch = await loadJson(config.patchJsonPath, {
    meta: { generatedAt: null, sourceCount: 0, note: "Agent-managed overlay for AI Knowledge Graph maintenance." },
    nodes: [],
    definitionOverrides: []
  });
  const longlist = await loadJson(config.longlistPath, {
    meta: { generatedAt: null, entryCount: 0, note: "Lexi-managed Tier 2 longlist — terms under observation, awaiting evidence to support promotion to the graph (Tier 1)." },
    entries: []
  });
  const proposals = await loadJson(config.proposalsPath, {
    meta: { generatedAt: null, pendingCount: 0, appliedCount: 0, rejectedCount: 0, note: "Lexi proposals queue. Actions gated as PROPOSE by the permissions matrix land here as status: 'pending'." },
    proposals: []
  });
  const notes = await loadJson(config.notesForNicolePath, {
    meta: { generatedAt: null, unreadCount: 0, totalCount: 0, note: "Notes for Nicole — Lexi's manager channel (spec §6)." },
    entries: []
  });

  const mergedNodes = mergeNodes(graph.nodes, patch);
  const articles = await collectArticles(config, state, args);
  const report = {
    generatedAt: new Date().toISOString(),
    model: config.model,
    sourcesConfigured: (config.sources || []).length,
    articlesConsidered: articles.map(article => ({
      id: article.id,
      source: article.sourceLabel,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt
    })),
    harvestedTerms: [],
    definitionReviews: [],
    notes: []
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    report.notes.push("ANTHROPIC_API_KEY is not set. The agent fetched sources and updated state, but skipped model-powered harvesting and definition review.");
  }

  if (!articles.length) {
    report.notes.push("No new articles were available from the configured sources.");
  }

  // Helper bound to this run's context — routes a candidate action through the
  // permissions matrix and records an event in the deterministic log. Returns
  // true iff the caller should treat the action as applied (autonomous) or
  // proposed (queued for Nicole's review); false for NEVER / unknown actions
  // (default-deny per spec §5, also logged to report.notes for surfacing).
  const route = async (action, target, payload, reason, source, onAutonomous) => {
    const gate = resolveGate(action, config.phase);
    let outcome;
    let errorMessage = null;
    try {
      if (gate === GATES.AUTONOMOUS) {
        onAutonomous();
        outcome = "applied";
      } else if (gate === GATES.PROPOSE || gate === GATES.HUMAN_IN_LOOP) {
        proposals.proposals.push(buildProposal(action, target, payload, reason, source, report.generatedAt, gate));
        outcome = "proposed";
      } else {
        const denySubject = `Default-deny: action '${action}' for target ${target?.id ?? "(none)"}`;
        report.notes.push(`${denySubject} (gate=${gate ?? "unknown"}, phase=${config.phase}).`);
        notes.entries.push(buildNote({
          type: ENTRY_TYPES.DEFAULT_DENY,
          runId: logger.runId,
          phase: config.phase,
          writtenAt: report.generatedAt,
          subject: denySubject,
          details: `Gate resolved to '${gate ?? "unknown"}' under phase ${config.phase}; the action was not executed (per spec §5 default-deny clause).`,
          evidence: { action, target, payload, reason, source, gate: gate ?? null },
          suggestedAction: gate === GATES.NEVER
            ? "This action is permanently denied per the matrix. If the underlying need is legitimate, this likely indicates a bug in the routing code or a missing matrix entry."
            : "Either add this action to the permissions matrix in actions.mjs (with per-phase gates), or fix the calling code to use a known action."
        }));
        outcome = "dropped";
      }
    } catch (err) {
      outcome = "errored";
      errorMessage = err.message;
    }
    await logger.action({ action, source, gate, outcome, target, payload, reason, errorMessage });
    if (outcome === "errored") throw new Error(errorMessage);
    return outcome === "applied" || outcome === "proposed";
  };

  if (apiKey && articles.length) {
    const anthropic = new Anthropic({ apiKey });
    // Snapshot graph + longlist BEFORE the article loop so the prompt-cache prefix
    // stays byte-identical across per-article extract calls. The agent doesn't see
    // longlist entries created earlier in the same run; cross-article re-sightings
    // get reconciled by classifyCandidate against the live longlist below.
    const longlistSnapshot = [...longlist.entries];
    const extractContext = buildExtractContext(mergedNodes, longlistSnapshot, graph.clusters);
    // Snapshot the review-eligible set BEFORE the article loop so freshly-proposed
    // candidates aren't reviewed in the same run that proposed them.
    const reviewableNodes = [...mergedNodes];

    for (const article of articles) {
      const apiStart = Date.now();
      let analysis;
      try {
        analysis = await extractNewTerms(article, extractContext, config, anthropic);
        await logger.apiCall({
          call: "extract",
          promptVersion: EXTRACT_PROMPT_VERSION,
          inputs: { url: article.url, title: article.title, sourceLabel: article.sourceLabel },
          outputs: { candidatesCount: analysis.candidates?.length ?? 0, summary: analysis.summary },
          durationMs: Date.now() - apiStart,
          errored: false
        });
      } catch (err) {
        await logger.apiCall({
          call: "extract",
          promptVersion: EXTRACT_PROMPT_VERSION,
          inputs: { url: article.url, title: article.title, sourceLabel: article.sourceLabel },
          durationMs: Date.now() - apiStart,
          errored: true,
          errorMessage: err.message
        });
        throw err;
      }
      const harvest = {
        article: { title: article.title, url: article.url },
        summary: analysis.summary,
        longlistAdditions: [],
        longlistUpdates: [],
        rejections: [],
        proposalsQueued: []
      };
      report.harvestedTerms.push(harvest);

      for (const candidate of analysis.candidates || []) {
        const decision = classifyCandidate(candidate, mergedNodes, longlist.entries, graph.clusters);

        if (decision.action === ACTIONS.REJECT_CANDIDATE) {
          harvest.rejections.push({
            label: cleanText(candidate.label || ""),
            reason: decision.reason
          });
          continue;
        }

        if (decision.action === ACTIONS.INCREMENT_LONGLIST_SOURCE) {
          const entry = longlist.entries.find(e => e.id === decision.target);
          const newSource = buildSourceRef(article, report.generatedAt);
          await route(
            ACTIONS.INCREMENT_LONGLIST_SOURCE,
            { kind: "longlist_entry", id: entry.id },
            { source: newSource },
            `Article re-sighting of '${entry.label}' — adds source from ${article.sourceLabel}.`,
            "extract-flow",
            () => {
              const sourceAdded = mergeSourceIntoEntry(entry, newSource, report.generatedAt);
              harvest.longlistUpdates.push({
                id: entry.id,
                label: entry.label,
                sourceAdded,
                sourceCount: entry.sourceCount,
                independentSourceCount: entry.independentSourceCount
              });
            }
          );
          continue;
        }

        if (decision.action === ACTIONS.ADD_TO_LONGLIST) {
          const entry = buildLonglistEntry(decision.candidate, article, report.generatedAt, graph.clusters);
          const applied = await route(
            ACTIONS.ADD_TO_LONGLIST,
            { kind: "longlist_entry", id: entry.id },
            { entry },
            decision.candidate.reason || `Proposed from "${article.title}".`,
            "extract-flow",
            () => {
              longlist.entries.push(entry);
              harvest.longlistAdditions.push({ id: entry.id, label: entry.label });
            }
          );
          if (applied && resolveGate(ACTIONS.ADD_TO_LONGLIST, config.phase) === GATES.PROPOSE) {
            harvest.proposalsQueued.push({ action: ACTIONS.ADD_TO_LONGLIST, id: entry.id, label: entry.label });
          }
          // Spec §6 entry type 5 + §10: if the new longlist term touches a
          // contested cluster but its working def doesn't name the contestation,
          // flag it for Nicole BEFORE it accumulates evidence toward promotion.
          if (applied) {
            const contested = detectContestedOmission(entry.label, entry.fullName, entry.workingDef);
            if (contested) {
              notes.entries.push(buildNote({
                type: ENTRY_TYPES.CONTESTED_CLUSTER_OMISSION,
                runId: logger.runId,
                phase: config.phase,
                writtenAt: report.generatedAt,
                subject: `Contested cluster term added without naming the contestation: '${entry.label}'`,
                details: `The term '${entry.label}' matches the contested-cluster pattern '${contested.matchedTerm}' (per spec §10), but the working definition does not appear to acknowledge that the term is contested or that different camps use it differently. Per spec §6 entry type 5, this requires review before any move toward graph promotion.`,
                evidence: {
                  entryId: entry.id,
                  label: entry.label,
                  fullName: entry.fullName ?? null,
                  matchedContestedTerm: contested.matchedTerm,
                  workingDef: entry.workingDef,
                  sourceUrl: article.url,
                  sourceLabel: article.sourceLabel
                },
                suggestedAction: "Either revise the working definition to name the contestation (who uses it to mean what), or confirm this term doesn't warrant the contested treatment in this case."
              }));
            }
          }
          continue;
        }
      }
    }

    // Definition review runs against existing graph nodes. Refresh outputs are
    // routed through the permissions matrix — under the current matrix
    // (EDIT_GRAPH_DEF_SUBSTANTIVE = PROPOSE), they land in the proposals queue.
    const reviewTargets = pickNodesForReview(reviewableNodes, state, config.maxNodesToReviewPerRun);
    if (reviewTargets.length) {
      const reviewStart = Date.now();
      let reviewResult;
      try {
        reviewResult = await reviewDefinitions(reviewTargets, articles, config, anthropic);
        await logger.apiCall({
          call: "review",
          promptVersion: REVIEW_PROMPT_VERSION,
          inputs: { targetCount: reviewTargets.length, targetIds: reviewTargets.map(n => n.id), articleCount: articles.length },
          outputs: { reviewsCount: reviewResult.reviews?.length ?? 0, summary: reviewResult.summary },
          durationMs: Date.now() - reviewStart,
          errored: false
        });
      } catch (err) {
        await logger.apiCall({
          call: "review",
          promptVersion: REVIEW_PROMPT_VERSION,
          inputs: { targetCount: reviewTargets.length, targetIds: reviewTargets.map(n => n.id), articleCount: articles.length },
          durationMs: Date.now() - reviewStart,
          errored: true,
          errorMessage: err.message
        });
        throw err;
      }
      report.definitionReviews = reviewResult.reviews;
      for (const review of reviewResult.reviews) {
        state.nodeReviews[review.id] = {
          lastReviewedAt: report.generatedAt,
          status: review.status,
          reason: review.reason
        };
        if (review.status === "refresh" && review.def) {
          await route(
            ACTIONS.EDIT_GRAPH_DEF_SUBSTANTIVE,
            { kind: "graph_node", id: review.id },
            { def: cleanText(review.def), refs: nextRefsFromSources(articles) },
            review.reason,
            "definition-review",
            () => {
              // Matrix currently routes this to PROPOSE; this branch is a
              // forward-looking placeholder for when minor edits get autonomous
              // and the review pass distinguishes minor vs substantive.
              const target = mergedNodes.find(n => n.id === review.id);
              if (!target) return;
              const override = { id: review.id, def: cleanText(review.def), refs: nextRefsFromSources(articles) };
              patch.definitionOverrides = upsertById(patch.definitionOverrides || [], override);
              Object.assign(target, override);
            }
          );
        }
      }
      state.reviewCursor = (state.reviewCursor + reviewTargets.length) % Math.max(reviewableNodes.length, 1);
    }
  }

  for (const article of articles) {
    state.seenArticles[article.id] = {
      url: article.url,
      title: article.title,
      publishedAt: article.publishedAt,
      seenAt: report.generatedAt
    };
  }

  patch.meta = {
    generatedAt: report.generatedAt,
    sourceCount: articles.length,
    note: "Agent-managed overlay. Graph-affecting changes are routed through the permissions matrix (actions.mjs) — see proposals.json for pending items."
  };
  longlist.meta = {
    generatedAt: report.generatedAt,
    entryCount: longlist.entries.length,
    note: "Lexi-managed Tier 2 longlist — terms under observation, awaiting evidence to support promotion to the graph (Tier 1)."
  };
  proposals.meta = {
    generatedAt: report.generatedAt,
    pendingCount: proposals.proposals.filter(p => p.status === "pending").length,
    appliedCount: proposals.proposals.filter(p => p.status === "applied").length,
    rejectedCount: proposals.proposals.filter(p => p.status === "rejected").length,
    note: "Lexi proposals queue. Actions gated as PROPOSE land here as status: 'pending'. Edit a proposal's status to 'approved' or 'rejected' and run the apply step (TBD) to commit."
  };
  notes.meta = {
    generatedAt: report.generatedAt,
    unreadCount: notes.entries.filter(n => n.status === "unread").length,
    totalCount: notes.entries.length,
    note: "Notes for Nicole — Lexi's manager channel (spec §6). Mandatory entry types fire when their triggering condition is met; discretionary entries are observations Lexi thinks Nicole should see. Set status to 'read', 'actioned', or 'dismissed' as appropriate."
  };
  state.lastRunAt = report.generatedAt;

  await fs.writeFile(config.patchJsonPath, `${JSON.stringify(patch, null, 2)}\n`, "utf8");
  await fs.writeFile(config.agentPatchPath, `window.AGENT_GRAPH_PATCH = ${JSON.stringify(patch, null, 2)};\n`, "utf8");
  await fs.writeFile(config.longlistPath, `${JSON.stringify(longlist, null, 2)}\n`, "utf8");
  await fs.writeFile(config.proposalsPath, `${JSON.stringify(proposals, null, 2)}\n`, "utf8");
  await fs.writeFile(config.notesForNicolePath, `${JSON.stringify(notes, null, 2)}\n`, "utf8");
  await fs.writeFile(config.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await fs.writeFile(config.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const additions = report.harvestedTerms.reduce((sum, h) => sum + (h.longlistAdditions?.length || 0), 0);
  const updateAttempts = report.harvestedTerms.reduce((sum, h) => sum + (h.longlistUpdates?.length || 0), 0);
  const sourcesAdded = report.harvestedTerms.reduce((sum, h) => sum + (h.longlistUpdates?.filter(u => u.sourceAdded).length || 0), 0);
  const rejections = report.harvestedTerms.reduce((sum, h) => sum + (h.rejections?.length || 0), 0);
  const queuedThisRun = proposals.proposals.filter(p => p.proposedAt === report.generatedAt).length;
  const pendingTotal = proposals.meta.pendingCount;
  const notesUnread = notes.meta.unreadCount;
  const notesAddedThisRun = notes.entries.filter(n => n.writtenAt === report.generatedAt).length;
  console.log(`Processed ${articles.length} article(s) at Phase ${config.phase}.`);
  console.log(`Longlist: ${longlist.entries.length} entries total (${additions} added this run, ${sourcesAdded}/${updateAttempts} re-sightings landed as new sources, ${rejections} rejected).`);
  console.log(`Proposals queue: ${queuedThisRun} queued this run, ${pendingTotal} pending total (review at proposals.json).`);
  console.log(`Notes for Nicole: ${notesAddedThisRun} new this run, ${notesUnread} unread total (review at notes-for-nicole.json).`);

  await logger.runEnd({
    articlesProcessed: articles.length,
    longlistTotal: longlist.entries.length,
    longlistAddedThisRun: additions,
    sourcesAddedThisRun: sourcesAdded,
    sourceMergeAttempts: updateAttempts,
    rejectionsThisRun: rejections,
    proposalsQueuedThisRun: queuedThisRun,
    proposalsPendingTotal: pendingTotal,
    notesAddedThisRun,
    notesUnreadTotal: notesUnread
  });
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--config" && argv[i + 1]) {
      args.config = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function loadGraphData(filePath) {
  const code = await fs.readFile(filePath, "utf8");
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.__graph = { NODES, CL, GRAPH_META };`, context);
  return {
    nodes: JSON.parse(JSON.stringify(context.__graph.NODES)),
    clusters: JSON.parse(JSON.stringify(context.__graph.CL)),
    meta: JSON.parse(JSON.stringify(context.__graph.GRAPH_META))
  };
}

function mergeNodes(baseNodes, patch) {
  const nodes = baseNodes.map(node => ({ ...node }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  for (const override of patch.definitionOverrides || []) {
    const target = byId.get(override.id);
    if (!target) continue;
    const { id, ...rest } = override;
    Object.assign(target, rest);
  }
  for (const node of patch.nodes || []) {
    if (node?.id && !byId.has(node.id)) {
      const copy = { ...node };
      nodes.push(copy);
      byId.set(copy.id, copy);
    }
  }
  return nodes;
}

async function collectArticles(config, state) {
  const sourceBatches = [];
  for (const source of config.sources || []) {
    let items = [];
    if (source.type === "article") {
      items = [{ title: source.label || source.url, url: source.url, publishedAt: null, sourceLabel: source.label || hostnameFromUrl(source.url) }];
    } else if (source.type === "html_index") {
      items = await fetchIndexItems(source, config);
    } else {
      items = await fetchFeedItems(source, config);
    }
    sourceBatches.push(items);
  }

  const unseenBatches = sourceBatches.map(items => items
    .map(item => ({ ...item, id: fingerprint(item.url) }))
    .filter(item => !state.seenArticles[item.id])
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
  );
  const limited = roundRobinTake(unseenBatches, config.maxArticlesPerRun);
  const articles = [];
  for (const item of limited) {
    const article = await fetchArticle(item, config);
    if (article) articles.push(article);
  }
  return articles;
}

async function fetchFeedItems(source, config) {
  const xml = await fetchText(source.url, config);
  const items = [];
  const rssItems = matchBlocks(xml, "item");
  const atomItems = rssItems.length ? [] : matchBlocks(xml, "entry");
  const blocks = rssItems.length ? rssItems : atomItems;
  for (const block of blocks.slice(0, source.limit || config.maxArticlesPerRun)) {
    const title = decodeEntities(extractTag(block, "title") || source.label || source.url);
    const link = rssItems.length
      ? decodeEntities(extractTag(block, "link"))
      : extractAtomLink(block);
    if (!link) continue;
    const publishedAt = decodeEntities(
      extractTag(block, "pubDate") ||
      extractTag(block, "published") ||
      extractTag(block, "updated") ||
      ""
    );
    items.push({
      title,
      url: link.trim(),
      publishedAt: publishedAt || null,
      sourceLabel: source.label || hostnameFromUrl(link)
    });
  }
  return items;
}

async function fetchIndexItems(source, config) {
  const html = await fetchText(source.url, config);
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  const items = [];
  const includePatterns = (source.includeUrlPatterns || []).map(pattern => new RegExp(pattern, "i"));
  const excludePatterns = (source.excludeUrlPatterns || []).map(pattern => new RegExp(pattern, "i"));
  const sourceHost = hostnameFromUrl(source.url);

  for (const [, href, anchorHtml] of anchors) {
    let resolved;
    try {
      resolved = new URL(href, source.url).toString();
    } catch {
      continue;
    }
    if (source.sameHostOnly !== false && hostnameFromUrl(resolved) !== sourceHost) continue;
    if (includePatterns.length && !includePatterns.some(pattern => pattern.test(resolved))) continue;
    if (excludePatterns.some(pattern => pattern.test(resolved))) continue;
    if (seen.has(resolved)) continue;

    const title = collapseWhitespace(stripHtml(anchorHtml)) || titleFromUrl(resolved);
    if (!title) continue;
    seen.add(resolved);
    items.push({
      title,
      url: resolved,
      publishedAt: null,
      sourceLabel: source.label || sourceHost
    });
    if (items.length >= (source.limit || config.maxArticlesPerRun)) break;
  }

  return items;
}

async function fetchArticle(item, config) {
  try {
    const html = await fetchText(item.url, config);
    const title = decodeEntities(extractMetaContent(html, "property", "og:title") || extractTag(html, "title") || item.title || item.url);
    const excerpt = collapseWhitespace(stripHtml(html)).slice(0, 8000);
    if (!excerpt) return null;
    return {
      ...item,
      title,
      excerpt,
      host: hostnameFromUrl(item.url)
    };
  } catch (err) {
    return {
      ...item,
      title: item.title,
      excerpt: "",
      host: hostnameFromUrl(item.url),
      error: err.message
    };
  }
}

async function fetchText(url, config) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": config.userAgent, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

const EXTRACT_SYSTEM_PROMPT = [
  "You curate an AI terminology graph (Tier 1: canonical, promoted) and a longlist (Tier 2: terms under observation while evidence accumulates).",
  "",
  "For each article, identify terms worth tracking. Two kinds of candidate are valid:",
  "1. NEW terms — not in the graph and not on the longlist. These will be added to the longlist.",
  "2. RE-SIGHTINGS of longlist terms — if the article materially uses a term already on the longlist, propose it again under the same id and label as the longlist entry. The harness will record this article as an additional source on the existing entry, helping it accumulate evidence for promotion.",
  "",
  "Do NOT propose terms already in the graph (Tier 1) — they are already canonical.",
  "",
  "Prefer concepts, named systems, product categories, and framing terms with lasting relevance. Avoid generic vocabulary, marketing slogans, and unit names.",
  "",
  "Return JSON only."
].join("\n");

const REVIEW_SYSTEM_PROMPT = "You review AI knowledge graph definitions against fresh source material. Only recommend a rewritten definition when the sources clearly justify it. If the sources do not materially update a term, mark it keep or insufficient_evidence. Return JSON only.";

// Stable hashes recorded in every log entry the corresponding prompt produced.
// Update either prompt above and the version automatically rolls forward.
const EXTRACT_PROMPT_VERSION = promptVersion("extract", EXTRACT_SYSTEM_PROMPT);
const REVIEW_PROMPT_VERSION = promptVersion("review", REVIEW_SYSTEM_PROMPT);

function buildExtractContext(graphNodes, longlistEntries, clusters) {
  const graphTerms = graphNodes
    .map(node => `${node.id}: ${node.label}${node.fullName ? ` (${node.fullName})` : ""}`)
    .join("\n");
  const longlistTerms = longlistEntries
    .map(entry => `${entry.id}: ${entry.label}${entry.fullName ? ` (${entry.fullName})` : ""} [sources: ${entry.sourceCount}, independent: ${entry.independentSourceCount}]`)
    .join("\n");
  const clusterNames = Object.keys(clusters).join(", ");
  // The stable prefix sent on every per-article extract call. Keeping it
  // byte-identical lets Claude serve it from the prompt cache after the
  // first request (≥2048 tokens to actually cache on Sonnet 4.6).
  const stablePrefix = [
    `Available clusters: ${clusterNames}`,
    "",
    "Tier 1 graph terms (already canonical — do NOT propose these):",
    graphTerms || "(none)",
    "",
    "Tier 2 longlist (under observation — propose these only if the article materially uses them, so we can record an additional source):",
    longlistTerms || "(none)"
  ].join("\n");
  return { stablePrefix };
}

async function extractNewTerms(article, extractContext, config, client) {
  const perArticleBlock = [
    `Article title: ${article.title}`,
    `Article URL: ${article.url}`,
    `Article source: ${article.sourceLabel}`,
    "",
    "Article excerpt:",
    article.excerpt,
    "",
    `Return at most ${config.maxTermsPerArticle} candidates. For rels, only use existing node ids from the list above.`
  ].join("\n");

  return callStructuredOutput(client, {
    model: config.model,
    max_tokens: config.maxTokensPerCall,
    system: EXTRACT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: extractContext.stablePrefix, cache_control: { type: "ephemeral" } },
          { type: "text", text: perArticleBlock }
        ]
      }
    ],
    output_config: { format: { type: "json_schema", schema: NEW_TERM_SCHEMA } }
  });
}

async function reviewDefinitions(nodesToReview, articles, config, client) {
  const userText = [
    "Definitions under review:",
    JSON.stringify(nodesToReview.map(node => ({ id: node.id, label: node.label, def: node.def })), null, 2),
    "",
    "Fresh source excerpts:",
    JSON.stringify(articles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.sourceLabel,
      excerpt: article.excerpt.slice(0, 2500)
    })), null, 2)
  ].join("\n");

  return callStructuredOutput(client, {
    model: config.model,
    max_tokens: config.maxTokensPerCall,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
    output_config: { format: { type: "json_schema", schema: DEFINITION_REVIEW_SCHEMA } }
  });
}

async function callStructuredOutput(client, params) {
  const response = await client.messages.create(params);
  const textBlock = response.content.find(block => block.type === "text");
  if (!textBlock) {
    throw new Error(`Claude response contained no text block (stop_reason: ${response.stop_reason}).`);
  }
  return JSON.parse(textBlock.text);
}

// Classify a candidate proposal from the model and return the corresponding
// spec action (from actions.mjs ACTIONS) plus routing info. Three outcomes:
//   - REJECT_CANDIDATE: matches an existing graph (Tier 1) node, or invalid
//   - INCREMENT_LONGLIST_SOURCE: matches an existing longlist (Tier 2) entry
//   - ADD_TO_LONGLIST: new term, add to longlist with one source
function classifyCandidate(candidate, graphNodes, longlistEntries, clusters) {
  const label = cleanText(candidate.label);
  if (!label) return { action: ACTIONS.REJECT_CANDIDATE, reason: "empty label" };
  const labelKey = normalizeLabel(label);

  if (graphNodes.some(n => normalizeLabel(n.label) === labelKey || normalizeLabel(n.fullName || "") === labelKey)) {
    return { action: ACTIONS.REJECT_CANDIDATE, reason: "already in graph (label match)" };
  }

  const id = slugify(candidate.id || label);
  if (!id) return { action: ACTIONS.REJECT_CANDIDATE, reason: "could not generate id" };

  if (graphNodes.some(n => n.id === id)) {
    return { action: ACTIONS.REJECT_CANDIDATE, reason: "already in graph (id match)" };
  }

  const longlistMatch = longlistEntries.find(entry =>
    entry.id === id ||
    normalizeLabel(entry.label) === labelKey ||
    normalizeLabel(entry.fullName || "") === labelKey
  );

  const cleaned = {
    ...candidate,
    id,
    label,
    fullName: cleanText(candidate.fullName || ""),
    def: cleanText(candidate.def || ""),
    clusters: candidate.clusters || [],
    rels: candidate.rels || [],
    reason: cleanText(candidate.reason || "")
  };

  if (longlistMatch) {
    return { action: ACTIONS.INCREMENT_LONGLIST_SOURCE, target: longlistMatch.id, candidate: cleaned };
  }
  return { action: ACTIONS.ADD_TO_LONGLIST, candidate: cleaned };
}

// Build a proposal record for the proposals queue. The proposal id is stable
// per (action, target.id) within a single run — same action proposed twice in
// one run for the same target would dedupe; across runs, ids will differ via
// the timestamp seed so each proposal stands on its own.
function buildProposal(action, target, payload, reason, source, generatedAt, gate) {
  const id = crypto.createHash("sha1")
    .update(`${action}|${target?.kind ?? ""}|${target?.id ?? ""}|${generatedAt}`)
    .digest("hex").slice(0, 16);
  return {
    id,
    action,
    gate,
    proposedAt: generatedAt,
    status: "pending",
    source,
    target,
    payload,
    reason: reason || ""
  };
}

function buildSourceRef(article, observedAt) {
  return {
    url: article.url,
    domain: hostnameFromUrl(article.url),
    title: article.title,
    sourceLabel: article.sourceLabel,
    publishedAt: article.publishedAt,
    firstSeen: observedAt
  };
}

function buildLonglistEntry(candidate, article, observedAt, clusters) {
  const validClusters = [...new Set((candidate.clusters || []).filter(c => clusters[c]))];
  // Suggested rels are stored verbatim — they're only consulted at promotion time,
  // when targets can be re-validated against the graph that exists then.
  const rels = [...new Set((candidate.rels || []).map(r => slugify(r)).filter(Boolean))];
  const source = buildSourceRef(article, observedAt);
  const entry = {
    id: candidate.id,
    label: candidate.label,
    workingDef: candidate.def,
    clusters: validClusters.length ? validClusters : ["technical"],
    suggestedRels: rels,
    sources: [source],
    sourceCount: 1,
    independentSourceCount: 1,
    dateFirstSeen: observedAt,
    dateLastSeen: observedAt,
    sz: clampInt(candidate.sz, 14, 20, 16)
  };
  if (candidate.fullName && candidate.fullName !== candidate.label) {
    entry.fullName = candidate.fullName;
  }
  if (candidate.nodeType === "product" || candidate.nodeType === "initiative") {
    entry.nodeType = candidate.nodeType;
  }
  if (candidate.reason) {
    entry.proposalReason = candidate.reason;
  }
  return entry;
}

// Merge a new source into an existing longlist entry. Returns true if a new
// source was added (URL not already present); false if it was a duplicate URL.
// Updates dateLastSeen unconditionally; updates source counts only on add.
function mergeSourceIntoEntry(entry, newSource, observedAt) {
  entry.dateLastSeen = observedAt;
  if (entry.sources.some(s => s.url === newSource.url)) {
    return false;
  }
  entry.sources.push(newSource);
  entry.sourceCount = entry.sources.length;
  entry.independentSourceCount = new Set(entry.sources.map(s => s.domain)).size;
  return true;
}

function pickNodesForReview(nodes, state, limit) {
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const start = Math.max(0, Math.min(state.reviewCursor || 0, sorted.length));
  const selected = [];
  for (let offset = 0; offset < Math.min(limit, sorted.length); offset += 1) {
    selected.push(sorted[(start + offset) % sorted.length]);
  }
  return selected;
}

function upsertById(items, incoming) {
  const map = new Map((items || []).map(item => [item.id, item]));
  map.set(incoming.id, { ...(map.get(incoming.id) || {}), ...incoming });
  return [...map.values()];
}

function nextRefsFromSources(articles) {
  return articles.slice(0, 2).map((article, index) => ({
    n: index + 1,
    src: `${article.sourceLabel}${article.publishedAt ? `, ${article.publishedAt}` : ""}`,
    q: `${article.title} ${article.sourceLabel}`.trim()
  }));
}

function fingerprint(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function extractTag(text, tagName) {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i").exec(text);
  return match ? match[1] : "";
}

function extractAtomLink(entry) {
  const hrefMatch = /<link\b[^>]*href="([^"]+)"[^>]*>/i.exec(entry);
  return hrefMatch ? decodeEntities(hrefMatch[1]) : "";
}

function extractMetaContent(html, attribute, value) {
  const regex = new RegExp(`<meta\\b[^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const match = regex.exec(html);
  return match ? match[1] : "";
}

function matchBlocks(text, tagName) {
  return [...text.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"))].map(match => match[1]);
}

function stripHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function collapseWhitespace(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function cleanText(value) {
  return collapseWhitespace(String(value || ""));
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/^<!\[CDATA\[(.*)\]\]>$/s, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeLabel(value) {
  return cleanText(value).toLowerCase();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function clampInt(value, min, max, fallback) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function titleFromUrl(value) {
  try {
    const segment = new URL(value).pathname.split("/").filter(Boolean).at(-1) || "";
    return segment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  } catch {
    return value;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roundRobinTake(batches, limit) {
  const queues = batches.map(batch => [...batch]);
  const selected = [];
  while (selected.length < limit) {
    let advanced = false;
    for (const queue of queues) {
      if (!queue.length || selected.length >= limit) continue;
      selected.push(queue.shift());
      advanced = true;
    }
    if (!advanced) break;
  }
  return selected.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
}
