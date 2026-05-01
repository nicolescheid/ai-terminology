// Lexi — the Atlas mascot/lexicographer.
// Floating in the bottom-right corner. Expression reflects app state.
// Optionally calls window.claude.complete for in-character one-liners.
//
// Props:
//   state:    'idle' | 'curious' | 'excited' | 'teaching' | 'sleeping'
//   message:  string | null  — overrides claude-generated message
//   activeTerm: { label, fullName, definition, clusters } | null
//   palette:  shared palette (for tinting cluster name in copy)
(function () {
  const { useState, useEffect, useRef } = React;

  const SRC = {
    // WebP: ~10× smaller than source PNGs, universally supported (Chrome 2014,
    // FF 2019, Safari 14+ in 2020). Source PNGs are still in the repo as
    // canonical assets; build.mjs regenerates these WebPs.
    idle: 'assets/lexi-idle.webp',
    curious: 'assets/lexi-curious.webp',
    excited: 'assets/lexi-excited.webp',
    teaching: 'assets/lexi-teaching.webp',
    sleeping: 'assets/lexi-sleeping.webp',
  };

  // The PNGs are on white. Mask them inside a soft circular frame
  // whose background is the Atlas paper color so they read as cut-outs.
  function LexiAvatar({ state, size = 110 }) {
    const src = SRC[state] || SRC.idle;
    return (
      <div style={{
        position:'relative',
        width: size * 1.4, height: size * 1.15,
        flex: '0 0 auto',
        filter: 'drop-shadow(0 8px 14px rgba(60,40,15,0.28)) drop-shadow(0 2px 4px rgba(60,40,15,0.18))',
      }}>
        <img src={src} alt={`Lexi ${state}`}
          style={{
            width: '100%', height: 'auto',
            display:'block',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />
      </div>
    );
  }

  // small typed-out one-liner; in-character voice
  function SpeechBubble({ text, loading, action }) {
    const [shown, setShown] = useState('');
    useEffect(() => {
      if (!text) { setShown(''); return; }
      let i = 0; let cancelled = false;
      setShown('');
      const tick = () => {
        if (cancelled) return;
        i = Math.min(i + 2, text.length);
        setShown(text.slice(0, i));
        if (i < text.length) setTimeout(tick, 18);
      };
      tick();
      return () => { cancelled = true; };
    }, [text]);

    if (!text && !loading) return null;
    return (
      <div style={{
        position:'relative',
        maxWidth: 240, minHeight: 30,
        marginBottom: 10,
        padding:'10px 14px 11px',
        background:'#fbf6e8',
        borderRadius: 14,
        border:'1px solid rgba(80,60,30,0.18)',
        boxShadow:'0 6px 16px -6px rgba(60,40,15,0.22), 0 2px 4px -1px rgba(60,40,15,0.12)',
        fontFamily: "'Newsreader','GT Sectra','Times New Roman',serif",
        fontSize: 14, lineHeight: 1.35, color:'#2a2418',
        fontStyle: 'italic',
      }}>
        {loading ? (
          <span style={{ opacity: 0.55 }}>·&nbsp;·&nbsp;·</span>
        ) : (
          <span>“{shown}{shown.length < (text||'').length ? '' : ''}”</span>
        )}
        {action && shown.length === (text||'').length && !loading ? (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop:'1px dashed rgba(80,60,30,0.20)',
            display:'flex', justifyContent:'flex-end' }}>
            <button onClick={action.onClick}
              style={{ fontFamily:"'JetBrains Mono',ui-monospace,monospace",
                fontSize: 10, letterSpacing:'0.14em', textTransform:'uppercase',
                color:'#5a4a2a', background:'transparent',
                border:'1px solid rgba(80,60,30,0.30)', borderRadius: 6,
                padding:'5px 10px', cursor:'pointer', fontStyle:'normal' }}>
              {action.label}
            </button>
          </div>
        ) : null}
        {/* tail pointing down-right toward Lexi */}
        <svg width="22" height="14" viewBox="0 0 22 14"
          style={{ position:'absolute', bottom:-13, right: 26 }}>
          <path d="M 2 0 L 18 0 L 11 13 Z" fill="#fbf6e8"
            stroke="rgba(80,60,30,0.18)" strokeWidth="1" />
          <path d="M 2 0 L 18 0" stroke="#fbf6e8" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  function Lexi({ state = 'idle', activeTerm = null, palette = null, customMessage = null, notFoundQuery = null }) {
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [crawling, setCrawling] = useState(false);
    const lastTermId = useRef(null);
    const lastNotFound = useRef(null);

    // bigger when teaching (she's holding a sign), smaller otherwise
    const size = state === 'teaching' ? 130 : 108;

    // When a term opens, ask Claude (Haiku) for an in-character one-liner.
    useEffect(() => {
      if (customMessage) { setMsg(customMessage); return; }

      // Not-found state: speak the missing query
      if (state === 'curious' && notFoundQuery) {
        if (lastNotFound.current !== notFoundQuery) {
          lastNotFound.current = notFoundQuery;
          setCrawling(false);
        }
        const q = notFoundQuery.length > 24 ? notFoundQuery.slice(0,22) + '…' : notFoundQuery;
        setMsg(crawling
          ? `Off to hoover up “${q}”. Check back soon.`
          : `I don't have “${q}” yet.`);
        return;
      }

      if (state !== 'teaching' || !activeTerm) {
        // For non-teaching states, pick a tiny canned line
        const canned = {
          idle: null,
          curious: 'Hmm, let me look…',
          excited: 'Found it!',
          sleeping: null,
          teaching: null,
        };
        setMsg(canned[state] || null);
        return;
      }
      if (lastTermId.current === activeTerm.id) return;
      lastTermId.current = activeTerm.id;

      const clusterNames = (activeTerm.clusters || [])
        .map((c) => palette?.[c]?.label).filter(Boolean).join(', ');

      const prompt = [
        `You are Lexi, the lexicographer mascot of an AI Terminology Atlas.`,
        `You are a small, warm, slightly bookish robot vacuum cleaner who hoovers up new AI terms from the web and curates them.`,
        `A user has just opened the term: "${activeTerm.fullName || activeTerm.label}".`,
        `It belongs to clusters: ${clusterNames || 'unspecified'}.`,
        activeTerm.def ? `Definition snippet: "${String(activeTerm.def).slice(0, 240)}"` : '',
        ``,
        `Write ONE short sentence (max ~18 words) reacting to this term, in character.`,
        `Be specific to the term — never generic. Voice: warm, curious, a bit dry, occasionally playful.`,
        `Do NOT define the term. Do NOT explain it. React to it: a curated note, a connection, a why-it-matters, an opinion, an aside.`,
        `Plain text. No quotes. No emoji. No leading "Ah," or "Well,".`,
      ].join('\n');

      setLoading(true);
      setMsg(null);
      let cancelled = false;
      (async () => {
        try {
          const t = await window.claude.complete(prompt);
          if (!cancelled) setMsg((t || '').trim().replace(/^["']|["']$/g, ''));
        } catch (e) {
          if (!cancelled) setMsg(`The term “${activeTerm.label}” is one I keep an eye on.`);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [state, activeTerm?.id, customMessage, notFoundQuery, crawling]);

    // Build optional CTA for the speech bubble (not-found only, pre-crawl)
    const bubbleAction = (state === 'curious' && notFoundQuery && !crawling) ? {
      label: 'Hoover it up',
      onClick: () => setCrawling(true),
    } : null;

    return (
      <div style={{
        position:'absolute', bottom: 24, right: 28, zIndex: 8,
        display:'flex', alignItems:'flex-end', gap: 0,
        flexDirection:'column',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents:'auto', alignSelf:'flex-end',
          marginRight: 18 /* nudge bubble left so tail points at Lexi */ }}>
          <SpeechBubble text={msg} loading={loading} action={bubbleAction} />
        </div>
        <div style={{ pointerEvents:'auto' }}>
          <LexiAvatar state={state} size={size} />
        </div>
      </div>
    );
  }

  window.Lexi = Lexi;
  window.LexiAvatar = LexiAvatar;
})();
