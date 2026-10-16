// Risk tiers for proposals: which ones auto-apply 72h after the digest if
// Nicole doesn't touch them, and which always wait for her.
//
//   auto    New terms with ≥2 independent sources that aren't in a contested
//           cluster and that the reviewer passed (sources support the
//           definition, no duplicate, not a fad). Minor edits to existing
//           definitions (typo-sized text changes, or refs-only changes).
//   nicole  Contested-cluster terms (spec §10, contested-terms.json),
//           substantive definition edits, anything the reviewer flagged,
//           anything the reviewer didn't run on, every other action type.
//
// Pure functions; no I/O. Fail-safe: when in doubt the answer is "nicole".

import { ACTIONS } from "./actions.mjs";

const auto = (reason) => ({ tier: "auto", tierReason: reason });
const nicole = (reason) => ({ tier: "nicole", tierReason: reason });

// Does this label/fullName touch a contested-cluster term? Same trigger rule
// as notes.mjs detectContestedOmission (label or alias, case-insensitive
// substring), but without the "def already names the contestation" escape:
// a contested term always waits for Nicole, however well it's framed.
export function matchContested(labels, contestedTerms) {
  const candidates = labels.filter(Boolean).map(s => s.toLowerCase());
  for (const t of contestedTerms?.terms || []) {
    const triggers = [t.label, ...(t.aliases || [])].filter(Boolean).map(s => s.toLowerCase());
    if (triggers.some(tr => candidates.some(c => c === tr || c.includes(tr)))) return t.label;
  }
  return null;
}

function normalize(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// "minor" = identical text (refs-only change) or a typo-sized edit: at most
// 12 characters and 3% of the definition changed, with no number or date
// changed (a changed figure is a factual edit, however short).
export function classifyEdit(oldDef, newDef) {
  const a = normalize(oldDef);
  const b = normalize(newDef);
  if (!a) return "substantive";
  if (a === b) return "minor";
  const numbers = s => (s.match(/\d+(?:[.,]\d+)?/g) || []).join(",");
  if (numbers(a) !== numbers(b)) return "substantive";
  const d = levenshtein(a, b);
  return d <= 12 && d <= Math.ceil(a.length * 0.03) ? "minor" : "substantive";
}

/**
 * proposal: proposals.json entry. ctx:
 *   review         the reviewer's verdict (proposal.review), or null
 *   entry          the longlist entry (promotions)
 *   currentDef     the node's live definition (edits)
 *   contestedTerms contested-terms.json
 */
export function computeTier(proposal, { review, entry, currentDef, contestedTerms }) {
  const node = proposal.payload?.graphNode;
  const labels = [node?.label, node?.fullName, entry?.label, entry?.fullName, proposal.target?.id];
  const contested = matchContested(labels, contestedTerms);
  if (contested) return nicole(`contested cluster (§10: ${contested})`);
  if (!review) return nicole("the reviewer didn't run");
  if (review.verdict === "flag") return nicole(`reviewer flagged it${(review.flags || []).length ? `: ${review.flags.join(", ").replace(/_/g, " ")}` : ""}`);

  if (proposal.action === ACTIONS.PROMOTE_TO_GRAPH) {
    const sources = entry?.sources || [];
    const independent = entry?.independentSourceCount ?? new Set(sources.map(s => s.domain).filter(Boolean)).size;
    if (independent < 2) return nicole(`only ${independent} independent source(s)`);
    if (review.duplicate_of) return nicole(`may duplicate '${review.duplicate_of}'`);
    if (review.is_fad) return nicole("reviewer thinks it may be a passing fad");
    if (review.sources_support !== "supports") return nicole(`reviewer says sources ${String(review.sources_support).replace(/_/g, " ")}`);
    if (review.contested_framing === "missing") return nicole("reviewer says it needs contested framing");
    return auto(`new term, ${independent} independent sources, reviewer passed`);
  }

  if (proposal.action === ACTIONS.EDIT_GRAPH_DEF_SUBSTANTIVE || proposal.action === ACTIONS.EDIT_GRAPH_DEF_MINOR) {
    const size = classifyEdit(currentDef, proposal.payload?.def);
    if (size === "minor" && review.edit_size !== "substantive") return auto("minor edit (typo, source or ref)");
    return nicole("substantive edit to an existing definition");
  }

  return nicole(`${String(proposal.action).replace(/_/g, " ")} always needs you`);
}
