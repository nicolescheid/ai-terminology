// Pure mutations on proposals.json, shared by the signed email links (act.js)
// and the reply handler (inbound.js). Each op takes the parsed file and
// returns { ok, msg } (msg is human-readable and goes back to Nicole or to
// Claude as a tool result). Ops must be safe to replay against a fresh copy
// of the file: commitJson re-runs them after a 409 sha conflict.
//
// Proposal fields this channel adds (all optional):
//   tier              "auto" | "nicole"   set by review-proposals.mjs
//   review            reviewer verdict     set by review-proposals.mjs
//   digestId/digestN  which digest it went out in, and its number there
//   autoApplyAt       when an untouched "auto" item gets approved
//   heldAt/heldBy     Hold: stays pending, never auto-applies
//   redraft           { def, rationale, proposedAt } awaiting Nicole's yes
//   aliasOf           existing node id, when rejected as a duplicate/alias
//   extraSources      sources Nicole asked Lexi to find, by reply
//   decidedVia        "email-link" | "email-reply" | ...
// Top-level keys:
//   controls.autoApplyPausedUntil   ISO date; auto-apply skipped until then
//   usedLinks                       { nonce: usedAt } single-use ledger

const USED_LINK_RETENTION_MS = 30 * 24 * 3600 * 1000;

export function findProposal(json, id) {
  return (json.proposals || []).find(p => p.id === id) || null;
}

export function proposalLabel(p) {
  return p?.payload?.graphNode?.label || p?.target?.id || p?.id || "(unknown)";
}

// Single-use ledger. Returns an error result if already used.
export function consumeNonce(json, nonce, now = new Date().toISOString()) {
  if (!nonce) return { ok: false, status: 400, error: "Link has no nonce." };
  json.usedLinks = json.usedLinks || {};
  if (json.usedLinks[nonce]) {
    return { ok: false, status: 410, error: `This link was already used (${json.usedLinks[nonce].slice(0, 16).replace("T", " ")} UTC). Each link works once.` };
  }
  const cutoff = Date.now() - USED_LINK_RETENTION_MS;
  for (const [k, v] of Object.entries(json.usedLinks)) {
    if (new Date(v).getTime() < cutoff) delete json.usedLinks[k];
  }
  json.usedLinks[nonce] = now;
  return { ok: true };
}

export function decide(json, id, decision, { by = "nicole", via = "email-link", reason = null, now = new Date().toISOString() } = {}) {
  const p = findProposal(json, id);
  if (!p) return { ok: false, msg: `No proposal ${id}.` };
  const label = proposalLabel(p);

  if (decision === "approve") {
    if (p.status === "approved" || p.status === "applied") return { ok: true, msg: `'${label}' was already ${p.status}.`, noChange: true };
    if (p.status === "rejected") return { ok: false, msg: `'${label}' was already rejected; approve it from /manager if you've changed your mind.` };
    p.status = "approved";
    p.approvedAt = now;
    p.approvedBy = by;
    p.decidedVia = via;
    delete p.heldAt; delete p.heldBy;
    return { ok: true, approved: true, msg: `Approved '${label}'.` };
  }
  if (decision === "reject") {
    if (p.status === "rejected") return { ok: true, msg: `'${label}' was already rejected.`, noChange: true };
    if (p.status === "applied") return { ok: false, msg: `'${label}' is already live; use the undo link in the weekly summary instead.` };
    p.status = "rejected";
    p.rejectedAt = now;
    p.rejectedBy = by;
    p.decidedVia = via;
    if (reason) p.rejectionReason = reason;
    return { ok: true, msg: `Rejected '${label}'.` };
  }
  if (decision === "hold") {
    if (p.status !== "pending") return { ok: false, msg: `'${label}' is ${p.status}, so there's nothing to hold.` };
    if (p.heldAt) return { ok: true, msg: `'${label}' was already on hold.`, noChange: true };
    p.heldAt = now;
    p.heldBy = by;
    p.decidedVia = via;
    return { ok: true, msg: `Holding '${label}'. It won't auto-apply; it waits for you.` };
  }
  if (decision === "release") {
    if (!p.heldAt) return { ok: true, msg: `'${label}' wasn't on hold.`, noChange: true };
    delete p.heldAt; delete p.heldBy;
    return { ok: true, msg: `Released the hold on '${label}'.` };
  }
  return { ok: false, msg: `Unknown decision '${decision}'.` };
}

export function setPause(json, weeks, now = new Date()) {
  json.controls = json.controls || {};
  if (!weeks || weeks <= 0) {
    if (!json.controls.autoApplyPausedUntil) return { ok: true, msg: "Auto-apply wasn't paused.", noChange: true };
    delete json.controls.autoApplyPausedUntil;
    return { ok: true, msg: "Auto-apply resumed. Untouched low-risk items will apply 72h after their digest again." };
  }
  const until = new Date(now.getTime() + weeks * 7 * 24 * 3600 * 1000).toISOString();
  json.controls.autoApplyPausedUntil = until;
  return { ok: true, msg: `Auto-apply paused until ${until.slice(0, 10)}. Proposals keep queuing and still come to you in digests; nothing applies unless you approve it.` };
}

