"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { sendMessagePush } from "@/lib/push";
import { PASTOR_NAME, type DirectMessage } from "@/lib/messages";

function preview(m: DirectMessage) {
  const text = m.body?.trim() || "📷 Photo";
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
}

/**
 * Sends a message in a member's conversation. Members can only write in
 * their own; staff can write in anyone's. The database decides who sent it.
 */
export async function sendDirectMessage(input: { memberId: string; body: string; imagePath: string | null }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const body = input.body.trim().slice(0, 4000);
  const imagePath = input.imagePath && input.imagePath.startsWith(`${input.memberId}/`) ? input.imagePath : null;
  if (!body && !imagePath) return { error: "Write a message first." };

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ member_id: input.memberId, body: body || null, image_path: imagePath })
    .select("*")
    .single();
  if (error || !data) return { error: "That didn't send. Check your connection and try again." };
  const message = data as DirectMessage;

  after(async () => {
    if (message.from_pastor) {
      await sendMessagePush([message.member_id], () => ({ title: PASTOR_NAME, body: preview(message), url: "/me/messages" }), `dm-${message.member_id}`);
    } else {
      await sendMessagePush(
        "staff",
        () => ({ title: message.author_name ?? "A member", body: preview(message), url: `/admin/messages?m=${message.member_id}` }),
        `dm-${message.member_id}`
      );
    }
  });

  if (message.from_pastor) revalidatePath("/admin/messages");
  return { message };
}
