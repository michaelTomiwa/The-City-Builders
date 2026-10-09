"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { recentDuplicate } from "@/lib/duplicates";

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  return { supabase, user, name: profile?.full_name ?? user.email ?? "Member", isStaff: profile?.role === "admin" || profile?.role === "author" };
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

async function slugOf(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string) {
  const { data } = await supabase.from("teams").select("slug").eq("id", teamId).maybeSingle();
  return (data?.slug as string) ?? "";
}

function refresh(slug: string) {
  revalidatePath(`/me/teams/${slug}`);
  revalidatePath("/me", "layout");
  revalidatePath("/admin/teams", "layout");
}

// Board and prayer --------------------------------------------------------------------

export async function postToTeam(fd: FormData) {
  const { supabase, user, name } = await me();
  const teamId = text(fd, "team_id");
  const body = text(fd, "body");
  const kind = text(fd, "kind") === "prayer" ? "prayer" : "update";
  const slug = await slugOf(supabase, teamId);
  if (body && !(await recentDuplicate(supabase, "team_posts", { team_id: teamId, author_id: user.id, body }))) {
    check((await supabase.from("team_posts").insert({ team_id: teamId, author_id: user.id, author_name: name, kind, body })).error);
  }
  refresh(slug);
  redirect(`/me/teams/${slug}?tab=${kind === "prayer" ? "prayer" : "board"}`);
}

export async function deleteTeamPost(fd: FormData) {
  const { supabase } = await me();
  check((await supabase.from("team_posts").delete().eq("id", text(fd, "id"))).error);
  refresh(text(fd, "slug"));
}

export async function prayForPost(postId: string, praying: boolean, slug: string) {
  const { supabase, user } = await me();
  if (praying) check((await supabase.from("team_post_prayers").upsert({ post_id: postId, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true })).error);
  else check((await supabase.from("team_post_prayers").delete().eq("post_id", postId).eq("user_id", user.id)).error);
  revalidatePath(`/me/teams/${slug}`);
}

// Tasks -----------------------------------------------------------------------------------

export async function createTeamTask(fd: FormData) {
  const { supabase, user } = await me();
  const teamId = text(fd, "team_id");
  const title = text(fd, "title");
  if (!title) throw new Error("Give the task a title.");
  const due = text(fd, "due_at");
  if (await recentDuplicate(supabase, "team_tasks", { team_id: teamId, title })) {
    const slug = await slugOf(supabase, teamId);
    redirect(`/me/teams/${slug}?tab=tasks`);
  }
  const { data: task, error } = await supabase
    .from("team_tasks")
    .insert({ team_id: teamId, title, details: text(fd, "details") || null, due_at: due ? new Date(`${due}:00+01:00`).toISOString() : null, created_by: user.id })
    .select("id")
    .single();
  check(error);

  let people: string[] = [];
  try {
    people = JSON.parse(text(fd, "assignees") || "[]");
  } catch {
    people = [];
  }
  if (people.length === 0) {
    const { data: roster } = await supabase.from("team_members").select("user_id").eq("team_id", teamId);
    people = (roster ?? []).map((r) => r.user_id as string);
  }
  if (people.length) check((await supabase.from("task_assignments").insert(people.map((user_id) => ({ task_id: task!.id, team_id: teamId, user_id })))).error);
  const slug = await slugOf(supabase, teamId);
  refresh(slug);
  redirect(`/me/teams/${slug}?tab=tasks`);
}

export async function deleteTeamTask(fd: FormData) {
  const { supabase } = await me();
  check((await supabase.from("team_tasks").delete().eq("id", text(fd, "id"))).error);
  refresh(text(fd, "slug"));
}

/** A member marks their task done (with a note and an optional proof link), or reopens it. */
export async function updateMyTask(fd: FormData) {
  const { supabase, user } = await me();
  const status = text(fd, "status") === "todo" ? "todo" : "done";
  check(
    (
      await supabase
        .from("task_assignments")
        .update({ status, note: text(fd, "note") || null, proof_url: text(fd, "proof_url") || null })
        .eq("task_id", text(fd, "task_id"))
        .eq("user_id", user.id)
    ).error
  );
  refresh(text(fd, "slug"));
}

/** A lead approves a member's task or asks them to have another go. */
export async function reviewTeamTask(fd: FormData) {
  const { supabase } = await me();
  const status = text(fd, "status") === "redo" ? "redo" : "approved";
  check(
    (
      await supabase
        .from("task_assignments")
        .update({ status, feedback: text(fd, "feedback") || null })
        .eq("task_id", text(fd, "task_id"))
        .eq("user_id", text(fd, "user_id"))
    ).error
  );
  refresh(text(fd, "slug"));
}

// Reports, messages, meetings -------------------------------------------------------------

export async function submitTeamReport(fd: FormData) {
  const { supabase, user, name } = await me();
  const teamId = text(fd, "team_id");
  check(
    (
      await supabase.from("team_reports").insert({
        team_id: teamId,
        author_id: user.id,
        author_name: name,
        health: Number(text(fd, "health")) || null,
        god_doing: text(fd, "god_doing") || null,
        growth: text(fd, "growth") || null,
        wins: text(fd, "wins") || null,
        concerns: text(fd, "concerns") || null,
        prayer: text(fd, "prayer") || null,
      })
    ).error
  );
  const slug = await slugOf(supabase, teamId);
  refresh(slug);
  redirect(`/me/teams/${slug}?tab=reports&sent=1`);
}

export async function sendTeamMessage(fd: FormData) {
  const { supabase, user, name, isStaff } = await me();
  const teamId = text(fd, "team_id");
  const body = text(fd, "body");
  if (body && !(await recentDuplicate(supabase, "team_messages", { team_id: teamId, author_id: user.id, body }))) {
    check((await supabase.from("team_messages").insert({ team_id: teamId, author_id: user.id, author_name: name, body })).error);
  }
  const slug = await slugOf(supabase, teamId);
  refresh(slug);
  if (text(fd, "from") === "admin" && isStaff) redirect(`/admin/teams/${teamId}?tab=messages`);
  redirect(`/me/teams/${slug}?tab=leaders`);
}

export async function recordMeeting(fd: FormData) {
  const { supabase, user } = await me();
  const teamId = text(fd, "team_id");
  const title = text(fd, "title") || "Team meeting";
  if (await recentDuplicate(supabase, "team_meetings", { team_id: teamId, title })) {
    const slug = await slugOf(supabase, teamId);
    redirect(`/me/teams/${slug}?tab=meetings`);
  }
  const { data, error } = await supabase
    .from("team_meetings")
    .insert({ team_id: teamId, title, held_on: text(fd, "held_on") || undefined, notes: text(fd, "notes") || null, created_by: user.id })
    .select("id")
    .single();
  check(error);
  const present = fd.getAll("present").map(String);
  if (present.length) check((await supabase.from("team_meeting_attendance").insert(present.map((user_id) => ({ meeting_id: data!.id, user_id })))).error);
  const slug = await slugOf(supabase, teamId);
  refresh(slug);
  redirect(`/me/teams/${slug}?tab=meetings`);
}
