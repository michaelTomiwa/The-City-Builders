"use client";

import { useState } from "react";
import { verses } from "@/lib/verses";

export function ScriptureFlashcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1) % verses.length);
  }

  const verse = verses[index];

  return (
    <div>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex h-48 w-full flex-col items-center justify-center rounded-sm border border-steel bg-midnight px-6 text-center transition-colors hover:border-gold sm:h-56"
      >
        {flipped ? (
          <p className="font-display text-xl leading-snug text-paper">
            &ldquo;{verse.text}&rdquo;
          </p>
        ) : (
          <p className="font-display text-2xl text-gold-text">{verse.reference}</p>
        )}
        <span className="mt-4 text-xs text-paper-dim">
          {flipped ? "Tap to hide" : "Tap to reveal"}
        </span>
      </button>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-paper-dim">
          Card {index + 1} of {verses.length}
        </p>
        <button
          onClick={next}
          className="text-sm text-gold-text hover:text-ink"
        >
          Next card
        </button>
      </div>
    </div>
  );
}
