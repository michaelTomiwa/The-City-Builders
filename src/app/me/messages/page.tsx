import type { Metadata } from "next";
import { getMember } from "@/lib/member-data";
import { getSiteSettings, DEFAULT_PASTOR_IMAGE } from "@/lib/settings";
import { firstName } from "@/lib/discipleship";
import { loadThread, PASTOR_NAME, type Conversation } from "@/lib/messages";
import { ChatThread } from "@/components/messages/chat-thread";
import { NotifyMe } from "@/components/site/notify-me";

export const metadata: Metadata = { title: "Messages" };

export default async function MemberMessages() {
  const { supabase, user, profile } = await getMember();
  if (!user) return null;
  const [messages, { data: convo }, settings] = await Promise.all([
    loadThread(supabase, user.id),
    supabase.from("conversations").select("*").eq("member_id", user.id).maybeSingle(),
    getSiteSettings(),
  ]);
  const conversation = convo as Conversation | null;
  const photo = settings?.pastor_image_url || DEFAULT_PASTOR_IMAGE;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex h-[calc(100dvh-5.5rem)] min-h-[28rem] sm:h-[calc(100dvh-19rem)] flex-col overflow-hidden rounded-md border border-steel bg-[#f6f4ef]">
        <div className="on-night flex items-center gap-3 bg-night px-4 py-3 text-starlight sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-11 w-11 rounded-full object-cover object-top" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight">{PASTOR_NAME}</p>
            <p className="text-xs text-starlight-dim">Private between you and the pastor&rsquo;s office</p>
          </div>
        </div>
        <ChatThread
          memberId={user.id}
          viewer="member"
          initialMessages={messages}
          otherReadAt={conversation?.pastor_read_at ?? null}
          firstName={firstName(profile)}
          emptyText={`Say hello, ${firstName(profile)}. Share a prayer need, a question or a testimony. Only the pastor's office can read this.`}
          placeholder="Write to the pastor…"
        />
      </div>
      <div className="mt-4 flex flex-col items-center gap-1 text-center text-sm text-paper-dim">
        <p>Turn on alerts on this phone so you know when the pastor replies.</p>
        <NotifyMe tone="paper" className="items-center" label="Turn on alerts" />
      </div>
    </div>
  );
}
