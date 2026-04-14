# Norsk News Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app where users type a Norwegian topic and receive an article-based language learning card with a B1–B2 summary, five vocabulary words, a grammar note, and a multiple-choice vocabulary quiz.

**Architecture:** RSS feeds from NRK, VG, and Aftenposten are fetched and filtered by topic keyword; the best matching article's HTML is scraped with cheerio; a single Claude API tool-use call returns structured JSON. The results page calls lib functions directly as a Next.js server component. A public `GET /api/analyze` route also exposes the pipeline for external use.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, `@anthropic-ai/sdk`, `cheerio`, Jest + React Testing Library. Deploys to Vercel.

---

## File Map

| File | Responsibility |
|---|---|
| `src/types/index.ts` | All shared TypeScript interfaces |
| `src/lib/rss.ts` | Fetch + parse + filter RSS feeds |
| `src/lib/scraper.ts` | Extract article body text from HTML |
| `src/lib/claude.ts` | Claude API call with tool use, returns `LanguageCard` |
| `src/app/api/analyze/route.ts` | `GET /api/analyze?topic=` — public endpoint |
| `src/app/layout.tsx` | Root layout with metadata |
| `src/app/globals.css` | Tailwind directives |
| `src/app/page.tsx` | Home page — renders `TopicInput` |
| `src/app/results/page.tsx` | Results server page — fetches data, renders card |
| `src/components/TopicInput.tsx` | Topic search form (client component) |
| `src/components/ArticleCard.tsx` | Article card with summary/vocab/grammar (client) |
| `src/components/QuizModal.tsx` | One-at-a-time quiz overlay (client) |
| `__tests__/lib/rss.test.ts` | Unit tests for RSS filter/pick functions |
| `__tests__/lib/scraper.test.ts` | Unit tests for HTML text extraction |
| `__tests__/components/TopicInput.test.tsx` | Render + navigation tests |
| `__tests__/components/QuizModal.test.tsx` | State transition tests |

---

## Task 1: Project Scaffold

