/**
 * @jest-environment node
 */
jest.mock('../../src/lib/scraper', () => ({
  fetchArticleText: jest.fn(),
}));
jest.mock('../../src/lib/gemini', () => ({
  generateLanguageCard: jest.fn(),
}));

import type { LanguageCard } from '../../src/types';
import { GET } from '../../src/app/api/analyze/route';
import { fetchArticleText } from '../../src/lib/scraper';
import { generateLanguageCard } from '../../src/lib/gemini';

const mockFetch = fetchArticleText as jest.MockedFunction<typeof fetchArticleText>;
const mockGenerate = generateLanguageCard as jest.MockedFunction<typeof generateLanguageCard>;

const mockCard: LanguageCard = {
  summary: 'Sammendrag.',
  vocabulary: [
    { word: 'ord', englishGloss: 'word', norwegianExplanation: 'Et ord.', exampleSentence: 'Dette er et ord.' },
    { word: 'to', englishGloss: 'two', norwegianExplanation: 'Tallet to.', exampleSentence: 'To hus.' },
    { word: 'tre', englishGloss: 'three', norwegianExplanation: 'Tallet tre.', exampleSentence: 'Tre biler.' },
    { word: 'fire', englishGloss: 'four', norwegianExplanation: 'Tallet fire.', exampleSentence: 'Fire dager.' },
    { word: 'fem', englishGloss: 'five', norwegianExplanation: 'Tallet fem.', exampleSentence: 'Fem minutter.' },
  ],
  grammarNote: { sentence: 'Bilen ble kjøpt.', explanation: 'Passive with bli.' },
  quizQuestions: [
    { word: 'ord', correct: 'word', distractors: ['sentence', 'letter', 'phrase'] as [string, string, string] },
    { word: 'to', correct: 'two', distractors: ['one', 'three', 'four'] as [string, string, string] },
    { word: 'tre', correct: 'three', distractors: ['two', 'four', 'five'] as [string, string, string] },
    { word: 'fire', correct: 'four', distractors: ['three', 'five', 'six'] as [string, string, string] },
    { word: 'fem', correct: 'five', distractors: ['four', 'six', 'seven'] as [string, string, string] },
  ],
};

function makeRequest(url: string) {
  return new Request(`http://localhost/api/analyze?url=${encodeURIComponent(url)}`);
}

describe('GET /api/analyze', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when url param is missing', async () => {
    const res = await GET(new Request('http://localhost/api/analyze'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 422 when article text is too short', async () => {
    mockFetch.mockResolvedValue({ text: 'kort', truncated: true });
    const res = await GET(makeRequest('https://example.com/article'));
    expect(res.status).toBe(422);
  });

  it('returns card and truncated flag on success', async () => {
    mockFetch.mockResolvedValue({
      text: 'A'.repeat(200),
      truncated: false,
    });
    mockGenerate.mockResolvedValue(mockCard);
    const res = await GET(makeRequest('https://example.com/article'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.card).toEqual(mockCard);
    expect(body.truncated).toBe(false);
  });

  it('returns 500 on unexpected error', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const res = await GET(makeRequest('https://example.com/article'));
    expect(res.status).toBe(500);
  });
});
