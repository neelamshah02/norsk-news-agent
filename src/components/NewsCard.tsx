'use client';

import { useState, useRef, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import type { RssEntry, AnalyzeResponse } from '@/types';

type Status = 'idle' | 'loading' | 'loaded' | 'error' | 'error-permanent';

export default function NewsCard({ entry, autoLoad }: { entry: RssEntry; autoLoad?: boolean }) {
  const [status, setStatus] = useState<Status>('idle');
  const [cardData, setCardData] = useState<AnalyzeResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleLearn() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStatus('loading');
    try {
      const res = await fetch(`/api/analyze?url=${encodeURIComponent(entry.link)}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        if (res.status === 422) {
          setStatus('error-permanent');
          return;
        }
        throw new Error('fetch failed');
      }
      const data = await res.json() as { card: AnalyzeResponse['card']; truncated: boolean };
      setCardData({
        article: {
          title: entry.title,
          url: entry.link,
          source: entry.source,
          truncated: data.truncated,
        },
        card: data.card,
      });
      setStatus('loaded');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setStatus('error');
    }
  }

  useEffect(() => {
    if (autoLoad) handleLearn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
          {entry.source}
        </span>
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm hover:underline"
        >
          Les mer ↗
        </a>
      </div>

      <h2 className="text-lg font-bold text-gray-900 leading-snug">{entry.title}</h2>

      {entry.description && (
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {entry.description}
        </p>
      )}

      {status === 'idle' && (
        <button
          onClick={handleLearn}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Lær norsk med denne artikkelen
        </button>
      )}

      {status === 'loading' && (
        <p className="w-full py-2 text-center text-sm text-gray-400 animate-pulse">
          Laster inn språkkort…
        </p>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p className="text-red-600 text-sm text-center">
            Kunne ikke laste inn. Prøv igjen.
          </p>
          <button
            onClick={handleLearn}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Prøv igjen
          </button>
        </div>
      )}

      {status === 'error-permanent' && (
        <p className="text-amber-600 text-sm text-center">
          Artikkelen er ikke tilgjengelig for analyse (for kort tekst eller betalingsmur).
        </p>
      )}

      {status === 'loaded' && cardData && <ArticleCard data={cardData} />}
    </div>
  );
}
