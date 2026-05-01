// Promotion eligibility scanner.
//
// Scans the longlist for terms that meet spec §7's credibility bar and
// writes a PROMOTE_TO_GRAPH proposal for each eligible term. The proposals
// land in proposals.json with status: "pending" — Nicole reviews them in
// her dashboard / JSON file and sets status to "approved" or "rejected".
// The apply-proposals.mjs script then commits approvals into the agent-
// managed overlay (agent-patch.json + graph-data-agent.js).
//
// Eligibility heuristic (this script — pure data, no LLM calls):
//   1. Source count ≥ 2
//   2. Independent source count ≥ 2 (different domain)
//   3. At least one source seen in past 90 days
//   4. Time on longlist ≥ 14 days
//
// Skipped here, deferred to follow-up sessions:
//   5. Definition consistency across sources (would need an LLM check)
//   6. Source pattern check (the auditor already runs this independently)
//   7. Concept reality check ("does this name a concept the graph doesn't
//      already have, or is it just a marketing variant of an existing
//      term?" — semantic, would need an LLM)
//   8. Trusted-source weighting (no trusted list yet)
//
// Dedup: each proposal's id is sha-1 of "promote_to_graph:{entry.id}". If
// a proposal with that id already exists in proposals.json (any status),
// it's not re-created. To re-propose a rejected term, manually delete or
// rename its proposal and re-run.
//
// Run with: node promote.mjs

import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS, GATES } from "./actions.mjs";
import { createLogger } from "./logger.mjs";
import { createNotifier } from "./notify.mjs";
import { loadJson, writeJson } from "./state-io.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  const longlist = await loadJson(config.longlistPath, { entries: [] });
  const proposals = await loadJson(config.proposalsPath, { meta: {}, proposals: [] });

  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });

  await logger.event("promote_scan_start", {
    longlistEntries: (longlist.entries || []).length,
    existingProposals: (proposals.proposals || []).length
  });

  const existingIds = new Set(proposals.proposals.map(p => p.id));
  const writtenAt = new Date().toISOString();
  const newProposals = [];
  const skippedNotEligible = [];
  const skippedAlreadyProposed = [];

  for (const entry of longlist.entries || []) {
    const verdict = checkEligibility(entry);
    if (!verdict.eligible) {
      skippedNotEligible.push({ id: entry.id, why: verdict.why });
      continue;
    }
    const id = crypto.createHash("sha1")
      .update(`${ACTIONS.PROMOTE_TO_GRAPH}:${entry.id}`)
      .digest("hex").slice(0, 16);
    if (existingIds.has(id)) {
      skippedAlreadyProposed.push({ id: entry.id, proposalId: id });
      continue;
    }
    const proposal = buildPromotionProposal({ id, entry, verdict, writtenAt, runId });
    proposals.proposals.push(proposal);
    newProposals.push(proposal);
    await logger.event("promote_proposal_written", {
      entryId: entry.id,
      proposalId: id,
      reason: verdict.reason
    });
  }

  // Update proposals meta
  proposals.meta = {
    generatedAt: writtenAt,
    pendingCount: proposals.proposals.filter(p => p.status === "pending").length,
    appliedCount: proposals.proposals.filter(p => p.status === "applied").length,
    rejectedCount: proposals.proposals.filter(p => p.status === "rejected").length,
    note: proposals.meta?.note ?? "Lexi proposals queue. Actions gated as PROPOSE land here as status: 'pending'. Edit a proposal's status to 'approved' or 'rejected', then run apply-proposals.mjs to commit."
  };

  await writeJson(config.proposalsPath, proposals);

  await logger.event("promote_scan_end", {
    proposalsWritten: newProposals.length,
    skippedAlreadyProposed: skippedAlreadyProposed.length,
    skippedNotEligible: skippedNotEligible.length
  });

  console.log(`Eligibility scan complete.`);
  console.log(`  Longlist entries: ${(longlist.entries || []).length}`);
  console.log(`  Eligible (new proposals written): ${newProposals.length}`);
  console.log(`  Eligible but already proposed: ${skippedAlreadyProposed.length}`);
  console.log(`  Not yet eligible: ${skippedNotEligible.length}`);
  console.log(`  Proposals queue total: ${proposals.proposals.length} (pending: ${proposals.meta.pendingCount})`);

  if (newProposals.length > 0) {
    console.log();
    console.log("New proposals:");
    for (const p of newProposals) console.log(`  - ${p.target.id}: ${p.reason}`);
  }

  // Slack notify on new proposals (so Nicole sees them and can approve).
  const notifier = createNotifier({ webhookUrl: process.env.LEXI_SLACK_WEBHOOK });
  if (notifier.enabled && newProposals.length > 0) {
    const lines = [`🎓 *Lexi promotion scan · ${writtenAt.slice(0, 16).replace("T", " ")} UTC*`];
    lines.push("", `*${newProposals.length} term(s) hit the credibility bar* — pending your approval:`);
    for (const p of newProposals.slice(0, 8)) {
      lines.push(`• *${p.target.id}* — ${p.reason}`);
    }
    if (newProposals.length > 8) lines.push(`_…and ${newProposals.length - 8} more in proposals.json_`);
    lines.push("", `<https://ai-terminology.com/manager/|→ Manager dashboard>`);
    await notifier.send({ text: lines.join("\n") });
  }
}

