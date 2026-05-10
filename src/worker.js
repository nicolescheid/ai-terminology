// Worker entry point for ai-terminology.com.
//
// Routes:
//   POST /api/mark-note     → handleMarkNote     (Basic Auth + GitHub commit)
//   POST /api/mark-proposal → handleMarkProposal (Basic Auth + GitHub commit)
//   /api/*                  → 404
//   everything else         → static assets (env.ASSETS.fetch)
//
// Two secrets required (set via `npx wrangler secret put <NAME>`):
//   MARK_NOTE_PASSWORD — shared password the dashboard prompts for
//   GITHUB_TOKEN       — fine-grained PAT, contents:write on this repo
//
// Threat model: the manager dashboard and the underlying JSON files are
// readable by anyone (the repo is public on GitHub; static assets are open).
// Auth here protects WRITES only — without it, any visitor could POST and
// silently mark notes read on Nicole's behalf, defeating the spec §12.1
// pause-on-unread forcing function.

const REPO_OWNER  = "nicolescheid";
const REPO_NAME   = "ai-terminology";
const NOTES_PATH      = "knowledge-graph-agent/notes-for-nicole.json";
const PROPOSALS_PATH  = "knowledge-graph-agent/proposals.json";
const VALID_NOTE_STATUSES     = new Set(["read", "actioned", "dismissed"]);
const VALID_PROPOSAL_STATUSES = new Set(["approved", "rejected"]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/mark-note") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "POST" }
        });
      }
      return handleMarkNote(request, env);
    }
    if (url.pathname === "/api/mark-proposal") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "POST" }
        });
      }
      return handleMarkProposal(request, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    // Static assets (HTML, CSS, JSON, images, etc.)
    return env.ASSETS.fetch(request);
  }
};

async function handleMarkNote(request, env) {
  // Auth.
  if (!checkBasicAuth(request.headers.get("Authorization"), env.MARK_NOTE_PASSWORD)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ai-terminology manager"' }
    });
  }
  if (!env.GITHUB_TOKEN) {
    return new Response("Server misconfigured: GITHUB_TOKEN secret not set", { status: 500 });
  }

  // Parse + validate body.
  let body;
  try { body = await request.json(); }
  catch { return jsonError(400, "Invalid JSON body"); }
  const { id, status } = body || {};
  if (!id || typeof id !== "string") return jsonError(400, "id (string) is required");
  if (!VALID_NOTE_STATUSES.has(status)) {
    return jsonError(400, `status must be one of: ${[...VALID_NOTE_STATUSES].join(", ")}`);
  }

  // Try once; retry once on sha conflict (concurrent commit during our get/put gap).
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await tryMarkOnce({ id, status, env });
    if (result.ok) return jsonResponse(200, result);
    if (result.status !== 409 || attempt === 2) {
      return jsonError(result.status || 502, result.error || "Mark failed");
    }
  }
}

async function handleMarkProposal(request, env) {
  // Auth (same as mark-note — single shared password protects all writes).
  if (!checkBasicAuth(request.headers.get("Authorization"), env.MARK_NOTE_PASSWORD)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ai-terminology manager"' }
    });
  }
  if (!env.GITHUB_TOKEN) {
    return new Response("Server misconfigured: GITHUB_TOKEN secret not set", { status: 500 });
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonError(400, "Invalid JSON body"); }
  const { id, status, reason } = body || {};
  if (!id || typeof id !== "string") return jsonError(400, "id (string) is required");
  if (!VALID_PROPOSAL_STATUSES.has(status)) {
    return jsonError(400, `status must be one of: ${[...VALID_PROPOSAL_STATUSES].join(", ")}`);
  }
  if (reason !== undefined && typeof reason !== "string") {
    return jsonError(400, "reason, if provided, must be a string");
  }

  // Try once; retry once on sha conflict (concurrent commit during get/put gap).
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await tryMarkProposalOnce({ id, status, reason, env });
    if (result.ok) return jsonResponse(200, result);
    if (result.status !== 409 || attempt === 2) {
      return jsonError(result.status || 502, result.error || "Mark failed");
    }
  }
}

