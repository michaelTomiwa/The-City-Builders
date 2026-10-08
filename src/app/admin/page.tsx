import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Panel, Pill } from "@/components/admin/ui";
import { compact } from "@/lib/blog";
import { weeklyReport } from "@/lib/report";

function lagos(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

function greeting() {
  const hour = (new Date().getUTCHours() + 1) % 24;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [posts, comments, prayers, subscribers, events, sermons] = await Promise.all([
    supabase.from("posts").select("id, title, slug, views, likes, published, published_at").order("views", { ascending: false }),
    supabase
      .from("post_comments")
      .select("id, name, body, created_at, approved, posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("prayer_requests").select("id, name, request, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("subscribers").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id, title, starts_at").gte("starts_at", now).order("starts_at").limit(3),
    supabase.from("sermons").select("id", { count: "exact", head: true }),
  ]);

  const report = await weeklyReport(supabase);
  const postRows = posts.data ?? [];
  const totalReads = postRows.reduce((n, p) => n + (p.views ?? 0), 0);
  const totalAmens = postRows.reduce((n, p) => n + (p.likes ?? 0), 0);
  const drafts = postRows.filter((p) => !p.published).length;
  const scheduled = postRows.filter((p) => p.published && p.published_at && p.published_at > now).length;
  const pendingComments = (comments.data ?? []).filter((c) => !c.approved).length;
  const newPrayers = (prayers.data ?? []).filter((p) => p.status === "new").length;
  const maxViews = Math.max(1, ...postRows.map((p) => p.views ?? 0));

  const stats = [
    { label: "Blog reads", value: compact(totalReads), href: "/admin/posts" },
    { label: "Amens", value: compact(totalAmens), href: "/admin/posts" },
    { label: "Subscribers", value: compact(subscribers.count ?? 0), href: "/admin/subscribers" },
    { label: "Sermons", value: compact(sermons.count ?? 0), href: "/admin/sermons" },
  ];

  const quick = [
    { href: "/admin/posts/new", label: "Write a post" },
    { href: "/admin/sermons/new", label: "Add a sermon" },
    { href: "/admin/events/new", label: "Schedule an event" },
    { href: "/admin/settings", label: "Post an announcement" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-paper">{greeting()}.</h1>
      <p className="mt-2 text-paper-dim">
        {pendingComments + newPrayers === 0
          ? "Nothing is waiting on you right now."
          : `${pendingComments ? `${pendingComments} comment${pendingComments === 1 ? "" : "s"} to review` : ""}${
              pendingComments && newPrayers ? " and " : ""
            }${newPrayers ? `${newPrayers} new prayer request${newPrayers === 1 ? "" : "s"}` : ""}.`}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {quick.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="rounded-full border border-steel bg-white px-4 py-2 text-sm text-paper transition-colors hover:border-gold hover:text-gold-text"
          >
            {q.label}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Link href="/admin/report" className="on-night rounded-md bg-night p-5 text-starlight transition-colors hover:bg-night-2">
          <p className="text-sm text-lamp">Discipleship this week</p>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "active members", value: `${report.totals.active}/${report.totals.members}` },
              { label: "service check-ins", value: report.totals.attendance },
              { label: "steps and lessons", value: report.totals.steps + report.totals.lessons },
            ].map((x) => (
              <div key={x.label}>
                <dd className="font-display text-3xl">{x.value}</dd>
                <dt className="text-xs text-starlight-dim">{x.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-starlight-dim">
            {report.quiet.length ? `${report.quiet.length} gone quiet · ` : ""}Open the weekly report →
          </p>
        </Link>
        <Panel>
          <p className="text-sm text-paper-dim">Follow-ups due</p>
          {report.followUps.length === 0 ? (
            <p className="mt-2 text-paper">Nothing due today.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {report.followUps.slice(0, 4).map((f) => (
                <li key={f.id}>
                  <Link href={`/admin/members/${f.member_id}`} className="font-medium text-paper hover:text-gold-text">
                    {f.name}
                  </Link>
                  <span className="text-paper-dim"> · {f.body.slice(0, 60)}{f.body.length > 60 ? "…" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-md border border-steel bg-white/70 p-5 transition-colors hover:border-gold">
            <dt className="text-sm text-paper-dim">{s.label}</dt>
            <dd className="mt-1 font-display text-4xl text-paper">{s.value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-paper">Most-read posts</h2>
            <span className="text-sm text-paper-dim">
              {drafts} draft{drafts === 1 ? "" : "s"}
              {scheduled > 0 && `, ${scheduled} scheduled`}
            </span>
          </div>
          {postRows.length === 0 ? (
            <p className="mt-4 text-paper-dim">No posts yet.</p>
          ) : (
            <ol className="mt-5 space-y-4">
              {postRows.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <Link href={`/admin/posts/${p.id}/edit`} className="truncate text-paper hover:text-gold-text">
                      {p.title}
                    </Link>
                    <span className="shrink-0 tabular-nums text-paper-dim">{compact(p.views ?? 0)} reads</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-dusk-2">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${((p.views ?? 0) / maxViews) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display text-2xl text-paper">Coming up</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-paper">Night Watch</span>
              <span className="text-paper-dim">Daily, 11:00 PM</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-paper">Morning Prayers</span>
              <span className="text-paper-dim">Daily, 7:00 AM</span>
            </li>
            {(events.data ?? []).map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-t border-steel pt-3">
                <span className="text-paper">{e.title}</span>
                <span className="shrink-0 text-paper-dim">{lagos(e.starts_at)}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/events/new" className="mt-5 inline-block text-sm text-gold-text underline underline-offset-4">
            Add a special event
          </Link>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-paper">Latest comments</h2>
            <Link href="/admin/comments" className="text-sm text-gold-text">
              Moderate
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-steel">
            {(comments.data ?? []).map((c) => {
              const post = Array.isArray(c.posts) ? c.posts[0] : c.posts;
              return (
                <li key={c.id} className="py-3 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-medium text-paper">{c.name}</span>
                    {!c.approved && <Pill tone="gold">Waiting</Pill>}
                  </p>
                  <p className="mt-1 line-clamp-2 text-paper-dim">{c.body}</p>
                  {post && <p className="mt-1 text-xs text-paper-dim">on {post.title}</p>}
                </li>
              );
            })}
            {(comments.data ?? []).length === 0 && <li className="py-3 text-sm text-paper-dim">No comments yet.</li>}
          </ul>
        </Panel>

        <Panel>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-paper">Prayer requests</h2>
            <Link href="/admin/prayers" className="text-sm text-gold-text">
              Open inbox
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-steel">
            {(prayers.data ?? []).map((p) => (
              <li key={p.id} className="py-3 text-sm">
                <p className="flex items-center gap-2">
                  <span className="font-medium text-paper">{p.name ?? "Anonymous"}</span>
                  {p.status === "new" && <Pill tone="blue">New</Pill>}
                </p>
                <p className="mt-1 line-clamp-2 text-paper-dim">{p.request}</p>
              </li>
            ))}
            {(prayers.data ?? []).length === 0 && <li className="py-3 text-sm text-paper-dim">No requests yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
