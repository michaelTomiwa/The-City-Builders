"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { kindOrder, type DraftStep, type StepKind } from "@/lib/discipleship";

/** Pastor tools run as a signed-in admin or author; the database enforces the same rules. */
async function staff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "member") throw new Error("Your account isn't approved to make changes yet.");
  return { supabase, role: profile.role as "admin" | "author" };
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optional(fd: FormData, key: string) {
  return text(fd, key) || null;
}

function lagosToIso(value: string | null) {
  return value ? new Date(`${value}:00+01:00`).toISOString() : null;
}

function ids(fd: FormData, key: string): string[] {
  try {
    const v = JSON.parse(text(fd, key) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Members ---------------------------------------------------------------------------

export async function setMemberStatus(fd: FormData) {
  const { supabase } = await staff();
  const status = text(fd, "status");
  if (!["pending", "active", "inactive"].includes(status)) throw new Error("Unknown status");
  check((await supabase.from("profiles").update({ status }).eq("id", text(fd, "id"))).error);
  revalidatePath("/admin", "layout");
}

export async function approveAllPending() {
  const { supabase } = await staff();
  check((await supabase.from("profiles").update({ status: "active" }).eq("status", "pending")).error);
  revalidatePath("/admin", "layout");
}

export async function setMemberRole(fd: FormData) {
  const { supabase, role } = await staff();
  if (role !== "admin") throw new Error("Only an admin can change roles.");
  const next = text(fd, "role");
  if (!["member", "author", "admin"].includes(next)) throw new Error("Unknown role");
  check((await supabase.from("profiles").update({ role: next, status: "active" }).eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/members");
}

// Programmes -------------------------------------------------------------------------

export async function saveProgram(fd: FormData) {
  const { supabase } = await staff();
  const id = optional(fd, "id");
  const days = Math.max(1, Math.min(90, Number(text(fd, "days")) || 1));
  const payload = {
    title: text(fd, "title"),
    objective: optional(fd, "objective"),
    teaching: optional(fd, "teaching"),
    cover_image_url: optional(fd, "cover_image_url"),
    start_date: text(fd, "start_date"),
    days,
    audience: text(fd, "audience") === "selected" ? "selected" : "everyone",
    status: ["draft", "published", "archived"].includes(text(fd, "status")) ? text(fd, "status") : "draft",
    updated_at: new Date().toISOString(),
  };
  if (!payload.title) throw new Error("Give the programme a title.");

  let programId = id;
  if (id) {
    check((await supabase.from("programs").update(payload).eq("id", id)).error);
  } else {
    const { data, error } = await supabase.from("programs").insert(payload).select("id").single();
    check(error);
    programId = data!.id as string;
  }

  // Steps: update the ones that exist, add new ones, remove the ones taken out.
  let steps: DraftStep[] = [];
  try {
    steps = JSON.parse(text(fd, "steps") || "[]");
  } catch {
    steps = [];
  }
  const clean = steps
    .filter((s) => s.title?.trim() && s.day >= 1 && s.day <= days)
    .map((s, i) => ({
      id: s.id,
      program_id: programId!,
      day: Math.round(s.day),
      sort: i,
      kind: (kindOrder.includes(s.kind as StepKind) ? s.kind : "custom") as StepKind,
      title: s.title.trim(),
      details: s.details?.trim() || null,
      scripture: s.scripture?.trim() || null,
      minutes: s.minutes ? Math.max(1, Math.round(Number(s.minutes))) : null,
    }));

  const { data: existing } = await supabase.from("program_steps").select("id").eq("program_id", programId!);
  const keep = new Set(clean.filter((s) => s.id).map((s) => s.id));
  const removed = (existing ?? []).map((r) => r.id as string).filter((x) => !keep.has(x));
  if (removed.length) check((await supabase.from("program_steps").delete().in("id", removed)).error);
  for (const s of clean.filter((s) => s.id)) {
    const { id: stepId, ...rest } = s;
    check((await supabase.from("program_steps").update(rest).eq("id", stepId!)).error);
  }
  const fresh = clean
    .filter((s) => !s.id)
    .map((s) => ({ program_id: s.program_id, day: s.day, sort: s.sort, kind: s.kind, title: s.title, details: s.details, scripture: s.scripture, minutes: s.minutes }));
  if (fresh.length) check((await supabase.from("program_steps").insert(fresh)).error);

  // Who it's for
  check((await supabase.from("program_members").delete().eq("program_id", programId!)).error);
  const members = payload.audience === "selected" ? ids(fd, "members") : [];
  if (members.length) {
    check((await supabase.from("program_members").insert(members.map((user_id) => ({ program_id: programId!, user_id })))).error);
  }

  revalidatePath("/admin/programs");
  revalidatePath("/me", "layout");
  redirect(`/admin/programs/${programId}?saved=1`);
}

export async function deleteProgram(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("programs").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/programs");
  revalidatePath("/me", "layout");
  redirect("/admin/programs");
}

// Assignments ----------------------------------------------------------------------

export async function saveAssignment(fd: FormData) {
  const { supabase } = await staff();
  const id = optional(fd, "id");
  const payload = {
    title: text(fd, "title"),
    instructions: optional(fd, "instructions"),
    resources: optional(fd, "resources"),
    program_id: optional(fd, "program_id"),
    due_at: lagosToIso(optional(fd, "due_at")),
    audience: text(fd, "audience") === "selected" ? "selected" : "everyone",
    status: ["draft", "published", "archived"].includes(text(fd, "status")) ? text(fd, "status") : "draft",
    updated_at: new Date().toISOString(),
  };
  if (!payload.title) throw new Error("Give the assignment a title.");

  let assignmentId = id;
  if (id) {
    check((await supabase.from("assignments").update(payload).eq("id", id)).error);
  } else {
    const { data, error } = await supabase.from("assignments").insert(payload).select("id").single();
    check(error);
    assignmentId = data!.id as string;
  }

  check((await supabase.from("assignment_members").delete().eq("assignment_id", assignmentId!)).error);
  const members = payload.audience === "selected" ? ids(fd, "members") : [];
  if (members.length) {
    check(
      (await supabase.from("assignment_members").insert(members.map((user_id) => ({ assignment_id: assignmentId!, user_id })))).error
    );
  }

  revalidatePath("/admin/assignments");
  revalidatePath("/me", "layout");
  redirect(`/admin/assignments/${assignmentId}?saved=1`);
}

export async function deleteAssignment(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("assignments").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/assignments");
  revalidatePath("/me", "layout");
  redirect("/admin/assignments");
}

export async function reviewSubmission(fd: FormData) {
  const { supabase } = await staff();
  const status = text(fd, "status") === "needs_work" ? "needs_work" : "reviewed";
  check(
    (
      await supabase
        .from("submissions")
        .update({ status, feedback: optional(fd, "feedback"), reviewed_at: new Date().toISOString() })
        .eq("id", text(fd, "id"))
    ).error
  );
  revalidatePath(`/admin/assignments/${text(fd, "assignment_id")}`);
  revalidatePath("/admin", "layout");
}

// Notices -------------------------------------------------------------------------------

export async function saveNotice(fd: FormData) {
  const { supabase } = await staff();
  const title = text(fd, "title");
  const body = text(fd, "body");
  if (!title || !body) throw new Error("A notice needs a title and a message.");
  check((await supabase.from("member_notices").insert({ title, body, pinned: fd.get("pinned") === "on" })).error);
  revalidatePath("/admin/notices");
  revalidatePath("/me", "layout");
  redirect("/admin/notices?saved=1");
}

export async function toggleNoticePin(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("member_notices").update({ pinned: fd.get("pinned") !== "true" }).eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/notices");
  revalidatePath("/me", "layout");
}

export async function deleteNotice(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("member_notices").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/notices");
  revalidatePath("/me", "layout");
}

// Discipleship School ------------------------------------------------------------------

function slugOf(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course";
}

export async function saveCourse(fd: FormData) {
  const { supabase } = await staff();
  const id = optional(fd, "id");
  const title = text(fd, "title");
  if (!title) throw new Error("Give the course a title.");

  // a web address no other course is using
  const base = slugOf(text(fd, "slug") || title);
  const { data: taken } = await supabase.from("courses").select("id, slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).filter((r) => r.id !== id).map((r) => r.slug as string));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  const payload = {
    title,
    slug,
    summary: optional(fd, "summary"),
    cover_image_url: optional(fd, "cover_image_url"),
    status: ["draft", "published", "archived"].includes(text(fd, "status")) ? text(fd, "status") : "draft",
    sort: Number(text(fd, "sort")) || 0,
    updated_at: new Date().toISOString(),
  };

  let courseId = id;
  if (id) check((await supabase.from("courses").update(payload).eq("id", id)).error);
  else {
    const { data, error } = await supabase.from("courses").insert(payload).select("id").single();
    check(error);
    courseId = data!.id as string;
  }

  type InLesson = { id?: string; title: string; video_url: string | null; scripture: string | null; body: string | null; questions: { question: string; options: string[]; answer: number; explanation: string | null }[] };
  let lessons: InLesson[] = [];
  try {
    lessons = JSON.parse(text(fd, "lessons") || "[]");
  } catch {
    lessons = [];
  }
  lessons = lessons.filter((l) => l.title?.trim());

  const { data: existing } = await supabase.from("lessons").select("id").eq("course_id", courseId!);
  const keep = new Set(lessons.filter((l) => l.id).map((l) => l.id));
  const removed = (existing ?? []).map((r) => r.id as string).filter((x) => !keep.has(x));
  if (removed.length) check((await supabase.from("lessons").delete().in("id", removed)).error);

  for (const [i, l] of lessons.entries()) {
    const row = {
      course_id: courseId!,
      sort: i,
      title: l.title.trim(),
      video_url: l.video_url?.trim() || null,
      scripture: l.scripture?.trim() || null,
      body: l.body?.trim() || null,
    };
    let lessonId = l.id;
    if (lessonId) check((await supabase.from("lessons").update(row).eq("id", lessonId)).error);
    else {
      const { data, error } = await supabase.from("lessons").insert(row).select("id").single();
      check(error);
      lessonId = data!.id as string;
    }
    check((await supabase.from("quiz_questions").delete().eq("lesson_id", lessonId!)).error);
    const qs = (l.questions ?? [])
      .map((q) => ({ ...q, options: (q.options ?? []).map((o) => o.trim()).filter(Boolean) }))
      .filter((q) => q.question?.trim() && q.options.length >= 2)
      .map((q, qi) => ({
        lesson_id: lessonId!,
        sort: qi,
        question: q.question.trim(),
        options: q.options,
        answer: Math.min(Math.max(0, q.answer ?? 0), q.options.length - 1),
        explanation: q.explanation?.trim() || null,
      }));
    if (qs.length) check((await supabase.from("quiz_questions").insert(qs)).error);
  }

  revalidatePath("/admin/school");
  revalidatePath("/me", "layout");
  redirect(`/admin/school/${courseId}?saved=1`);
}

export async function deleteCourse(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("courses").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/school");
  revalidatePath("/me", "layout");
  redirect("/admin/school");
}

// Prayer partners ----------------------------------------------------------------------

export async function pairEveryone() {
  const { supabase } = await staff();
  const [{ data: people }, { data: pairs }] = await Promise.all([
    supabase.from("profiles").select("id").eq("status", "active").eq("role", "member"),
    supabase.from("prayer_partners").select("user_a, user_b"),
  ]);
  const paired = new Set((pairs ?? []).flatMap((p) => [p.user_a as string, p.user_b as string]));
  const free = (people ?? []).map((p) => p.id as string).filter((id) => !paired.has(id));
  // shuffle, then pair neighbours
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }
  const rows = [];
  for (let i = 0; i + 1 < free.length; i += 2) rows.push({ user_a: free[i], user_b: free[i + 1] });
  if (rows.length) check((await supabase.from("prayer_partners").insert(rows)).error);
  revalidatePath("/admin/partners");
  redirect(`/admin/partners?paired=${rows.length}${free.length % 2 ? "&odd=1" : ""}`);
}

export async function pairTwo(fd: FormData) {
  const { supabase } = await staff();
  const a = text(fd, "user_a");
  const b = text(fd, "user_b");
  if (!a || !b || a === b) throw new Error("Choose two different people.");
  check((await supabase.from("prayer_partners").insert({ user_a: a, user_b: b })).error);
  revalidatePath("/admin/partners");
}

export async function unpair(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("prayer_partners").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/partners");
}

// Testimonies ---------------------------------------------------------------------------

export async function reviewTestimony(fd: FormData) {
  const { supabase } = await staff();
  const status = ["approved", "declined", "pending"].includes(text(fd, "status")) ? text(fd, "status") : "pending";
  check((await supabase.from("testimonies").update({ status, reviewed_at: new Date().toISOString() }).eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/testimonies");
  revalidatePath("/testimonies");
  revalidatePath("/");
}

export async function deleteTestimony(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("testimonies").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/testimonies");
  revalidatePath("/testimonies");
  revalidatePath("/");
}

// Pastoral care --------------------------------------------------------------------------

export async function addCareNote(fd: FormData) {
  const { supabase } = await staff();
  const memberId = text(fd, "member_id");
  const body = text(fd, "body");
  if (!body) throw new Error("Write the note first.");
  const tags = ["note", "new-believer", "struggling", "needs-visit", "celebrate", "prayer"];
  check(
    (
      await supabase.from("care_notes").insert({
        member_id: memberId,
        body,
        tag: tags.includes(text(fd, "tag")) ? text(fd, "tag") : "note",
        follow_up_on: optional(fd, "follow_up_on"),
      })
    ).error
  );
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
}

export async function toggleCareDone(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("care_notes").update({ done: text(fd, "done") !== "true" }).eq("id", text(fd, "id"))).error);
  revalidatePath(`/admin/members/${text(fd, "member_id")}`);
  revalidatePath("/admin");
}

export async function deleteCareNote(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("care_notes").delete().eq("id", text(fd, "id"))).error);
  revalidatePath(`/admin/members/${text(fd, "member_id")}`);
}

// Teams ---------------------------------------------------------------------------------

export async function saveTeam(fd: FormData) {
  const { supabase } = await staff();
  const id = optional(fd, "id");
  const name = text(fd, "name");
  if (!name) throw new Error("Give the team a name.");
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "team";
  const { data: taken } = await supabase.from("teams").select("id, slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).filter((r) => r.id !== id).map((r) => r.slug as string));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  const payload = { name, slug, description: optional(fd, "description"), color: text(fd, "color") || "#f0b44c" };
  let teamId = id;
  if (id) check((await supabase.from("teams").update(payload).eq("id", id)).error);
  else {
    const { data, error } = await supabase.from("teams").insert(payload).select("id").single();
    check(error);
    teamId = data!.id as string;
  }
  revalidatePath("/admin/teams", "layout");
  revalidatePath("/me", "layout");
  redirect(`/admin/teams/${teamId}${id ? "?tab=settings&saved=1" : "?tab=people"}`);
}

export async function deleteTeam(fd: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("teams").delete().eq("id", text(fd, "id"))).error);
  revalidatePath("/admin/teams", "layout");
  revalidatePath("/me", "layout");
  redirect("/admin/teams");
}

export async function setTeamMember(fd: FormData) {
  const { supabase } = await staff();
  const teamId = text(fd, "team_id");
  const role = ["lead", "assistant", "member"].includes(text(fd, "role")) ? text(fd, "role") : "member";
  check(
    (
      await supabase
        .from("team_members")
        .upsert({ team_id: teamId, user_id: text(fd, "user_id"), role, title: optional(fd, "title") }, { onConflict: "team_id,user_id" })
    ).error
  );
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/me", "layout");
}

export async function removeTeamMember(fd: FormData) {
  const { supabase } = await staff();
  const teamId = text(fd, "team_id");
  check((await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", text(fd, "user_id"))).error);
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/me", "layout");
}

export async function replyToReport(fd: FormData) {
  const { supabase } = await staff();
  const teamId = text(fd, "team_id");
  check(
    (await supabase.from("team_reports").update({ pastor_reply: optional(fd, "reply"), replied_at: new Date().toISOString() }).eq("id", text(fd, "id"))).error
  );
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath("/me", "layout");
}
