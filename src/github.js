// GitHub Contents API plumbing shared by every Worker write path.
//
// Moved out of worker.js when the email channel (src/lexi-mail/*) became the
// second caller. Behaviour is unchanged: GET file + sha, run the caller's
// mutate, refresh meta, PUT, retry once on a 409 sha conflict. Commits go to
// main with no [skip ci], so build-stamp.yml picks them up and deploys.

export const REPO_OWNER = "nicolescheid";
export const REPO_NAME  = "ai-terminology";

export const NOTES_PATH     = "knowledge-graph-agent/notes-for-nicole.json";
export const PROPOSALS_PATH = "knowledge-graph-agent/proposals.json";
export const DIGESTS_PATH   = "knowledge-graph-agent/digests.json";

function ghHeaders(env, label) {
  return {
    "Authorization":        `Bearer ${env.GITHUB_TOKEN}`,
    "Accept":               "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent":           label
  };
}

function contentsUrl(path) {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
}

// Read-only fetch of a JSON file on main. Returns { ok, json, sha } or
// { ok:false, status, error }. A missing file (404) returns ok:true with
// json:null so callers can fall back to an empty structure.
export async function readJsonFile(env, path, label = "ai-terminology-worker") {
  const resp = await fetch(`${contentsUrl(path)}?ref=main`, { headers: ghHeaders(env, label) });
  if (resp.status === 404) return { ok: true, json: null, sha: null };
  if (!resp.ok) return { ok: false, status: 502, error: `GitHub fetch failed: ${resp.status}` };
  const meta = await resp.json();
  try {
    return { ok: true, json: JSON.parse(base64ToUtf8((meta.content || "").replace(/\n/g, ""))), sha: meta.sha };
  } catch (e) {
    return { ok: false, status: 502, error: `Could not parse ${path}: ${e.message}` };
  }
}

/**
 * Fetch → mutate → refreshMeta → PUT, retrying once on a 409. Returns a plain
 * result object (not a Response) so non-HTTP callers (the email handler) can
 * use it:
 *   { ok:true, noChange?, payload, commitSha? } | { ok:false, status, error }
 *
 * Options: path, workerLabel, parseErrorContext, mutate(json) → { ok,
 * noChange?, status?, error?, payload? }, refreshMeta(json, now),
 * commitMessage(). mutate must be safe to run twice (the 409 retry re-runs it
 * against the fresh file).
 */
export async function commitJson(env, opts) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await tryCommitOnce(env, opts);
    if (result.ok) return result;
    if (result.status !== 409 || attempt === 2) return result;
  }
}

/**
 * HTTP wrapper around commitJson used by the /api/mark-* endpoints. Options
 * as commitJson, plus:
 *   onSuccess: optional async (env, payload) => any, run after a real commit;
 *              its return value is added to the response as `dispatch`.
 *   buildNote: optional (payload, sideEffect) => string for the manager UI.
 */
export async function commitJsonChange(env, opts) {
  const result = await commitJson(env, opts);
  if (!result.ok) return jsonError(result.status || 502, result.error || "Failed");
  if (result.noChange) return jsonResponse(200, { ok: true, noChange: true, ...result.payload });
  const sideEffect = opts.onSuccess ? await opts.onSuccess(env, result.payload) : null;
  const note = opts.buildNote ? opts.buildNote(result.payload, sideEffect) : undefined;
  return jsonResponse(200, {
    ok: true,
    ...result.payload,
    ...(result.commitSha ? { commitSha: result.commitSha } : {}),
    ...(sideEffect !== null && sideEffect !== undefined ? { dispatch: sideEffect } : {}),
    ...(note ? { note } : {})
  });
}

async function tryCommitOnce(env, opts) {
  const headers = ghHeaders(env, opts.workerLabel);
  const apiUrl = contentsUrl(opts.path);

  const getResp = await fetch(apiUrl, { headers });
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

  const mutResult = opts.mutate(json);
  if (!mutResult.ok) {
    return { ok: false, status: mutResult.status || 400, error: mutResult.error };
  }
  if (mutResult.noChange) {
    return { ok: true, noChange: true, payload: mutResult.payload };
  }

  const now = new Date().toISOString();
  if (opts.refreshMeta) opts.refreshMeta(json, now);
  const newContent = JSON.stringify(json, null, 2) + "\n";

  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      message: opts.commitMessage(),
      content: utf8ToBase64(newContent),
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
  return { ok: true, payload: mutResult.payload, commitSha: commitResult.commit?.sha };
}

// POST /repos/{owner}/{repo}/actions/workflows/lexi-run.yml/dispatches.
// 204 on success, 403 if the PAT lacks actions:write. Callers treat failure
// as a soft fall-through to the next cron run.
export async function triggerLexiRunWorkflow(env, label = "ai-terminology-mark-proposal-worker") {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/lexi-run.yml/dispatches`;
  const resp = await fetch(apiUrl, {
    method: "POST",
    headers: { ...ghHeaders(env, label), "content-type": "application/json" },
    body: JSON.stringify({ ref: "main" })
  });
  if (resp.ok) return { triggered: true, httpStatus: resp.status };
  let errBody = null;
  try { errBody = (await resp.text()).slice(0, 200); } catch { /* ignore */ }
  return { triggered: false, httpStatus: resp.status, error: errBody };
}

// Proposal-queue meta, shared by mark-proposal and the email actions.
export function refreshProposalsMeta(json, now) {
  const all = json.proposals || [];
  json.meta = {
    generatedAt: now,
    pendingCount:  all.filter(p => p.status === "pending").length,
    approvedCount: all.filter(p => p.status === "approved").length,
    appliedCount:  all.filter(p => p.status === "applied").length,
    rejectedCount: all.filter(p => p.status === "rejected").length,
    note: json.meta?.note ?? "Lexi proposals queue."
  };
}

export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

export function jsonError(status, message) {
  return jsonResponse(status, { error: message });
}
