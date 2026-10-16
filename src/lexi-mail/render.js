// HTML + plain-text rendering for Lexi's emails and the link confirm pages.
// Inline styles only (mail clients strip <style>); every value from state is
// escaped. Plain text is always sent alongside HTML.

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function fmtWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const time = d.toISOString().slice(11, 16);
  return `${day}, ${time} UTC`;
}

const C = { ink: "#1d1b16", muted: "#6b6458", line: "#e4ded2", paper: "#fbf8f2", accent: "#7a3e1d", ok: "#2f6b3a", warn: "#9a5b00", bad: "#9b2c2c" };

function shell(title, inner) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.paper};">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};font-size:16px;line-height:1.5;">
<div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};margin-bottom:4px;">Lexi · ai-terminology.com</div>
<h1 style="font-size:22px;font-weight:normal;margin:0 0 16px;">${esc(title)}</h1>
${inner}
<p style="font-size:13px;color:${C.muted};border-top:1px solid ${C.line};padding-top:12px;margin-top:24px;">Reply to this email to ask a question, act on items by number ("approve 1 and 3, hold 2"), ask me to find sources, merge a term into an existing one, or redraft a definition. Links work once and open a confirm page first.</p>
</div></body></html>`;
}

function button(href, label, color) {
  return `<a href="${esc(href)}" style="display:inline-block;padding:6px 14px;margin:0 6px 6px 0;border:1px solid ${color};color:${color};text-decoration:none;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;">${esc(label)}</a>`;
}

function verdictLine(review) {
  if (!review) return { html: `<span style="color:${C.muted}">Reviewer: not run</span>`, text: "Reviewer: not run" };
  const flagged = review.verdict === "flag";
  const color = flagged ? C.bad : C.ok;
  const head = flagged ? "FLAGGED" : "Pass";
  const flags = (review.flags || []).length ? ` (${review.flags.join(", ")})` : "";
  return {
    html: `<span style="color:${color};font-weight:bold;">Reviewer: ${head}${esc(flags)}</span> ${esc(review.summary || "")}`,
    text: `Reviewer: ${head}${flags}. ${review.summary || ""}`
  };
}

function tierLine(item, digest, paused) {
  if (item.tier === "auto") {
    const when = paused ? "auto-apply is paused" : `auto-applies ${fmtWhen(digest.autoApplyAt)} unless you act`;
    return { html: `<span style="color:${C.ok}">Low risk: ${esc(when)}.</span>`, text: `Low risk: ${when}.` };
  }
  return { html: `<span style="color:${C.warn}">Waits for you: ${esc(item.tierReason || "needs review")}.</span>`, text: `Waits for you: ${item.tierReason || "needs review"}.` };
}

// links: { [proposalId]: { approve, reject, hold } }, plus approveAll,
// pause: { 1, 2, 4 } (weeks → url), resume (url | null).
export function renderDigest({ digest, statuses, links, pausedUntil }) {
  const paused = pausedUntil && new Date(pausedUntil) > new Date();
  const autoCount = digest.items.filter(i => i.tier === "auto").length;
  const waitCount = digest.items.length - autoCount;
  const title = `${digest.items.length} item${digest.items.length === 1 ? "" : "s"} to review`;
  const intro = [
    waitCount ? `${waitCount} wait${waitCount === 1 ? "s" : ""} for you.` : null,
    autoCount ? (paused ? `${autoCount} low-risk (auto-apply paused until ${pausedUntil.slice(0, 10)}).` : `${autoCount} low-risk, applying ${fmtWhen(digest.autoApplyAt)} if you leave them.`) : null,
    digest.waitingEarlier ? `${digest.waitingEarlier} item(s) from earlier digests still wait for you on /manager.` : null
  ].filter(Boolean).join(" ");

  const htmlItems = [];
  const textItems = [];
  for (const item of digest.items) {
    const st = statuses[item.proposalId] || "pending";
    const v = verdictLine(item.review);
    const t = tierLine(item, digest, paused);
    const l = links[item.proposalId];
    const kindLabel = item.kind === "edit" ? "Definition edit" : item.kind === "new_term" ? "New term" : item.action;
    const sourcesHtml = (item.sources || []).length
      ? `<ul style="margin:4px 0 8px 18px;padding:0;">${item.sources.map(s => `<li>${s.url ? `<a href="${esc(s.url)}" style="color:${C.accent}">${esc(s.label || s.url)}</a>` : esc(s.label)}</li>`).join("")}</ul>`
      : `<p style="margin:4px 0 8px;color:${C.muted}">No sources recorded.</p>`;
    const prevHtml = item.previousDefinition
      ? `<p style="margin:4px 0;color:${C.muted};font-size:14px;"><em>Current:</em> ${esc(item.previousDefinition)}</p>` : "";
    const nearest = item.nearest ? `${item.nearest.label} (${item.nearest.id})${item.nearest.relation ? `, ${item.nearest.relation}` : ""}` : "none close";
    htmlItems.push(`<div style="border-top:1px solid ${C.line};padding:14px 0;">
