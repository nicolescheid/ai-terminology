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
  "You curate an AI terminology graph (Tier 1: canonical, promoted) and a longlist (Tier 2: terms under observation while evidence accumulates).",
  "",
  "For each article, identify terms worth tracking. Two kinds of candidate are valid:",
  "1. NEW terms — not in the graph and not on the longlist. These will be added to the longlist.",
  "2. RE-SIGHTINGS of longlist terms — if the article materially uses a term already on the longlist, propose it again under the same id and label as the longlist entry. The harness will record this article as an additional source on the existing entry, helping it accumulate evidence for promotion.",
  "",
  "Do NOT propose terms already in the graph (Tier 1) — they are already canonical.",
  "",
  "Prefer concepts, named systems, product categories, and framing terms with lasting relevance. Avoid generic vocabulary, marketing slogans, and unit names.",
  "",
  "Return JSON only."
].join("\n");

export const REVIEW_SYSTEM_PROMPT = "You review AI knowledge graph definitions against fresh source material. Only recommend a rewritten definition when the sources clearly justify it. If the sources do not materially update a term, mark it keep or insufficient_evidence. Return JSON only.";

// Stable hashes recorded in every log entry the corresponding prompt
// produced. Update either prompt above and the version automatically rolls
// forward (prompt_version is sha1(prompt).slice(0,8) prefixed by label).
export const EXTRACT_PROMPT_VERSION = promptVersion("extract", EXTRACT_SYSTEM_PROMPT);
export const REVIEW_PROMPT_VERSION = promptVersion("review", REVIEW_SYSTEM_PROMPT);
