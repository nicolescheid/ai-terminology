// Variation 1 — ATLAS
// Light paper background. Cartographic discipline.
// Cluster regions are soft hull territories. Mono labels for cluster names.
// Floating circular legend dial in the corner.
// Detail panel: floating card right-side, restrained.

(function () {
  const { useEffect, useRef, useState, useMemo } = React;

  function AtlasVariation({ id }) {
    const stageRef = useRef(null);
    const apiRef = useRef(null);
    const [active, setActive] = useState(null);
    const [filters, setFilters] = useState(() => new Set());
    const [search, setSearch] = useState('');
    const [legendOpen, setLegendOpen] = useState(true); // open by default — clusters are the navigation; auto-closes after 6s if not engaged with (effect below)
    const [legendEngaged, setLegendEngaged] = useState(false); // true once user toggles the pill or clicks a cluster chip → don't auto-close
    const [palette, setPalette] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [idle, setIdle] = useState(false);
    const [firstVisitCue, setFirstVisitCue] = useState('Click me to chat about any term.'); // dismisses on first interaction or after 8s — see effect below

    // idle detection — Lexi falls asleep after 60s of no input
    useEffect(() => {
      let t = null;
      const reset = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 60000); };
      reset();
      const evts = ['mousemove','keydown','wheel','pointerdown'];
      evts.forEach((e) => window.addEventListener(e, reset, { passive: true }));
      return () => { clearTimeout(t); evts.forEach((e) => window.removeEventListener(e, reset)); };
    }, []);

    // First-visit Lexi-is-clickable cue — auto-clears on first user interaction
    // OR after 8 seconds. The point is "she's interactive now, click her" — most
    // visitors don't realise the corner mascot is also a chat surface.
    useEffect(() => {
      const clear = () => setFirstVisitCue(null);
      const t = setTimeout(clear, 8000);
      const evts = ['mousedown', 'keydown', 'touchstart'];
      evts.forEach((e) => window.addEventListener(e, clear, { once: true, passive: true }));
      return () => {
        clearTimeout(t);
        evts.forEach((e) => window.removeEventListener(e, clear));
      };
    }, []);

    // Legend auto-close — opens on first paint so the cluster vocabulary is
    // visible immediately, then slides closed after 6s so it doesn't crowd
    // the page. Once the user engages (toggles the pill or clicks a chip),
    // legendEngaged flips true and auto-close is suppressed for the session.
    useEffect(() => {
      if (legendEngaged) return;
      const t = setTimeout(() => setLegendOpen(false), 6000);
      return () => clearTimeout(t);
    }, [legendEngaged]);

    useEffect(() => {
      if (!stageRef.current || apiRef.current) return;
      const startNodeId = new URLSearchParams(window.location.search).get('term') || undefined;
      const api = window.GraphEngine.mount({
        host: stageRef.current,
        palette: 'light',
        startNodeId,
        theme: {
          bg: '#f4f1ea',
          fg: '#1f1d18',
          mutedFg: '#7a7568',
          labelFont: "'Inter Tight', 'Inter', system-ui, sans-serif",
          labelWeight: 540,
          labelStrokeBg: '#f4f1ea',
          linkBase: 'rgba(60,55,40,0.16)',
          linkSyn: 'rgba(60,90,150,0.30)',
          linkComp: 'rgba(160,110,45,0.30)',
          clusterFill: 'soft-blob',
          clusterOpacity: 0.05,
          nodeFillAlpha: 0.30,
          nodeStrokeAlpha: 0.85,
          showClusterLabels: true,
          metaFont: "'JetBrains Mono', ui-monospace, monospace",
          markerStyle: 'paper-label',
          paperFont: "'Newsreader','GT Sectra','Times New Roman',serif",
        },
        onNodeOpen: (d) => {
          setActive(d);
          // sync URL
          const u = new URL(window.location.href);
          u.searchParams.set('term', d.id);
          window.history.replaceState(null, '', u.toString());
        },
        onClose: () => {
          setActive(null);
          const u = new URL(window.location.href);
          u.searchParams.delete('term');
          window.history.replaceState(null, '', u.toString());
        },
      });
      apiRef.current = api;
      setPalette(api.palette);
      setNodes(api.NODES);

      // browser back/forward syncs the open term
      const onPop = () => {
        const id = new URLSearchParams(window.location.search).get('term');
        if (id) apiRef.current?.openNodeById(id);
        else apiRef.current?.closeNode();
      };
      window.addEventListener('popstate', onPop);
      return () => window.removeEventListener('popstate', onPop);
    }, []);

    const hits = useMemo(() => {
      if (!search.trim() || !nodes.length) return [];
      const q = search.trim().toLowerCase();
      return nodes
        .filter((n) => n.label.toLowerCase().includes(q) || (n.fullName||'').toLowerCase().includes(q))
        .slice(0, 7);
    }, [search, nodes]);

    function toggleFilter(id) {
      setLegendEngaged(true);
      const next = new Set(filters);
      next.has(id) ? next.delete(id) : next.add(id);
      setFilters(next);
      apiRef.current?.filterByCluster(next);
    }

    function toggleLegend() {
      setLegendEngaged(true);
      setLegendOpen((o) => !o);
    }

    return (
      <div className="atlas-stage" style={{ background: '#f4f1ea', color: '#1f1d18',
        fontFamily: "'Inter Tight','Inter',system-ui,sans-serif" }}>

        {/* Paper grain overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background: "radial-gradient(ellipse at 30% 20%, rgba(220,200,160,0.10), transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(160,170,200,0.08), transparent 55%)",
          zIndex: 0 }} />

        {/* Header bar — semi-transparent strip across the top, anchors the
            title + the framing/how-to copy as one block. Backdrop blur lets
            the paper texture show through gently. The 1px bottom border gives
            a soft visual separation from the graph stage below without
            looking like a chrome ribbon. Search input sits just below the
            header (top: 98px now to clear it on small screens). */}
        <div style={{
          position:'absolute', top: 0, left: 0, right: 0, zIndex: 4,
          padding:'18px 32px 16px',
          background:'rgba(244,241,234,0.72)',
          backdropFilter:'blur(12px)',
          WebkitBackdropFilter:'blur(12px)',
          borderBottom:'1px solid rgba(31,29,24,0.06)',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          gap: 24, flexWrap:'wrap',
        }}>
          {/* Title left */}
          <div style={{ display:'flex', alignItems:'baseline', gap: 14 }}>
            <div style={{ fontFamily: "'GT Sectra','Times New Roman',serif",
              fontSize: 26, lineHeight: 1, letterSpacing: '-0.01em' }}>
              Lexicon
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',ui-monospace,monospace",
              fontSize: 9, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'#7a7568', paddingTop: 4 }}>
              ATLAS &nbsp;·&nbsp; Q1 2026 &nbsp;·&nbsp; v2.0
            </div>
          </div>

          {/* Framing right */}
          <div style={{ textAlign:'right', maxWidth: 280 }}>
            <div style={{ fontFamily: "'GT Sectra','Times New Roman',serif",
              fontSize: 14, lineHeight: 1.3, color: '#1f1d18', fontStyle: 'italic' }}>
              An atlas of AI vocabulary, curated.
            </div>
            <div style={{ marginTop: 4,
              fontFamily:"'JetBrains Mono',ui-monospace,monospace",
              fontSize: 10, letterSpacing:'0.10em', color:'#7a7568', lineHeight: 1.5 }}>
              Click any term · Type to search · Ask Lexi (corner)
            </div>
          </div>
        </div>

        {/* Search — floating, minimal. top:96 clears the new semi-transparent
            header bar above (which is ~80px tall with padding). */}
        <div style={{ position:'absolute', top: 96, left: 32, zIndex: 6, width: 260 }}>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a term — try alignment, agentic, AGI…"
            style={{ width:'100%', padding:'10px 14px', border:'1px solid rgba(31,29,24,0.14)',
              borderRadius: 999, background:'rgba(255,255,255,0.6)', color:'#1f1d18',
              fontFamily:'inherit', fontSize: 13, outline:'none' }}
          />
          {hits.length > 0 && (
            <div style={{ marginTop: 6, background:'#fff', border:'1px solid rgba(31,29,24,0.10)',
              borderRadius: 12, overflow:'hidden', boxShadow:'0 12px 32px -10px rgba(0,0,0,0.12)' }}>
              {hits.map((n) => (
                <button key={n.id} onClick={() => { setSearch(''); apiRef.current.openNodeById(n.id); }}
                  style={{ display:'flex', alignItems:'center', gap: 10, width:'100%',
                    padding:'10px 14px', background:'transparent', border:'none',
                    borderBottom:'1px solid rgba(31,29,24,0.05)', textAlign:'left', cursor:'pointer',
                    fontFamily:'inherit', fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius:'50%', background: n._c }} />
                  <span style={{ flex: 1 }}>{n.fullName || n.label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',ui-monospace,monospace",
                    fontSize: 9, letterSpacing:'0.12em', textTransform:'uppercase', color:'#7a7568' }}>
                    {palette ? (n.clusters||[]).slice(0,2).map((c) => palette[c]?.label).filter(Boolean).join(' · ') : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stage */}
        <div ref={stageRef} style={{ position:'absolute', inset: 0, zIndex: 1 }} />

        {/* Legend drawer — bottom left. Always rendered (so the slide
            animation works on toggle); CSS transform + opacity drive
            show/hide. Auto-opens on first paint and closes after 6s
            unless engaged with (legendEngaged flag in state). */}
        <div style={{ position:'absolute', bottom: 28, left: 32, zIndex: 5 }}>
          <button onClick={toggleLegend}
            style={{ display:'flex', alignItems:'center', gap: 8,
              padding:'8px 14px', borderRadius: 999, border:'1px solid rgba(31,29,24,0.16)',
              background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
              fontFamily:"'JetBrains Mono',ui-monospace,monospace", fontSize: 9,
              letterSpacing:'0.18em', textTransform:'uppercase', color:'#1f1d18',
              cursor:'pointer' }}>
            <span style={{ width: 8, height: 8, borderRadius:'50%',
              background: 'conic-gradient(from 0deg, #d97a4a, #d9c33a, #4ad97a, #4abad9, #8a4ad9, #d94a8a, #d97a4a)' }} />
            Legend ({filters.size || 'all'})
          </button>
          {palette && (
            <div style={{
              marginTop: 10,
              padding: 16,
              background:'rgba(255,255,255,0.95)',
              border:'1px solid rgba(31,29,24,0.10)',
              borderRadius: 14,
              boxShadow:'0 16px 40px -12px rgba(0,0,0,0.14)',
              display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6, minWidth: 320,
              // Slide animation: when closed, slip down 12px + fade out.
              // pointerEvents:none ensures the hidden panel doesn't intercept
              // clicks meant for the graph behind it. transform-origin is
              // bottom-left so the slide reads as "tucking back into" the pill.
              transform: legendOpen ? 'translateY(0)' : 'translateY(12px)',
              opacity: legendOpen ? 1 : 0,
              pointerEvents: legendOpen ? 'auto' : 'none',
              transition: 'transform 240ms cubic-bezier(0.2,0.8,0.2,1), opacity 200ms ease-out',
              transformOrigin: 'bottom left',
            }}>
              {Object.entries(palette).map(([cid, c]) => (
                <button key={cid} onClick={() => toggleFilter(cid)}
                  style={{ display:'flex', alignItems:'center', gap: 8,
                    padding:'6px 10px', background: filters.has(cid) ? 'rgba(31,29,24,0.06)' : 'transparent',
                    border: '1px solid', borderColor: filters.has(cid) ? 'rgba(31,29,24,0.16)' : 'transparent',
                    borderRadius: 999, cursor:'pointer', fontFamily:'inherit', fontSize: 11,
                    color:'#1f1d18', textAlign:'left' }}>
                  <span style={{ width: 9, height: 9, borderRadius:'50%', background: c.hex }} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls — bottom right */}
        <div style={{ position:'absolute', bottom: 28, right: 32, zIndex: 5,
          display:'flex', gap: 4 }}>
          {['+','−','⌂'].map((s, i) => (
            <button key={i} onClick={() => i === 0 ? apiRef.current?.zoomBy(1.35) : i === 1 ? apiRef.current?.zoomBy(0.74) : apiRef.current?.resetView()}
              style={{ width: 34, height: 34, border:'1px solid rgba(31,29,24,0.16)',
                background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)',
                borderRadius: 8, cursor:'pointer', fontSize: 14, color:'#1f1d18' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {active && palette && (
          <DetailPanel d={active} palette={palette} api={apiRef.current}
            onClose={() => { setActive(null); apiRef.current?.closeNode(); }}
            theme="atlas" />
        )}

        {/* Lexi — bottom right.
            customMessage shows the first-visit "click me to chat" cue ONLY
            when Lexi would otherwise be idle and there's no other state-driven
            message wanting attention (no active term, no live search). After
            8s or first user interaction, firstVisitCue clears and Lexi falls
            back to her normal canned/state-driven messaging. */}
        {window.Lexi ? (
          <window.Lexi
            state={
              idle ? 'sleeping'
              : active ? 'teaching'
              : (search.trim().length >= 2 && hits.length === 0) ? 'curious'
              : (search.trim().length >= 2 && hits.length > 0) ? 'excited'
              : 'idle'
            }
            activeTerm={active}
            palette={palette}
            notFoundQuery={search.trim().length >= 2 && hits.length === 0 ? search.trim() : null}
            customMessage={
              firstVisitCue && !active && !idle && search.trim().length === 0
                ? firstVisitCue : null
            }
          />
        ) : null}
      </div>
    );
  }

  window.AtlasVariation = AtlasVariation;
})();
