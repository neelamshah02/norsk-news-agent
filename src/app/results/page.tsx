import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import ArticleCard from '@/components/ArticleCard';
import { fetchAllFeeds, filterByTopic, pickBestEntry } from '@/lib/rss';
import { fetchArticleText } from '@/lib/scraper';
import { generateLanguageCard } from '@/lib/claude';
import type { AnalyzeResponse } from '@/types';

async function ResultsData({ topic }: { topic: string }) {
  try {
    const entries = await fetchAllFeeds();
    const matches = filterByTopic(entries, topic);
    const best = pickBestEntry(matches);

    if (!best) {
      return <ErrorCard message={`Fant ingen artikler om «${topic}» — prøv et annet søkeord`} />;
    }

    const { text: articleText, truncated } = await fetchArticleText(best.link);
    const sourceText = truncated && best.description ? best.description : articleText;

    if (!sourceText || sourceText.length < 50) {
      return <ErrorCard message={`Fant ingen artikler om «${topic}» — prøv et annet søkeord`} />;
    }

    const card = await generateLanguageCard(sourceText);

    const data: AnalyzeResponse = {
      article: { title: best.title, url: best.link, source: best.source, truncated },
      card,
    };

    return <ArticleCard data={data} />;
  } catch {
    return <ErrorCard message="Noe gikk galt. Prøv igjen." />;
  }
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-700 mb-4">{message}</p>
      <a href="/" className="text-blue-600 hover:underline">
        ← Prøv et nytt søk
      </a>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse space-y-6">
      <div className="h-5 bg-gray-200 rounded w-20" />
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  if (!topic?.trim()) redirect('/');

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          ← Nytt søk
        </a>
        <Suspense fallback={<LoadingSkeleton />}>
          <ResultsData topic={topic.trim()} />
        </Suspense>
      </div>
    </main>
  );
}
