// Lexi — the Atlas mascot/lexicographer.
// Floating in the bottom-right corner. Expression reflects app state.
// Optionally calls window.claude.complete for in-character one-liners.
//
// Click-to-open interlocutor mode (Phase 2-A — see lexi-interlocutor-spec.md):
// Clicking Lexi opens a lightbox where the reader can ask her about the
// active term. Lexi switches to her teaching state in the lightbox; the
// conversation is streamed from /api/ask-lexi (Worker proxy to Anthropic).
// Term-anchored entry only in v1; persona-anchored + glossary-anchored
// entries are spec'd at §3.2 but not built tonight.
//
// Props:
//   state:    'idle' | 'curious' | 'excited' | 'teaching' | 'sleeping'
//   message:  string | null  — overrides claude-generated message
//   activeTerm: { label, fullName, definition, clusters } | null
//   palette:  shared palette (for tinting cluster name in copy)
(function () {
  const { useState, useEffect, useRef } = React;

  // ─── Interlocutor mode CSS ─────────────────────────────────────────
  // Injected once on script load. Self-contained — no external CSS file.
  // Uses Atlas paper tones (#fbf6e8 / #2a2418) for visual cohesion with
  // the existing speech bubble.
  if (typeof document !== 'undefined' && !document.getElementById('lexi-interlocutor-styles')) {
    const style = document.createElement('style');
    style.id = 'lexi-interlocutor-styles';
    style.textContent = `
      .lexi-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(40, 30, 15, 0.55);
        backdrop-filter: blur(3px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
        animation: lexi-fade-in 180ms ease-out;
      }
      @keyframes lexi-fade-in { from { opacity: 0; } to { opacity: 1; } }
      .lexi-lightbox {
        background: #f7f5f0;
        border: 1px solid rgba(80,60,30,0.18);
        border-radius: 16px;
        box-shadow: 0 20px 60px -10px rgba(60,40,15,0.4), 0 6px 20px -4px rgba(60,40,15,0.2);
        width: 100%; max-width: 640px; max-height: 88vh;
        display: flex; flex-direction: column;
        position: relative;
        overflow: hidden;
        animation: lexi-rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes lexi-rise {
        from { opacity: 0; transform: translateY(16px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .lexi-close {
        position: absolute; top: 12px; right: 14px; z-index: 2;
        width: 32px; height: 32px; border-radius: 50%;
        border: 1px solid rgba(80,60,30,0.18);
        background: #fbf6e8; color: #5a4a2a;
        font-size: 20px; line-height: 1; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 120ms;
        font-family: 'IBM Plex Sans', sans-serif;
      }
      .lexi-close:hover { background: #f0ead8; border-color: rgba(80,60,30,0.4); }
      .lexi-stage {
        display: flex; justify-content: center;
        padding: 28px 24px 8px;
        background: linear-gradient(to bottom, #fbf6e8 0%, #f7f5f0 100%);
        border-bottom: 1px solid rgba(80,60,30,0.06);
      }
      .lexi-context {
        font-family: 'IBM Plex Mono', ui-monospace, monospace;
        font-size: 11px; letter-spacing: 0.04em;
        color: #888; text-transform: uppercase;
        text-align: center; padding: 10px 24px;
        border-bottom: 1px solid rgba(80,60,30,0.06);
        background: #fbf6e8;
      }
      .lexi-context strong { color: #2a2418; font-weight: 500; letter-spacing: 0; text-transform: none; font-family: 'Newsreader','Times New Roman',serif; font-size: 14px; }
      .lexi-transcript {
        flex: 1; overflow-y: auto;
        padding: 18px 24px 12px;
        display: flex; flex-direction: column; gap: 14px;
        font-family: 'Newsreader', 'Times New Roman', serif;
        font-size: 15px; line-height: 1.5; color: #2a2418;
      }
      .lexi-msg { padding: 10px 14px; border-radius: 12px; max-width: 92%; }
      .lexi-msg-user {
        align-self: flex-end;
        background: #e8e3d4;
        color: #2a2418;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 14px;
        border: 1px solid rgba(80,60,30,0.10);
      }
      .lexi-msg-assistant {
        align-self: flex-start;
        background: transparent;
        font-style: italic;
        color: #2a2418;
        padding-left: 4px;
        max-width: 100%;
      }
      .lexi-cursor {
        display: inline-block; width: 8px; height: 1em;
        background: #5a4a2a;
        margin-left: 2px; opacity: 0.6;
        animation: lexi-blink 1s steps(1) infinite;
        vertical-align: text-bottom;
      }
      @keyframes lexi-blink { 50% { opacity: 0; } }
      .lexi-thinking {
        align-self: flex-start;
        font-family: 'IBM Plex Mono', monospace;
        color: #888; opacity: 0.6; padding-left: 4px;
      }
      .lexi-error {
        background: #f9e3e3; border: 1px solid #d09c9c;
        color: #7a2222; padding: 10px 14px; border-radius: 8px;
        font-size: 13px; font-family: 'IBM Plex Sans', sans-serif;
        font-style: normal;
      }
      .lexi-composer {
        display: flex; gap: 10px; padding: 14px 18px 18px;
        border-top: 1px solid rgba(80,60,30,0.08);
        background: #fbf6e8;
      }
      .lexi-composer textarea {
        flex: 1; resize: none;
        padding: 10px 12px; border-radius: 10px;
        border: 1px solid rgba(80,60,30,0.20);
        background: #fff; color: #2a2418;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 14px; line-height: 1.4;
        outline: none;
        transition: border-color 120ms;
      }
      .lexi-composer textarea:focus { border-color: #5a4a2a; }
      .lexi-composer textarea:disabled { background: #f0ead8; cursor: wait; }
      .lexi-composer button {
        align-self: flex-end;
        padding: 8px 18px; border-radius: 10px;
        background: #2a2418; color: #fbf6e8;
        border: 1px solid #2a2418;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 13px; letter-spacing: 0.04em;
        cursor: pointer; transition: all 120ms;
      }
      .lexi-composer button:hover:not(:disabled) { background: #3a3022; }
      .lexi-composer button:disabled { opacity: 0.4; cursor: not-allowed; }
      .lexi-avatar-clickable { cursor: pointer; transition: transform 150ms; }
      .lexi-avatar-clickable:hover { transform: translateY(-2px) scale(1.04); }
      @media (max-width: 640px) {
        .lexi-overlay { padding: 0; }
        .lexi-lightbox { max-width: none; max-height: 100vh; height: 100vh; border-radius: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const SRC = {
    // WebP: ~10× smaller than source PNGs, universally supported (Chrome 2014,
    // FF 2019, Safari 14+ in 2020). Source PNGs are still in the repo as
    // canonical assets; build.mjs regenerates these WebPs.
    //
    // The full character palette as of 2026-05-10. Not every state has a
    // current trigger — some are in the map for future use (auditor flag
    // states, milestone moments, page-header identities) and added now so
    // they're available when the trigger logic lands. The interlocutor
    // lightbox uses 'graduate' (the spec calls this "professor mode" but
    // graduate is the actual visual — cap + diploma + robes).
    idle:        'assets/lexi-idle.webp',
    curious:     'assets/lexi-curious.webp',
    excited:     'assets/lexi-excited.webp',
    teaching:    'assets/lexi-teaching.webp',
    sleeping:    'assets/lexi-sleeping.webp',
    attentive:   'assets/lexi-attentive.webp',
    thinking:    'assets/lexi-thinking.webp',
    graduate:    'assets/lexi-graduate.webp',     // interlocutor lightbox / "professor mode"
    celebrating: 'assets/lexi-celebrating.webp',  // available — milestone / win-state moments (e.g. promotion lands)
    explorer:    'assets/lexi-explorer.webp',     // available — "out hunting for vocabulary" moments (e.g. scheduled run header on /observing)
    ideating:    'assets/lexi-ideating.webp',     // available — "synthesising what she's seen" moments (e.g. /almanac header, proposal generation)
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

  // ─── Interlocutor lightbox ─────────────────────────────────────────
  // Click-to-open conversation surface. Streams from /api/ask-lexi
  // (Worker proxy to Anthropic Messages API). Term-anchored entry only
  // for Phase 2-A; the prop activeTerm gets passed through to the Worker
  // so Lexi can answer grounded in the entry the reader is looking at.
  function LexiInterlocutor({ activeTerm, onClose }) {
    const [transcript, setTranscript] = useState([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [partial, setPartial] = useState('');
    const [error, setError] = useState(null);
    const transcriptEndRef = useRef(null);

    // Esc closes the lightbox.
    useEffect(() => {
      const handler = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Auto-scroll on new content (after every render that adds text).
    useEffect(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [transcript, partial]);

    async function send(e) {
      e?.preventDefault();
      const text = input.trim();
      if (!text || streaming) return;

      const userMessage = { role: 'user', content: text };
      const newTranscript = [...transcript, userMessage];
      setTranscript(newTranscript);
      setInput('');
      setStreaming(true);
      setPartial('');
      setError(null);

      try {
        const resp = await fetch('/api/ask-lexi', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            transcript: newTranscript,
            term: activeTerm ? {
              id: activeTerm.id,
              label: activeTerm.label,
              fullName: activeTerm.fullName,
              def: activeTerm.def,
              clusters: activeTerm.clusters,
              refs: activeTerm.refs,
            } : null,
          }),
        });

        if (!resp.ok) {
          if (resp.status === 401) {
            throw new Error('Authentication required. Reload the page to re-prompt for the password.');
          }
          const errText = await resp.text();
          throw new Error('HTTP ' + resp.status + ': ' + errText.slice(0, 200));
        }

        // Parse Anthropic SSE stream. The relevant events are
        // content_block_delta with delta.type === 'text_delta'; we
        // accumulate the token text and update `partial` so the UI
        // renders incrementally. Other event types (message_start,
        // content_block_start, message_stop, ping) are ignored.
        let assembled = '';
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by blank lines. Each event has a
          // `data: <json>` line. Parse out complete events; keep any
          // trailing partial event in the buffer for the next chunk.
          const events = buffer.split('\n\n');
          buffer = events.pop(); // keep last (possibly incomplete)
          for (const event of events) {
            for (const line of event.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const dataStr = line.slice(5).trim();
              if (!dataStr || dataStr === '[DONE]') continue;
              try {
                const ev = JSON.parse(dataStr);
                if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
                  assembled += ev.delta.text;
                  setPartial(assembled);
                }
              } catch (e) {
                console.warn('Lexi SSE parse error:', e, dataStr);
              }
            }
          }
        }

        // Stream done — commit assembled message to transcript.
        setTranscript([...newTranscript, { role: 'assistant', content: assembled }]);
        setPartial('');
      } catch (err) {
        setError(err.message);
      } finally {
        setStreaming(false);
      }
    }

    return (
      <div className="lexi-overlay" onClick={onClose}>
        <div className="lexi-lightbox" onClick={(e) => e.stopPropagation()}>
          <button className="lexi-close" onClick={onClose} aria-label="Close">×</button>
          <div className="lexi-stage">
            <LexiAvatar state="graduate" size={150} />
          </div>
          {activeTerm && (
            <div className="lexi-context">
              On <strong>{activeTerm.label}</strong>
            </div>
          )}
          <div className="lexi-transcript">
            {transcript.length === 0 && !streaming && (
              <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                {activeTerm
                  ? `Ask Lexi about ${activeTerm.label}.`
                  : 'Ask Lexi about a term.'}
              </div>
            )}
            {transcript.map((m, i) => (
              <div key={i} className={'lexi-msg lexi-msg-' + m.role}>{m.content}</div>
            ))}
            {streaming && partial && (
              <div className="lexi-msg lexi-msg-assistant">
                {partial}<span className="lexi-cursor">▌</span>
              </div>
            )}
            {streaming && !partial && <div className="lexi-thinking">·&nbsp;·&nbsp;·</div>}
            {error && <div className="lexi-error">{error}</div>}
            <div ref={transcriptEndRef} />
          </div>
          <form className="lexi-composer" onSubmit={send}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
              placeholder={activeTerm ? 'Ask Lexi about "' + activeTerm.label + '"…' : 'Ask Lexi…'}
              disabled={streaming}
              rows={2}
              autoFocus
            />
            <button type="submit" disabled={streaming || !input.trim()}>
              {streaming ? '…' : 'Ask'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  function Lexi({ state = 'idle', activeTerm = null, palette = null, customMessage = null, notFoundQuery = null }) {
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [crawling, setCrawling] = useState(false);
    const [interlocutorOpen, setInterlocutorOpen] = useState(false);
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
      <>
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
          <div
            className="lexi-avatar-clickable"
            style={{ pointerEvents:'auto' }}
            onClick={() => setInterlocutorOpen(true)}
            title="Ask Lexi a question"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setInterlocutorOpen(true); } }}
          >
            <LexiAvatar state={state} size={size} />
          </div>
        </div>
        {interlocutorOpen && (
          <LexiInterlocutor
            activeTerm={activeTerm}
            onClose={() => setInterlocutorOpen(false)}
          />
        )}
      </>
    );
  }

  window.Lexi = Lexi;
  window.LexiAvatar = LexiAvatar;
})();
