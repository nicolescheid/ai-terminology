// Lexi action vocabulary and permissions matrix.
//
// Single source of truth for what Lexi can do and when. Derived from
// lexi-spec.md §5 (the permissions matrix). When the spec changes, this file
// changes; runtime code should never hardcode an action name or gate decision.

export const ACTIONS = Object.freeze({
  // Tier 2 (longlist) actions
  ADD_TO_LONGLIST: "add_to_longlist",
  INCREMENT_LONGLIST_SOURCE: "increment_longlist_source",
  UPDATE_LONGLIST_DEF_MINOR: "update_longlist_def_minor",
  UPDATE_LONGLIST_DEF_SUBSTANTIVE: "update_longlist_def_substantive",
  RETIRE_FROM_LONGLIST: "retire_from_longlist",
  REJECT_CANDIDATE: "reject_candidate",

  // Tier 1 ↔ Tier 2 transitions
  PROMOTE_TO_GRAPH: "promote_to_graph",
  DEMOTE_TO_LONGLIST: "demote_to_longlist",

  // Tier 1 (graph) actions
  EDIT_GRAPH_DEF_MINOR: "edit_graph_def_minor",
  EDIT_GRAPH_DEF_SUBSTANTIVE: "edit_graph_def_substantive",
  DEPRECATE_GRAPH_NODE: "deprecate_graph_node",
  CONFLATE_GRAPH_NODES: "conflate_graph_nodes",
  SPLIT_GRAPH_NODE: "split_graph_node",
  REMOVE_GRAPH_NODE: "remove_graph_node",

  // Governance
  ADD_TRUSTED_SOURCE: "add_trusted_source",

  // Communication channels
  CURATORS_NOTES_ENTRY: "curators_notes_entry",
  WORD_OF_THE_DAY: "word_of_the_day",
  NOTES_FOR_NICOLE: "notes_for_nicole",
  FLAG_MUST_READ: "flag_must_read"
});

// Gate types — what happens when Lexi attempts an action.
export const GATES = Object.freeze({
  AUTONOMOUS: "autonomous",        // Lexi acts directly; logged
  PROPOSE: "propose",              // Lexi writes to proposals queue; Nicole approves
  HUMAN_IN_LOOP: "human_in_loop",  // Pre-publication human review (e.g. Word of the Day queue)
  NEVER: "never"                   // Not allowed under any circumstances
});

