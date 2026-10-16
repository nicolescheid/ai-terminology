// Signed action links for Lexi's emails.
//
// A token is base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload)),
// keyed by the LEXI_LINK_SECRET Worker secret. The payload carries everything
// the action needs, so the link alone is the authority:
//   a   action     approve | reject | hold | approve_all | pause | resume |
//                  undo | notes_read
//   ids proposal or note ids the action applies to
//   d   digest id  (digest actions; lets the result page link back)
//   w   weeks      (pause)
//   n   nonce      random; recorded on use so each link works once
//   exp expiry     unix seconds
//
// Expiry and the signature are checked here. Single-use is enforced where the
// action is committed: the nonce goes into the target file's `usedLinks` map
// inside the same GitHub commit as the change, so a 409 retry or a second
// click sees it (see act.js / ops.js).
//
// GET of a link never changes state. Mail scanners prefetch links, so the GET
// renders a confirm page whose button POSTs the token back.

export const SITE = "https://ai-terminology.com";

const enc = new TextEncoder();

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function b64urlFromBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64url(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function newNonce() {
  return b64urlFromBytes(crypto.getRandomValues(new Uint8Array(12)));
}

export async function signToken(env, payload, ttlSeconds) {
  if (!env.LEXI_LINK_SECRET) throw new Error("LEXI_LINK_SECRET secret not set");
  const body = { ...payload, n: payload.n || newNonce(), exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const bodyB64 = b64urlFromBytes(enc.encode(JSON.stringify(body)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env.LEXI_LINK_SECRET), enc.encode(bodyB64));
  return `${bodyB64}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

export async function signLink(env, payload, ttlSeconds) {
  return `${SITE}/lexi/act?t=${await signToken(env, payload, ttlSeconds)}`;
}

// Returns { ok:true, payload } or { ok:false, error }. Uses crypto.subtle.verify,
// which compares in constant time.
export async function verifyToken(env, token) {
  if (!env.LEXI_LINK_SECRET) return { ok: false, error: "Links are not configured on the server." };
  if (typeof token !== "string" || token.length > 4096) return { ok: false, error: "Malformed link." };
  const dot = token.indexOf(".");
  if (dot < 1) return { ok: false, error: "Malformed link." };
  const bodyB64 = token.slice(0, dot);
  let sig;
  try { sig = bytesFromB64url(token.slice(dot + 1)); } catch { return { ok: false, error: "Malformed link." }; }
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(env.LEXI_LINK_SECRET), sig, enc.encode(bodyB64));
  if (!valid) return { ok: false, error: "This link's signature doesn't check out." };
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(bytesFromB64url(bodyB64))); }
  catch { return { ok: false, error: "Malformed link." }; }
  if (!payload.exp || payload.exp < Date.now() / 1000) return { ok: false, error: "This link has expired.", payload };
  return { ok: true, payload };
}

export const TTL = {
  digest: 7 * 24 * 3600,   // comfortably past the 72h auto-apply window
  undo: 14 * 24 * 3600,
  notes: 14 * 24 * 3600
};
