// Mark-notes CLI — Nicole's "I read these" button, until the manager dashboard
// gets click-to-dismiss in Phase 4 (needs Pages Functions + auth).
//
// Until then: the unread-for-7d forcing function (spec §12.1) means that
// stale notes don't just clutter — they actively pause Lexi. This script lets
// Nicole clear them in bulk from the CLI, then commit + push so the deployed
// state reflects the dismissal.
//
// Usage:
//   node mark-notes.mjs --all                    # mark every unread → read
//   node mark-notes.mjs --type THROUGHPUT_CAP_HIT  # one type only (case-insensitive)
//   node mark-notes.mjs --id <noteId>            # a single specific note
//   node mark-notes.mjs --all --status actioned  # use a different target status
//   node mark-notes.mjs --all --dry-run          # preview without writing
//
// Default behavior:
//   - Operates on UNREAD notes only (won't re-mark already-read notes,
//     so readAt timestamps stay stable). Override with --include-all-statuses.
//   - Target status defaults to "read". Other valid: "actioned", "dismissed".
//   - Adds a readAt timestamp so the Almanac can later compute time-to-action.
//
// After running this, commit + push notes-for-nicole.json so the next workflow
// run sees the cleared state.

import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createLogger } from "./logger.mjs";
import { loadJson, writeJson } from "./state-io.mjs";

const VALID_STATUSES = new Set(["read", "actioned", "dismissed"]);

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.all && !args.type && !args.id)) {
    printUsage();
    return;
  }
  if (!VALID_STATUSES.has(args.status)) {
    console.error(`Invalid --status '${args.status}'. Valid: ${[...VALID_STATUSES].join(", ")}.`);
    process.exitCode = 1;
    return;
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  const notes = await loadJson(config.notesForNicolePath, { meta: {}, entries: [] });
  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });

  const matched = notes.entries.filter(n => matches(n, args));
  if (matched.length === 0) {
    console.log("No notes matched the filter — nothing to do.");
    console.log(`(Total notes: ${notes.entries.length}, unread: ${notes.entries.filter(n => n.status === "unread").length}.)`);
    return;
  }

  await logger.event("mark_notes_start", {
    filter: { all: !!args.all, type: args.type || null, id: args.id || null, includeAllStatuses: !!args.includeAllStatuses },
    targetStatus: args.status,
    matchedCount: matched.length,
    dryRun: !!args.dryRun
  });

  const now = new Date().toISOString();
  let changed = 0;
  for (const note of matched) {
    if (note.status === args.status) continue; // already there, no-op
    if (!args.dryRun) {
      note.status = args.status;
      note.readAt = now;
    }
    changed++;
  }

  if (args.dryRun) {
    console.log(`DRY RUN — would mark ${changed} note(s) as '${args.status}':`);
    for (const note of matched.slice(0, 20)) {
      console.log(`  [${note.status} → ${args.status}] ${note.type}: ${note.subject}`);
    }
    if (matched.length > 20) console.log(`  ... and ${matched.length - 20} more`);
    return;
  }

  // Refresh meta + write back
  notes.meta = {
    generatedAt: now,
    unreadCount: notes.entries.filter(n => n.status === "unread").length,
    totalCount: notes.entries.length,
    note: notes.meta?.note ?? "Notes for Nicole — Lexi's manager channel (spec §6)."
  };
  await writeJson(config.notesForNicolePath, notes);

  await logger.event("mark_notes_end", {
    targetStatus: args.status,
    changed,
    unreadAfter: notes.meta.unreadCount
  });

  console.log(`Marked ${changed} note(s) as '${args.status}'.`);
  console.log(`Unread remaining: ${notes.meta.unreadCount} of ${notes.meta.totalCount}.`);
  console.log("");
  console.log("To take effect on the next workflow run, commit + push:");
  console.log("  git add knowledge-graph-agent/notes-for-nicole.json");
  console.log("  git commit -m 'Mark notes read'");
  console.log("  git push");
}

// Decide if a note matches the user's filter.
function matches(note, args) {
  if (args.id) return note.id === args.id;
  if (!args.includeAllStatuses && note.status !== "unread") return false;
  if (args.type && note.type.toLowerCase() !== args.type.toLowerCase()) return false;
  // --all is implicit when type/id wasn't specified and we got here.
  return true;
}

function parseArgs(argv) {
  const args = { status: "read" };
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i];
    if (v === "--all") args.all = true;
    else if (v === "--dry-run") args.dryRun = true;
    else if (v === "--include-all-statuses") args.includeAllStatuses = true;
    else if (v === "--help" || v === "-h") args.help = true;
    else if (v === "--type" && argv[i + 1]) { args.type = argv[i + 1]; i += 1; }
    else if (v === "--id" && argv[i + 1]) { args.id = argv[i + 1]; i += 1; }
    else if (v === "--status" && argv[i + 1]) { args.status = argv[i + 1]; i += 1; }
    else {
      console.error(`Unknown argument: ${v}`);
      process.exitCode = 1;
      args.help = true;
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage: node mark-notes.mjs [filter] [--status STATUS] [--dry-run]

Filter (one required):
  --all                       Match all unread notes
  --type <TYPE>               Match unread notes of a given type (case-insensitive)
                              e.g. THROUGHPUT_CAP_HIT, CONTESTED_CLUSTER_OMISSION
  --id <NOTE_ID>              Match a single specific note (any status)

Options:
  --status <STATUS>           Target status. Default: read.
                              Valid: read, actioned, dismissed.
  --include-all-statuses      Also operate on already-read/actioned notes
                              (default: only unread).
  --dry-run                   Print what would change without writing.
  --help, -h                  Show this usage.

Examples:
  node mark-notes.mjs --all
  node mark-notes.mjs --type THROUGHPUT_CAP_HIT
  node mark-notes.mjs --type SOURCE_PATTERN --status actioned
  node mark-notes.mjs --id 4f8a2b1c9e7d3a6f --status dismissed
`);
}
