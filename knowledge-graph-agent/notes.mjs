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
  THROUGHPUT_CAP_HIT: "throughput_cap_hit",             // §12.4 — implemented in Phase E
  RUN_PAUSED: "run_paused",                             // §12.1 — implemented in Phase E (informational; the unread notes themselves are the trigger)
  DISCRETIONARY: "discretionary"
});

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

/**
 * Spec §10 post-hoc detector — fires when a candidate's label or fullName
 * matches a contested-cluster term but the working def doesn't acknowledge
 * the contestation. Belt-and-braces against the inoculation list (loaded
 * from contested-terms.json and folded into the extract prompt) failing
 * to land the framing instruction.
 *
 * The contestedTerms argument is the parsed contested-terms.json shape
 * ({ meta, terms: [...] }). Match logic walks each term's label + aliases
 * and tests case-insensitive substring inclusion against the candidate's
 * label / fullName.
 *
 * Returns null when the candidate isn't a contested-list match, or when
 * the def already includes a contestation marker (def is doing its job).
 * Returns { matchedTerm: string, matchedEntry: full-entry, workingDef }
 * when an entry type 5 (CONTESTED_CLUSTER_OMISSION) note should be written.
 *
 * Conservative — false positives (flagging defs that acknowledge contestation
 * in their own way without using a known marker phrase) are preferable to
 * false negatives.
 */
export function detectContestedOmission(termLabel, termFullName, workingDef, contestedTerms) {
  const candidates = [termLabel, termFullName].filter(Boolean).map(s => s.toLowerCase());
  const terms = contestedTerms?.terms || [];
  if (!candidates.length || !terms.length) return null;

  let matchedEntry = null;
  for (const t of terms) {
    const triggers = [t.label, ...(t.aliases || [])]
      .filter(Boolean)
      .map(s => s.toLowerCase());
    const hit = triggers.some(trigger =>
      candidates.some(c => c === trigger || c.includes(trigger))
    );
    if (hit) { matchedEntry = t; break; }
  }
  if (!matchedEntry) return null;

  const defLower = (workingDef || "").toLowerCase();
  const acknowledgesContestation = CONTESTATION_MARKERS.some(m => defLower.includes(m));
  if (acknowledgesContestation) return null;

  return {
    matchedTerm: matchedEntry.label,
    matchedEntry,
    workingDef: workingDef || ""
  };
}

// Append a note to the channel, deduping by id. Returns true if appended,
// false if a note with the same id was already present.
//
// Why this matters: buildNote's id is sha1(type|subject|writtenAt) (see
// below). writtenAt is run-level (set once per run from report.generatedAt),
// so any condition that fires multiple times within ONE run produces an
// identical id. Without dedup the channel collects duplicates — the
// canonical case is throughput_cap_hit firing once per cap-suppressed action
// (observed: 14 identical entries in a single 3-May run). Cross-run dedup
// is preserved naturally because writtenAt differs between runs.
//
// All notes-channel writers should go through this helper rather than
// pushing directly onto notes.entries — that's how the dedup invariant
// stays cheap to maintain.
export function pushNote(notes, note) {
  if (!notes.entries) notes.entries = [];
  if (notes.entries.some(e => e.id === note.id)) return false;
  notes.entries.push(note);
  return true;
}

// Build a Notes for Nicole entry. The id is deterministic per
// (type + subject + writtenAt). Combined with pushNote's dedup-by-id,
// the same condition firing multiple times in one run produces a single
// entry; firing on different runs produces distinct entries (different
// writtenAt → different id), preserving the temporal trail.
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