async function tryMarkProposalOnce({ id, status, reason, env }) {
  const ghHeaders = {
    "Authorization":         `Bearer ${env.GITHUB_TOKEN}`,
    "Accept":                "application/vnd.github+json",
    "X-GitHub-Api-Version":  "2022-11-28",
    "User-Agent":            "ai-terminology-mark-proposal-worker"
  };
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PROPOSALS_PATH}`;

  const getResp = await fetch(apiUrl, { headers: ghHeaders });
  if (!getResp.ok) {
    return { ok: false, status: 502, error: `GitHub fetch failed: ${getResp.status}` };
  }
  const fileMeta = await getResp.json();
  if (!fileMeta.content || !fileMeta.sha) {
    return { ok: false, status: 502, error: "GitHub response missing content/sha" };
  }

  let proposalsJson;
  try {
    proposalsJson = JSON.parse(base64ToUtf8(fileMeta.content.replace(/\n/g, "")));
  } catch (e) {
    return { ok: false, status: 502, error: "Could not parse proposals.json: " + e.message };
  }

  const proposal = (proposalsJson.proposals || []).find(p => p.id === id);
  if (!proposal) return { ok: false, status: 404, error: `Proposal id ${id} not found` };

  // Refuse to flip an already-applied or already-rejected proposal — that
  // would silently overwrite outcome state. Idempotent if the requested
  // status already matches (returns noChange).
  if (proposal.status === status) {
    return { ok: true, noChange: true, id, status };
  }
  if (proposal.status === "applied" || (proposal.status === "rejected" && status === "approved")) {
    return {
      ok: false,
      status: 409,
      error: `Cannot transition proposal from '${proposal.status}' to '${status}'.`
    };
  }

  const now = new Date().toISOString();
  proposal.status = status;
  if (status === "approved") {
    proposal.approvedAt = now;
    proposal.approvedBy = "nicole";
  } else if (status === "rejected") {
    proposal.rejectedAt = now;
    proposal.rejectedBy = "nicole";
    if (reason) proposal.rejectionReason = reason;
  }

  // Refresh meta counts to match the existing schema.
  const all = proposalsJson.proposals || [];
  proposalsJson.meta = {
    generatedAt: now,
    pendingCount:  all.filter(p => p.status === "pending").length,
    approvedCount: all.filter(p => p.status === "approved").length,
    appliedCount:  all.filter(p => p.status === "applied").length,
    rejectedCount: all.filter(p => p.status === "rejected").length,
    note: proposalsJson.meta?.note ?? "Lexi proposals queue."
  };

  const newContent    = JSON.stringify(proposalsJson, null, 2) + "\n";
  const newContentB64 = utf8ToBase64(newContent);

  const putBody = {
    // No [skip ci] — we want CF to redeploy so the manager dashboard's
    // next read of proposals.json reflects the change.
    message: `Mark proposal ${id.slice(0, 8)}… as ${status}\n\nVia /api/mark-proposal from /manager dashboard.`,
    content: newContentB64,
    sha: fileMeta.sha,
    branch: "main",
    committer: { name: "lexi-bot", email: "lexi-bot@users.noreply.github.com" }
  };

  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...ghHeaders, "content-type": "application/json" },
    body: JSON.stringify(putBody)
  });
  if (putResp.status === 409) {
    return { ok: false, status: 409, error: "sha conflict (will retry)" };
  }
  if (!putResp.ok) {
    const errText = await putResp.text();
    return { ok: false, status: 502, error: `GitHub commit failed (${putResp.status}): ${errText.slice(0, 200)}` };
  }
  const commitResult = await putResp.json();

  // Apply-on-approve: trigger the lexi-run workflow so apply-proposals.mjs
  // runs within ~5 min instead of waiting up to 24h for the next cron.
  // Best-effort: if the dispatch call fails (e.g., PAT lacks actions:write),
  // the approve still succeeded; the apply just falls back to the cron path.
  let dispatchResult = null;
  if (status === "approved") {
    dispatchResult = await triggerLexiRunWorkflow(env)
      .catch(e => ({ triggered: false, httpStatus: 0, error: e.message }));
  }

  return {
    ok: true,
    id,
    status,
    decidedAt: now,
    commitSha: commitResult.commit?.sha,
    pendingRemaining: proposalsJson.meta.pendingCount,
    dispatch: dispatchResult,
    note: buildResponseNote(status, dispatchResult)
  };
}

// POST /repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches
// Returns 204 on success, 403 if the PAT lacks actions:write, 404 if the
// workflow doesn't exist on `main`. Caller treats failure as a soft fall
// through to the next-cron apply path.
async function triggerLexiRunWorkflow(env) {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/lexi-run.yml/dispatches`;
  const resp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization":         `Bearer ${env.GITHUB_TOKEN}`,
      "Accept":                "application/vnd.github+json",
      "X-GitHub-Api-Version":  "2022-11-28",
      "User-Agent":            "ai-terminology-mark-proposal-worker",
      "content-type":          "application/json"
    },
    body: JSON.stringify({ ref: "main" })
  });
  if (resp.ok) return { triggered: true, httpStatus: resp.status };
  let errBody = null;
  try { errBody = (await resp.text()).slice(0, 200); } catch { /* ignore */ }
  return { triggered: false, httpStatus: resp.status, error: errBody };
}

