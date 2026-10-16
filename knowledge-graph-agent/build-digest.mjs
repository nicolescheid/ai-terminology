// Digest builder. Runs after review-proposals.mjs in lexi-run.yml.
//
// Collects every pending proposal that the reviewer has tiered and that
// hasn't been in a digest yet, numbers them, and writes a digest record to
// digests.json. If there's nothing new, it writes nothing and no email goes
// out. send-digest.mjs posts the digest to the Worker after the workflow has
// pushed, and the Worker renders + sends it and records sentAt.
//
// Each item carries what Nicole needs to decide without opening anything:
// term, definition (and the current one, for edits), sources, nearest node,
// Lexi's rationale, the reviewer's verdict, and its tier. "auto" items get an
// autoApplyAt; apply-proposals.mjs approves them once that passes, if the
// digest was actually sent, they aren't held, and auto-apply isn't paused.
//
// LEXI_AUTO_APPLY_HOURS (default 72) overrides the window. Use a small value
// (e.g. 0.05 = 3 minutes) only for testing.
//
// Run with: node build-digest.mjs

import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS } from "./actions.mjs";
import { loadGraphData, loadJson, mergeNodes, writeJson } from "./state-io.mjs";

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const config = (await import(pathToFileURL(path.resolve(here, "config.mjs")).href)).default;
  const proposals = await loadJson(config.proposalsPath, { meta: {}, proposals: [] });
  const digests = await loadJson(config.digestsPath, { meta: {}, digests: [] });
  const longlist = await loadJson(config.longlistPath, { entries: [] });
  const patch = await loadJson(config.patchJsonPath, { nodes: [], definitionOverrides: [] });
  const graph = await loadGraphData(config.graphDataPath);
  const nodes = mergeNodes(graph.nodes, patch);

  const fresh = (proposals.proposals || []).filter(p => p.status === "pending" && p.tier && !p.digestId);
  if (!fresh.length) {
    console.log("Digest: nothing new to review; no digest.");
    return;
  }

  const hours = Number.parseFloat(process.env.LEXI_AUTO_APPLY_HOURS || "72");
  const autoApplyHours = Number.isFinite(hours) && hours > 0 ? hours : 72;
  const now = new Date();
  const createdAt = now.toISOString();
  const autoApplyAt = new Date(now.getTime() + autoApplyHours * 3600 * 1000).toISOString();
  const id = `D-${createdAt.slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(2).toString("hex")}`;

  // Waits-for-Nicole first, then the low-risk ones.
  fresh.sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "nicole" ? -1 : 1));
  const items = fresh.map((p, i) => {
    const n = i + 1;
    const entry = (longlist.entries || []).find(e => e.id === p.target?.id);
    const node = nodes.find(x => x.id === p.target?.id);
    const isPromote = p.action === ACTIONS.PROMOTE_TO_GRAPH;
    const g = p.payload?.graphNode;
    p.digestId = id;
    p.digestN = n;
    if (p.tier === "auto") p.autoApplyAt = autoApplyAt;
    return {
      n,
      proposalId: p.id,
      action: p.action,
      kind: isPromote ? "new_term" : p.action.startsWith("edit_graph_def") ? "edit" : "other",
      term: g?.label || node?.label || entry?.label || p.target?.id,
      termId: p.target?.id,
      definition: isPromote ? g?.def || entry?.workingDef || "" : p.payload?.def || "",
      previousDefinition: isPromote ? null : node?.def || null,
      sources: sourcesFor(p, entry),
      nearest: p.review?.nearest || null,
      rationale: p.reason || "",
      review: p.review ? { verdict: p.review.verdict, summary: p.review.summary, flags: p.review.flags || [] } : null,
      tier: p.tier,
      tierReason: p.tierReason
    };
  });

  const waitingEarlier = (proposals.proposals || []).filter(p => p.status === "pending" && p.digestId && p.digestId !== id).length;
  digests.digests.push({ id, createdAt, autoApplyHours, autoApplyAt, sentAt: null, messageId: null, items, waitingEarlier, thread: [] });
  digests.meta = {
    generatedAt: createdAt,
    count: digests.digests.length,
    note: "Lexi's email digests to Nicole. Written by build-digest.mjs; sentAt/messageId/thread written by the Worker (src/lexi-mail)."
  };

  await writeJson(config.digestsPath, digests);
  await writeJson(config.proposalsPath, proposals);
  console.log(`Digest ${id}: ${items.length} item(s) (${items.filter(i => i.tier === "auto").length} auto after ${autoApplyHours}h, ${items.filter(i => i.tier !== "auto").length} wait for Nicole).`);
}

function sourcesFor(p, entry) {
  if (p.action === ACTIONS.PROMOTE_TO_GRAPH && entry?.sources?.length) {
    return entry.sources.slice(0, 6).map(s => ({
      label: [s.sourceLabel || s.domain, s.title].filter(Boolean).join(": "),
      url: s.url || null
    }));
  }
  const refs = p.payload?.graphNode?.refs || p.payload?.refs || [];
  return refs.map(r => ({ label: [r.src, r.q].filter(Boolean).join(": "), url: r.url || null }));
}
