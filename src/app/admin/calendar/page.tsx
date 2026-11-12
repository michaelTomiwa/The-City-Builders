import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader } from "@/components/admin/ui";
import { mondayOf, weekLabel } from "@/lib/week";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

const DAYS = 35;

/** YYYY-MM-DD in Lagos. */
function lagosDay(iso: string) {
  return new Date(Date.parse(iso) + 3600_000).toISOString().slice(0, 10);
}
function lagosTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });
}
function addDays(day: string, n: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}
function calendarWindow(now = Date.now()) {
  const today = new Date(now + 3600_000).toISOString().slice(0, 10);
  const from = addDays(today, -3);
  return { now: new Date(now).toISOString(), today, from, to: addDays(from, DAYS) };
}

type PostRow = { id: string; title: string; slug: string; published: boolean; published_at: string | null };
type Item = { kind: "post" | "event" | "instruction"; time: string | null; title: string; href: string; state: "live" | "scheduled" | "draft" };

export default async function CalendarPage() {
  const supabase = await createClient();
  const w = calendarWindow();
  const [{ data: posts }, { data: events }, { data: instructions }] = await Promise.all([
    supabase.from("posts").select("id, title, slug, published, published_at").gte("published_at", `${w.from}T00:00:00Z`).lt("published_at", `${w.to}T00:00:00Z`).order("published_at"),
    supabase.from("events").select("id, title, starts_at").gte("starts_at", `${w.from}T00:00:00Z`).lt("starts_at", `${w.to}T00:00:00Z`).order("starts_at"),
    supabase.from("week_instructions").select("week_start, theme, status").gte("week_start", mondayOf(w.from)).lt("week_start", w.to),
  ]);

  const byDay = new Map<string, Item[]>();
  const add = (day: string, item: Item) => byDay.set(day, [...(byDay.get(day) ?? []), item]);
  for (const p of (posts ?? []) as PostRow[]) {
    if (!p.published_at) continue;
    add(lagosDay(p.published_at), {
      kind: "post",
      time: lagosTime(p.published_at),
      title: p.title,
      href: `/admin/posts/${p.id}/edit`,
      state: !p.published ? "draft" : p.published_at > w.now ? "scheduled" : "live",
    });
  }
  for (const e of events ?? []) add(lagosDay(e.starts_at), { kind: "event", time: lagosTime(e.starts_at), title: e.title, href: `/admin/events/${e.id}/edit`, state: e.starts_at > w.now ? "scheduled" : "live" });
  const instructionByWeek = new Map((instructions ?? []).map((i) => [i.week_start as string, i]));

  const days = Array.from({ length: DAYS }, (_, i) => addDays(w.from, i));
  const futurePostDays = days.filter((d) => d >= w.today && (byDay.get(d) ?? []).some((i) => i.kind === "post"));
  const lastScheduled = futurePostDays.at(-1);
  const firstGap = days.find((d) => d >= w.today && !(byDay.get(d) ?? []).some((i) => i.kind === "post"));
  const scheduledCount = ((posts ?? []) as PostRow[]).filter((p) => p.published && p.published_at && p.published_at > w.now).length;
  const nice = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div>
      <AdminHeader
        title="Calendar"
        description="What goes out on the site over the next month: blog posts, weekly instructions and gatherings. Fill the gaps so there's something new every day."
      />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-steel bg-white p-4">
          <p className="text-xs text-paper-dim">Posts scheduled</p>
          <p className="mt-1 font-display text-3xl text-paper">{scheduledCount}</p>
        </div>
        <div className="rounded-md border border-steel bg-white p-4">
          <p className="text-xs text-paper-dim">Posts planned until</p>
          <p className="mt-1 font-display text-3xl text-paper">{lastScheduled ? nice(lastScheduled) : "Nothing yet"}</p>
        </div>
        <div className={cn("rounded-md border p-4", firstGap ? "border-[#ecc4ba] bg-[#fbefec]" : "border-steel bg-white")}>
          <p className="text-xs text-paper-dim">First day with no post</p>
          <p className={cn("mt-1 font-display text-3xl", firstGap ? "text-[#8a2f1e]" : "text-paper")}>{firstGap ? (firstGap === w.today ? "Today" : nice(firstGap)) : "None 🙌"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/posts/from-sermon" className="rounded-sm bg-gold px-4 py-2 font-medium text-ink hover:bg-gold-soft">
          Turn a sermon into a post
        </Link>
        <Link href="/admin/posts/new" className="rounded-sm border border-steel bg-white px-4 py-2 text-paper hover:border-gold">
          Write a post
        </Link>
        <Link href="/admin/instruction" className="rounded-sm border border-steel bg-white px-4 py-2 text-paper hover:border-gold">
          Weekly instruction
        </Link>
        <Link href="/admin/events/new" className="rounded-sm border border-steel bg-white px-4 py-2 text-paper hover:border-gold">
          Add a gathering
        </Link>
      </div>

      <ol className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white">
        {days.map((d) => {
          const items = byDay.get(d) ?? [];
          const past = d < w.today;
          const isToday = d === w.today;
          const monday = mondayOf(d) === d;
          const ins = monday ? instructionByWeek.get(d) : undefined;
          const noPost = !past && !items.some((i) => i.kind === "post");
          return (
            <li key={d} className={cn("flex flex-col gap-2 px-4 py-3 sm:flex-row sm:gap-6", isToday && "bg-[#fdf7ea]", past && "opacity-60")}>
              <div className="w-40 shrink-0">
                <p className={cn("text-sm", isToday ? "font-medium text-gold-text" : "text-paper")}>
                  {nice(d)}
                  {isToday && " · Today"}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                {monday && (
                  <Link
                    href={`/admin/instruction?w=${d}`}
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm",
                      ins?.status === "published" ? "bg-[#e3f1e6] text-[#24613a]" : ins ? "bg-dusk text-paper-dim" : "bg-[#fbefec] text-[#8a2f1e]"
                    )}
                  >
                    <span aria-hidden="true">📋</span>
                    {ins ? `Weekly instruction (${ins.status === "published" ? "published" : "draft"}): ${ins.theme}` : `No weekly instruction for ${weekLabel(d)} yet. Write it →`}
                  </Link>
                )}
                {items.map((i) => (
                  <Link key={`${i.kind}-${i.href}`} href={i.href} className="flex items-baseline gap-2 text-sm hover:text-gold-text">
                    <span className="w-16 shrink-0 text-xs text-paper-dim">{i.time}</span>
                    <span aria-hidden="true">{i.kind === "post" ? "📝" : "📅"}</span>
                    <span className="min-w-0 flex-1 truncate text-paper">{i.title}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs",
                        i.state === "live" ? "bg-[#e3f1e6] text-[#24613a]" : i.state === "scheduled" ? "bg-[#e1e9f6] text-[#29457a]" : "bg-dusk text-paper-dim"
                      )}
                    >
                      {i.state === "live" ? (i.kind === "post" ? "Live" : "Done") : i.state === "scheduled" ? "Scheduled" : "Draft"}
                    </span>
                  </Link>
                ))}
                {noPost && (
                  <Link href="/admin/posts/from-sermon" className="block text-sm text-paper-dim hover:text-gold-text">
                    Nothing posting this day · add one →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
