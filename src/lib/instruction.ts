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

/** The whole instruction as a WhatsApp message, ready to forward to family and friends. */
export function instructionMessage(ins: Instruction) {
  const lines = [`*This week at The City Builders: ${ins.theme}*`];
  if (ins.fast_days.length) lines.push("", `🍽️ *Fast:* ${fastDaysLabel(ins.fast_days)}${ins.fast_plan ? ` (${ins.fast_plan})` : ""}`);
  if (ins.prayer_points.length) {
    lines.push("", "🙏 *Pray:*", ...ins.prayer_points.map((p, i) => `${i + 1}. ${p}`));
  } else if (ins.prayer_plan) {
    lines.push("", `🙏 *Pray:* ${ins.prayer_plan}`);
  }
  const reads = ins.readings.map((r, i) => (r.trim() ? `${dayShort[i]} ${r.trim()}` : "")).filter(Boolean);
  if (reads.length) lines.push("", `📖 *Read:* ${reads.join(" · ")}`);
  if (ins.memory_verse) lines.push("", `✨ *Memory verse:* ${ins.memory_verse}`);
  lines.push("", "Join us: Night Watch 11 PM and Morning Prayers 7 AM, Lagos time.");
  return lines.join("\n");
}

/** Published weekly instructions up to this week, newest first: the prayer-points archive. */
export async function instructionArchive(supabase: SupabaseClient, now = Date.now()) {
  const { data } = await supabase
    .from("week_instructions")
    .select("week_start, theme, prayer_points, fast_days, updated_at")
    .eq("status", "published")
    .lte("week_start", thisWeek(now))
    .order("week_start", { ascending: false });
  return (data ?? []) as Pick<Instruction, "week_start" | "theme" | "prayer_points" | "fast_days" | "updated_at">[];
}

/** A search-friendly title for a week's instruction. */
export function instructionTitle(ins: Pick<Instruction, "theme" | "fast_days">) {
  return `${ins.theme}: prayer points${ins.fast_days.length ? ", fasting" : ""} and Bible reading`;
}

/** Plain questions and answers about a week (for the page and for Google). */
export function instructionFaq(ins: Instruction) {
  const out: { question: string; answer: string }[] = [];
  if (ins.prayer_points.length) {
    out.push({
      question: `What are the prayer points for "${ins.theme}"?`,
      answer: ins.prayer_points.map((p, i) => `${i + 1}. ${p}`).join(" ") + (ins.prayer_plan ? ` ${ins.prayer_plan}.` : ""),
    });
  }
  if (ins.fast_days.length) {
    out.push({
      question: "When and how should I fast this week?",
      answer: `Fast on ${fastDaysLabel(ins.fast_days)}${ins.fast_plan ? `: ${ins.fast_plan}` : ""}. If you have a health condition, are pregnant or take medication, speak to a doctor first and choose a gentler fast.`,
    });
  }
  const reads = ins.readings.map((r, i) => (r.trim() ? `${dayNames[i]}: ${r.trim()}` : "")).filter(Boolean);
  if (reads.length) out.push({ question: "What Bible passages should I read this week?", answer: `${reads.join(". ")}.` });
  if (ins.memory_verse) out.push({ question: "What is this week's memory verse?", answer: ins.memory_verse });
  return out;
}
