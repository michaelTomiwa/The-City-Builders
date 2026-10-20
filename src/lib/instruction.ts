import type { SupabaseClient } from "@supabase/supabase-js";
import { lagosToday } from "@/lib/discipleship";
import { thisWeek } from "@/lib/week";

/*
  The weekly instruction: one word from the pastor to the whole church each
  week. What to fast, what to pray and what to study, day by day.
*/

export type Instruction = {
  week_start: string;
  theme: string;
  word: string | null;
  fast_days: number[]; // 1 = Monday ... 7 = Sunday
  fast_plan: string | null;
  prayer_points: string[];
  prayer_plan: string | null;
  readings: string[]; // Monday to Sunday, "" for none
  memory_verse: string | null;
  question: string | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
};

export const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const dayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const fastIdeas = ["6 AM to 12 noon, water only", "6 AM to 6 PM", "Dry fast, 6 AM to 12 noon", "Daniel fast: no meat, no sweets, no soft drinks"];

/** Today's day number in Lagos: 1 = Monday ... 7 = Sunday. */
export function lagosDayNumber(now = Date.now()) {
  const d = new Date(`${lagosToday(now)}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/** "Mon, Wed and Fri", or "every day". */
export function fastDaysLabel(days: number[]) {
  const sorted = [...days].sort();
  if (sorted.length === 7) return "every day";
  const names = sorted.map((d) => dayShort[d - 1]);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** What today asks of people: a fast, a reading, the prayer points. */
export function todayFrom(ins: Instruction, day: number) {
  return {
    fasting: ins.fast_days.includes(day),
    reading: ins.readings[day - 1]?.trim() || null,
  };
}

/** A Bible Gateway link for a passage such as "Ephesians 1" or "Psalm 91:1-6". */
export function passageLink(passage: string) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=KJV`;
}

/** This week's published instruction, if there is one. */
export async function currentInstruction(supabase: SupabaseClient, now = Date.now()) {
  const { data } = await supabase.from("week_instructions").select("*").eq("week_start", thisWeek(now)).eq("status", "published").maybeSingle();
  return (data ?? null) as Instruction | null;
}
