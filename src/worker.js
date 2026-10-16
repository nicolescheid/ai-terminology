// Worker entry point for ai-terminology.com.
//
// Routes:
//   POST /api/mark-note     → handleMarkNote     (Basic Auth + GitHub commit)
//   POST /api/mark-proposal → handleMarkProposal (Basic Auth + GitHub commit + workflow_dispatch on approve)
//   POST /api/ask-lexi      → handleAskLexi      (PUBLIC; streamed Anthropic response, persona = lexi-interlocutor-spec §2.7)
//   POST /api/lexi/notify   → handleNotify       (Bearer LEXI_NOTIFY_TOKEN; GitHub Actions → email to Nicole)
//   GET  /lexi/act          → confirm page for a signed email link (no state change)
//   POST /lexi/act          → performs the signed link's action (single-use)
//   /api/*                  → 404
//   everything else         → static assets (env.ASSETS.fetch)
//   email()                 → replies to lexi@ai-terminology.com (src/lexi-mail/inbound.js)
//
// Secrets (set via `npx wrangler secret put <NAME>`):
//   MARK_NOTE_PASSWORD — shared password the dashboard prompts for (gates the /api/mark-* endpoints)
//   GITHUB_TOKEN       — fine-grained PAT scoped to nicolescheid/ai-terminology with
//                        contents:write (for the JSON commits) AND actions:write (for
//                        the apply-on-approve workflow_dispatch)
//   ANTHROPIC_API_KEY  — Anthropic API key for /api/ask-lexi and the email reply handler.
//   LEXI_NOTIFY_TOKEN  — shared bearer token; same value as the GitHub repo secret of
//                        the same name. Gates /api/lexi/notify.
//   LEXI_LINK_SECRET   — HMAC key for the signed links in Lexi's emails. Worker-only.
//
// Bindings: EMAIL (send_email, sender restricted to lexi@ai-terminology.com).
//
// Threat model: the manager dashboard and the underlying JSON files are
// readable by anyone (the repo is public on GitHub; static assets are open).
// Auth here protects WRITES only — without it, any visitor could POST and
// silently mark notes/proposals on Nicole's behalf, defeating the spec
// §12.1 pause-on-unread forcing function and the §5 propose-only gate.
// Email links carry their own authority (HMAC-signed, expiring, single-use);
// email replies are accepted only from Nicole's address with passing
// DKIM/DMARC (see src/lexi-mail/inbound.js).
//
// Refactor history: handleMarkNote and handleMarkProposal originally
// duplicated ~70% of their code (auth, GitHub round-trip, retry-on-409,
// commit shape). Extracted into commitJsonChange + tryCommitOnce when
// the second endpoint landed, then moved to src/github.js when the email
// channel became a second caller. Handlers are thin: they validate the body
// and supply mutate / refreshMeta / commitMessage / onSuccess / buildNote
// callbacks.

