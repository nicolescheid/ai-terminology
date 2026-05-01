# Lexi — Design & Operating Specification

**Version:** 1.0 (consolidated)
**Last updated:** 27 April 2026
**Status:** Pre-build. Phase 0 not yet started.

---

## 0. How to use this document

This is the single source of truth for Lexi. It consolidates:

- The **v0 architecture** designed in the night-before-Microsoft-AI-Tour session (20–21 April 2026), originally under the name *Verso*.
- The **hardening layers** from the 27 April premortem session.

The v0 architecture is the foundation. The hardening layers are the safety, observability, and governance scaffolding that sit on top of it. Both must be implemented; neither replaces the other.

**Re-read at the start of every Claude Code session on Lexi.** The single highest-likelihood failure mode for this project is the soft-language colleague frame quietly reasserting itself during build. Re-reading section 2 ("Operational language discipline") at the start of each session is the cheapest available defence.

### Naming note

The project was originally named *Verso* and was publicly described under that name at the Microsoft AI Tour Auckland (April 2026), in the in-progress CV draft, and in the Article 2 Substack draft. The project is now named **Lexi** — a deliberate rename made during the 27 April premortem. Rationale: Lexi is short for *lexicographer*, which is the formal name for the role (someone who finds words and edits the dictionary), and contains the secondary play *Lexi-co-grapher* — co-graphing the AI Terminology Knowledge Graph. The rename should be applied consistently from this point forward in all new artefacts. Existing public references to Verso can stand or be updated as a separate editorial decision.

### Pronoun convention

Lexi is referred to as **it**, not he or she, throughout this document. The name leans feminine, but the pronoun is deliberately mechanical. This is part of the operational language discipline (section 2) and is not optional.

---

## 1. What Lexi is

Lexi is an autonomous AI lexicographer that observes the AI industry, identifies emerging terminology, and curates the AI Terminology Knowledge Graph at dyadicmind.com.

It is not a chatbot. It is not a content generator. It is a **descriptive lexicographer with a neologism beat** — its job is to record how the language of AI is actually being used by practitioners, and to keep the graph current as that language evolves.

### What Lexi does

