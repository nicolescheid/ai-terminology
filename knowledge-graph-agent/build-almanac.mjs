// Almanac data generator.
//
// Reads the canonical state files + the current graph and writes:
//   - /almanac/metrics.json    — current snapshot, regenerated each run
//   - /almanac/history.jsonl   — append-only, one line per run (time series)
//
// Deliberately does NOT read the deterministic event log. The log is
// operational forensics (gitignored, grows per run). The Almanac reads
// only the canonical, committed state — same boundary the public page
// will sit behind. All time-bucketed metrics ("this week" etc.) are
// derived from per-entry timestamps already in the state files
// (dateFirstSeen, proposedAt, appliedAt, writtenAt, seenAt).
//
// The /almanac/ page is a static HTML that fetches these JSON files and
// renders them client-side. Zero backend.
//
// Run with: node build-almanac.mjs
//
// Designed to be re-runnable: metrics.json is fully derived from inputs, so
// running twice produces the same output (modulo `generatedAt`). history.jsonl
// is append-only but dedup-checked: if today's snapshot is identical to the
// last appended line (modulo timestamp), we skip the append. This keeps it
// safe to run from multiple workflow steps.

import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ACTIONS } from "./actions.mjs";
import { loadJson, loadGraphData, mergeNodes, ensureParent, writeJson } from "./state-io.mjs";
import { hostnameFromUrl } from "./text-utils.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  // Output paths — public-facing, served as static JSON to /almanac/.
  const repoRoot = path.resolve(here, "..");
  const metricsPath = path.resolve(repoRoot, "almanac/metrics.json");
  const historyPath = path.resolve(repoRoot, "almanac/history.jsonl");
  await ensureParent(metricsPath);

  // Inputs
  const graph = await loadGraphData(config.graphDataPath);
  const patch = await loadJson(config.patchJsonPath, { nodes: [], definitionOverrides: [] });
  const longlist = await loadJson(config.longlistPath, { entries: [] });
  const proposals = await loadJson(config.proposalsPath, { proposals: [] });
  const notes = await loadJson(config.notesForNicolePath, { entries: [] });
  const state = await loadJson(config.statePath, { seenArticles: {}, lastRunAt: null });

  const now = new Date();
  const mergedNodes = mergeNodes(graph.nodes, patch);
  const baseGraphSize = graph.nodes.length;

  const metrics = computeMetrics({
    longlist,
    proposals,
    notes,
    state,
    baseGraphSize,
    mergedNodes,
    clusters: graph.clusters,
    phase: config.phase,
    now
  });
  await writeJson(metricsPath, metrics);

  const snapshot = computeHistorySnapshot({ metrics, now });
  await appendHistoryIfChanged(historyPath, snapshot);

  console.log(`Almanac metrics written: ${metricsPath}`);
  console.log(`  Articles read: ${metrics.headline.articlesRead}`);
  console.log(`  Days running: ${metrics.headline.daysRunning}`);
  console.log(`  Longlist size: ${metrics.headline.longlistSize}`);
  console.log(`  Graph size: ${metrics.headline.graphSize} (base ${baseGraphSize} + overlay ${metrics.headline.graphSize - baseGraphSize})`);
  console.log(`  This week: ${metrics.thisWeek.articlesFetched} articles, ${metrics.thisWeek.longlistAdded} new terms, ${metrics.thisWeek.promotionsToGraph} promotions`);
  console.log(`  Almost-there list: ${metrics.almostThere.length} entries`);
  console.log(`  History snapshot: ${snapshot.date} (longlist=${snapshot.longlistSize}, graph=${snapshot.graphSize})`);
}

// Parse a timestamp safely; return ms-since-epoch or NaN.
function parseMs(ts) {
  if (!ts) return NaN;
  const t = new Date(ts).getTime();
  return Number.isFinite(t) ? t : NaN;
}

