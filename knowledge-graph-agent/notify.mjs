// Notification dispatch: email to Nicole via the ai-terminology Worker.
//
// Email is Lexi's only channel to Nicole (replaced Slack 2026-10-16). The
// scripts here never send mail themselves: they POST to the Worker's
// authenticated /api/lexi/notify endpoint, which renders and sends from
// lexi@ai-terminology.com (Cloudflare Email Service) and signs any action
// links with a key only the Worker holds.
//
// Env:
//   LEXI_NOTIFY_TOKEN  bearer token (GitHub repo secret; same value as the
//                      Worker secret). Unset → every send no-ops cleanly, so
//                      local runs stay silent instead of erroring. Never logged.
//   LEXI_NOTIFY_URL    override the endpoint (default: production Worker).
//
// What goes out, and when:
//   - Alerts, straight away: run failures (workflow failure steps), new Notes
//     for Nicole (flags, issues, Lexi's questions), pauses, audit findings.
//   - The daily digest, only when a run produced something to review
//     (build-digest.mjs → send-digest.mjs).
//   - The weekly "what went live" summary with undo links (weekly-summary.mjs).
// NOT a publication channel: public content lives on the website.

const DEFAULT_ENDPOINT = "https://ai-terminology.com/api/lexi/notify";
const DASHBOARD_URL = "https://ai-terminology.com/manager/";

const TYPE_LABEL = {
  default_deny: "Default-deny",
  contested_cluster_omission: "Contested framing missing",
  throughput_cap_hit: "Throughput cap",
  run_paused: "Paused",
  source_pattern: "Source pattern",
  reversal_late: "Late reversal",
  reversal_contradiction: "Contradiction",
  low_confidence_pass: "Low confidence",
  trusted_source_proposal: "Trusted source proposal",
  near_miss_week: "Near misses",
  discretionary: "Lexi asks"
};

export function createNotifier({ token = process.env.LEXI_NOTIFY_TOKEN, endpoint = process.env.LEXI_NOTIFY_URL || DEFAULT_ENDPOINT } = {}) {
  return {
    enabled: Boolean(token),

    // Low-level POST. Returns { ok, ... } or { skipped } / { ok:false, error }.
    async post(body) {
      if (!token) return { skipped: "no_token" };
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        const text = await r.text();
        let json = null;
        try { json = JSON.parse(text); } catch { /* not JSON */ }
        if (r.ok) return { ok: true, ...(json || {}) };
        return { ok: false, status: r.status, error: json?.error || text.slice(0, 300) };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },

    // subject, intro?, lines?: string[], link?: {href,label}, noteIds?: string[]
    async sendAlert(alert) {
      return this.post({ kind: "alert", ...alert });
    },

    async sendDigest(digestId) {
      return this.post({ kind: "digest", digestId });
    },

    async sendWeekly({ since, items }) {
      return this.post({ kind: "weekly", since, items });
    },

    // After run.mjs. Quiet unless there's news: new notes, or a pause.
    async sendRunSummary({ runId, runLabel, notes, paused, pauseReasons }) {
      const newNotes = (notes?.entries || []).filter(n => n.runId === runId);
      if (newNotes.length === 0 && !paused) return { skipped: "no_news" };
      const lines = [];
      if (paused) {
        for (const r of pauseReasons || []) lines.push(`Paused (${r.type}): ${truncate(r.details, 300)}`);
      }
      for (const n of newNotes.slice(0, 15)) {
        lines.push(`${TYPE_LABEL[n.type] || n.type}: ${truncate(n.subject, 200)}${n.suggestedAction ? ` — ${truncate(n.suggestedAction, 200)}` : ""}`);
      }
      if (newNotes.length > 15) lines.push(`…and ${newNotes.length - 15} more on /manager.`);
      const unread = notes?.meta?.unreadCount ?? 0;
      return this.sendAlert({
        subject: paused ? `${runLabel}: paused` : `${runLabel}: ${newNotes.length} note${newNotes.length === 1 ? "" : "s"} for you`,
        intro: `${newNotes.length} new note(s), ${unread} unread in total. Unread notes older than 7 days pause my runs.`,
        lines,
        link: { href: DASHBOARD_URL, label: "Open /manager" },
        noteIds: newNotes.filter(n => n.status === "unread").map(n => n.id)
      });
    },

    // After audit.mjs. Quiet when there are no new findings.
    async sendAuditSummary({ runId, runLabel, notes, flagsRaised, dedupSkipped }) {
      const newNotes = (notes?.entries || []).filter(n => n.runId === runId);
      if (newNotes.length === 0) return { skipped: "no_new_findings" };
      return this.sendAlert({
        subject: `${runLabel}: ${flagsRaised} finding${flagsRaised === 1 ? "" : "s"}`,
        intro: `The weekly audit raised ${flagsRaised} flag(s): ${newNotes.length} new note(s), ${dedupSkipped} already known.`,
        lines: newNotes.slice(0, 15).map(n => `${TYPE_LABEL[n.type] || n.type}: ${truncate(n.subject, 200)}`),
        link: { href: DASHBOARD_URL, label: "Open /manager" },
        noteIds: newNotes.filter(n => n.status === "unread").map(n => n.id)
      });
    }
  };
}

function truncate(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
