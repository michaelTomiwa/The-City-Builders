"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { recentDuplicate } from "@/lib/duplicates";
import { after } from "next/server";
import { lateReasons } from "@/lib/accountability";
import { sendMessagePush } from "@/lib/push";

async function member() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");
  return { supabase, user };
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function checkIn(input: { stepId: string; programId: string; note?: string; shared?: boolean }) {
  const { supabase, user } = await member();
  check(
    (
      await supabase.from("step_checkins").upsert(
        {
          step_id: input.stepId,
          program_id: input.programId,
          user_id: user.id,
          note: input.note?.trim() || null,
          shared: Boolean(input.shared && input.note?.trim()),
        },
        { onConflict: "step_id,user_id" }
      )
    ).error
  );
  revalidatePath("/me", "layout");
}

export async function undoCheckIn(stepId: string) {
  const { supabase, user } = await member();
  check((await supabase.from("step_checkins").delete().eq("step_id", stepId).eq("user_id", user.id)).error);
  revalidatePath("/me", "layout");
}

export async function submitAssignment(formData: FormData) {
  const { supabase, user } = await member();
  const assignmentId = String(formData.get("assignment_id"));
  const body = String(formData.get("body") ?? "").trim() || null;
  const link = String(formData.get("link_url") ?? "").trim() || null;
  const filePath = String(formData.get("file_path") ?? "").trim() || null;
  const fileName = String(formData.get("file_name") ?? "").trim() || null;
  if (!body && !link && !filePath) {
    redirect(`/me/assignments/${assignmentId}?error=${encodeURIComponent("Write something, attach a file or add a link before you submit.")}`);
  }
  if (filePath && !filePath.startsWith(`${user.id}/`)) throw new Error("That file isn't yours.");

  // A first hand-in after the due date needs a reason (the database decides what's late).
  const [{ data: assignment }, { data: existing }] = await Promise.all([
    supabase.from("assignments").select("title, due_at").eq("id", assignmentId).maybeSingle(),
    supabase.from("submissions").select("id").eq("assignment_id", assignmentId).eq("user_id", user.id).maybeSingle(),
  ]);
  const late = !existing && assignment?.due_at && Date.parse(assignment.due_at) < Date.now();
  const reason = String(formData.get("late_reason") ?? "");
  const lateNote = String(formData.get("late_note") ?? "").trim().slice(0, 2000) || null;
  if (late && !lateReasons.some((r) => r.id === reason)) {
    redirect(`/me/assignments/${assignmentId}?error=${encodeURIComponent("Please tell the pastor what happened before you hand in.")}`);
  }

  check(
    (
      await supabase.from("submissions").upsert(
        {
          assignment_id: assignmentId,
          user_id: user.id,
          body,
          link_url: link,
          file_path: filePath,
          file_name: fileName,
          submitted_at: new Date().toISOString(),
          ...(late ? { late_reason: reason, late_note: lateNote } : {}),
        },
        { onConflict: "assignment_id,user_id" }
      )
    ).error
  );

  // "I'm going through something" goes straight to the pastor, in their private conversation.
  if (late && reason === "struggling") {
    const words = lateNote ? `\n\n"${lateNote}"` : "";
    const { data: message } = await supabase
      .from("direct_messages")
      .insert({ member_id: user.id, body: `I handed in "${assignment?.title ?? "my assignment"}" late. I'm going through something right now.${words}` })
      .select("*")
      .single();
    if (message) {
      after(() =>
        sendMessagePush("staff", () => ({ title: `${message.author_name ?? "A member"} is going through something`, body: lateNote ?? "Handed in late and asked for care.", url: `/admin/messages?m=${user.id}` }), `care-${user.id}`)
      );
    }
  }

  revalidatePath("/me", "layout");
  redirect(`/me/assignments/${assignmentId}?submitted=${late ? "late" : "1"}`);
}

export async function saveJournal(formData: FormData) {
  const { supabase, user } = await member();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect("/me/journal");
  if (await recentDuplicate(supabase, "journal_entries", { user_id: user.id, body })) redirect("/me/journal?saved=1");
  check(
    (
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: String(formData.get("title") ?? "").trim() || null,
        body,
        shared: formData.get("shared") === "on",
      })
    ).error
  );
  revalidatePath("/me/journal");
  redirect("/me/journal?saved=1");
}

export async function deleteJournal(formData: FormData) {
  const { supabase, user } = await member();
  check((await supabase.from("journal_entries").delete().eq("id", String(formData.get("id"))).eq("user_id", user.id)).error);
  revalidatePath("/me/journal");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await member();
  check(
    (
      await supabase
        .from("profiles")
        .update({
          full_name: String(formData.get("full_name") ?? "").trim() || null,
          phone: String(formData.get("phone") ?? "").trim() || null,
          daily_reminder: formData.get("daily_reminder") === "on",
        })
        .eq("id", user.id)
    ).error
  );
  revalidatePath("/me", "layout");
  redirect("/me/profile?saved=1");
}