export function computeMetrics({ longlist, proposals, notes, state, baseGraphSize, mergedNodes, clusters, phase, now }) {
  const nowMs = now.getTime();
  const lastWeekStart = nowMs - WEEK_MS;
  const ninetyDaysAgo = nowMs - 90 * DAY_MS;
  const thirtyDaysAgo = nowMs - 30 * DAY_MS;

  const longlistEntries = longlist.entries || [];
  // "Currently watching" — entries the agent is still tracking in Tier 2.
  // Entries marked status: "promoted" by apply-proposals.mjs are kept in
  // the file (audit trail) but should be excluded from "currently observing"
  // metrics (longlistSize, almostThere, cluster counts). Time-window
  // metrics that count past activity (e.g. longlistAdded over the past 7d)
  // still iterate longlistEntries — a term that was added then promoted
  // is still a real "addition" for the throughput record.
  const watchingEntries = longlistEntries.filter(e => e.status !== "promoted");
  const allProposals = proposals.proposals || [];
  const allNotes = notes.entries || [];
  const seenArticles = Object.values(state.seenArticles || {});

  // ─── Time bounds ────────────────────────────────────────────────────
  // Earliest article observed = good proxy for "when Lexi started watching."
  // Falls back to state.lastRunAt or "now" so the math is always safe.
  const earliestArticleMs = seenArticles.reduce((m, a) => {
    const t = parseMs(a.seenAt);
    return Number.isFinite(t) && (m === null || t < m) ? t : m;
  }, null);
  const firstRunAt = earliestArticleMs
    ? new Date(earliestArticleMs).toISOString()
    : (state.lastRunAt || now.toISOString());
  const daysRunning = Math.max(1, Math.ceil((nowMs - new Date(firstRunAt).getTime()) / DAY_MS));

  // ─── Headline counts ────────────────────────────────────────────────
  const articlesRead = seenArticles.length;
  const longlistSize = watchingEntries.length;
  const graphSize = mergedNodes.length;

  // ─── This week ──────────────────────────────────────────────────────
  // All deltas derived from per-entry timestamps in canonical state files.
  const articlesFetched = seenArticles.filter(a => parseMs(a.seenAt) >= lastWeekStart).length;
  const longlistAdded = longlistEntries.filter(e => parseMs(e.dateFirstSeen) >= lastWeekStart).length;
  // Re-sightings in the last 7d: entries whose dateLastSeen moved into the
  // window even though dateFirstSeen is older. (New-this-week entries are
  // counted under longlistAdded, not here.)
  const sourcesAdded = longlistEntries.filter(e => {
    const last = parseMs(e.dateLastSeen);
    const first = parseMs(e.dateFirstSeen);
    return last >= lastWeekStart && first < lastWeekStart;
  }).length;
  const promotionsToGraph = allProposals.filter(p =>
    p.action === ACTIONS.PROMOTE_TO_GRAPH &&
    p.status === "applied" &&
    parseMs(p.appliedAt) >= lastWeekStart
  ).length;
  const proposalsQueued = allProposals.filter(p => parseMs(p.proposedAt) >= lastWeekStart).length;
  const auditFlags = allNotes.filter(n =>
    n.source === "auditor" && parseMs(n.writtenAt) >= lastWeekStart
  ).length;
  const notesAdded = allNotes.filter(n => parseMs(n.writtenAt) >= lastWeekStart).length;

  // ─── Almost-there list ──────────────────────────────────────────────
  // Distance to spec §7 credibility bar: 4 checks. Closer = fewer failed checks.
  // Tie-break by independentSourceCount (more = better) then sourceCount.
  // Operates on watchingEntries — promoted terms are no longer "almost there,"
  // they're there. The proposals-lookup filter below is now defensive
  // belt-and-braces (catches pending/approved proposals where the longlist
  // status flip hasn't happened yet).
  const almostThere = watchingEntries.map(e => {
    const sources = e.sources || [];
    const sourceCount = e.sourceCount ?? sources.length;
    const independent = e.independentSourceCount ?? new Set(sources.map(s => s.domain).filter(Boolean)).size;
    const firstSeenMs = e.dateFirstSeen ? new Date(e.dateFirstSeen).getTime() : NaN;
    const ageDays = Number.isFinite(firstSeenMs) ? Math.floor((nowMs - firstSeenMs) / DAY_MS) : 0;
    const hasRecent = sources.some(s => {
      const t = s.firstSeen ? new Date(s.firstSeen).getTime() : NaN;
      return Number.isFinite(t) && t >= ninetyDaysAgo;
    });

    const gaps = [];
    if (sourceCount < 2) gaps.push(`needs ${2 - sourceCount} more source${2 - sourceCount > 1 ? "s" : ""}`);
    if (independent < 2) gaps.push(`needs ${2 - independent} more independent source${2 - independent > 1 ? "s" : ""}`);
    if (!hasRecent && sources.length) gaps.push("no source seen in past 90d");
    if (ageDays < 3) gaps.push(`${3 - ageDays} more day${3 - ageDays !== 1 ? "s" : ""} on longlist`);

    const domains = [...new Set(sources.map(s => s.domain).filter(Boolean))].slice(0, 4);

    return {
      id: e.id,
      label: e.label,
      fullName: e.fullName || null,
      clusters: e.clusters || [],
      sourceCount,
      independentSources: independent,
      daysOnLonglist: ageDays,
      domains,
      gapCount: gaps.length,
      gap: gaps.length ? gaps.join("; ") : "meets credibility bar"
    };
  })
  // Don't surface entries that already have a pending or applied PROMOTE_TO_GRAPH
  // proposal — they're past "almost there."
  .filter(e => {
    const promoted = allProposals.some(p =>
      p.action === ACTIONS.PROMOTE_TO_GRAPH &&
      p.target?.id === e.id &&
      (p.status === "pending" || p.status === "approved" || p.status === "applied")
    );
    return !promoted;
  })
  .sort((a, b) => a.gapCount - b.gapCount
    || b.independentSources - a.independentSources
    || b.sourceCount - a.sourceCount
    || b.daysOnLonglist - a.daysOnLonglist)
  .slice(0, 10);

  // ─── Source ecosystem ───────────────────────────────────────────────
  // By-domain article counts come from state.seenArticles (every article
  // Lexi has ever fetched), not just longlist sources, so quiet sources
  // that yielded no terms still show up.
  const articleDomains = new Map();
  const firstSeenByDomain = new Map();
  for (const a of Object.values(state.seenArticles || {})) {
    const host = hostnameFromUrl(a.url || "");
    if (!host || host === a.url) continue;
    articleDomains.set(host, (articleDomains.get(host) || 0) + 1);
    const seenAtMs = parseMs(a.seenAt);
    if (Number.isFinite(seenAtMs)) {
      const existing = firstSeenByDomain.get(host);
      if (existing === undefined || seenAtMs < existing) firstSeenByDomain.set(host, seenAtMs);
    }
  }
  const byDomain = [...articleDomains.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
  const totalUniqueDomains = byDomain.length;
  const newDomainsLast30d = [...firstSeenByDomain.entries()]
    .filter(([, ms]) => ms >= thirtyDaysAgo)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, ms]) => ({ domain, firstSeen: new Date(ms).toISOString() }));

  // ─── Cluster distribution ───────────────────────────────────────────
  // Counts each cluster's appearances on currently-watched longlist entries.
  // Promoted terms now live on the graph — counting them here would
  // double-count (they show up under graph cluster distribution elsewhere).
  const clusterCounts = {};
  for (const e of watchingEntries) {
    for (const c of (e.clusters || [])) {
      clusterCounts[c] = (clusterCounts[c] || 0) + 1;
    }
  }
  const clustersOrdered = Object.entries(clusterCounts)
    .map(([id, count]) => ({
      id,
      label: clusters?.[id]?.label || id,
      hex: clusters?.[id]?.hex || null,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Full cluster palette (every cluster known to the graph, not just those
  // that have appeared on the longlist). Used by /lexis-list/ and any
  // future page that needs to render arbitrary cluster ids — must-reads
  // can carry clusters that have zero longlist entries.
  const clusterPalette = Object.entries(clusters || {}).map(([id, c]) => ({
    id,
    label: c?.label || id,
    hex: c?.hex || null
  }));

  // ─── Velocity: agentic vs human-gated ───────────────────────────────
  // Derived from proposals: anything with status=applied that came in via
  // a PROPOSE/HUMAN_IN_LOOP gate counts as human-gated. Autonomous gate is
  // counted separately. As Phase 2+ enables more autonomous actions, the
  // autonomous bar will grow.
  const appliedProposals = allProposals.filter(p => p.status === "applied");
  const humanGated = appliedProposals.filter(p => p.gate !== "autonomous").length;
  const agentic = appliedProposals.filter(p => p.gate === "autonomous").length;

  // ─── Manager (Nicole) interaction ───────────────────────────────────
  const proposalsByStatus = {
    pending: allProposals.filter(p => p.status === "pending").length,
    approved: allProposals.filter(p => p.status === "approved").length,
    applied: allProposals.filter(p => p.status === "applied").length,
    rejected: allProposals.filter(p => p.status === "rejected").length
  };
  // Approve/reject ratio per cluster, calculated only over decided proposals.
  const decidedProposals = allProposals.filter(p =>
    p.status === "applied" || p.status === "approved" || p.status === "rejected");
  const decisionsByCluster = {};
  for (const p of decidedProposals) {
    const targetId = p.target?.id;
    const entry = longlistEntries.find(e => e.id === targetId);
    const cs = entry?.clusters || (p.payload?.entry?.clusters) || [];
    const decided = (p.status === "applied" || p.status === "approved") ? "approved" : "rejected";
    for (const c of cs) {
      decisionsByCluster[c] = decisionsByCluster[c] || { approved: 0, rejected: 0 };
      decisionsByCluster[c][decided] += 1;
    }
  }

  // ─── Audit flags ────────────────────────────────────────────────────
  // Auditor-sourced notes carry source: "auditor" and a type matching the
  // ENTRY_TYPES vocabulary. Tally by type for the public surface.
  const auditNotes = allNotes.filter(n => n.source === "auditor");
  const auditFlagsByType = {};
  for (const n of auditNotes) {
    const t = n.type || "unknown";
    auditFlagsByType[t] = (auditFlagsByType[t] || 0) + 1;
  }
  const auditFlagsTotal = auditNotes.length;

  // ─── Costs ──────────────────────────────────────────────────────────
  // Token usage isn't currently captured on the canonical state side
  // (lives only in the deterministic log, which we're not reading here by
  // design). Will fill in once we extend claude-calls.mjs to also persist
  // a small running cost counter into a committed state file.
  const costs = {
    available: false,
    note: "Token + cost data lands in a follow-up; the runtime captures it but doesn't yet persist a public summary."
  };

  return {
    generatedAt: now.toISOString(),
    firstRunAt,
    phase,
    headline: {
      articlesRead,
      daysRunning,
      longlistSize,
      graphSize
    },
    thisWeek: {
      articlesFetched,
      longlistAdded,
      sourcesAdded,
      promotionsToGraph,
      proposalsQueued,
      auditFlags,
      notesAdded
    },
    almostThere,
    sources: {
      byDomain: byDomain.slice(0, 25),
      totalUniqueDomains,
      newDomainsLast30d
    },
    clusters: {
      palette: clusterPalette,
      distribution: clustersOrdered
    },
    velocity: {
      humanGated,
      autonomous: agentic,
      note: agentic === 0
        ? "All graph promotions and substantive edits are currently human-gated. Lexi proposes; Nicole approves."
        : null
    },
    proposalsByStatus,
    decisionsByCluster,
    audit: {
      flagsTotal: auditFlagsTotal,
      flagsByType: auditFlagsByType
    },
    costs
  };
}

export function computeHistorySnapshot({ metrics, now }) {
  // One line per generation. The page reads this as an append-only ledger
  // of "where Lexi was on day X" — the headline curves come from here.
  return {
    ts: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    articlesRead: metrics.headline.articlesRead,
    longlistSize: metrics.headline.longlistSize,
    graphSize: metrics.headline.graphSize,
    proposalsPending: metrics.proposalsByStatus.pending,
    auditFlagsTotal: metrics.audit.flagsTotal
  };
}

// Append a snapshot line if and only if it differs (in non-ts fields) from
// the most recent line. Keeps the file from growing on no-op re-runs and
// makes the history a clean per-change record rather than per-invocation.
async function appendHistoryIfChanged(historyPath, snapshot) {
  const fields = ["articlesRead", "longlistSize", "graphSize", "proposalsPending", "auditFlagsTotal"];
  let last = null;
  try {
    const raw = await fs.readFile(historyPath, "utf8");
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    if (lines.length) {
      try { last = JSON.parse(lines[lines.length - 1]); } catch { /* corrupt last line — treat as new */ }
    }
  } catch { /* no history yet */ }

  if (last) {
    const same = fields.every(k => last[k] === snapshot[k]);
    if (same) return; // nothing changed since last snapshot
  }

  await fs.appendFile(historyPath, JSON.stringify(snapshot) + "\n", "utf8");
}
