// Worker entry point for ai-terminology.com.
//
// Routes:
//   POST /api/mark-note     → handleMarkNote     (Basic Auth + GitHub commit)
//   POST /api/mark-proposal → handleMarkProposal (Basic Auth + GitHub commit + workflow_dispatch on approve)
//   /api/*                  → 404
//   everything else         → static assets (env.ASSETS.fetch)
//
// Two secrets required (set via `npx wrangler secret put <NAME>`):
//   MARK_NOTE_PASSWORD — shared password the dashboard prompts for (gates ALL write endpoints)
//   GITHUB_TOKEN       — fine-grained PAT scoped to nicolescheid/ai-terminology with
//                        contents:write (for the JSON commits) AND actions:write (for
//                        the apply-on-approve workflow_dispatch)
//
// Threat model: the manager dashboard and the underlying JSON files are
// readable by anyone (the repo is public on GitHub; static assets are open).
// Auth here protects WRITES only — without it, any visitor could POST and
// silently mark notes/proposals on Nicole's behalf, defeating the spec
// §12.1 pause-on-unread forcing function and the §5 propose-only gate.
//
// Refactor history: handleMarkNote and handleMarkProposal originally
// duplicated ~70% of their code (auth, GitHub round-trip, retry-on-409,
// commit shape). Extracted into commitJsonChange + tryCommitOnce when
// the second endpoint landed (rule of three triggered when prompt-engineering
// became the 12th contested term and a third write endpoint felt nearby —
// this consolidation is the prep). Handlers are now thin: they validate
// the body and supply mutate / refreshMeta / commitMessage / onSuccess /
// buildNote callbacks.

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
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return handleMarkNote(request, env);
    }
    if (url.pathname === "/api/mark-proposal") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
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

// ─────────────────────────────────────────────────────────────────────
// Endpoint handlers — thin. Validate body; delegate to commitJsonChange.
// ─────────────────────────────────────────────────────────────────────

async function handleMarkNote(request, env) {
  // Auth gate FIRST — preserves original precedence so unauthenticated
  // callers get 401, not 400, even when their body is also malformed.
  const authError = requireAuth(request, env);
  if (authError) return authError;

  let body;
  try { body = await request.json(); }
  catch { return jsonError(400, "Invalid JSON body"); }
  const { id, status } = body || {};
  if (!id || typeof id !== "string") return jsonError(400, "id (string) is required");
  if (!VALID_NOTE_STATUSES.has(status)) {
    return jsonError(400, `status must be one of: ${[...VALID_NOTE_STATUSES].join(", ")}`);
  }

  return commitJsonChange(env, {
    path: NOTES_PATH,
    workerLabel: "ai-terminology-mark-note-worker",
    parseErrorContext: "notes-for-nicole.json",
    mutate: (json) => {
      const entry = (json.entries || []).find(e => e.id === id);
      if (!entry) return { ok: false, status: 404, error: `Note id ${id} not found` };
      if (entry.status === status) {
        return { ok: true, noChange: true, payload: { id, status, unreadCount: countUnread(json) } };
      }
      const now = new Date().toISOString();
      entry.status = status;
      entry.readAt = now;
      return { ok: true, payload: { id, status, readAt: now, unreadCount: countUnread(json) } };
    },
    refreshMeta: (json, now) => {
      json.meta = json.meta || {};
      json.meta.unreadCount = countUnread(json);
      json.meta.totalCount = (json.entries || []).length;
      json.meta.generatedAt = now;
    },
    commitMessage: () => `Mark note ${id.slice(0, 8)}… as ${status}\n\nVia /api/mark-note from /manager dashboard.`
  });
}

