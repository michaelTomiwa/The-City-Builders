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
