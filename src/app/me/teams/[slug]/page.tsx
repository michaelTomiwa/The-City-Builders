import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember } from "@/lib/member-data";
import { daysSince, displayName, lagosDateTime, lagosToday } from "@/lib/discipleship";
import {
  healthLabels,
  roleLabel,
  taskStatus,
  type Assignment,
  type Team,
  type TeamMeeting,
  type TeamMessage,
  type TeamPerson,
  type TeamPost,
  type TeamReport,
  type TeamRole,
  type TeamTask,
} from "@/lib/teams";
import { PrayButton } from "@/components/teams/pray-button";
import { ReportCard } from "@/components/teams/report-card";
import { TaskAssignees } from "@/components/teams/task-assignees";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { cn } from "@/lib/utils";
import {
  createTeamTask,
  deleteTeamPost,
  deleteTeamTask,
  postToTeam,
  recordMeeting,
  reviewTeamTask,
  sendTeamMessage,
  submitTeamReport,
  updateMyTask,
} from "../../team-actions";

const input = "w-full rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold";
const card = "rounded-md border border-steel bg-white p-5";

function when(iso: string) {
  return lagosDateTime(iso).split(",").slice(0, 2).join(",");
}

export default async function TeamSpace({ params, searchParams }: PageProps<"/me/teams/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const { supabase, user, profile } = await getMember();
  const { data: teamRow } = await supabase.from("teams").select("*").eq("slug", slug).maybeSingle();
  if (!teamRow || !user) notFound();
  const team = teamRow as Team;
  const { data: mine } = await supabase.from("team_members").select("role, title").eq("team_id", team.id).eq("user_id", user.id).maybeSingle();
  const isStaff = profile?.role === "admin" || profile?.role === "author";
  if (!mine && !isStaff) notFound();
  const role = (mine?.role ?? "lead") as TeamRole;
  const lead = role !== "member" || isStaff;

  const tabs = [
    { id: "board", label: "Board" },
    { id: "tasks", label: "Tasks" },
    { id: "prayer", label: "Prayer" },
    { id: "meetings", label: "Meetings" },
    { id: "people", label: lead ? "People & growth" : "People" },
    ...(lead ? [{ id: "reports", label: "Reports to the pastor" }, { id: "leaders", label: "Pastor & leaders" }] : []),
  ];
  const tab = tabs.some((t) => t.id === query.tab) ? (query.tab as string) : "board";

  const [{ data: peopleRows }, { data: postRows }, { data: prayRows }, { data: taskRows }, { data: assignRows }, { data: meetingRows }, { data: meetingAtt }, reports, messages] =
    await Promise.all([
      supabase.rpc("team_people", { p_team: team.id }),
      supabase.from("team_posts").select("*").eq("team_id", team.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("team_post_prayers").select("post_id, user_id"),
      supabase.from("team_tasks").select("*").eq("team_id", team.id).order("created_at", { ascending: false }),
      supabase.from("task_assignments").select("*").eq("team_id", team.id),
      supabase.from("team_meetings").select("*").eq("team_id", team.id).order("held_on", { ascending: false }).limit(20),
      supabase.from("team_meeting_attendance").select("meeting_id, user_id"),
      lead ? supabase.from("team_reports").select("*").eq("team_id", team.id).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      lead ? supabase.from("team_messages").select("*").eq("team_id", team.id).order("created_at", { ascending: true }).limit(200) : Promise.resolve({ data: [] }),
    ]);

  const people = (peopleRows ?? []) as TeamPerson[];
  const nameOf = new Map(people.map((p) => [p.user_id, displayName({ full_name: p.full_name, email: null })]));
  const posts = (postRows ?? []) as TeamPost[];
  const prayers = (prayRows ?? []) as { post_id: string; user_id: string }[];
  const tasks = (taskRows ?? []) as TeamTask[];
  const assignments = (assignRows ?? []) as Assignment[];
  const meetings = (meetingRows ?? []) as TeamMeeting[];
  const attendance = (meetingAtt ?? []) as { meeting_id: string; user_id: string }[];
  const reportList = (reports.data ?? []) as TeamReport[];
  const messageList = (messages.data ?? []) as TeamMessage[];
  const myOpen = assignments.filter((a) => a.user_id === user.id && (a.status === "todo" || a.status === "redo")).length;
  const leads = people.filter((p) => p.role !== "member");
  const today = lagosToday();

  return (
    <div>
      <Link href="/me/teams" className="text-sm text-paper-dim hover:text-gold-text">
        Your teams
      </Link>
      <div className="on-night relative mt-4 overflow-hidden rounded-md bg-night p-6 text-starlight sm:p-8">
        <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: team.color }} />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm" style={{ color: team.color }}>
              {mine?.title || roleLabel[role]}
            </p>
            <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">{team.name}</h1>
            {team.description && <p className="mt-2 max-w-2xl text-starlight-dim">{team.description}</p>}
            {leads.length > 0 && <p className="mt-3 text-sm text-starlight-dim">Led by {leads.map((l) => nameOf.get(l.user_id)).join(", ")}</p>}
          </div>
          <dl className="flex gap-6 text-center">
            <div>
              <dd className="font-display text-3xl">{people.length}</dd>
              <dt className="text-xs text-starlight-dim">people</dt>
            </div>
            <div>
              <dd className="font-display text-3xl">{myOpen}</dd>
              <dt className="text-xs text-starlight-dim">tasks for you</dt>
            </div>
            <div>
              <dd className="font-display text-3xl">{meetings.length}</dd>
              <dt className="text-xs text-starlight-dim">meetings</dt>
            </div>
          </dl>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1 rounded-md bg-dusk p-1 text-sm" aria-label="Team">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/me/teams/${slug}${t.id === "board" ? "" : `?tab=${t.id}`}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn("rounded px-3.5 py-1.5", tab === t.id ? "bg-white text-paper shadow-sm" : "text-paper-dim hover:text-paper")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {/* Board ------------------------------------------------------------------ */}
        {tab === "board" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-4">
              {lead && (
                <form action={postToTeam} className={card}>
                  <input type="hidden" name="team_id" value={team.id} />
                  <input type="hidden" name="kind" value="update" />
                  <textarea name="body" required rows={3} placeholder={`Post an update to ${team.name}…`} className={input} />
                  <button className="mt-2 rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Post to the team</button>
                </form>
              )}
              {posts.filter((p) => p.kind === "update").length === 0 ? (
                <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">No updates yet.</p>
              ) : (
                posts
                  .filter((p) => p.kind === "update")
                  .map((p) => (
                    <article key={p.id} className={card}>
                      <p className="text-sm">
                        <span className="font-medium text-paper">{p.author_name ?? "Team lead"}</span>
                        <span className="text-paper-dim"> · {when(p.created_at)}</span>
                      </p>
                      <p className="mt-2 whitespace-pre-line leading-relaxed text-paper">{p.body}</p>
                      {(lead || p.author_id === user.id) && (
                        <form action={deleteTeamPost} className="mt-2">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <ConfirmButton message="Delete this post?" className="text-xs text-paper-dim hover:text-[#8a2f1e]">
                            Delete
                          </ConfirmButton>
                        </form>
                      )}
                    </article>
                  ))
              )}
            </div>
            <aside className={cn(card, "lg:self-start")}>
              <p className="font-medium text-paper">Your tasks here</p>
              {myOpen === 0 ? (
                <p className="mt-1 text-sm text-paper-dim">Nothing waiting on you.</p>
              ) : (
                <Link href={`/me/teams/${slug}?tab=tasks`} className="mt-1 block text-sm text-gold-text hover:underline">
                  {myOpen} open {myOpen === 1 ? "task" : "tasks"} →
                </Link>
              )}
            </aside>
          </div>
        )}

        {/* Tasks ------------------------------------------------------------------ */}
        {tab === "tasks" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              {tasks.length === 0 && <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">No tasks yet.</p>}
              {tasks.map((t) => {
                const rows = assignments.filter((a) => a.task_id === t.id);
                const mineRow = rows.find((a) => a.user_id === user.id);
                const finished = rows.filter((a) => a.status === "approved" || a.status === "done").length;
                const overdue = t.due_at && Date.parse(t.due_at) < Date.parse(`${today}T00:00:00+01:00`);
                return (
                  <article key={t.id} className={card}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-paper">{t.title}</p>
                        <p className={cn("text-sm", overdue ? "text-[#a3402b]" : "text-paper-dim")}>
                          {t.due_at ? `Due ${lagosDateTime(t.due_at)}` : "No due date"}
                          {lead && ` · ${finished}/${rows.length} done`}
                        </p>
                      </div>
                      {mineRow && <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", taskStatus[mineRow.status].className)}>{taskStatus[mineRow.status].label}</span>}
                    </div>
                    {t.details && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper-dim">{t.details}</p>}

                    {mineRow && (
                      <form action={updateMyTask} className="mt-4 space-y-2 rounded-sm bg-dusk/40 p-3">
                        <input type="hidden" name="task_id" value={t.id} />
                        <input type="hidden" name="slug" value={slug} />
                        {mineRow.feedback && <p className="text-sm text-[#8a2f1e]">Lead: {mineRow.feedback}</p>}
                        {mineRow.status !== "approved" && (
                          <>
                            <textarea name="note" rows={2} defaultValue={mineRow.note ?? ""} placeholder="What did you do? (optional)" className={input} />
                            <input name="proof_url" type="url" defaultValue={mineRow.proof_url ?? ""} placeholder="Link to a photo or proof (optional)" className={input} />
                          </>
                        )}
                        {mineRow.status === "approved" ? (
                          <>
                            {mineRow.note && <p className="whitespace-pre-line text-sm text-paper-dim">You: {mineRow.note}</p>}
                            <p className="text-sm text-[#24613a]">Approved{mineRow.feedback ? "" : ". Well done."}</p>
                          </>
                        ) : mineRow.status === "done" ? (
                          <button name="status" value="todo" className="rounded-sm border border-steel bg-white px-4 py-1.5 text-sm text-paper">
                            Reopen
                          </button>
                        ) : (
                          <button name="status" value="done" className="rounded-sm bg-[#3d9a6a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#33845a]">
                            Mark done
                          </button>
                        )}
                      </form>
                    )}

                    {lead && rows.length > 0 && (
                      <details className="mt-4" open={rows.some((r) => r.status === "done")}>
                        <summary className="cursor-pointer text-sm text-gold-text">Accountability ({rows.length} people)</summary>
                        <ul className="mt-3 divide-y divide-steel rounded-sm border border-steel">
                          {rows.map((a) => (
                            <li key={a.user_id} className="p-3 text-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium text-paper">{nameOf.get(a.user_id) ?? "Member"}</span>
                                <span className={cn("rounded-full px-2 py-0.5 text-xs", taskStatus[a.status].className)}>{taskStatus[a.status].label}</span>
                              </div>
                              {a.note && <p className="mt-1 text-paper-dim">{a.note}</p>}
                              {a.proof_url && (
                                <a href={a.proof_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-gold-text underline">
                                  {a.proof_url}
                                </a>
                              )}
                              {a.status === "done" && (
                                <form action={reviewTeamTask} className="mt-2 flex flex-wrap gap-2">
                                  <input type="hidden" name="task_id" value={t.id} />
                                  <input type="hidden" name="user_id" value={a.user_id} />
                                  <input type="hidden" name="slug" value={slug} />
                                  <input name="feedback" placeholder="Feedback (optional)" className="h-8 min-w-0 flex-1 rounded-sm border border-steel px-2 text-sm" />
                                  <button name="status" value="approved" className="rounded-sm bg-[#3d9a6a] px-3 py-1 text-sm text-white">
                                    Approve
                                  </button>
                                  <button name="status" value="redo" className="rounded-sm border border-steel px-3 py-1 text-sm text-paper">
                                    Another go
                                  </button>
                                </form>
                              )}
                            </li>
                          ))}
                        </ul>
                        <form action={deleteTeamTask} className="mt-2">
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <ConfirmButton message="Delete this task for everyone?" className="text-xs text-paper-dim hover:text-[#8a2f1e]">
                            Delete task
                          </ConfirmButton>
                        </form>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
            {lead && (
              <form action={createTeamTask} className={cn(card, "space-y-3 lg:sticky lg:top-24 lg:self-start")}>
                <p className="font-display text-xl text-paper">Give a task</p>
                <input type="hidden" name="team_id" value={team.id} />
                <input name="title" required placeholder="e.g. Pray 30 minutes for the city before Sunday" className={input} />
                <textarea name="details" rows={3} placeholder="Details (optional)" className={input} />
                <label className="block text-xs text-paper-dim">
                  Due (Lagos time, optional)
                  <input type="datetime-local" name="due_at" className={cn(input, "mt-1")} />
                </label>
                <TaskAssignees people={people.map((p) => ({ id: p.user_id, name: nameOf.get(p.user_id) ?? "Member" }))} />
                <button className="w-full rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Assign task</button>
              </form>
            )}
          </div>
        )}

        {/* Prayer ------------------------------------------------------------------ */}
        {tab === "prayer" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-4">
              {posts.filter((p) => p.kind === "prayer").length === 0 ? (
                <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">No prayer requests yet.</p>
              ) : (
                posts
                  .filter((p) => p.kind === "prayer")
                  .map((p) => {
                    const praying = prayers.filter((x) => x.post_id === p.id);
                    return (
                      <article key={p.id} className={card}>
                        <p className="text-sm">
                          <span className="font-medium text-paper">{p.author_name ?? "A team member"}</span>
                          <span className="text-paper-dim"> · {when(p.created_at)}</span>
                        </p>
                        <p className="mt-2 whitespace-pre-line leading-relaxed text-paper">{p.body}</p>
                        <div className="mt-3">
                          <PrayButton postId={p.id} slug={slug} count={praying.length} mine={praying.some((x) => x.user_id === user.id)} />
                        </div>
                      </article>
                    );
                  })
              )}
            </div>
            <form action={postToTeam} className={cn(card, "lg:self-start")}>
              <p className="font-display text-xl text-paper">Ask the team to pray</p>
              <input type="hidden" name="team_id" value={team.id} />
              <input type="hidden" name="kind" value="prayer" />
              <textarea name="body" required rows={4} placeholder="What can we pray with you about?" className={cn(input, "mt-3")} />
              <button className="mt-2 rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Share with the team</button>
            </form>
          </div>
        )}

        {/* Meetings ------------------------------------------------------------------ */}
        {tab === "meetings" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-3">
              {meetings.length === 0 && <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">No meetings recorded yet.</p>}
              {meetings.map((m) => {
                const present = attendance.filter((a) => a.meeting_id === m.id);
                const iWas = present.some((a) => a.user_id === user.id);
                return (
                  <article key={m.id} className={card}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-paper">{m.title}</p>
                      <span className="text-sm text-paper-dim">
                        {new Date(m.held_on).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                      </span>
                    </div>
                    {lead ? (
                      <p className="mt-1 text-sm text-paper-dim">
                        {present.length} of {people.length} present{present.length ? `: ${present.map((a) => nameOf.get(a.user_id)).join(", ")}` : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-paper-dim">{iWas ? "You were there" : "Marked absent"}</p>
                    )}
                    {m.notes && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper">{m.notes}</p>}
                  </article>
                );
              })}
            </div>
            {lead && (
              <form action={recordMeeting} className={cn(card, "space-y-3 lg:self-start")}>
                <p className="font-display text-xl text-paper">Record a meeting</p>
                <input type="hidden" name="team_id" value={team.id} />
                <input name="title" placeholder="Team prayer meeting" className={input} />
                <input type="date" name="held_on" defaultValue={today} className={input} />
                <fieldset>
                  <legend className="text-xs text-paper-dim">Who was there?</legend>
                  <ul className="mt-1 max-h-48 overflow-y-auto rounded-sm border border-steel py-1">
                    {people.map((p) => (
                      <li key={p.user_id}>
                        <label className="flex items-center gap-2 px-3 py-1 text-sm text-paper">
                          <input type="checkbox" name="present" value={p.user_id} defaultChecked className="accent-gold" />
                          {nameOf.get(p.user_id)}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
                <textarea name="notes" rows={3} placeholder="Notes, decisions, what God said…" className={input} />
                <button className="w-full rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Save meeting</button>
              </form>
            )}
          </div>
        )}

        {/* People ------------------------------------------------------------------ */}
        {tab === "people" && (
          <div className={card}>
            {lead && <p className="mb-4 text-sm text-paper-dim">Growth numbers are from each person&rsquo;s dashboard. Reach out to anyone who has gone quiet.</p>}
            <ul className="divide-y divide-steel">
              {people.map((p) => {
                const quiet = lead && (!p.last_active || daysSince(p.last_active) >= 10);
                return (
                  <li key={p.user_id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="font-medium text-paper">{nameOf.get(p.user_id)}</span>
                      <span className="ml-2 text-sm text-paper-dim">{p.title || roleLabel[p.role]}</span>
                      {quiet && <span className="ml-2 rounded-full bg-[#f6e1dc] px-2 py-0.5 text-xs text-[#8a2f1e]">Gone quiet</span>}
                    </span>
                    {lead && (
                      <span className="flex flex-wrap items-center gap-4 text-xs text-paper-dim">
                        <span>{p.services_14d ?? 0} services (14 days)</span>
                        <span>{p.steps ?? 0} steps</span>
                        <span>{p.lessons ?? 0} lessons</span>
                        <span className={p.overdue_tasks ? "text-[#a3402b]" : ""}>
                          {p.open_tasks} open{p.overdue_tasks ? `, ${p.overdue_tasks} overdue` : ""}
                        </span>
                        {p.phone && (
                          <a href={`https://wa.me/${p.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-gold-text hover:underline">
                            WhatsApp
                          </a>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Reports ------------------------------------------------------------------ */}
        {tab === "reports" && lead && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              {query.sent && (
                <p className="rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
                  Sent to the pastor. Their reply will show here.
                </p>
              )}
              {reportList.length === 0 && <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">No reports yet. Send the first one.</p>}
              {reportList.map((r) => (
                <ReportCard key={r.id} r={r} />
              ))}
            </div>
            <form action={submitTeamReport} className={cn(card, "space-y-3 lg:sticky lg:top-24 lg:self-start")}>
              <p className="font-display text-xl text-paper">This week&rsquo;s report</p>
              <input type="hidden" name="team_id" value={team.id} />
              <fieldset>
                <legend className="text-xs text-paper-dim">How is the team?</legend>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((h) => (
                    <label key={h} className="cursor-pointer">
                      <input type="radio" name="health" value={h} defaultChecked={h === 4} className="peer sr-only" />
                      <span className="block rounded-sm border border-steel py-1.5 text-center text-xs text-paper-dim peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-paper">
                        {healthLabels[h]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <textarea name="god_doing" rows={3} placeholder="What is God doing in the team?" className={input} />
              <textarea name="growth" rows={2} placeholder="Growth: who is growing, what's changing" className={input} />
              <textarea name="wins" rows={2} placeholder="Wins this week" className={input} />
              <textarea name="concerns" rows={2} placeholder="Concerns or challenges" className={input} />
              <textarea name="prayer" rows={2} placeholder="Prayer points" className={input} />
              <button className="w-full rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Send to the pastor</button>
            </form>
          </div>
        )}

        {/* Pastor & leaders ------------------------------------------------------------- */}
        {tab === "leaders" && lead && (
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-paper-dim">A private conversation between Pastor Michael and the leads of {team.name}.</p>
            <ol className="mt-4 space-y-3">
              {messageList.length === 0 && <li className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">Start the conversation.</li>}
              {messageList.map((m) => (
                <li key={m.id} className={cn("flex", m.from_pastor ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[85%] rounded-lg px-4 py-3", m.from_pastor ? "on-night bg-night text-starlight" : "border border-steel bg-white text-paper")}>
                    <p className={cn("text-xs", m.from_pastor ? "text-lamp" : "text-paper-dim")}>
                      {m.from_pastor ? `${m.author_name ?? "Pastor"} · Pastor` : (m.author_name ?? "Lead")} · {when(m.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed">{m.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <form action={sendTeamMessage} className="mt-5 flex gap-2">
              <input type="hidden" name="team_id" value={team.id} />
              <textarea name="body" required rows={2} placeholder="Write to the pastor…" className={cn(input, "flex-1")} />
              <button className="self-end rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
