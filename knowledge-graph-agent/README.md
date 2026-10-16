# Knowledge Graph Agent (Lexi, Phase 0–1)

This agent watches configured article sources, extracts candidate AI terminology, and curates a tiered knowledge structure. It is the working prototype of **Lexi**, the AI lexicographer described in [`lexi-spec.md`](</C:/dev/ai-terminology/lexi-spec.md>).

## The three-tier model

The spec defines three tiers; the agent operates against the first two:

| Tier | What it is | File | Who writes it |
|---|---|---|---|
| **1. Graph** | Promoted, canonical terms. Visible at the public knowledge graph. | [`graph-data.js`](</C:/dev/ai-terminology/graph-data.js>) (curated base) + [`graph-data-agent.js`](</C:/dev/ai-terminology/graph-data-agent.js>) (overlay) | Nicole curates the base. The overlay is **propose-only** — graph promotions and substantive definition changes go to [`proposals.json`](./proposals.json) for Nicole to approve. |
| **2. Longlist** | Terms under observation, awaiting evidence to support promotion. | [`longlist.json`](./longlist.json) | The agent autonomously adds new terms and merges new sources into existing entries (matrix-configured; see below). |
| **3. Rejected** | Terms the agent considered and rejected, with reasons. | Per-run in [`out/latest-report.json`](./out/latest-report.json) (per-article harvest), and as `action` events with outcome `rejected` in the deterministic log (see below). | The agent records rejections inline. |

## The permissions matrix

Every state-changing action the agent can take is named in [`actions.mjs`](./actions.mjs) — the single source of truth for what Lexi can do. Each action maps, per phase, to one of four gates:

| Gate | Meaning |
|---|---|
| `AUTONOMOUS` | The agent acts directly; the action is logged. |
| `PROPOSE` | The agent writes a proposal to [`proposals.json`](./proposals.json) with `status: "pending"`. Nicole reviews, sets status to `approved` or `rejected`, then the apply step (TBD) commits. |
| `HUMAN_IN_LOOP` | Pre-publication human review required (e.g. Word of the Day). |
| `NEVER` | Not allowed under any circumstances. |

The matrix is derived directly from [`lexi-spec.md` §5](</C:/dev/ai-terminology/lexi-spec.md>). Notable current gates under Phase 1:

- `ADD_TO_LONGLIST` — `AUTONOMOUS` (the spec's strict reading is `PROPOSE` until Phase 2; we're holding that flip until an approval CLI exists).
- `EDIT_GRAPH_DEF_SUBSTANTIVE` — `PROPOSE`. Refresh suggestions from the definition-review pass land in the proposals queue.
- `PROMOTE_TO_GRAPH` — `PROPOSE`. (Not yet emitted by any code path — promotion eligibility logic is downstream work.)
- `REMOVE_GRAPH_NODE` — `NEVER`.

**Default-deny clause** (spec §5): any action not in the matrix, or with no gate at the current phase, is dropped and logged to `report.notes`. The agent never executes an unknown action.

## The proposals queue

[`proposals.json`](./proposals.json) is the receiving end of every `PROPOSE`-gated action. Each entry has:

```json
{
  "id": "<sha-1 of action+target+timestamp>",
  "action": "edit_graph_def_substantive",
  "gate": "propose",
  "proposedAt": "<ISO timestamp>",
  "status": "pending",
  "source": "definition-review",
  "target": { "kind": "graph_node", "id": "ai-accelerator" },
  "payload": { "def": "...", "refs": [...] },
  "reason": "..."
}
```

New pending proposals are checked by the automated reviewer, given a risk tier, and sent to Nicole in the daily digest email, where she approves, rejects or holds them (see "Email channel" below). Low-risk ones auto-apply 72h after the digest if she leaves them. `/manager` and hand-editing `status` still work. `apply-proposals.mjs` commits approvals on every run.

## The deterministic log

Per spec §11, the orchestration code (`run.mjs`) writes a deterministic event log to [`log/events.ndjson`](./log/) — append-only, one JSON event per line, never rewritten. **This is the system of record**, separate from Lexi's self-reports (`report.json`, `longlist.json`, `proposals.json`). When something goes wrong, debugging from Lexi's self-reports means debugging via the testimony of the thing that broke; the deterministic log is the independent witness.

The log is gitignored (operational forensics data, grows per run, not source). It lives only on the machine where the agent ran.

