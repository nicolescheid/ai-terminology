// Demote-from-graph proposal creator.
//
// Reverse of promote.mjs. Takes a graph node id (or label) and writes a
// DEMOTE_TO_LONGLIST proposal to proposals.json with status: "pending".
// Nicole reviews + approves; apply-proposals.mjs then commits the demotion
// (removes from agent overlay; flips longlist entry status to "watching"
// with demotedAt timestamp).
//
// Why this exists as a CLI rather than a scheduled scanner: demotion is
// reactive, not periodic. There's no automatic eligibility check — Nicole
// notices a promoted term hasn't held up and explicitly demotes it. The
// scheduled-scanner pattern that promote.mjs uses doesn't apply.
//
// Scope limit: only proposes demotion of agent-overlay nodes (i.e. nodes
// Lexi promoted via agent-patch.json). Base-graph nodes curated in
// graph-data.js can't be demoted by this proposal pipeline — that file
// is curator territory; Nicole handles those by editing graph-data.js
// manually and re-adding the entry to longlist.json. demote.mjs surfaces
// a clear error in that case rather than queueing an apply-time error.
//
// Usage:
//   node demote.mjs <node-id> [--reason "..."]
//   node demote.mjs --by-label "Voice AI" [--reason "..."]
//   node demote.mjs --list      # show overlay nodes available to demote
//
// Examples:
//   node demote.mjs voice-ai --reason "Term turned out to be marketing puffery; \
//                                       no second-domain corroboration in 30 days."
//   node demote.mjs --by-label "Voice AI"
//
// Dedup: each proposal's id is sha-1 of "demote_to_longlist:{entry.id}".
// If a pending or approved proposal with that id already exists, the script
// refuses to create a duplicate. To re-propose after a rejection, delete
// or rename the rejected proposal and re-run.

import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS, GATES } from "./actions.mjs";
import { createLogger } from "./logger.mjs";
import { loadJson, loadGraphData, mergeNodes, writeJson } from "./state-io.mjs";

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  // Load patch (agent overlay) and graph (base) so we can distinguish
  // overlay nodes from base nodes and refuse the latter cleanly.
  const patch = await loadJson(config.patchJsonPath, { meta: {}, nodes: [], definitionOverrides: [] });
  const graph = await loadGraphData(config.graphDataPath);
  const proposals = await loadJson(config.proposalsPath, { meta: {}, proposals: [] });
  const longlist = await loadJson(config.longlistPath, { meta: {}, entries: [] });

  if (args.list) {
    printOverlayNodes(patch.nodes);
    return;
  }

  // Resolve target — either by id or by --by-label lookup.
  const overlayNodes = patch.nodes || [];
  let target = null;
  if (args.id) {
    target = overlayNodes.find(n => n.id === args.id);
    if (!target) {
      // Distinguish base-graph hit from "no such node" so the user gets
      // a useful error pointing them at the manual-fix path.
      const baseHit = (graph.nodes || []).find(n => n.id === args.id);
      if (baseHit) {
        console.error(`Node '${args.id}' is in the base graph (graph-data.js), not the agent overlay.`);
        console.error("Demote it by removing the entry from graph-data.js and re-adding to longlist.json with status: 'watching'.");
        process.exitCode = 1;
        return;
      }
      console.error(`No overlay node with id '${args.id}'. Run 'node demote.mjs --list' to see available overlay nodes.`);
      process.exitCode = 1;
      return;
    }
  } else if (args.byLabel) {
    const labelLower = args.byLabel.toLowerCase();
    target = overlayNodes.find(n => (n.label || "").toLowerCase() === labelLower);
    if (!target) {
      const baseHit = (graph.nodes || []).find(n => (n.label || "").toLowerCase() === labelLower);
      if (baseHit) {
        console.error(`Node with label '${args.byLabel}' (id '${baseHit.id}') is in the base graph, not the agent overlay.`);
        console.error("Demote it by removing from graph-data.js and re-adding to longlist.json.");
        process.exitCode = 1;
        return;
      }
      console.error(`No overlay node with label '${args.byLabel}'. Run 'node demote.mjs --list' to see available.`);
      process.exitCode = 1;
      return;
    }
  } else {
    console.error("Specify a target: <node-id> or --by-label <label>. Use --list to browse.");
    printUsage();
    process.exitCode = 1;
    return;
  }

  // Dedup: don't write a duplicate pending/approved proposal.
  const proposalId = crypto.createHash("sha1")
    .update(`${ACTIONS.DEMOTE_TO_LONGLIST}:${target.id}`)
    .digest("hex").slice(0, 16);
  const existing = (proposals.proposals || []).find(p => p.id === proposalId);
  if (existing && (existing.status === "pending" || existing.status === "approved")) {
    console.error(`A ${existing.status} demote proposal for '${target.id}' already exists (id ${existing.id}, proposed ${existing.proposedAt}).`);
    console.error("Approve, reject, or delete the existing proposal before creating a new one.");
    process.exitCode = 1;
    return;
  }

  const writtenAt = new Date().toISOString();
  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });

  // Find the longlist entry (if any) for context in the proposal reason.
  const llEntry = (longlist.entries || []).find(e => e.id === target.id);
  const llContext = llEntry
    ? ` Longlist entry exists with status='${llEntry.status || "watching"}'; on apply, status flips to 'watching' with demotedAt set.`
    : " No longlist entry found for this id; on apply, only the overlay removal happens.";

  const reasonText = args.reason
    ? `${args.reason}${llContext}`
    : `Manual demote requested via demote.mjs CLI.${llContext}`;

  const proposal = {
    id: proposalId,
    action: ACTIONS.DEMOTE_TO_LONGLIST,
    gate: GATES.PROPOSE,
    proposedAt: writtenAt,
    status: "pending",
    source: "demote-cli",
    target: { kind: "graph_node", id: target.id },
    payload: {
      // Demote payloads are small — the apply path only needs target.id.
      // Including the node label here for human-readable proposal review.
      label: target.label || target.id
    },
    reason: reasonText,
    runId
  };
  if (existing) {
    // Existing rejected proposal — replace it (the dedup id will repeat,
    // but since it's rejected we don't want it counted in pending).
    const idx = proposals.proposals.indexOf(existing);
    proposals.proposals[idx] = proposal;
  } else {
    proposals.proposals.push(proposal);
  }

  proposals.meta = {
    generatedAt: writtenAt,
    pendingCount: proposals.proposals.filter(p => p.status === "pending").length,
    approvedCount: proposals.proposals.filter(p => p.status === "approved").length,
    appliedCount: proposals.proposals.filter(p => p.status === "applied").length,
    rejectedCount: proposals.proposals.filter(p => p.status === "rejected").length,
    note: proposals.meta?.note ?? "Lexi proposals queue."
  };

  await writeJson(config.proposalsPath, proposals);

  await logger.event("demote_proposal_written", {
    proposalId,
    targetId: target.id,
    targetLabel: target.label || null,
    reason: args.reason || null,
    hadLonglistEntry: !!llEntry
  });

  console.log(`✓ Demote proposal written for '${target.label || target.id}' (id ${proposalId}).`);
  console.log(`  Status: pending. To apply, edit proposals.json status → 'approved' and run apply-proposals.mjs.`);
  console.log(`  Or via the manager dashboard once mark-proposal buttons exist (TODO).`);
}

