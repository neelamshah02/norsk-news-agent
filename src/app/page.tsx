import { Suspense } from 'react';
import NewsCard from '@/components/NewsCard';
import { fetchAllFeeds } from '@/lib/rss';

async function NewsFeed() {
  try {
    const entries = await fetchAllFeeds();
    const top5 = entries.slice(0, 5);

    if (top5.length === 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Fant ingen nyheter. Prøv igjen senere.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {top5.map((entry, i) => (
          <NewsCard key={i} entry={entry} autoLoad={i === 0} />
        ))}
      </div>
    );
  } catch {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">Noe gikk galt. Prøv igjen.</p>
      </div>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Norsk Nyhetsagent</h1>
        <p className="text-gray-500 text-sm mb-6">Lær norsk gjennom aktuelle nyheter</p>
        <Suspense fallback={<LoadingSkeleton />}>
          <NewsFeed />
        </Suspense>
      </div>
    </main>
  );
}
