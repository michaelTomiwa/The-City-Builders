import Link from "next/link";
import { getMember } from "@/lib/member-data";
import { PLAN_DAYS, fetchChapter, planDay, readingFor, readingLabel } from "@/lib/bible";
import { lagosDateTime, lagosToday } from "@/lib/discipleship";
import { BibleReader } from "@/components/members/bible-reader";
import { MemoryReview } from "@/components/members/memory-review";
import { ProgressRing } from "@/components/members/progress-ring";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { cn } from "@/lib/utils";
import { addMemoryVerseForm, addStarterVerses, deleteMemoryVerse, deleteVerseNote, startBiblePlan } from "../actions";

const swatch: Record<string, string> = { gold: "bg-[#f6e3b4]", blue: "bg-[#d9e6fa]", green: "bg-[#d7efdf]", rose: "bg-[#f8dcd5]" };

export default async function BiblePage({ searchParams }: PageProps<"/me/bible">) {
  const params = await searchParams;
  const tab = params.tab === "memory" ? "memory" : params.tab === "notes" ? "notes" : "read";
  const { supabase, user, profile } = await getMember();
  const today = lagosToday();
  const [{ data: readRows }, { data: noteRows }, { data: memoryRows }] = await Promise.all([
    supabase.from("bible_reading").select("day").eq("user_id", user!.id),
    supabase.from("verse_notes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("memory_verses").select("*").eq("user_id", user!.id).order("due_on"),
  ]);
  const readDays = new Set((readRows ?? []).map((r) => r.day as number));
  const notes = (noteRows ?? []) as { id: string; ref: string; verse: string | null; note: string | null; color: string; created_at: string }[];
  const memory = (memoryRows ?? []) as { id: string; ref: string; text: string; box: number; due_on: string; reviews: number }[];
  const due = memory.filter((m) => m.due_on <= today);
  const start = profile?.bible_plan_start ?? null;
  const current = planDay(start, today);
  const viewDay = Math.min(PLAN_DAYS, Math.max(1, Number(params.day) || current || 1));

  const tabs = [
    { id: "read", label: "Bible in a year", href: "/me/bible" },
    { id: "memory", label: `Memory verses${due.length ? ` · ${due.length} due` : ""}`, href: "/me/bible?tab=memory" },
    { id: "notes", label: `Highlights & notes${notes.length ? ` · ${notes.length}` : ""}`, href: "/me/bible?tab=notes" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-paper sm:text-5xl">The Word</h1>
      <nav className="mt-5 flex flex-wrap gap-1 rounded-md bg-dusk p-1 text-sm" aria-label="Bible">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href} aria-current={tab === t.id ? "page" : undefined} className={cn("rounded px-3.5 py-1.5", tab === t.id ? "bg-white text-paper shadow-sm" : "text-paper-dim hover:text-paper")}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "read" && !start && (
        <div className="on-night mt-8 rounded-md bg-night p-8 text-starlight sm:p-10">
          <p className="text-lamp">365 days · about 15 minutes a day</p>
          <h2 className="mt-2 font-display text-4xl">Read the whole Bible this year.</h2>
          <p className="mt-3 max-w-xl text-starlight-dim">
            Genesis to Revelation, about three chapters a day, with the text right here. Tick off each day and watch the year fill up.
          </p>
          <form action={startBiblePlan} className="mt-6 flex flex-wrap items-end gap-3">
            <label className="text-sm text-starlight-dim">
              Start at day
              <input type="number" name="from_day" min={1} max={365} defaultValue={1} className="mt-1 block h-11 w-24 rounded-sm border border-night-3 bg-night-2 px-3 text-starlight" />
            </label>
            <button className="h-11 bg-gold px-6 font-medium text-ink hover:bg-gold-soft">Start the plan</button>
          </form>
        </div>
      )}

      {tab === "read" && start && current && (
        <ReadTab day={viewDay} current={current} readDays={readDays} notes={notes} />
      )}

      {tab === "memory" && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <MemoryReview cards={due.map((m) => ({ id: m.id, ref: m.ref, text: m.text, box: m.box }))} />
            <h2 className="mt-10 font-display text-2xl text-paper">All your verses</h2>
            {memory.length === 0 ? (
              <p className="mt-2 text-paper-dim">None yet. Add one, or tap a verse while reading and choose &ldquo;Memorise&rdquo;.</p>
            ) : (
              <ul className="mt-4 divide-y divide-steel rounded-md border border-steel bg-white">
                {memory.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <span>
                      <span className="font-medium text-paper">{m.ref}</span>
                      <span className="block text-paper-dim">{m.text}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-paper-dim">
                      <span title="How well you know it">{"●".repeat(m.box)}{"○".repeat(6 - m.box)}</span>
                      <form action={deleteMemoryVerse}>
                        <input type="hidden" name="id" value={m.id} />
                        <ConfirmButton message={`Remove ${m.ref}?`} className="hover:text-[#8a2f1e]">
                          Remove
                        </ConfirmButton>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <aside className="space-y-5">
            <form action={addMemoryVerseForm} className="rounded-md border border-steel bg-white p-5">
              <h2 className="font-display text-xl text-paper">Add a verse</h2>
              <input name="ref" required placeholder="Philippians 4:13" className="mt-3 h-10 w-full rounded-sm border border-steel px-3 text-sm text-paper outline-none focus:border-gold" />
              <textarea name="text" required rows={3} placeholder="I can do all things through Christ…" className="mt-2 w-full rounded-sm border border-steel px-3 py-2 text-sm text-paper outline-none focus:border-gold" />
              <button className="mt-2 rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Add</button>
            </form>
            <form action={addStarterVerses} className="rounded-md border border-steel bg-white p-5">
              <p className="text-sm text-paper">Start with the City Builders verses: Hebrews 11:10, Psalm 127:1, Isaiah 60:1 and more.</p>
              <button className="mt-3 rounded-sm border border-steel px-4 py-2 text-sm text-paper hover:border-gold">Add 8 starter verses</button>
            </form>
          </aside>
        </div>
      )}

      {tab === "notes" && (
        <div className="mt-8">
          {notes.length === 0 ? (
            <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">Tap any verse while reading to highlight it or write a note.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-steel bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-medium text-paper">
                      <span className={cn("h-3 w-3 rounded-full", swatch[n.color] ?? swatch.gold)} />
                      {n.ref}
                    </span>
                    <span className="text-xs text-paper-dim">{lagosDateTime(n.created_at).split(",").slice(0, 2).join(",")}</span>
                  </div>
                  {n.verse && <p className={cn("mt-2 rounded-sm px-2 py-1 font-serif text-paper", swatch[n.color] ?? swatch.gold)}>{n.verse}</p>}
                  {n.note && <p className="mt-2 text-sm leading-relaxed text-paper-dim">{n.note}</p>}
                  <form action={deleteVerseNote} className="mt-2">
                    <input type="hidden" name="id" value={n.id} />
                    <ConfirmButton message="Delete this highlight?" className="text-xs text-paper-dim hover:text-[#8a2f1e]">
                      Delete
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

async function ReadTab({
  day,
  current,
  readDays,
  notes,
}: {
  day: number;
  current: number;
  readDays: Set<number>;
  notes: { ref: string; color: string }[];
}) {
  const chapters = await Promise.all(readingFor(day).map(async (c) => ({ ...c, verses: await fetchChapter(c.book, c.chapter) })));
  const highlights = Object.fromEntries(notes.map((n) => [n.ref, n.color]));
  const behind = Array.from({ length: current - 1 }, (_, i) => i + 1).filter((d) => !readDays.has(d)).length;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="min-w-0 rounded-md border border-steel bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-steel pb-4">
          <div>
            <p className="text-sm text-gold-text">
              Day {day} of {PLAN_DAYS}
              {day === current ? " · Today" : ""}
            </p>
            <p className="font-display text-2xl text-paper">{readingLabel(day)}</p>
          </div>
          <div className="flex gap-2 text-sm">
            {day > 1 && (
              <Link href={`/me/bible?day=${day - 1}`} className="rounded-sm border border-steel px-3 py-1.5 text-paper hover:border-gold">
                ← Day {day - 1}
              </Link>
            )}
            {day < PLAN_DAYS && (
              <Link href={`/me/bible?day=${day + 1}`} className="rounded-sm border border-steel px-3 py-1.5 text-paper hover:border-gold">
                Day {day + 1} →
              </Link>
            )}
          </div>
        </div>
        <div className="mt-6">
          <BibleReader key={day} chapters={chapters} highlights={highlights} day={day} read={readDays.has(day)} />
        </div>
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-4 rounded-md border border-steel bg-white p-5">
          <ProgressRing value={readDays.size / PLAN_DAYS} size={72} stroke={6} label={`${readDays.size}`} />
          <div>
            <p className="font-medium text-paper">{readDays.size} of 365 days</p>
            <p className="text-sm text-paper-dim">{behind > 0 ? `${behind} days to catch up` : "Right on track"}</p>
          </div>
        </div>
        <div className="rounded-md border border-steel bg-white p-4">
          <p className="text-sm font-medium text-paper">Your year</p>
          <div className="mt-3 grid grid-cols-[repeat(19,minmax(0,1fr))] gap-[3px]" aria-label="Days read">
            {Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).map((d) => (
              <Link
                key={d}
                href={`/me/bible?day=${d}`}
                title={`Day ${d}: ${readingLabel(d)}`}
                className={cn(
                  "aspect-square rounded-[2px]",
                  readDays.has(d) ? "bg-[#3d9a6a]" : d === current ? "bg-gold" : d < current ? "bg-[#e9c3b8]" : "bg-dusk",
                  d === day && "ring-2 ring-paper ring-offset-1"
                )}
              />
            ))}
          </div>
          <p className="mt-3 flex flex-wrap gap-3 text-xs text-paper-dim">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-[2px] bg-[#3d9a6a]" /> Read</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-[2px] bg-gold" /> Today</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-[2px] bg-[#e9c3b8]" /> Missed</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
