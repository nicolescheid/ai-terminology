// Longlist-flow logic: candidate classification + entry construction +
// source merging + proposal building + review-cursor selection.
// Pure functions — no I/O.

import crypto from "node:crypto";
import { ACTIONS } from "./actions.mjs";
import { cleanText, clampInt, hostnameFromUrl, normalizeLabel, slugify } from "./text-utils.mjs";

/**
 * Classify a candidate proposal from the model and return the corresponding
 * spec action plus routing info. Three outcomes:
 *   - REJECT_CANDIDATE — matches an existing graph (Tier 1) node, or is invalid.
 *   - INCREMENT_LONGLIST_SOURCE — matches an existing longlist (Tier 2) entry;
 *     the caller should append a new source to that entry.
 *   - ADD_TO_LONGLIST — genuinely new term; the caller should create a new
 *     longlist entry with one source.
 */
export function classifyCandidate(candidate, graphNodes, longlistEntries, clusters) {
  const label = cleanText(candidate.label);
  if (!label) return { action: ACTIONS.REJECT_CANDIDATE, reason: "empty label" };
  const labelKey = normalizeLabel(label);

  if (graphNodes.some(n => normalizeLabel(n.label) === labelKey || normalizeLabel(n.fullName || "") === labelKey)) {
    return { action: ACTIONS.REJECT_CANDIDATE, reason: "already in graph (label match)" };
  }

  const id = slugify(candidate.id || label);
  if (!id) return { action: ACTIONS.REJECT_CANDIDATE, reason: "could not generate id" };

  if (graphNodes.some(n => n.id === id)) {
    return { action: ACTIONS.REJECT_CANDIDATE, reason: "already in graph (id match)" };
  }

  const longlistMatch = longlistEntries.find(entry =>
    entry.id === id ||
    normalizeLabel(entry.label) === labelKey ||
    normalizeLabel(entry.fullName || "") === labelKey
  );

  const cleaned = {
    ...candidate,
    id,
    label,
    fullName: cleanText(candidate.fullName || ""),
    def: cleanText(candidate.def || ""),
    clusters: candidate.clusters || [],
    rels: candidate.rels || [],
    reason: cleanText(candidate.reason || "")
  };

  if (longlistMatch) {
    return { action: ACTIONS.INCREMENT_LONGLIST_SOURCE, target: longlistMatch.id, candidate: cleaned };
  }
  return { action: ACTIONS.ADD_TO_LONGLIST, candidate: cleaned };
}

/** Build a source-citation record from an article observation. */
export function buildSourceRef(article, observedAt) {
  return {
    url: article.url,
    domain: hostnameFromUrl(article.url),
    title: article.title,
    sourceLabel: article.sourceLabel,
    publishedAt: article.publishedAt,
    firstSeen: observedAt
  };
}

/** Construct a fresh longlist entry from a (cleaned) candidate + first-source article. */
export function buildLonglistEntry(candidate, article, observedAt, clusters) {
  const validClusters = [...new Set((candidate.clusters || []).filter(c => clusters[c]))];
  // Suggested rels stored verbatim — they're only consulted at promotion time,
  // when targets can be re-validated against the graph that exists then.
  const rels = [...new Set((candidate.rels || []).map(r => slugify(r)).filter(Boolean))];
  const source = buildSourceRef(article, observedAt);
  const entry = {
    id: candidate.id,
    label: candidate.label,
    workingDef: candidate.def,
    clusters: validClusters.length ? validClusters : ["technical"],
    suggestedRels: rels,
    sources: [source],
    sourceCount: 1,
    independentSourceCount: 1,
    dateFirstSeen: observedAt,
    dateLastSeen: observedAt,
    sz: clampInt(candidate.sz, 14, 20, 16)
  };
  if (candidate.fullName && candidate.fullName !== candidate.label) {
    entry.fullName = candidate.fullName;
  }
  if (candidate.nodeType === "product" || candidate.nodeType === "initiative") {
    entry.nodeType = candidate.nodeType;
  }
  if (candidate.reason) {
    entry.proposalReason = candidate.reason;
  }
  return entry;
}

/**
 * Merge a new source into an existing longlist entry. Returns true if a new
 * source was added (URL not already present); false on dedupe. dateLastSeen
 * is bumped unconditionally (even on dedupe) to record the resighting.
 */
export function mergeSourceIntoEntry(entry, newSource, observedAt) {
  entry.dateLastSeen = observedAt;
  if (entry.sources.some(s => s.url === newSource.url)) {
    return false;
  }
  entry.sources.push(newSource);
  entry.sourceCount = entry.sources.length;
  entry.independentSourceCount = new Set(entry.sources.map(s => s.domain)).size;
  return true;
}

/**
 * Pick `limit` graph nodes for definition review starting at the persisted
 * cursor (sorted by id alphabetically). Wraps around if cursor + limit would
 * exceed the array. Caller is responsible for advancing the cursor afterward.
 */
export function pickNodesForReview(nodes, state, limit) {
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const start = Math.max(0, Math.min(state.reviewCursor || 0, sorted.length));
  const selected = [];
  for (let offset = 0; offset < Math.min(limit, sorted.length); offset += 1) {
    selected.push(sorted[(start + offset) % sorted.length]);
  }
  return selected;
}

/**
 * Build a proposal record for the proposals queue. The id is sha-1 of
 * (action, target.kind, target.id, generatedAt) — within a single run,
 * same target + same action dedupes; across runs, the timestamp keeps
 * historical proposals distinguishable.
 */
export function buildProposal(action, target, payload, reason, source, generatedAt, gate) {
  const id = crypto.createHash("sha1")
    .update(`${action}|${target?.kind ?? ""}|${target?.id ?? ""}|${generatedAt}`)
    .digest("hex").slice(0, 16);
  return {
    id,
    action,
    gate,
    proposedAt: generatedAt,
    status: "pending",
    source,
    target,
    payload,
    reason: reason || ""
  };
}

/**
 * Upsert an item into a list keyed by id. Returns a new array; existing
 * entries are merged with the incoming via Object.assign.
 */
export function upsertById(items, incoming) {
  const map = new Map((items || []).map(item => [item.id, item]));
  map.set(incoming.id, { ...(map.get(incoming.id) || {}), ...incoming });
  return [...map.values()];
}

/**
 * Build a small refs[] array from the most recent N articles. Used to
 * populate the refs field on a graph node when a definition refresh or
 * promotion is approved.
 */
export function nextRefsFromSources(articles) {
  return articles.slice(0, 2).map((article, index) => ({
    n: index + 1,
    src: `${article.sourceLabel}${article.publishedAt ? `, ${article.publishedAt}` : ""}`,
    q: `${article.title} ${article.sourceLabel}`.trim()
  }));
}
