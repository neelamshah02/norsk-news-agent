import Anthropic from '@anthropic-ai/sdk';
import type { LanguageCard } from '@/types';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a Norwegian language teacher helping English-speaking students learn Norwegian through authentic news articles.

For each article:
- Write a summary in clear Norwegian at B1-B2 CEFR level. Use common vocabulary and short sentences. Avoid complex subordinate clauses.
- Choose exactly 5 vocabulary words that appear in the article and are useful for learners.
- For each word, write a short Norwegian explanation (1 sentence) and provide an English gloss.
- Choose one sentence from the article that illustrates an interesting grammar pattern common in Norwegian news writing (passive voice with bli, modal verbs, or subordinate clause word order).
- For each quiz question, write three distractors from the same semantic field as the correct answer but with clearly different meanings.`;

const TOOL: Anthropic.Tool = {
  name: 'generate_language_card',
  description: 'Generate a Norwegian language learning card from a news article',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string',
        description: '3-5 sentences in Norwegian at B1-B2 CEFR level summarising the article',
      },
      vocabulary: {
        type: 'array',
        description: 'Exactly 5 vocabulary items from the article',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            englishGloss: { type: 'string', description: 'Short English translation (1-4 words)' },
            norwegianExplanation: { type: 'string', description: 'One-sentence explanation in simple Norwegian' },
            exampleSentence: { type: 'string', description: 'A sentence from the article using this word' },
          },
          required: ['word', 'englishGloss', 'norwegianExplanation', 'exampleSentence'],
        },
        minItems: 5,
        maxItems: 5,
      },
      grammarNote: {
        type: 'object',
        properties: {
          sentence: { type: 'string', description: 'An exact sentence from the article' },
          explanation: { type: 'string', description: '2-3 sentences explaining the grammar pattern in English' },
        },
        required: ['sentence', 'explanation'],
      },
      quizQuestions: {
        type: 'array',
        description: 'One question per vocabulary item, in the same order',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            correct: { type: 'string', description: 'The correct English definition' },
            distractors: {
              type: 'array',
              items: { type: 'string' },
              minItems: 3,
              maxItems: 3,
              description: 'Three plausible but wrong English definitions',
            },
          },
          required: ['word', 'correct', 'distractors'],
        },
        minItems: 5,
        maxItems: 5,
      },
    },
    required: ['summary', 'vocabulary', 'grammarNote', 'quizQuestions'],
  },
};

export async function generateLanguageCard(articleText: string): Promise<LanguageCard> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: `Here is the Norwegian news article text. Generate the language learning card:\n\n${articleText.slice(0, 6000)}`,
      },
    ],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  if (!toolUse) {
    throw new Error('Claude did not return a tool_use block');
  }
  return toolUse.input as LanguageCard;
}