import {
  NOTES_PATH, PROPOSALS_PATH,
  commitJsonChange, refreshProposalsMeta, triggerLexiRunWorkflow,
  jsonError
} from "./github.js";
import { handleNotify } from "./lexi-mail/notify.js";
import { handleActGet, handleActPost } from "./lexi-mail/act.js";
import { handleInboundEmail } from "./lexi-mail/inbound.js";

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
    if (url.pathname === "/api/ask-lexi") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return handleAskLexi(request, env);
    }
    if (url.pathname === "/api/lexi/notify") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      return handleNotify(request, env);
    }
    if (url.pathname === "/lexi/act") {
      if (request.method === "GET" || request.method === "HEAD") return handleActGet(request, env);
      if (request.method === "POST") return handleActPost(request, env);
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
    }
    if (url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    // Static assets (HTML, CSS, JSON, images, etc.)
    return env.ASSETS.fetch(request);
  },

  // Email Routing: lexi@ai-terminology.com → this Worker.
  async email(message, env, ctx) {
    await handleInboundEmail(message, env, ctx);
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
  // Accept null as equivalent to undefined ("no reason given"). The dashboard
  // sends reason: null both for approvals (no reason field exists) and for
  // rejects when the prompt was left blank — without this, both flows 400'd.
  if (reason !== undefined && reason !== null && typeof reason !== "string") {
    return jsonError(400, "reason, if provided, must be a string or null");
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
    refreshMeta: refreshProposalsMeta,
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
// Interlocutor mode (Phase 2-A — see lexi-interlocutor-spec.md).
// ─────────────────────────────────────────────────────────────────────

// Persona section verbatim from lexi-interlocutor-spec.md §2.7. Edits to the
// persona belong in the spec first, then mirrored here. The version comment
// is the spec section it tracks so future spec edits flag this for sync.
const LEXI_PERSONA_PROMPT = `You are Lexi, a lexicographer of the AI field. You curate a knowledge graph
of AI terminology and a public longlist of terms you are watching.

You write as a working scholar in the long tradition of Ada Lovelace, Marie
Curie, and Émilie du Châtelet — precise, curious, plainspoken, comfortable
in argument, with occasional flashes of imagination and dry wit. You delight
in your subject. The pleasure is the rigour. You are eager to share what
you have read, but you share by showing, not announcing.

You speak in the first person. You have favourites and pet peeves and you
state them. You correct without apology and you accept correction without
flinching. You do not perform enthusiasm and you do not hedge as
personality. You do not use emoji, exclamation salvos, or contemporary
internet phrasings (no "deep dive", no "unpack", no "buckle up", no "vibe",
no "literally", no "obsessed", no "hot take"). You may use light Latin or
French where it is genuinely the right word.

Brevity is part of rigour. Most questions deserve two to four sentences,
sometimes one. Reach for length only when the question genuinely earns
it — a disambiguation across multiple camps, a substantive correction,
a flash of imaginative analogy that lands. Otherwise: say the thing,
then stop. False brevity (hedging, padding, restating the question back
at the reader, opening with "Great question" or its cousins) is worse
than the right number of words. Every sentence should be doing work; if
a sentence isn't, cut it. Aim for the shape of a working scholar's reply
in conversation, not a written entry.

You answer only from the context provided to you in this prompt — the graph
entry, longlist entries, and source excerpts retrieved for this turn. You
do not improvise definitions from general knowledge. If a term is not in
your context, you say so plainly and offer to add it to the longlist.

You answer questions about terms. You do not answer questions about model
recommendations, vendors, AI policy, code, or your own feelings. You decline
those gracefully and redirect to a term the reader might want to discuss.`;

const MAX_LEXI_TURNS = 20;
const MAX_LEXI_CHARS = 2000;

async function handleAskLexi(request, env) {
  // Public endpoint per Nicole 2026-05-10. Originally shipped without rate
  // limits; bot traffic in 2026-10 prompted the origin check + per-IP cap
  // below (spec §8.1). The Anthropic org-level spend limit is still the
  // backstop; persona prompt + max_tokens 350 + transcript cap bound
  // per-call cost.
  if (!env.ANTHROPIC_API_KEY) {
    return new Response("Server misconfigured: ANTHROPIC_API_KEY secret not set", { status: 500 });
  }

  // Bot/cost gates (added 2026-10 after bot traffic showed up). Only the
  // site's own pages may call this: browsers always send Origin on a POST,
  // scripts calling the endpoint directly usually don't. Then a per-IP cap
  // via the Workers rate-limit binding ("ratelimits" in wrangler.jsonc);
  // skipped if the binding is absent (e.g. local dev without it).
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return jsonError(403, "Forbidden");
  }
  if (env.LEXI_LIMITER) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.LEXI_LIMITER.limit({ key: ip });
    if (!success) return jsonError(429, "Lexi needs a breather. Try again in a minute.");
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonError(400, "Invalid JSON body"); }
  const { transcript, term } = body || {};
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return jsonError(400, "transcript (non-empty array of {role, content}) required");
  }
  // Lightly validate transcript shape; fuller validation lives upstream
  // since the browser composes it.
  for (const t of transcript) {
    if (!t || (t.role !== "user" && t.role !== "assistant") || typeof t.content !== "string") {
      return jsonError(400, "each transcript entry must be { role: 'user'|'assistant', content: string }");
    }
  }

  // Bound per-call cost: only the most recent turns, each length-capped.
  const recent = transcript.slice(-MAX_LEXI_TURNS).map(t => ({
    role: t.role,
    content: t.content.slice(0, MAX_LEXI_CHARS)
  }));
  // Anthropic requires the first message to be from the user.
  while (recent.length && recent[0].role !== "user") recent.shift();
  if (recent.length === 0) return jsonError(400, "transcript must contain a user message");

  // Build the system prompt: persona + active-term context. Term is
  // optional — persona-anchored conversations (no term in context) are
  // valid per spec §3.2 but only term-anchored is enabled in Phase 2-A.
  // Tonight we accept persona-anchored as graceful degradation rather
  // than failing — useful for testing.
  const systemPrompt = buildLexiSystemPrompt(term);

  // Call Anthropic Messages API with stream:true. The upstream returns
  // text/event-stream natively; we pipe the body through to the browser
  // unchanged. Per interlocutor spec §6.2 ("Worker proxies the upstream
  // Anthropic Messages API stream"), this is the intended architecture.
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      // Spec §8.2 caps at 800; lowered to 350 as a hard floor on
      // verbosity (the qualitative brevity instruction in the persona
      // prompt is the primary mechanism, this is the backup so a runaway
      // response can't go full essay). 350 tokens ≈ 260 words, which
      // is more than any of the spec §2.6 worked examples; legitimate
      // long answers still fit.
      max_tokens: 350,
      stream: true,
      system: systemPrompt,
      messages: recent
    })
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return new Response(`Upstream Anthropic error (${upstream.status}): ${errText.slice(0, 200)}`, { status: 502 });
  }

  // Stream-pass the upstream SSE body straight through. Browser-side
  // ReadableStream consumer reassembles content_block_delta events into
  // tokens for incremental render. cf-no-cache + connection:keep-alive
  // headers tell intermediaries this is a long-lived stream.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type":  "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "connection":    "keep-alive"
    }
  });
}

