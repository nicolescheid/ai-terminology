// Notes for Nicole — Lexi's manager channel (spec §6).
//
// Structured channel where Lexi writes things that need Nicole's attention.
// NOT a freeform diary. Entries fall into mandatory types (must be written
// when triggering condition is met) and discretionary observations.
//
// This module provides the schema, the contested-cluster heuristic
// (mandatory entry type 5), and a helper to build entries. The triggering
// logic for each entry type lives in run.mjs (or, for source-pattern flags,
// in the auditor agent — Phase F).

import crypto from "node:crypto";

// Mandatory entry types from spec §6, plus DISCRETIONARY for non-mandatory
// observations Lexi may write (encouraged but not required).
export const ENTRY_TYPES = Object.freeze({
  REVERSAL_LATE: "reversal_late",                       // §6.1
  REVERSAL_CONTRADICTION: "reversal_contradiction",     // §6.2
  LOW_CONFIDENCE_PASS: "low_confidence_pass",           // §6.3 — needs self-eval (Phase F)
  SOURCE_PATTERN: "source_pattern",                     // §6.4 — written by auditor (Phase F)
  CONTESTED_CLUSTER_OMISSION: "contested_cluster_omission", // §6.5 — implemented in Phase D
  TRUSTED_SOURCE_PROPOSAL: "trusted_source_proposal",   // §6.6 — needs trusted-source mechanism
  NEAR_MISS_WEEK: "near_miss_week",                     // §6.7 — needs self-eval (Phase F)
  DEFAULT_DENY: "default_deny",                         // §6.8 — implemented in Phase D
  DISCRETIONARY: "discretionary"
});

// Per spec §10. Non-exhaustive list of AI terms where the definition itself
// is the political battleground. When Lexi proposes one of these without
// naming the contestation, an entry type 5 is written so Nicole can intervene.
//
// Kept in lowercase for case-insensitive comparison. Update as the field's
// vocabulary evolves; the spec calls out this list as living.
export const CONTESTED_CLUSTER_TERMS = Object.freeze([
  "alignment",
  "agentic",
  "open-weights",
  "open weights",
  "open source",
  "agi",
  "superintelligence",
  "ai safety",
  "ai ethics",
  "responsible ai",
  "ai welfare",
  "frontier model",
  "frontier ai",
  "catastrophic risk",
  "existential risk",
  "x-risk",
  "p(doom)",
  "doomer"
]);

// Contestation markers — phrases Lexi might use in a working definition that
// indicate it has acknowledged the term is contested. If at least one of these
// appears in the def, we DON'T flag (the def is doing its job).
const CONTESTATION_MARKERS = [
  "contested",
  "debated",
  "different camps",
  "no consensus",
  "different framings",
  "varies by",
  "depending on who",
  "the contestation",
  "different definitions",
  "framing depends on",
  "definitionally contested",
  "is used by",
  "is used to mean"
];

// Returns null if the candidate is not contested OR if the def already names
// the contestation. Returns { matchedTerm, ... } if a Notes for Nicole entry
// should be written. Conservative — false positives (flagging defs that DO
// acknowledge contestation in their own way) are preferable to false negatives.
export function detectContestedOmission(termLabel, termFullName, workingDef) {
  const candidates = [termLabel, termFullName].filter(Boolean).map(s => s.toLowerCase());
  const matched = CONTESTED_CLUSTER_TERMS.find(contested =>
    candidates.some(c => c === contested || c.includes(contested))
  );
  if (!matched) return null;

  const defLower = (workingDef || "").toLowerCase();
  const acknowledgesContestation = CONTESTATION_MARKERS.some(m => defLower.includes(m));
  if (acknowledgesContestation) return null;

  return {
    matchedTerm: matched,
    workingDef: workingDef || ""
  };
}

// Build a Notes for Nicole entry. The id is deterministic per
// (type + subject + writtenAt) so re-runs that re-trigger the same condition
// will produce a new entry per run (the writtenAt component differs); this
// preserves the temporal trail rather than silently deduping.
export function buildNote({ type, runId, phase, subject, details, evidence, suggestedAction, writtenAt }) {
  const ts = writtenAt || new Date().toISOString();
  const id = crypto.createHash("sha1")
    .update(`${type}|${subject}|${ts}`)
    .digest("hex").slice(0, 16);
  return {
    id,
    type,
    writtenAt: ts,
    runId,
    phase,
    status: "unread",
    subject,
    details: details || "",
    evidence: evidence || null,
    suggestedAction: suggestedAction || null
  };
}
