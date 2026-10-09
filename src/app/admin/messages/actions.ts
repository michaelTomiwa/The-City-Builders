"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { sendMessagePush } from "@/lib/push";
import { messageAudiences } from "@/lib/message-audiences";
import { recentDuplicate } from "@/lib/duplicates";
import { PASTOR_NAME, personalize } from "@/lib/messages";

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

/** Pin a conversation to the top, or mark it to follow up. */
export async function setConversationFlag(formData: FormData) {
  const { supabase } = await staff();
  const member = text(formData, "member_id");
  const flag = text(formData, "flag");
  if (flag !== "pinned" && flag !== "follow_up") return;
  const { error } = await supabase
    .from("conversations")
    .update({ [flag]: text(formData, "value") === "true" })
    .eq("member_id", member);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
}

export async function addQuickReply(formData: FormData) {
  const { supabase } = await staff();
  const body = text(formData, "body").slice(0, 1000);
  if (!body) return;
  const { error } = await supabase.from("quick_replies").insert({ body });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
}

export async function deleteQuickReply(formData: FormData) {
  const { supabase } = await staff();
  const { error } = await supabase.from("quick_replies").delete().eq("id", text(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
}

/** One message to many people, each in their own private conversation, with {name} filled in. */
export async function sendBroadcast(formData: FormData) {
  const { supabase, name } = await staff();
  const body = text(formData, "body").slice(0, 4000);
  const audienceId = text(formData, "audience");
  if (!body) throw new Error("Write a message first.");
  const audience = (await messageAudiences(supabase)).find((a) => a.id === audienceId);
  if (!audience || audience.members.length === 0) throw new Error("Nobody is in that group yet.");
  // Never send the same message to the same group twice in a row by accident.
  if (await recentDuplicate(supabase, "message_broadcasts", { audience: audience.label, body }, 120)) {
    redirect(`/admin/messages/broadcast?sent=${audience.members.length}`);
  }

  const { data: broadcast, error } = await supabase
    .from("message_broadcasts")
    .insert({ audience: audience.label, body, sent_count: audience.members.length, author_name: name })
    .select("id")
    .single();
  if (error || !broadcast) throw new Error(error?.message ?? "Couldn't send.");

  const rows = audience.members.map((m) => ({ member_id: m.id, body: personalize(body, m.first), broadcast_id: broadcast.id }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error: insertError } = await supabase.from("direct_messages").insert(rows.slice(i, i + 200));
    if (insertError) throw new Error(insertError.message);
  }

  const firstById = new Map(audience.members.map((m) => [m.id, m.first]));
  after(() =>
    sendMessagePush(
      audience.members.map((m) => m.id),
      (userId) => {
        const text = personalize(body, firstById.get(userId ?? "") ?? "friend");
        return { title: PASTOR_NAME, body: text.length > 140 ? `${text.slice(0, 137)}…` : text, url: "/me/messages" };
      },
      `broadcast-${broadcast.id}`
    )
  );

  revalidatePath("/admin/messages");
  redirect(`/admin/messages/broadcast?sent=${audience.members.length}`);
}