function buildLexiSystemPrompt(term) {
  if (!term) {
    // Persona-anchored fallback — no specific term in context. Lexi can
    // still discuss her own role + the project structure without
    // improvising term definitions.
    return LEXI_PERSONA_PROMPT + `

---

The reader has not opened a specific term. You may discuss your role, your
curatorial process, the graph and longlist structure, or invite them to
ask about a term they have encountered. Do not invent definitions of terms
you have not been given context for.`;
  }
  const refsLine = (term.refs || []).length > 0
    ? `\nReferences for this entry:\n${term.refs.map(r => `  ${r.n}. ${r.src}${r.q ? ` — ${r.q}` : ""}`).join("\n")}`
    : "";
  const clustersLine = (term.clusters || []).length > 0
    ? `\nClusters: ${term.clusters.join(", ")}`
    : "";
  return LEXI_PERSONA_PROMPT + `

---

The reader has opened this term on the graph:

Label: ${term.label}${term.fullName && term.fullName !== term.label ? ` (${term.fullName})` : ""}${clustersLine}

Definition (your own working entry):
${term.def || "(no definition recorded)"}
${refsLine}

Answer questions about this term. If the reader asks about a different
term that's not in this context, say so plainly and offer to look it up
or add it to the longlist.`;
}

// ─────────────────────────────────────────────────────────────────────
// Small helpers. Commit plumbing lives in src/github.js.
// ─────────────────────────────────────────────────────────────────────

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

