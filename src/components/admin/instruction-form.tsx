"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { dayNames, dayShort, fastIdeas, type Instruction } from "@/lib/instruction";

const input = "w-full rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold";
const label = "text-sm font-medium text-paper";

/** Write the week's instruction: theme, fasting days, prayer points and daily reading. */
export function InstructionForm({
  week,
  initial,
  published,
  action,
}: {
  week: string;
  initial: Partial<Instruction> | null;
  published: boolean;
  action: (fd: FormData) => void;
}) {
  const [fastDays, setFastDays] = useState<number[]>(initial?.fast_days ?? []);
  const [fastPlan, setFastPlan] = useState(initial?.fast_plan ?? "");
  const [readings, setReadings] = useState<string[]>(Array.from({ length: 7 }, (_, i) => initial?.readings?.[i] ?? ""));
  const [book, setBook] = useState("");
  const [from, setFrom] = useState("1");

  function fillWeek() {
    const start = Math.max(1, parseInt(from, 10) || 1);
    if (!book.trim()) return;
    setReadings(Array.from({ length: 7 }, (_, i) => `${book.trim()} ${start + i}`));
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="week" value={week} />

      <section className="rounded-md border border-steel bg-white p-5">
        <label htmlFor="theme" className={label}>
          Theme for the week
        </label>
        <input id="theme" name="theme" required maxLength={200} defaultValue={initial?.theme ?? ""} placeholder="e.g. A week of consecration" className={cn(input, "mt-2 h-11 text-base")} />
        <label htmlFor="word" className={cn(label, "mt-4 block")}>
          A word from you (optional)
        </label>
        <textarea id="word" name="word" rows={4} maxLength={5000} defaultValue={initial?.word ?? ""} placeholder="Why this week matters, and what you're believing God for." className={cn(input, "mt-2")} />
      </section>

      <section className="rounded-md border border-steel bg-white p-5">
        <h2 className="font-display text-2xl text-paper">Fasting</h2>
        <p className="mt-1 text-sm text-paper-dim">Tap the days to fast. Everyone gets a reminder at 6 AM on those days.</p>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {dayShort.map((d, i) => {
            const on = fastDays.includes(i + 1);
            return (
              <label key={d} className={cn("cursor-pointer rounded-sm border py-2.5 text-center text-sm transition-colors", on ? "border-gold bg-gold text-ink" : "border-steel bg-white text-paper-dim hover:border-gold")}>
                <input
                  type="checkbox"
                  name="fast_days"
                  value={i + 1}
                  checked={on}
                  onChange={() => setFastDays((f) => (on ? f.filter((x) => x !== i + 1) : [...f, i + 1]))}
                  className="sr-only"
                  aria-label={dayNames[i]}
                />
                {d}
              </label>
            );
          })}
        </div>
        <div className="mt-2 flex gap-3 text-xs">
          <button type="button" onClick={() => setFastDays([1, 3, 5])} className="text-gold-text hover:underline">
            Mon, Wed, Fri
          </button>
          <button type="button" onClick={() => setFastDays([1, 2, 3, 4, 5])} className="text-gold-text hover:underline">
            Weekdays
          </button>
          <button type="button" onClick={() => setFastDays([1, 2, 3, 4, 5, 6, 7])} className="text-gold-text hover:underline">
            Every day
          </button>
          <button type="button" onClick={() => setFastDays([])} className="text-paper-dim hover:underline">
            No fast
          </button>
        </div>
        <label htmlFor="fast_plan" className={cn(label, "mt-4 block")}>
          How to fast
        </label>
        <input id="fast_plan" name="fast_plan" maxLength={500} value={fastPlan} onChange={(e) => setFastPlan(e.target.value)} placeholder="e.g. 6 AM to 12 noon, water only" className={cn(input, "mt-2")} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {fastIdeas.map((f) => (
            <button key={f} type="button" onClick={() => setFastPlan(f)} className="rounded-full bg-dusk px-2.5 py-1 text-xs text-paper-dim hover:text-paper">
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-steel bg-white p-5">
        <h2 className="font-display text-2xl text-paper">Prayer</h2>
        <label htmlFor="prayer_plan" className={cn(label, "mt-3 block")}>
          When and how to pray (optional)
        </label>
        <input id="prayer_plan" name="prayer_plan" maxLength={500} defaultValue={initial?.prayer_plan ?? ""} placeholder="e.g. 30 minutes every morning, and Night Watch on Tuesday and Friday" className={cn(input, "mt-2")} />
        <label htmlFor="prayer_points" className={cn(label, "mt-4 block")}>
          Prayer points
        </label>
        <textarea
          id="prayer_points"
          name="prayer_points"
          rows={6}
          defaultValue={(initial?.prayer_points ?? []).join("\n")}
          placeholder={"One per line, e.g.\nFor a fresh hunger for God's word\nFor every family in the house\nFor Lagos: peace and godly leaders"}
          className={cn(input, "mt-2")}
        />
      </section>

      <section className="rounded-md border border-steel bg-white p-5">
        <h2 className="font-display text-2xl text-paper">Study</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-sm bg-dusk p-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="book" className="text-xs text-paper-dim">
              Quick fill: a book, chapter by chapter
            </label>
            <input id="book" value={book} onChange={(e) => setBook(e.target.value)} placeholder="Ephesians" className={cn(input, "mt-1 h-9")} />
          </div>
          <div className="w-20">
            <label htmlFor="from" className="text-xs text-paper-dim">
              From ch.
            </label>
            <input id="from" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} className={cn(input, "mt-1 h-9")} />
          </div>
          <button type="button" onClick={fillWeek} className="h-9 rounded-sm bg-night px-3 text-sm text-starlight">
            Fill the week
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {dayNames.map((d, i) => (
            <div key={d} className="flex items-center gap-3">
              <label htmlFor={`reading_${i + 1}`} className="w-24 shrink-0 text-sm text-paper-dim">
                {d}
              </label>
              <input
                id={`reading_${i + 1}`}
                name={`reading_${i + 1}`}
                maxLength={120}
                value={readings[i]}
                onChange={(e) => setReadings((r) => r.map((x, n) => (n === i ? e.target.value : x)))}
                placeholder={i === 6 ? "Rest, or catch up" : "e.g. Ephesians 1"}
                className={cn(input, "h-9")}
              />
            </div>
          ))}
        </div>
        <label htmlFor="memory_verse" className={cn(label, "mt-5 block")}>
          Memory verse (optional)
        </label>
        <textarea id="memory_verse" name="memory_verse" rows={2} maxLength={500} defaultValue={initial?.memory_verse ?? ""} placeholder="Ephesians 2:10: For we are his workmanship…" className={cn(input, "mt-2")} />
        <label htmlFor="question" className={cn(label, "mt-4 block")}>
          A question to think about (optional)
        </label>
        <input id="question" name="question" maxLength={500} defaultValue={initial?.question ?? ""} placeholder="e.g. What good work has God prepared for you this week?" className={cn(input, "mt-2")} />
      </section>

      <section className="rounded-md border border-steel bg-white p-5">
        <label className="flex items-start gap-2.5 text-sm text-paper">
          <input type="checkbox" name="checklist" defaultChecked className="mt-0.5 h-4 w-4 accent-[#c9952f]" />
          <span>
            Add it to everyone&apos;s This Week checklist
            <span className="block text-xs text-paper-dim">Fasting, prayer, reading and the memory verse become items people can tick.</span>
          </span>
        </label>
        {!published && (
          <label className="mt-3 flex items-start gap-2.5 text-sm text-paper">
            <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-4 w-4 accent-[#c9952f]" />
            <span>
              Send an alert to everyone&apos;s phone
              <span className="block text-xs text-paper-dim">Everyone who turned on alerts gets &ldquo;This week&apos;s instruction is out&rdquo;.</span>
            </span>
          </label>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {published ? (
            <button name="intent" value="save" className="h-11 rounded-sm bg-gold px-6 text-sm font-medium text-ink hover:bg-gold-soft">
              Save changes
            </button>
          ) : (
            <>
              <button name="intent" value="publish" className="h-11 rounded-sm bg-gold px-6 text-sm font-medium text-ink hover:bg-gold-soft">
                Publish to everyone
              </button>
              <button name="intent" value="draft" className="h-11 rounded-sm border border-steel bg-white px-5 text-sm text-paper hover:border-gold">
                Save draft
              </button>
            </>
          )}
        </div>
      </section>
    </form>
  );
}
