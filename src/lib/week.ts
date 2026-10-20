import { lagosToday } from "@/lib/discipleship";

/*
  "This Week": the pastor's weekly checklist (for everyone, a team or chosen
  people, once or every week) plus each member's own private items. Weeks run
  Monday to Sunday, Lagos time.
*/

export type WeekItem = {
  id: string;
  title: string;
  details: string | null;
  owner_id: string | null;
  audience: "everyone" | "team" | "selected";
  team_id: string | null;
  start_week: string;
  repeats: boolean;
  end_week: string | null;
  sort: number;
  created_at: string;
  submit?: "none" | "optional" | "required";
  submit_prompt?: string | null;
};

export type WeekTick = {
  item_id: string;
  user_id: string;
  week_start: string;
  note: string | null;
  created_at: string;
  body?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  updated_at?: string;
  feedback?: string | null;
  reviewed_at?: string | null;
};

/** Whether a tick has something handed in (a write-up or a file). */
export function handedIn(t: Pick<WeekTick, "body" | "file_path"> | undefined | null) {
  return Boolean(t && (t.body?.trim() || t.file_path));
}

/** The Monday (YYYY-MM-DD) of the week a date falls in. */
export function mondayOf(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(d.getTime() - dow * 86_400_000).toISOString().slice(0, 10);
}

/** This week's Monday in Lagos. */
export function thisWeek(now = Date.now()) {
  return mondayOf(lagosToday(now));
}

export function addWeeks(week: string, n: number) {
  return new Date(Date.parse(`${week}T00:00:00Z`) + n * 7 * 86_400_000).toISOString().slice(0, 10);
}

/** "Oct 13 – 19" */
export function weekLabel(week: string) {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  const m = (d: Date) => d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return m(start) === m(end) ? `${m(start)} ${start.getUTCDate()} – ${end.getUTCDate()}` : `${m(start)} ${start.getUTCDate()} – ${m(end)} ${end.getUTCDate()}`;
}

/** Whether an item is on the checklist in a given week. */
export function inWeek(item: Pick<WeekItem, "start_week" | "repeats" | "end_week">, week: string) {
  if (item.start_week > week) return false;
  return item.repeats ? !item.end_week || item.end_week >= week : item.start_week === week;
}

/** Whether a pastor's item is meant for this person. */
export function forPerson(item: WeekItem, userId: string, teamsOf: Set<string>, selected: Map<string, Set<string>>) {
  if (item.owner_id) return item.owner_id === userId;
  if (item.audience === "everyone") return true;
  if (item.audience === "team") return Boolean(item.team_id && teamsOf.has(item.team_id));
  return selected.get(item.id)?.has(userId) ?? false;
}

/** Days left in the week, counting today (Monday = 7, Sunday = 1). */
export function daysLeft(now = Date.now()) {
  const today = lagosToday(now);
  return 7 - Math.round((Date.parse(today) - Date.parse(thisWeek(now))) / 86_400_000);
}

/** Consecutive past weeks (ending last week, or this week if already complete) with every assigned item ticked. */
export function weekStreak(weeks: { week: string; done: number; total: number }[], current: string) {
  const byWeek = new Map(weeks.map((w) => [w.week, w]));
  const full = (w: string) => {
    const x = byWeek.get(w);
    return Boolean(x && x.total > 0 && x.done >= x.total);
  };
  let week = full(current) ? current : addWeeks(current, -1);
  let count = 0;
  while (full(week)) {
    count++;
    week = addWeeks(week, -1);
  }
  return count;
}