export async function signOutMember() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeLesson(lessonId: string, answers: number[]) {
  const { supabase } = await member();
  const { data, error } = await supabase.rpc("complete_lesson", { p_lesson: lessonId, p_answers: answers });
  check(error);
  revalidatePath("/me", "layout");
  return data as { score: number; total: number; passed: boolean; correct: number[]; explanations: string[] };
}

// Bible in a year and scripture memory ---------------------------------------------------

function lagosDay() {
  return new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
}

export async function startBiblePlan(formData: FormData) {
  const { supabase, user } = await member();
  const fromDay = Math.min(365, Math.max(1, Number(formData.get("from_day")) || 1));
  const start = new Date(Date.parse(lagosDay()) - (fromDay - 1) * 86_400_000).toISOString().slice(0, 10);
  check((await supabase.from("profiles").update({ bible_plan_start: start }).eq("id", user.id)).error);
  revalidatePath("/me", "layout");
  redirect("/me/bible");
}

export async function setBibleDay(day: number, read: boolean) {
  const { supabase, user } = await member();
  if (read) check((await supabase.from("bible_reading").upsert({ user_id: user.id, day }, { onConflict: "user_id,day" })).error);
  else check((await supabase.from("bible_reading").delete().eq("user_id", user.id).eq("day", day)).error);
  revalidatePath("/me", "layout");
}

export async function saveVerseNote(input: { ref: string; verse: string; note?: string; color?: string }) {
  const { supabase, user } = await member();
  check(
    (
      await supabase.from("verse_notes").insert({
        user_id: user.id,
        ref: input.ref,
        verse: input.verse,
        note: input.note?.trim() || null,
        color: input.color ?? "gold",
      })
    ).error
  );
  revalidatePath("/me/bible");
}

export async function deleteVerseNote(formData: FormData) {
  const { supabase, user } = await member();
  check((await supabase.from("verse_notes").delete().eq("id", String(formData.get("id"))).eq("user_id", user.id)).error);
  revalidatePath("/me/bible");
}

export async function addMemoryVerse(input: { ref: string; text: string }) {
  const { supabase, user } = await member();
  const ref = input.ref.trim();
  const text = input.text.trim();
  if (!ref || !text) return;
  check(
    (await supabase.from("memory_verses").upsert({ user_id: user.id, ref, text, box: 1, due_on: lagosDay() }, { onConflict: "user_id,ref", ignoreDuplicates: true })).error
  );
  revalidatePath("/me/bible");
}

export async function addMemoryVerseForm(formData: FormData) {
  await addMemoryVerse({ ref: String(formData.get("ref") ?? ""), text: String(formData.get("text") ?? "") });
  redirect("/me/bible?tab=memory");
}

export async function reviewMemoryVerse(id: string, knew: boolean) {
  const { supabase, user } = await member();
  const { data: row } = await supabase.from("memory_verses").select("box, reviews").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) return;
  const { nextReview } = await import("@/lib/bible");
  const next = nextReview(row.box as number, knew, lagosDay());
  check((await supabase.from("memory_verses").update({ ...next, reviews: (row.reviews as number) + 1 }).eq("id", id).eq("user_id", user.id)).error);
  revalidatePath("/me/bible");
}

export async function deleteMemoryVerse(formData: FormData) {
  const { supabase, user } = await member();
  check((await supabase.from("memory_verses").delete().eq("id", String(formData.get("id"))).eq("user_id", user.id)).error);
  revalidatePath("/me/bible");
}

export async function addStarterVerses() {
  const { supabase, user } = await member();
  const { verses } = await import("@/lib/verses");
  const rows = verses.slice(0, 8).map((v) => ({ user_id: user.id, ref: v.reference, text: v.text, box: 1, due_on: lagosDay() }));
  check((await supabase.from("memory_verses").upsert(rows, { onConflict: "user_id,ref", ignoreDuplicates: true })).error);
  revalidatePath("/me/bible");
  redirect("/me/bible?tab=memory");
}

// Attendance, prayer partners, testimonies ------------------------------------------------

export async function markAttendance() {
  const { supabase } = await member();
  const { data, error } = await supabase.rpc("mark_attendance");
  check(error);
  revalidatePath("/me", "layout");
  return data as { ok: boolean; service?: string };
}

export async function prayForPartner() {
  const { supabase } = await member();
  check((await supabase.rpc("pray_for_partner")).error);
  revalidatePath("/me");
}

export async function savePrayerNeed(formData: FormData) {
  const { supabase, user } = await member();
  check(
    (await supabase.from("profiles").update({ prayer_need: String(formData.get("prayer_need") ?? "").trim() || null }).eq("id", user.id)).error
  );
  revalidatePath("/me");
}

export async function shareTestimony(formData: FormData) {
  const { supabase, user } = await member();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) redirect("/me/journal?testimony=missing");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const anonymous = formData.get("anonymous") === "on";
  if (await recentDuplicate(supabase, "testimonies", { user_id: user.id, title, body })) redirect("/me/journal?testimony=sent");
  check(
    (
      await supabase.from("testimonies").insert({
        user_id: user.id,
        title,
        body,
        display_name: anonymous ? null : (profile?.full_name ?? null),
        status: "pending",
      })
    ).error
  );
  revalidatePath("/me/journal");
  redirect("/me/journal?testimony=sent");
}
