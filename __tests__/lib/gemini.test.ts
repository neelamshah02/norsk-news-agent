/**
 * @jest-environment node
 */
import type { LanguageCard } from '@/types';

const mockCard: LanguageCard = {
  summary: 'Dette er et sammendrag.',
  vocabulary: [
    { word: 'forhandlinger', englishGloss: 'negotiations', norwegianExplanation: 'Samtaler mellom parter.', exampleSentence: 'Forhandlingene startet tirsdag.' },
    { word: 'avtale', englishGloss: 'agreement', norwegianExplanation: 'En enighet mellom to parter.', exampleSentence: 'De signerte en avtale.' },
    { word: 'regjering', englishGloss: 'government', norwegianExplanation: 'Den styrende makten i et land.', exampleSentence: 'Regjeringen vedtok loven.' },
    { word: 'tiltak', englishGloss: 'measure', norwegianExplanation: 'Et konkret steg for å løse et problem.', exampleSentence: 'Nye tiltak ble innført.' },
    { word: 'utvikling', englishGloss: 'development', norwegianExplanation: 'En prosess med endring over tid.', exampleSentence: 'Utviklingen går raskt.' },
  ],
  grammarNote: {
    sentence: 'Avtalen ble signert av begge parter.',
    explanation: 'This uses the passive voice with "bli". In Norwegian, "bli" + past participle forms the passive.',
  },
  quizQuestions: [
    { word: 'forhandlinger', correct: 'negotiations', distractors: ['celebrations', 'agreements', 'demonstrations'] },
    { word: 'avtale', correct: 'agreement', distractors: ['contract', 'meeting', 'dispute'] },
    { word: 'regjering', correct: 'government', distractors: ['parliament', 'court', 'ministry'] },
    { word: 'tiltak', correct: 'measure', distractors: ['policy', 'law', 'reform'] },
    { word: 'utvikling', correct: 'development', distractors: ['progress', 'change', 'growth'] },
  ],
};

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(mockCard) },
      }),
    }),
  })),
  SchemaType: {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
  },
}));

import { generateLanguageCard } from '@/lib/gemini';

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
});

describe('generateLanguageCard', () => {
  it('returns a parsed LanguageCard from Gemini JSON response', async () => {
    const result = await generateLanguageCard('Noen norsk artikkeltekst her som er lang nok til å bli prosessert.');
    expect(result.summary).toBe('Dette er et sammendrag.');
    expect(result.vocabulary).toHaveLength(5);
    expect(result.vocabulary[0].word).toBe('forhandlinger');
    expect(result.grammarNote.sentence).toContain('ble signert');
    expect(result.quizQuestions).toHaveLength(5);
    expect(result.quizQuestions[0].distractors).toHaveLength(3);
  });

  it('throws when Gemini returns non-JSON response', async () => {
    const { GoogleGenerativeAI } = jest.requireMock('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => 'not valid json' },
        }),
      }),
    }));
    await expect(generateLanguageCard('tekst')).rejects.toThrow('Gemini returned non-JSON response');
  });

  it('throws when Gemini API call fails', async () => {
    const { GoogleGenerativeAI } = jest.requireMock('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API error')),
      }),
    }));
    await expect(generateLanguageCard('tekst')).rejects.toThrow('API error');
  });
});
