# Norsk News Agent — Design Spec

**Date:** 2026-04-14  
**Status:** Approved

---

## Overview

A web app where a user types a Norwegian topic (e.g. "klima", "politikk", "teknologi") and receives an article card that supports language learning at B1–B2 CEFR level. The card includes a Norwegian summary, five key vocabulary words with bilingual definitions, and a grammar note on one interesting sentence. The user can optionally take a multiple-choice vocabulary quiz drawn from that session's article.

---

## Constraints & Decisions

- **Deployment:** Vercel (public, no auth required)
- **State:** Stateless — no database, no user accounts, no persistent quiz history
- **Stack:** Next.js (App Router) + Tailwind CSS
- **News fetching:** RSS feeds from NRK, VG, and Aftenposten — filtered by topic keyword, article text extracted with cheerio
- **AI:** Anthropic Claude API via `@anthropic-ai/sdk`; single API call per search returning structured JSON via tool use

---

## Pages

### `/` — Home
- Single text input with Norwegian placeholder ("Skriv inn et tema...")
- Submit button triggers navigation to `/results?topic=<keyword>`
- No other UI on this page

### `/results?topic=<keyword>` — Results
- Fetches `/api/analyze?topic=<keyword>` on page load
- Shows loading skeleton while waiting
- Renders `ArticleCard` on success, error card on failure
- URL is shareable — the topic is preserved in the query string

---

## Components

### `TopicInput`
Text field + search button. Submits by Enter or button click. Navigates to `/results?topic=...`.

### `ArticleCard`
Single-column card layout (Option A from design review). Sections in order:
1. **Source badge** — publication name (NRK / VG / Aftenposten) + topic label; link to original article
2. **Article title**
3. **Sammendrag (B1–B2)** — 3–5 sentence Norwegian summary at B1–B2 level
4. **Nøkkelord** — 5 vocabulary items, each showing: Norwegian word → English gloss + short Norwegian explanation + example sentence from the article
5. **Grammatikk** — one sentence from the article, highlighted in a callout, with a 2–3 sentence grammar explanation in English
6. **"Quiz meg på ordene"** button — opens `QuizModal`

### `QuizModal`
Overlays the card. One question at a time (Option A from design review):
- Progress bar (e.g. "Spørsmål 2 av 5")
- Question: "Hva betyr «word»?"
- Four answer choices (A–D); correct answer is one of the five vocabulary words' English definitions
- On selection: highlights correct choice in green, shows a brief explanation (1–2 sentences from Claude)
- "Neste →" button advances to next question
- After question 5: score screen ("Du fikk 4 av 5!") with a "Søk nytt tema" button

---

## API Route: `POST /api/analyze`

**Input:** `{ topic: string }`

**Pipeline:**
1. Fetch RSS feeds from NRK, VG, and Aftenposten in parallel (`node-fetch`)
2. Parse feeds and filter entries whose title or description contains the topic keyword (case-insensitive)
3. Pick the best-matching article (prefer NRK; fall back to VG, then Aftenposten)
4. Fetch the article URL and extract body text with cheerio
   - If extracted text < 200 characters (likely paywalled), use the RSS `<description>` as fallback; set `truncated: true` in the response
5. Call Claude API with the article text using a single tool-use call
6. Return structured JSON to the client

**Claude tool schema (`generate_language_card`):**
```json
{
  "summary": "string (3–5 sentences, B1–B2 Norwegian)",
  "vocabulary": [
    {
      "word": "string",
      "englishGloss": "string",
      "norwegianExplanation": "string",
      "exampleSentence": "string (from article)"
    }
  ],
  "grammarNote": {
    "sentence": "string (from article)",
    "explanation": "string (2–3 sentences, English)"
  },
  "quizQuestions": [
    {
      "word": "string",
      "correct": "string (English definition)",
      "distractors": ["string", "string", "string"]
    }
  ]
}
```

**System prompt:** Claude is positioned as a Norwegian language teacher. It targets B1–B2 CEFR. Vocabulary definitions are bilingual. Grammar notes focus on structures common in Norwegian news writing (passive voice, subordinate clauses, modal verbs).

**Output:** `{ article: { title, url, source, truncated }, card: { summary, vocabulary, grammarNote, quizQuestions } }`

---

## RSS Sources

| Source | Feed URL |
|---|---|
| NRK | `https://www.nrk.no/nyheter/rss/` |
| VG | `https://www.vg.no/rss/feed/frontpage/` |
| Aftenposten | `https://www.aftenposten.no/rss/aftenposten.rss` |

NRK is the preferred source — fully open, no paywall, high-quality journalism.

---

## Error Handling

| Scenario | User-facing behaviour |
|---|---|
| No RSS entry matches the topic | "Fant ingen artikler om «X» — prøv et annet søkeord" with a retry input |
| Article text too short (paywall fallback) | Card renders normally; small badge reads "Forkortet artikkel" |
| Claude API error | Error card: "Noe gikk galt. Prøv igjen." with retry button |
| All RSS feeds fail to load | Error card with friendly message, no crash |

---

## File Structure

```
norsk-news-agent/
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← Home (TopicInput)
│   │   ├── results/
│   │   │   └── page.tsx              ← Results page (ArticleCard)
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts          ← POST /api/analyze pipeline
│   ├── components/
│   │   ├── TopicInput.tsx
│   │   ├── ArticleCard.tsx
│   │   └── QuizModal.tsx
│   └── lib/
│       ├── rss.ts                    ← RSS fetch + filter
│       ├── scraper.ts                ← cheerio article extraction
│       └── claude.ts                 ← Claude API call + tool schema
├── docs/superpowers/specs/
│   └── 2026-04-14-norsk-news-agent-design.md
├── package.json
└── next.config.ts
```

---

## Out of Scope

- User accounts or saved history
- Audio pronunciation
- Grammar exercises (only a note, not interactive)
- Support for Norwegian topics in other languages (UI is Norwegian/English only)
- Mobile app
