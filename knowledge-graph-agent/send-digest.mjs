// Sends any digest that build-digest.mjs wrote but that hasn't gone out yet.
// Runs in lexi-run.yml AFTER the state push, because the Worker renders the
// digest from digests.json + proposals.json on main and then commits sentAt
// back. Digests older than 3 days that never sent are left alone (their
// items wait for the next digest's "still waiting" count and /manager).
//
// Exit code 1 if a send fails, so the workflow's failure step alerts Nicole.
//
// Run with: node send-digest.mjs

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createNotifier } from "./notify.mjs";
import { loadJson } from "./state-io.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = (await import(pathToFileURL(path.resolve(here, "config.mjs")).href)).default;
const digests = await loadJson(config.digestsPath, { digests: [] });
const cutoff = Date.now() - 3 * 24 * 3600 * 1000;
const unsent = (digests.digests || []).filter(d => !d.sentAt && new Date(d.createdAt).getTime() >= cutoff);

if (!unsent.length) {
  console.log("No unsent digests.");
} else {
  const notifier = createNotifier();
  if (!notifier.enabled) {
    console.log(`LEXI_NOTIFY_TOKEN not set; ${unsent.length} digest(s) left unsent.`);
  }
  for (const d of unsent) {
    if (!notifier.enabled) break;
    const r = await notifier.sendDigest(d.id);
    console.log(`Digest ${d.id}: ${JSON.stringify(r)}`);
    if (!r.ok) process.exitCode = 1;
  }
}
