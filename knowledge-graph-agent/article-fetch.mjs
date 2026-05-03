// Article collection: RSS/Atom feeds, HTML index pages, individual articles.
// Pure side effects are network fetches and AbortController timeouts; everything
// else is parsing strings.
//
// Failure discipline (this matters):
//   - fetchText retries once on failure (3s pause) — transient 403/429s
//     under burst recover by the second try.
//   - fetchFeedItems and fetchIndexItems wrap fetchText in try/catch — a
//     single failed source returns [] and the run continues with whatever
//     other sources succeeded. Crashing the whole run on one upstream's
//     bad day caused the 2 May 2026 scheduled-run outage.
//   - fetchArticle already had try/catch (one bad article shouldn't lose
//     the rest of the harvest); it now also benefits from fetchText's retry.

import {
  collapseWhitespace,
  decodeEntities,
  extractAtomLink,
  extractMetaContent,
  extractTag,
  fingerprint,
  hostnameFromUrl,
  matchBlocks,
  roundRobinTake,
  stripHtml,
  titleFromUrl
} from "./text-utils.mjs";

const RETRY_PAUSE_MS = 3000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Iterate every configured source and produce a deduplicated, freshness-sorted
 * list of unseen articles, capped at config.maxArticlesPerRun. Article ids
 * are sha-1 fingerprints of their URL — same URL across runs = same id.
 */
export async function collectArticles(config, state) {
  const sourceBatches = [];
  for (const source of config.sources || []) {
    let items = [];
    if (source.type === "article") {
      items = [{
        title: source.label || source.url,
        url: source.url,
        publishedAt: null,
        sourceLabel: source.label || hostnameFromUrl(source.url)
      }];
    } else if (source.type === "html_index") {
      items = await fetchIndexItems(source, config);
    } else {
      items = await fetchFeedItems(source, config);
    }
    // Per-source UA override propagates onto each item so the subsequent
    // fetchArticle call (which only sees the item, not the source) uses
    // the same UA the index/feed fetch used. Most sources omit this and
    // fall back to config.userAgent.
    if (source.userAgent) {
      items = items.map(item => ({ ...item, userAgent: source.userAgent }));
    }
    sourceBatches.push(items);
  }

  const unseenBatches = sourceBatches.map(items => items
    .map(item => ({ ...item, id: fingerprint(item.url) }))
    .filter(item => !state.seenArticles[item.id])
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
  );
  const limited = roundRobinTake(unseenBatches, config.maxArticlesPerRun);
  const articles = [];
  for (const item of limited) {
    const article = await fetchArticle(item, config);
    if (article) articles.push(article);
  }
  return articles;
}

/** RSS or Atom feed → list of {title, url, publishedAt, sourceLabel}. */
export async function fetchFeedItems(source, config) {
  let xml;
  try {
    xml = await fetchText(source.url, config, { userAgent: source.userAgent });
  } catch (err) {
    console.warn(`[article-fetch] Source "${source.label || source.url}" failed: ${err.message}. Skipping this source for this run.`);
    return [];
  }
  const items = [];
  const rssItems = matchBlocks(xml, "item");
  const atomItems = rssItems.length ? [] : matchBlocks(xml, "entry");
  const blocks = rssItems.length ? rssItems : atomItems;
  for (const block of blocks.slice(0, source.limit || config.maxArticlesPerRun)) {
    const title = decodeEntities(extractTag(block, "title") || source.label || source.url);
    const link = rssItems.length
      ? decodeEntities(extractTag(block, "link"))
      : extractAtomLink(block);
    if (!link) continue;
    const publishedAt = decodeEntities(
      extractTag(block, "pubDate") ||
      extractTag(block, "published") ||
      extractTag(block, "updated") ||
      ""
    );
    items.push({
      title,
      url: link.trim(),
      publishedAt: publishedAt || null,
      sourceLabel: source.label || hostnameFromUrl(link)
    });
  }
  return items;
}

/**
 * HTML index page → list of articles. Used for sites like Anthropic's
 * newsroom and DeepMind's blog that don't expose RSS. Configured per-source
 * with includeUrlPatterns/excludeUrlPatterns regexes (against absolute URL).
 */
export async function fetchIndexItems(source, config) {
  let html;
  try {
    html = await fetchText(source.url, config, { userAgent: source.userAgent });
  } catch (err) {
    console.warn(`[article-fetch] Source "${source.label || source.url}" failed: ${err.message}. Skipping this source for this run.`);
    return [];
  }
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  const items = [];
  const includePatterns = (source.includeUrlPatterns || []).map(pattern => new RegExp(pattern, "i"));
  const excludePatterns = (source.excludeUrlPatterns || []).map(pattern => new RegExp(pattern, "i"));
  const sourceHost = hostnameFromUrl(source.url);

  for (const [, href, anchorHtml] of anchors) {
    let resolved;
    try {
      resolved = new URL(href, source.url).toString();
    } catch {
      continue;
    }
    if (source.sameHostOnly !== false && hostnameFromUrl(resolved) !== sourceHost) continue;
    if (includePatterns.length && !includePatterns.some(pattern => pattern.test(resolved))) continue;
    if (excludePatterns.some(pattern => pattern.test(resolved))) continue;
    if (seen.has(resolved)) continue;

    const title = collapseWhitespace(stripHtml(anchorHtml)) || titleFromUrl(resolved);
    if (!title) continue;
    seen.add(resolved);
    items.push({
      title,
      url: resolved,
      publishedAt: null,
      sourceLabel: source.label || sourceHost
    });
    if (items.length >= (source.limit || config.maxArticlesPerRun)) break;
  }
  return items;
}

/**
 * Fetch a single article and produce a normalized record:
 * { id, title, url, publishedAt, sourceLabel, excerpt, host }.
 * On fetch error, returns the same shape with excerpt: "" and an error field —
 * never throws (keeps one bad article from breaking the whole run).
 */
export async function fetchArticle(item, config) {
  try {
    const html = await fetchText(item.url, config, { userAgent: item.userAgent });
    const title = decodeEntities(
      extractMetaContent(html, "property", "og:title") ||
      extractTag(html, "title") ||
      item.title ||
      item.url
    );
    const excerpt = collapseWhitespace(stripHtml(html)).slice(0, 8000);
    if (!excerpt) return null;
    return { ...item, title, excerpt, host: hostnameFromUrl(item.url) };
  } catch (err) {
    return {
      ...item,
      title: item.title,
      excerpt: "",
      host: hostnameFromUrl(item.url),
      error: err.message
    };
  }
}

/**
 * Plain HTTP GET with the configured user-agent + abortable timeout.
 * Retries once on failure with a 3s pause — some upstreams briefly 403/429
 * under burst then recover, and one retry is enough to dodge most transient
 * blocks. Persistent failures (config error, dead host, sustained block)
 * still throw on the second attempt and propagate to the caller's try/catch.
 *
 * The `options.userAgent` override lets per-source UA settings (set in
 * config.mjs) flow through. Falls back to config.userAgent — the honest
 * agent UA — for sources that don't need an override.
 */
export async function fetchText(url, config, options = {}) {
  const userAgent = options.userAgent || config.userAgent;
  try {
    return await rawFetchText(url, config, userAgent);
  } catch (err) {
    await sleep(RETRY_PAUSE_MS);
    return await rawFetchText(url, config, userAgent);
  }
}

async function rawFetchText(url, config, userAgent) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}
