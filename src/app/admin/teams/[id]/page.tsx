import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, Tabs, fieldLabel, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/teams/report-card";
import { activeMembers } from "@/lib/admin-discipleship";
import { daysSince, displayName, lagosDateTime } from "@/lib/discipleship";
import { roleLabel, teamColors, type Assignment, type Team, type TeamMessage, type TeamPerson, type TeamReport, type TeamTask } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { deleteTeam, removeTeamMember, replyToReport, saveTeam, setTeamMember } from "../../discipleship/actions";
import { sendTeamMessage } from "@/app/me/team-actions";

export default async function AdminTeam({ params, searchParams }: PageProps<"/admin/teams/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: row } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const team = row as Team;

  const [{ data: peopleRows }, { data: reportRows }, { data: messageRows }, { data: taskRows }, { data: assignRows }, { members }] = await Promise.all([
    supabase.rpc("team_people", { p_team: id }),
    supabase.from("team_reports").select("*").eq("team_id", id).order("created_at", { ascending: false }),
    supabase.from("team_messages").select("*").eq("team_id", id).order("created_at", { ascending: true }),
    supabase.from("team_tasks").select("*").eq("team_id", id).order("created_at", { ascending: false }),
    supabase.from("task_assignments").select("*").eq("team_id", id),
    activeMembers(supabase),
  ]);
  const people = (peopleRows ?? []) as TeamPerson[];
  const reports = (reportRows ?? []) as TeamReport[];
  const messages = (messageRows ?? []) as TeamMessage[];
  const tasks = (taskRows ?? []) as TeamTask[];
  const assigns = (assignRows ?? []) as Assignment[];
  const inTeam = new Set(people.map((p) => p.user_id));
  const available = members.filter((m) => !inTeam.has(m.id));
  const nameOf = new Map(people.map((p) => [p.user_id, displayName({ full_name: p.full_name, email: null })]));
  const unanswered = reports.filter((r) => !r.pastor_reply).length;
  const tab = ["people", "reports", "messages", "tasks", "settings"].includes(String(query.tab)) ? String(query.tab) : "people";

  return (
    <div>
      <Link href="/admin/teams" className="text-sm text-paper-dim hover:text-gold-text">
        All teams
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <span className="h-10 w-1.5 rounded-full" style={{ backgroundColor: team.color }} />
        <AdminHeader title={team.name} description={team.description ?? undefined} />
      </div>
      <div className="mt-6">
        <Tabs
          active={tab}
          items={[
            { id: "people", label: "People & roles", count: people.length, href: `/admin/teams/${id}` },
            { id: "reports", label: "Reports", count: unanswered || undefined, href: `/admin/teams/${id}?tab=reports` },
            { id: "messages", label: "Messages with leads", href: `/admin/teams/${id}?tab=messages` },
            { id: "tasks", label: "Tasks", count: tasks.length, href: `/admin/teams/${id}?tab=tasks` },
            { id: "settings", label: "Settings", href: `/admin/teams/${id}?tab=settings` },
          ]}
        />
      </div>

      {tab === "people" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel>
            {people.length === 0 ? (
              <p className="text-paper-dim">No one on this team yet. Add people on the right, starting with the lead.</p>
            ) : (
              <ul className="divide-y divide-steel">
                {people.map((p) => {
                  const quiet = !p.last_active || daysSince(p.last_active) >= 10;
                  return (
                    <li key={p.user_id} className="flex flex-col gap-3 py-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <Link href={`/admin/members/${p.user_id}`} className="font-medium text-paper hover:text-gold-text">
                          {nameOf.get(p.user_id)}
                        </Link>
                        <span className="ml-2 text-sm text-paper-dim">{p.title || roleLabel[p.role]}</span>
                        <p className="text-xs text-paper-dim">
                          {p.services_14d ?? 0} services in 14 days · {p.steps ?? 0} steps · {p.lessons ?? 0} lessons · {p.open_tasks} open tasks
                          {quiet && <span className="ml-2 text-[#a3402b]">Gone quiet</span>}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={setTeamMember} className="flex flex-wrap items-center gap-1">
                          <input type="hidden" name="team_id" value={id} />
                          <input type="hidden" name="user_id" value={p.user_id} />
                          <select name="role" defaultValue={p.role} aria-label="Role" className="h-8 rounded-sm border border-steel bg-white px-1.5 text-sm">
                            <option value="lead">Team lead</option>
                            <option value="assistant">Assistant lead</option>
                            <option value="member">Member</option>
                          </select>
                          <input name="title" defaultValue={p.title ?? ""} placeholder="Role title (optional)" aria-label="Role title" className="h-8 w-40 rounded-sm border border-steel px-2 text-sm" />
                          <button className={smallButton}>Save</button>
                        </form>
                        <form action={removeTeamMember}>
                          <input type="hidden" name="team_id" value={id} />
                          <input type="hidden" name="user_id" value={p.user_id} />
                          <ConfirmButton message={`Remove ${nameOf.get(p.user_id)} from ${team.name}?`} className="text-sm text-[#8a2f1e] hover:underline">
                            Remove
                          </ConfirmButton>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <Panel className="lg:self-start">
            <h2 className="font-display text-xl text-paper">Add someone</h2>
            {available.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Every approved member is already on this team.</p>
            ) : (
              <form action={setTeamMember} className="mt-3 space-y-2">
                <input type="hidden" name="team_id" value={id} />
                <select name="user_id" required defaultValue="" className="h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm">
                  <option value="" disabled>
                    Choose a member
                  </option>
                  {available.map((m) => (
                    <option key={m.id} value={m.id}>
                      {displayName(m)}
                    </option>
                  ))}
                </select>
                <select name="role" defaultValue={people.some((p) => p.role === "lead") ? "member" : "lead"} className="h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm">
                  <option value="lead">Team lead</option>
                  <option value="assistant">Assistant lead</option>
                  <option value="member">Member</option>
                </select>
                <input name="title" placeholder="Role title, e.g. Prayer coordinator" className="h-10 w-full rounded-sm border border-steel px-2 text-sm" />
                <button className="w-full rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Add to {team.name}</button>
              </form>
            )}
          </Panel>
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-6 space-y-4">
          {reports.length === 0 && <Empty>No reports yet. The team lead sends one from their team page each week.</Empty>}
          {reports.map((r) => (
            <div key={r.id}>
              <ReportCard r={r} />
              <form action={replyToReport} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="team_id" value={id} />
                <textarea
                  name="reply"
                  rows={2}
                  defaultValue={r.pastor_reply ?? ""}
                  placeholder="Reply to the lead: encouragement, direction, what to pray…"
                  className="flex-1 rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
                />
                <button className="self-end rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">{r.pastor_reply ? "Update reply" : "Reply"}</button>
              </form>
            </div>
          ))}
        </div>
      )}

      {tab === "messages" && (
        <div className="mx-auto mt-6 max-w-3xl">
          <ol className="space-y-3">
            {messages.length === 0 && <li className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">No messages yet. Start the conversation with the leads.</li>}
            {messages.map((m) => (
              <li key={m.id} className={cn("flex", m.from_pastor ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-lg px-4 py-3", m.from_pastor ? "on-night bg-night text-starlight" : "border border-steel bg-white text-paper")}>
                  <p className={cn("text-xs", m.from_pastor ? "text-lamp" : "text-paper-dim")}>
                    {m.author_name ?? (m.from_pastor ? "Pastor" : "Lead")} · {lagosDateTime(m.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed">{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <form action={sendTeamMessage} className="mt-5 flex gap-2">
            <input type="hidden" name="team_id" value={id} />
            <input type="hidden" name="from" value="admin" />
            <textarea name="body" required rows={2} placeholder={`Write to the leads of ${team.name}…`} className="flex-1 rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold" />
            <button className="self-end rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Send</button>
          </form>
        </div>
      )}

      {tab === "tasks" && (
        <div className="mt-6">
          {tasks.length === 0 ? (
            <Empty>The team lead hasn&rsquo;t given any tasks yet.</Empty>
          ) : (
            <ul className="divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
              {tasks.map((t) => {
                const rows = assigns.filter((a) => a.task_id === t.id);
                const done = rows.filter((a) => a.status === "approved" || a.status === "done").length;
                return (
                  <li key={t.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="block font-medium text-paper">{t.title}</span>
                      <span className="text-sm text-paper-dim">{t.due_at ? `Due ${lagosDateTime(t.due_at)}` : "No due date"}</span>
                    </span>
                    <span className="flex items-center gap-3 text-sm text-paper-dim">
                      <span className="h-2 w-28 overflow-hidden rounded-full bg-dusk">
                        <span className="block h-full bg-[#3d9a6a]" style={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} />
                      </span>
                      {done}/{rows.length}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="mt-6 max-w-xl">
          <Panel>
            {query.saved && <p className="mb-3 text-sm text-[#24613a]">Saved.</p>}
            <form action={saveTeam} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <label className={fieldLabel}>
                Name
                <Input name="name" required defaultValue={team.name} className="mt-1 bg-white font-normal" />
              </label>
              <label className={fieldLabel}>
                What the team does
                <Input name="description" defaultValue={team.description ?? ""} className="mt-1 bg-white font-normal" />
              </label>
              <fieldset>
                <legend className={fieldLabel}>Colour</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {teamColors.map((c) => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={c === team.color} className="peer sr-only" />
                      <span className="block h-8 w-8 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-paper" style={{ backgroundColor: c }} />
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button type="submit">Save</Button>
            </form>
          </Panel>
          <form action={deleteTeam} className="mt-6">
            <input type="hidden" name="id" value={id} />
            <ConfirmButton message={`Delete ${team.name}, with its tasks, reports and messages?`} className="text-sm text-[#8a2f1e] hover:underline">
              Delete team
            </ConfirmButton>
          </form>
        </div>
      )}
    </div>
  );
}
