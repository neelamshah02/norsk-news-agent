import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { LanguageCard } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    vocabulary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING },
          englishGloss: { type: SchemaType.STRING },
          norwegianExplanation: { type: SchemaType.STRING },
          exampleSentence: { type: SchemaType.STRING },
        },
        required: ['word', 'englishGloss', 'norwegianExplanation', 'exampleSentence'],
      },
    },
    grammarNote: {
      type: SchemaType.OBJECT,
      properties: {
        sentence: { type: SchemaType.STRING },
        explanation: { type: SchemaType.STRING },
      },
      required: ['sentence', 'explanation'],
    },
    quizQuestions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING },
          correct: { type: SchemaType.STRING },
          distractors: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['word', 'correct', 'distractors'],
      },
    },
  },
  required: ['summary', 'vocabulary', 'grammarNote', 'quizQuestions'],
};

export async function generateLanguageCard(articleText: string): Promise<LanguageCard> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You are a Norwegian language teacher helping an English-speaking student at B1 level learn Norwegian through authentic news articles.',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const prompt = `Generate a Norwegian language learning card from the following news article text.

- Write a summary in clear Norwegian at B1–B2 CEFR level (3–5 sentences, common vocabulary, short sentences).
- Choose exactly 5 vocabulary words that appear in the article and are useful for B1 learners.
- For each word: write a one-sentence Norwegian explanation and a short English gloss (1–4 words).
- Include an example sentence from the article for each word.
- Choose one sentence from the article that illustrates an interesting grammar pattern common in Norwegian news writing (passive voice with bli, modal verbs, or subordinate clause word order). Explain the pattern in 2–3 sentences in English.
- Create one multiple-choice quiz question per vocabulary word: show the Norwegian word, give the correct English definition, and 3 plausible but wrong English definitions from the same semantic field.

Article text:
${articleText.slice(0, 6000)}`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as LanguageCard;
}
