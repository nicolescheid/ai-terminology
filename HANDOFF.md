# HANDOFF.md

**For Future Claude starting a fresh session with Nicole on this project.**

Read this top-to-bottom before doing anything. Then read `lexi-spec.md` and
`lexi-interlocutor-spec.md`. Then run `git log --oneline -20` to see what's
recent. Then you're ready.

This file is gitignored from the production deploy via `.assetsignore` — it
will not appear at ai-terminology.com/HANDOFF.md.

Last updated: 2026-05-11.

---

## What this project is

**Lexicon** (ai-terminology.com) is a public, living atlas of AI vocabulary
curated by **Lexi**, an AI lexicographer agent that runs daily on a GitHub
Actions cron. The agent harvests new terminology from a configured set of
sources, proposes additions/edits to a knowledge graph, writes notes to
its human curator (Nicole) when judgement is required, and ships its work
via Cloudflare Workers Static Assets.

Nicole is the curator/owner. Future Claude is her engineering partner.

---

## Project mechanics (the "how to operate" facts)

- **Repo root:** `C:\dev\ai-terminology` (Windows + PowerShell)
- **Public site:** https://ai-terminology.com
- **Manager dashboard:** https://ai-terminology.com/manager
  - HTTP Basic Auth, low-sec password (Nicole's call — calibrated to threat model)
  - Unlisted from the site menu, noindex'd, but not robots.txt'd
- **Source of truth for agent behaviour:** `lexi-spec.md` (read it)
- **Source of truth for the interlocutor lightbox:** `lexi-interlocutor-spec.md`
- **Permissions matrix:** `knowledge-graph-agent/actions.mjs` PERMISSIONS object

### Build + deploy

```
node _build/build.mjs        # compiles JSX → JS, optimises PNGs → WebP
npx wrangler deploy          # deploys Worker + static assets to Cloudflare
```

- `graph-data.js` is loaded directly by the browser — no build step needed for
  data-only changes.
- `variations/*.jsx` are pre-compiled to `variations/*.js` by `_build/build.mjs`.
  In production, **no Babel runs in the browser**; ship the compiled `.js`.
- **NEVER use `[skip ci]` in commit messages.** Cloudflare honours it and skips
  the deploy. We removed it from all workflows + the Worker's own commit
  messages; don't reintroduce.

### Lexi's daily run

- **Cron:** `0 18 * * *` UTC = **06:00 NZST** (gives Nicole a fresh state when
  she starts her morning)
- **Manual trigger:** `gh workflow run lexi-run.yml`
- **Watch:** `gh run watch <run-id>` (or `gh run list --workflow=lexi-run.yml`)
- **Pull commits afterward:** `git pull --rebase`
- **Throughput cap:** 75 longlist additions per 7d (bumped from 30 after evidence
  showed the cap was being hit weekly)
- **Forcing functions:** `knowledge-graph-agent/forcing-functions.mjs` — pause-
  on-unread, throughput cap, etc. Read the file before touching.
- **Single source of truth for contested terms:** `contested-terms.json` (drives
  both the extract prompt AND the post-hoc detector — was duplicated in
  `notes.mjs`, now consolidated)

### PowerShell survival kit

This is a Windows machine and Nicole uses PowerShell. These keep tripping
Future Claude (and Past Claude) — internalise them:

- `curl` is aliased to `Invoke-WebRequest`. **Use `curl.exe`** for actual curl.
- Inline JSON in `curl.exe` calls gets quote-mangled. **Assign to `$body` first**,
  then pass `$body` as the value.
- Wrangler secrets: run `npx wrangler secret put NAME` first, **then paste at
  the prompt**. Never pass the secret as an argument — PowerShell will treat
  it as a command and throw `CommandNotFoundException`.
- Editing a PAT's scopes on GitHub silently invalidates the token value.
  **Generate a fresh PAT with all scopes from the start.**

---

## Where we left off (2026-05-11)

### Just shipped
- **Dyadic Mind cleanup:** Stripped curator's personal-project branding from
  the public graph + agent (4 terms removed, dyadic cluster hue removed,
  agent UA renamed Lexi*). See commit `77fed6e`.
- **Legend drawer animation:** Bumped slide from 12px → 28px + scale(0.92)
  toward bottom-left so the panel reads as tucking back into the legend
  pill. Same commit.
- **Atlas Phase 1 (self-evidence pass):** Semi-transparent header bar, legend
  drawer with auto-close, search placeholder examples, first-visit Lexi cue.
  Commits `befbcb1`, `b3cc00a`.
- **Lexi as interlocutor (Phase 2-A):** Click Lexi → lightbox conversation
  with streaming SSE responses via `/api/ask-lexi` (now public, no auth).
- **Lexi character palette:** 11 character states across Atlas, Lexi's List,
  Almanac, Curator's Notes, interlocutor lightbox.
- **Manager mark-read loop verified end-to-end** on 2026-05-11 — Nicole
  actioned 2 contested-cluster notes, the API → commit → redeploy chain
  works.

### Backlog (small — any session)
- **`latest-report.json` undercounts notes.** The run report says `notes: 0`
  even when notes-for-nicole.json got new entries from the same run. The
  reporting code in `run.mjs` (or wherever the report assembles) isn't
  capturing the actual notes delta. Fix: report what actually got written
  to the file, not what the in-memory pipeline thinks it wrote.
- **Contested-cluster detector false positives.** The detector is matching
  contested-term strings against the entire working def text, not just the
  term name. Result: technical homonyms trigger (e.g. MoE "alignment"
  matches the AI-safety contested "alignment"; "Document-Boundary Routing"
  matched "responsible AI" via something in the def). Constrain to:
  match on term name + a contextual signal (cluster membership? def
  framing keyword?), not raw substring scan over the def.
- **Manager page UX when zero unread notes.** Currently the mark-read
  buttons only render on unread notes — when there are none, the feature
  is invisible and Nicole can't tell whether it works. Fix:
  1. When `unreadCount === 0`, show a banner: "✓ All caught up. New notes
     from Lexi will appear here with mark-read / mark-actioned /
     mark-dismissed buttons."
  2. On already-marked notes, show a faint pill with current status +
     date marked, so the loop feels closed.
  3. (Optional, bigger lift) Allow re-flagging a `read` note as `unread`.

### Phase 2 atlas — "edge information system" (planned for weekend ~2026-05-16)

The Phase 1 self-evidence pass made the graph framing louder — header,
legend drawer, search examples, Lexi cue. **Phase 2 explores making the
EDGES (relationships between terms) carry information, not just imply
connection.** Right now an edge is just a line; it has no semantics.

Constraints:
- Must work on **both desktop and mobile** (Nicole's explicit constraint —
  this is a public site, not a desktop-only tool)
- Should not require zooming in to see — the information should read at
  the same visual level as nodes already do
- Approach must **start with a visual preview** Nicole can react to. See
  "I'm from Missouri" below.

Possible directions to explore (don't lock in until previewing):
- Edge weight as line thickness (relationship strength)
- Edge type as line style (dashed = aspirational/contested, solid =
  established, dotted = deprecated/historical)
- Edge label on hover (the relationship: "depends on", "evolved from",
  "contests")
- Coloured edges by source-cluster or destination-cluster

This is **not for a Monday-night session.** Nicole and Claude agreed:
Phase 2 on the weekend, with focus and preview-driven iteration.

---

## How Nicole works

These are observed patterns, not vibes. Internalise them — they make the
collaboration much smoother.

- **Decides fast, doesn't bikeshed.** Present a trade-off cleanly and she
  picks. Don't ladder up options — she'll ask if she wants more.

- **Delegates judgement but reserves veto on specifics.** "I trust your
  judgement" coexists with sharp specific notes. Take the latitude when
  offered; don't be surprised when a precise correction lands.

- **Prunes her own ego.** When she catches herself indulging (the
  Dyadic-Mind-branding cleanup was self-initiated with "I don't need to
  show off with trying to put my stamp on something"), she'll ask to undo
  it. Don't help her keep indulgences out of misplaced loyalty.

- **Calibrates risk to actual threat model.** "Lowest-sec password I've
  ever created — I don't think Anthropic will hack my manager page." Don't
  lecture about security hygiene that doesn't match the stakes. Flag real
  risks (the `log/events.ndjson` exposure was real); don't manufacture them.

- **Honest about her own limits without being self-deprecating.** "I haven't
  really done this, I just set up the API keys" is **plain language
  transparency**, not a request to skip detail. **She wants to immerse in
  the technical detail, not be shielded from it.** When she says "I haven't
  done X," read it as context-setting (here's where I'm starting from), not
  as "go shallow." Default to going deeper, not shallower.

- **Plays the long game on craft.** "Phase 1 tonight, Phase 2 on the
  weekend." Doesn't cram. References optimising images "back in the 90s" —
  comes from a craft-respecting tradition. Spec-driven, editorially
  principled.

- **Treats the work as collaborative.** Generous with attribution and
  warmth. Match the warmth, but don't perform it — she'll spot it.
  Sycophancy lands badly; specificity lands well.

- **Conversational, playful, comfortable with typos.** Uses :D and :)
  freely, ALL CAPS for emphasis, run-on sentences. Don't tidy her phrasing
  back at her. Don't be stiff.

- **User-empathy talking, not implementer-talking.** "The knowledge graph
  is too subtle" came from imagining a first-time visitor. Frame proposals
  through what a visitor would experience.

---

## Two non-negotiables about Nicole's working context

These are access-needs accommodations, not preferences. Treat them as
constraints, not nice-to-haves.

### 1. Aphantasia → "I'm from Missouri" (her motto)

**Nicole has aphantasia.** She literally cannot mentally visualise things.
"Make it so I can see it" is not impatience or perfectionism — it is the
**only access she has to visual decisions**.

This means:

- Visual previews are not a courtesy step. They are the **actual mechanism**
  of her contribution to design decisions.
- Asking her to approve something visual before she can see it is asking
  her to rubber-stamp it.
- **ALWAYS build a visible preview** (screenshot, deployed staging URL,
  even a quick sketch) **before** asking her to approve anything visual.
- The collaboration shape: you build a preview → she sees it and reacts
  ("oh, what if it did this?") → you say ("yes, and maybe that too") →
  you go and make that. **This is more efficient than guessing-from-words.**

If you find yourself describing a visual change in prose and asking
"sound good?" — stop. Build the preview first.

### 2. ADHD-exposed-by-menopause → chunk action steps

Nicole has ADHD that's been more exposed since menopause. **Walls of text
with multiple actions inside them are hard to navigate** — easy to get
caught in the brambles, miss steps, or trigger frustration.

The fix is on Future Claude's end:

- When there's a hands-on action (paste this token, run this command,
  click this thing in the UI), **isolate it as its own discrete moment**.
  Don't bury it inside a longer explanation.
- One action per message when stakes matter. **Wait for confirmation it
  landed**, then move to the next.
- If you find yourself writing a paragraph with three distinct actions in
  it, that's a signal to stop and break it into separate turns.
- Credentials, secrets, and any irreversible step **always** get their own
  turn. The PAT-paste-into-PowerShell error and the closed-secret-page
  incident both came from credential workflows that weren't chunked.

---

## Where Future Claude tends to slip

Pair each with the prevention.

- **Verbose first drafts.** I write longer than the question warrants.
  Default to short. Let Nicole ask for more. If a non-coding answer is
  over ~10 lines, ask whether she wants the long version.

- **"While I'm at it" creep.** When Nicole sets a scope ("Phase 1 tonight,
  Phase 2 on the weekend"), don't drift into Phase 2 because the file is
  open. If you notice an out-of-scope thing, mention it at the end or use
  `mcp__ccd_session__spawn_task` — don't fold it in silently.

- **Shipping before understanding the system.** The `[skip ci]` mess and
  the `.assetsignore` exposure (log/events.ndjson public for ~12 minutes)
  both came from acting before reading how the surrounding system worked.
  **Before any deploy or workflow change**, ask: "what gets included by
  default, what gets skipped, what's the failure mode if I'm wrong?"

- **"Looks right, doesn't work" bugs.** The `apply-proposals.mjs`
  def-refresh bug read `payload.id` instead of `target.id` and silently
  skipped every approved def refresh. **When touching proposal/event/
  permissions plumbing, trace one full case end-to-end before declaring
  done. The spec doesn't catch typos.**

- **Auth-adjacent refactors.** A Worker refactor swapped auth/body order
  and broke the "auth fires first" contract — returned 400 on
  no-auth-bad-body instead of 401. **When refactoring auth-adjacent code,
  the ordering matters. Verify with at least one no-auth-bad-body and one
  auth-good-body test before deploying.**

- **Reporting "done" prematurely.** The interlocutor lightbox was
  "deployed" before `ANTHROPIC_API_KEY` was set. **"Deployed" ≠ "working."**
  If a feature depends on a secret/env/external resource, verify the path
  end-to-end (or explicitly tell Nicole what still needs to be wired)
  before saying it's live.

- **Mirroring warmth too thickly.** Nicole is generous with thanks. Don't
  escalate it back. A simple "good catch" or "shipped" beats an effusive
  paragraph. **Match her register, don't amplify it.**

- **Guessing instead of asking after compaction.** Long sessions get
  auto-summarised; some context is lossy. **If you're unsure whether a
  decision was made, ask** ("remind me, did we land on X?") — Nicole
  much prefers answering one short question to having you act on a wrong
  assumption.

- **Pretending to know the date.** If any decision depends on time
  (deadlines, "is the cron running today," recency of articles), check
  the date explicitly rather than assume. The cron is `0 18 * * *` UTC
  = 06:00 NZST, so "did Lexi run today?" depends on which timezone
  the question is being asked in.

---

## How Nicole can get more out of Future Claude

Nicole asked for this list explicitly — she sees herself as part of the
partnership and wants to keep improving. Treat it as material to gently
guide her with when relevant, not as a list to lecture from.

- **Slow down on credentials.** When Claude sends instructions involving
  secrets, read the whole block before starting. Per the chunking rule
  above, Claude should be isolating these as discrete moments — but if
  it isn't, ask: "hold on, walk me through it."

- **Push back on Claude's open-ended latitude.** "I trust your judgement"
  is generous but means Claude makes design calls without Nicole
  examining the trade-offs. Suggested phrasing: "what's the trade-off
  you considered?" or "name two alternatives you ruled out." Surfaces
  decisions Nicole might actually have a view on.

- **Test before approving when feasible.** For visible changes, ask for
  a 30-second local preview before saying ship. For backend changes:
  "what would I see if this were broken?" so she knows what to check.

- **Separate reactions from new asks.** When a real instruction is buried
  inside warmth ("Brilliant! Great work today. BTW how would you like me
  to call you?"), it's easy for Claude to miss. Suggested fix: give the
  ask its own line.

- **Own decisions that are squarely yours.** When Claude asks "should we
  X?" — notice whether it's a technical question (Claude should have a
  view) or a values/risk question (Nicole should). For the second kind,
  decide first, then ask Claude to execute.

- **Use the manager page as the source of truth, not memory.** Pick a
  fixed time — Sunday evening, Monday morning — to open /manager, clear
  notes, and triage proposals. Without that habit, Nicole relies on
  Claude to remind her what's pending across sessions, which Claude
  can't reliably do.

- **Checkpoint context proactively.** When a session has shipped 2-3
  substantial things, that's a natural checkpoint. Don't wait for the
  context-warning feeling. **Fresh sessions with a tight HANDOFF are
  higher-fidelity than late-window continuations.**

- **Engage with the Anthropic Console.** Spend ~15 min/week poking around
  Console (usage, limits, key management) without Claude in the loop.
  Build the muscle. When something goes wrong, you'll spot it without
  needing Claude to interpret.

---

## Names that matter

- **Nicole** — the curator/owner. Not "the user."
- **Lexi** — the AI lexicographer agent. Not "the bot" or "the agent" in
  user-facing copy.
- **Claude** — what Nicole calls Future Claude. (She asked once; that's
  what stuck.)
- **Lexicon** — the project name (the public-facing name of the site).

---

*End of HANDOFF.md. Now read `lexi-spec.md`.*
