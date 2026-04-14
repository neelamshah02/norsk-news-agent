import { NextResponse } from 'next/server';
import { fetchAllFeeds, filterByTopic, pickBestEntry } from '@/lib/rss';
import { fetchArticleText } from '@/lib/scraper';
import { generateLanguageCard } from '@/lib/claude';
import type { AnalyzeResponse } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic')?.trim();

  if (!topic) {
    return NextResponse.json({ error: 'Missing topic parameter' }, { status: 400 });
  }

  try {
    const entries = await fetchAllFeeds();
    const matches = filterByTopic(entries, topic);
    const best = pickBestEntry(matches);

    if (!best) {
      return NextResponse.json(
        { error: `Fant ingen artikler om «${topic}» — prøv et annet søkeord` },
        { status: 404 }
      );
    }

    const { text: articleText, truncated } = await fetchArticleText(best.link);
    const sourceText = truncated && best.description ? best.description : articleText;

    if (!sourceText || sourceText.length < 50) {
      return NextResponse.json(
        { error: `Fant ingen artikler om «${topic}» — prøv et annet søkeord` },
        { status: 404 }
      );
    }

    const card = await generateLanguageCard(sourceText);

    const body: AnalyzeResponse = {
      article: {
        title: best.title,
        url: best.link,
        source: best.source,
        truncated,
      },
      card,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error('/api/analyze error:', error);
    return NextResponse.json({ error: 'Noe gikk galt. Prøv igjen.' }, { status: 500 });
  }
}
