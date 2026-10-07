import { cache } from "react";
import { createClient } from "@/lib/supabase-server";
import type { Assignment, Checkin, Member, Program, Step, Submission } from "@/lib/discipleship";

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

  const [programs, myPrograms, checkins, assignments, myAssignments, submissions, notices] = await Promise.all([
    supabase.from("programs").select("*").eq("status", "published").order("start_date", { ascending: false }),
    supabase.from("program_members").select("program_id").eq("user_id", user.id),
    supabase.from("step_checkins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("assignments").select("*").eq("status", "published").order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("assignment_members").select("assignment_id").eq("user_id", user.id),
    supabase.from("submissions").select("*").eq("user_id", user.id),
    supabase.from("member_notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
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
  };
});
