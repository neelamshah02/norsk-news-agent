'use client';

import { useState } from 'react';
import QuizModal from './QuizModal';
import type { AnalyzeResponse } from '@/types';

export default function ArticleCard({ data }: { data: AnalyzeResponse }) {
  const { article, card } = data;
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
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

      <h2 className="text-xl font-bold text-gray-900 leading-snug">{article.title}</h2>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Sammendrag (B1–B2)
        </h3>
        <p className="text-gray-700 leading-relaxed">{card.summary}</p>
      </section>

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

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Grammatikk
        </h3>
        <blockquote className="border-l-4 border-blue-200 pl-4 text-gray-600 italic mb-2">
          «{card.grammarNote.sentence}»
        </blockquote>
        <p className="text-gray-600 text-sm">{card.grammarNote.explanation}</p>
      </section>

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