export function setRedraft(json, id, def, rationale, now = new Date().toISOString()) {
  const p = findProposal(json, id);
  if (!p) return { ok: false, msg: `No proposal ${id}.` };
  if (p.status !== "pending") return { ok: false, msg: `'${proposalLabel(p)}' is ${p.status}; redrafts only apply to pending items.` };
  p.redraft = { def, rationale: rationale || null, proposedAt: now };
  p.heldAt = p.heldAt || now;
  p.heldBy = p.heldBy || "redraft";
  return { ok: true, msg: `Redraft stored for '${proposalLabel(p)}' and the item is held until Nicole says yes.` };
}

export function acceptRedraft(json, id, { by = "nicole", via = "email-reply", now = new Date().toISOString() } = {}) {
  const p = findProposal(json, id);
  if (!p) return { ok: false, msg: `No proposal ${id}.` };
  if (!p.redraft?.def) return { ok: false, msg: `'${proposalLabel(p)}' has no redraft waiting.` };
  if (p.payload?.graphNode) {
    p.payload.graphNode.originalDef = p.payload.graphNode.originalDef ?? p.payload.graphNode.def;
    p.payload.graphNode.def = p.redraft.def;
  } else if (p.payload && "def" in p.payload) {
    p.payload.originalDef = p.payload.originalDef ?? p.payload.def;
    p.payload.def = p.redraft.def;
  } else {
    return { ok: false, msg: `'${proposalLabel(p)}' has no definition field to replace.` };
  }
  p.redraft.acceptedAt = now;
  return decide(json, id, "approve", { by, via, now });
}

export function markAlias(json, id, existingNodeId, note, { by = "nicole", via = "email-reply", now = new Date().toISOString() } = {}) {
  const p = findProposal(json, id);
  if (!p) return { ok: false, msg: `No proposal ${id}.` };
  p.aliasOf = existingNodeId;
  const r = decide(json, id, "reject", { by, via, now, reason: `Duplicate/alias of existing node '${existingNodeId}'.${note ? " " + note : ""}` });
  return r.ok ? { ok: true, msg: `Recorded '${proposalLabel(p)}' as an alias of '${existingNodeId}' and rejected the promotion.` } : r;
}

export function addSources(json, id, sources, now = new Date().toISOString()) {
  const p = findProposal(json, id);
  if (!p) return { ok: false, msg: `No proposal ${id}.` };
  p.extraSources = p.extraSources || [];
  let added = 0;
  for (const s of sources || []) {
    if (!s?.url || p.extraSources.some(e => e.url === s.url)) continue;
    p.extraSources.push({ url: s.url, title: s.title || null, publisher: s.publisher || null, addedAt: now });
    added++;
  }
  return { ok: true, msg: `Added ${added} source(s) to '${proposalLabel(p)}'.` };
}

// Build the inverse of an applied proposal as a new pre-approved proposal.
// apply-proposals.mjs then carries it out on its next run.
export function undo(json, id, { by = "nicole", via = "email-link", now = new Date().toISOString() } = {}) {
  const p = findProposal(json, id);
  if (!p) return { ok: false, msg: `No proposal ${id}.` };
  const label = proposalLabel(p);
  if (p.status !== "applied") return { ok: false, msg: `'${label}' isn't live (status: ${p.status}), so there's nothing to undo.` };
  const undoId = `undo-${p.id}`;
  if (findProposal(json, undoId)) return { ok: true, msg: `Undo of '${label}' is already queued.`, noChange: true };

  let inverse;
  if (p.action === "promote_to_graph") {
    inverse = {
      action: "demote_to_longlist",
      target: { kind: "graph_node", id: p.payload?.graphNode?.id || p.target?.id },
      payload: {}
    };
  } else if (p.action === "edit_graph_def_substantive") {
    if (!("previousOverride" in p)) {
      return { ok: false, msg: `'${label}' was applied before undo tracking existed, so I don't know the earlier definition. Revert it by hand in agent-patch.json.` };
    }
    inverse = {
      action: "edit_graph_def_substantive",
      target: p.target,
      payload: p.previousOverride ? { def: p.previousOverride.def, refs: p.previousOverride.refs || [] } : { remove: true }
    };
  } else {
    return { ok: false, msg: `No undo path for '${p.action}'.` };
  }

  json.proposals.push({
    id: undoId,
    ...inverse,
    gate: "propose",
    proposedAt: now,
    status: "approved",
    approvedAt: now,
    approvedBy: by,
    decidedVia: via,
    source: "email-undo",
    undoOf: p.id,
    reason: `Undo of '${label}' (${p.action}) requested by ${by} via ${via}.`
  });
  p.undoRequestedAt = now;
  return { ok: true, approved: true, msg: `Undo of '${label}' queued; it comes off within a few minutes.` };
}