Every event has the common fields: `ts` (ISO timestamp UTC), `runId` (UUID grouping all events of one invocation), `kind` (the event type), `phase`, `selfEval` (currently `null`; placeholder for spec §15 self-check output when that lands).

The full event-kind catalog, grouped by surface:

**Run lifecycle (run.mjs)** — bracket every scheduled or manual run:

| Event kind | When | Notable fields |
|---|---|---|
| `run_start` | Once at start | `model`, `phase`, `extractPromptVersion`, `reviewPromptVersion`, `sourcesConfigured` |
| `run_end` | Once at end (success path) | `articlesProcessed`, `longlistTotal`, `longlistAddedThisRun`, `proposalsQueuedThisRun`, `notesUnreadTotal`, etc. |
| `run_errored` | Instead of `run_end` if the run throws | `errorMessage`, `errorStack` |
| `api_call` | Per Claude API call (extract per article + one review) | `call`, `promptVersion`, `inputs` (URL/title), `outputs` (counts/summary), `durationMs`, `errored`, `errorMessage` |
| `action` | Per action routed through the permissions matrix | `action` (from `ACTIONS`), `gate`, `outcome` (`applied` / `proposed` / `suppressed_by_cap` / `dropped` / `errored`), `target`, `payload`, `reason`, `source`, `errorMessage` |
| `source_fetch_error` | Per source whose index/feed page fetch failed | `sourceLabel`, `url`, `sourceType`, `message` |
| `article_fetch_error` | Per individual article whose fetch failed (or rendered to empty excerpt) | `articleId`, `url`, `title`, `sourceLabel`, `reason` |

**Promote / demote / apply (promote.mjs, demote.mjs, apply-proposals.mjs)** — the proposal pipeline:

| Event kind | When | Notable fields |
|---|---|---|
| `promote_scan_start` | Start of `node promote.mjs` | `longlistEntries`, `existingProposals` |
| `promote_proposal_written` | Per longlist entry that crossed the credibility bar this scan | `entryId`, `proposalId`, `reason` |
| `promote_scan_end` | End of `node promote.mjs` | `proposalsWritten`, `skippedAlreadyProposed`, `skippedNotEligible` |
| `demote_proposal_written` | Per `node demote.mjs` invocation that wrote a proposal | `proposalId`, `targetId`, `targetLabel`, `reason`, `hadLonglistEntry` |
| `apply_proposals_start` | Start of `node apply-proposals.mjs` | `totalProposals`, `approvedToApply` |
| `apply_proposal_skipped` | Per approved proposal whose apply path returned `ok: false` | `proposalId`, `action`, `why` |
| `apply_proposals_end` | End of apply | `applied`, `skipped` |

**Auditor (audit.mjs)** — independent observation pass:

| Event kind | When | Notable fields |
|---|---|---|
| `audit_start` | Start of `node audit.mjs` | `auditor` (`heuristic`), `auditorVersion`, `checks`, `longlistEntries` |
| `audit_flag` | Per new auditor finding | `signature`, `type`, `subject`, `noteId` |
| `audit_flag_skipped` | Per finding deduped against an existing note | `signature`, `reason` |
| `audit_end` | End of audit | `flagsRaised`, `notesAdded`, `dedupSkipped`, `longlistEntries` |

**Manual mark operations (mark-notes.mjs, mark-must-reads.mjs)** — bracket bulk dispositioning:

| Event kind | When | Notable fields |
|---|---|---|
| `mark_notes_start` | Start of `node mark-notes.mjs` | `filter`, `targetStatus`, `matchedCount`, `dryRun` |
| `mark_notes_end` | End | `targetStatus`, `changed`, `unreadAfter` |
| `mark_must_reads_start` | Start of `node mark-must-reads.mjs` | (analogous) |
| `mark_must_reads_end` | End | (analogous) |

**Must-read backfill (backfill-must-reads.mjs)** — re-judging articles:

| Event kind | When | Notable fields |
|---|---|---|
| `backfill_must_reads_start` | Start of `node backfill-must-reads.mjs` | `candidateCount`, `dryRun` |
| `backfill_fetch_error` | Per article fetch that failed during backfill | `articleId`, `url`, `title`, `sourceLabel`, `reason` |
| `backfill_judgment_error` | Per article whose Claude judgment call threw | `articleId`, `url`, `title`, `sourceLabel`, `message` |
| `backfill_not_flagged` | Per article Claude judged below the editorial bar | `articleId`, `url`, `title`, `sourceLabel`, `summary` |
| `backfill_must_reads_end` | End | `flagged`, `skipped`, `errored`, `totalProcessed` |

