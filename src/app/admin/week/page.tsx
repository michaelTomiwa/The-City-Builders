import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { activeMembers } from "@/lib/admin-discipleship";
import { AdminHeader, Pill } from "@/components/admin/ui";
import { WeekItemForm } from "@/components/admin/week-item-form";
import { ProgressRing } from "@/components/members/progress-ring";
import { displayName } from "@/lib/discipleship";
import { addWeeks, forPerson, handedIn, inWeek, mondayOf, thisWeek, weekLabel, type WeekItem, type WeekTick } from "@/lib/week";
import { cn } from "@/lib/utils";
import { addWeekItem, copyLastWeek, removeWeekItem, stopRepeating, updateWeekItem } from "./actions";

export const metadata: Metadata = { title: "This Week" };

export default async function AdminWeek({ searchParams }: PageProps<"/admin/week">) {
  const query = await searchParams;
  const current = thisWeek();
  const week = typeof query.w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.w) ? mondayOf(query.w) : current;
  const supabase = await createClient();

  const [{ members, picker }, itemsRes, teamsRes, teamPeople, picked] = await Promise.all([
    activeMembers(supabase),
    supabase.from("week_items").select("*").is("owner_id", null).lte("start_week", week).order("sort").order("created_at"),
    supabase.from("teams").select("id, name").order("name"),
    supabase.from("team_members").select("team_id, user_id"),
    supabase.from("week_item_members").select("item_id, user_id"),
  ]);
  const items = ((itemsRes.data ?? []) as WeekItem[]).filter((i) => inWeek(i, week));
  const ids = items.map((i) => i.id);
  const { data: tickRows } = ids.length
    ? await supabase.from("week_ticks").select("*").eq("week_start", week).in("item_id", ids)
    : { data: [] as WeekTick[] };
  const ticks = (tickRows ?? []) as WeekTick[];

  const teams = (teamsRes.data ?? []) as { id: string; name: string }[];
  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const teamsOf = new Map<string, Set<string>>();
  for (const r of teamPeople.data ?? []) {
    const set = teamsOf.get(r.user_id as string) ?? new Set<string>();
    set.add(r.team_id as string);
    teamsOf.set(r.user_id as string, set);
  }
  const selected = new Map<string, Set<string>>();
  for (const r of picked.data ?? []) {
    const set = selected.get(r.item_id as string) ?? new Set<string>();
    set.add(r.user_id as string);
    selected.set(r.item_id as string, set);
  }
  const tickedBy = new Map<string, Map<string, string | null>>(); // item -> user -> note
  for (const t of ticks) {
    const m = tickedBy.get(t.item_id) ?? new Map<string, string | null>();
    m.set(t.user_id, t.note);
    tickedBy.set(t.item_id, m);
  }

  // Only people who had joined by the end of that week are counted.
  const weekEnd = addWeeks(week, 1);
  const people = members
    .filter((m) => m.created_at.slice(0, 10) < weekEnd)
    .map((m) => {
      const mine = items.filter((i) => forPerson(i, m.id, teamsOf.get(m.id) ?? new Set(), selected));
      const done = mine.filter((i) => tickedBy.get(i.id)?.has(m.id)).length;
      return { id: m.id, name: displayName(m), total: mine.length, done };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.done / b.total - a.done / a.total || a.name.localeCompare(b.name));
  const perItem = items.map((i) => {
    const meant = people.filter((p) => forPerson(i, p.id, teamsOf.get(p.id) ?? new Set(), selected));
    const did = tickedBy.get(i.id) ?? new Map();
    const notes = meant.filter((p) => did.get(p.id)).map((p) => ({ name: p.name, note: did.get(p.id) as string }));
    const work = ticks.filter((t) => t.item_id === i.id && handedIn(t));
    return { item: i, meant: meant.length, done: meant.filter((p) => did.has(p.id)).length, notes, handed: work.length, unread: work.filter((t) => !t.reviewed_at).length };
  });
  const editing = typeof query.edit === "string" ? query.edit : null;
  const totalDone = people.reduce((n, p) => n + p.done, 0);
  const totalAll = people.reduce((n, p) => n + p.total, 0);
  const finished = people.filter((p) => p.done >= p.total).length;
  const notStarted = people.filter((p) => p.done === 0);
  const isPast = week < current;
  const nudge = (name: string) =>
    isPast
      ? `Hi ${name.split(" ")[0]}, I noticed last week's checklist wasn't ticked. Is everything okay? I'm praying for you. 🙏`
      : `Hi ${name.split(" ")[0]}, just a gentle reminder about this week's checklist on the site. You can do it! 🙏`;
  const audienceLabel = (i: WeekItem) =>
    i.audience === "everyone" ? "Everyone" : i.audience === "team" ? (teamName.get(i.team_id ?? "") ?? "A team") : `${selected.get(i.id)?.size ?? 0} chosen`;

  return (
    <div>
      <AdminHeader
        title="This Week"
        description="Set what everyone should be doing this week. Members tick things off on their dashboard, and you see who's keeping up."
      />

      {typeof query.note === "string" && (
        <p className="mt-6 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]" role="status">
          {query.note}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href={`/admin/week?w=${addWeeks(week, -1)}`} className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold" aria-label="Previous week">
          ←
        </Link>
        <p className="font-display text-2xl text-paper">
          {weekLabel(week)}
          {week === current && <span className="ml-2 align-middle text-sm font-sans text-gold-text">this week</span>}
        </p>
        <Link href={`/admin/week?w=${addWeeks(week, 1)}`} className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold" aria-label="Next week">
          →
        </Link>
        {week !== current && (
          <Link href="/admin/week" className="text-sm text-gold-text hover:underline">
            Back to this week
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-md border border-steel bg-white p-4">
          <ProgressRing value={totalAll ? totalDone / totalAll : 0} size={52} stroke={5} color="#3d9a6a" />
          <div>
            <p className="text-xs text-paper-dim">Ticked overall</p>
            <p className="font-display text-2xl text-paper">
              {totalDone}/{totalAll}
            </p>
          </div>
        </div>
        <Stat label="Items" value={items.length} />
        <Stat label="Everything done" value={finished} />
        <Stat label="Not started" value={notStarted.length} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-10">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl text-paper">The checklist</h2>
              {!isPast && (
                <form action={copyLastWeek}>
                  <input type="hidden" name="week" value={week} />
                  <button className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold">Copy last week</button>
                </form>
              )}
            </div>
            {items.length === 0 ? (
              <p className="mt-4 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">
                Nothing on the list for this week yet. Add the first item{isPast ? "" : " on the right"}.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {perItem.map(({ item, meant, done, notes, handed, unread }) =>
                  editing === item.id ? (
                    <li key={item.id} id={`item-${item.id}`} className="rounded-md border-2 border-gold bg-white p-5">
                      <p className="mb-3 text-xs font-medium text-gold-text">Editing</p>
                      <WeekItemForm
                        week={week}
                        teams={teams}
                        members={picker}
                        action={updateWeekItem}
                        initial={item}
                        initialMembers={[...(selected.get(item.id) ?? [])]}
                        onCancelHref={`/admin/week?w=${week}#item-${item.id}`}
                      />
                      {item.repeats && item.start_week < week && (
                        <p className="mt-3 text-xs text-paper-dim">This item repeats, so changes also show on past weeks. Past ticks are kept.</p>
                      )}
                    </li>
                  ) : (
                  <li key={item.id} id={`item-${item.id}`} className="rounded-md border border-steel bg-white p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-paper">{item.title}</p>
                        {item.details && <p className="mt-1 text-sm text-paper-dim">{item.details}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Pill tone="blue">{audienceLabel(item)}</Pill>
                          {item.repeats && <Pill tone="gold">Every week</Pill>}
                          {item.submit && item.submit !== "none" && <Pill tone={item.submit === "required" ? "red" : "grey"}>📎 Hand-in {item.submit}</Pill>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl text-paper">
                          {done}/{meant}
                        </p>
                        <p className="text-xs text-paper-dim">ticked</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-dusk">
                      <div className="h-full rounded-full bg-[#3d9a6a]" style={{ width: `${meant ? (done / meant) * 100 : 0}%` }} />
                    </div>
                    {item.submit && item.submit !== "none" && (
                      <Link
                        href={`/admin/week/${item.id}?w=${week}`}
                        className="mt-3 flex items-center justify-between gap-3 rounded-sm bg-dusk px-3 py-2.5 text-sm hover:bg-dusk-2"
                      >
                        <span className="text-paper">
                          {handed} handed in{item.submit_prompt && <span className="text-paper-dim"> · {item.submit_prompt}</span>}
                        </span>
                        <span className="shrink-0 font-medium text-gold-text">
                          {unread > 0 ? `${unread} to read →` : "Open →"}
                        </span>
                      </Link>
                    )}
                    {notes.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gold-text">
                          {notes.length} {notes.length === 1 ? "note" : "notes"} from people
                        </summary>
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {notes.map((n) => (
                            <li key={n.name}>
                              <span className="font-medium text-paper">{n.name}:</span> <span className="text-paper-dim">&ldquo;{n.note}&rdquo;</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {!isPast && (
                      <div className="mt-3 flex gap-3 border-t border-steel pt-3 text-sm">
                        <Link href={`/admin/week?w=${week}&edit=${item.id}#item-${item.id}`} className="text-gold-text hover:underline">
                          Edit
                        </Link>
                        {item.repeats && (
                          <form action={stopRepeating}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="week" value={week} />
                            <button className="text-paper-dim hover:text-paper">Stop repeating</button>
                          </form>
                        )}
                        {(!item.repeats || item.start_week === week) && (
                          <form action={removeWeekItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="week" value={week} />
                            <button className="text-paper-dim hover:text-[#8a2f1e]">Remove</button>
                          </form>
                        )}
                      </div>
                    )}
                  </li>
                  )
                )}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl text-paper">People</h2>
            {people.length === 0 ? (
              <p className="mt-4 text-sm text-paper-dim">Progress shows here once there&apos;s something on the list.</p>
            ) : (
              <ul className="mt-4 divide-y divide-steel rounded-md border border-steel bg-white">
                {people.map((p) => {
                  const full = p.done >= p.total;
                  return (
                    <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                      <Link href={`/admin/members/${p.id}`} className="w-40 shrink-0 truncate text-sm text-paper hover:text-gold-text sm:w-52">
                        {p.name} {full && "⭐"}
                      </Link>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-dusk">
                        <div className={cn("h-full rounded-full", full ? "bg-[#3d9a6a]" : "bg-gold")} style={{ width: `${(p.done / p.total) * 100}%` }} />
                      </div>
                      <span className={cn("w-12 text-right text-sm", full ? "text-[#24613a]" : "text-paper-dim")}>
                        {p.done}/{p.total}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:self-start">
          {!isPast && <WeekItemForm week={week} teams={teams} members={picker} action={addWeekItem} />}
          <section className="rounded-md border border-steel bg-white p-5">
            <h2 className="font-display text-xl text-paper">Not started</h2>
            {notStarted.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">{people.length ? "Everyone has ticked at least one thing. 🙌" : "No one yet."}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {notStarted.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-paper">{p.name}</span>
                    <Link href={`/admin/messages?m=${p.id}&draft=${encodeURIComponent(nudge(p.name))}`} className="shrink-0 text-gold-text hover:underline">
                      Message
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="text-xs leading-relaxed text-paper-dim">
            Members get a reminder on Monday morning and another on Friday evening if they still have things left. Each tick earns them 1 growth point.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-steel bg-white p-4">
      <p className="text-xs text-paper-dim">{label}</p>
      <p className="mt-1 font-display text-3xl text-paper">{value}</p>
    </div>
  );
}