<div style="font-size:13px;color:${C.muted};font-family:Arial,sans-serif;">#${item.n} · ${esc(kindLabel)}${st !== "pending" ? ` · <strong>${esc(st)}</strong>` : ""}</div>
<h2 style="font-size:19px;margin:2px 0 6px;font-weight:bold;">${esc(item.term)}</h2>
${prevHtml}
<p style="margin:4px 0 8px;">${item.previousDefinition ? "<em>Proposed:</em> " : ""}${esc(item.definition)}</p>
<div style="font-size:14px;"><strong>Sources</strong>${sourcesHtml}
<p style="margin:4px 0;"><strong>Nearest node:</strong> ${esc(nearest)}</p>
<p style="margin:4px 0;"><strong>Lexi's rationale:</strong> ${esc(item.rationale)}</p>
<p style="margin:4px 0;">${v.html}</p>
<p style="margin:4px 0 10px;">${t.html}</p></div>
${st === "pending" && l ? button(l.approve, "Approve", C.ok) + button(l.reject, "Reject", C.bad) + button(l.hold, "Hold", C.warn) : ""}
</div>`);
    textItems.push([
      `#${item.n} ${kindLabel}: ${item.term}${st !== "pending" ? ` [${st}]` : ""}`,
      item.previousDefinition ? `  Current:  ${item.previousDefinition}` : null,
      `  ${item.previousDefinition ? "Proposed: " : ""}${item.definition}`,
      `  Sources: ${(item.sources || []).map(s => s.url ? `${s.label} <${s.url}>` : s.label).join("; ") || "none recorded"}`,
      `  Nearest node: ${nearest}`,
      `  Lexi's rationale: ${item.rationale}`,
      `  ${v.text}`,
      `  ${t.text}`,
      st === "pending" && l ? `  Approve: ${l.approve}\n  Reject:  ${l.reject}\n  Hold:    ${l.hold}` : null
    ].filter(Boolean).join("\n"));
  }

  const footerHtml = `<div style="border-top:1px solid ${C.line};padding-top:14px;">
${links.approveAll ? button(links.approveAll, `Approve all ${digest.items.length}`, C.ok) : ""}
<p style="font-size:14px;margin:10px 0 4px;">${paused
    ? `Auto-apply is paused until ${esc(pausedUntil.slice(0, 10))}. ${links.resume ? `<a href="${esc(links.resume)}" style="color:${C.accent}">Resume now</a>` : ""}`
    : `Going away? Pause auto-apply for <a href="${esc(links.pause[1])}" style="color:${C.accent}">1 week</a> · <a href="${esc(links.pause[2])}" style="color:${C.accent}">2 weeks</a> · <a href="${esc(links.pause[4])}" style="color:${C.accent}">4 weeks</a>. Proposals keep queuing; nothing applies without you.`}</p>
<p style="font-size:13px;color:${C.muted};margin:4px 0;">Digest ${esc(digest.id)} · <a href="https://ai-terminology.com/manager/" style="color:${C.muted}">/manager</a></p></div>`;

  const footerText = [
    links.approveAll ? `Approve all ${digest.items.length}: ${links.approveAll}` : null,
    paused
      ? `Auto-apply is paused until ${pausedUntil.slice(0, 10)}.${links.resume ? ` Resume: ${links.resume}` : ""}`
      : `Pause auto-apply: 1 week ${links.pause[1]}\n  2 weeks ${links.pause[2]}\n  4 weeks ${links.pause[4]}`,
    `Digest ${digest.id} · https://ai-terminology.com/manager/`,
    "",
    "Reply to this email to ask, act by number, find sources, merge, or redraft."
  ].filter(v => v !== null).join("\n");

  return {
    subject: `${title} [Lexi ${digest.id}]`,
    html: shell(title, `<p>${esc(intro)}</p>${htmlItems.join("")}${footerHtml}`),
    text: `${title}\n${intro}\n\n${textItems.join("\n\n")}\n\n${footerText}\n`
  };
}

