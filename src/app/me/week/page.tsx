import type { Metadata } from "next";
import { getMyWeek } from "@/lib/member-data";
import { daysLeft, weekLabel } from "@/lib/week";
import { WeekChecklist, type ChecklistItem } from "@/components/members/week-checklist";
import { ProgressRing } from "@/components/members/progress-ring";
import { addMyWeekItem, removeMyWeekItem } from "../week-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "This week" };

export default async function MyWeek() {
  const { week, items, ticks, history, streak, teamNames } = await getMyWeek();
  const left = daysLeft();
  const ticked = Object.fromEntries(ticks.map((t) => [t.item_id, t.note]));
  const done = items.filter((i) => i.id in ticked).length;
  const list: ChecklistItem[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    details: i.details,
    personal: Boolean(i.owner_id),
    group: i.owner_id ? "My own" : i.audience === "team" && i.team_id ? `For ${teamNames.get(i.team_id) ?? "your team"}` : "From Pastor Michael",
  }));
  list.sort((a, b) => (a.personal === b.personal ? 0 : a.personal ? 1 : -1));
  const past = history.slice(1).filter((h) => h.total > 0).slice(0, 8);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="flex flex-wrap items-center gap-6">
          <ProgressRing value={items.length ? done / items.length : 0} size={92} stroke={8} color="#3d9a6a" label={`${done}/${items.length}`} />
          <div className="min-w-0">
            <p className="text-sm text-paper-dim">Week of {weekLabel(week)}</p>
            <h1 className="mt-1 font-display text-4xl text-paper">This week</h1>
            <p className="mt-1 text-paper-dim">
              {items.length === 0
                ? "Nothing set for this week yet. Add your own below."
                : done === items.length
                  ? "All done. Well done, faithful builder! 🙏"
                  : `${items.length - done} to go · ${left} ${left === 1 ? "day" : "days"} left`}
            </p>
          </div>
        </div>

        <div className="mt-8">
          {list.length > 0 && <WeekChecklist items={list} ticked={ticked} removeAction={removeMyWeekItem} />}
        </div>

        <form action={addMyWeekItem} className="mt-8 rounded-md border border-dashed border-steel bg-white/60 p-4">
          <label htmlFor="mine" className="text-sm font-medium text-paper">
            Add your own for this week
          </label>
          <p className="text-xs text-paper-dim">Only you can see these.</p>
          <div className="mt-2 flex gap-2">
            <input
              id="mine"
              name="title"
              required
              maxLength={300}
              placeholder="e.g. Finish Romans 8, call my mum"
              className="h-10 min-w-0 flex-1 rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
            />
            <button className="h-10 rounded-sm bg-gold px-4 text-sm font-medium text-ink hover:bg-gold-soft">Add</button>
          </div>
        </form>
      </div>

      <aside className="space-y-6 lg:self-start">
        <section className="on-night rounded-md bg-night p-5 text-starlight">
          <p className="text-sm text-lamp">Weekly streak</p>
          <p className="mt-1 font-display text-5xl">{streak}</p>
          <p className="text-sm text-starlight-dim">
            {streak === 0 ? "Finish this week's list to start a streak." : `${streak === 1 ? "week" : "weeks in a row"} with everything done.`}
          </p>
        </section>

        <section className="rounded-md border border-steel bg-white p-5">
          <h2 className="font-display text-xl text-paper">Past weeks</h2>
          {past.length === 0 ? (
            <p className="mt-2 text-sm text-paper-dim">Your weeks will show here.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {past.map((h) => {
                const full = h.done >= h.total;
                return (
                  <li key={h.week} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-paper">{weekLabel(h.week)}</span>
                      <span className={cn(full ? "text-[#24613a]" : "text-paper-dim")}>
                        {h.done}/{h.total} {full && "✓"}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-dusk">
                      <div className={cn("h-full rounded-full", full ? "bg-[#3d9a6a]" : "bg-gold")} style={{ width: `${(h.done / h.total) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <p className="text-xs leading-relaxed text-paper-dim">Each item you tick earns 1 growth point. Reminders come on Monday morning and Friday evening if alerts are on.</p>
      </aside>
    </div>
  );
}
