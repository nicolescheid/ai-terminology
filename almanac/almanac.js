// Lexi's Almanac — page renderer.
//
// Fetches /almanac/metrics.json (current snapshot) and /almanac/history.jsonl
// (append-only time-series), then populates each section of the page.
// All charts are hand-rolled SVG — no chart library — to keep the bundle
// tiny and the visual language quiet.

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat("en-US").format(n || 0);
  const titleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Cluster colors fall back to a small palette if metrics doesn't include
  // a hex (e.g., a longlist cluster not present in the base graph palette).
  const FALLBACK_COLORS = ["#5a6b8f", "#a8854a", "#8a9070", "#9b6a8a", "#6a8a9b", "#b08a5a", "#7a8a5a", "#9a7a8a"];

  Promise.all([
    fetch("./metrics.json", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
    fetch("./history.jsonl", { cache: "no-store" }).then((r) => r.ok ? r.text() : "")
  ]).then(([metrics, historyText]) => {
    if (!metrics) {
      $("loading").textContent = "Couldn't load metrics. Check back soon.";
      return;
    }
    const history = parseHistory(historyText);
    render(metrics, history);
    $("loading").hidden = true;
    $("content").hidden = false;
  }).catch((err) => {
    console.error(err);
    $("loading").textContent = "Something went wrong loading the data.";
  });

  function parseHistory(text) {
    if (!text) return [];
    return text.split(/\r?\n/).filter(Boolean).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  }

  function render(metrics, history) {
    renderHeadline(metrics);
    renderGrowth(history, metrics);
    renderThisWeek(metrics);
    renderAlmost(metrics);
    renderSources(metrics);
    renderClusters(metrics);
    renderVelocity(metrics);
    renderProposals(metrics);
    renderCosts(metrics);
    renderAudit(metrics);
    renderFooter(metrics);
  }

  // ────────────────────────────────────────────────────────────────────
  function renderHeadline(metrics) {
    const h = metrics.headline;
    const stats = [
      { num: fmt(h.articlesRead), lbl: "Articles read" },
      { num: fmt(h.daysRunning), lbl: "Days running" },
      { num: fmt(h.longlistSize), lbl: "On the longlist" },
      { num: fmt(h.graphSize), lbl: "In the graph" }
    ];
    $("headline").innerHTML = stats.map((s) => `
      <div class="stat">
        <div class="num">${s.num}</div>
        <div class="lbl">${s.lbl}</div>
      </div>
    `).join("");
    if (metrics.firstRunAt) {
      const since = metrics.firstRunAt.slice(0, 10);
      const phaseTxt = metrics.phase ? ` · Phase ${metrics.phase}` : "";
      $("firstrun").textContent = `Watching since ${since}${phaseTxt}`;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  function renderGrowth(history, metrics) {
    const el = $("growth");
    if (!history.length) {
      el.innerHTML = `<div class="empty">No history snapshots yet — the curves will appear after Lexi's next run.</div>`;
      return;
    }
    if (history.length === 1) {
      el.innerHTML = `
        <svg viewBox="0 0 600 240" preserveAspectRatio="none">
          <circle cx="500" cy="120" r="6" class="single" />
          <text x="500" y="100" class="axis" text-anchor="middle">${history[0].date}</text>
        </svg>
        <div class="empty">Only one snapshot so far. The curves take shape from the second run onward.</div>
      `;
      return;
    }

    // Multi-point line chart
    const W = 600, H = 240, P = { l: 36, r: 18, t: 18, b: 26 };
    const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
    const xs = history.map((h) => new Date(h.ts).getTime());
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const xRange = Math.max(1, x1 - x0);
    const ys = history.flatMap((h) => [h.longlistSize || 0, h.graphSize || 0]);
    const yMax = Math.max(10, Math.max(...ys) * 1.1);

    const px = (t) => P.l + ((t - x0) / xRange) * innerW;
    const py = (v) => P.t + innerH - (v / yMax) * innerH;

    const linePath = (key) => history.map((h, i) => `${i === 0 ? "M" : "L"} ${px(new Date(h.ts).getTime()).toFixed(1)} ${py(h[key] || 0).toFixed(1)}`).join(" ");
    const areaPath = (key) => {
      const top = history.map((h, i) => `${i === 0 ? "M" : "L"} ${px(new Date(h.ts).getTime()).toFixed(1)} ${py(h[key] || 0).toFixed(1)}`).join(" ");
      const bottomRight = `L ${px(x1).toFixed(1)} ${(P.t + innerH).toFixed(1)}`;
      const bottomLeft  = `L ${px(x0).toFixed(1)} ${(P.t + innerH).toFixed(1)} Z`;
      return top + " " + bottomRight + " " + bottomLeft;
    };

    // Y-axis ticks (4 tick gridlines)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
    const gridY = ticks.map((v) => `<line class="gridline" x1="${P.l}" x2="${W - P.r}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}" />`).join("");
    const labelsY = ticks.map((v) => `<text class="axis" x="${P.l - 6}" y="${(py(v) + 3).toFixed(1)}" text-anchor="end">${v}</text>`).join("");

    // X labels: first + last date
    const labelsX = `
      <text class="axis" x="${P.l}" y="${H - 8}" text-anchor="start">${history[0].date}</text>
      <text class="axis" x="${W - P.r}" y="${H - 8}" text-anchor="end">${history[history.length - 1].date}</text>
    `;

    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        ${gridY}
        <path class="area-longlist" d="${areaPath("longlistSize")}" />
        <path class="area-graph"    d="${areaPath("graphSize")}" />
        <path class="line-longlist" d="${linePath("longlistSize")}" />
        <path class="line-graph"    d="${linePath("graphSize")}" />
        ${labelsY}
        ${labelsX}
      </svg>
      <div class="legend">
        <span><span class="swatch" style="background:#a8854a"></span>Longlist (Tier 2)</span>
        <span><span class="swatch" style="background:#5a6b8f"></span>Graph (Tier 1)</span>
      </div>
    `;
  }

  // ────────────────────────────────────────────────────────────────────
  function renderThisWeek(metrics) {
    const w = metrics.thisWeek;
    const rows = [
      ["Articles read", w.articlesFetched],
      ["New terms added to longlist", w.longlistAdded],
      ["Re-sightings (sources merged)", w.sourcesAdded],
      ["Promotions to graph", w.promotionsToGraph],
      ["Proposals queued", w.proposalsQueued],
      ["Auditor flags raised", w.auditFlags],
      ["Notes written for Nicole", w.notesAdded]
    ];
    $("thisweek").innerHTML = rows.map(([name, val]) => `
      <div class="statrow">
        <div class="name">${name}</div>
        <div class="val">${fmt(val)}</div>
      </div>
    `).join("");
  }

  // ────────────────────────────────────────────────────────────────────
  function renderAlmost(metrics) {
    const items = metrics.almostThere || [];
    if (!items.length) {
      $("almost").innerHTML = `<div class="empty">Nothing on the doorstep yet — terms appear here as they accumulate evidence.</div>`;
      return;
    }
    $("almost").innerHTML = items.map((it) => {
      const ready = it.gapCount === 0;
      const fullName = it.fullName && it.fullName !== it.label ? `<span class="full">(${escapeHtml(it.fullName)})</span>` : "";
      const clusters = (it.clusters || []).slice(0, 3).map((c) => `<span class="cluster">${escapeHtml(c)}</span>`).join("");
      return `
        <div class="item">
          <div class="head">
            <div>
              <span class="label">${escapeHtml(it.label)}</span>
              ${fullName}
            </div>
            <div class="clusters">${clusters}</div>
          </div>
          <div class="meta">${it.sourceCount} source${it.sourceCount === 1 ? "" : "s"} · ${it.independentSources} independent · ${it.daysOnLonglist}d on longlist</div>
          <div class="gap ${ready ? "ready" : ""}">${ready ? "✓ meets credibility bar" : escapeHtml(it.gap)}</div>
          ${it.domains && it.domains.length ? `<div class="domains">${it.domains.map(escapeHtml).join(" · ")}</div>` : ""}
        </div>
      `;
    }).join("");
  }

  // ────────────────────────────────────────────────────────────────────
  function renderSources(metrics) {
    const top = (metrics.sources?.byDomain || []).slice(0, 12);
    if (!top.length) {
      $("sources").innerHTML = `<div class="empty">No source data yet.</div>`;
      return;
    }
    const max = Math.max(...top.map((d) => d.count));
    const rows = top.map((d) => {
      const pct = (d.count / max) * 100;
      return `
        <div class="bar">
          <div class="lbl">
            <span class="fill" style="width:${pct.toFixed(1)}%"></span>
            <span>${escapeHtml(d.domain)}</span>
          </div>
          <div class="n">${fmt(d.count)}</div>
        </div>
      `;
    }).join("");
    const newDomains = metrics.sources?.newDomainsLast30d || [];
    const totalLine = `${metrics.sources?.totalUniqueDomains || 0} unique domain${(metrics.sources?.totalUniqueDomains || 0) === 1 ? "" : "s"} read so far${newDomains.length ? `, ${newDomains.length} new in the last 30 days` : ""}.`;
    $("sources").innerHTML = `
      <div class="bars">${rows}</div>
      <div class="sectionsub" style="margin-top:18px;margin-bottom:0">${totalLine}</div>
    `;
  }

  // ────────────────────────────────────────────────────────────────────
  function renderClusters(metrics) {
    const dist = (metrics.clusters?.distribution || []).filter((c) => c.count > 0);
    if (!dist.length) {
      $("clusters").innerHTML = `<div class="empty">No cluster data yet.</div>`;
      return;
    }
    const total = dist.reduce((s, c) => s + c.count, 0);
    const segs = dist.map((c, i) => {
      const pct = (c.count / total) * 100;
      const color = c.hex || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      const showLabel = pct >= 7;
      return `<div class="seg" style="background:${color}40;color:${darken(color)};flex:${pct}">${showLabel ? c.count : ""}</div>`;
    }).join("");
    const legend = dist.map((c, i) => {
      const color = c.hex || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      return `<div class="item"><span class="swatch" style="background:${color}"></span>${escapeHtml(c.label)} <span style="color:#a39e90">${c.count}</span></div>`;
    }).join("");
    $("clusters").innerHTML = `
      <div class="stackbar">${segs}</div>
      <div class="clusterlegend">${legend}</div>
    `;
  }

  // Approximate "darker version" for use as text-on-tint label.
  function darken(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return "#3a3a36";
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    return `rgb(${Math.round(r * 0.5)},${Math.round(g * 0.5)},${Math.round(b * 0.5)})`;
  }

  // ────────────────────────────────────────────────────────────────────
  function renderVelocity(metrics) {
    const v = metrics.velocity;
    const total = (v.humanGated || 0) + (v.autonomous || 0);
    let bar;
    if (total === 0) {
      bar = `<div class="bar2"><div class="seg empty">No graph promotions yet</div></div>`;
    } else {
      const humanPct = (v.humanGated / total) * 100;
      const agenticPct = (v.autonomous / total) * 100;
      bar = `<div class="bar2">
        ${humanPct > 0 ? `<div class="seg human" style="flex:${humanPct}">Human-gated · ${v.humanGated}</div>` : ""}
        ${agenticPct > 0 ? `<div class="seg agentic" style="flex:${agenticPct}">Autonomous · ${v.autonomous}</div>` : ""}
      </div>`;
    }
    const note = v.note || `${v.humanGated} human-gated, ${v.autonomous} autonomous.`;
    $("velocity").innerHTML = `${bar}<div class="note">${escapeHtml(note)}</div>`;
  }

  // ────────────────────────────────────────────────────────────────────
  function renderProposals(metrics) {
    const p = metrics.proposalsByStatus || {};
    const rows = [
      ["Pending Nicole's review", p.pending || 0],
      ["Approved (awaiting apply)", p.approved || 0],
      ["Applied to graph", p.applied || 0],
      ["Rejected", p.rejected || 0]
    ];
    $("proposals").innerHTML = rows.map(([name, val]) => `
      <div class="statrow">
        <div class="name">${name}</div>
        <div class="val">${fmt(val)}</div>
      </div>
    `).join("");
  }

  // ────────────────────────────────────────────────────────────────────
  function renderCosts(metrics) {
    const c = metrics.costs || {};
    if (!c.available) {
      $("costs").innerHTML = `
        <div class="coming">
          <div class="lbl">Coming soon</div>
          <p>${escapeHtml(c.note || "Token + cost data lands in a follow-up.")}</p>
        </div>
      `;
      return;
    }
    // Real costs panel — fills in once usage capture lands. For now, the
    // unavailable branch above renders. Stub the future shape:
    $("costs").innerHTML = `
      <div class="card">
        <div class="statrow"><div class="name">Total cost since launch</div><div class="val">$${(c.totalUsd || 0).toFixed(2)}</div></div>
        <div class="statrow"><div class="name">Cost per longlist add</div><div class="val">$${(c.perTermUsd || 0).toFixed(3)}</div></div>
        <div class="statrow"><div class="name">Tokens (cached / uncached / output)</div><div class="val">${fmt(c.tokens?.cachedInput)} / ${fmt(c.tokens?.uncachedInput)} / ${fmt(c.tokens?.output)}</div></div>
      </div>
    `;
  }

  // ────────────────────────────────────────────────────────────────────
  function renderAudit(metrics) {
    const a = metrics.audit || {};
    const types = a.flagsByType || {};
    const total = a.flagsTotal || 0;
    if (total === 0) {
      $("audit").innerHTML = `
        <div class="empty">The auditor hasn't flagged anything yet — either Lexi's been quiet, or the heuristics haven't found a pattern worth raising.</div>
        <div class="sectionsub" style="margin-top:14px;margin-bottom:0">The auditor watches for <em>cross-temporal source clustering</em>, <em>independence over-counting</em>, and <em>suspicious adoption velocity</em>.</div>
      `;
      return;
    }
    const rows = Object.entries(types).map(([k, v]) => `
      <div class="statrow">
        <div class="name">${escapeHtml(titleCase(k))}</div>
        <div class="val">${fmt(v)}</div>
      </div>
    `).join("");
    $("audit").innerHTML = `
      ${rows}
      <div class="sectionsub" style="margin-top:14px;margin-bottom:0">${fmt(total)} total flag${total === 1 ? "" : "s"} raised. The auditor runs weekly, independent of the main agent loop.</div>
    `;
  }

  // ────────────────────────────────────────────────────────────────────
  function renderFooter(metrics) {
    const updated = metrics.generatedAt ? metrics.generatedAt.slice(0, 16).replace("T", " ") + " UTC" : "—";
    $("foot").innerHTML = `
      <div>Last refreshed: ${updated}</div>
      <div>
        <a href="https://github.com/nicolescheid/ai-terminology/blob/main/lexi-spec.md" target="_blank" rel="noopener">Spec</a> ·
        <a href="https://github.com/nicolescheid/ai-terminology" target="_blank" rel="noopener">Repo</a>
      </div>
    `;
  }

  // ────────────────────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
