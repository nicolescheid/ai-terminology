// Weekly "what went live" email: every proposal applied in the last 7 days,
// each with a signed undo link (the Worker signs them). Runs in
// lexi-audit.yml. No email when nothing went live.
//
// Run with: node weekly-summary.mjs

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createNotifier } from "./notify.mjs";
import { loadJson } from "./state-io.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = (await import(pathToFileURL(path.resolve(here, "config.mjs")).href)).default;
const proposals = await loadJson(config.proposalsPath, { proposals: [] });
const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

const items = (proposals.proposals || [])
  .filter(p => p.status === "applied" && p.appliedAt && p.appliedAt >= since && !p.undoRequestedAt)
  .map(p => ({
    proposalId: p.id,
    label: p.payload?.graphNode?.label || p.target?.id,
    action: p.action,
    appliedAt: p.appliedAt,
    approvedBy: p.approvedBy || null,
    // Def edits applied before undo tracking have no previousOverride to restore.
    undoable: p.source !== "email-undo" &&
      (p.action === "promote_to_graph" || (p.action === "edit_graph_def_substantive" && "previousOverride" in p))
  }));

if (!items.length) {
  console.log("Weekly summary: nothing went live in the last 7 days; no email.");
} else {
  const notifier = createNotifier();
  const r = await notifier.sendWeekly({ since, items });
  console.log(`Weekly summary (${items.length} item(s)): ${JSON.stringify(r)}`);
  if (r.ok === false) process.exitCode = 1;
}
