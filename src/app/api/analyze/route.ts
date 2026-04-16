import { NextResponse } from 'next/server';
import { fetchArticleText } from '@/lib/scraper';
import { generateLanguageCard, MOCK_CARD } from '@/lib/gemini';
import type { LanguageCard } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url')?.trim();

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const { text: articleText, truncated } = await fetchArticleText(url);

    if (!articleText || articleText.length < 50) {
      return NextResponse.json(
        { error: 'Kunne ikke hente artikkeltekst' },
        { status: 422 }
      );
    }

    let card: LanguageCard;
    try {
      card = await generateLanguageCard(articleText);
    } catch (geminiError) {
      console.warn('/api/analyze: Gemini unavailable, using mock data:', geminiError);
      card = MOCK_CARD;
    }
    return NextResponse.json({ card, truncated });
  } catch (error) {
    console.error('/api/analyze error:', error);
    return NextResponse.json({ error: 'Noe gikk galt. Prøv igjen.' }, { status: 500 });
  }
}
