// Auditor entry point (spec §11). Run with `node audit.mjs` from the agent dir.
//
// The auditor is independent of the main agent run loop — different invocation
// path, runs against the existing longlist + deterministic log, writes flags
// directly to Notes for Nicole. It deliberately does NOT trust Lexi's
// self-reports for the things it's auditing; for source-pattern checks it
// reads the longlist's source data and re-derives counts.
//
// Dedup: each flag has a stable signature (including the relevant counts /
// state) used as the note id. Re-running the auditor over unchanged data
// produces no new notes; only when the underlying state changes (a new
// pattern emerges, a count grows) do new notes appear.

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildNote } from "./notes.mjs";
import { createLogger } from "./logger.mjs";
import { runAllChecks } from "./auditor.mjs";
import { createNotifier } from "./notify.mjs";

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  const longlist = await loadJson(config.longlistPath, { entries: [] });
  const notes = await loadJson(config.notesForNicolePath, {
    meta: { generatedAt: null, unreadCount: 0, totalCount: 0, note: "Notes for Nicole — Lexi's manager channel (spec §6)." },
    entries: []
  });

  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });

  await logger.event("audit_start", {
    auditor: "heuristic",
    auditorVersion: "1.0",
    checks: ["cross_temporal_domain_share", "independence_recount", "adoption_velocity"],
    longlistEntries: (longlist.entries || []).length
  });

  const flags = runAllChecks(longlist, {
    crossTemporal: { windowDays: 30 },
    velocity: { fastDays: 3 }
  });

  // Dedup against existing notes by id. Stable signatures mean re-runs
  // with unchanged state produce no new notes.
  const existingIds = new Set((notes.entries || []).map(n => n.id));
  const writtenAt = new Date().toISOString();
  let added = 0;
  let dedupSkipped = 0;

  for (const flag of flags) {
    // Build a stable id from the flag's signature so dedup works across runs.
    const id = crypto.createHash("sha1").update(`audit:${flag.signature}`).digest("hex").slice(0, 16);
    if (existingIds.has(id)) {
      dedupSkipped++;
      await logger.event("audit_flag_skipped", {
        signature: flag.signature,
        reason: "already_in_notes"
      });
      continue;
    }
    const note = buildNote({
      type: flag.type,
      runId,
      phase: config.phase,
      writtenAt,
      subject: flag.subject,
      details: flag.details,
      evidence: flag.evidence,
      suggestedAction: flag.suggestedAction
    });
    note.id = id; // override with deterministic-from-signature id for dedup
    note.source = "auditor";
    notes.entries.push(note);
    added++;
    await logger.event("audit_flag", {
      signature: flag.signature,
      type: flag.type,
      subject: flag.subject,
      noteId: id
    });
  }

  notes.meta = {
    generatedAt: writtenAt,
    unreadCount: notes.entries.filter(n => n.status === "unread").length,
    totalCount: notes.entries.length,
    note: notes.meta?.note ?? "Notes for Nicole — Lexi's manager channel (spec §6)."
  };

  await fs.writeFile(config.notesForNicolePath, `${JSON.stringify(notes, null, 2)}\n`, "utf8");

  await logger.event("audit_end", {
    flagsRaised: flags.length,
    notesAdded: added,
    dedupSkipped,
    longlistEntries: (longlist.entries || []).length
  });

  console.log(`Auditor complete (heuristic, no API calls).`);
  console.log(`Longlist: ${(longlist.entries || []).length} entries inspected.`);
  console.log(`Flags raised: ${flags.length} (${added} new notes, ${dedupSkipped} deduped).`);
  console.log(`Total unread notes: ${notes.meta.unreadCount}.`);

  // Slack notification — only fires when new findings landed.
  const notifier = createNotifier({ webhookUrl: process.env.LEXI_SLACK_WEBHOOK });
  if (notifier.enabled) {
    const dateStr = writtenAt.slice(0, 16).replace("T", " ") + " UTC";
    await notifier.sendAuditSummary({
      runId,
      runLabel: `Lexi audit · ${dateStr}`,
      notes,
      flagsRaised: flags.length,
      dedupSkipped,
      dashboardUrl: "https://ai-terminology.com/manager/"
    });
  }
}

async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}
