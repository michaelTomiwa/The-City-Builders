"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { checkIn, undoCheckIn } from "@/app/me/actions";
import { bibleLink, stepKinds, type Checkin, type Step } from "@/lib/discipleship";
import { cn } from "@/lib/utils";
import { KindIcon } from "./kind-icon";

/** One daily step. Tap the circle to mark it done; add a note on what God showed you. */
export function StepCard({
  step,
  done,
  locked = false,
  programTitle,
}: {
  step: Step;
  done: Checkin | null;
  locked?: boolean;
  programTitle?: string;
}) {
  const [isDone, setDone] = useOptimistic(Boolean(done));
  const [pending, start] = useTransition();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(done?.note ?? "");
  const [shared, setShared] = useState(done?.shared ?? false);
  const [saved, setSaved] = useState(false);
  const kind = stepKinds[step.kind] ?? stepKinds.custom;

  function toggle() {
    if (locked) return;
    start(async () => {
      setDone(!isDone);
      if (isDone) await undoCheckIn(step.id);
      else {
        await checkIn({ stepId: step.id, programId: step.program_id, note, shared });
        setNoteOpen(true);
      }
    });
  }

  function saveNote() {
    start(async () => {
      await checkIn({ stepId: step.id, programId: step.program_id, note, shared });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <motion.li
      layout
      className={cn(
        "rounded-md border bg-white p-4 transition-colors sm:p-5",
        isDone ? "border-[#bfe0c8] bg-[#f6fbf7]" : "border-steel",
        locked && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <KindIcon kind={step.kind} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: kind.color === "#f0b44c" ? "#a8730f" : kind.color }}>
            {kind.label}
            {step.minutes ? ` · ${step.minutes} min` : ""}
            {programTitle ? <span className="normal-case tracking-normal text-paper-dim"> · {programTitle}</span> : null}
          </p>
          <p className={cn("mt-0.5 font-medium leading-snug text-paper", isDone && "text-paper-dim line-through decoration-[#5fb38a]/60")}>
            {step.title}
          </p>
          {step.details && <p className="mt-1.5 text-sm leading-relaxed text-paper-dim">{step.details}</p>}
          {step.scripture && (
            <a
              href={bibleLink(step.scripture)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-dusk px-3 py-1 text-sm text-gold-text hover:bg-gold/15"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" />
              </svg>
              Read {step.scripture}
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={locked || pending}
          aria-pressed={isDone}
          aria-label={isDone ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
          title={locked ? "Opens on its day" : undefined}
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            isDone ? "border-[#3d9a6a] bg-[#3d9a6a] text-white" : "border-steel text-transparent hover:border-[#3d9a6a] hover:text-[#3d9a6a]/40"
          )}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <AnimatePresence>
            {isDone && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0.7 }}
                animate={{ scale: 1.9, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-full bg-[#3d9a6a]"
              />
            )}
          </AnimatePresence>
        </button>
      </div>

      {isDone && (
        <div className="mt-3 pl-14">
          {noteOpen || done?.note ? (
            <div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="What did God show you? (optional)"
                className="w-full resize-y rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-paper-dim">
                  <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="accent-gold" />
                  Share this with the pastor
                </label>
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={pending || !note.trim()}
                  className="rounded-sm bg-paper px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  {saved ? "Saved" : "Save note"}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setNoteOpen(true)} className="text-sm text-gold-text hover:underline">
              Add a note
            </button>
          )}
        </div>
      )}
    </motion.li>
  );
}
