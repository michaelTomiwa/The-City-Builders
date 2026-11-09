import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NotifyMe } from "@/components/site/notify-me";
import { thisWeek } from "@/lib/week";
import { cn } from "@/lib/utils";

/** A month ago, as an ISO time. */
function monthAgo(now = Date.now()) {
  return new Date(now - 30 * 86_400_000).toISOString();
}

/**
 * "Getting started": the few things that make the site feel alive to a
 * visitor. Each ticks itself off from real data; the card goes away once all are done.
 */
export async function GettingStarted({ supabase, userId }: { supabase: SupabaseClient; userId: string }) {
  const now = new Date().toISOString();
  const week = thisWeek();
  const [instruction, recentPost, events, items, courses, testimonies, myPhone, members] = await Promise.all([
    supabase.from("week_instructions").select("week_start", { count: "exact", head: true }).eq("week_start", week).eq("status", "published"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("published", true).gte("published_at", monthAgo()).lte("published_at", now),
    supabase.from("events").select("id", { count: "exact", head: true }).gte("starts_at", now),
    supabase.from("week_items").select("id", { count: "exact", head: true }).is("owner_id", null).lte("start_week", week).or(`start_week.eq.${week},repeats.eq.true`),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("testimonies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("push_subscriptions").select("endpoint", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "member").eq("status", "active"),
  ]);

  const steps = [
    { done: (instruction.count ?? 0) > 0, title: "Publish this week's instruction", hint: "Fasting, prayer and study for the whole church.", href: "/admin/instruction", cta: "Write it" },
    { done: (items.count ?? 0) > 0, title: "Set this week's checklist", hint: "What everyone should tick off this week.", href: "/admin/week", cta: "Add items" },
    { done: (recentPost.count ?? 0) > 0, title: "Post on the blog this month", hint: "Turn a recent sermon into a post in a few minutes.", href: "/admin/posts/from-sermon", cta: "Sermon to post" },
    { done: (events.count ?? 0) > 0, title: "Add an upcoming gathering", hint: "A retreat, a special service or an outreach.", href: "/admin/events/new", cta: "Add one" },
    { done: (testimonies.count ?? 0) > 0, title: "Share a testimony", hint: "Approve one from a member, or add one you've heard.", href: "/admin/testimonies", cta: "Open" },
    { done: (courses.count ?? 0) > 0, title: "Open a School course", hint: "Start with Foundations of Faith: there's a ready-made starter.", href: "/admin/school/new", cta: "Start" },
    { done: (myPhone.count ?? 0) > 0, title: "Turn on alerts on your phone", hint: "Hear when people message you, hand in work or need care.", phone: true },
    { done: (members.count ?? 0) >= 20, title: `Grow to 20 members (${members.count ?? 0} now)`, hint: "Share your invite link in your WhatsApp groups.", href: "/me/invite", cta: "Invite link" },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  return (
    <section className="mt-10 rounded-md border border-steel bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-paper">Make the site feel alive</h2>
          <p className="mt-1 text-sm text-paper-dim">Visitors trust a church site that&apos;s clearly lived in. Each one ticks itself off.</p>
        </div>
        <p className="text-sm text-paper-dim">
          {done} of {steps.length} done
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-dusk">
        <div className="h-full rounded-full bg-[#3d9a6a]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.title} className={cn("flex items-start gap-3 rounded-sm border p-3", s.done ? "border-[#bfe0c8] bg-[#f4faf5]" : "border-steel")}>
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                s.done ? "border-[#3d9a6a] bg-[#3d9a6a] text-white" : "border-steel"
              )}
              aria-hidden="true"
            >
              {s.done && "✓"}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm font-medium", s.done ? "text-paper-dim line-through" : "text-paper")}>{s.title}</span>
              {!s.done && <span className="block text-xs text-paper-dim">{s.hint}</span>}
              {!s.done && s.phone && <NotifyMe tone="paper" label="Turn on alerts" className="mt-2" />}
            </span>
            {!s.done && s.href && (
              <Link href={s.href} className="shrink-0 text-sm font-medium text-gold-text hover:underline">
                {s.cta} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