// Permissions matrix per phase. See lexi-spec.md §5 + §8 (phased rollout).
//
// Phases:
//   0 = Hand-run (no automation, no public outputs)
//   1 = Batch automation (Nicole-triggered scripts; outputs to review queue)
//   2 = Autonomy + public launch (cron-style schedule; longlist publicly visible)
//
// NOTE: ADD_TO_LONGLIST is currently set AUTONOMOUS at all phases. Strict spec
// reading is "Autonomous (Phase 2+); post-hoc visible" — Phase 0/1 should be
// PROPOSE. We're holding off on that gate until an approval CLI exists; flip
// to PROPOSE in the matrix below when the CLI lands. The plumbing already
// routes via resolveGate(), so the change will be one line.
export const PERMISSIONS = Object.freeze({
  [ACTIONS.ADD_TO_LONGLIST]:                  { 0: GATES.AUTONOMOUS, 1: GATES.AUTONOMOUS, 2: GATES.AUTONOMOUS },
  [ACTIONS.INCREMENT_LONGLIST_SOURCE]:        { 0: GATES.AUTONOMOUS, 1: GATES.AUTONOMOUS, 2: GATES.AUTONOMOUS },
  [ACTIONS.UPDATE_LONGLIST_DEF_MINOR]:        { 0: GATES.AUTONOMOUS, 1: GATES.AUTONOMOUS, 2: GATES.AUTONOMOUS },
  [ACTIONS.UPDATE_LONGLIST_DEF_SUBSTANTIVE]:  { 0: GATES.PROPOSE,    1: GATES.PROPOSE,    2: GATES.PROPOSE },
  [ACTIONS.RETIRE_FROM_LONGLIST]:             { 0: GATES.AUTONOMOUS, 1: GATES.AUTONOMOUS, 2: GATES.AUTONOMOUS },
  [ACTIONS.REJECT_CANDIDATE]:                 { 0: GATES.AUTONOMOUS, 1: GATES.AUTONOMOUS, 2: GATES.AUTONOMOUS },

  [ACTIONS.PROMOTE_TO_GRAPH]:                 { 0: GATES.PROPOSE, 1: GATES.PROPOSE, 2: GATES.PROPOSE },
  [ACTIONS.DEMOTE_TO_LONGLIST]:               { 0: GATES.PROPOSE, 1: GATES.PROPOSE, 2: GATES.PROPOSE },

  [ACTIONS.EDIT_GRAPH_DEF_MINOR]:             { 0: GATES.AUTONOMOUS, 1: GATES.AUTONOMOUS, 2: GATES.AUTONOMOUS },
  [ACTIONS.EDIT_GRAPH_DEF_SUBSTANTIVE]:       { 0: GATES.PROPOSE,    1: GATES.PROPOSE,    2: GATES.PROPOSE },
  [ACTIONS.DEPRECATE_GRAPH_NODE]:             { 0: GATES.PROPOSE,    1: GATES.PROPOSE,    2: GATES.PROPOSE },
  [ACTIONS.CONFLATE_GRAPH_NODES]:             { 0: GATES.PROPOSE,    1: GATES.PROPOSE,    2: GATES.PROPOSE },
  [ACTIONS.SPLIT_GRAPH_NODE]:                 { 0: GATES.PROPOSE,    1: GATES.PROPOSE,    2: GATES.PROPOSE },
  [ACTIONS.REMOVE_GRAPH_NODE]:                { 0: GATES.NEVER,      1: GATES.NEVER,      2: GATES.NEVER },

  [ACTIONS.ADD_TRUSTED_SOURCE]:               { 0: GATES.PROPOSE, 1: GATES.PROPOSE, 2: GATES.PROPOSE },

  [ACTIONS.CURATORS_NOTES_ENTRY]:             { 0: GATES.PROPOSE,       1: GATES.PROPOSE,       2: GATES.AUTONOMOUS },
  [ACTIONS.WORD_OF_THE_DAY]:                  { 0: GATES.HUMAN_IN_LOOP, 1: GATES.HUMAN_IN_LOOP, 2: GATES.HUMAN_IN_LOOP },
  [ACTIONS.NOTES_FOR_NICOLE]:                 { 0: GATES.AUTONOMOUS,    1: GATES.AUTONOMOUS,    2: GATES.AUTONOMOUS },
  // Personal recommendation channel — Lexi flags articles she thinks Nicole
  // would want to read in full. Same gate as Notes for Nicole (it's another
  // private channel from Lexi to her manager, just on the pleasant side).
  [ACTIONS.FLAG_MUST_READ]:                   { 0: GATES.AUTONOMOUS,    1: GATES.AUTONOMOUS,    2: GATES.AUTONOMOUS }
});

// Resolve the gate for (action, phase). Returns null when the action is not
// in the matrix — the spec's "default-deny clause" (§5): unknown actions must
// not execute autonomously.
export function resolveGate(action, phase) {
  const policy = PERMISSIONS[action];
  if (!policy) return null;
  return policy[phase] ?? null;
}

// Convenience: true iff the action is permitted to execute directly under the
// current phase. Anything else (PROPOSE / HUMAN_IN_LOOP / NEVER / unknown)
// must NOT mutate state — route via the proposals queue or refuse.
export function isAutonomous(action, phase) {
  return resolveGate(action, phase) === GATES.AUTONOMOUS;
}
