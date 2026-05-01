// Lexi's List — public page renderer.
//
// Fetches must-reads.json (the canonical reading list) and metrics.json
// (for the cluster palette — labels and colors). Groups entries by their
// primary cluster, sorts within each group by date (newest first), and
// renders public-friendly cards. Status (read/dismissed/unread) is
// deliberately NOT shown — that's Nicole's private state. Priority IS
// shown — useful editorial signal.

(function () {
  const $ = (id) => document.getElementById(id);

  // Fallback palette in case metrics.json isn't available yet (first deploy
  // before the workflow has rebuilt). Keeps the page working in degraded mode.
  const FALLBACK_HEX = "#5a6b8f";

  Promise.all([
    fetch("/knowledge-graph-agent/must-reads.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
    fetch("/almanac/metrics.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
  ]).then(([data, metrics]) => {
    if (!data) {
      $("loading").textContent = "Couldn't load Lexi's List. Check back soon.";
      return;
    }
    const palette = buildPalette(metrics);
    render(data, palette);
    $("loading").hidden = true;
    $("content").hidden = false;
    $("foot").hidden = false;
  }).catch((err) => {
    console.error(err);
    $("loading").textContent = "Something went wrong loading the list.";
  });

  function buildPalette(metrics) {
    const map = {};
    const palette = (metrics && metrics.clusters && metrics.clusters.palette) || [];
    for (const c of palette) map[c.id] = c;
    return map;
  }

  function render(data, palette) {
    const all = (data.entries || []).filter(e => e.status !== "dismissed");
    if (all.length === 0) {
      $("content").innerHTML = `
        <div class="empty">
          Lexi hasn't flagged anything yet. The list is intentionally selective —
          most articles don't clear the bar. Come back soon.
        </div>
      `;
      $("updated").textContent = data.meta?.generatedAt
        ? "Last updated: " + fmtDate(data.meta.generatedAt)
        : "";
      return;
    }

    // Group by primary cluster (first in the entry's clusters array).
    const groups = new Map();
    for (const e of all) {
      const primary = (e.clusters && e.clusters[0]) || "uncategorized";
      if (!groups.has(primary)) groups.set(primary, []);
      groups.get(primary).push(e);
    }

    // Order groups by size desc, ties broken by label.
    const sortedGroups = [...groups.entries()].sort((a, b) => {
      const aLabel = palette[a[0]]?.label || a[0];
      const bLabel = palette[b[0]]?.label || b[0];
      return b[1].length - a[1].length || aLabel.localeCompare(bLabel);
    });

    // Within each group, order by best-available-date descending (publishedAt
    // > flaggedAt). Ties broken by priority (lower = higher priority).
    for (const [, items] of sortedGroups) {
      items.sort((a, b) => {
        const ad = a.publishedAt || a.flaggedAt || "";
        const bd = b.publishedAt || b.flaggedAt || "";
        if (bd !== ad) return bd.localeCompare(ad);
        return (a.priority || 9) - (b.priority || 9);
      });
    }

    const html = sortedGroups.map(([clusterId, items]) => {
      const c = palette[clusterId] || { label: titleCase(clusterId), hex: FALLBACK_HEX };
      const itemsHtml = items.map(renderItem).join("");
      const groupSub = items.length === 1 ? "1 article" : items.length + " articles";
      return `
        <div class="group">
          <h2><span class="swatch" style="background:${c.hex || FALLBACK_HEX}"></span> ${escapeHtml(c.label)}</h2>
          <div class="gsub">${groupSub}</div>
          ${itemsHtml}
        </div>
      `;
    }).join("");

    $("content").innerHTML = html;
    $("updated").textContent = data.meta?.generatedAt
      ? "Last updated: " + fmtDate(data.meta.generatedAt)
      : "";
  }

  function renderItem(e) {
    const dateLine = formatDateLine(e);
    const priorityClass = e.priority === 1 ? "p1" : e.priority === 2 ? "p2" : "p3";
    return `
      <div class="item">
        <div class="top">
          <span class="priority ${priorityClass}">P${e.priority || "?"}</span>
          <a class="title" href="${escapeAttr(e.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.title || "(untitled)")}</a>
        </div>
        <div class="meta">
          <span class="source">${escapeHtml(e.source || "")}</span>
          ${dateLine ? ` · ${dateLine}` : ""}
        </div>
        ${e.reason ? `<div class="reason">“${escapeHtml(e.reason)}”</div>` : ""}
        ${e.summary ? `<div class="summary">${escapeHtml(e.summary)}</div>` : ""}
      </div>
    `;
  }

  // Format the date line. If publishedAt is set (RSS feeds usually provide it),
  // show "Apr 28, 2026". If absent (html_index sources don't extract it),
  // show "Retrieved May 2026" using the flaggedAt month, marked italic so
  // readers can see the difference.
  function formatDateLine(e) {
    if (e.publishedAt) {
      const d = new Date(e.publishedAt);
      if (!isNaN(d.getTime())) return fmtDayMonthYear(d);
    }
    if (e.flaggedAt) {
      const d = new Date(e.flaggedAt);
      if (!isNaN(d.getTime())) {
        return `<span class="retrieved">Retrieved ${fmtMonthYear(d)}</span>`;
      }
    }
    return "";
  }

  function fmtDayMonthYear(d) {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  function fmtMonthYear(d) {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }
  function fmtDate(iso) {
    return iso.slice(0, 10);
  }
  function titleCase(s) {
    return String(s).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }
})();