async function handleMarkProposal(request, env) {
  const authError = requireAuth(request, env);
  if (authError) return authError;

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

  return commitJsonChange(env, {
    path: PROPOSALS_PATH,
    workerLabel: "ai-terminology-mark-proposal-worker",
    parseErrorContext: "proposals.json",
    mutate: (json) => {
      const proposal = (json.proposals || []).find(p => p.id === id);
      if (!proposal) return { ok: false, status: 404, error: `Proposal id ${id} not found` };
      // Refuse to flip an already-applied or already-rejected proposal — that
      // would silently overwrite outcome state. Idempotent if the requested
      // status already matches (returns noChange).
      if (proposal.status === status) {
        return { ok: true, noChange: true, payload: { id, status } };
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
      const all = json.proposals || [];
      return {
        ok: true,
        payload: {
          id,
          status,
          decidedAt: now,
          pendingRemaining: all.filter(p => p.status === "pending").length
        }
      };
    },
    refreshMeta: (json, now) => {
      const all = json.proposals || [];
      json.meta = {
        generatedAt: now,
        pendingCount:  all.filter(p => p.status === "pending").length,
        approvedCount: all.filter(p => p.status === "approved").length,
        appliedCount:  all.filter(p => p.status === "applied").length,
        rejectedCount: all.filter(p => p.status === "rejected").length,
        note: json.meta?.note ?? "Lexi proposals queue."
      };
    },
    commitMessage: () => `Mark proposal ${id.slice(0, 8)}… as ${status}\n\nVia /api/mark-proposal from /manager dashboard.`,
    // Apply-on-approve: trigger the lexi-run workflow so apply-proposals.mjs
    // runs within ~5 min instead of waiting up to 24h for the next cron.
    // Best-effort: if the dispatch call fails (e.g., PAT lacks actions:write),
    // the approve still succeeded; the apply just falls back to the cron path.
    onSuccess: async (env, payload) => {
      if (payload.status !== "approved") return null;
      return triggerLexiRunWorkflow(env)
        .catch(e => ({ triggered: false, httpStatus: 0, error: e.message }));
    },
    buildNote: (payload, dispatch) => buildProposalNote(payload.status, dispatch)
  });
}

// ─────────────────────────────────────────────────────────────────────
// Shared write-endpoint plumbing.
// ─────────────────────────────────────────────────────────────────────

/**
 * Auth-gates, fetches the target JSON file via GitHub Contents API, runs
 * the caller's mutate function, refreshes meta, commits via PUT, retries
 * once on 409 sha conflict. Returns either a success Response (with the
 * assembled payload) or an error Response (with the appropriate status).
 *
 * Options:
 *   path:              GitHub repo-relative path of the file to mutate.
 *   workerLabel:       User-Agent for GitHub API calls (per-endpoint label
 *                      for forensic clarity in GitHub's audit log).
 *   parseErrorContext: human-readable file descriptor for parse errors.
 *   mutate:            (json) => { ok, noChange?, status?, error?, payload? }
 *                        - ok:false → helper returns jsonError(status, error)
 *                        - ok:true + noChange:true → helper returns the
 *                          payload as-is without performing a PUT
 *                        - ok:true → mutation is committed; payload becomes
 *                          the response body
 *   refreshMeta:       (json, now) => void. Called between mutate and PUT.
 *   commitMessage:     () => string. Called to build the GitHub commit message.
 *                      Intentionally NO [skip ci] — Cloudflare honours it
 *                      and we want each write to redeploy.
 *   onSuccess:         Optional. async (env, payload) => any. Called after
 *                      successful commit. Return value is added to the
 *                      response under `dispatch` (used by mark-proposal for
 *                      the workflow_dispatch side effect).
 *   buildNote:         Optional. (payload, sideEffect) => string. Builds the
 *                      human-readable summary the manager UI surfaces in its
 *                      confirmation indicator.
 */
async function commitJsonChange(env, opts) {
  // Auth + token presence are caller's responsibility (via requireAuth)
  // so 401/500 take precedence over body-validation 400s. By the time we
  // reach here the call is authenticated and the GITHUB_TOKEN is set.

  // Try once; retry once on 409 sha conflict.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await tryCommitOnce(env, opts);
    if (result.ok) {
      // No-change short-circuit: caller returned noChange, no PUT happened,
      // no side effect should fire (nothing changed).
      if (result.noChange) {
        return jsonResponse(200, { ok: true, noChange: true, ...result.payload });
      }
      // Successful commit. Run the optional side effect (e.g. workflow_dispatch).
      const sideEffect = opts.onSuccess
        ? await opts.onSuccess(env, result.payload)
        : null;
      const note = opts.buildNote ? opts.buildNote(result.payload, sideEffect) : undefined;
      return jsonResponse(200, {
        ok: true,
        ...result.payload,
        ...(result.commitSha ? { commitSha: result.commitSha } : {}),
        ...(sideEffect !== null && sideEffect !== undefined ? { dispatch: sideEffect } : {}),
        ...(note ? { note } : {})
      });
    }
    if (result.status !== 409 || attempt === 2) {
      return jsonError(result.status || 502, result.error || "Failed");
    }
  }
}

