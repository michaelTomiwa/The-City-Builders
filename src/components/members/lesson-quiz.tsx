"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { completeLesson } from "@/app/me/actions";
import { cn } from "@/lib/utils";

type Result = { score: number; total: number; passed: boolean; correct: number[]; explanations: string[] };

/** The lesson quiz, graded on the server. 70% passes; members can try again. */
export function LessonQuiz({
  lessonId,
  questions,
  passedBefore,
  nextHref,
  nextLabel,
}: {
  lessonId: string;
  questions: { id: string; question: string; options: string[] }[];
  passedBefore: { score: number; total: number } | null;
  nextHref: string;
  nextLabel: string;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      try {
        setResult(await completeLesson(lessonId, answers.map((a) => a ?? -1)));
      } catch {
        setError("Couldn't save that. Please try again.");
      }
    });
  }

  const next = (
    <Link href={nextHref} className="inline-flex h-11 items-center bg-gold px-6 font-medium text-ink hover:bg-gold-soft">
      {nextLabel}
    </Link>
  );

  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-steel bg-white p-6">
        {passedBefore || result?.passed ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-medium text-[#24613a]">Lesson complete.</p>
            {next}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-paper">Finished reading? Mark this lesson complete.</p>
            <button type="button" onClick={submit} disabled={pending} className="h-11 bg-gold px-6 font-medium text-ink hover:bg-gold-soft disabled:opacity-60">
              {pending ? "Saving…" : "Mark complete"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const answered = answers.every((a) => a !== null);

  return (
    <section className="rounded-md border border-steel bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-3xl text-paper">Check your understanding</h2>
        {passedBefore && !result && (
          <span className="text-sm text-[#24613a]">
            Passed before: {passedBefore.score}/{passedBefore.total}
          </span>
        )}
      </div>
      <ol className="mt-6 space-y-7">
        {questions.map((q, qi) => (
          <li key={q.id}>
            <p className="font-medium text-paper">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 grid gap-2">
              {q.options.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const right = result && result.correct[qi] === oi;
                const wrong = result && chosen && result.correct[qi] !== oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={Boolean(result)}
                    onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                    className={cn(
                      "flex items-center gap-3 rounded-sm border px-4 py-3 text-left transition-colors",
                      right ? "border-[#3d9a6a] bg-[#eef8f0] text-paper" : wrong ? "border-[#c2492f] bg-[#fbefec] text-paper" : chosen ? "border-gold bg-gold/10 text-paper" : "border-steel text-paper hover:border-gold"
                    )}
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs", chosen ? "border-gold bg-gold text-ink" : "border-steel text-paper-dim")}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>
            {result?.explanations[qi] && <p className="mt-2 text-sm text-paper-dim">{result.explanations[qi]}</p>}
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 text-sm text-[#8a2f1e]">{error}</p>}

      {!result ? (
        <button
          type="button"
          onClick={submit}
          disabled={!answered || pending}
          className="mt-8 h-12 w-full bg-gold font-medium text-ink hover:bg-gold-soft disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {pending ? "Checking…" : answered ? "Check my answers" : "Answer every question"}
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-8 rounded-md p-5", result.passed ? "bg-[#eef8f0]" : "bg-[#fbefec]")}>
          <p className={cn("font-display text-2xl", result.passed ? "text-[#24613a]" : "text-[#8a2f1e]")}>
            {result.score} of {result.total} correct. {result.passed ? "Well done, lesson complete." : "Not quite. Read through again and retry."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {result.passed ? (
              next
            ) : (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers(questions.map(() => null));
                }}
                className="h-11 border border-steel bg-white px-6 text-paper hover:border-gold"
              >
                Try again
              </button>
            )}
          </div>
        </motion.div>
      )}
    </section>
  );
}
