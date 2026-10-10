/*
  Shared pieces of the City Builders discipleship system: the kinds of daily
  step a programme can hold, how programme days line up with Lagos dates,
  streaks, growth levels and the ready-made programme templates.
*/

export type StepKind = "pray" | "fast" | "study" | "worship" | "attend" | "serve" | "give" | "reflect" | "custom";

export type Program = {
  id: string;
  title: string;
  objective: string | null;
  teaching: string | null;
  cover_image_url: string | null;
  start_date: string; // YYYY-MM-DD, Lagos
  days: number;
  audience: "everyone" | "selected";
  status: "draft" | "published" | "archived";
  created_at: string;
};

export type Step = {
  id: string;
  program_id: string;
  day: number;
  sort: number;
  kind: StepKind;
  title: string;
  details: string | null;
  scripture: string | null;
  minutes: number | null;
};

export type Checkin = {
  id: string;
  step_id: string;
  program_id: string;
  user_id: string;
  note: string | null;
  shared: boolean;
  created_at: string;
};

export type Assignment = {
  id: string;
  title: string;
  instructions: string | null;
  resources: string | null;
  program_id: string | null;
  due_at: string | null;
  audience: "everyone" | "selected";
  status: "draft" | "published" | "archived";
  created_at: string;
  grace_hours?: number;
};

export type Submission = {
  id: string;
  assignment_id: string;
  user_id: string;
  body: string | null;
  file_path: string | null;
  file_name: string | null;
  link_url: string | null;
  status: "submitted" | "needs_work" | "reviewed";
  feedback: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
  late?: boolean;
  late_reason?: string | null;
  late_note?: string | null;
};

export type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "member" | "author" | "admin";
  status: "pending" | "active" | "inactive";
  created_at: string;
  bible_plan_start?: string | null;
  daily_reminder?: boolean;
  prayer_need?: string | null;
  invite_code?: string | null;
  invited_by?: string | null;
};

