import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { daysSince, displayName, lagosDateTime, type Member } from "@/lib/discipleship";
import { lateReasonLabel, levels, priorityScore, suggestedMessage, type Ladder, type Priority } from "@/lib/accountability";
import { cn } from "@/lib/utils";
import { askTeamLead, finishPlan, startPlan } from "./actions";

export const metadata: Metadata = { title: "Faithfulness" };

/** ISO time some days ago. */
function daysAgo(days: number, now = Date.now()) {
  return new Date(now - days * 86_400_000).toISOString();
}

type Plan = { id: string; member_id: string; plan: string; due_on: string | null; created_at: string };

export default async function Accountability({ searchParams }: PageProps<"/admin/accountability">) {
  const query = await searchParams;
  const supabase = await createClient();
  const since = daysAgo(60);

  const [ladderRes, people, teamRoles, notes, lateSubs, assignments, plans, steps, attend, bible, lessons] = await Promise.all([
    supabase.rpc("accountability_ladder"),
    supabase.from("profiles").select("*").eq("role", "member").eq("status", "active"),
    supabase.from("team_members").select("user_id, role"),
    supabase.from("care_notes").select("member_id, tag").eq("tag", "new-believer"),
    supabase.from("submissions").select("user_id, assignment_id, late_reason, late_note, submitted_at").eq("late", true).gte("submitted_at", since).order("submitted_at", { ascending: false }),
    supabase.from("assignments").select("id, title"),
    supabase.from("restoration_plans").select("*").eq("status", "active"),
    supabase.from("step_checkins").select("user_id, created_at").gte("created_at", since),
    supabase.from("attendance").select("user_id, created_at").gte("created_at", since),
    supabase.from("bible_reading").select("user_id, created_at:read_at").gte("read_at", since),
    supabase.from("lesson_progress").select("user_id, created_at:completed_at").gte("completed_at", since),
  ]);

  const ladder = new Map(((ladderRes.data ?? []) as Ladder[]).map((l) => [l.user_id, l]));
  const members = (people.data ?? []) as Member[];
  const leaders = new Set((teamRoles.data ?? []).filter((t) => t.role === "lead" || t.role === "assistant").map((t) => t.user_id as string));
  const inTeam = new Set((teamRoles.data ?? []).map((t) => t.user_id as string));
  const newBelievers = new Set((notes.data ?? []).map((n) => n.member_id as string));
  const titles = new Map((assignments.data ?? []).map((a) => [a.id as string, a.title as string]));
  const activePlans = new Map(((plans.data ?? []) as Plan[]).map((p) => [p.member_id, p]));
  const lastActive = new Map<string, string>();
  for (const row of [...(steps.data ?? []), ...(attend.data ?? []), ...(bible.data ?? []), ...(lessons.data ?? [])] as { user_id: string; created_at: string }[]) {
    if (!lastActive.has(row.user_id) || row.created_at > lastActive.get(row.user_id)!) lastActive.set(row.user_id, row.created_at);
  }
  const explanationsBy = new Map<string, Priority["explanations"]>();
  for (const s of lateSubs.data ?? []) {
    const list = explanationsBy.get(s.user_id) ?? [];
    list.push({ title: titles.get(s.assignment_id) ?? "An assignment", reason: s.late_reason, note: s.late_note, at: s.submitted_at });
    explanationsBy.set(s.user_id, list);
  }

  const everyone: Priority[] = members
    .filter((m) => ladder.has(m.id))
    .map((m) => {
      const l = ladder.get(m.id)!;
      const explanations = explanationsBy.get(m.id) ?? [];
      const last = lastActive.get(m.id);
      const quietDays = last ? daysSince(last) : daysSince(m.created_at) >= 10 ? daysSince(m.created_at) : null;
      const newBeliever = newBelievers.has(m.id) || daysSince(m.created_at) < 60;
      const isLeader = leaders.has(m.id);
      const struggling = explanations.some((e) => e.reason === "struggling" && daysSince(e.at) <= 30);
      const { score, reasons } = priorityScore({ ladder: l, struggling, quietDays, isLeader, newBeliever });
      return { id: m.id, name: displayName(m), phone: m.phone, ladder: l, score, reasons, isLeader, newBeliever, quietDays, explanations };
    });

  const needs = everyone.filter((p) => p.ladder.level > 0 || p.score > 0).sort((a, b) => b.score - a.score || b.ladder.level - a.ladder.level);
  const faithful = everyone.filter((p) => p.ladder.on_time_streak >= 5).sort((a, b) => b.ladder.on_time_streak - a.ladder.on_time_streak);
  const counts = ([0, 1, 2, 3, 4] as const).map((lvl) => everyone.filter((p) => p.ladder.level === lvl).length);
  const allExplanations = [...explanationsBy.entries()]
    .flatMap(([id, list]) => list.map((e) => ({ ...e, name: everyone.find((p) => p.id === id)?.name ?? "Member", id })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  const draftLink = (p: Priority) => `/admin/messages?m=${p.id}&draft=${encodeURIComponent(suggestedMessage(p.ladder.level, p.name.split(" ")[0]))}`;

  return (
    <div>
      <AdminHeader
        title="Faithfulness"
        description="Who needs you most this week, ranked privately for you alone. Every step starts with grace, and every step has a way back."
      />

      {typeof query.note === "string" && (
        <p className="mt-6 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]" role="status">
          {query.note}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <div key={lvl} className="rounded-md border border-steel bg-white p-4">
            <p className="text-xs text-paper-dim">
              {levels[lvl].emoji} {levels[lvl].name}
            </p>
            <p className="mt-1 font-display text-3xl text-paper">{counts[lvl]}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section>
          <h2 className="font-display text-2xl text-paper">Who needs you most</h2>
          {needs.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">
              Everyone is on track. Thank God for a faithful house. 🙏
            </p>
          ) : (
            <ol className="mt-4 space-y-4">
              {needs.map((p, i) => {
                const lvl = levels[p.ladder.level];
                const plan = activePlans.get(p.id);
                return (
                  <li key={p.id} className="rounded-md border border-steel bg-white p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night font-display text-starlight">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/members/${p.id}`} className="font-medium text-paper hover:text-gold-text">
                            {p.name}
                          </Link>
                          <Pill tone={lvl.tone}>
                            {lvl.emoji} {lvl.name}
                          </Pill>
                        </div>
                        <p className="mt-0.5 text-xs text-paper-dim">{lvl.hint}</p>
                      </div>
                      <span className="text-xs text-paper-dim" title="Priority score">
                        {p.score} pts
                      </span>
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {p.reasons.map((r) => (
                        <li key={r} className="rounded-full bg-dusk px-2.5 py-1 text-xs text-paper">
                          {r}
                        </li>
                      ))}
                    </ul>
                    {p.ladder.last_missed && <p className="mt-2 text-sm text-paper-dim">Last missed: &ldquo;{p.ladder.last_missed}&rdquo;</p>}
                    {p.explanations[0] && (
                      <p className="mt-2 text-sm text-paper">
                        <span className="text-paper-dim">They said: </span>
                        {lateReasonLabel(p.explanations[0].reason)}
                        {p.explanations[0].note && <span className="text-paper-dim"> · &ldquo;{p.explanations[0].note}&rdquo;</span>}
                      </p>
                    )}

                    {plan && (
                      <div className="mt-3 rounded-sm border border-[#c9b8e8] bg-[#f3eefb] p-3 text-sm">
                        <p className="font-medium text-[#5b3f8f]">Restoration plan</p>
                        <p className="mt-1 whitespace-pre-line text-paper">{plan.plan}</p>
                        <p className="mt-1 text-xs text-paper-dim">
                          Started {lagosDateTime(plan.created_at).split(",").slice(0, 2).join(",")}
                          {plan.due_on && ` · finish by ${new Date(plan.due_on).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}`}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <form action={finishPlan}>
                            <input type="hidden" name="id" value={plan.id} />
                            <input type="hidden" name="outcome" value="completed" />
                            <button className="rounded-sm bg-[#3d9a6a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#33845a]">Completed: fresh start</button>
                          </form>
                          <form action={finishPlan}>
                            <input type="hidden" name="id" value={plan.id} />
                            <input type="hidden" name="outcome" value="cancelled" />
                            <button className="rounded-sm border border-steel bg-white px-3 py-1.5 text-xs text-paper-dim hover:text-paper">Cancel plan</button>
                          </form>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-steel pt-4">
                      <Link href={draftLink(p)} className="rounded-sm bg-gold px-3 py-1.5 text-sm font-medium text-ink hover:bg-gold-soft">
                        Message {p.name.split(" ")[0]}
                      </Link>
                      {inTeam.has(p.id) && (
                        <form action={askTeamLead}>
                          <input type="hidden" name="member_id" value={p.id} />
                          <button className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold">Ask their team lead</button>
                        </form>
                      )}
                      {p.phone && (
                        <a
                          href={`https://wa.me/${p.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold"
                        >
                          WhatsApp
                        </a>
                      )}
                      {!plan && p.ladder.level >= 2 && (
                        <details className="w-full">
                          <summary className="cursor-pointer text-sm text-[#5b3f8f] hover:underline">Start a restoration plan</summary>
                          <form action={startPlan} className="mt-2 space-y-2">
                            <input type="hidden" name="member_id" value={p.id} />
                            <textarea
                              name="plan"
                              required
                              rows={3}
                              defaultValue={`1. Hand in "${p.ladder.last_missed ?? "the missed assignment"}" this week.\n2. Pray with your prayer partner twice before Sunday.\n3. Come to Night Watch on Friday.`}
                              className="w-full rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-sm text-paper-dim">
                                Finish by{" "}
                                <input type="date" name="due_on" className="h-9 rounded-sm border border-steel bg-white px-2 text-sm text-paper" />
                              </label>
                              <button className="h-9 rounded-sm bg-[#5b3f8f] px-3 text-sm font-medium text-white hover:bg-[#4a3275]">Start plan and message {p.name.split(" ")[0]}</button>
                            </div>
                          </form>
                        </details>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="space-y-6 lg:self-start">
          <Panel>
            <p className="font-medium text-paper">⭐ Faithful</p>
            <p className="mt-1 text-sm text-paper-dim">5 or more on time in a row. Celebrate them.</p>
            <ul className="mt-3 space-y-2">
              {faithful.length === 0 && <li className="text-sm text-paper-dim">No one yet.</li>}
              {faithful.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-paper">
                    {p.name} <span className="text-paper-dim">· {p.ladder.on_time_streak} in a row</span>
                  </span>
                  <Link href={draftLink(p)} className="shrink-0 text-xs text-gold-text hover:underline">
                    Thank them
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <p className="font-medium text-paper">What people said</p>
            <p className="mt-1 text-sm text-paper-dim">Reasons given for late hand-ins.</p>
            <ul className="mt-3 space-y-3">
              {allExplanations.length === 0 && <li className="text-sm text-paper-dim">No late hand-ins.</li>}
              {allExplanations.map((e) => (
                <li key={`${e.id}-${e.at}`} className={cn("text-sm", e.reason === "struggling" && "rounded-sm bg-[#fbefec] p-2")}>
                  <p className="text-paper">
                    <span className="font-medium">{e.name}</span> · {lateReasonLabel(e.reason)}
                  </p>
                  {e.note && <p className="text-paper-dim">&ldquo;{e.note}&rdquo;</p>}
                  <p className="text-xs text-paper-dim">
                    {e.title} · {lagosDateTime(e.at).split(",").slice(0, 2).join(",")}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <p className="font-medium text-paper">How it works</p>
            <ul className="mt-2 space-y-1.5 text-sm text-paper-dim">
              <li>Reminders go out 24 hours and 3 hours before an assignment is due.</li>
              <li>Late hand-ins must say what happened. &ldquo;Going through something&rdquo; reaches you straight away.</li>
              {([1, 2, 3, 4] as const).map((lvl) => (
                <li key={lvl}>
                  {levels[lvl].emoji} <strong className="text-paper">{levels[lvl].name}:</strong> {levels[lvl].hint}
                </li>
              ))}
              <li>Only the last 4 assignments count, so faithfulness always wins back the way.</li>
              <li>Nobody is removed from a role automatically. That&rsquo;s your call.</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
