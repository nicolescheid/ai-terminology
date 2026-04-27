// Auditor — Lexi's independent second opinion (spec §11 + §9).
//
// This module is the system's defence against Lexi's own blind spots and
// against adversarial inputs. The spec is explicit: the auditor "is not the
// system of record (the deterministic log is); the auditor is a second
// opinion." It runs against patterns in the data, doesn't trust Lexi's
// self-reports for the things it's checking, and writes flags to Notes for
// Nicole.
//
// This module: pure detection functions. No API calls, no I/O. Each function
// takes the longlist (and any options) and returns an array of flag objects
// ready to become Notes for Nicole entries.
//
// Skipped in this slice (deferred to a future Phase F++):
//   - Claude-based second-opinion sampling on a fraction of additions
//     (substantial — needs prompt design, sampling, comparison logic)
//   - Rubric scoring + trend analysis
//   - Fresh-source-pool detection (would false-positive heavily during the
//     early days when the source pool itself is brand new)

import { ENTRY_TYPES } from "./notes.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

// Spec §9: ≥2 longlist additions in a 30-day window share a domain in their
// source set. False positives are expected from official-source feeds (every
// term about Google's TPUs will share blog.google); the flag is a prompt for
// Nicole to look closer, not a verdict.
export function detectCrossTemporalSourcePatterns(longlist, options = {}) {
  const windowDays = options.windowDays ?? 30;
  const cutoff = Date.now() - windowDays * DAY_MS;
  const recent = (longlist.entries || []).filter(e =>
    e.dateFirstSeen && new Date(e.dateFirstSeen).getTime() >= cutoff
  );

  const domainToEntries = new Map();
  for (const entry of recent) {
    const domains = new Set((entry.sources || []).map(s => s.domain).filter(Boolean));
    for (const d of domains) {
      if (!domainToEntries.has(d)) domainToEntries.set(d, []);
      domainToEntries.get(d).push(entry.id);
    }
  }

  const flags = [];
  for (const [domain, entryIds] of domainToEntries) {
    if (entryIds.length < 2) continue;
    flags.push({
      signature: `source_pattern_domain:${domain}:${entryIds.length}`,
      type: ENTRY_TYPES.SOURCE_PATTERN,
      subject: `Source pattern: domain '${domain}' appears in ${entryIds.length} recent longlist entries`,
      details: `In the past ${windowDays} days, ${entryIds.length} longlist entries have at least one source from ${domain}. This isn't necessarily wrong — official-source feeds naturally cluster — but it's a signal worth checking, especially if these entries also share authors or were promoted in close temporal proximity.`,
      evidence: {
        check: "cross_temporal_domain_share",
        domain,
        entryIds,
        windowDays,
        recentEntryCount: recent.length
      },
      suggestedAction: "Skim the listed entries: are they describing genuinely new vocabulary, or different framings of the same underlying concept from the same source-network? If the latter, consider conflating or holding for additional independent sources before promotion."
    });
  }
  return flags;
}

// Re-derive each entry's independent source count from its sources array and
// compare to the stored value. Mismatch usually means the entry was hand-edited
// without refreshing the count — bookkeeping issue, not adversarial — but it's
// the kind of small drift that erodes trust in the system over time.
export function detectIndependenceMismatches(longlist) {
  const flags = [];
  for (const entry of longlist.entries || []) {
    const stored = entry.independentSourceCount;
    const rederived = new Set(
      (entry.sources || []).map(s => s.domain).filter(Boolean)
    ).size;
    if (stored === rederived) continue;
    flags.push({
      signature: `independence_mismatch:${entry.id}:${stored}vs${rederived}`,
      type: ENTRY_TYPES.SOURCE_PATTERN,
      subject: `Independence count mismatch: '${entry.label}' (stored ${stored}, re-derived ${rederived})`,
      details: `Lexi recorded independentSourceCount=${stored} for this entry, but auditor re-derivation from the sources array gives ${rederived} unique domains. Usually means the entry was hand-edited, or the count wasn't refreshed when sources were added.`,
      evidence: {
        check: "independence_recount",
        entryId: entry.id,
        label: entry.label,
        storedCount: stored,
        rederivedCount: rederived,
        sourceDomains: [...new Set((entry.sources || []).map(s => s.domain).filter(Boolean))]
      },
      suggestedAction: "Either fix the stored independentSourceCount, or investigate how Lexi's bookkeeping diverged from the source data."
    });
  }
  return flags;
}

// Adoption velocity: longlist entries that hit ≥2 sources within a small number
// of days of first sighting. Could be legitimate (a newly announced product
// echoed across many channels), but rapid multi-sourcing from a tight network
// is also the signature of coordinated promotion. Worth a closer look,
// especially for terms approaching promotion.
export function detectVelocityAnomalies(longlist, options = {}) {
  const fastDays = options.fastDays ?? 3;
  const fastMs = fastDays * DAY_MS;
  const flags = [];

  for (const entry of longlist.entries || []) {
    if ((entry.sourceCount || 0) < 2) continue;
    const times = (entry.sources || [])
      .map(s => s.firstSeen)
      .filter(Boolean)
      .map(t => new Date(t).getTime())
      .sort((a, b) => a - b);
    if (times.length < 2) continue;

    const spanMs = times.at(-1) - times[0];
    if (spanMs >= fastMs) continue;

    const days = Math.max(1, Math.round(spanMs / DAY_MS));
    const labels = [...new Set((entry.sources || []).map(s => s.sourceLabel).filter(Boolean))];
    flags.push({
      signature: `velocity_anomaly:${entry.id}:${entry.sourceCount}sources_${days}d`,
      type: ENTRY_TYPES.SOURCE_PATTERN,
      subject: `Adoption velocity: '${entry.label}' hit ${entry.sourceCount} sources in ${days}d`,
      details: `This entry accumulated ${entry.sourceCount} sources within ${days} day(s) of first sighting. Often legitimate for product launches, but rapid multi-sourcing from a tight source pool can also signal coordinated promotion. Source labels involved: ${labels.join(", ")}.`,
      evidence: {
        check: "adoption_velocity",
        entryId: entry.id,
        label: entry.label,
        sourceCount: entry.sourceCount,
        spanDays: days,
        sourceLabels: labels,
        firstSourceTs: new Date(times[0]).toISOString(),
        lastSourceTs: new Date(times.at(-1)).toISOString()
      },
      suggestedAction: "Cross-check the sources for shared authors or cross-citation. If sources are tightly coupled (same publication network, same author byline), treat as one source for promotion-eligibility purposes."
    });
  }
  return flags;
}

// Run all heuristics and return the combined flag list. Caller is responsible
// for dedup against existing notes and for writing entries.
export function runAllChecks(longlist, options = {}) {
  return [
    ...detectCrossTemporalSourcePatterns(longlist, options.crossTemporal),
    ...detectIndependenceMismatches(longlist),
    ...detectVelocityAnomalies(longlist, options.velocity)
  ];
}
