"use client";

import { useState, useTransition } from "react";
import { tickWeekItem } from "@/app/me/week-actions";
import { cn } from "@/lib/utils";

export type ChecklistItem = { id: string; title: string; details: string | null; group: string; personal: boolean };

/** The week's items with big tick boxes; ticking saves straight away, and a note can be added. */
export function WeekChecklist({
  items,
  ticked,
  removeAction,
}: {
  items: ChecklistItem[];
  ticked: Record<string, string | null>;
  removeAction?: (fd: FormData) => void;
}) {
  const [done, setDone] = useState<Record<string, string | null>>(ticked);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const groups = [...new Set(items.map((i) => i.group))];

  function toggle(id: string) {
    const was = id in done;
    setError(null);
    setDone((d) => {
      const next = { ...d };
      if (was) delete next[id];
      else next[id] = null;
      return next;
    });
    if (!was) setNoteFor(id);
    start(async () => {
      const r = await tickWeekItem(id, !was);
      if (r?.error) {
        setError(r.error);
        setDone((d) => {
          const next = { ...d };
          if (was) next[id] = null;
          else delete next[id];
          return next;
        });
      }
    });
  }

  function saveNote(id: string, note: string) {
    setDone((d) => ({ ...d, [id]: note || null }));
    setNoteFor(null);
    start(async () => {
      await tickWeekItem(id, true, note);
    });
  }

  return (
    <div className="space-y-8">
      {error && <p className="rounded-sm bg-[#fbefec] px-3 py-2 text-sm text-[#8a2f1e]">{error}</p>}
      {groups.map((g) => (
        <section key={g}>
          <h3 className="text-sm font-medium text-gold-text">{g}</h3>
          <ul className="mt-3 space-y-2.5">
            {items
              .filter((i) => i.group === g)
              .map((item) => {
                const isDone = item.id in done;
                return (
                  <li key={item.id} className={cn("rounded-md border bg-white p-4 transition-colors", isDone ? "border-[#bfe0c8] bg-[#f4faf5]" : "border-steel")}>
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-pressed={isDone}
                        aria-label={isDone ? `Untick ${item.title}` : `Tick ${item.title}`}
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          isDone ? "scale-105 border-[#3d9a6a] bg-[#3d9a6a] text-white" : "border-steel bg-white hover:border-gold"
                        )}
                      >
                        {isDone && (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                            <path d="M5 12l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[1.05rem] leading-snug", isDone ? "text-paper-dim line-through decoration-[#3d9a6a]/60" : "text-paper")}>{item.title}</p>
                        {item.details && <p className="mt-1 text-sm leading-relaxed text-paper-dim">{item.details}</p>}
                        {isDone && done[item.id] && noteFor !== item.id && (
                          <button type="button" onClick={() => setNoteFor(item.id)} className="mt-1.5 text-left text-sm text-[#24613a]">
                            &ldquo;{done[item.id]}&rdquo;
                          </button>
                        )}
                        {isDone && noteFor === item.id && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveNote(item.id, String(new FormData(e.currentTarget).get("note") ?? "").trim());
                            }}
                            className="mt-2 flex gap-2"
                          >
                            <input
                              name="note"
                              autoFocus
                              defaultValue={done[item.id] ?? ""}
                              maxLength={500}
                              placeholder="Add a note (optional), e.g. who you called"
                              className="h-9 min-w-0 flex-1 rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
                            />
                            <button className="h-9 rounded-sm bg-night px-3 text-sm text-starlight">Save</button>
                            <button type="button" onClick={() => setNoteFor(null)} className="text-sm text-paper-dim">
                              Skip
                            </button>
                          </form>
                        )}
                      </div>
                      {item.personal && removeAction && (
                        <form action={removeAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="text-xs text-paper-dim hover:text-[#8a2f1e]" aria-label={`Remove ${item.title}`}>
                            Remove
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
