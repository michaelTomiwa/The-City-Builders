"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addMemoryVerse, saveVerseNote, setBibleDay } from "@/app/me/actions";
import { bibleLink } from "@/lib/discipleship";
import type { Verse } from "@/lib/bible";
import { cn } from "@/lib/utils";

const colors: Record<string, string> = { gold: "bg-[#f6e3b4]", blue: "bg-[#d9e6fa]", green: "bg-[#d7efdf]", rose: "bg-[#f8dcd5]" };

type Chapter = { book: string; chapter: number; verses: Verse[] | null };

/** The day's chapters. Tap a verse to highlight it, write a note or add it to your memory verses. */
export function BibleReader({
  chapters,
  highlights,
  day,
  read,
}: {
  chapters: Chapter[];
  highlights: Record<string, string>;
  day: number;
  read: boolean;
}) {
  const [selected, setSelected] = useState<{ ref: string; text: string } | null>(null);
  const [marks, setMarks] = useState(highlights);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isRead, setRead] = useOptimistic(read);
  const [pending, start] = useTransition();

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function highlight(color: string) {
    if (!selected) return;
    const s = selected;
    setMarks((m) => ({ ...m, [s.ref]: color }));
    start(async () => {
      await saveVerseNote({ ref: s.ref, verse: s.text, note, color });
      flash(note ? "Note saved" : "Highlighted");
      setNote("");
      setSelected(null);
    });
  }

  function memorise() {
    if (!selected) return;
    const s = selected;
    start(async () => {
      await addMemoryVerse({ ref: s.ref, text: s.text });
      flash(`${s.ref} added to your memory verses`);
      setSelected(null);
    });
  }

  return (
    <div className="relative">
      {chapters.map((c) => (
        <section key={`${c.book}-${c.chapter}`} className="mt-10 first:mt-0">
          <h2 className="font-display text-3xl text-paper">
            {c.book} {c.chapter}
          </h2>
          {c.verses ? (
            <p className="mt-4 font-serif text-[1.15rem] leading-[2] text-paper">
              {c.verses.map((v) => {
                const ref = `${c.book} ${c.chapter}:${v.verse}`;
                return (
                  <span
                    key={v.verse}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected({ ref, text: v.text })}
                    onKeyDown={(e) => e.key === "Enter" && setSelected({ ref, text: v.text })}
                    className={cn(
                      "cursor-pointer rounded-sm px-0.5 transition-colors hover:bg-gold/15",
                      marks[ref] && colors[marks[ref]],
                      selected?.ref === ref && "underline decoration-gold decoration-2 underline-offset-4"
                    )}
                  >
                    <sup className="mr-1 font-sans text-[0.65rem] text-gold-text">{v.verse}</sup>
                    {v.text}{" "}
                  </span>
                );
              })}
            </p>
          ) : (
            <p className="mt-3 text-paper-dim">
              The text couldn&rsquo;t load right now.{" "}
              <a href={bibleLink(`${c.book} ${c.chapter}`)} target="_blank" rel="noopener noreferrer" className="text-gold-text underline">
                Read {c.book} {c.chapter} on Bible Gateway
              </a>
            </p>
          )}
        </section>
      ))}

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-steel pt-6">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setRead(!isRead);
              await setBibleDay(day, !isRead);
              if (!isRead) flash(`Day ${day} done. Well read.`);
            })
          }
          className={cn("h-12 px-8 font-medium transition-colors", isRead ? "border border-[#3d9a6a] bg-[#eef8f0] text-[#24613a]" : "bg-gold text-ink hover:bg-gold-soft")}
        >
          {isRead ? `✓ Day ${day} read` : `Mark day ${day} as read`}
        </button>
        <p className="text-sm text-paper-dim">Tap any verse to highlight it, add a note or memorise it.</p>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-md border border-steel bg-white p-4 shadow-[0_20px_60px_-15px_rgba(16,28,58,0.45)] sm:bottom-6"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-paper">
                <span className="font-medium text-gold-text">{selected.ref}</span> {selected.text}
              </p>
              <button type="button" onClick={() => setSelected(null)} className="text-paper-dim" aria-label="Close">
                ✕
              </button>
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="mt-3 h-10 w-full rounded-sm border border-steel px-3 text-sm text-paper outline-none focus:border-gold"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {Object.keys(colors).map((c) => (
                <button key={c} type="button" onClick={() => highlight(c)} disabled={pending} aria-label={`Highlight ${c}`} className={cn("h-8 w-8 rounded-full border border-steel", colors[c])} />
              ))}
              <span className="text-xs text-paper-dim">Highlight</span>
              <button type="button" onClick={memorise} disabled={pending} className="ml-auto rounded-sm bg-paper px-3 py-1.5 text-sm font-medium text-white">
                Memorise this verse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-paper px-4 py-2 text-sm text-white shadow-lg"
            role="status"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
