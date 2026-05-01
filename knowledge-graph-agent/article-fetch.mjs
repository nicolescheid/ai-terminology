// Article collection: RSS/Atom feeds, HTML index pages, individual articles.
// Pure side effects are network fetches and AbortController timeouts; everything
// else is parsing strings.

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
  const xml = await fetchText(source.url, config);
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
  const html = await fetchText(source.url, config);
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
    const html = await fetchText(item.url, config);
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

/** Plain HTTP GET with the configured user-agent + abortable timeout. */
export async function fetchText(url, config) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": config.userAgent,
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
