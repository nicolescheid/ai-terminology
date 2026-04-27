// ═══════════════════════════════════════════════════════════════
// Shared graph engine
//
// Mounts a force-directed knowledge graph into a host element with
// a theme contract. Variations differ in chrome (header, panel,
// background, type) but share this engine — so improvements to
// hover, search, and accessibility land in one place.
//
// Required globals on window:
//   - d3                  (d3.min.js)
//   - NODES, CL           (graph-data.js)
//   - PaletteEngine       (shared/palette.js)
//
// Usage:
//   GraphEngine.mount({
//     host: '#stage',         // selector or element
//     palette: 'light',       // 'light' | 'dark' | 'muted-paper'
//     theme: { ... },         // see THEME contract below
//     onNodeOpen: fn,         // called with node when user opens it
//     onClose: fn,            // called when panel closes
//     showClusterField: 'soft-blob' | 'contour' | 'territory' | 'none',
//   });
// ═══════════════════════════════════════════════════════════════
(function (root) {
  function mount(opts) {
    const host = typeof opts.host === 'string'
      ? document.querySelector(opts.host) : opts.host;
    if (!host) throw new Error('GraphEngine: host not found');
    const NODES = root.NODES;
    const CL_BASE = root.CL;
    const palette = root.PaletteEngine.buildPalette(opts.palette || 'light', CL_BASE);
    const theme = Object.assign({
      bg: '#f7f5f0',
      fg: '#2c2c2c',
      mutedFg: '#7a7a78',
      labelFont: "'Inter', system-ui, sans-serif",
      labelWeight: 500,
      labelStrokeBg: '#f7f5f0',
      linkBase: 'rgba(40,40,60,0.16)',
      linkSyn: 'rgba(80,100,160,0.30)',
      linkComp: 'rgba(180,120,50,0.30)',
      clusterFill: 'soft-blob',
      clusterOpacity: 0.06,
      nodeFillAlpha: 0.32,
      nodeStrokeAlpha: 0.85,
      starColor: null, // set non-null on dark themes for stardust
    }, opts.theme || {});

    const markerStyle = theme.markerStyle || 'circle';

    // Apply patch overlay (agent-managed)
    const patch = root.AGENT_GRAPH_PATCH || { nodes: [], definitionOverrides: [] };
    const idx = new Map(NODES.map((n) => [n.id, n]));
    (patch.definitionOverrides || []).forEach((ov) => {
      const t = idx.get(ov.id); if (!t) return;
      const { id, ...rest } = ov;
      Object.assign(t, rest);
    });
    (patch.nodes || []).forEach((n) => {
      if (!n || !n.id || idx.has(n.id)) return;
      NODES.push(n); idx.set(n.id, n);
    });

    // Pre-compute colors via OKLCH mix
    NODES.forEach((n) => {
      const m = root.PaletteEngine.mixIdsFull(n.clusters, palette);
      n._c = m.hex; n._cMeta = m;
    });

    // Build links
    const LINKS = [];
    const seen = new Set();
    const nodeSet = new Set(NODES.map((n) => n.id));
    NODES.forEach((n) => {
      (n.rels || []).forEach((r) => {
        const k = [n.id, r].sort().join('|');
        if (!seen.has(k) && nodeSet.has(r)) {
          seen.add(k); LINKS.push({ source: n.id, target: r, type: 'related' });
        }
      });
      if (n.synonymOf && nodeSet.has(n.synonymOf)) {
        const k = [n.id, n.synonymOf].sort().join('|syn');
        if (!seen.has(k)) { seen.add(k); LINKS.push({ source: n.id, target: n.synonymOf, type: 'synonym' }); }
      }
      if (n.complements && nodeSet.has(n.complements)) {
        const k = [n.id, n.complements].sort().join('|comp');
        if (!seen.has(k)) { seen.add(k); LINKS.push({ source: n.id, target: n.complements, type: 'complement' }); }
      }
    });

    // SVG
    const svg = d3.select(host).append('svg').attr('class', 'ge-svg')
      .attr('width', '100%').attr('height', '100%')
      .style('display', 'block').style('background', 'transparent');
    const W0 = host.clientWidth || 1200, H0 = host.clientHeight || 800;
    let W = W0, H = H0;
    const defs = svg.append('defs');

    // filters
    defs.append('filter').attr('id', 'ge-glow')
      .attr('x','-30%').attr('y','-30%').attr('width','160%').attr('height','160%')
      .html('<feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.10"/>');
    defs.append('filter').attr('id', 'ge-blur')
      .attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%')
      .html('<feGaussianBlur stdDeviation="22"/>');

    const root_g = svg.append('g').attr('class', 'ge-root');
    const cloudG = root_g.append('g').attr('class', 'ge-clouds');
    const linkG = root_g.append('g').attr('class', 'ge-links');
    const nodeG = root_g.append('g').attr('class', 'ge-nodes');

    const zoom = d3.zoom().scaleExtent([0.18, 4])
      .on('zoom', (e) => root_g.attr('transform', e.transform));
    svg.call(zoom).on('dblclick.zoom', null);

    // initial cluster targets
    NODES.forEach((n) => {
      const c = palette[n.clusters[0]];
      n._tx = (c?.cx || 0.5) * W;
      n._ty = (c?.cy || 0.5) * H;
    });

    // collide radius: paper-labels need roughly half-diagonal of the rectangle
    function collideR(d) {
      if (markerStyle === 'paper-label') {
        const fs = d.sz >= 26 ? 14 : d.sz >= 18 ? 12 : d.sz >= 14 ? 11 : 10;
        const padX = d.sz >= 18 ? 14 : 11;
        const padY = d.sz >= 18 ? 7 : 5;
        const w = Math.max(48, Math.min(220, d.label.length * fs * 0.56 + padX * 2));
        const h = fs * 1.35 + padY * 2;
        return Math.hypot(w, h) / 2 + 6;
      }
      return d.sz + 18;
    }

    const sim = d3.forceSimulation(NODES)
      .force('link', d3.forceLink(LINKS).id((d) => d.id).distance(markerStyle === 'paper-label' ? 110 : 85).strength(0.12))
      .force('charge', d3.forceManyBody().strength((d) => -55 * d.sz))
      .force('collide', d3.forceCollide().radius(collideR))
      .force('cx', d3.forceX((d) => d._tx).strength(0.07))
      .force('cy', d3.forceY((d) => d._ty).strength(0.07));

    // ── cluster fields ────────────────────────────────────────
    const clusterIds = Object.keys(palette);
    const cloudData = clusterIds.map((id) => ({ id, hex: palette[id].hex,
      cx: palette[id].cx * W, cy: palette[id].cy * H, label: palette[id].label }));

    let cloudSel;
    if (theme.clusterFill === 'soft-blob') {
      cloudSel = cloudG.selectAll('ellipse').data(cloudData).join('ellipse')
        .attr('fill', (d) => d.hex).attr('fill-opacity', theme.clusterOpacity)
        .attr('filter', 'url(#ge-blur)').attr('rx', 140).attr('ry', 100);
    } else if (theme.clusterFill === 'contour') {
      // thin outlined territory — drawn each tick as a hull
      cloudSel = cloudG.selectAll('path').data(cloudData).join('path')
        .attr('fill', 'none').attr('stroke', (d) => d.hex)
        .attr('stroke-width', 0.8).attr('stroke-opacity', 0.55)
        .attr('stroke-dasharray', '2 4');
    } else if (theme.clusterFill === 'territory') {
      // solid soft fills bounded by hulls (atlas style)
      cloudSel = cloudG.selectAll('path').data(cloudData).join('path')
        .attr('fill', (d) => d.hex).attr('fill-opacity', theme.clusterOpacity)
        .attr('stroke', (d) => d.hex).attr('stroke-opacity', 0.35)
        .attr('stroke-width', 0.6);
    }

    // cluster labels (small, tracked, monoish)
    const clusterLabelG = root_g.append('g').attr('class', 'ge-cluster-labels')
      .style('pointer-events', 'none');
    const clusterLabels = theme.showClusterLabels
      ? clusterLabelG.selectAll('text').data(cloudData).join('text')
          .text((d) => d.label.toUpperCase())
          .attr('text-anchor', 'middle')
          .style('font-family', theme.metaFont || 'ui-monospace, monospace')
          .style('font-size', '9px')
          .style('letter-spacing', '0.18em')
          .style('font-weight', '500')
          .style('fill', (d) => d.hex)
          .style('fill-opacity', 0.7)
      : null;

    // ── links ─────────────────────────────────────────────────
    const lSel = linkG.selectAll('line').data(LINKS).join('line')
      .attr('class', (d) => 'ge-lk' + (d.type === 'synonym' ? ' syn' : '') + (d.type === 'complement' ? ' comp' : ''))
      .attr('fill', 'none')
      .attr('stroke', (d) => d.type === 'synonym' ? theme.linkSyn : d.type === 'complement' ? theme.linkComp : theme.linkBase)
      .attr('stroke-width', (d) => d.type === 'synonym' ? 0.9 : d.type === 'complement' ? 0.7 : 0.5)
      .attr('stroke-dasharray', (d) => d.type === 'synonym' ? '6 4' : d.type === 'complement' ? '3 3 8 3' : '1 4');

    // ── nodes ─────────────────────────────────────────────────
    function fO(d) { return d.evolved ? 0.22 : theme.nodeFillAlpha; }
    function sO(d) { return d.evolved ? 0.55 : theme.nodeStrokeAlpha; }
    function sW(d) { return d.id === 'agent' ? 2.4 : d.evolved ? 1.2 : 1.6; }
    function sD(d) { return d.evolved && d.clusters.every((c) => c === 'evolved') ? '6 3' : d.evolved ? '4 2' : null; }

    function addLabel(g, d) {
      const words = d.label.split(' ');
      const fs = d.sz >= 26 ? 13 : d.sz >= 18 ? 11.5 : d.sz >= 14 ? 10.5 : 9.5;
      const lh = fs * 1.25;
      let lines;
      if (words.length <= 1) lines = [d.label];
      else if (words.length === 2) lines = words;
      else { const m = Math.ceil(words.length / 2); lines = [words.slice(0, m).join(' '), words.slice(m).join(' ')]; }
      const offset = -(lines.length - 1) * lh / 2;
      const t = g.append('text').attr('text-anchor', 'middle')
        .style('font-family', theme.labelFont)
        .style('font-size', fs + 'px')
        .style('font-weight', theme.labelWeight)
        .style('fill', d.evolved ? theme.mutedFg : theme.fg)
        .style('stroke', theme.labelStrokeBg).style('stroke-width', '3px')
        .style('paint-order', 'stroke fill')
        .style('letter-spacing', '0.005em')
        .style('pointer-events', 'none');
      lines.forEach((line, i) => {
        t.append('tspan').attr('x', 0).attr('dy', (i === 0 ? offset : lh) + 'px').text(line);
      });
    }

    // ── Marker styles ─────────────────────────────────────────
    // theme.markerStyle: 'circle' (default) | 'paper-label' | 'pin' | 'chip'

    // Stable per-node rotation seed for hand-placed feel
    NODES.forEach((n) => {
      if (n._rot == null) {
        let h = 0; for (let i = 0; i < n.id.length; i++) h = (h * 31 + n.id.charCodeAt(i)) | 0;
        n._rot = ((((h % 200) + 200) % 200) / 100 - 1) * 1.6; // -1.6..+1.6 deg
      }
    });

    function paperLabelDims(d) {
      const fs = d.sz >= 26 ? 14 : d.sz >= 18 ? 12 : d.sz >= 14 ? 11 : 10;
      const padX = d.sz >= 18 ? 14 : 11;
      const padY = d.sz >= 18 ? 7 : 5;
      const txt = d.label;
      // approximate single-line width (serif avg ~0.56 em)
      const charW = fs * 0.56;
      const singleLineW = txt.length * charW + padX * 2;
      const maxW = 200;
      // If single-line fits within maxW, one line. Otherwise wrap to 2 lines.
      const wraps = singleLineW > maxW;
      let w, lines;
      if (!wraps) {
        w = Math.max(48, singleLineW);
        lines = 1;
      } else {
        // Find a balanced 2-line split: width = ceil(chars/2)
        const halfChars = Math.ceil(txt.length / 2);
        w = Math.min(maxW, Math.max(96, halfChars * charW + padX * 2));
        lines = 2;
      }
      const h = fs * 1.18 * lines + padY * 2;
      return { fs, padX, padY, w, h, lines };
    }

    function renderPaperLabel(g, d) {
      const { fs, padX, padY, w, h, lines } = paperLabelDims(d);
      const accent = d._c;
      // foreignObject for a real HTML label (drop shadows, sub-pixel type)
      const fo = g.append('foreignObject')
        .attr('class', 'ge-paper-fo')
        .attr('x', -w / 2).attr('y', -h / 2)
        .attr('width', w).attr('height', h)
        .style('overflow', 'visible');
      const xhtml = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      xhtml.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      xhtml.className = 'ge-paper';
      xhtml.style.cssText = [
        `width:${w}px`,
        `height:${h}px`,
        'box-sizing:border-box',
        `padding:${padY}px ${padX}px`,
        'background:#f6efdf',
        `background-image:linear-gradient(180deg, rgba(255,250,235,0.9), rgba(238,228,205,0.95))`,
        'border-radius:4px',
        `border:1px solid rgba(80,60,30,0.18)`,
        `border-left:3px solid ${accent}`,
        'box-shadow:0 2px 4px -1px rgba(60,40,15,0.18), 0 6px 14px -6px rgba(60,40,15,0.22)',
        `font-family:${theme.paperFont || "'Newsreader','GT Sectra','Times New Roman',serif"}`,
        `font-size:${fs}px`,
        `font-weight:${d.id === 'agent' || d.sz >= 22 ? 600 : 500}`,
        `color:${d.evolved ? theme.mutedFg : '#2a2418'}`,
        'line-height:1.18',
        'letter-spacing:0.005em',
        'text-align:center',
        // Allow wrapping when needed; balance lines like a headline
        lines > 1 ? 'white-space:normal' : 'white-space:nowrap',
        lines > 1 ? 'text-wrap:balance' : '',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'justify-content:center',
        `transform:rotate(${d._rot}deg)`,
        'transform-origin:center',
        'transition:transform 0.18s ease, box-shadow 0.18s ease',
      ].filter(Boolean).join(';');
      const labelEl = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      labelEl.textContent = d.label;
      labelEl.style.cssText = 'width:100%';
      xhtml.appendChild(labelEl);
      // multi-cluster gets a tiny dot row beneath the text — but only for ≥2 clusters and large enough labels
      if ((d.clusters || []).length > 1 && d.sz >= 14) {
        const dotRow = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        dotRow.style.cssText = 'display:flex;gap:3px;justify-content:center;margin-top:3px';
        d.clusters.slice(0, 4).forEach((cid) => {
          const dot = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
          const sw = palette[cid];
          dot.style.cssText = `width:5px;height:5px;border-radius:999px;background:${sw ? sw.hex : '#888'};opacity:0.85`;
          dotRow.appendChild(dot);
        });
        xhtml.appendChild(dotRow);
      }
      fo.node().appendChild(xhtml);
      // store dims for hit testing & hover scaling
      d._mw = w; d._mh = h;
    }

    function renderCircle(g, d) {
      if (d.nodeType === 'product' || d.nodeType === 'initiative') {
        g.append('circle').attr('r', d.sz + 5).attr('fill', 'none')
          .attr('stroke', d._c).attr('stroke-width', 0.6)
          .attr('stroke-opacity', 0.35)
          .attr('stroke-dasharray', d.nodeType === 'initiative' ? '2 3' : '3 2');
      }
      g.append('circle').attr('r', d.sz).attr('fill', d._c)
        .attr('fill-opacity', fO(d))
        .attr('stroke', d._c).attr('stroke-width', sW(d))
        .attr('stroke-opacity', sO(d))
        .attr('stroke-dasharray', sD(d));
      addLabel(g, d);
    }

    function renderMarker(node, d) {
      const g = d3.select(node);
      g.selectAll('*').remove();
      if (markerStyle === 'paper-label') renderPaperLabel(g, d);
      else renderCircle(g, d);
    }

    const nSel = nodeG.selectAll('g').data(NODES).join('g')
      .attr('class', 'ge-node').attr('tabindex', 0).attr('role', 'button')
      .each(function (d) { renderMarker(d3.select(this).node(), d); })
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('mouseenter', (e, d) => { if (!api.activeId) hover(d); })
      .on('mouseleave', () => { if (!api.activeId) undim(); })
      .on('click', (e, d) => { e.stopPropagation(); openNode(d); })
      .on('keydown', (e, d) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNode(d); }
      });

    svg.on('click', () => { if (!api.activeId) { undim(); opts.onClose && opts.onClose(); } });

    // ── tick ──────────────────────────────────────────────────
    function neighborsOf(id) {
      const out = new Set([id]);
      LINKS.forEach((l) => {
        if (l.source.id === id) out.add(l.target.id);
        if (l.target.id === id) out.add(l.source.id);
      });
      return out;
    }
    function updateClusterFields() {
      if (theme.clusterFill === 'none') return;
      clusterIds.forEach((id) => {
        const members = NODES.filter((n) => n.clusters.includes(id));
        if (!members.length) return;
        const mx = members.reduce((s, n) => s + n.x, 0) / members.length;
        const my = members.reduce((s, n) => s + n.y, 0) / members.length;
        if (theme.clusterFill === 'soft-blob') {
          let maxR = 0;
          members.forEach((n) => { const dst = Math.hypot(n.x - mx, n.y - my); if (dst > maxR) maxR = dst; });
          const pad = 60;
          cloudSel.filter((d) => d.id === id)
            .attr('cx', mx).attr('cy', my)
            .attr('rx', Math.max(maxR + pad, 100))
            .attr('ry', Math.max(maxR * 0.78 + pad, 80));
        } else if (theme.clusterFill === 'contour' || theme.clusterFill === 'territory') {
          // soft hull via expanded polygon → smoothed
          if (members.length < 3) {
            const r = 80;
            cloudSel.filter((d) => d.id === id)
              .attr('d', `M ${mx - r} ${my} a ${r} ${r * 0.8} 0 1 0 ${r * 2} 0 a ${r} ${r * 0.8} 0 1 0 ${-r * 2} 0`);
            return;
          }
          const pts = members.map((n) => [n.x, n.y]);
          const hull = d3.polygonHull(pts);
          if (!hull) return;
          // expand hull outward
          const exp = hull.map(([x, y]) => {
            const dx = x - mx, dy = y - my;
            const len = Math.hypot(dx, dy) || 1;
            const pad = 40;
            return [x + (dx / len) * pad, y + (dy / len) * pad];
          });
          const path = d3.line().curve(d3.curveCardinalClosed.tension(0.55))(exp);
          cloudSel.filter((d) => d.id === id).attr('d', path);
        }
        if (clusterLabels) {
          // place label above the cluster center
          let maxR = 0;
          members.forEach((n) => { const dst = Math.hypot(n.x - mx, n.y - my); if (dst > maxR) maxR = dst; });
          clusterLabels.filter((d) => d.id === id)
            .attr('x', mx).attr('y', my - maxR - 22);
        }
      });
    }
    let t = 0;
    sim.on('tick', () => {
      lSel.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      nSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
      if (++t % 8 === 0 && sim.alpha() > 0.04) updateClusterFields();
    });
    sim.on('end', updateClusterFields);
    setTimeout(() => sim.alphaDecay(0.04), 200);

    // ── interactions ──────────────────────────────────────────
    function hover(d) {
      const ids = neighborsOf(d.id);
      nSel.style('opacity', (n) => ids.has(n.id) ? 1 : 0.18);
      lSel.style('opacity', (l) => (l.source.id === d.id || l.target.id === d.id) ? 0.85 : 0.05)
          .attr('stroke-width', (l) => (l.source.id === d.id || l.target.id === d.id) ? 2.2 : 0.5)
          .attr('stroke', (l) => (l.source.id === d.id || l.target.id === d.id) ? d._c : (l.type === 'synonym' ? theme.linkSyn : l.type === 'complement' ? theme.linkComp : theme.linkBase));
    }
    function undim() {
      nSel.style('opacity', 1);
      lSel.style('opacity', 1)
        .attr('stroke', (d) => d.type === 'synonym' ? theme.linkSyn : d.type === 'complement' ? theme.linkComp : theme.linkBase)
        .attr('stroke-width', (d) => d.type === 'synonym' ? 0.9 : d.type === 'complement' ? 0.7 : 0.5);
    }
    function flyTo(d) {
      const sc = 1.5;
      const tx = W / 2 - d.x * sc;
      const ty = H / 2 - d.y * sc;
      svg.transition().duration(600).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(sc));
    }
    function resetView() {
      svg.transition().duration(500).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(W * 0.02, H * 0.02).scale(0.96));
    }
    function openNode(d) {
      api.activeId = d.id;
      const ids = neighborsOf(d.id);
      nSel.style('opacity', (n) => ids.has(n.id) ? 1 : 0.18);
      lSel.style('opacity', (l) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.06)
          .attr('stroke', (l) => (l.source.id === d.id || l.target.id === d.id) ? d._c : (l.type === 'synonym' ? theme.linkSyn : l.type === 'complement' ? theme.linkComp : theme.linkBase));
      flyTo(d);
      opts.onNodeOpen && opts.onNodeOpen(d, palette);
    }
    function closeNode() {
      api.activeId = null;
      undim(); resetView();
      opts.onClose && opts.onClose();
    }

    // resize
    const ro = new ResizeObserver(() => {
      W = host.clientWidth; H = host.clientHeight;
      NODES.forEach((n) => { const c = palette[n.clusters[0]]; n._tx = (c?.cx || 0.5) * W; n._ty = (c?.cy || 0.5) * H; });
      sim.force('cx', d3.forceX((d) => d._tx).strength(0.07));
      sim.force('cy', d3.forceY((d) => d._ty).strength(0.07));
      sim.alpha(0.1).restart();
    });
    ro.observe(host);

    setTimeout(() => {
      const startId = opts.startNodeId || 'agent';
      const start = NODES.find((n) => n.id === startId) || NODES.find((n) => n.id === 'agent');
      if (start) openNode(start); else resetView();
    }, 350);

    const api = {
      activeId: null,
      palette,
      NODES, LINKS, CL: palette,
      openNodeById: (id) => { const n = NODES.find((x) => x.id === id); if (n) openNode(n); },
      closeNode,
      hover, undim,
      filterByCluster: (clusterIdSet) => {
        if (!clusterIdSet || !clusterIdSet.size) {
          nSel.style('opacity', 1).style('pointer-events', 'all');
          lSel.style('opacity', 1); return;
        }
        nSel.style('opacity', (d) => d.clusters.some((c) => clusterIdSet.has(c)) ? 1 : 0.10)
            .style('pointer-events', (d) => d.clusters.some((c) => clusterIdSet.has(c)) ? 'all' : 'none');
        lSel.style('opacity', (l) => {
          const sc = l.source.clusters || [], tc = l.target.clusters || [];
          return sc.some((c) => clusterIdSet.has(c)) || tc.some((c) => clusterIdSet.has(c)) ? 0.5 : 0.05;
        });
      },
      zoomBy: (f) => svg.transition().duration(260).call(zoom.scaleBy, f),
      resetView,
    };
    return api;
  }
  root.GraphEngine = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