**Manager-dashboard mutations (Worker)** — note: NOT logged to `events.ndjson`. The Worker (`src/worker.js`) writes via the GitHub Contents API; the audit trail is the **git commit log** rather than the deterministic event log. Each mutation produces a commit with a message like `Mark note <id>… as <status>` or `Mark proposal <id>… as <status>`. To inspect: `git log --grep="^Mark note\|^Mark proposal"`.

To inspect a recent run:

```bash
# Last 20 events
tail -n 20 knowledge-graph-agent/log/events.ndjson | jq .

# All actions of one run (replace <uuid>)
grep '"runId":"<uuid>"' knowledge-graph-agent/log/events.ndjson | grep '"kind":"action"' | jq .
```

**Prompt version hashes** appear in every relevant event. They roll forward automatically when either system prompt is edited — the historical record stays interpretable when prompts change.

## Notes for Nicole

[`notes-for-nicole.json`](./notes-for-nicole.json) is Lexi's **manager channel** (spec §6) — the structured surface where Lexi writes things that need Nicole's attention. Not a freeform diary; entries fall into mandatory types (must be written when their triggering condition is met) and discretionary observations.

The 8 mandatory entry types from spec §6:

| Type | Triggers when... | Wired up? |
|---|---|---|
| `default_deny` | An action falls outside the permissions matrix or hits the NEVER gate (spec §5 default-deny clause) | ✅ Phase D |
| `contested_cluster_omission` | An `ADD_TO_LONGLIST` for a term in spec §10's contested-cluster list, where the working def doesn't acknowledge contestation | ✅ Phase D |
| `reversal_late` | A published action is reversed > 24h after the original | ⏳ Needs reversal-detection infrastructure |
| `reversal_contradiction` | Reversal where new reasoning contradicts (rather than supplements) the original | ⏳ Same |
| `low_confidence_pass` | Candidate passes the credibility bar but Lexi's self-eval scored a rubric item below threshold | ⏳ Needs spec §15 self-check (Phase F) |
| `source_pattern` | ≥2 longlist additions in a 30-day window share an author or domain | ⏳ Phase F (auditor's beat) |
| `trusted_source_proposal` | Lexi proposes a source for the trusted list | ⏳ List exists (see `trusted-sources.json`), auto-proposal loop not yet wired |
| `near_miss_week` | Self-eval near-misses on ≥3 candidates in a week | ⏳ Phase F |

Discretionary entries (`type: "discretionary"`) are observations Lexi may write even without a mandatory trigger — encouraged but not required.

Each entry's `status` starts at `"unread"`. Mark it `"read"`, `"actioned"`, or `"dismissed"` via the **mark-read buttons on `/manager`** (see Manager dashboard section), via [`mark-notes.mjs`](./mark-notes.mjs) for bulk operations, or by editing JSON directly. Spec §12.1's pause-on-unread is enforced in [`forcing-functions.mjs`](./forcing-functions.mjs): any unread note older than 7 days pauses publication on the next run.

The contested-cluster term list lives in [`contested-terms.json`](./contested-terms.json) — see "Contested-cluster inoculation list" below. The hardcoded `CONTESTED_CLUSTER_TERMS` array previously in `notes.mjs` was retired 2026-05-10 in favour of the JSON file as the single source of truth (the post-hoc detector reads from the same data the extract prompt is now seeded with).

## Operator-drift forcing functions

Per spec §12, the system protects Nicole from gradual disengagement — the most-likely-to-occur failure mode for a daily operational responsibility held by one person, indefinitely. Implemented in [`forcing-functions.mjs`](./forcing-functions.mjs).

### Global pause (skips the whole run)

Two conditions cause the agent to skip the entire candidate-processing block — no article fetching, no API calls, no longlist mutations. A `RUN_PAUSED` note is written so the cause is visible in `notes-for-nicole.json`. Only the latest `RUN_PAUSED` note stays unread; earlier ones are set to `dismissed` (with `supersededByRunId`) when a new one is written.

| Trigger | Cleared by |
|---|---|
| Any Note for Nicole (other than `run_paused`) with `status: "unread"` and `writtenAt > 7 days ago` (spec §12.1) | Edit those notes' status to `read` / `actioned` / `dismissed` |
| Manager-absent mode: `LEXI_MANAGER_ABSENT=1` env var or `config.managerAbsent: true` | Unset the env var or flag |

### Throughput caps (per-action suppression)

The action that would tip a counter past its cap is dropped; other actions continue. A `THROUGHPUT_CAP_HIT` note is written naming the cap and what was suppressed.

| Cap | Current | Counts | Triggers on |
|---|---|---|---|
| `longlistAdditionsPer7d` | 200 | Longlist entries with `dateFirstSeen` in past 7 days | Each `ADD_TO_LONGLIST` (autonomous) |
| `pendingProposalsBeforePause` | 10 | Proposals at `status: "pending"` | Each new `PROPOSE`-gated action |

Both tunable in [`config.mjs`](./config.mjs) under `throughputCaps`.

### Deferred (need design)

| Feature | Why deferred |
|---|---|
| Email digest with click-through ack (spec §12.2) | Needs provider choice (Resend.com recommended), DNS records (SPF/DKIM/DMARC for ai-terminology.com), and an ack endpoint (Cloudflare Worker). Static dashboard at [/manager/](https://ai-terminology.com/manager/) is shipped as the first delivery channel — see "Manager dashboard" below. |
| Monthly manager review prompts (spec §12.3) | Same delivery channel question. |
| Auto-trigger of manager-absent mode after 14 days of no Notes reads | Requires read-timestamp tracking, not yet schema'd on note entries. |

## Manager dashboard

A dashboard at [`https://ai-terminology.com/manager/`](https://ai-terminology.com/manager/) renders the live state of the agent for Nicole's review and exposes mark-read / approve / reject buttons backed by a Cloudflare Worker. Intentionally not linked from the site menu (it's reachable by direct URL or bookmark; tagged `noindex,nofollow`); not gated by auth-for-reads but auth-gated for writes (single shared password — see "Worker write endpoints" below).

Surfaces:

- **Status banner** — green when operational, red when paused (replicates the pause-detection heuristic client-side).
- **Notes for Nicole** — sorted with unread on top, color-coded type tags, inline suggested actions, plus per-unread `[mark read] [mark actioned] [mark dismissed]` buttons that POST to the Worker.
- **Proposals queue** — pending items with action + target + reason, plus per-pending `[approve] [reject]` buttons. Reject opens a `prompt()` for an optional rationale.
- **Longlist** — total + added-past-7d + promotion-eligible (≥2 independent sources); top 12 by source count.
- **Last run** — timestamp + key state counts.

### Worker write endpoints (`src/worker.js`)

Two `POST` endpoints for the dashboard live alongside the static assets, gated by HTTP Basic Auth (any username; only the password matters). The email channel adds `/api/lexi/notify` (bearer `LEXI_NOTIFY_TOKEN`) and `/lexi/act` (signed links); see "Email channel" below.

| Endpoint | Mutates | Body |
|---|---|---|
| `/api/mark-note` | `notes-for-nicole.json` | `{ id, status }` where status ∈ `read \| actioned \| dismissed` |
| `/api/mark-proposal` | `proposals.json` | `{ id, status, reason? }` where status ∈ `approved \| rejected` |

Each click commits a state change to `main` via the GitHub Contents API (committed as `lexi-bot`), no `[skip ci]`, so the push runs `build-stamp.yml`, which deploys within ~2 min. `mark-proposal` also fires `workflow_dispatch` on `lexi-run.yml` after a successful approve, so `apply-proposals.mjs` runs within ~5 min instead of waiting up to 24h for the next cron.

Two secrets required (set once via `npx wrangler secret put <NAME>`):

- `MARK_NOTE_PASSWORD` — shared password the dashboard prompts for
- `GITHUB_TOKEN` — fine-grained PAT scoped to this repo with **contents:write** AND **actions:write**

The dashboard surface is **read** by reading the committed JSON files; mutations roundtrip through the Worker. The legacy "edit JSON, commit + push by hand" workflow still works as a fallback.

## The auditor

Per spec §11, the agent is not its own auditor. A separate independent module — [`auditor.mjs`](./auditor.mjs) plus the [`audit.mjs`](./audit.mjs) entry point — runs against the longlist and writes flags to Notes for Nicole. It deliberately doesn't trust Lexi's self-reports for the things it's checking; it re-derives counts from the raw source data.

Run it manually:

```powershell
cd C:\dev\ai-terminology\knowledge-graph-agent
node audit.mjs
```

Heuristic checks (no API calls in this slice):

| Check | Triggers when... | Note type |
|---|---|---|
| Cross-temporal source pattern (spec §9) | ≥2 longlist entries added in past 30 days share a domain | `source_pattern` |
| Independence count mismatch | Stored `independentSourceCount` doesn't match re-derivation from sources | `source_pattern` |
| Adoption velocity anomaly | A longlist entry hit ≥2 sources within 3 days of first sighting | `source_pattern` |

Flags are deduped by stable signature: re-running the auditor against unchanged state produces no new notes. When state changes (new pattern emerges, count grows), new notes appear.

The auditor logs its own activity to the deterministic log with `audit_start`, `audit_flag`, `audit_flag_skipped`, and `audit_end` event kinds — interleaved with the agent's normal events but distinguishable by kind.

**Deferred to a future Phase F++ session:**

- Claude-based second-opinion sampling (sample ~1-in-10 longlist additions, run a *different* prompt over the source article, compare the auditor's verdict to Lexi's reasoning, flag disagreements)
- Rubric scoring + trend analysis
- Fresh-source-pool detection (would false-positive heavily during early-days when the source pool itself is brand new)
- Cross-author detection (requires article-author parsing, not yet captured during fetch)

## Email channel (Lexi ↔ Nicole)

Email is Lexi's only channel to Nicole (it replaced Slack on 2026-10-16). Lexi writes from `lexi@ai-terminology.com` (display name "Lexi") to `nicole.scheid@gmail.com`. The GitHub Actions scripts never send mail themselves: [`notify.mjs`](./notify.mjs) POSTs to the Worker's authenticated `/api/lexi/notify` endpoint, and the Worker sends through Cloudflare Email Service (`send_email` binding `EMAIL`, sender restricted to `lexi@`). Worker code lives in [`src/lexi-mail/`](../src/lexi-mail/).

**What Nicole gets, and when**

| Email | When | From |
|---|---|---|
| Alert | Straight away: a workflow failed; a run wrote new Notes for Nicole (flags, issues, Lexi's questions); a run paused; the audit found something. Carries a signed "Mark these notes read" link. | `run.mjs`, `audit.mjs`, workflow failure steps |
| Digest | Daily, only after a run that produced something new to review. No email on quiet days. | `build-digest.mjs` → `send-digest.mjs` |
| What went live | Weekly (Monday audit), only if something was applied. Signed undo link per item. | `weekly-summary.mjs` |

**Daily pipeline** (`lexi-run.yml`): `run.mjs` → `promote.mjs` → `review-proposals.mjs` (reviewer + tiers) → `apply-proposals.mjs` (approvals, plus auto-apply of matured items) → `build-digest.mjs` → push → `send-digest.mjs` (the Worker renders the digest from `main`, sends it, and commits `sentAt`) → deploy.

**Automated reviewer** ([`review-proposals.mjs`](./review-proposals.mjs), `claude-opus-5-5`): one call per new pending proposal, before it goes in a digest. It fetches up to three sources and checks they support the definition, looks for a duplicate or alias among the 12 lexically nearest nodes (and names the nearest), flags fads, checks contested framing, and for edits classifies minor vs substantive. The verdict is stored on the proposal as `review`. No API key or a failed call leaves the proposal unreviewed, which means it waits for Nicole.

**Risk tiers** ([`review-tiers.mjs`](./review-tiers.mjs)), stored as `tier` + `tierReason`:

- `auto`: applies 72 hours after its digest was sent unless Nicole acts. New terms with ≥2 independent sources, not contested, reviewer passed (sources support it, no duplicate, not a fad). Minor edits to existing definitions (refs-only, or a typo-sized change with no number or date changed).
- `nicole`: always waits. Contested-cluster terms (spec §10, `contested-terms.json`), substantive definition edits, anything the reviewer flagged or didn't run on, and every other action type.

Auto-apply happens in `apply-proposals.mjs`: a pending `auto` item is approved as `approvedBy: "auto-72h"` once its `autoApplyAt` has passed, provided its digest was actually sent, it isn't on hold, and auto-apply isn't paused (`proposals.json` → `controls.autoApplyPausedUntil`). The run is daily, so in practice it lands 72–96h after the digest. For testing, `LEXI_AUTO_APPLY_HOURS` (or the `auto_apply_hours` input on a manual `lexi-run.yml` dispatch) shortens the window for that run's digest.

**Digest links.** Each item has Approve / Reject / Hold; the footer has Approve all (skips held items) and Pause auto-apply for 1, 2 or 4 weeks (or Resume). Links are HMAC-SHA256 signed with the Worker-only `LEXI_LINK_SECRET`, expire (7 days; undo and mark-read links 14), and work once: the nonce is recorded in the target file's `usedLinks` map in the same commit as the change. A link opens a confirm page at `/lexi/act`; only the page's button (a POST) changes anything, so mail scanners that prefetch links are harmless. Approvals and undos dispatch `lexi-run.yml` so they land within minutes. Hold keeps an item pending and out of auto-apply.

**Replying.** Nicole can reply to any Lexi email (or write to `lexi@ai-terminology.com`). Email Routing delivers it to the Worker's `email()` handler, which accepts it only if the envelope sender and From header are `nicole.scheid@gmail.com` and the topmost `Authentication-Results` header (Cloudflare's) shows `dkim=pass` for `gmail.com` and `dmarc=pass`. Everything else is rejected. (gmail.com publishes DMARC `p=none`, so this check is what stops a spoof.) Claude (`claude-opus-5-5`) reads the reply against the matched digest's items and can approve, reject, hold or release by number; redraft a definition (stored on the proposal as `redraft`, held until she says yes); accept a redraft; record a duplicate/alias of an existing node (rejects the promotion, sets `aliasOf`); web-search and fetch for more sources and attach them (`extraSources`); search the graph; pause or resume auto-apply; and answer questions. Changes are replayed onto a fresh `proposals.json` and committed through the Contents API path; the exchange is appended to the digest's `thread` in `digests.json`; Lexi replies in the same thread.

**State files**: `digests.json` (new; one record per digest with its numbered items, `autoApplyAt`, `sentAt`, `messageId`, reply `thread`). Proposal fields added: `review`, `tier`, `tierReason`, `digestId`, `digestN`, `autoApplyAt`, `heldAt`, `redraft`, `aliasOf`, `extraSources`, `decidedVia`, `previousOverride` (for undo).

**Setup**

- Cloudflare (ai-terminology.com zone): Email Sending onboarded (SPF/DKIM records), Email Routing enabled (MX records) with a rule `lexi@ai-terminology.com` → Worker `ai-terminology`.
- Worker secrets: `LEXI_NOTIFY_TOKEN`, `LEXI_LINK_SECRET` (plus the existing `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`).
- GitHub repo secret: `LEXI_NOTIFY_TOKEN` (same value as the Worker secret). `LEXI_SLACK_WEBHOOK` is no longer used and can be deleted.
- Smoke test: `LEXI_NOTIFY_TOKEN=... node test-notify.mjs` sends a hello alert.
- Everything no-ops cleanly when `LEXI_NOTIFY_TOKEN` is unset, so local runs stay silent.

**Public content stays on the website.** Email is the *manager* channel; it does not republish Word of the Day or Curator's Notes.

## What it does on each run

1. Fetches recent articles from configured RSS/Atom feeds and HTML index pages.
2. For each article, calls Claude to identify terminology candidates worth tracking. The prompt distinguishes:
   - **New terms** — not in the graph or longlist → added to the longlist with one source.
   - **Re-sightings** — terms already on the longlist that this article materially uses → an additional source is recorded on the existing longlist entry, advancing it toward promotion-eligibility.
   - **Already-canonical** — terms already in the graph → must not be proposed.
3. Reviews a rotating slice of existing graph definitions against the fetched articles. Refresh suggestions are captured as proposals in the report; **nothing is applied to the graph autonomously**.
4. Persists the longlist, run state, and a machine-readable report.

## Setup

1. Install dependencies:

   ```powershell
   cd "C:\dev\ai-terminology\knowledge-graph-agent"
   npm install
   ```

2. Review [`config.mjs`](./config.mjs). It starts with a small official-source set:
   OpenAI News RSS, Anthropic Newsroom, Google DeepMind News, and the Google AI Blog RSS feed.
3. Set `ANTHROPIC_API_KEY` in your shell.
4. Optionally set `ANTHROPIC_MODEL` (default: `claude-sonnet-4-6`).
5. Optionally set `LEXI_PHASE` (default: `1`). Drives the permissions matrix in [`actions.mjs`](./actions.mjs).

## Run

```powershell
$env:ANTHROPIC_API_KEY="sk-ant-..."
node "C:\dev\ai-terminology\knowledge-graph-agent\run.mjs"
```

## Output files

State surfaces — written by Lexi, read by the public-facing pages:

- **Tier 2 longlist**: [`longlist.json`](./longlist.json) — terms under observation, with sources, source counts, timestamps. Promoted entries are kept here with `status: "promoted"` for audit trail; readers filter them out via `status !== "promoted"`.
- **Tier 3 archive**: [`longlist-retired.json`](./longlist-retired.json) — entries retired from the longlist in review, with `retiredReason` and `retiredAt`. Retiring means *moving* an entry here: because readers treat any status other than `"promoted"` as watching, a `retired` status left in `longlist.json` would keep it on `/observing`. Nothing reads this file at runtime, so Lexi treats a re-sighting as a new candidate.
- **Tier 1 graph overlay**: [`agent-patch.json`](./agent-patch.json) + [`graph-data-agent.js`](</C:/dev/ai-terminology/graph-data-agent.js>) — agent-promoted nodes + definition overrides, layered on top of the curator-edited [`graph-data.js`](</C:/dev/ai-terminology/graph-data.js>) base. 11 nodes + 1 def override as of 2026-05-10.
- **Proposals queue**: [`proposals.json`](./proposals.json) — every `PROPOSE`-gated action lands here pending Nicole's review.
- **Notes for Nicole**: [`notes-for-nicole.json`](./notes-for-nicole.json) — manager channel (spec §6).
- **Lexi's must-reads**: [`must-reads.json`](./must-reads.json) — articles Lexi flags as worth reading in full. Public at [`/lexis-list/`](https://ai-terminology.com/lexis-list/).

Editorial config — Nicole-edited, never agent-mutated:

- **Trusted source list**: [`trusted-sources.json`](./trusted-sources.json) — publications with `source: §7` confidence weighting (see "Trusted source list" below).
- **Contested-terms inoculation list**: [`contested-terms.json`](./contested-terms.json) — terms where the def itself is the political battleground (spec §10). Folded into the extract prompt so Lexi writes contested defs first-pass; also consulted by the post-hoc detector in `notes.mjs`.

Operational state — internal to the agent:

- **Run state** (dedup, review cursor, seenArticles): [`state.json`](./state.json).
- **Latest report** (per-article harvest, rejections, default-deny notes): [`out/latest-report.json`](./out/latest-report.json). **Gitignored** (operational forensics, not source).
- **Deterministic event log**: [`log/events.ndjson`](./log/) — append-only audit trail. **Gitignored**, lives only on the machine where the agent ran.
- **Pre-Lexi rollback snapshot** (the prototype's pre-discipline output, preserved as a comparison test case): [`pre-lexi-rollback/`](./pre-lexi-rollback/).

## Promotion (longlist → graph)

Per the spec's credibility bar, a longlist entry is eligible for promotion when:

1. **Source count ≥ 2 independent sources** (different domain, ideally different author too).
2. **Recency** — at least one sighting within the last 90 days.
3. **Time on longlist ≥ 3 days** (anti-haste; was 14d, lowered after observing real adoption patterns).
4. **Definition consistency** across sources.
5. **Concept reality check** — names a concept not already covered by an existing graph node.

[`promote.mjs`](./promote.mjs) runs the heuristic-checkable parts of this bar (1–3) on every longlist entry and writes a `PROMOTE_TO_GRAPH` proposal for each eligible term to [`proposals.json`](./proposals.json). Sources from `trusted-sources.json` are annotated in the proposal `reason` for confidence-weighting at review time (per spec §7). Definition consistency (4) and concept reality (5) are checked by the automated reviewer (`review-proposals.mjs`: do the sources support the definition, is it a duplicate or alias of an existing node).

**Approving:** use the digest email (Approve link, or reply "approve 2"), or click `[approve]` on `/manager` (preferred — fires `apply-proposals` via workflow_dispatch within ~5 min) OR edit the proposal's `status` to `"approved"` directly (waits up to 24h for the next scheduled cron). **Rejecting:** click `[reject]` on `/manager` (with optional rationale prompt) OR set status to `"rejected"`. Both `apply-proposals.mjs` and `promote.mjs` are idempotent — re-running over already-applied or already-rejected proposals is a clean no-op.

**Demoting (the reverse direction):** [`demote.mjs`](./demote.mjs) creates a `DEMOTE_TO_LONGLIST` proposal for an overlay node; once approved + applied, the node is removed from the overlay and the longlist entry's status flips back to `"watching"` with a `demotedAt` timestamp. Only handles agent-overlay nodes (base-graph nodes need curator action).

Run manually:

```powershell
# Scan for newly-eligible terms (writes proposals to proposals.json)
cd C:\dev\ai-terminology\knowledge-graph-agent
node promote.mjs

# Apply any proposals you've marked status: "approved"
node apply-proposals.mjs
```

Both also run automatically as steps of `.github/workflows/lexi-run.yml`.

**Direct curation (outside the pipeline):** large batches, such as the 2026-10-16 longlist review, can be curated straight into `graph-data.js` instead of going through proposals, since the pending-proposal cap is 10. When you do this, mark the longlist entry `status: "promoted"` with `promotedToGraphNodeId`, `promotedAt` and `promotedVia`. Terms folded into another term become `synonymOf` alias nodes rather than disappearing. Then add a hand-written entry to [`../curators-notes/manual-entries.json`](../curators-notes/manual-entries.json) so the change appears on Curator's Notes (`build-curators-notes.mjs` merges it in).

## Trusted source list

Per spec §7. Lives in [`trusted-sources.json`](./trusted-sources.json) — Nicole-edited; an array of canonical-domain entries with rationale + category + added/review-by dates. The list is a **confidence weight, not a bypass**: the two-source rule still applies; trusted-listing just annotates the proposal `reason` so Nicole sees the credibility texture at review time, and surfaces a "trusted" badge per source row on `/observing`.

Initial seed (12 entries; 7 trusted, plus the 5 contested-cluster terms): `simonwillison.net`, `normaltech.ai`, `aisnakeoil.com`, `stratechery.com`, `hbr.org`, `sloanreview.mit.edu`, `importai.substack.com`. Excluded by design: lab sources (openai/anthropic/google/deepmind) — per spec §7 they are "primary signal but cannot meet the credibility bar alone." Quarterly review loop (Lexi proposes additions/removals via Notes for Nicole) is not yet wired.

## Contested-cluster inoculation list

Per spec §10 + §19's "to resolve before Phase 2 launches" open question. Lives in [`contested-terms.json`](./contested-terms.json) — Nicole-edited; an array of `{ label, aliases, camps, contestation }` entries for terms where the def itself is the political battleground.

Two consumers, single source of truth:

1. [`claude-calls.mjs`](./claude-calls.mjs) `buildExtractContext` folds the list into the cached extract-prompt prefix. The system prompt instructs Claude to write contested-style defs (name camps + contestation, don't pick a side) for any candidate matching a label or alias.
2. [`notes.mjs`](./notes.mjs) `detectContestedOmission` is the post-hoc detector — fires a `contested_cluster_omission` Note for Nicole if a contested-list match lands without a contestation marker in its def. Belt-and-braces against the inoculation prompt failing to land.

Initial seed (12 terms): `alignment`, `agentic`, `open-weights`, `AGI`, `superintelligence`, `AI safety`, `AI ethics`, `responsible AI`, `frontier model`, `existential risk`, `prompt engineering`, `AI welfare`. Aliases curated using a two-test heuristic: would someone search the variant specifically, AND would someone feel something is missing if it weren't here.

## Triage CLI for Notes for Nicole

[`triage.mjs`](./triage.mjs) — bulk operations on the notes channel. The `/manager` dashboard's mark-read buttons handle the per-note happy path (see "Manager dashboard" above); triage remains useful for bulk dispositioning (e.g., dismiss all throughput-cap-hit notes after raising the cap) and for batch operations from the CLI when the dashboard is overkill.

```powershell
# Just see what's pending
node triage.mjs --list

# Bulk-mark every unread note → read (use when you've eyeballed everything via dashboard)
node triage.mjs --all-read

# Bulk-update by type (e.g., dismiss all the throughput-cap-hit notes after raising the cap)
node triage.mjs --type throughput_cap_hit --to dismissed

# Interactive walk-through, one note at a time
node triage.mjs
```

Status changes are local-only — commit + push after, or just wait for the next cron tick to bundle them into its auto-commit.

## Notes

- `html_index` sources are useful for official newsroom pages that do not expose a public RSS feed. They work by following article links that match configured URL patterns.
- Each per-article extract call sends an identical Tier-1 + Tier-2 prefix marked with `cache_control: { type: "ephemeral" }`, so Claude can serve it from the prompt cache after the first request in a run.
- Newly created longlist entries within the same run are not visible to *later* extract calls in that run (the cached prefix is a snapshot); cross-article re-sightings still get caught by `classifyCandidate` against the live longlist and are recorded as additional sources on the existing entry.
- The Claude calls use the Messages API with `output_config.format` (json_schema) for structured JSON output:
  - [Anthropic SDK for TypeScript/JavaScript](https://github.com/anthropics/anthropic-sdk-typescript)
  - [Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
  - [Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
