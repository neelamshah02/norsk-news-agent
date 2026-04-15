export type Source = 'NRK' | 'VG' | 'Aftenposten';

export interface RssEntry {
  title: string;
  link: string;
  description?: string;
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
