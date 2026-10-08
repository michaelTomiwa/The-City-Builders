import type { SupabaseClient } from "@supabase/supabase-js";
import { activeMembers } from "@/lib/admin-discipleship";
import { weeklyReport } from "@/lib/report";
import { firstName, type Member } from "@/lib/discipleship";

/*
  Who a message to many people goes to. Each person gets it in their own
  private conversation, so replies come back to the pastor one by one.
*/

export type Audience = { id: string; label: string; hint: string; members: { id: string; first: string }[] };

function people(members: Member[]) {
  return members.map((m) => ({ id: m.id, first: firstName(m) }));
}

export async function messageAudiences(supabase: SupabaseClient): Promise<Audience[]> {
  const [{ members }, report, { data: teams }, { data: teamMembers }] = await Promise.all([
    activeMembers(supabase),
    weeklyReport(supabase),
    supabase.from("teams").select("id, name").order("name"),
    supabase.from("team_members").select("team_id, user_id"),
  ]);
  const byId = new Map(members.map((m) => [m.id, m]));
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const quietIds = new Set(report.quiet.map((q) => q.id));

  return [
    { id: "everyone", label: "Everyone", hint: "Every approved member", members: people(members) },
    { id: "quiet", label: "Gone quiet", hint: "No activity for two weeks", members: people(members.filter((m) => quietIds.has(m.id))) },
    { id: "new", label: "New this month", hint: "Joined in the last 30 days", members: people(members.filter((m) => m.created_at >= monthAgo)) },
    ...(teams ?? []).map((t) => ({
      id: `team:${t.id}`,
      label: t.name as string,
      hint: "Team",
      members: people(
        (teamMembers ?? [])
          .filter((tm) => tm.team_id === t.id)
          .map((tm) => byId.get(tm.user_id))
          .filter((m): m is Member => Boolean(m))
      ),
    })),
  ];
}
