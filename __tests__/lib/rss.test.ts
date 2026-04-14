/**
 * @jest-environment node
 */
import { filterByTopic, pickBestEntry } from '@/lib/rss';
import type { RssEntry } from '@/types';

const entries: RssEntry[] = [
  {
    title: 'Ny klimaplan fra regjeringen',
    link: 'https://nrk.no/1',
    description: 'Regjeringen presenterte en ny plan.',
    source: 'NRK',
  },
  {
    title: 'VG: Klimakonferanse i Oslo',
    link: 'https://vg.no/1',
    description: 'Klimakonferansen samlet eksperter.',
    source: 'VG',
  },
  {
    title: 'Aftenposten: Ny teknologi',
    link: 'https://ap.no/1',
    description: 'Teknologi endrer hverdagen.',
    source: 'Aftenposten',
  },
];

describe('filterByTopic', () => {
  it('returns entries matching topic in title', () => {
    const result = filterByTopic(entries, 'klima');
    expect(result).toHaveLength(2);
    expect(result.map(e => e.source)).toEqual(['NRK', 'VG']);
  });

  it('is case-insensitive', () => {
    expect(filterByTopic(entries, 'KLIMA')).toHaveLength(2);
    expect(filterByTopic(entries, 'Klima')).toHaveLength(2);
  });

  it('matches against description when title does not match', () => {
    const descriptionOnly: RssEntry[] = [
      { title: 'Annet tema', link: 'https://nrk.no/2', description: 'klima er viktig her', source: 'NRK' },
    ];
    expect(filterByTopic(descriptionOnly, 'klima')).toHaveLength(1);
  });

  it('returns empty array when no entries match', () => {
    expect(filterByTopic(entries, 'sport')).toHaveLength(0);
  });
});

describe('pickBestEntry', () => {
  it('returns null for empty array', () => {
    expect(pickBestEntry([])).toBeNull();
  });

  it('prefers NRK over VG and Aftenposten', () => {
    const result = pickBestEntry([entries[1], entries[0], entries[2]]);
    expect(result?.source).toBe('NRK');
  });

  it('falls back to VG when no NRK entry', () => {
    const result = pickBestEntry([entries[2], entries[1]]);
    expect(result?.source).toBe('VG');
  });

  it('falls back to Aftenposten when no NRK or VG', () => {
    const result = pickBestEntry([entries[2]]);
    expect(result?.source).toBe('Aftenposten');
  });

  it('returns the first entry when no priority source matches', () => {
    const unknown: RssEntry = { title: 'X', link: 'https://x.no', description: '', source: 'NRK' };
    expect(pickBestEntry([unknown])).toBe(unknown);
  });
});
