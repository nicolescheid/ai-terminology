// Triage CLI for Notes for Nicole. Stopgap until the dashboard gets a real
// "mark read / actioned / dismissed" button (which needs a Cloudflare Pages
// Function backend — separate session).
//
// Usage:
//   node triage.mjs                     interactive: walk through each unread note
//   node triage.mjs --list              just print a summary of unread
//   node triage.mjs --all-read          bulk: mark every unread → read
//   node triage.mjs --type X --to Y     bulk: change all type=X to status=Y
//                                       (e.g., --type throughput_cap_hit --to dismissed)
//
// All status changes are local-only; commit + push manually after to update
// the dashboard. (Or wait for the next cron run, which auto-commits state.)

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const VALID_STATUSES = ["unread", "read", "actioned", "dismissed"];

main().catch(err => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const here = path.dirname(fileURLToPath(import.meta.url));
  const configModule = await import(pathToFileURL(path.resolve(here, "config.mjs")).href);
  const config = configModule.default;

  const data = JSON.parse(await fs.readFile(config.notesForNicolePath, "utf8"));
  const all = data.entries || [];
  const unread = all.filter(n => n.status === "unread");

  if (args.list) {
    printSummary(all, unread);
    return;
  }

  if (args.allRead) {
    if (unread.length === 0) {
      console.log("Nothing to do — 0 unread notes.");
      return;
    }
    const ts = new Date().toISOString();
    for (const n of unread) {
      n.status = "read";
      n.statusChangedAt = ts;
    }
    await save(data, config);
    console.log(`Marked ${unread.length} note(s) as 'read'.`);
    return;
  }

  if (args.type && args.to) {
    if (!VALID_STATUSES.includes(args.to)) {
      console.error(`--to must be one of: ${VALID_STATUSES.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const matched = all.filter(n => n.type === args.type && n.status === "unread");
    if (matched.length === 0) {
      console.log(`No unread notes of type '${args.type}'.`);
      return;
    }
    const ts = new Date().toISOString();
    for (const n of matched) {
      n.status = args.to;
      n.statusChangedAt = ts;
    }
    await save(data, config);
    console.log(`Updated ${matched.length} note(s) of type '${args.type}' → status '${args.to}'.`);
    return;
  }

  // Interactive mode — walk through each unread note one by one.
  if (unread.length === 0) {
    console.log("All caught up — 0 unread notes. 🎉");
    return;
  }
  printSummary(all, unread);
  console.log();
  console.log("Walking through each unread note. Per note: r=read, a=actioned, d=dismissed, s=skip, q=quit.");
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(res => rl.question(q, res));

  let changed = 0;
  for (let i = 0; i < unread.length; i++) {
    const n = unread[i];
    console.log("─".repeat(78));
    console.log(`(${i + 1}/${unread.length})  [${n.type}]  ${n.subject}`);
    if (n.details) console.log(`  ${n.details}`);
    if (n.suggestedAction) console.log(`  → ${n.suggestedAction}`);
    let answer;
    while (true) {
      answer = (await ask("  r/a/d/s/q? ")).trim().toLowerCase();
      if (["r", "a", "d", "s", "q"].includes(answer)) break;
    }
    if (answer === "q") break;
    if (answer === "s") continue;
    const newStatus = { r: "read", a: "actioned", d: "dismissed" }[answer];
    n.status = newStatus;
    n.statusChangedAt = new Date().toISOString();
    changed++;
  }
  rl.close();

  if (changed > 0) await save(data, config);
  console.log();
  console.log(`Done. Updated ${changed} note(s).`);
  console.log(`Remaining unread: ${data.entries.filter(n => n.status === "unread").length}`);
  console.log(`Reminder: commit + push notes-for-nicole.json so the dashboard reflects this.`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") out.list = true;
    else if (a === "--all-read") out.allRead = true;
    else if (a === "--type") out.type = argv[++i];
    else if (a === "--to") out.to = argv[++i];
  }
  return out;
}

function printSummary(all, unread) {
  console.log(`Total notes: ${all.length}  ·  Unread: ${unread.length}`);
  if (unread.length === 0) return;
  const byType = {};
  for (const n of unread) byType[n.type] = (byType[n.type] || 0) + 1;
  console.log("Unread by type:");
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(34)} ${c}`);
  }
}

async function save(data, config) {
  data.meta.unreadCount = data.entries.filter(n => n.status === "unread").length;
  data.meta.totalCount = data.entries.length;
  data.meta.generatedAt = new Date().toISOString();
  await fs.writeFile(config.notesForNicolePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