function buildResponseNote(status, dispatchResult) {
  if (status === "rejected") {
    return "Rejected. Recorded with rationale for audit; no graph mutation.";
  }
  if (dispatchResult?.triggered) {
    return "Approved + apply triggered. Live within ~5 min once the lexi-run workflow finishes.";
  }
  // Approved but dispatch failed (or wasn't attempted, which shouldn't happen).
  const failHint = dispatchResult
    ? ` (Dispatch attempt got ${dispatchResult.httpStatus}; check PAT has actions:write.)`
    : "";
  return `Approved. Apply will run on the next scheduled cron (within 24h).${failHint}`;
}

async function tryMarkOnce({ id, status, env }) {
  const ghHeaders = {
    "Authorization":         `Bearer ${env.GITHUB_TOKEN}`,
    "Accept":                "application/vnd.github+json",
    "X-GitHub-Api-Version":  "2022-11-28",
    "User-Agent":            "ai-terminology-mark-note-worker"
  };
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${NOTES_PATH}`;

  // Fetch current file + sha.
  const getResp = await fetch(apiUrl, { headers: ghHeaders });
  if (!getResp.ok) {
    return { ok: false, status: 502, error: `GitHub fetch failed: ${getResp.status}` };
  }
  const fileMeta = await getResp.json();
  if (!fileMeta.content || !fileMeta.sha) {
    return { ok: false, status: 502, error: "GitHub response missing content/sha" };
  }

  let notesJson;
  try {
    notesJson = JSON.parse(base64ToUtf8(fileMeta.content.replace(/\n/g, "")));
  } catch (e) {
    return { ok: false, status: 502, error: "Could not parse notes-for-nicole.json: " + e.message };
  }

  const entry = (notesJson.entries || []).find(e => e.id === id);
  if (!entry) return { ok: false, status: 404, error: `Note id ${id} not found` };

  // Idempotent no-op if status already matches.
  if (entry.status === status) {
    return { ok: true, noChange: true, id, status, unreadCount: countUnread(notesJson) };
  }

  const now = new Date().toISOString();
  entry.status = status;
  entry.readAt = now;

  // Refresh meta to match the existing schema (mark-notes.mjs writes the same shape).
  notesJson.meta = notesJson.meta || {};
  notesJson.meta.unreadCount  = countUnread(notesJson);
  notesJson.meta.totalCount   = (notesJson.entries || []).length;
  notesJson.meta.generatedAt  = now;

  const newContent     = JSON.stringify(notesJson, null, 2) + "\n";
  const newContentB64  = utf8ToBase64(newContent);

  const putBody = {
    // Intentionally NO [skip ci]: Cloudflare Workers Static Assets respects
    // [skip ci] and skips the deploy, which would strand this very commit's
    // notes-for-nicole.json update in main without ever reaching the live
    // site. The point of the click is to update what /manager shows; a
    // commit without a deploy defeats that. Same lesson as lexi-run.yml.
    message: `Mark note ${id.slice(0, 8)}… as ${status}\n\nVia /api/mark-note from /manager dashboard.`,
    content: newContentB64,
    sha: fileMeta.sha,
    branch: "main",
    committer: { name: "lexi-bot", email: "lexi-bot@users.noreply.github.com" }
  };

  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...ghHeaders, "content-type": "application/json" },
    body: JSON.stringify(putBody)
  });
  if (putResp.status === 409) {
    return { ok: false, status: 409, error: "sha conflict (will retry)" };
  }
  if (!putResp.ok) {
    const errText = await putResp.text();
    return { ok: false, status: 502, error: `GitHub commit failed (${putResp.status}): ${errText.slice(0, 200)}` };
  }
  const commitResult = await putResp.json();
  return {
    ok: true,
    id,
    status,
    readAt: now,
    commitSha: commitResult.commit?.sha,
    unreadCount: notesJson.meta.unreadCount
  };
}

function checkBasicAuth(authHeader, expectedPassword) {
  if (!expectedPassword) return false;          // misconfigured: secret not set → all requests denied
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  let decoded;
  try { decoded = atob(authHeader.slice(6)); } catch { return false; }
  const colonIdx = decoded.indexOf(":");
  if (colonIdx < 0) return false;
  const password = decoded.slice(colonIdx + 1);  // username ignored — only password matters
  // Constant-time-ish comparison — close enough for shared-password use.
  if (password.length !== expectedPassword.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expectedPassword.charCodeAt(i);
  }
  return mismatch === 0;
}

function countUnread(notesJson) {
  return (notesJson.entries || []).filter(e => e.status === "unread").length;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function jsonError(status, message) {
  return jsonResponse(status, { error: message });
}
