import type { SupabaseClient } from "@supabase/supabase-js";
import { displayName, lagosToday, type Member } from "@/lib/discipleship";

/** The pastor's weekly picture: who's growing, who's gone quiet, attendance, new people. */
export async function weeklyReport(supabase: SupabaseClient, now = Date.now()) {
  const today = lagosToday(now);
  const weekAgoDate = new Date(Date.parse(today) - 6 * 86_400_000).toISOString().slice(0, 10);
  const weekAgo = new Date(`${weekAgoDate}T00:00:00+01:00`).toISOString();
  const twoWeeksAgo = new Date(Date.parse(weekAgo) - 7 * 86_400_000).toISOString();

  const [people, checkins, lessons, attendance, bible, subs, testimonies, care] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("step_checkins").select("user_id, created_at").gte("created_at", twoWeeksAgo),
    supabase.from("lesson_progress").select("user_id, created_at:completed_at").gte("completed_at", twoWeeksAgo),
    supabase.from("attendance").select("user_id, service_id, service_date, created_at").gte("service_date", weekAgoDate),
    supabase.from("bible_reading").select("user_id, created_at:read_at").gte("read_at", twoWeeksAgo),
    supabase.from("submissions").select("id, status"),
    supabase.from("testimonies").select("id, status, created_at").gte("created_at", weekAgo),
    supabase.from("care_notes").select("id, member_id, body, follow_up_on, done").eq("done", false).not("follow_up_on", "is", null).lte("follow_up_on", today),
  ]);

  const all = (people.data ?? []) as Member[];
  const members = all.filter((m) => m.status === "active" && m.role === "member");
  const events = [
    ...(checkins.data ?? []).map((x) => ({ ...x, pts: 1 })),
    ...(lessons.data ?? []).map((x) => ({ ...x, pts: 3 })),
    ...(attendance.data ?? []).map((x) => ({ user_id: x.user_id, created_at: x.created_at, pts: 2 })),
    ...(bible.data ?? []).map((x) => ({ ...x, pts: 1 })),
  ] as { user_id: string; created_at: string; pts: number }[];
  const thisWeek = events.filter((e) => e.created_at >= weekAgo);
  const activeIds = new Set(thisWeek.map((e) => e.user_id));
  const recentIds = new Set(events.map((e) => e.user_id));

  const points = new Map<string, number>();
  thisWeek.forEach((e) => points.set(e.user_id, (points.get(e.user_id) ?? 0) + e.pts));
  const top = members
    .filter((m) => points.has(m.id))
    .sort((a, b) => (points.get(b.id) ?? 0) - (points.get(a.id) ?? 0))
    .slice(0, 5)
    .map((m) => ({ id: m.id, name: displayName(m), points: points.get(m.id) ?? 0 }));
  const quiet = members.filter((m) => !recentIds.has(m.id) && m.created_at < twoWeeksAgo);

  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(weekAgoDate) + i * 86_400_000).toISOString().slice(0, 10));
  const att = attendance.data ?? [];
  const byDay = days.map((d) => ({
    day: d,
    label: new Date(d).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    night: att.filter((a) => a.service_date === d && a.service_id === "night-watch").length,
    morning: att.filter((a) => a.service_date === d && a.service_id === "morning-prayers").length,
  }));

  const newPeople = all.filter((m) => m.created_at >= weekAgo);
  const name = new Map(all.map((m) => [m.id, displayName(m)]));

  return {
    range: `${new Date(weekAgoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – ${new Date(today).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`,
    totals: {
      members: members.length,
      active: members.filter((m) => activeIds.has(m.id)).length,
      newPeople: newPeople.length,
      pending: all.filter((m) => m.status === "pending").length,
      steps: thisWeek.filter((e) => e.pts === 1).length,
      lessons: (lessons.data ?? []).filter((l) => l.created_at >= weekAgo).length,
      attendance: att.length,
      toReview: (subs.data ?? []).filter((s) => s.status === "submitted").length,
      testimonies: (testimonies.data ?? []).length,
    },
    byDay,
    top,
    quiet: quiet.map((m) => ({ id: m.id, name: displayName(m), phone: m.phone })),
    newPeople: newPeople.map((m) => ({ id: m.id, name: displayName(m), status: m.status })),
    followUps: (care.data ?? []).filter((c) => !c.done && c.follow_up_on && c.follow_up_on <= today).map((c) => ({ id: c.id, member_id: c.member_id, name: name.get(c.member_id) ?? "Member", body: c.body as string, on: c.follow_up_on as string })),
  };
}

export function reportText(r: Awaited<ReturnType<typeof weeklyReport>>) {
  const t = r.totals;
  const lines = [
    `*City Builders: the week of ${r.range}*`,
    "",
    `👥 ${t.active} of ${t.members} members active this week`,
    `🙏 ${t.attendance} check-ins at Night Watch and Morning Prayers`,
    `✅ ${t.steps} programme steps kept · 📚 ${t.lessons} lessons passed`,
    `🌱 ${t.newPeople} new sign-ups${t.pending ? ` (${t.pending} waiting for approval)` : ""}`,
    t.testimonies ? `✨ ${t.testimonies} new testimonies` : "",
    "",
    r.top.length ? `*Most active:* ${r.top.map((x) => x.name).join(", ")}` : "",
    r.quiet.length ? `*Please reach out to:* ${r.quiet.map((x) => x.name).join(", ")}` : "",
  ];
  return lines.filter((l, i, a) => l !== "" || (i > 0 && a[i - 1] !== "")).join("\n").trim();
}
