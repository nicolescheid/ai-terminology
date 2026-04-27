# Handoff: Lexicon Atlas (ai-terminology.com redesign)

## Overview

The redesign of [ai-terminology.com](https://ai-terminology.com) — an interactive force-directed graph of AI terminology, curated by **Lexi**, an AI lexicographer mascot.

The redesign keeps the existing data model and the original "categories are colours; multi-category terms are blends" logic intact, but rebuilds the surface with a **quiet-luxury** aesthetic — cream paper, confident serif typography, generous negative space, harmonized OKLCH palette, paper-card term markers, a floating Lexi mascot with state-driven expressions, and a contextual one-line note from Lexi for every opened term (powered by `claude-haiku-4-5`).

## About the design files

The HTML files in `prototype/` are **design references**, not production code. They were built as a working prototype to communicate the intended look, feel, motion, and interactions. The `prototype/` folder is a single self-contained HTML page (React via Babel-in-browser, D3 force layout, no build step) — useful as a fully clickable reference, but **not** what should ship.

The implementation task is to **recreate this design in the target codebase's environment** (whatever framework `ai-terminology.com` is built in — likely vanilla HTML/JS today, but the site could move to Next.js, SvelteKit, Astro, or stay vanilla — pick what's natural for the existing repo) using its established patterns. The shared engine code in `prototype/shared/graph-engine.js` is the most directly portable — it's plain ES5-compatible JS with no JSX and only D3 + a palette helper as deps.

## Reference screenshots

Four state captures live in `screenshots/`. They are taken with the graph zoomed-out to fit the full corpus (~200 terms) into a 1600×1000 viewport — at normal zoom levels, the user sees roughly the central 30–50 cards with the rest off-screen until they pan/zoom.

| file | state |
|---|---|
| `01-idle.png` | Default landing — graph laid out, Lexi idle, no panel, no search |
| `02-search-hits.png` | User typed "agent" — search dropdown showing 7 hits, Lexi excited with "Found it" bubble |
| `03-term-open.png` | Agent term opened — detail panel slid in from right, Lexi in teaching pose with a generated one-liner |
| `04-not-found.png` | User typed "foobar" — Lexi curious with "I don't have foobar yet" bubble; full corpus visible behind |

Note: the cluster blooms (soft colored auras) behind the paper-cards in shots 1, 2, 4 are the harmonized OKLCH-mixed cluster centers — they're a separate `.ge-clouds` SVG layer beneath links and nodes, providing chromatic geography without competing with the cards for legibility.

## Fidelity

**High-fidelity.** Every measurement, color, font, and interaction in the prototype is intentional. Reproduce pixel-perfectly.

## What the user does here

This is a single-page app: one screen, no routing beyond a `?term=<id>` deep-link query param.

