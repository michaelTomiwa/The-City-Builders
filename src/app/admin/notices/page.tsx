import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, Pill, fieldHint, fieldLabel, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { lagosDateTime } from "@/lib/discipleship";
import { deleteNotice, saveNotice, toggleNoticePin } from "../discipleship/actions";

export default async function AdminNotices({ searchParams }: PageProps<"/admin/notices">) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("member_notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
  const notices = (data ?? []) as { id: string; title: string; body: string; pinned: boolean; created_at: string }[];

  return (
    <div>
      <AdminHeader title="Word to members" description="Short messages that appear on every member's dashboard: encouragement, a word for the week, instructions." />
      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Panel className="lg:self-start">
          <h2 className="font-display text-2xl text-paper">New message</h2>
          {params.saved && (
            <p className="mt-3 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-3 py-2 text-sm text-[#24613a]" role="status">
              Sent to every member&rsquo;s dashboard.
            </p>
          )}
          <form action={saveNotice} className="mt-4 space-y-4">
            <div>
              <label htmlFor="title" className={fieldLabel}>
                Title
              </label>
              <Input id="title" name="title" required className="mt-2 bg-white" placeholder="This week: rise and build" />
            </div>
            <div>
              <label htmlFor="body" className={fieldLabel}>
                Message
              </label>
              <Textarea id="body" name="body" required rows={6} className="mt-2 bg-white" />
              <p className={fieldHint}>**bold**, links and lists work.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-paper">
              <input type="checkbox" name="pinned" className="h-4 w-4 accent-gold" />
              Pin to the top
            </label>
            <Button type="submit">Send to members</Button>
          </form>
        </Panel>
        <div>
          {notices.length === 0 ? (
            <Empty>No messages yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="rounded-md border border-steel bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-xl text-paper">{n.title}</p>
                    <span className="flex items-center gap-2 text-xs text-paper-dim">
                      {n.pinned && <Pill tone="gold">Pinned</Pill>}
                      {lagosDateTime(n.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-paper-dim [&_a]:text-gold-text [&_a]:underline [&_p+p]:mt-2">
                    <ReactMarkdown>{n.body}</ReactMarkdown>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <form action={toggleNoticePin}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="pinned" value={String(n.pinned)} />
                      <button className={smallButton}>{n.pinned ? "Unpin" : "Pin"}</button>
                    </form>
                    <form action={deleteNotice}>
                      <input type="hidden" name="id" value={n.id} />
                      <ConfirmButton message="Delete this message?" className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:underline">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