export const stepKinds: Record<StepKind, { label: string; verb: string; color: string; icon: string }> = {
  pray: { label: "Pray", verb: "Prayed", color: "#f0b44c", icon: "M12 3v4M8 21l1.5-7L5 11l5-1 2-5 2 5 5 1-4.5 3L16 21l-4-3z" },
  fast: { label: "Fast", verb: "Fasted", color: "#e07a5f", icon: "M12 3a9 9 0 1 0 9 9M12 7v5l3 3M17 3l4 4" },
  study: { label: "Study", verb: "Studied", color: "#7aa2e3", icon: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6" },
  worship: { label: "Worship", verb: "Worshipped", color: "#c792ea", icon: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
  attend: { label: "Attend", verb: "Attended", color: "#e55a3c", icon: "M3 7h13v10H3zM16 10l5-3v10l-5-3" },
  serve: { label: "Serve", verb: "Served", color: "#5fb38a", icon: "M7 11l3-3 4 4 4-4M4 20h16M6 16h12" },
  give: { label: "Give", verb: "Gave", color: "#d4a83a", icon: "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7a3 3 0 1 1 3-3c0 2-3 3-3 3zm0 0a3 3 0 1 0-3-3c0 2 3 3 3 3z" },
  reflect: { label: "Reflect", verb: "Reflected", color: "#9fb4d8", icon: "M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" },
  custom: { label: "Task", verb: "Done", color: "#a9b1c9", icon: "M5 12l4 4L19 6" },
};

export const kindOrder = Object.keys(stepKinds) as StepKind[];

/** Today's date in Lagos as YYYY-MM-DD. */
export function lagosToday(now = Date.now()) {
  return new Date(now + 3600_000).toISOString().slice(0, 10);
}

/** The Lagos date (YYYY-MM-DD) of a timestamp. */
export function lagosDate(iso: string) {
  return new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Which day of the programme it is today: 0 or less = not started, > days = finished. */
export function programDay(program: Pick<Program, "start_date">, today = lagosToday()) {
  return daysBetween(program.start_date, today) + 1;
}

export function programPhase(program: Pick<Program, "start_date" | "days">, today = lagosToday()) {
  const day = programDay(program, today);
  if (day < 1) return { phase: "upcoming" as const, day, startsIn: 1 - day };
  if (day > program.days) return { phase: "finished" as const, day: program.days, startsIn: 0 };
  return { phase: "active" as const, day, startsIn: 0 };
}

/** The calendar date of a programme day, for display. */
export function dateOfDay(program: Pick<Program, "start_date">, day: number) {
  const d = new Date(Date.parse(program.start_date) + (day - 1) * 86_400_000);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

/** Consecutive Lagos days with at least one check-in, ending today (or yesterday, so it isn't lost before you pray today). */
export function streak(checkinDates: string[], today = lagosToday()) {
  const days = new Set(checkinDates.map(lagosDate));
  let cursor = days.has(today) ? today : prevDay(today);
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = prevDay(cursor);
  }
  return count;
}

function prevDay(date: string) {
  return new Date(Date.parse(date) - 86_400_000).toISOString().slice(0, 10);
}

export const levels = [
  { name: "Seed", min: 0, line: "Every city starts with one stone." },
  { name: "Foundation", min: 10, line: "You're laying something that will hold." },
  { name: "Builder", min: 40, line: "Walls are rising. Keep building." },
  { name: "Watchman", min: 100, line: "You stand on the wall for others now." },
  { name: "Pillar", min: 250, line: "The house leans on lives like yours." },
];

/** Growth points from everything a member does. */
export function growthPoints(x: { steps: number; onTime: number; lateWork?: number; lessons?: number; attendance?: number; bibleDays?: number; invites?: number }) {
  return x.steps + x.onTime * 5 + (x.lateWork ?? 0) * 2 + (x.lessons ?? 0) * 3 + (x.attendance ?? 0) * 2 + (x.bibleDays ?? 0) + (x.invites ?? 0) * 5;
}

export const pointsGuide =
  "1 point for each step kept or Bible day read, 2 for each service attended or assignment handed in late, 3 for each lesson passed, and 5 for each assignment handed in on time or friend you invite who joins.";

export function growth(points: number) {
  let index = 0;
  levels.forEach((l, i) => {
    if (points >= l.min) index = i;
  });
  const level = levels[index];
  const next = levels[index + 1] ?? null;
  const progress = next ? (points - level.min) / (next.min - level.min) : 1;
  return { level, next, progress, points, index };
}

export function bibleLink(passage: string) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=NKJV`;
}

export function displayName(m: Pick<Member, "full_name" | "email"> | null | undefined) {
  return m?.full_name?.trim() || m?.email?.split("@")[0] || "Member";
}

export function firstName(m: Pick<Member, "full_name" | "email"> | null | undefined) {
  return displayName(m).split(" ")[0];
}

export function initials(m: Pick<Member, "full_name" | "email"> | null | undefined) {
  return displayName(m)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function lagosDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export function dueLabel(due: string | null, now = Date.now()) {
  if (!due) return null;
  const ms = Date.parse(due) - now;
  const days = Math.round(ms / 86_400_000);
  if (ms < 0) return { text: `Was due ${lagosDateTime(due)}`, late: true };
  if (ms < 86_400_000) return { text: `Due today, ${new Date(due).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" })}`, late: false };
  if (days <= 1) return { text: "Due tomorrow", late: false };
  return { text: `Due in ${days} days`, late: false };
}

export type DraftStep = Omit<Step, "id" | "program_id" | "sort"> & { id?: string };

/** Ready-made programmes the pastor can start from and then edit. */
export const templates: { id: string; title: string; objective: string; days: number; steps: DraftStep[] }[] = [
  {
    id: "three-day-prayer",
    title: "3 days of prayer for light",
    objective: "Pray for light: over our lives, our families and our city.",
    days: 3,
    steps: [
      { day: 1, kind: "pray", title: "Pray for light over your own life", minutes: 30, scripture: "Psalm 119:105", details: "Ask the Lord to shine on every dark place in your heart and your decisions." },
      { day: 1, kind: "study", title: "Read and meditate", minutes: 15, scripture: "John 1:1-9", details: null },
      { day: 2, kind: "pray", title: "Pray for light over your family", minutes: 30, scripture: "Isaiah 60:1-3", details: "Name each person before God." },
      { day: 2, kind: "reflect", title: "Write what God is showing you", minutes: 10, scripture: null, details: null },
      { day: 3, kind: "pray", title: "Pray for light over the city", minutes: 45, scripture: "Matthew 5:14-16", details: "Pray for Lagos, your street, your workplace." },
      { day: 3, kind: "attend", title: "Join Night Watch at 11 PM", minutes: null, scripture: null, details: null },
    ],
  },
  {
    id: "seven-day-fast",
    title: "7-day fast",
    objective: "Seek God with fasting and prayer for direction in this season.",
    days: 7,
    steps: Array.from({ length: 7 }, (_, i) => [
      { day: i + 1, kind: "fast" as const, title: "Fast from 6 AM to 6 PM", minutes: null, scripture: i === 0 ? "Isaiah 58:6-9" : null, details: i === 0 ? "Water only, or as you are able. Break the fast with something light." : null },
      { day: i + 1, kind: "pray" as const, title: i === 6 ? "Pray and give thanks" : "Pray at noon", minutes: 20, scripture: null, details: null },
    ]).flat(),
  },
  {
    id: "twenty-one-day-study",
    title: "21 days in the Gospel of John",
    objective: "Read one chapter a day and know Jesus more.",
    days: 21,
    steps: Array.from({ length: 21 }, (_, i) => ({
      day: i + 1,
      kind: "study" as const,
      title: `Read John ${i + 1}`,
      minutes: 15,
      scripture: `John ${i + 1}`,
      details: null,
    })),
  },
  {
    id: "pray-fast-study",
    title: "Pray, fast and study (5 days)",
    objective: "A short, full rhythm: prayer, fasting and the Word together.",
    days: 5,
    steps: Array.from({ length: 5 }, (_, i) => [
      { day: i + 1, kind: "pray" as const, title: "Morning prayer", minutes: 20, scripture: null, details: null },
      { day: i + 1, kind: "fast" as const, title: "Fast until 12 noon", minutes: null, scripture: null, details: null },
      { day: i + 1, kind: "study" as const, title: `Read Ephesians ${Math.min(i + 1, 6)}`, minutes: 15, scripture: `Ephesians ${Math.min(i + 1, 6)}`, details: null },
    ]).flat(),
  },
];

/** Whole days since a timestamp. */
export function daysSince(iso: string, now = Date.now()) {
  return Math.floor((now - Date.parse(iso)) / 86_400_000);
}
