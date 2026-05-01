// Lexi run entry point. Orchestrates one extraction + review pass:
//   1. Load state, graph, longlist, proposals, notes
//   2. Check spec §12 forcing functions (pause if needed)
//   3. Fetch articles → call Claude (extract + review) → route via permissions
//   4. Persist all updated state files + emit deterministic log + Slack ping
//
// Pure orchestration; the actual logic lives in the extracted modules below.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

import { ACTIONS, GATES, resolveGate } from "./actions.mjs";
import { createLogger } from "./logger.mjs";
import { ENTRY_TYPES, buildNote, detectContestedOmission } from "./notes.mjs";
import { detectGlobalPauseReasons, checkThroughputCap } from "./forcing-functions.mjs";
import { createNotifier } from "./notify.mjs";

import { cleanText } from "./text-utils.mjs";
import { ensureParent, loadJson, loadGraphData, mergeNodes, writeJson } from "./state-io.mjs";
import { collectArticles } from "./article-fetch.mjs";
import { buildExtractContext, extractNewTerms, reviewDefinitions } from "./claude-calls.mjs";
import { EXTRACT_PROMPT_VERSION, REVIEW_PROMPT_VERSION } from "./prompts.mjs";
import {
  buildLonglistEntry,
  buildProposal,
  buildSourceRef,
  classifyCandidate,
  mergeSourceIntoEntry,
  nextRefsFromSources,
  pickNodesForReview,
  upsertById
} from "./longlist-flow.mjs";

