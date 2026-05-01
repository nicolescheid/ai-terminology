// The two Claude API calls the agent makes per run: extract (per article)
// and review (one batched call over a rotating slice of graph nodes).
// All calls go through callStructuredOutput, which expects json_schema-format
// responses and parses the first text block.

import {
  DEFINITION_REVIEW_SCHEMA,
  EXTRACT_SYSTEM_PROMPT,
  NEW_TERM_SCHEMA,
  REVIEW_SYSTEM_PROMPT
} from "./prompts.mjs";

/**
 * Build the byte-stable prefix that goes on every per-article extract call.
 * Marked with cache_control: ephemeral by the caller — Claude serves it
 * from the prompt cache after the first request in a run (≥2048 tokens
 * to actually cache on Sonnet 4.6).
 */
export function buildExtractContext(graphNodes, longlistEntries, clusters) {
  const graphTerms = graphNodes
    .map(node => `${node.id}: ${node.label}${node.fullName ? ` (${node.fullName})` : ""}`)
    .join("\n");
  const longlistTerms = longlistEntries
    .map(entry => `${entry.id}: ${entry.label}${entry.fullName ? ` (${entry.fullName})` : ""} [sources: ${entry.sourceCount}, independent: ${entry.independentSourceCount}]`)
    .join("\n");
  const clusterNames = Object.keys(clusters).join(", ");
  const stablePrefix = [
    `Available clusters: ${clusterNames}`,
    "",
    "Tier 1 graph terms (already canonical — do NOT propose these):",
    graphTerms || "(none)",
    "",
    "Tier 2 longlist (under observation — propose these only if the article materially uses them, so we can record an additional source):",
    longlistTerms || "(none)"
  ].join("\n");
  return { stablePrefix };
}

/**
 * Per-article extraction. Returns { summary, candidates: [...] } where each
 * candidate has the shape declared in NEW_TERM_SCHEMA. The article's
 * per-call content is appended after the cached prefix so cache hits across
 * the per-article loop in a single run.
 */
export async function extractNewTerms(article, extractContext, config, client) {
  const perArticleBlock = [
    `Article title: ${article.title}`,
    `Article URL: ${article.url}`,
    `Article source: ${article.sourceLabel}`,
    "",
    "Article excerpt:",
    article.excerpt,
    "",
    `Return at most ${config.maxTermsPerArticle} candidates. For rels, only use existing node ids from the list above.`
  ].join("\n");

  return callStructuredOutput(client, {
    model: config.model,
    max_tokens: config.maxTokensPerCall,
    system: EXTRACT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: extractContext.stablePrefix, cache_control: { type: "ephemeral" } },
          { type: "text", text: perArticleBlock }
        ]
      }
    ],
    output_config: { format: { type: "json_schema", schema: NEW_TERM_SCHEMA } }
  });
}

/**
 * One batched call over the rotating slice of graph nodes selected by
 * pickNodesForReview. Reviews each definition against fresh source excerpts,
 * outputting status: keep | refresh | insufficient_evidence per node.
 */
export async function reviewDefinitions(nodesToReview, articles, config, client) {
  const userText = [
    "Definitions under review:",
    JSON.stringify(nodesToReview.map(node => ({ id: node.id, label: node.label, def: node.def })), null, 2),
    "",
    "Fresh source excerpts:",
    JSON.stringify(articles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.sourceLabel,
      excerpt: article.excerpt.slice(0, 2500)
    })), null, 2)
  ].join("\n");

  return callStructuredOutput(client, {
    model: config.model,
    max_tokens: config.maxTokensPerCall,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
    output_config: { format: { type: "json_schema", schema: DEFINITION_REVIEW_SCHEMA } }
  });
}

/**
 * Send a json_schema-constrained Messages API request and return the
 * parsed JSON from the first text block. Throws if the response has no
 * text block (which would indicate a refusal or unusual stop_reason).
 */
export async function callStructuredOutput(client, params) {
  const response = await client.messages.create(params);
  const textBlock = response.content.find(block => block.type === "text");
  if (!textBlock) {
    throw new Error(`Claude response contained no text block (stop_reason: ${response.stop_reason}).`);
  }
  return JSON.parse(textBlock.text);
}
