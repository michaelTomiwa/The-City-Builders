import { cache } from "react";
import { getMember } from "@/lib/member-data";

/*
  Teams (Priesthood, Worship, Media…): the pastor assigns people to teams with
  a role; leads run their team (tasks, board, meetings, people) and report to
  the pastor.
*/

export type Team = { id: string; name: string; slug: string; description: string | null; color: string; created_at: string };
export type TeamRole = "lead" | "assistant" | "member";
export type TeamPerson = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: TeamRole;
  title: string | null;
  steps: number | null;
  lessons: number | null;
  services: number | null;
  bible_days: number | null;
  services_14d: number | null;
  last_active: string | null;
  open_tasks: number;
  overdue_tasks: number;
};
export type TeamTask = { id: string; team_id: string; title: string; details: string | null; due_at: string | null; created_at: string };
export type Assignment = {
  task_id: string;
  team_id: string;
  user_id: string;
  status: "todo" | "done" | "approved" | "redo";
  note: string | null;
  proof_url: string | null;
  feedback: string | null;
  done_at: string | null;
  reviewed_at: string | null;
};
export type TeamPost = { id: string; team_id: string; author_id: string | null; author_name: string | null; kind: "update" | "prayer"; body: string; created_at: string };
export type TeamReport = {
  id: string;
  team_id: string;
  author_name: string | null;
  week_of: string;
  health: number | null;
  god_doing: string | null;
  growth: string | null;
  wins: string | null;
  concerns: string | null;
  prayer: string | null;
  pastor_reply: string | null;
  replied_at: string | null;
  created_at: string;
};
export type TeamMessage = { id: string; team_id: string; author_name: string | null; from_pastor: boolean; body: string; created_at: string };
export type TeamMeeting = { id: string; team_id: string; held_on: string; title: string; notes: string | null; created_at: string };

export const roleLabel: Record<TeamRole, string> = { lead: "Team lead", assistant: "Assistant lead", member: "Member" };

export const teamColors = ["#f0b44c", "#7aa2e3", "#e07a5f", "#5fb38a", "#c792ea", "#e55a3c", "#3d9a6a", "#9fb4d8"];

export const healthLabels = ["", "Struggling", "Needs attention", "Steady", "Growing", "Thriving"];

export const taskStatus: Record<Assignment["status"], { label: string; className: string }> = {
  todo: { label: "To do", className: "bg-gold/20 text-gold-text" },
  done: { label: "Done, awaiting review", className: "bg-[#e1e9f6] text-[#29457a]" },
  approved: { label: "Approved", className: "bg-[#e3f1e6] text-[#24613a]" },
  redo: { label: "Needs another go", className: "bg-[#f6e1dc] text-[#8a2f1e]" },
};

export function teamSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "team";
}

/** The teams the signed-in member belongs to, with their role. */
export const getMyTeams = cache(async () => {
  const { supabase, user } = await getMember();
  if (!user) return [];
  const { data } = await supabase.from("team_members").select("role, title, teams(*)").eq("user_id", user.id);
  return ((data ?? []) as unknown as { role: TeamRole; title: string | null; teams: Team | null }[])
    .filter((r) => r.teams)
    .map((r) => ({ team: r.teams as Team, role: r.role, title: r.title }));
});

/** The member's open team tasks across all their teams. */
export const getMyTeamTasks = cache(async () => {
  const { supabase, user } = await getMember();
  if (!user) return [];
  const { data } = await supabase
    .from("task_assignments")
    .select("*, team_tasks(title, due_at, details), teams(name, slug, color)")
    .eq("user_id", user.id)
    .in("status", ["todo", "redo"]);
  return (data ?? []) as (Assignment & {
    team_tasks: { title: string; due_at: string | null; details: string | null } | null;
    teams: { name: string; slug: string; color: string } | null;
  })[];
});
