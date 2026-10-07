"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

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
        },
        { onConflict: "assignment_id,user_id" }
      )
    ).error
  );
  revalidatePath("/me", "layout");
  redirect(`/me/assignments/${assignmentId}?submitted=1`);
}

export async function saveJournal(formData: FormData) {
  const { supabase, user } = await member();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect("/me/journal");
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
