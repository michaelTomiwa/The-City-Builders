import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { Pill } from "@/components/admin/ui";
import { ChatThread } from "@/components/messages/chat-thread";
import { InboxLive } from "@/components/messages/inbox-live";
import { careTags } from "@/lib/care";
import { daysSince, displayName, firstName, growth, growthPoints, initials, type Member } from "@/lib/discipleship";
import { chatTime, defaultQuickReplies, loadThread, type Conversation, type QuickReply } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { addQuickReply, deleteQuickReply, setConversationFlag } from "./actions";

export const metadata: Metadata = { title: "Messages" };

const filters = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "pinned", label: "Pinned" },
  { id: "follow", label: "Follow up" },
];

/** What the pastor sees beside a conversation: how this person is doing. */
async function memberContext(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const count = (table: string, column = "user_id") => supabase.from(table).select("*", { count: "exact", head: true }).eq(column, id);
  const latest = (table: string, column: string) =>
    supabase.from(table).select(column).eq("user_id", id).order(column, { ascending: false }).limit(1).maybeSingle();
  const [steps, reviewed, lessons, attendance, bible, invites, lastStep, lastAttend, lastBible, lastLesson, teams, notes] = await Promise.all([
    count("step_checkins"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("user_id", id).eq("status", "reviewed"),
    count("lesson_progress"),
    count("attendance"),
    count("bible_reading"),
    count("profiles", "invited_by"),
    latest("step_checkins", "created_at"),
    latest("attendance", "created_at"),
    latest("bible_reading", "read_at"),
    latest("lesson_progress", "completed_at"),
    supabase.from("team_members").select("role, teams(name, color)").eq("user_id", id),
    supabase.from("care_notes").select("id, tag, body, follow_up_on, done, created_at").eq("member_id", id).eq("done", false).order("created_at", { ascending: false }).limit(3),
  ]);
  const g = growth(
    growthPoints({
      steps: steps.count ?? 0,
      reviewed: reviewed.count ?? 0,
      lessons: lessons.count ?? 0,
      attendance: attendance.count ?? 0,
      bibleDays: bible.count ?? 0,
      invites: invites.count ?? 0,
    })
  );
  const stamps = [
    (lastStep.data as { created_at?: string } | null)?.created_at,
    (lastAttend.data as { created_at?: string } | null)?.created_at,
    (lastBible.data as { read_at?: string } | null)?.read_at,
    (lastLesson.data as { completed_at?: string } | null)?.completed_at,
  ]
    .filter((x): x is string => Boolean(x))
    .sort()
    .reverse();
  return {
    g,
    lastActive: stamps[0] ?? null,
    services: attendance.count ?? 0,
    teams: (teams.data ?? []) as unknown as { role: string; teams: { name: string; color: string } | null }[],
    notes: (notes.data ?? []) as { id: string; tag: string; body: string; follow_up_on: string | null }[],
  };
}

function FlagButton({ memberId, flag, on, label }: { memberId: string; flag: "pinned" | "follow_up"; on: boolean; label: string }) {
  return (
    <form action={setConversationFlag}>
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={String(!on)} />
      <button
        className={cn(
          "rounded-sm border px-2.5 py-1 text-xs transition-colors",
          on ? "border-gold bg-gold/20 text-gold-text" : "border-steel bg-white text-paper-dim hover:text-paper"
        )}
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminMessages({ searchParams }: PageProps<"/admin/messages">) {
  const query = await searchParams;
  const selected = typeof query.m === "string" ? query.m : null;
  const filter = filters.some((f) => f.id === query.f) ? String(query.f) : "all";
  const search = typeof query.q === "string" ? query.q.trim().toLowerCase() : "";
  const supabase = await createClient();

  const [{ data: convoRows }, { data: memberRows }, { data: replyRows }] = await Promise.all([
    supabase.from("conversations").select("*").order("last_at", { ascending: false, nullsFirst: false }),
    supabase.from("profiles").select("id, full_name, email, phone, role, status, prayer_need, created_at").order("full_name"),
    supabase.from("quick_replies").select("*").order("created_at"),
  ]);
  const people = new Map(((memberRows ?? []) as Member[]).map((m) => [m.id, m]));
  const conversations = ((convoRows ?? []) as Conversation[]).filter((c) => people.has(c.member_id));
  const unreadTotal = conversations.filter((c) => c.pastor_unread > 0).length;
  const replies = (replyRows ?? []) as QuickReply[];
  const quickReplies = replies.length ? replies.map((r) => r.body) : defaultQuickReplies;

  const list = conversations
    .filter((c) => (filter === "unread" ? c.pastor_unread > 0 : filter === "pinned" ? c.pinned : filter === "follow" ? c.follow_up : true))
    .filter((c) => !search || displayName(people.get(c.member_id)).toLowerCase().includes(search))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const startable = ((memberRows ?? []) as Member[]).filter((m) => m.role === "member" && m.status === "active");

  const member = selected ? (people.get(selected) ?? null) : null;
  const convo = selected ? (conversations.find((c) => c.member_id === selected) ?? null) : null;
  const [thread, context] = member ? await Promise.all([loadThread(supabase, member.id), memberContext(supabase, member.id)]) : [null, null];
  const href = (p: Record<string, string | null>) => {
    const u = new URLSearchParams();
    const merged = { m: selected, f: filter === "all" ? null : filter, q: search || null, ...p };
    Object.entries(merged).forEach(([k, v]) => v && u.set(k, v));
    const s = u.toString();
    return `/admin/messages${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <InboxLive />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-paper">Messages</h1>
          <p className="mt-1 text-paper-dim">
            Private conversations with each member.{" "}
            {unreadTotal > 0 ? `${unreadTotal} waiting for a reply.` : "You're all caught up."}
          </p>
        </div>
        <Link href="/admin/messages/broadcast" className="inline-flex h-10 items-center rounded-sm bg-gold px-5 text-sm font-medium text-ink hover:bg-gold-soft">
          Send to many
        </Link>
      </div>

      <div className="mt-6 grid overflow-hidden rounded-md border border-steel bg-white lg:h-[calc(100dvh-13rem)] lg:min-h-[34rem] lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Conversation list */}
        <aside className={cn("flex min-h-0 flex-col border-steel lg:border-r", member && "hidden lg:flex")}>
          <form className="border-b border-steel p-3" action="/admin/messages">
            {filter !== "all" && <input type="hidden" name="f" value={filter} />}
            <input
              name="q"
              defaultValue={search}
              placeholder="Search people"
              className="h-9 w-full rounded-sm border border-steel bg-[#f6f7f9] px-3 text-sm text-paper outline-none focus:border-gold"
            />
          </form>
          <nav className="flex gap-1 border-b border-steel px-3 py-2 text-xs">
            {filters.map((f) => (
              <Link
                key={f.id}
                href={href({ f: f.id === "all" ? null : f.id })}
                className={cn("rounded-full px-2.5 py-1", filter === f.id ? "bg-night text-starlight" : "text-paper-dim hover:bg-dusk")}
              >
                {f.label}
                {f.id === "unread" && unreadTotal > 0 && ` ${unreadTotal}`}
              </Link>
            ))}
          </nav>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {list.length === 0 && <li className="px-4 py-10 text-center text-sm text-paper-dim">{search ? "Nobody by that name." : "No conversations here yet."}</li>}
            {list.map((c) => {
              const p = people.get(c.member_id);
              const active = c.member_id === selected;
              return (
                <li key={c.member_id}>
                  <Link
                    href={href({ m: c.member_id })}
                    className={cn("flex gap-3 border-b border-steel/60 px-3 py-3 transition-colors", active ? "bg-gold/15" : "hover:bg-[#f6f7f9]")}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d3263] text-sm text-starlight">{initials(p)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", c.pastor_unread > 0 ? "font-semibold text-paper" : "text-paper")}>{displayName(p)}</span>
                        {c.last_at && <span className="shrink-0 text-[11px] text-paper-dim">{chatTime(c.last_at)}</span>}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span className={cn("min-w-0 flex-1 truncate text-xs", c.pastor_unread > 0 ? "text-paper" : "text-paper-dim")}>
                          {c.last_from_pastor ? "You: " : ""}
                          {c.last_body}
                        </span>
                        {c.pinned && <span title="Pinned" className="text-xs text-gold-text">📌</span>}
                        {c.follow_up && <span title="Follow up" className="h-2 w-2 shrink-0 rounded-full bg-[#e07a5f]" />}
                        {c.pastor_unread > 0 && <span className="rounded-full bg-gold px-1.5 text-[11px] font-medium text-ink">{c.pastor_unread}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action="/admin/messages" className="flex gap-2 border-t border-steel p-3">
            <select name="m" required defaultValue="" className="h-9 min-w-0 flex-1 rounded-sm border border-steel bg-white px-2 text-sm text-paper">
              <option value="" disabled>
                Message someone new…
              </option>
              {startable.map((m) => (
                <option key={m.id} value={m.id}>
                  {displayName(m)}
                </option>
              ))}
            </select>
            <button className="h-9 rounded-sm bg-night px-3 text-sm text-starlight hover:bg-night-2">Open</button>
          </form>
        </aside>

        {/* Conversation */}
        {member && thread && context ? (
          <section className="flex h-[80dvh] min-w-0 flex-col lg:h-auto lg:min-h-0">
            <header className="flex flex-wrap items-center gap-3 border-b border-steel px-4 py-3">
              <Link href={href({ m: null })} className="text-sm text-paper-dim hover:text-gold-text lg:hidden">
                ← Back
              </Link>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 font-display text-gold-text">{initials(member)}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/members/${member.id}`} className="font-medium text-paper hover:text-gold-text">
                  {displayName(member)}
                </Link>
                <p className="text-xs text-paper-dim">
                  {context.g.level.name} · {context.g.points} pts ·{" "}
                  {context.lastActive ? (daysSince(context.lastActive) === 0 ? "active today" : `last active ${daysSince(context.lastActive)}d ago`) : "no activity yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FlagButton memberId={member.id} flag="pinned" on={Boolean(convo?.pinned)} label={convo?.pinned ? "Pinned" : "Pin"} />
                <FlagButton memberId={member.id} flag="follow_up" on={Boolean(convo?.follow_up)} label="Follow up" />
                {member.phone && (
                  <a
                    href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm border border-steel bg-white px-2.5 py-1 text-xs text-paper-dim hover:text-paper"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </header>

            <details className="group border-b border-steel bg-[#f6f7f9] text-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-xs text-paper-dim hover:text-paper">
                <span className="min-w-0 flex-1 truncate">
                  {member.prayer_need ? (
                    <>
                      <span className="text-paper">🙏 {member.prayer_need}</span>
                      {context.notes.length > 0 && ` · ${context.notes.length} open care ${context.notes.length === 1 ? "note" : "notes"}`}
                    </>
                  ) : (
                    `About ${firstName(member)}: teams, care notes and prayer need`
                  )}
                </span>
                <span className="shrink-0 text-gold-text">
                  <span className="group-open:hidden">More</span>
                  <span className="hidden group-open:inline">Less</span>
                </span>
              </summary>
              <div className="grid gap-4 px-4 pb-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-paper-dim">Prayer need</p>
                  <p className="mt-0.5 text-paper">{member.prayer_need || <span className="text-paper-dim">None shared</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-paper-dim">Teams</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {context.teams.length === 0 && <span className="text-paper-dim">Not in a team</span>}
                    {context.teams.map((t) =>
                      t.teams ? (
                        <span key={t.teams.name} className="rounded-full px-2 py-0.5 text-xs text-ink" style={{ background: `${t.teams.color}55` }}>
                          {t.teams.name}
                          {t.role === "lead" ? " · lead" : ""}
                        </span>
                      ) : null
                    )}
                  </div>
                  <p className="mt-2 text-xs text-paper-dim">{context.services} services attended</p>
                </div>
                <div>
                  <p className="text-xs text-paper-dim">Care notes</p>
                  {context.notes.length === 0 && <p className="mt-0.5 text-paper-dim">No open notes</p>}
                  <ul className="mt-1 space-y-1.5">
                    {context.notes.map((n) => (
                      <li key={n.id}>
                        <Pill tone={careTags[n.tag]?.tone ?? "grey"}>{careTags[n.tag]?.label ?? "Note"}</Pill>
                        <p className="mt-0.5 line-clamp-2 text-paper">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/admin/members/${member.id}`} className="mt-1 inline-block text-xs text-gold-text hover:underline">
                    Add a care note
                  </Link>
                </div>
              </div>
            </details>

            <div className="min-h-0 flex-1 bg-[#f6f4ef]">
              <ChatThread
                key={member.id}
                memberId={member.id}
                viewer="pastor"
                initialMessages={thread}
                otherReadAt={convo?.member_read_at ?? null}
                firstName={firstName(member)}
                quickReplies={quickReplies}
                emptyText={`Start a conversation with ${firstName(member)}. They'll get an alert on their phone if they've turned alerts on.`}
                placeholder={`Message ${firstName(member)}…`}
              />
            </div>
          </section>
        ) : (
          <section className="hidden min-h-0 overflow-y-auto p-8 lg:block">
            <div className="mx-auto max-w-md text-center">
              <p className="font-display text-2xl text-paper">Pick a conversation</p>
              <p className="mt-2 text-paper-dim">
                Choose someone on the left, or message someone new. Members see your messages under <strong>Messages</strong> in their dashboard and
                get a phone alert.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-md rounded-md border border-steel bg-[#f6f7f9] p-5">
              <p className="font-medium text-paper">Your quick replies</p>
              <p className="mt-1 text-sm text-paper-dim">
                Tap ⚡ in any conversation to use one. <code className="rounded bg-white px-1">{"{name}"}</code> becomes their first name.
              </p>
              <ul className="mt-3 space-y-2">
                {replies.length === 0 && (
                  <>
                    <li className="text-sm text-paper-dim">Using this starter set until you add your own:</li>
                    {defaultQuickReplies.map((r) => (
                      <li key={r} className="rounded-sm bg-white/60 px-3 py-2 text-sm text-paper-dim">
                        {r}
                      </li>
                    ))}
                  </>
                )}
                {replies.map((r) => (
                  <li key={r.id} className="flex items-start gap-2 rounded-sm bg-white px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 text-paper">{r.body}</span>
                    <form action={deleteQuickReply}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-xs text-paper-dim hover:text-[#8a2f1e]">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={addQuickReply} className="mt-3 flex gap-2">
                <input
                  name="body"
                  required
                  maxLength={1000}
                  placeholder="e.g. Happy birthday, {name}! 🎉"
                  className="h-9 min-w-0 flex-1 rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
                />
                <button className="h-9 rounded-sm bg-night px-3 text-sm text-starlight hover:bg-night-2">Add</button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