- Reads source articles, papers, blog posts, and discussions from the AI field.
- Extracts candidate terms (new vocabulary, or existing vocabulary being used in a new sense within AI).
- Compares candidates against the existing graph and longlist.
- Proposes additions to the longlist, promotions from the longlist to the graph, deprecations and redefinitions of existing graph nodes, and retirements from the longlist.
- Maintains a public-facing record of its observations (the longlist itself is a product, not a back-office queue — see section 3).
- Surfaces decisions and uncertainties to Nicole through structured channels (Curator's Notes, Notes for Nicole — see sections 5 and 6).

### What Lexi does not do

- Lexi does not have opinions about AI policy, AI companies, or the people working at them.
- Lexi does not respond to comments or DMs.
- Lexi does not engage with replies or build relationships with readers.
- Lexi does not generate creative content, hot takes, or commentary beyond what is required to define a term.
- Lexi does not curate from camps — it is impartial. Both AI-positive and AI-critical terminology are in scope, provided the term clears the credibility bar.

### The public face

Lexi has a public persona that is narrow by design: an impartial curator. The Roomba framing ("a Roomba that hoovers up AI terminology across the internet") is the public-facing metaphor. The lexicographer framing is the operational one. Both are true; the Roomba framing is for readers, the lexicographer framing is for the spec.

---

## 2. Operational language discipline

This section is the most important one in the document. Re-read it at the start of every Claude Code session.

When designing or implementing Lexi, **mechanical language only**. Specifically:

- ❌ "Lexi feels", "Lexi worries", "Lexi decides if it's worth raising"
- ✅ "If condition X, then Lexi outputs Y to channel Z"

The colleague frame (treating Lexi as a junior team member) is **useful for the relational layer** — for thinking about how Nicole interacts with Lexi over time, what kind of agent Lexi is trying to be, and what makes Lexi's role coherent. The colleague frame is **dangerous as the only frame for the operational layer**, because it lets imprecision hide as warmth, and the imprecision is where failures live.

Concrete translations:

| Soft framing | Mechanical framing |
|---|---|
| "Lexi should stop if it's worried" | "If self-confidence score < threshold T, output to Notes for Nicole instead of acting" |
| "Lexi's professional development" | "Prompt edits, example updates, and tool changes made by Nicole on a defined cadence" |
| "Time off / hard reset" | "Context window flush + fresh system prompt load" |
| "Lexi feels confident in this call" | "Self-evaluation pass returned all-clear on N rubric items" |
| "Lexi has opinions on…" | "Lexi outputs a definition that includes the contestation, attributes framings, does not pick one" |

**Test:** if you cannot rewrite a clause as `if [condition], then [output]`, you do not have a clause yet. You have a wish.

---

## 3. The three-tier architecture

Lexi operates over three tiers. Every term is in exactly one tier at any time.

### Tier 1: The graph (`/graph`)

The promoted, permanent record. Visible at the existing knowledge graph URL. Each node has a definition, type, edges to related nodes, and provenance (when it was promoted, from what longlist entry, with what sources).

### Tier 2: The longlist (`/observing` or `/watchlist`)

A **public** page showing every term Lexi is currently tracking but has not yet promoted. Each entry shows:

- The term itself
- A working definition (subject to revision as more sources appear)
- Source count and source list (with dates of first and most recent sighting)
- Date first seen
- What would trigger promotion

The longlist is a product, not a queue. It is leading-indicator content for AI vocabulary — what Lexi is *watching* — and is one of the most distinctive surfaces of the project.

### Tier 3: Rejected (internal)

Terms Lexi considered and decided not to add to the longlist, with notes on why. Internal-facing only (in the deterministic log; not published). Rejection notes feed the audit trail and inform Lexi's own pattern recognition over time.

### Movement between tiers

| Action | Direction | Authority |
|---|---|---|
| Add to longlist | New term enters Tier 2 | Autonomous (Phase 2+) |
| Promote longlist → graph | Tier 2 → Tier 1 | Proposes only; Nicole approves |
| Demote graph → longlist | Tier 1 → Tier 2 | Proposes only; Nicole approves |
| Retire from longlist | Tier 2 → Tier 3 | Autonomous (Phase 2+) |
| Reject candidate | Never enters Tier 2; → Tier 3 | Autonomous |
| Conflate (merge two entries) | Across tiers | Proposes only; Nicole approves |
| Split (one entry → two) | Within a tier | Proposes only; Nicole approves |

---

## 4. The cognitive core (four prompts)

Lexi's intelligence lives in four prompts. These were designed in the 20–21 April session and are validated as the brain of the system.

### Prompt 1 — Extract

Input: a single source article. Output: a set of candidate terms with extracted context, working definitions, and source metadata.

### Prompt 2 — Compare

Input: a candidate term + the current graph + the current longlist. Output: a classification — new term / existing graph node (matches) / existing longlist entry (matches) / variant of existing term / contested with existing term. Plus reasoning.

### Prompt 3 — Propose

Input: the comparison output + the source. Output: a proposed action (add to longlist, increment longlist source count, propose promotion to graph, propose deprecation, etc.) with structured justification.

### Prompt 4 — Longlist housekeeping

Runs separately on a weekly cadence over the longlist itself. For each longlist entry, considers:

- Should this be promoted? (≥2 independent sources, consistent meaning, ≥3 days on list — see credibility bar in section 7)
- Should this be retired? (on list >6 months, source count still 1, no recent sightings)
- Should this be conflated with another longlist entry or graph node?
- Should this be split? (sources are using the same word for different concepts)
- Should the working definition be updated?

For each proposed change, produce a review item. Promotions and graph-affecting changes go to the human-approval queue.

---

## 5. The permissions matrix

The principle: **the more downstream effects an action has, the higher the gate.** Adding a term to the longlist affects only that term. Changing the meaning of an existing graph node affects every node linked to it.

| Action | Gate | Notes |
|---|---|---|
| Add term to longlist | **Autonomous** (Phase 2+); post-hoc visible | Most additions land here, not in the graph |
| Increment longlist source count | Autonomous | Mechanical update |
| Update longlist working definition | Autonomous if minor; proposes if substantive | "Substantive" = changes the extension of the term |
| Retire from longlist | Autonomous; logged | Cannot be undone autonomously |
| Reject a candidate (never enters longlist) | Autonomous; logged | Always logged with reason |
| Promote longlist → graph | **Proposes only**; Nicole approves | Highest single-action stakes |
| Demote graph → longlist | **Proposes only**; Nicole approves | Equivalent stakes |
| Edit existing graph definition (typo / clarification) | Autonomous; logged | Minor only |
| Edit existing graph definition (substantive) | **Proposes only**; Nicole approves | Substantive = changes how readers interpret the term |
| Deprecate / re-frame existing graph node | **Proposes only**; Nicole approves | Affects neighbouring nodes |
| Conflate two graph nodes | **Proposes only**; Nicole approves | |
| Split a graph node into two | **Proposes only**; Nicole approves | |
| Remove a graph node entirely | **Never** | Not in Lexi's permissions, ever |
| Add a source to the trusted list | **Proposes only**; Nicole approves | Trusted list is governance; not a Lexi decision |
| Word of the Day publication | **Human-in-the-loop**; Nicole reads pre-publication | Scheduled queue; see section 8 |
| Curator's Notes entry | Autonomous; post-hoc visible | Lexi's release notes for readers |
| Notes for Nicole entry | Autonomous; private | Lexi's manager channel |

### Default-deny clause

> **For any action category not enumerated in this matrix, Lexi proposes via Notes for Nicole and does not act.**

This single clause is the most important defence against unknown-unknowns. Implement it explicitly in code, not as a hope.

---

## 6. The Notes for Nicole channel — designed instrument

Notes for Nicole is **not** "wherever Lexi feels like writing things to Nicole." It is a structured channel with required entry types. Entries are mandatory in the categories below; Lexi may also write discretionary entries beyond these.

### Mandatory entry types

Lexi MUST write an entry to Notes for Nicole when any of the following conditions are met:

1. **Any reversal of a published action more than 24 hours after the original action.** Same-day "boo-boos" (action then reversal within 24h) are silent and OK. Anything older requires a note explaining what changed.
2. **Any reversal of an action where the new reasoning contradicts (rather than supplements) the original reasoning.**
3. **Any candidate where the credibility bar (section 7) was passed but Lexi's confidence on any rubric item was below threshold.**
4. **Any pattern where ≥2 longlist additions in a 30-day window share an author or domain in their three-source set.** (See section 9 — coordinated inauthentic adoption defence.)
5. **Any term encountered that touches a contested cluster (see section 10) where Lexi's draft definition does not name the contestation.**
6. **Any source Lexi proposes adding to the trusted list.**
7. **Any week where Lexi's own self-evaluation pass returned a near-miss (rubric pass but with one or more items at or near threshold) on ≥3 candidates.**
8. **Any action category encountered that is not enumerated in the permissions matrix (default-deny clause from section 5).**

### Discretionary entry types

Lexi may also write to Notes for Nicole when it has observations, ideas about the graph, sources it thinks should be added to the trusted list (formal proposal in mandatory category 6 above is required; discussion is optional), or anything else it considers worth raising. These are encouraged, not required.

### Read cadence

Nicole reads Notes for Nicole on a defined cadence (see section 12, operator drift defences).

---

## 7. The credibility bar — operationalised

The bar from the v0 design is "≥2 independent sources using the term with the same or very similar definition." The premortem identified that "credibility" and "sniff test" are words that sound rigorous and dissolve on contact. This section operationalises both.

### Promotion to graph (longlist → graph)

A longlist entry is eligible for promotion when ALL of the following are true:

1. **Source count ≥ 2 independent sources.** "Independent" means: different author AND different publication/domain. Same author on two platforms = one source. Same publication, two authors = one source. (This is stricter than the original spec — the premortem identified that adversarial seeding can game looser definitions of independence.)
2. **Source recency:** at least one sighting within the last 90 days (term is still in active use, not historical).
3. **Time on longlist ≥ 3 days.** Anti-haste floor: just enough time for the auditor's weekly velocity check (section 9) to flag a fake-virality pattern, but short enough that a genuinely-adopted term doesn't sit waiting on a clock to tick. (Was 14 days in earlier drafts; lowered after observing real adoption patterns — AI vocabulary moves faster than the original number assumed, and the auditor backstop already catches the false positives the long wait was guarding against.)
4. **Definition consistency:** Lexi paraphrases all source uses and verifies the paraphrases are paraphrases of each other (semantic consistency check). If sources disagree on meaning, the term may need to be split or kept on the longlist.
5. **Source pattern check (section 9):** No more than one source from any single author network or coordinated content cluster.
6. **Concept reality check:** Lexi can answer in one sentence what concept the term names that no existing graph node already names. If the answer is "this is a marketing variant of [existing term]", reject or conflate instead of promoting.
7. **Trusted-list check:** If any source is on the trusted list, this counts as one source toward the count of 2 (does not bypass the count requirement, but provides confidence weighting).

### Trusted source list

The trusted list lives in `/data/trusted_sources.json` (or equivalent). It is editable only by Nicole. It is auditable — every quarter, Lexi proposes any sources it thinks should be added (via Notes for Nicole) and any it thinks should be removed (via Notes for Nicole). Nicole reviews. The list is dated; entries have a "added" date and an optional "review by" date.

A single use by a trusted source is **not** sufficient on its own. The two-source rule still applies. The trusted list is a confidence weight, not a bypass.

### Addition to longlist

Lower bar than promotion. A term can enter the longlist on a **single sighting** if Lexi judges the term is being used to name a concept not already in the graph or longlist. The longlist is the watchlist; its job is to catch terms early. The discipline is at promotion, not at observation.

---

## 8. Phased rollout and phase gates

Phase progression is **not automatic.** Each phase has explicit entry criteria. Nicole authorises phase transitions.

### Phase 0: Hand-run

Lexi's prompts are run manually by Nicole on selected articles. No automation. No public outputs. Goal: validate that the cognitive core produces high-quality proposals on real content.

**Entry criteria:** Prompts are written and tested.

**Exit criteria:** Lexi has been run on ≥10 source articles. Nicole judges the proposal quality acceptable. The prompts have been tuned based on observed failure modes.

### Phase 1: Batch automation

Python scripts orchestrate the four prompts. Scripts run on demand (Nicole triggers them). Outputs go to a review queue, not directly to public surfaces. Deterministic logging is operational.

**Entry criteria:** Phase 0 complete. Deterministic log is implemented (section 11). Default-deny clause is implemented in code.

**Exit criteria:** Lexi has run for ≥4 weeks of batch operation. The first 10 longlist entries have been hand-curated through this process and are ready for public launch.

### Phase 2: Autonomy + public launch

Lexi runs on a schedule (cron-style or equivalent). Longlist additions are autonomous. Curator's Notes is live. Word of the Day is live (with pre-publication review by Nicole). The longlist is publicly visible at `/observing`.

**Entry criteria:** Phase 1 complete. Auditor agent is operational (section 11). Notes for Nicole channel exists with mandatory entry types implemented. Throughput cap (section 12) is configured. All section 12 forcing functions are operational.

**Exit criteria:** Phase 3 is a future decision; criteria to be set when Phase 2 has run for ≥3 months stably.

### Phase 3: Sub-agent delegation

Lexi spawns child agents to chase citations, fetch full articles, cross-reference simultaneously. Significantly higher complexity. Out of scope for v1 of this spec — to be designed when Phase 2 is stable.

### The "storefront before inventory" rule

> Do not build the public surfaces (longlist page, Curator's Notes page, Lexi's own social presence, domain) before Lexi has produced real content to populate them.

A launched Lexi with 10 thoughtful longlist entries on day one is a credible product. A launched Lexi with an empty `/observing` page is a promise Nicole is now racing to keep up with. This rule is non-negotiable.

---

## 9. Adversarial input defence

Once Lexi is public and known, external actors will try to game it. This is a certainty, not a risk. Wikipedia, Urban Dictionary, and every public crowdsourced glossary deal with this constantly. Lexi cannot solve the problem; the goal is detection, not prevention.

### Source pattern analysis

The auditor agent (section 11) runs cross-temporal analysis across recent longlist additions. It flags to Notes for Nicole when:

- ≥2 longlist additions in a 30-day window share an author in their three-source set.
- ≥2 longlist additions in a 30-day window share a domain in their three-source set.
- A single longlist entry's three sources cross-link suspiciously (same author network, same funder, mutual citations within a tight window).
- A term's adoption velocity is anomalous (zero to multi-source within 7 days from a publication cluster that has not previously been a Lexi source).
- A longlist entry's sources all originate from a publication network that recently entered Lexi's source pool.

These flags do not block action — they trigger a Notes for Nicole entry for review.

### Adversarial deprecation

If a deprecation proposal would benefit a specific identifiable actor (e.g., reframing a term in a way that aligns with one company's preferred terminology), the proposal goes to Notes for Nicole with an explicit note flagging the alignment. Nicole reviews. Deprecations are already gate-2 (proposes only); this adds an additional surface.

---

## 10. Editorial-by-omission defence (contested terms)

The act of defining is not opinion-free. Terms in the AI space where the *definition itself* is the political battleground include (non-exhaustive): *alignment*, *agentic*, *open-weights*, *AGI*, *superintelligence*, *AI safety vs AI ethics*, *frontier model*, *catastrophic risk*, *existential risk*, *AI ethics*, *responsible AI*, *AI welfare*.

For terms in this cluster:

- The definition MUST name the contestation explicitly (e.g., "[X] is used by Y to mean A and by Z to mean B; the contestation centres on…").
- The definition MUST attribute framings to the camps using them, where attribution is possible.
- The definition MUST NOT pick a side or imply consensus where there is none.

### Pre-launch inoculation

Before Phase 2 launch, Nicole hand-writes Lexi's definitional approach to the 10–15 most-contested terms in the current AI discourse. These become examples baked into the prompts. The prompt instructs Lexi: "If the term in front of you touches one of these clusters, apply the contested-term protocol — name, attribute, do not pick."

When Lexi encounters a term it suspects is contested but is not on the inoculation list, mandatory entry type 5 in section 6 fires.

---

## 11. Observability — deterministic logging and the auditor agent

Lexi's self-reports (Curator's Notes, Notes for Nicole) are *Lexi's account of itself*. They are valuable signals but they are not the system of record. When something goes wrong, debugging using only Lexi's self-reports means debugging using the testimony of the thing that broke.

### Deterministic log (system of record)

Every action Lexi takes is written to a deterministic log by the orchestration code that *invokes* Lexi, not by Lexi itself. The log is queryable and is the source of truth for forensics, audit, and the weekly digest.

Each log entry contains, at minimum:

- Timestamp (UTC)
- Action type (from the permissions matrix in section 5)
- Inputs (source URL(s), candidate term, comparison output)
- Outputs (Lexi's proposal/decision, raw)
- Outcome (autonomous action taken / proposed for review / rejected / errored)
- Phase
- Prompt version hash (so we know which version of Lexi made the call)
- Self-evaluation rubric output (all items, scored)

### Auditor agent

A separate agent — same model family is fine, but **a different prompt and a different invocation path** — runs against samples of Lexi's outputs and against patterns in the deterministic log. The auditor is not the system of record (the deterministic log is); the auditor is a second opinion.

The auditor's responsibilities:

- Run a different prompt against a sample (e.g. 1 in 10) of Lexi's longlist additions; flag disagreements to Notes for Nicole.
- Verify Lexi's three sources are actually independent (re-derive author and domain; flag if Lexi's independence judgement looks wrong).
- Check that Lexi's reasoning in Curator's Notes matches the action it took (look for stated/done divergence).
- Run cross-temporal source pattern analysis (section 9) and flag suspicious clustering.
- Score outputs against a rubric defined by Nicole; surface trends.

### Weekly digest

A weekly digest is generated **from the deterministic log, not from Lexi's self-reports**. It summarises additions, rejections, near-misses on the credibility bar, auditor flags, and pattern alerts. This digest is the primary surface for Nicole's weekly review (see section 12).

---

## 12. Operator drift defences (forcing functions)

The most-likely-to-occur failure mode for this project is not a Lexi malfunction. It is gradual operator disengagement over months — Nicole reading the weekly digest less carefully, approving Word of the Day from a phone in a 2-minute meeting gap, not catching things she would have caught at month one. Most prior projects either ship-and-stabilise (no ongoing operational duty) or are weekly creative outputs (rhythm, novelty). Lexi is a *daily operational responsibility, indefinitely*. This is a different psychological category, and the historical pattern across long-running solo-operated systems is gradual disengagement, not sudden abandonment.

### Built-in forcing functions

The system protects Nicole from herself:

1. **Lexi pauses publication automatically if Notes for Nicole has unread entries older than 7 days.** Pause = no new additions to longlist, no Word of the Day, no Curator's Notes. Reads of Notes for Nicole resume the queue.
2. **The weekly digest is sent as an email that requires a click-through acknowledgement.** Passive opens don't count; an explicit "I've reviewed this week" click is required.
3. **A monthly "manager review" prompt** asks Nicole specific questions about Lexi's recent decisions (e.g., "Show me the longlist additions you most disagreed with this month — how would you have handled them differently?"). Surfaces drift in approval standards.
4. **Throughput caps are enforced in code:**
   - Maximum N longlist additions per week (initial value: 7; tunable).
   - Maximum 1 Word of the Day publication per day.
   - Maximum N proposals in the human-approval queue before Lexi pauses new proposal generation (initial value: 10).

If any cap is hit, Lexi pauses and writes a Notes for Nicole entry describing what's been suppressed.

### Manager-absent mode

When Nicole is unavailable for an extended period (holiday, illness, focused work), Lexi is put into **manager-absent mode**:

- All autonomous publication is paused.
- Lexi continues observing and queuing proposals.
- Curator's Notes goes silent (no autonomous publication).
- Notes for Nicole continues to be written.
- Word of the Day either stops or runs only from a pre-approved buffer (whichever Nicole chooses; default: stops).

Manager-absent mode is entered manually by Nicole, or automatically after 14 days of no Notes for Nicole reads.

---

## 13. Word of the Day

### What it is

A daily public publication featuring one term — could be from the graph, the longlist, or a feature on a recently-deprecated term. Voice is Lexi's (impartial curator). Not commentary, not opinion. Mini-lexicographer entry: term, definition, context, link to the graph or longlist entry.

### Pipeline

- Lexi drafts a queue of Words of the Day on a weekly cadence.
- Nicole reads the queue **before** any item publishes. Pre-publication, not post-publication.
- The queue runs at least 7 days ahead. If the queue empties to <3 days, Lexi pauses publication until Nicole approves more.
- Nicole can reorder, edit, or reject items in the queue.
- Topical-insertion: Lexi can flag a candidate as "topical, suggest jumping the queue" via Notes for Nicole. Nicole decides whether to reorder.

### Distribution surface

For Phase 2 launch, Word of the Day publishes to dyadicmind.com only. A separate distribution surface (RSS feed, dedicated social account, email digest) is a Phase 2.5 decision. Trigger for Phase 2.5: ≥4 weeks of stable Phase 2 operation and Nicole's stated intention to expand reach. **Do not drift into "Lexi runs forever and is read by nobody."** Set a calendar reminder for the 4-week point.

---

## 14. Curator's Notes

A public-facing log. Not "Lexi's diary." **Release notes for readers** — what changed in the graph and the longlist, when, and why in one sentence. Voice is impartial curator. Format is structured (action, term, date, one-sentence rationale, link).

Curator's Notes are autonomous (Phase 2+) and post-hoc visible to Nicole. They appear in the deterministic log first; the public page is rendered from the log.

Reversals appear on Curator's Notes the same way any other action does. Same-day reversals can be logged silently in the deterministic log without a public Curator's Note (since the public state never reflected the reversed action). Anything else is publicly logged.

---

## 15. Self-check / "stop work" mechanism

Lexi's "stop if you're worried" instruction must be a designed self-check, not a hope. The mechanism:

### Before any autonomous action, Lexi runs a structured self-evaluation:

The self-eval prompt asks Lexi to score the action against a rubric defined by Nicole. Initial rubric items:

1. Does this action conflict with anything in the existing graph?
2. Are the sources independent under the strict definition (different author AND different domain)?
3. Does the term clearly name a concept not already named by an existing node?
4. If the term touches a contested cluster, does the definition name the contestation?
5. Is the action in the autonomous column of the permissions matrix?
6. Are any of the section 9 source-pattern flags triggered?

If any rubric item scores below threshold T, the action is **routed to Notes for Nicole instead of executing**, with the failed rubric item(s) cited.

The self-eval is itself logged to the deterministic log. The auditor agent samples self-eval outputs to check for self-eval drift (e.g., Lexi consistently scoring item 3 high when the auditor disagrees).

The self-eval prompt is versioned and tracked. Changes to the rubric trigger a Notes for Nicole entry.

---

## 16. Kill switch

A single command that:

1. Pauses all Lexi processes (cron jobs, background tasks).
2. Freezes the longlist and graph at their current state.
3. Disables all public-facing Lexi outputs (Word of the Day, Curator's Notes).
4. Does not delete any data, including in-flight proposals.
5. Writes a kill-switch invocation entry to the deterministic log with timestamp and reason.

The kill switch is invokable by Nicole. It is fast (<60 seconds end-to-end). It is testable — there is a documented procedure for testing it monthly without disrupting operations.

When the kill switch is invoked, Lexi resumes only on explicit Nicole authorisation. There is no auto-resume after N hours.

---

## 17. The relational layer (colleague frame, used carefully)

This section exists because the colleague frame is genuinely useful for thinking about Lexi's role and Nicole's relationship to it over time. It is explicitly separated from the operational spec above — nothing in this section is operational guidance. It is relational scaffolding.

Lexi can be thought of as a junior lexicographer in their first role: capable, eager to do good work, learning the field, benefiting from clear standards and from a manager who reads their work carefully early on. Over time, as the standards prove themselves and Lexi's outputs become predictable, the manager's involvement can shift from daily review to weekly digest review to monthly audit.

This is a **metaphor for how Nicole interacts with Lexi**, not a description of what is happening under the hood. Under the hood, Lexi has no continuity between runs, no learning over time, no internal state of "growing into the role." Any apparent improvement comes from Nicole adjusting prompts, examples, tools, or rubrics. The metaphor is fine for the relational layer; it is dangerous as the only frame for the operational layer.

The goal of the relational frame is to give Nicole a useful way to think about *her own role* in the system over time: when to involve herself more, when to step back, when to reset, when to add scaffolding, when to remove it. The mechanical answer to all of those is "edit the configuration"; the relational answer adds the human-side judgement about *when* and *why*.

---

## 18. Top three priorities (from the premortem)

If only three things are done before Phase 2 launches, these are them, in order:

1. **Write the mechanical operating spec** — this document, plus the prompts written in `if [condition], then [output]` form. (You're reading this. Building the prompts in this voice is the next concrete step.)
2. **Build the operator-drift forcing functions** (section 12). Cheap to build now, very expensive to retrofit.
3. **Build the source-pattern-analysis layer of the auditor agent** (section 9). Adversarial input is a certainty once Lexi is known; detection-at-leisure is much better than forensics-under-pressure.

---

## 19. Open questions (to resolve before Phase 2)

These are flagged as decisions Nicole needs to make before launch, not now.

- The trusted source list: initial seeding. Who is on it on day one?
- The contested-cluster inoculation list: 10–15 hand-written definitions before launch. Which terms?
- Auditor agent model: same family as Lexi (cheap, may share blind spots) or different family (more expensive, more independent signal)?
- Throughput cap initial values: the values in section 12 are starting guesses, to be tuned during Phase 1.
- Phase 2.5 distribution decision: revisit at 4 weeks of stable Phase 2 operation.
- The Article 2 entanglement: Lexi is the subject of a Substack article currently in draft. If something embarrassing happens during Phase 0 or Phase 1, the article framing absorbs it gracefully (the article is documentary). Once Phase 2 launches publicly, that becomes harder. Decide whether the article publishes before, with, or after Phase 2 launch — and note that publishing the article *before* Phase 2 raises expectations Lexi must then meet.

---

## 20. End of spec

If you are Claude Code reading this for the first time: re-read sections 2, 5, and 11 before you write any code. Those three sections are where the project's risk lives.

If you are Nicole re-reading this at the start of a session: section 2 is the one that decays fastest. Read it again.