**Files:**
- Modify: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `.env.local` (gitignored)
- Create: `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Install dependencies**

```bash
npm install next@15 react@19 react-dom@19
npm install -D typescript @types/node@20 @types/react@19 @types/react-dom@19
npm install -D tailwindcss postcss autoprefixer
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest
```

Expected: no errors, `node_modules` updated.

- [ ] **Step 2: Update `package.json`**

Replace the full file content:

```json
{
  "name": "norsk-news-agent",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.88.0",
    "cheerio": "^1.2.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Create `postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 7: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(config);
```

- [ ] **Step 8: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 9: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Norsk Nyhetsagent',
  description: 'Lær norsk gjennom aktuelle nyheter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
```

- [ ] **Step 11: Create `.env.local`**

```
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 12: Create `.env.local.example`**

```
ANTHROPIC_API_KEY=
```

- [ ] **Step 13: Create `.gitignore`**

```
.env.local
.next/
node_modules/
.superpowers/
```

- [ ] **Step 14: Verify Next.js starts**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` (404 is fine — no pages yet).

- [ ] **Step 15: Commit**

```bash
git add package.json next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs jest.config.ts jest.setup.ts src/app/globals.css src/app/layout.tsx .env.local.example .gitignore
git commit -m "feat: scaffold Next.js project with Tailwind and Jest"
```

---

## Task 2: Shared TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export type Source = 'NRK' | 'VG' | 'Aftenposten';

export interface RssEntry {
  title: string;
  link: string;
  description: string;
  source: Source;
}

export interface VocabularyItem {
  word: string;
  englishGloss: string;
  norwegianExplanation: string;
  exampleSentence: string;
}

export interface GrammarNote {
  sentence: string;
  explanation: string;
}

export interface QuizQuestion {
  word: string;
  correct: string;
  distractors: [string, string, string];
}

export interface LanguageCard {
  summary: string;
  vocabulary: VocabularyItem[];
  grammarNote: GrammarNote;
  quizQuestions: QuizQuestion[];
}

export interface ArticleInfo {
  title: string;
  url: string;
  source: Source;
  truncated: boolean;
}

export interface AnalyzeResponse {
  article: ArticleInfo;
  card: LanguageCard;
}

export interface AnalyzeError {
  error: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: RSS Module + Tests

**Files:**
- Create: `src/lib/rss.ts`
- Create: `__tests__/lib/rss.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/rss.test.ts`:

```typescript
import { filterByTopic, pickBestEntry } from '@/lib/rss';
import type { RssEntry } from '@/types';

const entries: RssEntry[] = [
  {
    title: 'Ny klimaplan fra regjeringen',
    link: 'https://nrk.no/1',
    description: 'Regjeringen presenterte en ny plan.',
    source: 'NRK',
  },
  {
    title: 'VG: Klimakonferanse i Oslo',
    link: 'https://vg.no/1',
    description: 'Klimakonferansen samlet eksperter.',
    source: 'VG',
  },
  {
    title: 'Aftenposten: Ny teknologi',
    link: 'https://ap.no/1',
    description: 'Teknologi endrer hverdagen.',
    source: 'Aftenposten',
  },
];

describe('filterByTopic', () => {
  it('returns entries matching topic in title', () => {
    const result = filterByTopic(entries, 'klima');
    expect(result).toHaveLength(2);
    expect(result.map(e => e.source)).toEqual(['NRK', 'VG']);
  });

  it('is case-insensitive', () => {
    expect(filterByTopic(entries, 'KLIMA')).toHaveLength(2);
    expect(filterByTopic(entries, 'Klima')).toHaveLength(2);
  });

  it('matches against description when title does not match', () => {
    const descriptionOnly: RssEntry[] = [
      { title: 'Annet tema', link: 'https://nrk.no/2', description: 'klima er viktig her', source: 'NRK' },
    ];
    expect(filterByTopic(descriptionOnly, 'klima')).toHaveLength(1);
  });

  it('returns empty array when no entries match', () => {
    expect(filterByTopic(entries, 'sport')).toHaveLength(0);
  });
});

describe('pickBestEntry', () => {
  it('returns null for empty array', () => {
    expect(pickBestEntry([])).toBeNull();
  });

  it('prefers NRK over VG and Aftenposten', () => {
    const result = pickBestEntry([entries[1], entries[0], entries[2]]);
    expect(result?.source).toBe('NRK');
  });

  it('falls back to VG when no NRK entry', () => {
    const result = pickBestEntry([entries[2], entries[1]]);
    expect(result?.source).toBe('VG');
  });

  it('falls back to Aftenposten when no NRK or VG', () => {
    const result = pickBestEntry([entries[2]]);
    expect(result?.source).toBe('Aftenposten');
  });

  it('returns the first entry when no priority source matches', () => {
    const unknown: RssEntry = { title: 'X', link: 'https://x.no', description: '', source: 'NRK' };
    expect(pickBestEntry([unknown])).toBe(unknown);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/lib/rss.test.ts --no-coverage
```

Expected: `Cannot find module '@/lib/rss'`

- [ ] **Step 3: Create `src/lib/rss.ts`**

```typescript
import * as cheerio from 'cheerio';
import type { RssEntry, Source } from '@/types';

const RSS_FEEDS: Record<Source, string> = {
  NRK: 'https://www.nrk.no/nyheter/rss/',
  VG: 'https://www.vg.no/rss/feed/frontpage/',
  Aftenposten: 'https://www.aftenposten.no/rss/aftenposten.rss',
};

const SOURCE_PRIORITY: Source[] = ['NRK', 'VG', 'Aftenposten'];

export async function fetchFeed(source: Source): Promise<RssEntry[]> {
  const response = await fetch(RSS_FEEDS[source], {
    headers: { 'User-Agent': 'NorskNewsAgent/1.0' },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`RSS fetch failed for ${source}: ${response.status}`);

  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const entries: RssEntry[] = [];
  $('item').each((_, el) => {
    const title = $(el).find('title').first().text().trim();
    const link =
      $(el).find('link').first().text().trim() ||
      $(el).find('link').attr('href') ||
      '';
    const description = $(el).find('description').first().text().trim();
    if (title && link) {
      entries.push({ title, link, description, source });
    }
  });
  return entries;
}

export async function fetchAllFeeds(): Promise<RssEntry[]> {
  const results = await Promise.allSettled(
    SOURCE_PRIORITY.map(source => fetchFeed(source))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<RssEntry[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

export function filterByTopic(entries: RssEntry[], topic: string): RssEntry[] {
  const lower = topic.toLowerCase();
  return entries.filter(
    e =>
      e.title.toLowerCase().includes(lower) ||
      e.description.toLowerCase().includes(lower)
  );
}

export function pickBestEntry(entries: RssEntry[]): RssEntry | null {
  if (entries.length === 0) return null;
  for (const source of SOURCE_PRIORITY) {
    const match = entries.find(e => e.source === source);
    if (match) return match;
  }
  return entries[0];
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/lib/rss.test.ts --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rss.ts __tests__/lib/rss.test.ts
git commit -m "feat: add RSS module with fetch, filter, and pick functions"
```

---

## Task 4: Scraper Module + Tests

**Files:**
- Create: `src/lib/scraper.ts`
- Create: `__tests__/lib/scraper.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/scraper.test.ts`:

```typescript
import { extractText } from '@/lib/scraper';

describe('extractText', () => {
  it('extracts paragraph text from an article element', () => {
    const html = `
      <html><body>
        <article>
          <p>Dette er en lang nok paragraf til å bli inkludert i resultatet fra scraperen.</p>
          <p>Dette er en annen paragraf med nok innhold for at den skal passere tegnsgrensen.</p>
        </article>
      </body></html>
    `;
    const result = extractText(html);
    expect(result).toContain('Dette er en lang nok paragraf');
    expect(result).toContain('Dette er en annen paragraf');
  });

  it('excludes nav, header, footer, and script elements', () => {
    const html = `
      <html><body>
        <nav>Navigasjon</nav>
        <header>Topp</header>
        <article>
          <p>Dette er artikkelinnhold som er langt nok til å bli tatt med i resultatet.</p>
        </article>
        <footer>Bunn</footer>
        <script>alert(1)</script>
      </body></html>
    `;
    const result = extractText(html);
    expect(result).not.toContain('Navigasjon');
    expect(result).not.toContain('Topp');
    expect(result).not.toContain('Bunn');
    expect(result).toContain('artikkelinnhold');
  });

  it('filters out paragraphs shorter than 40 characters', () => {
    const html = `
      <html><body>
        <article>
          <p>Kort.</p>
          <p>Dette er en paragraf som er lang nok til å bli inkludert i det endelige resultatet fra scraperen.</p>
        </article>
      </body></html>
    `;
    const result = extractText(html);
    expect(result).not.toContain('Kort.');
    expect(result).toContain('lang nok til å bli inkludert');
  });

  it('returns empty string when no meaningful content found', () => {
    const html = '<html><body><div class="paywall">Abonner for å lese</div></body></html>';
    expect(extractText(html)).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/lib/scraper.test.ts --no-coverage
```

Expected: `Cannot find module '@/lib/scraper'`

- [ ] **Step 3: Create `src/lib/scraper.ts`**

```typescript
import * as cheerio from 'cheerio';

const SELECTORS = [
  'article p',
  '[class*="article-body"] p',
  '[class*="article-text"] p',
  '[class*="content-body"] p',
  'main p',
];

export function extractText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, aside, [class*="ad-"], [class*="menu"], [class*="paywall"]').remove();

  for (const selector of SELECTORS) {
    const paragraphs: string[] = [];
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) paragraphs.push(text);
    });
    const joined = paragraphs.join('\n\n');
    if (joined.length > 200) return joined;
  }
  return '';
}

export async function fetchArticleText(url: string): Promise<{ text: string; truncated: boolean }> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NorskNewsAgent/1.0' },
    });
    if (!response.ok) return { text: '', truncated: true };
    const html = await response.text();
    const text = extractText(html);
    return { text, truncated: text.length < 200 };
  } catch {
    return { text: '', truncated: true };
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/lib/scraper.test.ts --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scraper.ts __tests__/lib/scraper.test.ts
git commit -m "feat: add scraper module for HTML article text extraction"
```

---

## Task 5: Claude Module

**Files:**
- Create: `src/lib/claude.ts`

No unit test for this module — it wraps the Anthropic SDK and would require mocking the entire SDK. Integration is covered by the API route in Task 6.

- [ ] **Step 1: Create `src/lib/claude.ts`**

```typescript
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
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/claude.ts
git commit -m "feat: add Claude module with tool-use structured output"
```

---

## Task 6: API Route

**Files:**
- Create: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Create `src/app/api/analyze/route.ts`**

```typescript
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
```

- [ ] **Step 2: Manually test the route**

Make sure `.env.local` has a valid `ANTHROPIC_API_KEY`, then:

```bash
npm run dev
```

In a second terminal:

```bash
curl "http://localhost:3000/api/analyze?topic=klima"
```

Expected: JSON with `article` and `card` fields, or a 404 if no matching RSS entry today.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: add GET /api/analyze route"
```

---

## Task 7: Home Page + TopicInput Component + Tests

**Files:**
- Create: `src/components/TopicInput.tsx`
- Create: `src/app/page.tsx`
- Create: `__tests__/components/TopicInput.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/TopicInput.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import TopicInput from '@/components/TopicInput';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe('TopicInput', () => {
  it('renders text input and submit button', () => {
    render(<TopicInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /søk/i })).toBeInTheDocument();
  });

  it('disables button when input is empty', () => {
    render(<TopicInput />);
    expect(screen.getByRole('button', { name: /søk/i })).toBeDisabled();
  });

  it('enables button when input has text', () => {
    render(<TopicInput />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'klima' } });
    expect(screen.getByRole('button', { name: /søk/i })).not.toBeDisabled();
  });

  it('navigates to /results?topic=<value> on form submit', () => {
    render(<TopicInput />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'klima' } });
    fireEvent.submit(screen.getByRole('button', { name: /søk/i }).closest('form')!);
    expect(mockPush).toHaveBeenCalledWith('/results?topic=klima');
  });

  it('does not navigate when input is only whitespace', () => {
    render(<TopicInput />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: /søk/i }).closest('form')!);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/components/TopicInput.test.tsx --no-coverage