// Alerts: failures, flags, issues, Lexi's questions. lines: string[]; link:
// optional { href, label }; markRead: optional signed URL.
export function renderAlert({ subject, intro, lines = [], link, markRead }) {
  const html = shell(subject, `${intro ? `<p>${esc(intro)}</p>` : ""}
${lines.length ? `<ul style="padding-left:18px;">${lines.map(l => `<li style="margin-bottom:6px;">${esc(l)}</li>`).join("")}</ul>` : ""}
${link ? `<p><a href="${esc(link.href)}" style="color:${C.accent}">${esc(link.label)}</a></p>` : ""}
${markRead ? `<p>${button(markRead, "Mark these notes read", C.ok)}</p>` : ""}`);
  const text = [subject, intro || null, "", ...lines.map(l => `- ${l}`), link ? `\n${link.label}: ${link.href}` : null, markRead ? `\nMark these notes read: ${markRead}` : null]
    .filter(v => v !== null).join("\n");
  return { subject: `${subject} [Lexi]`, html, text };
}

// Weekly "what went live". items: [{ label, kindLabel, appliedAt, approvedBy, undo }]
export function renderWeekly({ items, since }) {
  const title = `What went live this week: ${items.length}`;
  const rows = items.map(i => `<div style="border-top:1px solid ${C.line};padding:10px 0;">
<strong>${esc(i.label)}</strong> <span style="color:${C.muted};font-size:14px;">${esc(i.kindLabel)} · ${esc(fmtWhen(i.appliedAt))} · ${esc(i.approvedBy === "auto-72h" ? "auto-applied" : `approved by ${i.approvedBy || "?"}`)}</span><br>
${i.undo ? button(i.undo, "Undo", C.bad) : `<span style="color:${C.muted};font-size:13px;">${esc(i.undoNote || "No undo path.")}</span>`}</div>`).join("");
  const html = shell(title, `<p>Everything applied to the graph since ${esc(since.slice(0, 10))}. Undo links work for 14 days.</p>${rows}`);
  const text = `${title}\nApplied since ${since.slice(0, 10)}. Undo links work for 14 days.\n\n` +
    items.map(i => `- ${i.label} (${i.kindLabel}, ${fmtWhen(i.appliedAt)}, ${i.approvedBy === "auto-72h" ? "auto-applied" : `approved by ${i.approvedBy || "?"}`})${i.undo ? `\n  Undo: ${i.undo}` : ""}`).join("\n");
  return { subject: `${title} [Lexi weekly]`, html, text };
}

// Web pages for /lexi/act.
export function page(title, inner, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)} · Lexi</title></head>
<body style="margin:0;background:${C.paper};color:${C.ink};font-family:Georgia,serif;">
<main style="max-width:560px;margin:0 auto;padding:40px 16px;line-height:1.5;">
<div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">Lexi · ai-terminology.com</div>
<h1 style="font-weight:normal;font-size:26px;">${esc(title)}</h1>${inner}</main></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer", "x-robots-tag": "noindex" }
  });
}

export const pageButtonStyle = `font-size:17px;padding:12px 28px;border:0;border-radius:6px;background:${C.accent};color:#fff;cursor:pointer;font-family:Arial,sans-serif;`;
export const pageColors = C;