1. Land on the Atlas. Lexi is in the corner, idle (smiling, glasses on).
2. Pan/zoom freely (mouse drag, scroll/pinch to zoom).
3. Hover a paper-card term: it lifts (scale 1.06, shadow deepens), neighbors are highlighted, non-neighbors fade.
4. Click a paper-card term: detail panel slides in from the right with definition, cluster chips, related terms; URL updates to `?term=<id>`; Lexi switches to **teaching** state and produces an in-character one-liner about the term (Claude API).
5. Type in the search box (top-left): live-filtered hits dropdown. Lexi switches to **excited** if there are hits, **curious (puzzled)** if there are none — when not-found, her bubble says `"I don't have 'foo' yet."` with a **Hoover it up** CTA that flips the bubble to `"Off to hoover up 'foo'. Check back soon."` (currently a no-op stub; on the real site it should enqueue the term for Lexi's nightly crawl).
6. Click a cluster filter chip (top): isolates that cluster's terms, fades the rest.
7. Click the legend pill (top-right): expands a popout listing all clusters with term counts.
8. After 60s of no input: Lexi falls asleep (eyes closed, Zzz).
9. Click **Share** in the detail panel: copies `?term=<id>` deep-link to clipboard.

---

## Visual language

### Palette

The palette is **harmonized in OKLCH**: every cluster shares the same lightness (L=0.62) and chroma (C=0.18); only hue varies. This guarantees that all 17 cluster colors have equal perceptual weight — no cluster screams louder than any other. The hex values in `graph-data.js` (`CL` object) are the *original* saturated palette; the harmonized hexes are computed at runtime by `shared/palette.js`.

When a term belongs to multiple clusters, its color is the **OKLCH-mixed** hue (averaged on the chroma circle, lightness preserved) — so a term that's both `agentic` + `safety` gets a real perceptual midpoint, not a muddy RGB average.

**Cluster hues (degrees, OKLCH):**

| id | label | hue° |
|---|---|---|
| `critical` | Critical / Hype | 20 |
| `agentic` | Agentic Systems | 50 |
| `models` | Models | 70 |
| `technical` | Technical | 100 |
| `safety` | Safety | 340 |
| `human` | Human Skills | 145 |
| `dyadic` | Dyadic Mind | 195 |
| `evolved` | Evolved | 250 |
| `core` | Core | 290 |
| `tools` | Tools & Platforms | 220 |
| `companies` | Companies | 270 |
| `work` | Work & Output | 80 |
| `autonomy` | Autonomy Spectrum | 215 |
| `lifecycle` | Product Lifecycle | 305 |
| `business` | Business Reality | 155 |
| `security` | AI Security | 10 |
| `context` | Context Health | 130 |
| `landscape` | Model Landscape | 60 |

Use the same OKLCH harmonization helper (`shared/palette.js`) when porting — don't hand-pick hexes. The conversion is `oklch(0.62 0.18 H°)` → sRGB via the standard OKLab → linear sRGB → sRGB pipeline.

### Surface colors (Atlas / "paper" theme)

| token | hex | usage |
|---|---|---|
| `--paper-bg` | `#f4f1ea` | Page background (warm cream) |
| `--paper-card` | `#f6efdf` | Term-marker card base (slight gradient: `linear-gradient(180deg, rgba(255,250,235,0.9), rgba(238,228,205,0.95))`) |
| `--bubble-bg` | `#fbf6e8` | Lexi's speech bubble |
| `--ink` | `#2a2418` | Primary text |
| `--ink-muted` | `#7a7568` | Secondary text |
| `--ink-faint` | `#9a9588` | Tertiary text, hairlines |
| `--rule` | `rgba(31,29,24,0.14)` | 1px input borders |
| `--rule-soft` | `rgba(80,60,30,0.18)` | Card borders, dotted dividers |
| `--shadow-sm` | `0 2px 4px -1px rgba(60,40,15,0.18), 0 6px 14px -6px rgba(60,40,15,0.22)` | Cards |
| `--shadow-md` | `0 12px 32px -10px rgba(0,0,0,0.12)` | Dropdowns, popovers |
| `--shadow-lg` | `0 30px 80px -30px rgba(60,40,15,0.5), 0 8px 24px -8px rgba(60,40,15,0.25)` | Splash, detail panel |

### Typography

Three fonts, used carefully:

| family | role | sizes |
|---|---|---|
| `'GT Sectra', 'Newsreader', 'Times New Roman', serif` | Display + headings ("Lexicon" wordmark, term names in detail panel, paper-card labels) | 14–48px |
| `'Newsreader', 'GT Sectra', 'Times New Roman', serif` | Italic body / Lexi's voice (speech bubble) | 14px italic |
| `'JetBrains Mono', ui-monospace, monospace` | Microtype: meta labels, filter chips, share button, splash caption | 9–11px, `letter-spacing: 0.18em–0.20em`, `text-transform: uppercase` |

If GT Sectra is unavailable, Newsreader (Google Fonts) is the fallback for both serif roles — it's free and metrically close enough.

**Type scale** (px / line-height):
- 48 / 1.05 — detail-panel term name
- 26 / 1.0 — "Lexicon" wordmark, panel section heads
- 18 / 1.4 — body in detail panel
- 14 / 1.35 — Lexi speech bubble (italic)
- 14 / 1.18 — paper-card labels (large terms, sz≥26)
- 12 / 1.18 — paper-card labels (medium, sz≥18)
- 11 / 1.18 — paper-card labels (small, sz≥14)
- 10 / 1.18 — paper-card labels (smallest)
- 11 / 1 — search input
- 10 / 1 — chips, microtype (`tracking-wide uppercase`)
- 9 / 1 — splash caption ("Lexi is settling in · Lexicon Atlas")

### Spacing

Loose, paper-like. Atlas chrome uses absolute positioning over the canvas:
- Top-left wordmark+search: `top: 32px, left: 32px`
- Cluster filter chips: `top: 32px`, centered
- Legend pill: `top: 32px, right: 32px`
- Detail panel: slides in from right, `width: 420px`, `padding: 40px 36px`
- Lexi: `bottom: 24px, right: 28px`, with bubble stacked above avatar

### Iconography

Almost none, by design. Color *is* the iconography. Two exceptions:
- Tiny dot rows beneath multi-cluster paper-cards (max 4 dots, 5px each, 3px gap)
- Lexi's expressions (raster PNGs, see Assets)

---

## Components

### 1. Paper-card term marker

The hero element. Replaces the original colored circles. Each is a small **HTML rectangle inside `<foreignObject>`** so we get sub-pixel serif rendering, real CSS shadows, and no SVG-text artifacts.

- **Container:** `<foreignObject>` inside an SVG `<g>`, centered on the node's force-layout `(x,y)`.
- **Background:** `linear-gradient(180deg, rgba(255,250,235,0.9), rgba(238,228,205,0.95))` over `#f6efdf` base.
- **Border:** `1px solid rgba(80,60,30,0.18)` all around, **3px solid {clusterAccent}** on the left edge — this is the colored "tab" that signals cluster.
- **Border radius:** `4px`.
- **Shadow:** `0 2px 4px -1px rgba(60,40,15,0.18), 0 6px 14px -6px rgba(60,40,15,0.22)`.
- **Padding:** `5–7px Y × 11–14px X` depending on importance (sz).
- **Text:** Centered serif. Single-line by default (`white-space: nowrap`), but **wraps to two lines** with `text-wrap: balance` when single-line width would exceed 200px. NEVER ellipsis-truncate — the user must always read the full term.
- **Rotation:** Each card has a deterministic small rotation (`-2°` to `+2°`) seeded from the term id, for hand-pinned-paper feel. Pinned consistently across renders.
- **Multi-cluster dot row:** If a term has ≥2 clusters AND `sz ≥ 14`, a row of 5px dots appears beneath the label, one per cluster, in cluster-accent colors at `opacity: 0.85`.
- **Importance sizing (`sz` field on the data):** font-size scales `10 → 11 → 12 → 14` at thresholds `<14 / 14 / 18 / 26`. Padding scales similarly.
- **Font weight:** 500 default, 600 for terms with `sz ≥ 22` or the special `agent` node.
- **Color:** ink `#2a2418` for current terms, muted `#7a7568` for `evolved` (deprecated/superseded) terms.

#### Hover state
- Card lifts: `transform: rotate({orig}deg) scale(1.06)`, transition 180ms ease.
- Shadow deepens: `0 4px 8px -2px rgba(60,40,15,0.28), 0 12px 24px -8px rgba(60,40,15,0.30)`.
- Connected nodes (1-hop neighbors via `LINKS`) stay full-opacity.
- All other nodes fade to `opacity: 0.25`.
- Edges: connected edges full-opacity + slightly thicker; others `opacity: 0.15`.

#### Active (open) state
- Card scales `1.10` permanently while panel is open.
- Same neighbor highlight as hover.

### 2. Edges

Thin curved lines (D3 `linkRadial`-style or simple Bezier between source/target). 
- Default: `stroke: rgba(80,60,30,0.18)`, `stroke-width: 1`, `fill: none`.
- Highlighted (neighbor of hovered/active): `stroke: rgba(80,60,30,0.55)`, `stroke-width: 1.4`.
- Faded: `opacity: 0.15`.
- No arrowheads. No labels.

### 3. "Lexicon" wordmark (top-left)

```
Lexicon          AI · TERMINOLOGY · ATLAS
```
- **"Lexicon":** GT Sectra/Newsreader serif, 26px, `letter-spacing: -0.01em`, `line-height: 1`.
- **Subtitle:** JetBrains Mono, 9px, `letter-spacing: 0.18em`, uppercase, `color: var(--ink-muted)`. Inline-baseline-aligned 14px to the right of the word.

### 4. Search input

Floating, no chrome. Just a thin rule and a placeholder.
- `width: 260px`, `padding: 10px 14px`.
- `border: 1px solid rgba(31,29,24,0.14)`, `border-radius: 8px`.
- `background: rgba(246,239,223,0.6)` (translucent paper).
- `font: 11px 'JetBrains Mono'`, `letter-spacing: 0.04em`.
- Placeholder: `color: var(--ink-faint)`, "Find a term".
- **No icon.** No clear button. No focus ring beyond `border-color: rgba(31,29,24,0.4)`.

#### Search results dropdown
Appears below input when `search.length >= 2 && hits.length > 0`.
- Same paper background, `border-radius: 12px`, `box-shadow: var(--shadow-md)`.
- Each hit row: 10px × 14px padding, hover bg `rgba(80,60,30,0.06)`.
- Layout per row: `[6px cluster-color dot] [12px term name, serif] [tiny meta on right]`.
- Up to 7 hits; matches against `label` and `fullName`.

### 5. Cluster filter chips (top, centered row)

A horizontal scroll of all cluster pills. Single-line, wraps if needed on narrow viewports.
- Each pill: `padding: 6px 12px`, `border-radius: 999px`, `border: 1px solid {clusterColor at 0.4 alpha}`, `background: transparent`.
- Label: JetBrains Mono 10px, `letter-spacing: 0.12em`, uppercase, `color: {clusterColor}`.
- **Active state** (filter on): `background: {clusterColor at 0.18 alpha}`, `color: var(--ink)` darker, dot indicator before label.
- Click toggles inclusion in active filter set. When set is non-empty, all non-matching nodes/edges fade to `opacity: 0.18`.

### 6. Legend pill (top-right)

Compact `[N clusters]` button that expands to a full popover when clicked.
- Closed: `padding: 8px 14px`, `border: 1px solid var(--rule-soft)`, JetBrains Mono 10px.
- Open: card with all 17 clusters listed, each row `[6px dot] [name] [count]`. ~280px wide.

### 7. Detail panel

Slides in from the right when a term is opened. Pushes nothing; overlays.
- `width: 420px`, full-height, `right: 0, top: 0, bottom: 0`.
- Background: `#fbf6e8` (slightly creamier than page bg).
- `border-left: 1px solid var(--rule-soft)`.
- Shadow: `var(--shadow-lg)`.
- Padding: `40px 36px`.
- Slide-in: `transform: translateX(0)` from `translateX(100%)`, 240ms ease.

**Layout:**
1. Close button top-right: 24px tap target, JetBrains Mono `×`, no background.
2. Cluster chips (small, color-tabbed, max 3 visible). Same pill style as filter chips but smaller.
3. **Term name:** GT Sectra serif, 48px, `line-height: 1.05`, `letter-spacing: -0.015em`. If `fullName` differs from `label`, show `label` as JetBrains Mono 10px tracked subtitle above.
4. **Definition:** Newsreader 18px, `line-height: 1.5`, `color: var(--ink)`. Generous paragraph spacing.
5. **Related terms** section: small JetBrains Mono header "RELATED", followed by serif clickable list. Each item opens that term in turn.
6. **Share** button: bottom of panel. JetBrains Mono 10px, "COPY LINK" → "COPIED" on click. Copies `?term={id}` URL.

### 8. Lexi (mascot, bottom-right)

A small floating cluster: speech bubble (above) + avatar (below).

#### Avatar
- Source: PNG with transparent bg (in `assets/lexi-{state}.png`).
- Sizes: `108px` default, `130px` when teaching (because the teaching pose holds a sign that needs space).
- Drop shadow: `drop-shadow(0 8px 14px rgba(60,40,15,0.28)) drop-shadow(0 2px 4px rgba(60,40,15,0.18))`.
- No frame, no circular crop — the PNG handles its own silhouette.

#### States
| state | trigger | asset |
|---|---|---|
| `idle` | default | `lexi-idle.png` (smile, glasses on) |
| `excited` | `search.length >= 2 && hits.length > 0` | `lexi-excited.png` (sparkles + magnifying glass) |
| `curious` | `search.length >= 2 && hits.length === 0` | `lexi-curious.png` (puzzled, "??" beside head) |
| `teaching` | term is open | `lexi-teaching.png` (pointer + tiny speech bubble icon) |
| `sleeping` | 60s of no input | `lexi-sleeping.png` (eyes closed, Zzz) |

(Two extra assets are bundled but not currently wired: `lexi-attentive.png` and `lexi-thinking.png`. Use them if you want a "loading the Claude response" tween or a "search-mode-while-typing" sub-state.)

#### Speech bubble
- `max-width: 240px, min-height: 30px`.
- `padding: 10px 14px 11px`.
- `background: var(--bubble-bg)`, `border-radius: 14px`, `border: 1px solid rgba(80,60,30,0.18)`, soft shadow.
- Text: Newsreader 14px **italic**, `line-height: 1.35`, color `#2a2418`. Wrapped in `“ ”` curly quotes.
- Typewriter reveal: 2 chars every 18ms.
- SVG tail (downward triangle, 22×14) at `bottom: -13px, right: 26px`, pointing at avatar.

#### Bubble action button (not-found CTA)
When `state === 'curious' && notFoundQuery`, after the typewriter finishes, a small CTA appears under the message, separated by a `1px dashed rgba(80,60,30,0.20)` rule.
- "HOOVER IT UP" — JetBrains Mono 10px, `letter-spacing: 0.14em`, uppercase.
- `padding: 5px 10px`, `border: 1px solid rgba(80,60,30,0.30)`, `border-radius: 6px`.
- On click, message swaps to `"Off to hoover up '{query}'. Check back soon."` and the button hides. Currently a no-op — ports should hook this to the actual Lexi crawl-queue endpoint.

#### Speech-bubble copy generation
For the `teaching` state only, the bubble text is generated by calling `claude-haiku-4-5` (1024-token cap) with a structured prompt that includes the term's `fullName`, `clusters`, and `def`. The system prompt is a Lexi-character brief — see `prototype/variations/lexi.jsx` for the verbatim prompt.

**Implementation note for Claude Code:** the prototype calls `window.claude.complete(prompt)` (artifact-only API). In the real site, replace with a server-side proxy to Anthropic's API — never call Anthropic directly from the browser. The backend should:
1. Receive `{ termId }`.
2. Look up the term in the corpus.
3. Build the same prompt.
4. Call `claude-haiku-4-5` with `max_tokens: 80`.
5. Cache responses by `termId` (notes can be near-deterministic; weekly invalidation is fine).
6. Return the trimmed string.

Fallback when the request fails or is rate-limited: `The term “{label}” is one I keep an eye on.`

### 9. Loading splash

Full-viewport overlay, dismissed once layout settles.
- Background: `#f4f1ea`.
- Center: `lexi-scene.png` (Lexi at her desk, hoovering up terms — the storytelling shot), `max-width: min(90vw, 720px)`, `border-radius: 18px`, `box-shadow: var(--shadow-lg)`.
- Caption: bottom 6vh, centered, JetBrains Mono 10px tracked uppercase, "Lexi is settling in · Lexicon Atlas".
- Dismiss: `opacity 0 → 0`, 600ms ease, after `window.load` (or immediately if already loaded), with a 900ms minimum show time so it doesn't flash on cached loads.

### 10. Force layout

D3 `forceSimulation` with these forces:
- `forceLink`: distance 60–120 based on `LINKS[i].strength`, strength 0.4.
- `forceManyBody`: strength `-(d.sz * 6 + 60)`, theta 0.9.
- `forceCollide`: radius `Math.max(d._mw, d._mh) / 2 + 6` (paper-card aware).
- `forceX/forceY`: weak (0.04) pull toward the cluster's `(cx, cy)` center, blended for multi-cluster terms.

Run for ~400 ticks unhidden, then alpha-decay normally. The first paint should be a fully settled graph (no visible animation reflow) — the splash hides the simulation.

---

## State management

The Atlas component (`AtlasVariation`) holds:
```
active            // currently open term node, or null
filters           // Set<clusterId> for the filter chip row
search            // string in the search input
legendOpen        // bool
palette           // computed harmonized palette { [clusterId]: {hex, L, C, h, label} }
nodes             // full node array (mirrored from engine after mount)
idle              // bool — true after 60s of no user input
```

The `GraphEngine` (vanilla JS) owns the D3 simulation and DOM nodes. It exposes:
```
api.openNodeById(id)
api.closeNode()
api.setFilter(clusterIds: Set)
api.setHover(id|null)
api.palette
api.nodes
```

The two communicate by callbacks (`onNodeOpen`, `onClose`) and explicit method calls. Browser back/forward syncs `?term=` to `openNodeById` / `closeNode`.

**Idle detection:** any `mousemove`, `keydown`, `wheel`, `pointerdown` resets a 60s timer. On expiry, set `idle = true`. Any subsequent input clears it.

---

## Interactions & behavior

| trigger | result |
|---|---|
| Drag canvas | Pan (D3 zoom behavior, `scaleExtent: [0.4, 3]`) |
| Wheel / pinch | Zoom |
| Hover paper card | Lift card, highlight 1-hop neighbors, fade rest (transition 180ms) |
| Click paper card | Open detail panel (slide-in 240ms ease), set `?term=`, set Lexi=teaching, fetch Claude note |
| Click panel close (×) or canvas | Close panel, clear `?term=`, Lexi → idle |
| Type in search (≥2 chars, hits>0) | Show dropdown, Lexi → excited |
| Type in search (≥2 chars, hits=0) | Hide dropdown, Lexi → curious + bubble + CTA |
| Click search hit | Open that term, clear search, dropdown hides |
| Click cluster chip | Toggle in `filters` Set, refilter graph |
| Click legend pill | Toggle popover |
| 60s no input | Lexi → sleeping |
| Browser back/forward | Sync open term to `?term=` query |
| Click "Hoover it up" | Bubble flips to "Off to hoover…", Lexi stays curious until search clears |
| Click panel "COPY LINK" | Copy current URL to clipboard, label flips to "COPIED" for 2s |

**Animations:**
- Card hover lift: `transform/box-shadow`, 180ms ease.
- Panel slide-in: `transform`, 240ms ease.
- Splash dismiss: `opacity/visibility`, 600ms ease.
- Speech bubble typewriter: 2 chars per 18ms.
- Lexi state changes: instant swap (no crossfade — feels more alive).

**No motion preferences fallback yet.** Add `@media (prefers-reduced-motion: reduce)` to disable card-lift transitions and the panel slide.

---

## Data model

The full corpus (~200 terms, 17 clusters) lives in `prototype/graph-data.js`:

```js
const CL = { [clusterId]: { label, hex, cx, cy }, ... }    // 17 entries
const NODES = [
  {
    id: 'agent',                          // unique slug
    label: 'Agent',                       // display name on the card
    fullName: 'Autonomous Agent',         // optional longer form for the panel
    clusters: ['agentic', 'autonomy'],    // 1+ cluster ids — drives color via OKLCH mix
    sz: 28,                               // importance, drives card size + font weight
    def: 'Long markdown definition...',   // shown in detail panel
    nodeType: 'concept',                  // 'concept' | 'product' | 'initiative' (latter two get a thin outer ring instead of a card)
    evolved: false,                       // if true, term is deprecated; rendered muted
  },
  // ...
]
const LINKS = [
  { source: 'agent', target: 'tool-use', strength: 0.8 },
  // ...
]
```

The data model does NOT need to change in the port. Keep the same shape. The original site's data file is the source of truth — we only iterated on the *rendering* of it.

---

## Files in this handoff

```
prototype/
  index.html                  ← Atlas page (loads everything, shows splash, renders <App/>)
  shared/
    palette.js                ← OKLCH harmonizer + multi-cluster mixer (PORT THIS VERBATIM)
    graph-engine.js           ← D3 force layout + paper-card renderer (PORT THE ALGORITHMS, REWRITE THE DOM PART IN YOUR FRAMEWORK)
    chrome.css                ← shared utility classes (small)
  variations/
    atlas.jsx                 ← The chrome (header, search, filters, panel, Lexi mount). REACT REFERENCE; rewrite in your framework.
    detail-panel.jsx          ← The right-side term panel
    lexi.jsx                  ← Mascot component + Claude prompt + speech bubble + CTA
  graph-data.js               ← Cluster definitions + node array + link array. (Same shape as the live site.)
  graph-data-agent.js         ← Patch file for the 'agent' subgraph. Loaded after graph-data.js; mutates NODES in place.
  d3.min.js                   ← D3 v7 (use whatever D3 version your codebase has)
  favicon.svg                 ← unchanged from original
  assets/
    lexi-idle.png             ← 5 mascot states (transparent PNGs, ~1000×1000)
    lexi-curious.png
    lexi-excited.png
    lexi-teaching.png
    lexi-sleeping.png
    lexi-attentive.png        ← extra (not currently wired)
    lexi-thinking.png         ← extra (not currently wired)
    lexi-scene.png            ← splash artwork

reference/
  explorations.html           ← The earlier "design canvas" with 3 options (Atlas / Observatory / Document). Keep for context — we picked Atlas.
  original-index.html         ← The current production page, for diffing.
```

---

## Notes for the implementing developer

- **The OKLCH palette helper is small but critical.** Don't substitute it with a hand-picked palette — the perceptual harmony is the whole point. Either port `shared/palette.js` verbatim, or use `culori`/`colorjs.io` and reproduce the same `oklch(0.62 0.18 H°)` formula.
- **`<foreignObject>` for SVG-embedded HTML labels** is the right call here — it gives us real CSS shadows, text-wrap balance, and no SVG-text rendering quirks. Stick with this.
- **Don't ellipsis-truncate paper-card labels.** Wrap to two lines (with `text-wrap: balance`) when they overflow ~200px. Truncation kills the readability of a graph whose entire purpose is naming things.
- **Cache the Claude responses** server-side per term id. They're near-deterministic and the entire corpus only has ~200 terms — a single warmup run covers everything for weeks.
- **Lexi's voice matters.** The prompt in `lexi.jsx` is intentional: warm, slightly bookish, never generic, never "Ah," or "Well,". Don't rewrite the prompt without re-tuning against ~10 sample terms.
- **The "Hoover it up" CTA is currently a stub.** Wire it to whatever queue/system you'd use to enqueue a not-yet-known term for Lexi's nightly crawl. Persist the ack ("Off to hoover up…") for the duration of the search query so a user who clicks twice doesn't see the bubble flicker.
- **Test with a screen reader.** The detail panel needs `role="dialog"`, focus management on open, Escape to close. The paper-cards need `role="button"`, `aria-label="{fullName}, {clusterLabels}"`. None of this is in the prototype — add it.
- **Test with `prefers-reduced-motion: reduce`.** Disable the card-lift transition, panel slide, and typewriter reveal in that mode.
