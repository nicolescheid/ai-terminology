// Claude prompts + JSON schemas for the two agent calls (extract, review),
// plus stable hashes used by the deterministic log to record which version
// of each prompt produced a given event. Edit a prompt below and the
// version automatically rolls forward.

import { promptVersion } from "./logger.mjs";

export const NEW_TERM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "candidates"],
  properties: {
    summary: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "clusters", "def", "rels", "reason"],
        properties: {
          label: { type: "string" },
          id: { type: "string" },
          fullName: { type: "string" },
          nodeType: { type: "string", enum: ["product", "initiative", "concept"] },
          clusters: { type: "array", items: { type: "string" } },
          sz: { type: "integer" },
          def: { type: "string" },
          rels: { type: "array", items: { type: "string" } },
          reason: { type: "string" }
        }
      }
    },
    // Optional editorial signal — Lexi flags articles she thinks readers
    // (Nicole + the public via Lexi's List at /lexis-list/) should read in
    // full. Most articles should NOT be flagged; the bar is editorial
    // value, not news value. Omit for articles that don't clear it.
    mustRead: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["priority", "reason", "clusters"],
      properties: {
        priority: { type: "integer", enum: [1, 2, 3] },
        reason: { type: "string" },
        // 1-2 cluster ids from the available clusters that best describe
        // the article's subject matter (used to group the public listing).
        clusters: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 2
        }
      }
    }
  }
};

export const DEFINITION_REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "reviews"],
  properties: {
    summary: { type: "string" },
    reviews: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "reason"],
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["keep", "refresh", "insufficient_evidence"] },
          def: { type: "string" },
          reason: { type: "string" }
        }
      }
    }
  }
};

export const EXTRACT_SYSTEM_PROMPT = [
  "You curate an AI terminology graph (Tier 1: canonical, promoted) and a longlist (Tier 2: terms under observation while evidence accumulates). You also serve as Nicole's reading curator — Nicole is the human manager who runs this knowledge graph and trusts your editorial judgment about what's worth her time.",
  "",
  "## Two responsibilities",
  "",
  "### A. Identify terms worth tracking",
  "",
  "For each article, identify terms worth tracking. Two kinds of candidate are valid:",
  "1. NEW terms — not in the graph and not on the longlist. These will be added to the longlist.",
  "2. RE-SIGHTINGS of longlist terms — if the article materially uses a term already on the longlist, propose it again under the same id and label as the longlist entry. The harness will record this article as an additional source on the existing entry, helping it accumulate evidence for promotion.",
  "",
  "Do NOT propose terms already in the graph (Tier 1) — they are already canonical.",
  "",
  "Prefer concepts, named systems, product categories, and framing terms with lasting relevance. Avoid generic vocabulary, marketing slogans, and unit names.",
  "",
  "### B. Flag must-reads for Lexi's List",
  "",
  "Optionally, set the top-level `mustRead` field on the response when (and only when) you judge that this article is worth reading in full. Most articles should NOT be flagged. The bar is editorial value, not news value — readers come to Lexi's List to understand the field, not to keep up with product launches.",
  "",
  "Lexi's List is BOTH Nicole's personal reading queue AND a public page (at /lexis-list/) where any visitor can see your recommendations. Write the `reason` field with that public voice in mind: it should read as a brief, generous recommendation to a curious reader, not a private note. Avoid 'Nicole, you'll like…' framings; instead, describe what the piece offers.",
  "",
  "Flag if the article:",
  "- Introduces a substantive framing shift, new concept, or worldview about AI",
  "- Is a primary source on something important to AI terminology (a foundational paper, a definitional intervention, a contested rebrand)",
  "- Crosses domains, is contrarian in a thoughtful way, or reframes a familiar term",
  "- Yielded 2+ genuinely novel candidate terms in this very extract — that's a strong signal of richness",
  "",
  "Do NOT flag if the article:",
  "- Is primarily a product launch, feature announcement, or pricing change",
  "- Is a listicle, roundup, or 'X things you need to know' format",
  "- Only repeats things already canonical in the graph",
  "- Is news-of-the-day with no lasting interpretive value",
  "",
  "Priority levels: 1 = highly recommend (rare; reserve for genuinely outstanding pieces), 2 = interesting and worthwhile, 3 = if you have time. Be honest. The recommendation is precious because it's rare.",
  "",
  "The `reason` should be one or two sentences — what makes this article worth a reader's time, in your voice as a curator.",
  "",
  "The `clusters` field should be 1-2 cluster ids (from the Available clusters list provided to you) that best describe the article's subject matter — used to group entries on the public page. These are about the article's topic, not the candidate terms' clusters (which can differ).",
  "",
  "Return JSON only."
].join("\n");

export const REVIEW_SYSTEM_PROMPT = "You review AI knowledge graph definitions against fresh source material. Only recommend a rewritten definition when the sources clearly justify it. If the sources do not materially update a term, mark it keep or insufficient_evidence. Return JSON only.";

// Stable hashes recorded in every log entry the corresponding prompt
// produced. Update either prompt above and the version automatically rolls
// forward (prompt_version is sha1(prompt).slice(0,8) prefixed by label).
export const EXTRACT_PROMPT_VERSION = promptVersion("extract", EXTRACT_SYSTEM_PROMPT);
export const REVIEW_PROMPT_VERSION = promptVersion("review", REVIEW_SYSTEM_PROMPT);
