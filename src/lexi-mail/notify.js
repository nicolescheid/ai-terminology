// POST /api/lexi/notify: GitHub Actions → email to Nicole.
//
// Auth: `Authorization: Bearer <LEXI_NOTIFY_TOKEN>` (Worker secret; the same
// value is the GitHub repo secret of that name). Body is JSON with `kind`:
//
//   { kind: "alert", subject, intro?, lines?: string[], link?: {href,label}, noteIds?: string[] }
//       Run failures, flags, issues, Lexi's questions. Sent at once. With
//       noteIds, the email carries a signed "Mark these notes read" link.
//   { kind: "digest", digestId }
//       Renders the digest from digests.json + proposals.json on main (the
//       workflow pushes before calling), sends it, then commits sentAt +
//       messageId back to digests.json. Idempotent: an already-sent digest
//       is not resent. Auto-apply only counts from sentAt, so a digest that
//       never went out never auto-applies anything.
//   { kind: "weekly", since, items: [{ proposalId, label, action, appliedAt, approvedBy }] }
//       "What went live" with a signed undo link per item.

import { signLink, TTL } from "./links.js";
import { renderAlert, renderDigest, renderWeekly } from "./render.js";
import { sendToNicole } from "./send.js";
import { DIGESTS_PATH, PROPOSALS_PATH, commitJson, readJsonFile, jsonError, jsonResponse } from "../github.js";

const LABEL = "ai-terminology-lexi-mail-worker";

export async function handleNotify(request, env) {
  if (!checkBearer(request.headers.get("authorization"), env.LEXI_NOTIFY_TOKEN)) {
    return new Response("Unauthorized", { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch { return jsonError(400, "Invalid JSON body"); }

  try {
    if (body?.kind === "alert") return await sendAlert(env, body);
    if (body?.kind === "digest") return await sendDigest(env, body);
    if (body?.kind === "weekly") return await sendWeekly(env, body);
  } catch (err) {
    console.error("lexi notify failed", err.stack || err.message);
    return jsonError(500, err.message);
  }
  return jsonError(400, "kind must be one of: alert, digest, weekly");
}

async function sendAlert(env, body) {
  if (!body.subject || typeof body.subject !== "string") return jsonError(400, "subject (string) required");
  const lines = Array.isArray(body.lines) ? body.lines.map(String).slice(0, 40) : [];
  const noteIds = Array.isArray(body.noteIds) ? body.noteIds.filter(x => typeof x === "string").slice(0, 50) : [];
  const markRead = noteIds.length ? await signLink(env, { a: "notes_read", ids: noteIds }, TTL.notes) : null;
  const link = body.link?.href && /^https:\/\//.test(body.link.href) ? { href: body.link.href, label: String(body.link.label || body.link.href) } : null;
  const mail = renderAlert({ subject: body.subject.slice(0, 160), intro: body.intro ? String(body.intro).slice(0, 2000) : null, lines, link, markRead });
  const sent = await sendToNicole(env, mail);
  return sent.ok ? jsonResponse(200, { ok: true, messageId: sent.messageId }) : jsonError(502, `send failed: ${sent.error}`);
}

async function sendDigest(env, body) {
  const digestId = body.digestId;
  if (!digestId || typeof digestId !== "string") return jsonError(400, "digestId required");
  const [digests, proposals] = await Promise.all([
    readJsonFile(env, DIGESTS_PATH, LABEL),
    readJsonFile(env, PROPOSALS_PATH, LABEL)
  ]);
  if (!digests.ok) return jsonError(502, digests.error);
  if (!proposals.ok) return jsonError(502, proposals.error);
  const digest = (digests.json?.digests || []).find(d => d.id === digestId);
  if (!digest) return jsonError(404, `digest ${digestId} not on main yet`);
  if (digest.sentAt) return jsonResponse(200, { ok: true, alreadySent: true, sentAt: digest.sentAt });

  const byId = new Map((proposals.json?.proposals || []).map(p => [p.id, p]));
  const statuses = {};
  const links = { pause: {} };
  for (const item of digest.items) {
    statuses[item.proposalId] = byId.get(item.proposalId)?.status || "missing";
    const base = { ids: [item.proposalId], d: digest.id };
    links[item.proposalId] = {
      approve: await signLink(env, { ...base, a: "approve" }, TTL.digest),
      reject:  await signLink(env, { ...base, a: "reject" }, TTL.digest),
      hold:    await signLink(env, { ...base, a: "hold" }, TTL.digest)
    };
  }
  const pendingIds = digest.items.filter(i => statuses[i.proposalId] === "pending").map(i => i.proposalId);
  links.approveAll = pendingIds.length > 1 ? await signLink(env, { a: "approve_all", ids: pendingIds, d: digest.id }, TTL.digest) : null;
  for (const w of [1, 2, 4]) links.pause[w] = await signLink(env, { a: "pause", w, d: digest.id }, TTL.digest);
  const pausedUntil = proposals.json?.controls?.autoApplyPausedUntil || null;
  links.resume = pausedUntil ? await signLink(env, { a: "resume", d: digest.id }, TTL.digest) : null;

  const mail = renderDigest({ digest, statuses, links, pausedUntil });
  const sent = await sendToNicole(env, { ...mail, headers: { "X-Lexi-Digest": digest.id } });
  if (!sent.ok) return jsonError(502, `send failed: ${sent.error}`);

  const sentAt = new Date().toISOString();
  const commit = await commitJson(env, {
    path: DIGESTS_PATH, workerLabel: LABEL, parseErrorContext: "digests.json",
    mutate: (json) => {
      const d = (json.digests || []).find(x => x.id === digestId);
      if (!d) return { ok: false, status: 404, error: "digest vanished" };
      d.sentAt = sentAt;
      d.messageId = sent.messageId;
      d.subject = mail.subject;
      return { ok: true, payload: {} };
    },
    commitMessage: () => `Digest ${digestId} sent to Nicole\n\nVia /api/lexi/notify.`
  });
  return jsonResponse(200, { ok: true, messageId: sent.messageId, sentAt, recorded: commit.ok, recordError: commit.ok ? undefined : commit.error });
}

async function sendWeekly(env, body) {
  const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  if (!items.length) return jsonResponse(200, { ok: true, skipped: "nothing went live" });
  const rendered = [];
  for (const i of items) {
    const undoable = i.undoable === true;
    rendered.push({
      label: i.label || i.proposalId,
      kindLabel: i.action === "promote_to_graph" ? "new term" : i.action === "edit_graph_def_substantive" ? "definition edit" : String(i.action || "").replace(/_/g, " "),
      appliedAt: i.appliedAt,
      approvedBy: i.approvedBy,
      undo: undoable ? await signLink(env, { a: "undo", ids: [i.proposalId] }, TTL.undo) : null,
      undoNote: undoable ? null : "No undo link: undo this one from /manager or by hand."
    });
  }
  const mail = renderWeekly({ items: rendered, since: body.since || new Date(Date.now() - 7 * 864e5).toISOString() });
  const sent = await sendToNicole(env, mail);
  return sent.ok ? jsonResponse(200, { ok: true, messageId: sent.messageId }) : jsonError(502, `send failed: ${sent.error}`);
}

function checkBearer(header, expected) {
  if (!expected || !header || !header.startsWith("Bearer ")) return false;
  const got = header.slice(7);
  if (got.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < got.length; i++) mismatch |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}
