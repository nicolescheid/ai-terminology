// Shared detail panel — accepts theme="atlas"|"observatory"|"document"

(function () {
  const { useState } = React;

  function ShareButton({ termId, theme }) {
    const [copied, setCopied] = useState(false);
    const onShare = async () => {
      const url = new URL(window.location.href);
      url.searchParams.set('term', termId);
      const link = url.toString();
      try {
        if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
          await navigator.share({ url: link, title: 'Lexicon — ' + termId });
        } else {
          await navigator.clipboard.writeText(link);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
    };
    const isDark = theme === 'observatory';
    return (
      <button onClick={onShare}
        title="Copy share link"
        style={{ position:'absolute', top: 14, right: 50, height: 28,
          padding:'0 11px', borderRadius: 999,
          border:'1px solid ' + (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(31,29,24,0.18)'),
          background: copied
            ? (isDark ? 'rgba(120,200,140,0.18)' : 'rgba(80,140,90,0.10)')
            : 'transparent',
          color: 'currentColor', opacity: copied ? 1 : 0.75,
          cursor:'pointer', fontFamily:"'JetBrains Mono',ui-monospace,monospace",
          fontSize: 9, letterSpacing:'0.16em', textTransform:'uppercase',
          display:'inline-flex', alignItems:'center', gap: 6,
          transition:'opacity 0.15s, background 0.15s' }}>
        {!copied && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3 L13 3 L13 7" />
            <path d="M13 3 L7 9" />
            <path d="M11 9 L11 13 L3 13 L3 5 L7 5" />
          </svg>
        )}
        {copied ? 'Copied' : 'Share'}
      </button>
    );
  }

  function DetailPanel({ d, palette, api, onClose, theme }) {
    if (!d || !palette) return null;
    const isDark = theme === 'observatory';
    const isDoc = theme === 'document';

    const themes = {
      atlas: {
        wrap: { right: 28, top: 28, width: 340, padding: 22,
          background: 'rgba(255,255,255,0.96)', color:'#1f1d18',
          border:'1px solid rgba(31,29,24,0.10)',
          borderRadius: 14, boxShadow:'0 20px 48px -16px rgba(0,0,0,0.18)',
          fontFamily:"'Inter Tight','Inter',system-ui,sans-serif" },
        title: { fontFamily:"'GT Sectra','Times New Roman',serif", fontSize: 26, lineHeight: 1.1, letterSpacing:'-0.01em' },
        meta: { fontFamily:"'JetBrains Mono',ui-monospace,monospace", fontSize: 9, letterSpacing:'0.18em', textTransform:'uppercase', color:'#7a7568' },
        body: { fontSize: 13.5, lineHeight: 1.65, color:'#3d3a32', fontWeight: 400 },
        chip: (c) => ({ fontSize: 10, padding:'3px 9px', borderRadius: 999, border:'1px solid '+c+'66', color: c, background:'transparent' }),
        clusterBadge: (c, hex) => ({ fontSize: 9, fontWeight: 600, letterSpacing:'0.10em', textTransform:'uppercase',
          padding:'3px 8px', borderRadius: 999, color: hex, border:'1px solid '+hex+'55', background: hex+'14' }),
      },
      observatory: {
        wrap: { right: 0, top: 0, bottom: 0, width: 380, padding: '36px 30px 28px',
          background: 'rgba(14,16,24,0.92)', color: '#e8e6df',
          borderLeft:'1px solid rgba(255,255,255,0.06)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          fontFamily:"'Inter Tight','Inter',system-ui,sans-serif" },
        title: { fontFamily:"'GT Sectra','Times New Roman',serif", fontSize: 32, lineHeight: 1.05, letterSpacing:'-0.015em', fontWeight: 400 },
        meta: { fontFamily:"'JetBrains Mono',ui-monospace,monospace", fontSize: 9, letterSpacing:'0.22em', textTransform:'uppercase', color:'#9a978d' },
        body: { fontSize: 14, lineHeight: 1.7, color:'#c4c2ba', fontWeight: 300 },
        chip: (c) => ({ fontSize: 10.5, padding:'4px 10px', borderRadius: 999, border:'1px solid '+c+'80', color: c, background:'transparent' }),
        clusterBadge: (c, hex) => ({ fontSize: 9, fontWeight: 500, letterSpacing:'0.14em', textTransform:'uppercase',
          padding:'3px 9px', borderRadius: 999, color: hex, border:'1px solid '+hex+'66', background: hex+'18' }),
      },
      document: {
        wrap: { left: 0, right: 0, bottom: 0, height: '46%',
          background: '#fbfaf6', color:'#181614',
          borderTop:'1px solid rgba(0,0,0,0.10)',
          padding: '32px 8% 36px',
          fontFamily:"'Newsreader','Source Serif Pro',Georgia,serif",
          boxShadow:'0 -16px 48px -16px rgba(0,0,0,0.10)' },
        title: { fontFamily:"'Newsreader','Source Serif Pro',Georgia,serif", fontSize: 44, lineHeight: 1.05, letterSpacing:'-0.02em', fontWeight: 400 },
        meta: { fontFamily:"'JetBrains Mono',ui-monospace,monospace", fontSize: 9, letterSpacing:'0.22em', textTransform:'uppercase', color:'#7a7568' },
        body: { fontSize: 16, lineHeight: 1.6, color:'#2d2a25', fontWeight: 400 },
        chip: (c) => ({ fontSize: 11, padding:'4px 10px', borderRadius: 4, border:'1px solid '+c+'66', color: c, background:'transparent', fontFamily:"'Inter','sans-serif',serif" }),
        clusterBadge: (c, hex) => ({ fontSize: 9, fontWeight: 500, letterSpacing:'0.14em', textTransform:'uppercase',
          padding:'2px 8px', borderRadius: 2, color: hex, border:'1px solid '+hex+'55', background:'transparent', fontFamily:"'Inter',sans-serif" }),
      }
    };
    const t = themes[theme] || themes.atlas;

    const def = { __html: d.def || '' };
    const rels = (d.rels || []).map((rid) => api.NODES.find((n) => n.id === rid)).filter(Boolean);

    return (
      <div className="ge-panel" style={{ position:'absolute', zIndex: 10, ...t.wrap,
        maxHeight: theme === 'document' ? undefined : 'calc(100% - 56px)',
        overflowY: theme === 'document' ? 'auto' : 'auto' }}>
        <ShareButton termId={d.id} theme={theme} />
        <button onClick={onClose}
          style={{ position:'absolute', top: 14, right: 14, width: 28, height: 28,
            border:'1px solid currentColor', borderRadius:'50%', background:'transparent',
            color:'currentColor', opacity: 0.6, cursor:'pointer', fontSize: 13, lineHeight: 1 }}>
          ✕
        </button>

        {theme === 'document' ? (
          <div style={{ display:'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
            <div>
              <div style={{ ...t.meta, marginBottom: 14 }}>
                {(d.clusters||[]).map((c) => palette[c]?.label).filter(Boolean).join('  ·  ')}
              </div>
              <div style={t.title}>{d.fullName || d.label}</div>
              <div style={{ marginTop: 18, display:'flex', flexWrap:'wrap', gap: 4 }}>
                {(d.clusters||[]).map((c) => palette[c] && (
                  <span key={c} style={t.clusterBadge(c, palette[c].hex)}>{palette[c].label}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={t.body} dangerouslySetInnerHTML={def} />
              {rels.length > 0 && (
                <>
                  <div style={{ ...t.meta, marginTop: 24, marginBottom: 8 }}>Connected to</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                    {rels.map((r) => (
                      <button key={r.id} className="ge-chip" onClick={() => api.openNodeById(r.id)}
                        style={{ ...t.chip(r._c), cursor:'pointer' }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ ...t.meta, marginBottom: 12 }}>
              {(d.clusters||[]).map((c) => palette[c]?.label).filter(Boolean).join('  ·  ')}
            </div>
            <div style={t.title}>{d.fullName || d.label}</div>
            <div style={{ marginTop: 12, marginBottom: 16, display:'flex', flexWrap:'wrap', gap: 4 }}>
              {(d.clusters||[]).map((c) => palette[c] && (
                <span key={c} style={t.clusterBadge(c, palette[c].hex)}>{palette[c].label}</span>
              ))}
            </div>
            <div style={t.body} dangerouslySetInnerHTML={def} />
            {rels.length > 0 && (
              <>
                <div style={{ ...t.meta, marginTop: 22, marginBottom: 8 }}>Connected to</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                  {rels.map((r) => (
                    <button key={r.id} className="ge-chip" onClick={() => api.openNodeById(r.id)}
                      style={{ ...t.chip(r._c), cursor:'pointer' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }
  window.DetailPanel = DetailPanel;
})();
