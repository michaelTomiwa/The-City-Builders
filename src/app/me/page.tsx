import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getMember, getMemberData, memberGrowth } from "@/lib/member-data";
import {
  dueLabel,
  firstName,
  lagosToday,
  programPhase,
  type Checkin,
  type Step,
} from "@/lib/discipleship";
import { StepCard } from "@/components/members/step-card";
import { ProgressRing } from "@/components/members/progress-ring";
import { ImHere } from "@/components/members/im-here";
import { PartnerCard, type Partner } from "@/components/members/partner-card";
import { savePrayerNeed } from "./actions";
import { getMyTeamTasks, getMyTeams } from "@/lib/teams";

function greeting() {
  const hour = (new Date().getUTCHours() + 1) % 24;
  if (hour < 5) return "Keeping watch";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "Africa/Lagos" });
}

export default async function TodayPage() {
  const { profile, supabase } = await getMember();
  const { data: partnerRows } = await supabase.rpc("my_partner");
  const partner = ((partnerRows ?? []) as Partner[])[0] ?? null;
  const [teamTasks, myTeams] = await Promise.all([getMyTeamTasks(), getMyTeams()]);
  const { data: teamUpdates } = myTeams.length
    ? await supabase
        .from("team_posts")
        .select("id, body, author_name, created_at, team_id")
        .in("team_id", myTeams.map((t) => t.team.id))
        .eq("kind", "update")
        .order("created_at", { ascending: false })
        .limit(1)
    : { data: [] };
  const { data: convo } = await supabase.from("conversations").select("last_body, last_from_pastor, member_unread").eq("member_id", profile?.id ?? "").maybeSingle();
  const latestUpdate = (teamUpdates ?? [])[0] as { id: string; body: string; author_name: string | null; team_id: string } | undefined;
  const updateTeam = latestUpdate ? myTeams.find((t) => t.team.id === latestUpdate.team_id)?.team : undefined;
  const data = await getMemberData();
  const { programs, steps, checkins, assignments, submissions, notices } = data;
  const today = lagosToday();

  const doneBy = new Map<string, Checkin>(checkins.map((c) => [c.step_id, c]));
  const { g, streakDays: days } = memberGrowth(data);

  const active = programs
    .map((p) => ({ p, ...programPhase(p, today) }))
    .filter((x) => x.phase === "active");
  const upcoming = programs
    .map((p) => ({ p, ...programPhase(p, today) }))
    .filter((x) => x.phase === "upcoming")
    .sort((a, b) => a.startsIn - b.startsIn);

  const todays: { step: Step; title: string }[] = [];
  const catchUp: { step: Step; title: string }[] = [];
  for (const { p, day } of active) {
    for (const s of steps.filter((s) => s.program_id === p.id)) {
      if (s.day === day) todays.push({ step: s, title: p.title });
      else if (s.day < day && !doneBy.has(s.id)) catchUp.push({ step: s, title: p.title });
    }
  }
  const todayDone = todays.filter((t) => doneBy.has(t.step.id)).length;

  const handedIn = new Map(submissions.map((s) => [s.assignment_id, s]));
  const toDo = assignments.filter((a) => !handedIn.has(a.id) || handedIn.get(a.id)?.status === "needs_work");

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-paper-dim">{todayLabel()}</p>
          <h1 className="mt-1 font-display text-4xl text-paper sm:text-5xl">
            {greeting()}, {firstName(profile)}.
          </h1>
        </div>
        {todays.length > 0 && (
          <div className="flex items-center gap-4 text-paper">
            <ProgressRing value={todays.length ? todayDone / todays.length : 0} label={`${todayDone}/${todays.length}`} color="#3d9a6a" />
            <p className="text-sm text-paper-dim">
              {todayDone === todays.length ? "All done for today. Well done." : "steps done today"}
            </p>
          </div>
        )}
      </div>

      <ImHere tone="paper" className="mt-6" />

      {/* Growth */}
      {convo && convo.member_unread > 0 && convo.last_from_pastor && (
        <Link
          href="/me/messages"
          className="mt-8 flex items-center gap-4 rounded-md border border-gold/60 bg-gold/10 px-5 py-4 transition-colors hover:bg-gold/20"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-ink" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gold-text">
              New message from Pastor Michael{convo.member_unread > 1 ? ` (${convo.member_unread})` : ""}
            </span>
            <span className="block truncate text-paper">{convo.last_body}</span>
          </span>
          <span className="hidden shrink-0 text-sm font-medium text-gold-text sm:block">Open and reply</span>
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-steel bg-white p-5">
          <p className="text-sm text-paper-dim">Streak</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl text-paper">{days}</span>
            <span className="text-paper-dim">{days === 1 ? "day" : "days"}</span>
          </p>
          <p className="mt-1 text-xs text-paper-dim">{days > 0 ? "Keep it going today." : "Check off a step to start one."}</p>
        </div>
        <div className="rounded-md border border-steel bg-white p-5 sm:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-paper-dim">Growth</p>
            <p className="text-xs text-paper-dim">{g.points} points</p>
          </div>
          <p className="mt-1 font-display text-3xl text-paper">{g.level.name}</p>
          <p className="text-sm text-paper-dim">{g.level.line}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-dusk">
            <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${Math.max(3, g.progress * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-paper-dim">
            {g.next ? `${g.next.min - g.points} more to ${g.next.name}` : "The highest level. Keep building others up."}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="font-display text-2xl text-paper">Today&rsquo;s steps</h2>
          {todays.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center">
              <p className="text-paper">Nothing set for today.</p>
              <p className="mt-1 text-sm text-paper-dim">
                {upcoming[0]
                  ? `${upcoming[0].p.title} starts in ${upcoming[0].startsIn} ${upcoming[0].startsIn === 1 ? "day" : "days"}.`
                  : "When the pastor starts a new programme, today's steps will show here."}
              </p>
              <Link href="/live" className="mt-4 inline-block text-sm text-gold-text underline-offset-4 hover:underline">
                Join tonight&rsquo;s Night Watch
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {todays.map(({ step, title }) => (
                <StepCard key={step.id} step={step} done={doneBy.get(step.id) ?? null} programTitle={active.length > 1 ? title : undefined} />
              ))}
            </ul>
          )}

          {catchUp.length > 0 && (
            <details className="group mt-8">
              <summary className="cursor-pointer list-none text-paper">
                <span className="font-display text-xl">Catch up</span>{" "}
                <span className="text-sm text-paper-dim">
                  {catchUp.length} {catchUp.length === 1 ? "step" : "steps"} from earlier days
                </span>
                <span className="ml-2 text-gold-text group-open:hidden">Show</span>
              </summary>
              <ul className="mt-4 space-y-3">
                {catchUp.map(({ step, title }) => (
                  <StepCard key={step.id} step={step} done={null} programTitle={`Day ${step.day} · ${title}`} />
                ))}
              </ul>
            </details>
          )}

          {active.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-2xl text-paper">Your programmes</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {active.map(({ p, day }) => {
                  const own = steps.filter((s) => s.program_id === p.id);
                  const done = own.filter((s) => doneBy.has(s.id)).length;
                  return (
                    <li key={p.id}>
                      <Link href={`/me/programs/${p.id}`} className="flex items-center gap-4 rounded-md border border-steel bg-white p-4 text-paper hover:border-gold">
                        <ProgressRing value={own.length ? done / own.length : 0} size={56} stroke={5} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.title}</span>
                          <span className="text-sm text-paper-dim">
                            Day {day} of {p.days}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {notices.length > 0 && (
            <section className="on-night rounded-md bg-night p-5 text-starlight">
              <h2 className="text-sm text-lamp">A word from the pastor</h2>
              {notices.slice(0, 2).map((n) => (
                <article key={n.id} className="mt-3 border-t border-night-3 pt-3 first:border-0 first:pt-0">
                  <p className="font-display text-xl leading-snug">{n.title}</p>
                  <div className="mt-1.5 text-sm leading-relaxed text-starlight-dim [&_a]:text-lamp [&_a]:underline [&_p+p]:mt-2">
                    <ReactMarkdown>{n.body}</ReactMarkdown>
                  </div>
                </article>
              ))}
            </section>
          )}

          {(teamTasks.length > 0 || latestUpdate) && (
            <section className="rounded-md border border-steel bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl text-paper">Your team</h2>
                <Link href="/me/teams" className="text-sm text-gold-text hover:underline">
                  Teams
                </Link>
              </div>
              {latestUpdate && updateTeam && (
                <Link href={`/me/teams/${updateTeam.slug}`} className="mt-3 block border-l-2 pl-3" style={{ borderColor: updateTeam.color }}>
                  <span className="text-xs text-paper-dim">
                    {updateTeam.name} · {latestUpdate.author_name ?? "Lead"}
                  </span>
                  <span className="mt-0.5 line-clamp-3 block text-sm text-paper">{latestUpdate.body}</span>
                </Link>
              )}
              {teamTasks.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {teamTasks.slice(0, 4).map((t) => (
                    <li key={t.task_id}>
                      <Link href={`/me/teams/${t.teams?.slug}?tab=tasks`} className="group block">
                        <span className="block text-sm font-medium text-paper group-hover:text-gold-text">{t.team_tasks?.title}</span>
                        <span className={t.status === "redo" ? "text-xs text-[#a3402b]" : "text-xs text-paper-dim"}>
                          {t.status === "redo" ? "Your lead asked for another go" : t.teams?.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {partner && <PartnerCard partner={partner} />}

          {partner && (
            <form action={savePrayerNeed} className="rounded-md border border-steel bg-white p-5">
              <label htmlFor="prayer_need" className="text-sm font-medium text-paper">
                What should your partner pray for this week?
              </label>
              <textarea
                id="prayer_need"
                name="prayer_need"
                rows={2}
                defaultValue={profile?.prayer_need ?? ""}
                className="mt-2 w-full rounded-sm border border-steel px-3 py-2 text-sm text-paper outline-none focus:border-gold"
              />
              <button className="mt-2 rounded-sm border border-steel px-3 py-1.5 text-sm text-paper hover:border-gold">Save</button>
            </form>
          )}

          <section className="rounded-md border border-steel bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl text-paper">Assignments</h2>
              <Link href="/me/assignments" className="text-sm text-gold-text hover:underline">
                All
              </Link>
            </div>
            {toDo.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">You&rsquo;re all caught up.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {toDo.slice(0, 4).map((a) => {
                  const due = dueLabel(a.due_at);
                  const needsWork = handedIn.get(a.id)?.status === "needs_work";
                  return (
                    <li key={a.id}>
                      <Link href={`/me/assignments/${a.id}`} className="group block">
                        <span className="block font-medium leading-snug text-paper group-hover:text-gold-text">{a.title}</span>
                        <span className={needsWork || due?.late ? "text-xs text-[#a3402b]" : "text-xs text-paper-dim"}>
                          {needsWork ? "The pastor asked for another look" : (due?.text ?? "No due date")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {upcoming.length > 0 && (
            <section className="rounded-md border border-steel bg-white p-5">
              <h2 className="font-display text-xl text-paper">Coming up</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {upcoming.slice(0, 3).map(({ p, startsIn }) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <Link href={`/me/programs/${p.id}`} className="text-paper hover:text-gold-text">
                      {p.title}
                    </Link>
                    <span className="shrink-0 text-paper-dim">
                      in {startsIn} {startsIn === 1 ? "day" : "days"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
