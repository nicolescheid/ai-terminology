// Proposal applier.
//
// Reads proposals.json. For every proposal with status: "approved", applies
// the action to the appropriate state file:
//   - PROMOTE_TO_GRAPH: adds payload.graphNode to agent-patch.json's `nodes`
//     array (and re-writes graph-data-agent.js so the frontend picks it up).
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
    const result = applyOne(proposal, patch);
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

  await fs.writeFile(config.proposalsPath, `${JSON.stringify(proposals, null, 2)}\n`, "utf8");
  await fs.writeFile(config.patchJsonPath, `${JSON.stringify(patch, null, 2)}\n`, "utf8");
  await fs.writeFile(config.agentPatchPath, `window.AGENT_GRAPH_PATCH = ${JSON.stringify(patch, null, 2)};\n`, "utf8");

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

// Apply a single approved proposal to the patch. Returns { ok, why?, label? }.
function applyOne(proposal, patch) {
  switch (proposal.action) {
    case ACTIONS.PROMOTE_TO_GRAPH: {
      const node = proposal.payload?.graphNode;
      if (!node?.id) return { ok: false, why: "missing payload.graphNode.id" };
      const existing = patch.nodes.find(n => n.id === node.id);
      if (existing) return { ok: false, why: `already in patch.nodes: ${node.id}` };
      patch.nodes.push(node);
      return { ok: true, label: node.label || node.id };
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

async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}
