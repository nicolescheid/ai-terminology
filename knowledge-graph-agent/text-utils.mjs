// Pure-function text + URL helpers. No I/O, no side effects.
// Used across run.mjs, promote.mjs, apply-proposals.mjs, audit.mjs.

import crypto from "node:crypto";

/** Strip HTML entities, CDATA wrappers, and normalize. */
export function decodeEntities(value) {
  return String(value || "")
    .replace(/^<!\[CDATA\[(.*)\]\]>$/s, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Decode entities, collapse runs of whitespace, trim. */
export function collapseWhitespace(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

/** Normalize a string for general use (handles null/undefined safely). */
export function cleanText(value) {
  return collapseWhitespace(String(value || ""));
}

/** For case-insensitive label comparison. */
export function normalizeLabel(value) {
  return cleanText(value).toLowerCase();
}

/** Generate a URL-safe slug from a label. Capped at 60 chars. */
export function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Clamp + parse-int with a fallback when input is non-numeric. */
export function clampInt(value, min, max, fallback) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

/** Get the bare hostname from a URL string, www. stripped. */
export function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

/** Make a Title Case label from the last URL path segment. */
export function titleFromUrl(value) {
  try {
    const segment = new URL(value).pathname.split("/").filter(Boolean).at(-1) || "";
    return segment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  } catch {
    return value;
  }
}

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Stable short hash of a string (sha1 → first 16 hex chars). */
export function fingerprint(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 16);
}

/** Take items from N batches in round-robin order, sorted by publishedAt desc. */
export function roundRobinTake(batches, limit) {
  const queues = batches.map(batch => [...batch]);
  const selected = [];
  while (selected.length < limit) {
    let advanced = false;
    for (const queue of queues) {
      if (!queue.length || selected.length >= limit) continue;
      selected.push(queue.shift());
      advanced = true;
    }
    if (!advanced) break;
  }
  return selected.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
}

// ─── HTML parsing helpers (used by article-fetch.mjs) ─────────────────────

/** Extract the inner text of the first <tag>...</tag> match. */
export function extractTag(text, tagName) {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i").exec(text);
  return match ? match[1] : "";
}

/** Extract the href of the first <link href="..."> in an Atom entry. */
export function extractAtomLink(entry) {
  const hrefMatch = /<link\b[^>]*href="([^"]+)"[^>]*>/i.exec(entry);
  return hrefMatch ? decodeEntities(hrefMatch[1]) : "";
}

/** Find a meta tag's content by attribute=value (e.g., property="og:title"). */
export function extractMetaContent(html, attribute, value) {
  const regex = new RegExp(`<meta\\b[^>]*${attribute}=["']${escapeRegExp(value)}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const match = regex.exec(html);
  return match ? match[1] : "";
}

/** Find every <tag>...</tag> block (returns inner text array). */
export function matchBlocks(text, tagName) {
  return [...text.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"))].map(match => match[1]);
}

/** Strip HTML tags + script/style/noscript bodies, returning bare text. */
export function stripHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}
