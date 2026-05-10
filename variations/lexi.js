(function(){const{useState:l,useEffect:k,useRef:S}=React;if(typeof document<"u"&&!document.getElementById("lexi-interlocutor-styles")){const e=document.createElement("style");e.id="lexi-interlocutor-styles",e.textContent=`
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
    `,document.head.appendChild(e)}const z={idle:"assets/lexi-idle.webp",curious:"assets/lexi-curious.webp",excited:"assets/lexi-excited.webp",teaching:"assets/lexi-teaching.webp",sleeping:"assets/lexi-sleeping.webp",attentive:"assets/lexi-attentive.webp",thinking:"assets/lexi-thinking.webp",graduate:"assets/lexi-graduate.webp",celebrating:"assets/lexi-celebrating.webp",explorer:"assets/lexi-explorer.webp",ideating:"assets/lexi-ideating.webp"};function I({state:e,size:t=110}){const a=z[e]||z.idle;return React.createElement("div",{style:{position:"relative",width:t*1.4,height:t*1.15,flex:"0 0 auto",filter:"drop-shadow(0 8px 14px rgba(60,40,15,0.28)) drop-shadow(0 2px 4px rgba(60,40,15,0.18))"}},React.createElement("img",{src:a,alt:`Lexi ${e}`,style:{width:"100%",height:"auto",display:"block",pointerEvents:"none",userSelect:"none"},draggable:!1}))}function M({text:e,loading:t,action:a}){const[r,o]=l("");return k(()=>{if(!e){o("");return}let d=0,n=!1;o("");const u=()=>{n||(d=Math.min(d+2,e.length),o(e.slice(0,d)),d<e.length&&setTimeout(u,18))};return u(),()=>{n=!0}},[e]),!e&&!t?null:React.createElement("div",{style:{position:"relative",maxWidth:240,minHeight:30,marginBottom:10,padding:"10px 14px 11px",background:"#fbf6e8",borderRadius:14,border:"1px solid rgba(80,60,30,0.18)",boxShadow:"0 6px 16px -6px rgba(60,40,15,0.22), 0 2px 4px -1px rgba(60,40,15,0.12)",fontFamily:"'Newsreader','GT Sectra','Times New Roman',serif",fontSize:14,lineHeight:1.35,color:"#2a2418",fontStyle:"italic"}},t?React.createElement("span",{style:{opacity:.55}},"\xB7\xA0\xB7\xA0\xB7"):React.createElement("span",null,"\u201C",r,(r.length<(e||"").length,""),"\u201D"),a&&r.length===(e||"").length&&!t?React.createElement("div",{style:{marginTop:8,paddingTop:8,borderTop:"1px dashed rgba(80,60,30,0.20)",display:"flex",justifyContent:"flex-end"}},React.createElement("button",{onClick:a.onClick,style:{fontFamily:"'JetBrains Mono',ui-monospace,monospace",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"#5a4a2a",background:"transparent",border:"1px solid rgba(80,60,30,0.30)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontStyle:"normal"}},a.label)):null,React.createElement("svg",{width:"22",height:"14",viewBox:"0 0 22 14",style:{position:"absolute",bottom:-13,right:26}},React.createElement("path",{d:"M 2 0 L 18 0 L 11 13 Z",fill:"#fbf6e8",stroke:"rgba(80,60,30,0.18)",strokeWidth:"1"}),React.createElement("path",{d:"M 2 0 L 18 0",stroke:"#fbf6e8",strokeWidth:"2"})))}function R({activeTerm:e,onClose:t}){const[a,r]=l([]),[o,d]=l(""),[n,u]=l(!1),[b,g]=l(""),[h,v]=l(null),m=S(null);k(()=>{const i=x=>{x.key==="Escape"&&t()};return window.addEventListener("keydown",i),()=>window.removeEventListener("keydown",i)},[t]),k(()=>{m.current?.scrollIntoView({behavior:"smooth",block:"end"})},[a,b]);async function y(i){i?.preventDefault();const x=o.trim();if(!x||n)return;const A={role:"user",content:x},c=[...a,A];r(c),d(""),u(!0),g(""),v(null);try{const p=await fetch("/api/ask-lexi",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({transcript:c,term:e?{id:e.id,label:e.label,fullName:e.fullName,def:e.def,clusters:e.clusters,refs:e.refs}:null})});if(!p.ok){if(p.status===401)throw new Error("Authentication required. Reload the page to re-prompt for the password.");const L=await p.text();throw new Error("HTTP "+p.status+": "+L.slice(0,200))}let f="";const s=p.body.getReader(),D=new TextDecoder;let E="";for(;;){const{done:L,value:O}=await s.read();if(L)break;E+=D.decode(O,{stream:!0});const B=E.split(`

`);E=B.pop();for(const j of B)for(const C of j.split(`
`)){if(!C.startsWith("data:"))continue;const N=C.slice(5).trim();if(!(!N||N==="[DONE]"))try{const w=JSON.parse(N);w.type==="content_block_delta"&&w.delta?.type==="text_delta"&&(f+=w.delta.text,g(f))}catch(w){console.warn("Lexi SSE parse error:",w,N)}}}r([...c,{role:"assistant",content:f}]),g("")}catch(p){v(p.message)}finally{u(!1)}}return React.createElement("div",{className:"lexi-overlay",onClick:t},React.createElement("div",{className:"lexi-lightbox",onClick:i=>i.stopPropagation()},React.createElement("button",{className:"lexi-close",onClick:t,"aria-label":"Close"},"\xD7"),React.createElement("div",{className:"lexi-stage"},React.createElement(I,{state:"graduate",size:150})),e&&React.createElement("div",{className:"lexi-context"},"On ",React.createElement("strong",null,e.label)),React.createElement("div",{className:"lexi-transcript"},a.length===0&&!n&&React.createElement("div",{style:{color:"#888",fontStyle:"italic",textAlign:"center",padding:"20px 0"}},e?`Ask Lexi about ${e.label}.`:"Ask Lexi about a term."),a.map((i,x)=>React.createElement("div",{key:x,className:"lexi-msg lexi-msg-"+i.role},i.content)),n&&b&&React.createElement("div",{className:"lexi-msg lexi-msg-assistant"},b,React.createElement("span",{className:"lexi-cursor"},"\u258C")),n&&!b&&React.createElement("div",{className:"lexi-thinking"},"\xB7\xA0\xB7\xA0\xB7"),h&&React.createElement("div",{className:"lexi-error"},h),React.createElement("div",{ref:m})),React.createElement("form",{className:"lexi-composer",onSubmit:y},React.createElement("textarea",{value:o,onChange:i=>d(i.target.value),onKeyDown:i=>{i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),y(i))},placeholder:e?'Ask Lexi about "'+e.label+'"\u2026':"Ask Lexi\u2026",disabled:n,rows:2,autoFocus:!0}),React.createElement("button",{type:"submit",disabled:n||!o.trim()},n?"\u2026":"Ask"))))}function P({state:e="idle",activeTerm:t=null,palette:a=null,customMessage:r=null,notFoundQuery:o=null}){const[d,n]=l(null),[u,b]=l(!1),[g,h]=l(!1),[v,m]=l(!1),y=S(null),i=S(null),x=e==="teaching"?130:108;return k(()=>{if(r){n(r);return}if(e==="curious"&&o){i.current!==o&&(i.current=o,h(!1));const s=o.length>24?o.slice(0,22)+"\u2026":o;n(g?`Off to hoover up \u201C${s}\u201D. Check back soon.`:`I don't have \u201C${s}\u201D yet.`);return}if(e!=="teaching"||!t){n({idle:null,curious:"Hmm, let me look\u2026",excited:"Found it!",sleeping:null,teaching:null}[e]||null);return}if(y.current===t.id)return;y.current=t.id;const c=(t.clusters||[]).map(s=>a?.[s]?.label).filter(Boolean).join(", "),p=["You are Lexi, the lexicographer mascot of an AI Terminology Atlas.","You are a small, warm, slightly bookish robot vacuum cleaner who hoovers up new AI terms from the web and curates them.",`A user has just opened the term: "${t.fullName||t.label}".`,`It belongs to clusters: ${c||"unspecified"}.`,t.def?`Definition snippet: "${String(t.def).slice(0,240)}"`:"","","Write ONE short sentence (max ~18 words) reacting to this term, in character.","Be specific to the term \u2014 never generic. Voice: warm, curious, a bit dry, occasionally playful.","Do NOT define the term. Do NOT explain it. React to it: a curated note, a connection, a why-it-matters, an opinion, an aside.",'Plain text. No quotes. No emoji. No leading "Ah," or "Well,".'].join(`
`);b(!0),n(null);let f=!1;return(async()=>{try{const s=await window.claude.complete(p);f||n((s||"").trim().replace(/^["']|["']$/g,""))}catch{f||n(`The term \u201C${t.label}\u201D is one I keep an eye on.`)}finally{f||b(!1)}})(),()=>{f=!0}},[e,t?.id,r,o,g]),React.createElement(React.Fragment,null,React.createElement("div",{style:{position:"absolute",bottom:24,right:28,zIndex:8,display:"flex",alignItems:"flex-end",gap:0,flexDirection:"column",pointerEvents:"none"}},React.createElement("div",{style:{pointerEvents:"auto",alignSelf:"flex-end",marginRight:18}},React.createElement(M,{text:d,loading:u,action:e==="curious"&&o&&!g?{label:"Hoover it up",onClick:()=>h(!0)}:null})),React.createElement("div",{className:"lexi-avatar-clickable",style:{pointerEvents:"auto"},onClick:()=>m(!0),title:"Ask Lexi a question",role:"button",tabIndex:0,onKeyDown:c=>{(c.key==="Enter"||c.key===" ")&&(c.preventDefault(),m(!0))}},React.createElement(I,{state:e,size:x}))),v&&React.createElement(R,{activeTerm:t,onClose:()=>m(!1)}))}window.Lexi=P,window.LexiAvatar=I})();
