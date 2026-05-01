// Mark-must-reads CLI — Nicole's "I read it" / "not for me" button for the
// must-reads list, until the manager dashboard gets click-to-dismiss in
// Phase 4 (needs Pages Functions + auth).
//
// Usage:
//   node mark-must-reads.mjs --all                    # mark every unread → read
//   node mark-must-reads.mjs --priority 1             # only priority 1
//   node mark-must-reads.mjs --id <articleId>         # a single specific entry
//   node mark-must-reads.mjs --all --status dismissed # use a different target
//   node mark-must-reads.mjs --all --dry-run          # preview without writing
//
// Default behavior:
//   - Operates on UNREAD must-reads only (won't re-mark already-read entries).
//     Override with --include-all-statuses.
//   - Target status defaults to "read". Other valid: "dismissed".
//
// After running this, commit + push must-reads.json so the next workflow
// run sees the cleared state.

import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createLogger } from "./logger.mjs";
import { loadJson, writeJson } from "./state-io.mjs";

const VALID_STATUSES = new Set(["read", "dismissed"]);

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.all && args.priority == null && !args.id)) {
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

  const mustReads = await loadJson(config.mustReadsPath, { meta: {}, entries: [] });
  const runId = crypto.randomUUID();
  const logger = createLogger({ runId, phase: config.phase, logPath: config.logPath });

  const matched = mustReads.entries.filter(e => matches(e, args));
  if (matched.length === 0) {
    console.log("No must-reads matched the filter — nothing to do.");
    console.log(`(Total: ${mustReads.entries.length}, unread: ${mustReads.entries.filter(e => e.status === "unread").length}.)`);
    return;
  }

  await logger.event("mark_must_reads_start", {
    filter: { all: !!args.all, priority: args.priority ?? null, id: args.id || null, includeAllStatuses: !!args.includeAllStatuses },
    targetStatus: args.status,
    matchedCount: matched.length,
    dryRun: !!args.dryRun
  });

  const now = new Date().toISOString();
  let changed = 0;
  for (const entry of matched) {
    if (entry.status === args.status) continue;
    if (!args.dryRun) {
      entry.status = args.status;
      entry.readAt = now;
    }
    changed++;
  }

  if (args.dryRun) {
    console.log(`DRY RUN — would mark ${changed} must-read(s) as '${args.status}':`);
    for (const e of matched.slice(0, 20)) {
      console.log(`  [${e.status} → ${args.status}] p${e.priority} · ${e.title}`);
    }
    if (matched.length > 20) console.log(`  ... and ${matched.length - 20} more`);
    return;
  }

  mustReads.meta = {
    generatedAt: now,
    unreadCount: mustReads.entries.filter(e => e.status === "unread").length,
    totalCount: mustReads.entries.length,
    note: mustReads.meta?.note ?? "Lexi's must-reads — articles she flags as worth Nicole reading in full."
  };
  await writeJson(config.mustReadsPath, mustReads);

  await logger.event("mark_must_reads_end", {
    targetStatus: args.status,
    changed,
    unreadAfter: mustReads.meta.unreadCount
  });

  console.log(`Marked ${changed} must-read(s) as '${args.status}'.`);
  console.log(`Unread remaining: ${mustReads.meta.unreadCount} of ${mustReads.meta.totalCount}.`);
  console.log("");
  console.log("To take effect, commit + push:");
  console.log("  git add knowledge-graph-agent/must-reads.json");
  console.log("  git commit -m 'Mark must-reads read'");
  console.log("  git push");
}

function matches(entry, args) {
  if (args.id) return entry.id === args.id;
  if (!args.includeAllStatuses && entry.status !== "unread") return false;
  if (args.priority != null && entry.priority !== args.priority) return false;
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
    else if (v === "--priority" && argv[i + 1]) { args.priority = Number.parseInt(argv[i + 1], 10); i += 1; }
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
  console.log(`Usage: node mark-must-reads.mjs [filter] [--status STATUS] [--dry-run]

Filter (one required):
  --all                       Match all unread must-reads
  --priority <1|2|3>          Match unread must-reads of a given priority
  --id <ARTICLE_ID>           Match a single specific entry (any status)

Options:
  --status <STATUS>           Target status. Default: read. Valid: read, dismissed.
  --include-all-statuses      Also operate on already-read entries (default: only unread).
  --dry-run                   Print what would change without writing.
  --help, -h                  Show this usage.

Examples:
  node mark-must-reads.mjs --all
  node mark-must-reads.mjs --priority 3 --status dismissed
  node mark-must-reads.mjs --id a1b2c3d4 --status dismissed
`);
}
