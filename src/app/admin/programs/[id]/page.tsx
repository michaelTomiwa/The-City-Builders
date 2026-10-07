import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Panel, Tabs } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ProgramForm } from "@/components/admin/program-form";
import { activeMembers } from "@/lib/admin-discipleship";
import { displayName, lagosDateTime, lagosToday, programPhase, type Checkin, type Program, type Step } from "@/lib/discipleship";
import { deleteProgram, saveProgram } from "../../discipleship/actions";

export default async function AdminProgram({ params, searchParams }: PageProps<"/admin/programs/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const tab = query.tab === "edit" ? "edit" : "progress";
  const supabase = await createClient();

  const [{ data: program }, { data: stepRows }, { data: memberRows }, { data: checkinRows }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", id).maybeSingle(),
    supabase.from("program_steps").select("*").eq("program_id", id).order("day").order("sort"),
    supabase.from("program_members").select("user_id").eq("program_id", id),
    supabase.from("step_checkins").select("*").eq("program_id", id).order("created_at", { ascending: false }),
  ]);
  if (!program) notFound();
  const p = program as Program;
  const steps = (stepRows ?? []) as Step[];
  const checkins = (checkinRows ?? []) as Checkin[];
  const selected = (memberRows ?? []).map((r) => r.user_id as string);
  const { members, picker } = await activeMembers(supabase);

  const today = lagosToday();
  const { phase, day } = programPhase(p, today);
  const dueSteps = steps.filter((s) => phase === "finished" || s.day <= day).length;
  const audience = p.audience === "everyone" ? members : members.filter((m) => selected.includes(m.id));
  const rows = audience
    .map((m) => {
      const mine = checkins.filter((c) => c.user_id === m.id);
      const last = mine.reduce<string | null>((acc, c) => (!acc || c.created_at > acc ? c.created_at : acc), null);
      return { m, done: mine.length, last };
    })
    .sort((a, b) => b.done - a.done);
  const onTrack = rows.filter((r) => dueSteps > 0 && r.done >= dueSteps).length;
  const behind = rows.filter((r) => r.done < dueSteps).length;
  const shared = checkins.filter((c) => c.shared && c.note);
  const nameOf = new Map(members.map((m) => [m.id, displayName(m)]));
  const stepOf = new Map(steps.map((s) => [s.id, s]));

  return (
    <div>
      <Link href="/admin/programs" className="text-sm text-paper-dim hover:text-gold-text">
        All programmes
      </Link>
      <div className="mt-3">
        <AdminHeader
          title={p.title}
          description={
            <>
              {p.status === "draft" ? "Draft · " : p.status === "archived" ? "Archived · " : ""}
              {phase === "active" ? `Day ${day} of ${p.days}` : phase === "upcoming" ? "Not started yet" : "Finished"} · {steps.length} steps ·{" "}
              {p.audience === "everyone" ? "Everyone" : `${selected.length} chosen people`}
            </>
          }
        />
      </div>
      {query.saved && (
        <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
          Saved. {p.status === "published" ? "Members can see it now." : "It's a draft, so only staff can see it."}
        </p>
      )}
      <div className="mt-6">
        <Tabs
          active={tab}
          items={[
            { id: "progress", label: "Progress", href: `/admin/programs/${id}` },
            { id: "edit", label: "Edit", href: `/admin/programs/${id}?tab=edit` },
          ]}
        />
      </div>

      {tab === "edit" ? (
        <div className="mt-6">
          <ProgramForm program={p} steps={steps} members={picker} selected={selected} defaultStart={p.start_date} action={saveProgram} />
          <form action={deleteProgram} className="mt-10 border-t border-steel pt-6">
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton message="Delete this programme and everyone's progress in it? This can't be undone." className="text-sm text-[#8a2f1e] hover:underline">
              Delete programme
            </ConfirmButton>
          </form>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Taking part", value: rows.filter((r) => r.done > 0).length },
              { label: "On track", value: onTrack },
              { label: "Behind", value: behind },
              { label: "Steps kept", value: checkins.length },
            ].map((s) => (
              <Panel key={s.label}>
                <p className="text-sm text-paper-dim">{s.label}</p>
                <p className="mt-1 font-display text-4xl text-paper">{s.value}</p>
              </Panel>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Panel>
              <h2 className="font-display text-2xl text-paper">Everyone&rsquo;s progress</h2>
              <p className="mt-1 text-sm text-paper-dim">{dueSteps} steps should be done by today.</p>
              {rows.length === 0 ? (
                <p className="mt-6 text-paper-dim">No approved members yet.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {rows.map(({ m, done, last }) => {
                    const pct = steps.length ? done / steps.length : 0;
                    const late = done < dueSteps;
                    return (
                      <li key={m.id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                        <span className="truncate text-paper">{displayName(m)}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-dusk">
                          <span className={late ? "block h-full rounded-full bg-[#e0a24c]" : "block h-full rounded-full bg-[#3d9a6a]"} style={{ width: `${Math.max(2, pct * 100)}%` }} />
                        </span>
                        <span className="w-28 text-right text-xs text-paper-dim">
                          {done}/{steps.length}
                          {last ? ` · ${lagosDateTime(last).split(",").slice(0, 2).join(",")}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel>
              <h2 className="font-display text-2xl text-paper">Shared notes</h2>
              <p className="mt-1 text-sm text-paper-dim">What members chose to share with you.</p>
              {shared.length === 0 ? (
                <p className="mt-6 text-sm text-paper-dim">Nothing shared yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {shared.slice(0, 20).map((c) => (
                    <li key={c.id} className="border-l-2 border-gold pl-3">
                      <p className="text-sm leading-relaxed text-paper">{c.note}</p>
                      <p className="mt-1 text-xs text-paper-dim">
                        {nameOf.get(c.user_id) ?? "Member"} · Day {stepOf.get(c.step_id)?.day} · {lagosDateTime(c.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