async function tryCommitOnce(env, opts) {
  const ghHeaders = {
    "Authorization":         `Bearer ${env.GITHUB_TOKEN}`,
    "Accept":                "application/vnd.github+json",
    "X-GitHub-Api-Version":  "2022-11-28",
    "User-Agent":            opts.workerLabel
  };
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${opts.path}`;

  // GET current file + sha.
  const getResp = await fetch(apiUrl, { headers: ghHeaders });
  if (!getResp.ok) {
    return { ok: false, status: 502, error: `GitHub fetch failed: ${getResp.status}` };
  }
  const fileMeta = await getResp.json();
  if (!fileMeta.content || !fileMeta.sha) {
    return { ok: false, status: 502, error: "GitHub response missing content/sha" };
  }

  let json;
  try {
    json = JSON.parse(base64ToUtf8(fileMeta.content.replace(/\n/g, "")));
  } catch (e) {
    return { ok: false, status: 502, error: `Could not parse ${opts.parseErrorContext}: ${e.message}` };
  }

  // Run caller's mutate. The mutate function may set noChange (skip PUT)
  // or return ok:false with a status/error (validation failure).
  const mutResult = opts.mutate(json);
  if (!mutResult.ok) {
    return { ok: false, status: mutResult.status || 400, error: mutResult.error };
  }
  if (mutResult.noChange) {
    return { ok: true, noChange: true, payload: mutResult.payload };
  }

  // Refresh meta + serialize.
  const now = new Date().toISOString();
  if (opts.refreshMeta) opts.refreshMeta(json, now);
  const newContent    = JSON.stringify(json, null, 2) + "\n";
  const newContentB64 = utf8ToBase64(newContent);

  // PUT.
  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...ghHeaders, "content-type": "application/json" },
    body: JSON.stringify({
      message: opts.commitMessage(),
      content: newContentB64,
      sha: fileMeta.sha,
      branch: "main",
      committer: { name: "lexi-bot", email: "lexi-bot@users.noreply.github.com" }
    })
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
    payload: mutResult.payload,
    commitSha: commitResult.commit?.sha
  };
}

// ─────────────────────────────────────────────────────────────────────
// Side effects + small helpers.
// ─────────────────────────────────────────────────────────────────────

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

function buildProposalNote(status, dispatchResult) {
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

// Auth gate. Returns null on success (caller proceeds), or a Response
// (caller short-circuits with that). Handlers call this BEFORE body
// parsing so unauthenticated callers get a 401, not a 400, even when
// their body is also malformed — matches the original pre-refactor
// precedence and avoids leaking endpoint-specific validation behaviour
// to unauthenticated probers.
function requireAuth(request, env) {
  if (!checkBasicAuth(request.headers.get("Authorization"), env.MARK_NOTE_PASSWORD)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ai-terminology manager"' }
    });
  }
  if (!env.GITHUB_TOKEN) {
    return new Response("Server misconfigured: GITHUB_TOKEN secret not set", { status: 500 });
  }
  return null;
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