function printOverlayNodes(nodes) {
  if (!nodes || nodes.length === 0) {
    console.log("No nodes in the agent overlay (agent-patch.json).");
    return;
  }
  console.log(`Agent overlay has ${nodes.length} node(s):`);
  for (const n of nodes) {
    console.log(`  ${n.id.padEnd(36)} ${n.label || ""}`);
  }
  console.log("");
  console.log("Usage: node demote.mjs <id>  OR  node demote.mjs --by-label \"Label\"");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--help" || v === "-h") args.help = true;
    else if (v === "--list") args.list = true;
    else if (v === "--by-label" && argv[i + 1]) { args.byLabel = argv[i + 1]; i += 1; }
    else if (v === "--reason" && argv[i + 1]) { args.reason = argv[i + 1]; i += 1; }
    else if (!v.startsWith("--") && !args.id && !args.byLabel) { args.id = v; }
    else {
      console.error(`Unknown or misplaced argument: ${v}`);
      args.help = true;
      process.exitCode = 1;
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage: node demote.mjs <node-id> [--reason "..."]
       node demote.mjs --by-label "Label" [--reason "..."]
       node demote.mjs --list
       node demote.mjs --help

Creates a DEMOTE_TO_LONGLIST proposal in proposals.json with status:"pending".
Nicole approves it (edit status → "approved" or via manager dashboard);
apply-proposals.mjs then performs the demotion.

Options:
  <node-id>          The graph node id to demote (must be in the agent overlay).
  --by-label "..."   Alternative: look up the node by its display label.
  --list             Print the overlay nodes available to demote and exit.
  --reason "..."     Optional rationale; appended to the proposal's reason
                     field for the audit trail and for Nicole's review.
  --help, -h         Show this usage.

Examples:
  node demote.mjs voice-ai --reason "Marketing puffery; no second-domain \\
                                      corroboration in 30 days."
  node demote.mjs --by-label "Voice AI"
  node demote.mjs --list
`);
}
