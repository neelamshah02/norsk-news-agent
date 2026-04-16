'use client';

import { useState, useEffect, useRef } from 'react';
import type { QuizQuestion } from '@/types';

interface Props {
  questions: QuizQuestion[];
  onClose: () => void;
}

export default function QuizModal({ questions, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [options] = useState(() =>
    questions.map(q => [q.correct, ...q.distractors].sort(() => Math.random() - 0.5))
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = questions[current];

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSelect(option: string) {
    if (selected !== null) return;
    setSelected(option);
    if (option === q.correct) setScore(s => s + 1);
    timerRef.current = setTimeout(() => {
      if (current + 1 >= questions.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
      }
    }, 800);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4" role="dialog" aria-modal="true" aria-labelledby="quiz-heading">
        {done ? (
          <>
            <h3 id="quiz-heading" className="text-xl font-bold text-center">
              {score} av {questions.length} riktig
            </h3>
            <p className="text-center text-gray-500">
              {score === questions.length
                ? 'Perfekt! 🎉'
                : score >= Math.ceil(questions.length / 2)
                ? 'Bra jobbet! 👍'
                : 'Øv mer! 📚'}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Lukk
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Spørsmål {current + 1} av {questions.length}</span>
              <span>Poeng: {score}</span>
            </div>
            <h3 id="quiz-heading" className="text-xl font-bold text-center">{q.word}</h3>
            <p className="text-center text-gray-500 text-sm">
              Hva betyr dette ordet på engelsk?
            </p>
            <div className="space-y-2">
              {options[current].map((option) => {
                let cls =
                  'w-full text-left px-4 py-3 rounded-lg border transition-colors ';
                if (selected === null) {
                  cls += 'border-gray-200 hover:border-blue-400 hover:bg-blue-50';
                } else if (option === q.correct) {
                  cls += 'border-emerald-500 bg-emerald-50 text-emerald-700';
                } else if (option === selected) {
                  cls += 'border-red-400 bg-red-50 text-red-700';
                } else {
                  cls += 'border-gray-200 text-gray-400';
                }
                return (
                  <button key={option} onClick={() => handleSelect(option)} className={cls}>
                    {option}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
