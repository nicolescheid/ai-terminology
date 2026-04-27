// Notification dispatch — currently Slack-only via incoming webhook.
//
// No external dependencies (Node's built-in fetch). No-ops cleanly when
// LEXI_SLACK_WEBHOOK is unset, so local runs without the secret stay silent
// rather than erroring. Webhook URL is treated as a write-only credential
// (anyone with it can post to the channel; can't read or admin) — never
// logged, never echoed.
//
// Designed for the manager-facing channel (Notes for Nicole, run errors,
// pause notifications, audit findings). NOT a publication channel — public
// content (Word of the Day, Curator's Notes) lives on the website.

const TYPE_EMOJI = {
  default_deny: "🟥",
  contested_cluster_omission: "🟧",
  throughput_cap_hit: "🟪",
  run_paused: "⏸️",
  source_pattern: "🟦",
  reversal_late: "↩️",
  reversal_contradiction: "↪️",
  low_confidence_pass: "❓",
  trusted_source_proposal: "📚",
  near_miss_week: "📉",
  discretionary: "💬"
};

export function createNotifier({ webhookUrl }) {
  return {
    enabled: Boolean(webhookUrl),

    // Low-level send. Caller controls payload shape (text or Slack Block Kit).
    async send(payload) {
      if (!webhookUrl) return { skipped: "no_webhook" };
      try {
        const r = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const text = await r.text();
        if (r.ok && text === "ok") return { ok: true };
        return { ok: false, status: r.status, body: text };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },

    // Summarize an agent run for posting after run.mjs completes. Quiet by
    // design: only fires when there's news (new notes OR a pause) to avoid
    // turning Slack into noise on no-op runs.
    async sendRunSummary({ runId, runLabel, notes, longlist, proposals, paused, pauseReasons, dashboardUrl }) {
      const newNotes = (notes?.entries || []).filter(n => n.runId === runId);
      if (newNotes.length === 0 && !paused) {
        return { skipped: "no_news" };
      }

      const lines = [`📋 *${runLabel}*`];

      if (paused) {
        const summary = (pauseReasons || []).map(r => r.type).join(", ") || "(unknown)";
        lines.push("", `⏸️ *Paused*: ${summary}`);
        for (const r of (pauseReasons || [])) {
          if (r.details) lines.push(`> ${truncate(r.details, 200)}`);
        }
      }

      if (newNotes.length > 0) {
        const unread = notes?.meta?.unreadCount ?? 0;
        lines.push("", `*${newNotes.length} new note(s)* (${unread} unread total):`);
        for (const n of newNotes.slice(0, 8)) {
          const emoji = TYPE_EMOJI[n.type] || "•";
          lines.push(`${emoji}  ${truncate(n.subject, 120)}`);
        }
        if (newNotes.length > 8) lines.push(`_…and ${newNotes.length - 8} more in the dashboard_`);
      }

      if (!paused) {
        const ll = longlist?.entries?.length ?? 0;
        const pending = (proposals?.proposals || []).filter(p => p.status === "pending").length;
        lines.push("", `_Longlist: ${ll} entries · Proposals pending: ${pending}_`);
      }

      if (dashboardUrl) {
        lines.push("", `<${dashboardUrl}|→ Manager dashboard>`);
      }

      return this.send({ text: lines.join("\n") });
    },

    // Summarize an audit run. Quiet when no new findings — re-runs over
    // unchanged data should not spam the channel.
    async sendAuditSummary({ runId, runLabel, notes, flagsRaised, dedupSkipped, dashboardUrl }) {
      const newNotes = (notes?.entries || []).filter(n => n.runId === runId);
      if (newNotes.length === 0) return { skipped: "no_new_findings" };

      const lines = [`🔍 *${runLabel}*`];
      lines.push("", `Raised *${flagsRaised} flag(s)* — ${newNotes.length} new note(s), ${dedupSkipped} deduped.`);
      for (const n of newNotes.slice(0, 8)) {
        const emoji = TYPE_EMOJI[n.type] || "•";
        lines.push(`${emoji}  ${truncate(n.subject, 140)}`);
      }
      if (newNotes.length > 8) lines.push(`_…and ${newNotes.length - 8} more in the dashboard_`);
      if (dashboardUrl) lines.push("", `<${dashboardUrl}|→ Manager dashboard>`);

      return this.send({ text: lines.join("\n") });
    }
  };
}

function truncate(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
