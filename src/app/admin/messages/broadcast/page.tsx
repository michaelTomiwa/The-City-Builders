import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { Panel } from "@/components/admin/ui";
import { messageAudiences } from "@/lib/message-audiences";
import { lagosDateTime } from "@/lib/discipleship";
import { sendBroadcast } from "../actions";

export const metadata: Metadata = { title: "Send to many" };

export default async function Broadcast({ searchParams }: PageProps<"/admin/messages/broadcast">) {
  const query = await searchParams;
  const sent = Number(query.sent) || 0;
  const supabase = await createClient();
  const [audiences, { data: history }] = await Promise.all([
    messageAudiences(supabase),
    supabase.from("message_broadcasts").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div>
      <Link href="/admin/messages" className="text-sm text-paper-dim hover:text-gold-text">
        Messages
      </Link>
      <h1 className="mt-3 font-display text-4xl text-paper">Send to many</h1>
      <p className="mt-2 max-w-xl leading-relaxed text-paper-dim">
        One message, delivered privately to each person in their own conversation with you, with a phone alert. When they reply, it comes back to
        you alone, never to the whole group.
      </p>

      {sent > 0 && (
        <p className="mt-6 rounded-md border border-[#bfe0c8] bg-[#e3f1e6] px-4 py-3 text-[#24613a]" role="status">
          Sent to {sent} {sent === 1 ? "person" : "people"}. Their replies will appear in Messages.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form action={sendBroadcast} className="space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-paper">Who is it for?</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {audiences.map((a, i) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-steel bg-white p-4 has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
                >
                  <input type="radio" name="audience" value={a.id} defaultChecked={i === 0} disabled={a.members.length === 0} className="mt-1 accent-[#c9952f]" />
                  <span className="min-w-0">
                    <span className="block font-medium text-paper">{a.label}</span>
                    <span className="block text-sm text-paper-dim">
                      {a.members.length} {a.members.length === 1 ? "person" : "people"} · {a.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-medium text-paper">Message</span>
            <textarea
              name="body"
              required
              rows={6}
              maxLength={4000}
              defaultValue={"Good evening, {name}! 🙏\n\n"}
              className="mt-2 w-full rounded-md border border-steel bg-white px-4 py-3 leading-relaxed text-paper outline-none focus:border-gold"
            />
            <span className="mt-1 block text-sm text-paper-dim">
              <code className="rounded bg-white px-1">{"{name}"}</code> becomes each person&rsquo;s first name, so it reads like you wrote to them
              alone.
            </span>
          </label>

          <button className="inline-flex h-11 items-center rounded-sm bg-gold px-6 font-medium text-ink hover:bg-gold-soft">Send privately to each person</button>
        </form>

        <aside>
          <Panel>
            <p className="font-medium text-paper">Ideas</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-paper-dim">
              <li>
                <strong className="text-paper">Gone quiet:</strong> &ldquo;{"{name}"}, we&rsquo;ve missed you. How are you really doing?&rdquo;
              </li>
              <li>
                <strong className="text-paper">New this month:</strong> a personal welcome and an invitation to Night Watch.
              </li>
              <li>
                <strong className="text-paper">A team:</strong> thank them after a big service.
              </li>
            </ul>
          </Panel>

          <h2 className="mt-8 text-sm font-medium text-paper">Sent before</h2>
          <ul className="mt-3 space-y-3">
            {(history ?? []).length === 0 && <li className="text-sm text-paper-dim">Nothing yet.</li>}
            {(history ?? []).map((b) => (
              <li key={b.id} className="rounded-md border border-steel bg-white p-3 text-sm">
                <p className="text-xs text-paper-dim">
                  {b.audience} · {b.sent_count} people · {lagosDateTime(b.created_at)}
                </p>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-paper">{b.body}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
