// Operator-drift forcing functions (spec §12).
//
// These are the system's defences against the most-likely-to-occur failure
// mode for the project: not a Lexi malfunction, but gradual operator
// disengagement over months. The spec is explicit: most prior projects either
// ship-and-stabilise (no ongoing operational duty) or are weekly creative
// outputs (rhythm, novelty). Lexi is a daily operational responsibility,
// indefinitely. The historical pattern is gradual disengagement, not sudden
// abandonment. The system protects Nicole from herself.
//
// What's wired in this file:
//   - Pause-on-unread: global pause if any Note for Nicole is unread > 7 days.
//   - Manager-absent mode: explicit pause via env var or config flag.
//   - Throughput caps: per-action suppression with cap-hit notes.
//
// Deferred to a future session (needs design discussion):
//   - Weekly digest with click-through ack (spec §12.2).
//   - Monthly manager review prompt (spec §12.3).
//   - Auto-trigger of manager-absent mode after 14 days of no Notes reads —
//     requires read-timestamp tracking, not yet schema'd on note entries.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Inspect the notes channel + config and return an array of pause reasons.
// Empty array = run proceeds normally. Non-empty = global pause this run.
export function detectGlobalPauseReasons(notes, config) {
  const reasons = [];
  const now = Date.now();

  // §12.1: pause if any unread Note for Nicole is older than 7 days.
  const oldUnread = (notes.entries || []).filter(n =>
    n.status === "unread" && new Date(n.writtenAt).getTime() < (now - SEVEN_DAYS_MS)
  );
  if (oldUnread.length > 0) {
    const oldestWrittenAt = oldUnread.map(n => n.writtenAt).sort()[0];
    const ageDays = Math.floor((now - new Date(oldestWrittenAt).getTime()) / (24 * 60 * 60 * 1000));
    reasons.push({
      type: "unread_notes_over_7d",
      unreadCount: oldUnread.length,
      oldestUnreadAgeDays: ageDays,
      oldestWrittenAt,
      details: `${oldUnread.length} Note(s) for Nicole have been unread for more than 7 days (oldest: ${ageDays}d). Read or action them to resume publication.`
    });
  }

  // Manager-absent mode (explicit). Auto-detection from "no recent reads"
  // requires a read-timestamp on note entries (not yet schema'd) — deferred.
  const managerAbsent = config.managerAbsent === true || process.env.LEXI_MANAGER_ABSENT === "1";
  if (managerAbsent) {
    reasons.push({
      type: "manager_absent_mode",
      details: "Manager-absent mode is active (LEXI_MANAGER_ABSENT=1 or config.managerAbsent=true). All autonomous publication suppressed; Lexi continues observing only."
    });
  }

  return reasons;
}

// Count longlist entries first seen in the past 7 days. Used by the throughput
// cap on longlist additions per week.
export function countRecentLonglistAdditions(longlist) {
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  return (longlist.entries || []).filter(e => {
    if (!e.dateFirstSeen) return false;
    return new Date(e.dateFirstSeen).getTime() >= cutoff;
  }).length;
}

// Count proposals currently sitting at status "pending". Used by the
// throughput cap on the human-approval queue.
export function countPendingProposals(proposals) {
  return (proposals.proposals || []).filter(p => p.status === "pending").length;
}

// Check whether a given action is currently suppressed by a throughput cap.
// Returns null if not suppressed, or an object describing the cap that was hit.
// Caller is responsible for writing a Notes for Nicole entry (per spec §12).
export function checkThroughputCap(action, longlist, proposals, gate, caps) {
  // Cap on longlist additions per 7-day window. Applies only to actual adds
  // (autonomous applies). Re-sightings (INCREMENT_LONGLIST_SOURCE) don't add
  // a new entry, so they don't count against this cap.
  if (action === "add_to_longlist" && gate === "autonomous") {
    const current = countRecentLonglistAdditions(longlist);
    if (current >= caps.longlistAdditionsPer7d) {
      return {
        cap: "longlistAdditionsPer7d",
        limit: caps.longlistAdditionsPer7d,
        current,
        details: `Would exceed cap of ${caps.longlistAdditionsPer7d} longlist additions per 7-day window (current: ${current}).`
      };
    }
  }

  // Cap on pending proposals. Applies whenever the gate would land in the
  // proposals queue (PROPOSE or HUMAN_IN_LOOP).
  if (gate === "propose" || gate === "human_in_loop") {
    const current = countPendingProposals(proposals);
    if (current >= caps.pendingProposalsBeforePause) {
      return {
        cap: "pendingProposalsBeforePause",
        limit: caps.pendingProposalsBeforePause,
        current,
        details: `Would exceed cap of ${caps.pendingProposalsBeforePause} pending proposals (current: ${current}). Approve or reject pending items in proposals.json before Lexi queues more.`
      };
    }
  }

  return null;
}
