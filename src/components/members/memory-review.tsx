"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { reviewMemoryVerse } from "@/app/me/actions";

type Card = { id: string; ref: string; text: string; box: number };

/** Flashcards: see the reference, say the verse, flip to check. Verses you know come back less often. */
export function MemoryReview({ cards }: { cards: Card[] }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [, start] = useTransition();
  const card = queue[0];

  function answer(knew: boolean) {
    if (!card) return;
    start(() => reviewMemoryVerse(card.id, knew));
    setFlipped(false);
    setDone((d) => d + 1);
    setQueue((q) => q.slice(1));
  }

  if (!card) {
    return (
      <div className="rounded-md border border-[#bfe0c8] bg-[#eef8f0] p-8 text-center">
        <p className="font-display text-3xl text-[#24613a]">{done > 0 ? "All reviewed. Well done." : "Nothing to review today."}</p>
        <p className="mt-2 text-paper-dim">Verses come back just before you&rsquo;d forget them.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-paper-dim">
        {queue.length} to review{done ? ` · ${done} done` : ""}
      </p>
      <AnimatePresence mode="wait">
        <motion.button
          key={card.id + String(flipped)}
          type="button"
          onClick={() => setFlipped(true)}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="on-night mt-3 flex min-h-56 w-full flex-col items-center justify-center rounded-md bg-night p-8 text-center text-starlight shadow-[0_20px_60px_-25px_rgba(16,28,58,0.8)]"
        >
          <span className="font-display text-3xl text-lamp">{card.ref}</span>
          {flipped ? (
            <span className="mt-4 max-w-xl font-serif text-xl leading-relaxed">{card.text}</span>
          ) : (
            <span className="mt-4 text-sm text-starlight-dim">Say it from memory, then tap to check</span>
          )}
        </motion.button>
      </AnimatePresence>
      {flipped && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => answer(false)} className="h-12 border border-steel bg-white text-paper hover:border-[#c2492f]">
            Not yet
          </button>
          <button type="button" onClick={() => answer(true)} className="h-12 bg-[#3d9a6a] font-medium text-white hover:bg-[#33845a]">
            I knew it
          </button>
        </div>
      )}
    </div>
  );
}
