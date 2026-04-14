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
              ? 'Flott jobba!'
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

        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>

        <h2 className="text-xl font-bold mb-5">Hva betyr «{q.word}»?</h2>

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

        {selected && vocabItem && (
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800 mb-4">
            {vocabItem.norwegianExplanation}
          </div>
        )}

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
