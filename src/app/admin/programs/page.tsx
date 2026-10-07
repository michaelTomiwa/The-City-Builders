import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill } from "@/components/admin/ui";
import { lagosToday, programPhase, type Program } from "@/lib/discipleship";

export default async function AdminPrograms() {
  const supabase = await createClient();
  const [{ data }, { data: steps }, { data: checkins }, { count: memberCount }] = await Promise.all([
    supabase.from("programs").select("*").order("start_date", { ascending: false }),
    supabase.from("program_steps").select("id, program_id"),
    supabase.from("step_checkins").select("program_id, user_id"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active").eq("role", "member"),
  ]);
  const programs = (data ?? []) as Program[];
  const today = lagosToday();

  return (
    <div>
      <AdminHeader
        title="Programmes"
        description="Seasons of prayer, fasting and study. Each programme gives members a step for every day, and you see who is keeping up."
        action={{ href: "/admin/programs/new", label: "New programme" }}
      />
      {programs.length === 0 ? (
        <div className="mt-8">
          <Empty>No programmes yet. Start one from a template: 3 days of prayer, a 7-day fast or 21 days in John.</Empty>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {programs.map((p) => {
            const stepCount = (steps ?? []).filter((s) => s.program_id === p.id).length;
            const people = new Set((checkins ?? []).filter((c) => c.program_id === p.id).map((c) => c.user_id)).size;
            const { phase, day, startsIn } = programPhase(p, today);
            return (
              <li key={p.id}>
                <Link href={`/admin/programs/${p.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-paper">{p.title}</span>
                      {p.status === "draft" && <Pill tone="grey">Draft</Pill>}
                      {p.status === "archived" && <Pill tone="grey">Archived</Pill>}
                      {p.status === "published" && phase === "active" && <Pill tone="green">Day {day} of {p.days}</Pill>}
                      {p.status === "published" && phase === "upcoming" && <Pill tone="blue">Starts in {startsIn}d</Pill>}
                      {p.status === "published" && phase === "finished" && <Pill tone="gold">Finished</Pill>}
                    </span>
                    <span className="mt-0.5 block text-sm text-paper-dim">
                      {p.days} days · {stepCount} steps · {p.audience === "everyone" ? "Everyone" : "Chosen people"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-paper-dim">
                    {people} of {p.audience === "everyone" ? (memberCount ?? 0) : "chosen"} taking part
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
