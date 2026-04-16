import * as cheerio from 'cheerio';
import type { RssEntry, Source } from '@/types';

const RSS_FEEDS: Record<Source, string> = {
  NRK: 'https://www.nrk.no/toppsaker.rss',
  VG: 'https://www.vg.no/rss/feed/',
  Aftenposten: 'https://www.aftenposten.no/rss/',
};

const SOURCE_PRIORITY: Source[] = ['NRK', 'VG', 'Aftenposten'];

export async function fetchFeed(source: Source): Promise<RssEntry[]> {
  const response = await fetch(RSS_FEEDS[source], {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`RSS fetch failed for ${source}: ${response.status}`);

  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const entries: RssEntry[] = [];
  $('item').each((_, el) => {
    const title = $(el).find('title').first().text().trim();
    const link =
      $(el).find('link').first().text().trim() ||
      $(el).find('link').attr('href') ||
      '';
    const description = $(el).find('description').first().text().trim();
    if (title && link) {
      entries.push({ title, link, description, source });
    }
  });
  return entries;
}

export async function fetchAllFeeds(): Promise<RssEntry[]> {
  const results = await Promise.allSettled(
    SOURCE_PRIORITY.map(source => fetchFeed(source))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<RssEntry[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

export function filterByTopic(entries: RssEntry[], topic: string): RssEntry[] {
  const lower = topic.toLowerCase();
  return entries.filter(
    e =>
      e.title.toLowerCase().includes(lower) ||
      (e.description ?? '').toLowerCase().includes(lower)
  );
}

export function pickBestEntry(entries: RssEntry[]): RssEntry | null {
  if (entries.length === 0) return null;
  for (const source of SOURCE_PRIORITY) {
    const match = entries.find(e => e.source === source);
    if (match) return match;
  }
  return entries[0];
}