```

Expected: `Cannot find module '@/components/TopicInput'`

- [ ] **Step 3: Create `src/components/TopicInput.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TopicInput() {
  const [topic, setTopic] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;
    router.push(`/results?topic=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Skriv inn et tema... (f.eks. klima)"
        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        type="submit"
        disabled={!topic.trim()}
        className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Søk
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create `src/app/page.tsx`**

```typescript
import TopicInput from '@/components/TopicInput';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Norsk Nyhetsagent
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Lær norsk gjennom aktuelle nyheter
        </p>
        <TopicInput />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx jest __tests__/components/TopicInput.test.tsx --no-coverage
```

Expected: all tests pass.

- [ ] **Step 6: Check in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify: input renders, button is disabled when empty, typing enables it.

- [ ] **Step 7: Commit**

```bash
git add src/components/TopicInput.tsx src/app/page.tsx __tests__/components/TopicInput.test.tsx
git commit -m "feat: add home page and TopicInput component"
```

---

## Task 8: ArticleCard Component

**Files:**
- Create: `src/components/ArticleCard.tsx`

No automated test for this component — its behaviour is render-only with no logic beyond toggling quiz visibility, which is covered by Task 9's QuizModal tests. Verified manually in Task 10.

- [ ] **Step 1: Create `src/components/ArticleCard.tsx`**

```typescript
'use client';

import { useState } from 'react';
import QuizModal from './QuizModal';
import type { AnalyzeResponse } from '@/types';

export default function ArticleCard({ data }: { data: AnalyzeResponse }) {
  const { article, card } = data;
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Source badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
        >
          {article.source} ↗
        </a>
        {article.truncated && (
          <span className="text-xs text-gray-400 italic">Forkortet artikkel</span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 leading-snug">{article.title}</h2>

      {/* Summary */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Sammendrag (B1–B2)
        </h3>
        <p className="text-gray-700 leading-relaxed">{card.summary}</p>
      </section>

      {/* Vocabulary */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Nøkkelord
        </h3>
        <ul className="space-y-3">
          {card.vocabulary.map((item, i) => (
            <li key={i} className="bg-amber-50 rounded-lg px-4 py-3">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-gray-900">{item.word}</span>
                <span className="text-amber-700 text-sm">— {item.englishGloss}</span>
              </div>
              <p className="text-gray-600 text-sm">{item.norwegianExplanation}</p>
              {item.exampleSentence && (
                <p className="text-gray-400 text-sm italic mt-1">«{item.exampleSentence}»</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Grammar note */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Grammatikk
        </h3>
        <blockquote className="border-l-4 border-blue-200 pl-4 text-gray-600 italic mb-2">
          «{card.grammarNote.sentence}»
        </blockquote>
        <p className="text-gray-600 text-sm">{card.grammarNote.explanation}</p>
      </section>

      {/* Quiz button */}
      <button
        onClick={() => setQuizOpen(true)}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
      >
        Quiz meg på ordene
      </button>

      {quizOpen && (
        <QuizModal
          questions={card.quizQuestions}
          vocabulary={card.vocabulary}
          onClose={() => setQuizOpen(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. (QuizModal doesn't exist yet — create a stub if needed. See Task 9 Step 1.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ArticleCard.tsx
git commit -m "feat: add ArticleCard component"
```

---

## Task 9: QuizModal Component + Tests

**Files:**
- Create: `src/components/QuizModal.tsx`
- Create: `__tests__/components/QuizModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/components/QuizModal.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import QuizModal from '@/components/QuizModal';
import type { QuizQuestion, VocabularyItem } from '@/types';

const mockQuestions: QuizQuestion[] = [
  {
    word: 'bærekraftig',
    correct: 'sustainable',
    distractors: ['renewable', 'responsible', 'natural'],
  },
  {
    word: 'klimagassutslipp',
    correct: 'greenhouse gas emissions',
    distractors: ['air pollution', 'carbon tax', 'fossil fuels'],
  },
];

const mockVocab: VocabularyItem[] = [
  {
    word: 'bærekraftig',
    englishGloss: 'sustainable',
    norwegianExplanation: 'Noe som er holdbart over tid.',
    exampleSentence: 'En bærekraftig løsning er viktig.',
  },
  {
    word: 'klimagassutslipp',
    englishGloss: 'greenhouse gas emissions',
    norwegianExplanation: 'Gasser som bidrar til klimaendringer.',
    exampleSentence: 'Vi må redusere klimagassutslippene.',
  },
];

describe('QuizModal', () => {
  it('renders the first question', () => {
    render(
      <QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={jest.fn()} />
    );
    expect(screen.getByText(/hva betyr «bærekraftig»/i)).toBeInTheDocument();
    expect(screen.getByText('Spørsmål 1 av 2')).toBeInTheDocument();
  });

  it('shows all four answer choices', () => {
    render(
      <QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={jest.fn()} />
    );
    expect(screen.getByText('sustainable')).toBeInTheDocument();
    expect(screen.getByText('renewable')).toBeInTheDocument();
    expect(screen.getByText('responsible')).toBeInTheDocument();
    expect(screen.getByText('natural')).toBeInTheDocument();
  });

  it('shows the vocabulary explanation after selecting an answer', () => {
    render(
      <QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={jest.fn()} />
    );
    fireEvent.click(screen.getByText('sustainable'));
    expect(screen.getByText('Noe som er holdbart over tid.')).toBeInTheDocument();
  });

  it('disables further selection after an answer is chosen', () => {
    render(
      <QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={jest.fn()} />
    );
    fireEvent.click(screen.getByText('sustainable'));
    fireEvent.click(screen.getByText('renewable'));
    // renewable should not become selected — only one selection allowed
    expect(screen.queryByText('Neste →')).toBeInTheDocument();
  });

  it('advances to next question after clicking Neste', () => {
    render(
      <QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={jest.fn()} />
    );
    fireEvent.click(screen.getByText('sustainable'));
    fireEvent.click(screen.getByText('Neste →'));
    expect(screen.getByText(/hva betyr «klimagassutslipp»/i)).toBeInTheDocument();
    expect(screen.getByText('Spørsmål 2 av 2')).toBeInTheDocument();
  });

  it('shows score screen after last question', () => {
    render(
      <QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={jest.fn()} />
    );
    fireEvent.click(screen.getByText('sustainable'));
    fireEvent.click(screen.getByText('Neste →'));
    fireEvent.click(screen.getByText('greenhouse gas emissions'));
    fireEvent.click(screen.getByText(/se resultatet/i));
    expect(screen.getByText(/du fikk 2 av 2/i)).toBeInTheDocument();
  });

  it('calls onClose when Søk nytt tema is clicked after quiz', () => {
    const onClose = jest.fn();
    render(<QuizModal questions={mockQuestions} vocabulary={mockVocab} onClose={onClose} />);
    fireEvent.click(screen.getByText('sustainable'));
    fireEvent.click(screen.getByText('Neste →'));
    fireEvent.click(screen.getByText('greenhouse gas emissions'));
    fireEvent.click(screen.getByText(/se resultatet/i));
    fireEvent.click(screen.getByText('Søk nytt tema'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/components/QuizModal.test.tsx --no-coverage
```

Expected: `Cannot find module '@/components/QuizModal'`

- [ ] **Step 3: Create `src/components/QuizModal.tsx`**

```typescript
'use client';

import { useState, useMemo } from 'react';
import type { QuizQuestion, VocabularyItem } from '@/types';

interface Choice {
  label: string;
  text: string;
  correct: boolean;
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildChoices(q: QuizQuestion): Choice[] {
  const all = [
    { text: q.correct, correct: true },
    ...q.distractors.map(d => ({ text: d, correct: false })),
  ];
  const labels = ['A', 'B', 'C', 'D'];
  return shuffled(all).map((c, i) => ({ ...c, label: labels[i] }));
}

export default function QuizModal({
  questions,
  vocabulary,
  onClose,
}: {
  questions: QuizQuestion[];
  vocabulary: VocabularyItem[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const choices = useMemo(() => buildChoices(questions[current]), [current, questions]);
  const q = questions[current];
  const vocabItem = vocabulary.find(v => v.word === q.word);

  function handleSelect(choice: Choice) {
    if (selected !== null) return;
    setSelected(choice.text);
    if (choice.correct) setScore(s => s + 1);
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  }

  if (finished) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className={`text-2xl font-bold mb-4 ${score === questions.length ? 'text-emerald-600' : 'text-blue-600'}`}>
            {score === questions.length ? 'Perfekt!' : score >= questions.length / 2 ? 'Bra jobba!' : 'Fortsett å øve!'}
          </div>
          <h2 className="text-2xl font-bold mb-2">Du fikk {score} av {questions.length}!</h2>
          <p className="text-gray-500 mb-6">
            {score === questions.length
              ? 'Perfekt! Flott jobba!'
              : 'Fortsett å øve — du blir bedre!'}
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Søk nytt tema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Spørsmål {current + 1} av {questions.length}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold mb-5">Hva betyr «{q.word}»?</h2>

        {/* Choices */}
        <div className="space-y-2 mb-4">
          {choices.map(choice => {
            let className =
              'w-full text-left border rounded-lg px-4 py-3 transition-colors flex items-center gap-3 ';
            if (selected === null) {
              className += 'border-gray-200 bg-white hover:border-blue-300 cursor-pointer';
            } else if (choice.correct) {
              className += 'border-emerald-500 bg-emerald-50 text-emerald-800';
            } else if (choice.text === selected) {
              className += 'border-red-400 bg-red-50 text-red-700';
            } else {
              className += 'border-gray-200 bg-white opacity-50';
            }
            return (
              <button key={choice.label} onClick={() => handleSelect(choice)} className={className}>
                <span className="font-semibold text-sm w-5 shrink-0">{choice.label}</span>
                <span>{choice.text}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {selected && vocabItem && (
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800 mb-4">
            {vocabItem.norwegianExplanation}
          </div>
        )}

        {/* Next button */}
        {selected && (
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {current + 1 >= questions.length ? 'Se resultatet' : 'Neste →'}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/components/QuizModal.test.tsx --no-coverage
```

Expected: all tests pass. Note: `shuffled` is random, so choice positions vary — tests use `getByText` not position.

- [ ] **Step 5: Run the full test suite**

```bash
npm test -- --no-coverage
```

Expected: all tests across all files pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/QuizModal.tsx __tests__/components/QuizModal.test.tsx
git commit -m "feat: add QuizModal component with one-at-a-time quiz flow"
```

---

## Task 10: Results Page

**Files:**
- Create: `src/app/results/page.tsx`

- [ ] **Step 1: Create `src/app/results/page.tsx`**

```typescript
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
```

- [ ] **Step 2: Smoke test the full golden path**

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Type `klima` and press Søk
3. Verify loading skeleton appears, then the article card renders with summary, 5 vocabulary items, grammar note, and the Quiz button
4. Click "Quiz meg på ordene" — verify quiz modal opens with a question and 4 choices
5. Select an answer — verify correct/wrong highlighting and explanation appear
6. Click "Neste →" through all 5 questions
7. Verify score screen shows "Du fikk X av 5!"
8. Click "Søk nytt tema" — verify modal closes

- [ ] **Step 3: Test error path**

Navigate to `http://localhost:3000/results?topic=xxxxxxxxnotarealthing`

Expected: error card with "Fant ingen artikler om «xxxxxxxxnotarealthing»"

- [ ] **Step 4: Commit**

```bash
git add src/app/results/page.tsx
git commit -m "feat: add results page with server-side data fetching"
```

---

## Task 11: Deployment Prep

**Files:**
- No new source files — configuration and environment only

- [ ] **Step 1: Confirm production build succeeds**

```bash
npm run build
```

Expected: build completes with no TypeScript or lint errors.

- [ ] **Step 2: Run full test suite one final time**

```bash
npm test -- --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3: Add `ANTHROPIC_API_KEY` to Vercel**

In the Vercel dashboard (or via CLI):

```bash
npx vercel env add ANTHROPIC_API_KEY
```

Paste your key when prompted. Select Production, Preview, and Development environments.

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```

Expected: deployment URL printed. Open it and run the golden path test from Task 10 Step 2.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify build and prepare for Vercel deployment"
```