// Spec §7 credibility bar — heuristic checks (data only, no LLM).
export function checkEligibility(entry, now = Date.now()) {
  const sources = entry.sources || [];
  const sourceCount = entry.sourceCount ?? sources.length;
  const independent = entry.independentSourceCount ?? new Set(sources.map(s => s.domain).filter(Boolean)).size;

  if (sourceCount < 2) return { eligible: false, why: `sourceCount ${sourceCount} < 2` };
  if (independent < 2) return { eligible: false, why: `independentSourceCount ${independent} < 2 (all sources from one domain)` };

  // Recency: at least one source seen in the past 90 days.
  const ninetyDaysAgo = now - 90 * DAY_MS;
  const hasRecent = sources.some(s => {
    const t = s.firstSeen ? new Date(s.firstSeen).getTime() : NaN;
    return Number.isFinite(t) && t >= ninetyDaysAgo;
  });
  if (!hasRecent) return { eligible: false, why: "no source seen in past 90 days" };

  // Time on longlist ≥ 14 days.
  const firstSeenMs = entry.dateFirstSeen ? new Date(entry.dateFirstSeen).getTime() : NaN;
  if (!Number.isFinite(firstSeenMs)) return { eligible: false, why: "missing dateFirstSeen" };
  const ageDays = Math.floor((now - firstSeenMs) / DAY_MS);
  if (ageDays < 14) return { eligible: false, why: `on longlist only ${ageDays}d (need 14)` };

  const domains = [...new Set(sources.map(s => s.domain).filter(Boolean))];
  const reason = `${sourceCount} sources, ${independent} independent (${domains.join(" + ")}), ${ageDays}d on longlist.`;
  return {
    eligible: true,
    reason,
    sourceCount,
    independent,
    domains,
    ageDays
  };
}

function buildPromotionProposal({ id, entry, verdict, writtenAt, runId }) {
  // Construct the graph-node payload from the longlist entry. This is what
  // gets written to the graph overlay if Nicole approves.
  const graphNode = {
    id: entry.id,
    label: entry.label,
    clusters: entry.clusters || [],
    sz: entry.sz || 16,
    def: entry.workingDef || "",
    rels: entry.suggestedRels || [],
    refs: (entry.sources || []).slice(0, 3).map((s, i) => ({
      n: i + 1,
      src: `${s.sourceLabel || s.domain || "source"}${s.publishedAt ? `, ${s.publishedAt}` : ""}`,
      q: `${s.title || ""} ${s.sourceLabel || ""}`.trim()
    }))
  };
  if (entry.fullName && entry.fullName !== entry.label) graphNode.fullName = entry.fullName;
  if (entry.nodeType) graphNode.nodeType = entry.nodeType;

  return {
    id,
    action: ACTIONS.PROMOTE_TO_GRAPH,
    gate: GATES.PROPOSE,
    proposedAt: writtenAt,
    status: "pending",
    source: "promote-eligibility-scan",
    target: { kind: "longlist_entry", id: entry.id },
    payload: { graphNode },
    reason: verdict.reason,
    runId
  };
}

