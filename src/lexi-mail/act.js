// /lexi/act: the landing page for every signed link in Lexi's emails.
//
//   GET  → verify signature + expiry, show what the link will do, and a
//          button that POSTs the token back. Never changes state, so mail
//          scanners that prefetch links can't trigger anything.
//   POST → verify again, then commit the change and burn the link's nonce in
//          the same GitHub commit (single-use). Approvals and undos trigger the
//          lexi-run workflow so apply-proposals.mjs lands them within minutes.

import { verifyToken } from "./links.js";
import { page, esc, pageButtonStyle, pageColors as C } from "./render.js";
import { consumeNonce, decide, setPause, undo, findProposal, proposalLabel } from "./ops.js";
import {
  NOTES_PATH, PROPOSALS_PATH,
  commitJson, readJsonFile, refreshProposalsMeta, triggerLexiRunWorkflow
} from "../github.js";

const LABEL = "ai-terminology-lexi-mail-worker";

const VERBS = {
  approve: "Approve",
  reject: "Reject",
  hold: "Hold",
  approve_all: "Approve all",
  pause: "Pause auto-apply",
  resume: "Resume auto-apply",
  undo: "Undo",
  notes_read: "Mark notes read"
};

export async function handleActGet(request, env) {
  const token = new URL(request.url).searchParams.get("t");
  const v = await verifyToken(env, token);
  if (!v.ok) return page("Link not usable", `<p>${esc(v.error)}</p><p>Reply to Lexi's email instead, or use <a href="/manager/">/manager</a>.</p>`, 400);
  const p = v.payload;
  const verb = VERBS[p.a];
  if (!verb) return page("Link not usable", "<p>Unknown action.</p>", 400);

  const lines = await describeTargets(env, p);
  const reasonBox = p.a === "reject"
    ? `<p><label>Reason (optional)<br><textarea name="reason" rows="3" style="width:100%;font:inherit;"></textarea></label></p>` : "";
  const what = p.a === "pause" ? `Pause auto-apply for ${p.w} week${p.w === 1 ? "" : "s"}. Proposals keep queuing and still reach you in digests; nothing applies unless you approve it.`
    : p.a === "resume" ? "Resume auto-apply: untouched low-risk items apply 72 hours after their digest again."
    : null;

  return page(`${verb}?`, `${what ? `<p>${esc(what)}</p>` : ""}
${lines.length ? `<ul>${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
<form method="post" action="/lexi/act">
<input type="hidden" name="t" value="${esc(token)}">
${reasonBox}
<button type="submit" style="${pageButtonStyle}">${esc(verb)}</button>
</form>
<p style="font-size:14px;color:${C.muted};margin-top:24px;">This link works once and expires ${esc(new Date(p.exp * 1000).toISOString().slice(0, 16).replace("T", " "))} UTC.</p>`);
}

export async function handleActPost(request, env) {
  let form;
  try { form = await request.formData(); } catch { return page("Link not usable", "<p>Malformed request.</p>", 400); }
  const token = form.get("t");
  const v = await verifyToken(env, token);
  if (!v.ok) return page("Link not usable", `<p>${esc(v.error)}</p>`, 400);
  if (!env.GITHUB_TOKEN) return page("Server misconfigured", "<p>GITHUB_TOKEN secret not set.</p>", 500);
  const p = v.payload;
  const reason = (form.get("reason") || "").toString().trim().slice(0, 1000) || null;

  let result;
  if (p.a === "notes_read") {
    result = await commitJson(env, {
      path: NOTES_PATH, workerLabel: LABEL, parseErrorContext: "notes-for-nicole.json",
      mutate: (json) => {
        const used = consumeNonce(json, p.n);
        if (!used.ok) return used;
        const now = new Date().toISOString();
        let marked = 0;
        for (const e of json.entries || []) {
          if ((p.ids || []).includes(e.id) && e.status === "unread") { e.status = "read"; e.readAt = now; marked++; }
        }
        return { ok: true, payload: { msgs: [`Marked ${marked} note(s) read.`] } };
      },
      refreshMeta: (json, now) => {
        json.meta = json.meta || {};
        json.meta.unreadCount = (json.entries || []).filter(e => e.status === "unread").length;
        json.meta.totalCount = (json.entries || []).length;
        json.meta.generatedAt = now;
      },
      commitMessage: () => `Mark ${(p.ids || []).length} note(s) read\n\nVia signed email link.`
    });
  } else if (VERBS[p.a]) {
    result = await commitJson(env, {
      path: PROPOSALS_PATH, workerLabel: LABEL, parseErrorContext: "proposals.json",
      mutate: (json) => {
        const used = consumeNonce(json, p.n);
        if (!used.ok) return used;
        const msgs = [];
        let approved = false;
        const via = "email-link";
        if (p.a === "pause") msgs.push(setPause(json, p.w).msg);
        else if (p.a === "resume") msgs.push(setPause(json, 0).msg);
        else {
          for (const id of p.ids || []) {
            let r;
            if (p.a === "approve_all") {
              const prop = findProposal(json, id);
              // Approve all skips what Nicole already decided or put on hold.
              if (prop && prop.status === "pending" && prop.heldAt) { msgs.push(`Skipped '${proposalLabel(prop)}': on hold.`); continue; }
              r = decide(json, id, "approve", { via });
            } else if (p.a === "undo") r = undo(json, id, { via });
            else r = decide(json, id, p.a, { via, reason });
            msgs.push(r.msg);
            if (r.approved) approved = true;
          }
        }
        return { ok: true, payload: { msgs, approved } };
      },
      refreshMeta: refreshProposalsMeta,
      commitMessage: () => `Email link: ${p.a} ${(p.ids || []).length ? `${p.ids.length} proposal(s)` : ""}${p.d ? ` (digest ${p.d})` : ""}\n\nVia signed email link.`
    });
  } else {
    return page("Link not usable", "<p>Unknown action.</p>", 400);
  }

  if (!result.ok) {
    const title = result.status === 410 ? "Already done" : "That didn't work";
    return page(title, `<p>${esc(result.error)}</p>`, result.status === 410 ? 410 : 502);
  }

  let dispatchNote = "";
  if (result.payload.approved) {
    const d = await triggerLexiRunWorkflow(env, LABEL).catch(e => ({ triggered: false, error: e.message }));
    dispatchNote = d.triggered
      ? "Applying now. It's live within a few minutes, once the Lexi run finishes."
      : "Recorded. It applies on the next scheduled Lexi run (within 24h).";
  }
  return page("Done", `<ul>${result.payload.msgs.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
${dispatchNote ? `<p>${esc(dispatchNote)}</p>` : ""}
<p style="font-size:14px;color:${C.muted};">You can close this tab. <a href="/manager/" style="color:${C.accent}">/manager</a></p>`);
}

async function describeTargets(env, p) {
  if (!(p.ids || []).length || !env.GITHUB_TOKEN) return [];
  const path = p.a === "notes_read" ? NOTES_PATH : PROPOSALS_PATH;
  const file = await readJsonFile(env, path, LABEL);
  if (!file.ok || !file.json) return [];
  if (p.a === "notes_read") {
    return (file.json.entries || []).filter(e => p.ids.includes(e.id)).map(e => `${e.subject} (${e.status})`);
  }
  return p.ids.map(id => {
    const prop = findProposal(file.json, id);
    return prop ? `${proposalLabel(prop)} (${prop.action.replace(/_/g, " ")}, currently ${prop.status}${prop.heldAt ? ", on hold" : ""})` : `${id} (not found)`;
  });
}
