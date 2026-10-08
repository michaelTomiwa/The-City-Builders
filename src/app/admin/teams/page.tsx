import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, fieldLabel } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { daysSince, displayName, type Member } from "@/lib/discipleship";
import { healthLabels, teamColors, type Team, type TeamReport } from "@/lib/teams";
import { saveTeam } from "../discipleship/actions";

export default async function AdminTeams() {
  const supabase = await createClient();
  const [{ data: teamRows }, { data: roster }, { data: people }, { data: assigns }, { data: reports }, { data: messages }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("team_members").select("team_id, user_id, role"),
    supabase.from("profiles").select("id, full_name, email"),
    supabase.from("task_assignments").select("team_id, status"),
    supabase.from("team_reports").select("id, team_id, health, created_at, pastor_reply").order("created_at", { ascending: false }),
    supabase.from("team_messages").select("team_id, from_pastor, created_at").order("created_at", { ascending: false }),
  ]);
  const teams = (teamRows ?? []) as Team[];
  const name = new Map(((people ?? []) as Pick<Member, "id" | "full_name" | "email">[]).map((p) => [p.id, displayName(p)]));

  return (
    <div>
      <AdminHeader
        title="Teams"
        description="Priesthood, Worship, Media and every team that serves. Place people in teams, see how each team is doing, and talk with the leads."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {teams.length === 0 ? (
            <Empty>No teams yet. Create the first one, e.g. the Priesthood team.</Empty>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {teams.map((t) => {
                const members = (roster ?? []).filter((r) => r.team_id === t.id);
                const leads = members.filter((m) => m.role !== "member").map((m) => name.get(m.user_id)).filter(Boolean);
                const a = (assigns ?? []).filter((x) => x.team_id === t.id);
                const done = a.filter((x) => x.status === "approved" || x.status === "done").length;
                const last = ((reports ?? []) as TeamReport[]).find((r) => r.team_id === t.id);
                const unanswered = ((reports ?? []) as TeamReport[]).filter((r) => r.team_id === t.id && !r.pastor_reply).length;
                const lastMsg = (messages ?? []).find((m) => m.team_id === t.id);
                const waiting = lastMsg && !lastMsg.from_pastor;
                const late = !last || daysSince(last.created_at) > 8;
                return (
                  <li key={t.id}>
                    <Link href={`/admin/teams/${t.id}`} className="group flex h-full overflow-hidden rounded-md border border-steel bg-white transition-colors hover:border-gold">
                      <span className="w-1.5 shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="flex-1 p-5">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-display text-2xl text-paper group-hover:text-gold-text">{t.name}</span>
                          {last?.health && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold-text">{healthLabels[last.health]}</span>}
                        </span>
                        <span className="mt-1 block text-sm text-paper-dim">
                          {members.length} {members.length === 1 ? "person" : "people"}
                          {leads.length ? ` · led by ${leads.join(", ")}` : " · no lead yet"}
                        </span>
                        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-dusk">
                          <span className="block h-full rounded-full bg-[#3d9a6a]" style={{ width: `${a.length ? (done / a.length) * 100 : 0}%` }} />
                        </span>
                        <span className="mt-1 block text-xs text-paper-dim">{a.length ? `${done}/${a.length} tasks done` : "No tasks yet"}</span>
                        <span className="mt-3 flex flex-wrap gap-2 text-xs">
                          {late && <span className="rounded-full bg-[#f6e1dc] px-2 py-0.5 text-[#8a2f1e]">{last ? "Report is late" : "No report yet"}</span>}
                          {unanswered > 0 && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-gold-text">{unanswered} report{unanswered === 1 ? "" : "s"} to answer</span>}
                          {waiting && <span className="rounded-full bg-[#e1e9f6] px-2 py-0.5 text-[#29457a]">New message</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Panel className="lg:self-start">
          <h2 className="font-display text-2xl text-paper">New team</h2>
          <form action={saveTeam} className="mt-4 space-y-3">
            <label className={fieldLabel}>
              Name
              <Input name="name" required placeholder="Priesthood team" className="mt-1 bg-white font-normal" />
            </label>
            <label className={fieldLabel}>
              What the team does
              <Input name="description" placeholder="Leads prayer before and during every service" className="mt-1 bg-white font-normal" />
            </label>
            <fieldset>
              <legend className={fieldLabel}>Colour</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {teamColors.map((c, i) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" name="color" value={c} defaultChecked={i === 0} className="peer sr-only" />
                    <span className="block h-8 w-8 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-paper" style={{ backgroundColor: c }} />
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit" className="w-full">
              Create team
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
