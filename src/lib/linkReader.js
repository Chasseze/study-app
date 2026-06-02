// Client-side "reader mode" for external links.
//
// The app is a static site (no backend) and most websites block being embedded
// in an <iframe> (X-Frame-Options / CSP frame-ancestors). To let people READ a
// linked page without leaving the app, we fetch a clean, readable extraction of
// the page through a CORS-enabled reader endpoint and render it as markdown in
// our prose styles.
//
// Reader endpoint: https://r.jina.ai/<url> — returns article text as markdown
// with permissive CORS headers, no API key required for light use.

export function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

export function hostnameOf(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '');
  } catch (e) {
    return url || '';
  }
}

/**
 * Fetch a readable extraction of a URL.
 * @returns {Promise<{title:string, markdown:string, url:string}>}
 */
export async function fetchReadable(url, { signal } = {}) {
  const target = normalizeUrl(url);
  const endpoint = 'https://r.jina.ai/' + target;

  const res = await fetch(endpoint, {
    signal,
    headers: { Accept: 'text/plain' }
  });

  if (!res.ok) {
    throw new Error(`Reader service responded ${res.status}`);
  }

  const raw = await res.text();
  if (!raw || !raw.trim()) {
    throw new Error('No readable content found');
  }

  // Jina reader prepends a small metadata header:
  //   Title: ...
  //   URL Source: ...
  //   Published Time: ...
  //   Markdown Content:
  //   <body markdown>
  let title = hostnameOf(target);
  let markdown = raw;

  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  if (titleMatch) title = titleMatch[1].trim();

  const splitIdx = raw.indexOf('Markdown Content:');
  if (splitIdx !== -1) {
    markdown = raw.slice(splitIdx + 'Markdown Content:'.length).trim();
  }

  return { title, markdown, url: target };
}
