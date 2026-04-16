import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import type { LanguageCard } from '@/types';

export const MOCK_CARD: LanguageCard = {
  summary:
    'Norge er et land i Nord-Europa med omtrent fem millioner innbyggere. Landet er kjent for sin natur, med fjorder, fjell og nordlys. Norge har en sterk økonomi takket være olje og gass. Mange nordmenn er opptatt av friluftsliv og tilbringer mye tid ute i naturen. Landet er også kjent for sitt gode velferdssystem.',
  vocabulary: [
    {
      word: 'fjord',
      englishGloss: 'fjord / inlet',
      norwegianExplanation: 'En fjord er en lang, smal havarm omgitt av høye fjell.',
      exampleSentence: 'Sognefjorden er den lengste fjorden i Norge.',
    },
    {
      word: 'innbygger',
      englishGloss: 'inhabitant / resident',
      norwegianExplanation: 'En innbygger er en person som bor i et bestemt sted eller land.',
      exampleSentence: 'Norge har omtrent fem millioner innbyggere.',
    },
    {
      word: 'friluftsliv',
      englishGloss: 'outdoor life',
      norwegianExplanation: 'Friluftsliv betyr å tilbringe tid ute i naturen for moro og helse.',
      exampleSentence: 'Nordmenn er veldig glad i friluftsliv.',
    },
    {
      word: 'velferdsstat',
      englishGloss: 'welfare state',
      norwegianExplanation: 'En velferdsstat er et land der myndighetene sørger for innbyggernes grunnleggende behov.',
      exampleSentence: 'Norge er kjent for å ha en sterk velferdsstat.',
    },
    {
      word: 'nordlys',
      englishGloss: 'northern lights / aurora',
      norwegianExplanation: 'Nordlys er et naturlig lysshow på himmelen som kan ses i Nord-Norge.',
      exampleSentence: 'Mange turister reiser til Tromsø for å se nordlyset.',
    },
  ],
  grammarNote: {
    sentence: 'Det sies at Norge er et av verdens beste land å bo i.',
    explanation:
      'This sentence uses the passive construction "det sies" (it is said). In Norwegian, passive voice is often formed with "bli" + past participle, or with the "-s" passive (sies = "is said"). The "-s" passive is common in formal writing and news.',
  },
  quizQuestions: [
    {
      word: 'fjord',
      correct: 'a long narrow sea inlet',
      distractors: ['a type of mountain', 'a Norwegian city', 'a forest area'],
    },
    {
      word: 'innbygger',
      correct: 'inhabitant',
      distractors: ['tourist', 'politician', 'journalist'],
    },
    {
      word: 'friluftsliv',
      correct: 'outdoor life',
      distractors: ['indoor sport', 'city lifestyle', 'cultural festival'],
    },
    {
      word: 'velferdsstat',
      correct: 'welfare state',
      distractors: ['oil company', 'political party', 'national park'],
    },
    {
      word: 'nordlys',
      correct: 'northern lights',
      distractors: ['midnight sun', 'snowstorm', 'sea fog'],
    },
  ],
};

const responseSchema: Schema = {
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
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ['word', 'correct', 'distractors'],
      },
    },
  },
  required: ['summary', 'vocabulary', 'grammarNote', 'quizQuestions'],
};

export async function generateLanguageCard(articleText: string): Promise<LanguageCard> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
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
  try {
    return JSON.parse(result.response.text()) as LanguageCard;
  } catch {
    throw new Error('Gemini returned non-JSON response');
  }
}
