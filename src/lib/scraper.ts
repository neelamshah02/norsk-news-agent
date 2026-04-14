import * as cheerio from 'cheerio';

const SELECTORS = [
  'article p',
  '[class*="article-body"] p',
  '[class*="article-text"] p',
  '[class*="content-body"] p',
  'main p',
];

export function extractText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, aside, [class*="ad-"], [class*="menu"], [class*="paywall"]').remove();

  for (const selector of SELECTORS) {
    const paragraphs: string[] = [];
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) paragraphs.push(text);
    });
    const joined = paragraphs.join('\n\n');
    if (joined.length > 200) return joined;
  }
  return '';
}

export async function fetchArticleText(url: string): Promise<{ text: string; truncated: boolean }> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NorskNewsAgent/1.0' },
    });
    if (!response.ok) return { text: '', truncated: true };
    const html = await response.text();
    const text = extractText(html);
    return { text, truncated: text.length < 200 };
  } catch {
    return { text: '', truncated: true };
  }
}
