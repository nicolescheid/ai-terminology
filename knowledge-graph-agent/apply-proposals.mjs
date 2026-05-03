// Proposal applier.
//
// Reads proposals.json. For every proposal with status: "approved", applies
// the action to the appropriate state file:
//   - PROMOTE_TO_GRAPH: adds payload.graphNode to agent-patch.json's `nodes`
//     array (and re-writes graph-data-agent.js so the frontend picks it up).
//     ALSO marks the matching longlist.json entry as status: "promoted"
//     (with promotedAt timestamp + promotedToGraphNodeId pointer) so
//     /observing, /manager, and the almanac stop double-showing it.
//     The entry is kept rather than deleted: preserves audit trail
//     (sources at promotion time, days on longlist) and leaves the
//     status field free for future demote-to-watching flows.
//   - EDIT_GRAPH_DEF_SUBSTANTIVE: adds payload to definitionOverrides.
//   - Other actions: logged + skipped (no apply path defined yet).
//
// On success, the proposal's status flips to "applied" with an appliedAt
// timestamp, and an action event lands in the deterministic log.
//
// This is intentionally idempotent: re-running it produces no change once
// every approved proposal is already applied. It also doesn't touch
// pending or rejected proposals. Safe to run on every cron tick.
//
// Run with: node apply-proposals.mjs

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS } from "./actions.mjs";
import { createLogger } from "./logger.mjs";
import { createNotifier } from "./notify.mjs";
import { loadJson, writeJson } from "./state-io.mjs";

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  const proposals = await loadJson(config.proposalsPath, { meta: {}, proposals: [] });
  const patch = await loadJson(config.patchJsonPath, {
    meta: { generatedAt: null, sourceCount: 0, note: "Agent-managed overlay." },
    nodes: [],
    definitionOverrides: []
  });
  const longlist = await loadJson(config.longlistPath, { meta: {}, entries: [] });
  let longlistMutated = false;

  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });

  const approved = (proposals.proposals || []).filter(p => p.status === "approved");
  await logger.event("apply_proposals_start", {
    totalProposals: proposals.proposals.length,
    approvedToApply: approved.length
  });

  if (approved.length === 0) {
    console.log("Nothing to apply — 0 approved proposals.");
    await logger.event("apply_proposals_end", { applied: 0, skipped: 0 });
    return;
  }

  const appliedAt = new Date().toISOString();
  let applied = 0;
  let skipped = 0;
  const appliedTermLabels = [];

  for (const proposal of approved) {
    const result = applyOne(proposal, patch, longlist, appliedAt);
    if (result.longlistMutated) longlistMutated = true;
    if (result.ok) {
      proposal.status = "applied";
      proposal.appliedAt = appliedAt;
      applied++;
      appliedTermLabels.push(result.label || proposal.target?.id);
      await logger.action({
        action: proposal.action,
        source: "apply-proposals",
        gate: "autonomous",  // applying an already-approved proposal IS autonomous
        outcome: "applied",
        target: proposal.target,
        payload: proposal.payload,
        reason: `Applied previously-approved proposal ${proposal.id}.`
      });
    } else {
      skipped++;
      await logger.event("apply_proposal_skipped", {
        proposalId: proposal.id,
        action: proposal.action,
        why: result.why
      });
    }
  }

  // Refresh proposals meta + write everything back
  proposals.meta = {
    generatedAt: appliedAt,
    pendingCount: proposals.proposals.filter(p => p.status === "pending").length,
    appliedCount: proposals.proposals.filter(p => p.status === "applied").length,
    rejectedCount: proposals.proposals.filter(p => p.status === "rejected").length,
    note: proposals.meta?.note ?? "Lexi proposals queue."
  };

  patch.meta = {
    generatedAt: appliedAt,
    sourceCount: patch.meta?.sourceCount ?? 0,
    note: patch.meta?.note ?? "Agent-managed overlay."
  };

  await writeJson(config.proposalsPath, proposals);
  await writeJson(config.patchJsonPath, patch);
  await fs.writeFile(config.agentPatchPath, `window.AGENT_GRAPH_PATCH = ${JSON.stringify(patch, null, 2)};\n`, "utf8");
  // Only rewrite longlist.json if at least one promotion actually touched it.
  // Avoids spurious diffs (and downstream Cloudflare Pages rebuilds) on runs
  // that only apply non-promotion proposals.
  if (longlistMutated) {
    await writeJson(config.longlistPath, longlist);
  }

  await logger.event("apply_proposals_end", { applied, skipped });

  console.log(`Apply complete.`);
  console.log(`  Approved proposals processed: ${approved.length}`);
  console.log(`  Applied: ${applied}`);
  console.log(`  Skipped (apply path not defined): ${skipped}`);
  console.log(`  Graph overlay nodes: ${patch.nodes.length}`);

  // Slack notify when terms get promoted to the graph.
  const notifier = createNotifier({ webhookUrl: process.env.LEXI_SLACK_WEBHOOK });
  if (notifier.enabled && applied > 0) {
    const lines = [`🎓 *Lexi promotion applied · ${appliedAt.slice(0, 16).replace("T", " ")} UTC*`];
    lines.push("", `*${applied} approved proposal(s)* committed to the graph:`);
    for (const label of appliedTermLabels.slice(0, 8)) {
      lines.push(`• ${label}`);
    }
    if (appliedTermLabels.length > 8) lines.push(`_…and ${appliedTermLabels.length - 8} more_`);
    lines.push("", `<https://ai-terminology.com/|→ See on the graph>`);
    await notifier.send({ text: lines.join("\n") });
  }
}

// Apply a single approved proposal. Mutates patch (always) and longlist
// (for PROMOTE_TO_GRAPH, when a matching entry exists). Returns
// { ok, why?, label?, longlistMutated? } so the caller can decide whether
// to write longlist.json back.
function applyOne(proposal, patch, longlist, appliedAt) {
  switch (proposal.action) {
    case ACTIONS.PROMOTE_TO_GRAPH: {
      const node = proposal.payload?.graphNode;
      if (!node?.id) return { ok: false, why: "missing payload.graphNode.id" };
      const existing = patch.nodes.find(n => n.id === node.id);
      if (existing) return { ok: false, why: `already in patch.nodes: ${node.id}` };
      patch.nodes.push(node);

      // Mark the source longlist entry as promoted, keeping the entry in
      // place. /observing, /manager, the almanac, and promote.mjs all
      // filter on `status === "promoted"` to stop double-showing it. The
      // entry stays for audit trail (sources at promotion time, days on
      // longlist) and to leave the field free for a future demote action.
      const llEntry = (longlist.entries || []).find(e => e.id === proposal.target?.id);
      let longlistMutated = false;
      if (llEntry && llEntry.status !== "promoted") {
        llEntry.status = "promoted";
        llEntry.promotedAt = appliedAt;
        llEntry.promotedToGraphNodeId = node.id;
        longlistMutated = true;
      }
      return { ok: true, label: node.label || node.id, longlistMutated };
    }
    case ACTIONS.EDIT_GRAPH_DEF_SUBSTANTIVE: {
      const override = proposal.payload;
      if (!override?.id || !override?.def) return { ok: false, why: "missing payload.id or payload.def" };
      const existing = patch.definitionOverrides.findIndex(o => o.id === override.id);
      if (existing >= 0) patch.definitionOverrides[existing] = { id: override.id, def: override.def, refs: override.refs || [] };
      else patch.definitionOverrides.push({ id: override.id, def: override.def, refs: override.refs || [] });
      return { ok: true, label: override.id };
    }
    default:
      return { ok: false, why: `no apply path for action '${proposal.action}'` };
  }
}

