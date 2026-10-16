// Standalone test for the email wiring: sends one alert to Nicole through
// the Worker's /api/lexi/notify endpoint. Run after setting the token:
//   $env:LEXI_NOTIFY_TOKEN="..."      (PowerShell)
//   export LEXI_NOTIFY_TOKEN=...      (bash)
//   node test-notify.mjs
// LEXI_NOTIFY_URL overrides the endpoint (e.g. a `wrangler dev` URL).

import { createNotifier } from "./notify.mjs";

const notifier = createNotifier();

if (!notifier.enabled) {
  console.error("LEXI_NOTIFY_TOKEN is not set. Set it in your shell, then re-run.");
  process.exit(1);
}

const result = await notifier.sendAlert({
  subject: "Hello from Lexi",
  intro: "A test message from test-notify.mjs, confirming that GitHub Actions → Worker → email works.",
  lines: ["If this reached you, the LEXI_NOTIFY_TOKEN value is good and the Worker can send from lexi@ai-terminology.com."]
});

console.log("Result:", JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
