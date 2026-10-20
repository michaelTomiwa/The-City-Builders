import { cache } from "react";
import { addWeeks, forPerson, inWeek, mondayOf, thisWeek, weekStreak, type WeekItem, type WeekTick } from "@/lib/week";
import { createClient } from "@/lib/supabase-server";
import { growth, growthPoints, streak, type Assignment, type Checkin, type Member, type Program, type Step, type Submission } from "@/lib/discipleship";

/** The signed-in member and their profile (once per request). */
export const getMember = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile: (profile ?? null) as Member | null };
});

/** Everything the member's dashboard needs: their programmes, steps, check-ins, assignments and submissions. */
export const getMemberData = cache(async () => {
  const { supabase, user } = await getMember();
  if (!user) throw new Error("Not signed in");

  const [programs, myPrograms, checkins, assignments, myAssignments, submissions, notices, lessonsDone, attended, bibleDays, invites, weekTicks] = await Promise.all([
    supabase.from("programs").select("*").eq("status", "published").order("start_date", { ascending: false }),
    supabase.from("program_members").select("program_id").eq("user_id", user.id),
    supabase.from("step_checkins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("assignments").select("*").eq("status", "published").order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("assignment_members").select("assignment_id").eq("user_id", user.id),
    supabase.from("submissions").select("*").eq("user_id", user.id),
    supabase.from("member_notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
    supabase.from("lesson_progress").select("lesson_id, course_id, completed_at").eq("user_id", user.id),
    supabase.from("attendance").select("service_id, service_date, created_at").eq("user_id", user.id).order("service_date", { ascending: false }),
    supabase.from("bible_reading").select("day, read_at").eq("user_id", user.id),
    supabase.rpc("my_invites"),
    supabase.from("week_ticks").select("item_id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const mineP = new Set((myPrograms.data ?? []).map((r) => r.program_id as string));
  const mineA = new Set((myAssignments.data ?? []).map((r) => r.assignment_id as string));
  // Admins can read every programme, so only keep the ones meant for this member.
  const programList = ((programs.data ?? []) as Program[]).filter((p) => p.audience === "everyone" || mineP.has(p.id));
  const assignmentList = ((assignments.data ?? []) as Assignment[]).filter((a) => a.audience === "everyone" || mineA.has(a.id));

  const { data: steps } = programList.length
    ? await supabase
        .from("program_steps")
        .select("*")
        .in("program_id", programList.map((p) => p.id))
        .order("day")
        .order("sort")
    : { data: [] };

  return {
    programs: programList,
    steps: (steps ?? []) as Step[],
    checkins: (checkins.data ?? []) as Checkin[],
    assignments: assignmentList,
    submissions: (submissions.data ?? []) as Submission[],
    notices: (notices.data ?? []) as { id: string; title: string; body: string; pinned: boolean; created_at: string }[],
    lessonsDone: (lessonsDone.data ?? []) as { lesson_id: string; course_id: string; completed_at: string }[],
    attendance: (attended.data ?? []) as { service_id: string; service_date: string; created_at: string }[],
    bibleDays: (bibleDays.data ?? []) as { day: number; read_at: string }[],
    invites: (invites.data ?? []) as { full_name: string | null; status: string; joined_at: string }[],
    weekTicks: weekTicks.count ?? 0,
  };
});

/** Growth level and streak from every kind of activity (steps, lessons, services, Bible reading). */
export function memberGrowth(d: Awaited<ReturnType<typeof getMemberData>>) {
  const reviewed = d.submissions.filter((s) => s.status === "reviewed").length;
  const lateWork = d.submissions.filter((s) => s.late).length;
  const g = growth(
    growthPoints({
      steps: d.checkins.length,
      onTime: d.submissions.length - lateWork,
      lateWork,
      lessons: d.lessonsDone.length,
      attendance: d.attendance.length,
      bibleDays: d.bibleDays.length,
      invites: d.invites.filter((i) => i.status === "active").length,
      weekTicks: d.weekTicks,
    })
  );
  const activity = [
    ...d.checkins.map((c) => c.created_at),
    ...d.lessonsDone.map((l) => l.completed_at),
    ...d.attendance.map((a) => a.created_at),
    ...d.bibleDays.map((b) => b.read_at),
  ];
  return { g, streakDays: streak(activity), reviewed };
}

/** The member's "This Week": items for this week, their ticks, and the last weeks' history for the streak. */
export const getMyWeek = cache(async () => {
  const { supabase, user, profile } = await getMember();
  if (!user) throw new Error("Not signed in");
  const current = thisWeek();
  // Weeks before someone joined don't count against them.
  const joined = profile?.created_at ? mondayOf(profile.created_at.slice(0, 10)) : "0000-01-01";
  const since = addWeeks(current, -11);
  const [items, ticks, teams, picked] = await Promise.all([
    supabase.from("week_items").select("*").lte("start_week", current).order("sort").order("created_at"),
    supabase.from("week_ticks").select("*").eq("user_id", user.id).gte("week_start", since),
    supabase.from("team_members").select("team_id, teams(name)").eq("user_id", user.id),
    supabase.from("week_item_members").select("item_id, user_id").eq("user_id", user.id),
  ]);
  const teamRows = (teams.data ?? []) as unknown as { team_id: string; teams: { name: string } | null }[];
  const teamsOf = new Set(teamRows.map((t) => t.team_id));
  const teamNames = new Map(teamRows.map((t) => [t.team_id, t.teams?.name ?? "Your team"]));
  const selected = new Map<string, Set<string>>();
  for (const r of picked.data ?? []) selected.set(r.item_id as string, new Set([user.id]));
  // Staff can read every item, so keep only the ones meant for this person.
  const mine = ((items.data ?? []) as WeekItem[]).filter((i) => forPerson(i, user.id, teamsOf, selected));
  const tickList = (ticks.data ?? []) as WeekTick[];

  const history = Array.from({ length: 12 }, (_, n) => addWeeks(current, -n))
    .filter((week) => week === current || week >= joined)
    .map((week) => {
    const list = mine.filter((i) => inWeek(i, week));
    const done = new Set(tickList.filter((t) => t.week_start === week).map((t) => t.item_id));
    return { week, total: list.length, done: list.filter((i) => done.has(i.id)).length };
  });

  return {
    week: current,
    items: mine.filter((i) => inWeek(i, current)),
    ticks: tickList.filter((t) => t.week_start === current),
    allTicks: tickList.length,
    history,
    streak: weekStreak(history, current),
    teamNames,
  };
});
