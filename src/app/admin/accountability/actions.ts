"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { sendMessagePush } from "@/lib/push";
import { PASTOR_NAME } from "@/lib/messages";
import { recentDuplicate } from "@/lib/duplicates";

async function staff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "member") throw new Error("Your account isn't approved to make changes yet.");
  return { supabase, name: (profile.full_name as string | null) ?? null };
}

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function firstOf(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || "friend";
}

/** A message from the pastor into someone's private conversation, with a phone alert. */
async function message(supabase: Awaited<ReturnType<typeof createClient>>, memberId: string, body: string) {
  const { error } = await supabase.from("direct_messages").insert({ member_id: memberId, body });
  if (error) throw new Error(error.message);
  after(() => sendMessagePush([memberId], () => ({ title: PASTOR_NAME, body: body.length > 140 ? `${body.slice(0, 137)}…` : body, url: "/me/messages" }), `care-${memberId}`));
}

/** Ask the person's team lead to reach out this week (privately, in the lead's own conversation). */
export async function askTeamLead(fd: FormData) {
  const { supabase } = await staff();
  const memberId = text(fd, "member_id");
  const [{ data: person }, { data: teams }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", memberId).maybeSingle(),
    supabase.from("team_members").select("team_id").eq("user_id", memberId),
  ]);
  const { data: leads } = await supabase
    .from("team_members")
    .select("user_id, role, profiles(full_name)")
    .in("team_id", (teams ?? []).map((t) => t.team_id as string))
    .in("role", ["lead", "assistant"])
    .neq("user_id", memberId);
  const lead = ((leads ?? []) as unknown as { user_id: string; role: string; profiles: { full_name: string | null } | null }[]).sort((a, b) =>
    a.role === "lead" ? -1 : b.role === "lead" ? 1 : 0
  )[0];
  if (!lead) redirect(`/admin/accountability?note=${encodeURIComponent(`${firstOf(person?.full_name)} isn't in a team with a lead yet.`)}`);
  await message(
    supabase,
    lead.user_id,
    `Hi ${firstOf(lead.profiles?.full_name)}, please check in with ${person?.full_name ?? "one of your team"} this week. They've been missing their assignments. A call or a visit, a prayer together, and let me know how they are. Thank you for shepherding your team. — Pastor Michael`
  );
  revalidatePath("/admin/accountability");
  redirect(`/admin/accountability?note=${encodeURIComponent(`Asked ${lead.profiles?.full_name ?? "their team lead"} to check in with ${firstOf(person?.full_name)}.`)}`);
}

/** Agree a small catch-up plan. While it's active they're at "Restoration plan". */
export async function startPlan(fd: FormData) {
  const { supabase, name } = await staff();
  const memberId = text(fd, "member_id");
  const plan = text(fd, "plan").slice(0, 4000);
  if (!plan) throw new Error("Write the plan first.");
  if (await recentDuplicate(supabase, "restoration_plans", { member_id: memberId })) redirect("/admin/accountability");
  const { data: person } = await supabase.from("profiles").select("full_name").eq("id", memberId).maybeSingle();
  const { error } = await supabase.from("restoration_plans").insert({ member_id: memberId, plan, due_on: text(fd, "due_on") || null, author_name: name });
  if (error) throw new Error(error.message);
  await message(
    supabase,
    memberId,
    `Hi ${firstOf(person?.full_name)}, here's the small plan we're walking together:\n\n${plan}\n\nNo condemnation, only grace. When it's done, it's a fresh start. I'm with you. — Pastor Michael`
  );
  revalidatePath("/admin/accountability");
  revalidatePath("/me", "layout");
  redirect(`/admin/accountability?note=${encodeURIComponent(`Restoration plan started with ${firstOf(person?.full_name)}.`)}`);
}

/** Completing a plan is a fresh start: misses before it no longer count. */
export async function finishPlan(fd: FormData) {
  const { supabase } = await staff();
  const id = text(fd, "id");
  const done = text(fd, "outcome") === "completed";
  const { data: plan, error } = await supabase
    .from("restoration_plans")
    .update({ status: done ? "completed" : "cancelled", completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("status", "active")
    .select("member_id, profiles(full_name)")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = plan as unknown as { member_id: string; profiles: { full_name: string | null } | null } | null;
  if (row && done) {
    await message(
      supabase,
      row.member_id,
      `${firstOf(row.profiles?.full_name)}, you finished the plan. Well done! 🎉 It's a fresh start from today. I'm proud of you. — Pastor Michael`
    );
  }
  revalidatePath("/admin/accountability");
  revalidatePath("/me", "layout");
  redirect(`/admin/accountability?note=${encodeURIComponent(done ? "Plan completed. They're back on track with a fresh start." : "Plan cancelled.")}`);
}
