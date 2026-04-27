// Standalone test for the Slack webhook wiring. Run after setting
// LEXI_SLACK_WEBHOOK in your shell:
//   set LEXI_SLACK_WEBHOOK=https://hooks.slack.com/services/...   (CMD)
//   $env:LEXI_SLACK_WEBHOOK="https://..."                         (PowerShell)
//   node test-notify.mjs
//
// Sends one test message to the channel and prints the result. Use this to
// verify the webhook URL is correct before relying on the workflow runs.

import { createNotifier } from "./notify.mjs";

const notifier = createNotifier({ webhookUrl: process.env.LEXI_SLACK_WEBHOOK });

if (!notifier.enabled) {
  console.error("LEXI_SLACK_WEBHOOK is not set. Set it in your shell, then re-run.");
  process.exit(1);
}

const result = await notifier.send({
  text: [
    "👋 *Hello from Lexi*",
    "",
    "This is a test message from `test-notify.mjs` confirming the Slack incoming webhook is wired correctly.",
    "",
    "If you see this, the LEXI_SLACK_WEBHOOK env var is good. Add the same value as a GitHub repository secret named `LEXI_SLACK_WEBHOOK` to wire the scheduled workflows."
  ].join("\n")
});

console.log("Result:", JSON.stringify(result, null, 2));
if (!result.ok) {
  process.exit(1);
}