const DEFAULT_STATE = {
  lastRunAt: null,
  reviewCursor: 0,
  seenArticles: {},
  nodeReviews: {}
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
  const mustReads = await loadJson(config.mustReadsPath, {
    meta: { generatedAt: null, unreadCount: 0, totalCount: 0, note: "Lexi's must-reads — articles she flags as worth Nicole reading in full." },
    entries: []
  });

  const mergedNodes = mergeNodes(graph.nodes, patch);

  // Spec §12 forcing functions. Detect global pause conditions BEFORE doing
  // anything expensive (fetching articles, calling Claude). If paused, the run
  // becomes a no-op for publication: state, longlist, and proposals are not
  // mutated; Lexi writes a RUN_PAUSED note and exits cleanly. The cause must
  // be cleared (Notes read/actioned, manager-absent disabled) before the next
  // run will resume normal operation.
  const pauseReasons = detectGlobalPauseReasons(notes, config);
  const paused = pauseReasons.length > 0;

  const articles = paused ? [] : await collectArticles(config, state, args);
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

  // If pause conditions are active, surface them in the report and emit a
  // single RUN_PAUSED note so the cause is visible when Nicole next checks
  // Notes for Nicole. The actual pause is implemented above (articles=[]),
  // which causes the candidate-processing block below to be a no-op.
  if (paused) {
    const summary = pauseReasons.map(r => r.type).join(", ");
    report.notes.push(`Run paused (${summary}). No articles fetched, no candidates routed, no proposals queued.`);
    notes.entries.push(buildNote({
      type: ENTRY_TYPES.RUN_PAUSED,
      runId: logger.runId,
      phase: config.phase,
      writtenAt: report.generatedAt,
      subject: `Lexi run paused: ${summary}`,
      details: pauseReasons.map(r => r.details).join(" "),
      evidence: { pauseReasons },
      suggestedAction: pauseReasons.some(r => r.type === "unread_notes_over_7d")
        ? "Read or action the pending notes in notes-for-nicole.json (set status to 'read', 'actioned', or 'dismissed'). Once no unread notes are older than 7 days, the next run will resume normally."
        : "Disable manager-absent mode (unset LEXI_MANAGER_ABSENT or set config.managerAbsent to false) to resume normal operation."
    }));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !paused) {
    report.notes.push("ANTHROPIC_API_KEY is not set. The agent fetched sources and updated state, but skipped model-powered harvesting and definition review.");
  }

  if (!articles.length && !paused) {
    report.notes.push("No new articles were available from the configured sources.");
  }

  // Helper bound to this run's context — routes a candidate action through the
  // permissions matrix and records an event in the deterministic log. Returns
  // true iff the caller should treat the action as applied (autonomous) or
  // proposed (queued for Nicole's review); false for NEVER / unknown actions
  // (default-deny per spec §5, also logged to report.notes for surfacing).
  const route = async (action, target, payload, reason, source, onAutonomous) => {
    const gate = resolveGate(action, config.phase);

    // Spec §12.4: throughput cap suppression. Per-action — only the action
    // that would tip a counter past its cap is dropped; other actions still
    // process. A THROUGHPUT_CAP_HIT note is written so Nicole sees what
    // didn't happen.
    const capHit = checkThroughputCap(action, longlist, proposals, gate, config.throughputCaps);
    if (capHit) {
      notes.entries.push(buildNote({
        type: ENTRY_TYPES.THROUGHPUT_CAP_HIT,
        runId: logger.runId,
        phase: config.phase,
        writtenAt: report.generatedAt,
        subject: `Throughput cap hit: ${capHit.cap} (limit ${capHit.limit}, current ${capHit.current})`,
        details: capHit.details,
        evidence: { action, target, gate, ...capHit, suppressedReason: reason, source },
        suggestedAction: capHit.cap === "longlistAdditionsPer7d"
          ? "Either accept the throttle (Lexi slows down for the week) or raise config.throughputCaps.longlistAdditionsPer7d if the cadence has materially shifted."
          : "Approve or reject the oldest pending proposals so Lexi can resume queueing new ones."
      }));
      await logger.action({
        action, source, gate,
        outcome: "suppressed_by_cap",
        target, payload, reason,
        errorMessage: capHit.details
      });
      return false;
    }

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

      // Must-read flagging — Lexi's editorial channel. If she set
      // `analysis.mustRead` on this article, queue it for Nicole's reading list.
      // Dedup by article URL: re-fetching the same article on a later run
      // (e.g., feed jitter) won't re-add it. Skip if already on the list.
      if (analysis.mustRead && !mustReads.entries.some(e => e.url === article.url)) {
        const novelTermCount = harvest.longlistAdditions.length;
        const flagged = {
          id: article.id,
          title: article.title,
          url: article.url,
          source: article.sourceLabel,
          publishedAt: article.publishedAt,
          summary: cleanText(analysis.summary || ""),
          priority: analysis.mustRead.priority,
          reason: cleanText(analysis.mustRead.reason || ""),
          novelTermsInArticle: novelTermCount,
          flaggedAt: report.generatedAt,
          status: "unread"
        };
        await route(
          ACTIONS.FLAG_MUST_READ,
          { kind: "article", id: article.id },
          { flagged },
          `Lexi flagged "${article.title}" as a must-read (priority ${flagged.priority}).`,
          "extract-flow",
          () => {
            mustReads.entries.push(flagged);
            harvest.mustReadFlagged = { priority: flagged.priority, reason: flagged.reason };
          }
        );
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
  mustReads.meta = {
    generatedAt: report.generatedAt,
    unreadCount: mustReads.entries.filter(e => e.status === "unread").length,
    totalCount: mustReads.entries.length,
    note: "Lexi's must-reads — articles she flags as worth Nicole reading in full. Editorial signal, not news feed. Set status to 'read' or 'dismissed' via mark-must-reads.mjs."
  };
  state.lastRunAt = report.generatedAt;

  await writeJson(config.patchJsonPath, patch);
  await fs.writeFile(config.agentPatchPath, `window.AGENT_GRAPH_PATCH = ${JSON.stringify(patch, null, 2)};\n`, "utf8");
  await writeJson(config.longlistPath, longlist);
  await writeJson(config.proposalsPath, proposals);
  await writeJson(config.notesForNicolePath, notes);
  await writeJson(config.mustReadsPath, mustReads);
  await writeJson(config.statePath, state);
  await writeJson(config.reportPath, report);

  const additions = report.harvestedTerms.reduce((sum, h) => sum + (h.longlistAdditions?.length || 0), 0);
  const updateAttempts = report.harvestedTerms.reduce((sum, h) => sum + (h.longlistUpdates?.length || 0), 0);
  const sourcesAdded = report.harvestedTerms.reduce((sum, h) => sum + (h.longlistUpdates?.filter(u => u.sourceAdded).length || 0), 0);
  const rejections = report.harvestedTerms.reduce((sum, h) => sum + (h.rejections?.length || 0), 0);
  const queuedThisRun = proposals.proposals.filter(p => p.proposedAt === report.generatedAt).length;
  const pendingTotal = proposals.meta.pendingCount;
  const notesUnread = notes.meta.unreadCount;
  const notesAddedThisRun = notes.entries.filter(n => n.writtenAt === report.generatedAt).length;
  const mustReadsUnread = mustReads.meta.unreadCount;
  const mustReadsAddedThisRun = mustReads.entries.filter(e => e.flaggedAt === report.generatedAt).length;
  if (paused) {
    console.log(`Run PAUSED at Phase ${config.phase}: ${pauseReasons.map(r => r.type).join(", ")}.`);
    console.log(`No work performed. See notes-for-nicole.json for the pause-context note + clear the cause to resume.`);
  } else {
    console.log(`Processed ${articles.length} article(s) at Phase ${config.phase}.`);
    console.log(`Longlist: ${longlist.entries.length} entries total (${additions} added this run, ${sourcesAdded}/${updateAttempts} re-sightings landed as new sources, ${rejections} rejected).`);
    console.log(`Proposals queue: ${queuedThisRun} queued this run, ${pendingTotal} pending total (review at proposals.json).`);
  }
  console.log(`Notes for Nicole: ${notesAddedThisRun} new this run, ${notesUnread} unread total (review at notes-for-nicole.json).`);
  console.log(`Must-reads: ${mustReadsAddedThisRun} new this run, ${mustReadsUnread} unread total (review at must-reads.json).`);

  await logger.runEnd({
    paused,
    pauseReasons: paused ? pauseReasons : undefined,
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

  // Slack notification (optional — no-ops if LEXI_SLACK_WEBHOOK is unset).
  // Quiet by design: only fires when there's news (new notes OR a pause).
  const notifier = createNotifier({ webhookUrl: process.env.LEXI_SLACK_WEBHOOK });
  if (notifier.enabled) {
    const dateStr = report.generatedAt.slice(0, 16).replace("T", " ") + " UTC";
    await notifier.sendRunSummary({
      runId: logger.runId,
      runLabel: `Lexi run · ${dateStr}`,
      notes,
      longlist,
      proposals,
      paused,
      pauseReasons,
      dashboardUrl: "https://ai-terminology.com/manager/"
    });
  }
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
