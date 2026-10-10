/*
  Accountability for assignments, grace first: reminders before the due date,
  a reason when someone hands in late, and a ladder that follows people up
  privately when they miss. Every level has a way back.
*/

export type LateReason = "sick" | "work" | "family" | "forgot" | "hard" | "struggling" | "other";

export const lateReasons: { id: LateReason; label: string }[] = [
  { id: "sick", label: "I was sick" },
  { id: "work", label: "Work or school" },
  { id: "family", label: "Family" },
  { id: "forgot", label: "I forgot" },
  { id: "hard", label: "I found it hard" },
  { id: "struggling", label: "I'm going through something" },
  { id: "other", label: "Something else" },
];

export function lateReasonLabel(id: string | null | undefined) {
  return lateReasons.find((r) => r.id === id)?.label ?? "No reason given";
}

export type Ladder = {
  user_id: string;
  level: 0 | 1 | 2 | 3 | 4;
  recent: number;
  missed: number;
  late: number;
  on_time: number;
  missed_in_row: number;
  on_time_streak: number;
  all_done: number;
  all_on_time: number;
  last_missed: string | null;
  plan_id: string | null;
};

export const levels: Record<Ladder["level"], { name: string; emoji: string; tone: "green" | "gold" | "blue" | "grey" | "red"; hint: string }> = {
  0: { name: "On track", emoji: "✅", tone: "green", hint: "Handing in faithfully." },
  1: { name: "Gentle nudge", emoji: "🟡", tone: "gold", hint: "Missed one. They've had a loving message from you." },
  2: { name: "Check-in", emoji: "🟠", tone: "gold", hint: "Missed 2 of the last 4. Their team lead or prayer partner is asked to reach out." },
  3: { name: "Pastor's conversation", emoji: "🔴", tone: "red", hint: "Missed 3 of the last 4. Flagged Follow up in your Messages." },
  4: { name: "Restoration plan", emoji: "🟣", tone: "blue", hint: "Walking a catch-up plan with you. Completing it is a fresh start." },
};

/** "2d 4h left", "3h 20m left", or null once it's due. */
export function timeLeft(dueIso: string | null, now = Date.now()) {
  if (!dueIso) return null;
  const ms = Date.parse(dueIso) - now;
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const text = d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  return { text, urgent: ms < 86_400_000 };
}

/** Where an assignment stands for someone who hasn't handed in yet. */
export function dueState(a: { due_at: string | null; grace_hours?: number | null }, now = Date.now()): "open" | "late" | "missed" {
  if (!a.due_at) return "open";
  const due = Date.parse(a.due_at);
  if (now <= due) return "open";
  return now <= due + (a.grace_hours ?? 48) * 3_600_000 ? "late" : "missed";
}

export type Priority = {
  id: string;
  name: string;
  phone: string | null;
  ladder: Ladder;
  score: number;
  reasons: string[];
  isLeader: boolean;
  newBeliever: boolean;
  quietDays: number | null;
  explanations: { title: string; reason: string | null; note: string | null; at: string }[];
};

/**
 * How much someone needs the pastor this week. Misses weigh most (they come
 * with no explanation), then misses in a row, late work, someone saying
 * they're going through something, and going quiet everywhere else.
 * Leaders weigh more because they set the example; new believers less.
 */
export function priorityScore(x: {
  ladder: Ladder;
  struggling: boolean;
  quietDays: number | null;
  isLeader: boolean;
  newBeliever: boolean;
}) {
  const { ladder: l } = x;
  const reasons: string[] = [];
  let score = 0;
  if (l.missed > 0) {
    score += l.missed * 30;
    reasons.push(`Missed ${l.missed} of the last ${l.recent}`);
    reasons.push("No reason given for the missed ones");
  }
  if (l.missed_in_row >= 2) {
    score += l.missed_in_row * 10;
    reasons.push(`${l.missed_in_row} in a row`);
  }
  if (l.late > 0) {
    score += l.late * 8;
    reasons.push(`Handed in late ${l.late === 1 ? "once" : `${l.late} times`}`);
  }
  if (x.struggling) {
    score += 25;
    reasons.push("Said they're going through something");
  }
  if (x.quietDays !== null && x.quietDays >= 10) {
    score += x.quietDays >= 21 ? 30 : 15;
    reasons.push(`Not active for ${x.quietDays} days`);
  }
  if (l.plan_id) reasons.push("On a restoration plan");
  score += l.level * 10;
  if (score > 0 && x.isLeader) {
    score *= 1.3;
    reasons.push("Team lead: they set the example");
  }
  if (score > 0 && x.newBeliever) {
    score *= 0.7;
    reasons.push("New believer: be gentle");
  }
  return { score: Math.round(score), reasons };
}

/** The message the pastor starts from, for each level. */
export function suggestedMessage(level: Ladder["level"], first: string) {
  switch (level) {
    case 1:
      return `Hi ${first}, I noticed you missed the last assignment. Is everything okay? I'm here for you.`;
    case 2:
      return `Hi ${first}, I've noticed a couple of assignments have slipped. No condemnation at all, I just want to know how you're really doing. Can we talk this week?`;
    case 3:
      return `Hi ${first}, I'd love to sit with you this week. You've missed a few assignments and I want to understand what's going on and help. When are you free for a call or a visit?`;
    case 4:
      return `Hi ${first}, how is the plan going? I'm proud of you for walking this with me. What do you need from me this week?`;
    default:
      return `Hi ${first}, well done for being so faithful with your assignments. I see it, and I'm proud of you. 🙏`;
  }
}
