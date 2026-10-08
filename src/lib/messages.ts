import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Messages between the pastor's office and each member: one private
  conversation per member. Photos live in the private "chat" bucket under
  the member's id and are shown through short-lived signed links.
*/

export type DirectMessage = {
  id: string;
  member_id: string;
  from_pastor: boolean;
  author_id: string | null;
  author_name: string | null;
  body: string | null;
  image_path: string | null;
  broadcast_id: string | null;
  created_at: string;
  image_url?: string | null;
};

export type Conversation = {
  member_id: string;
  last_body: string | null;
  last_at: string | null;
  last_from_pastor: boolean | null;
  member_unread: number;
  pastor_unread: number;
  member_read_at: string | null;
  pastor_read_at: string | null;
  pinned: boolean;
  follow_up: boolean;
};

export type QuickReply = { id: string; body: string; created_at: string };

export const PASTOR_NAME = "Pastor Michael";

/** Fills {name} with the member's first name. */
export function personalize(body: string, firstName: string) {
  return body.replace(/\{name\}/gi, firstName);
}

/** Adds signed image links (valid for a day) to messages with photos. */
export async function withImageUrls(supabase: SupabaseClient, messages: DirectMessage[]) {
  const paths = messages.map((m) => m.image_path).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return messages;
  const { data } = await supabase.storage.from("chat").createSignedUrls(paths, 60 * 60 * 24);
  const urls = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return messages.map((m) => (m.image_path ? { ...m, image_url: urls.get(m.image_path) ?? null } : m));
}

/** The latest messages in one member's conversation, oldest first. */
export async function loadThread(supabase: SupabaseClient, memberId: string, limit = 200) {
  const { data } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return withImageUrls(supabase, ((data ?? []) as DirectMessage[]).reverse());
}

/** "10:42 PM", "Yesterday", "Mon", or "Oct 3", in Lagos time. */
export function chatTime(iso: string, now = Date.now()) {
  const lagos = (ms: number) => new Date(ms + 3600_000).toISOString().slice(0, 10);
  const t = Date.parse(iso);
  const days = Math.round((Date.parse(lagos(now)) - Date.parse(lagos(t))) / 86_400_000);
  if (days === 0) return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(t).toLocaleDateString("en-US", { weekday: "short", timeZone: "Africa/Lagos" });
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Africa/Lagos" });
}

export const defaultQuickReplies = [
  "Praying for you, {name} 🙏",
  "We missed you at Night Watch, {name}. Is everything okay?",
  "Thank you for sharing this with me, {name}. Let's pray about it together.",
  "Well done, {name}! I'm proud of how you're growing.",
  "Can I call you today, {name}? What time works for you?",
];
