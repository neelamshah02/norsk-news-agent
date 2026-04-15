'use client';

import { useState } from 'react';
import QuizModal from './QuizModal';
import type { AnalyzeResponse } from '@/types';

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'nb-NO';
  window.speechSynthesis.speak(utterance);
}

export default function ArticleCard({ data }: { data: AnalyzeResponse }) {
  const { card, article } = data;
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div className="mt-4 space-y-6 border-t border-gray-100 pt-4">
      {article.truncated && (
        <p className="text-xs text-amber-600 italic">
          Merk: artikkelen ble delvis hentet. Kortkortet er basert på begrenset tekst.
        </p>
      )}

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
          {card.vocabulary.map((item) => (
            <li key={item.word} className="bg-amber-50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-gray-900">{item.word}</span>
                <span className="text-amber-700 text-sm">— {item.englishGloss}</span>
                <button
                  type="button"
                  onClick={() => speak(item.word)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label={`Uttale ${item.word}`}
                >
                  🔊
                </button>
              </div>
              <p className="text-gray-600 text-sm">{item.norwegianExplanation}</p>
              {item.exampleSentence && (
                <p className="text-gray-400 text-sm italic mt-1">
                  «{item.exampleSentence}»
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Grammatikk
        </h3>
        <div className="flex items-start gap-2">
          <blockquote className="flex-1 border-l-4 border-blue-200 pl-4 text-gray-600 italic mb-2">
            «{card.grammarNote.sentence}»
          </blockquote>
          <button
            type="button"
            onClick={() => speak(card.grammarNote.sentence)}
            className="text-gray-400 hover:text-blue-600 transition-colors mt-1 shrink-0"
            aria-label="Uttale setningen"
          >
            🔊
          </button>
        </div>
        <p className="text-gray-600 text-sm">{card.grammarNote.explanation}</p>
      </section>

      <button
        type="button"
        onClick={() => setQuizOpen(true)}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
      >
        Quiz meg på ordene
      </button>

      {quizOpen && (
        <QuizModal
          questions={card.quizQuestions}
          onClose={() => setQuizOpen(false)}
        />
      )}
    </div>
  );
}
