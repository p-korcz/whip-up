import axios from 'axios';
import * as cheerio from 'cheerio';

const http = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; WhipUpCrawler/1.0; +https://github.com/whip-up)',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8',
  },
  maxRedirects: 5,
});

export interface FetchResult {
  url: string;
  title: string;
  text: string;
  html: string;
}

export async function fetchPage(url: string): Promise<FetchResult | null> {
  try {
    const response = await http.get<string>(url);
    const $ = cheerio.load(response.data);

    // Remove noise
    $('script, style, nav, footer, header, [aria-hidden="true"], .ad, .advertisement, .cookie-banner').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);

    return { url, title, text, html: response.data };
  } catch {
    return null;
  }
}

export async function discoverRecipeLinks(
  indexUrl: string,
  basePattern: RegExp,
): Promise<string[]> {
  const result = await fetchPage(indexUrl);
  if (!result) return [];

  const $ = cheerio.load(result.html);
  const links = new Set<string>();
  const base = new URL(indexUrl);

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    try {
      const absolute = new URL(href, base).toString();
      if (basePattern.test(absolute)) {
        links.add(absolute);
      }
    } catch {
      // malformed href
    }
  });

  return [...links];
}
