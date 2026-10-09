import Link from "next/link";
import { getMember, getMemberData } from "@/lib/member-data";
import { dueLabel, lagosDateTime, type Assignment, type Submission } from "@/lib/discipleship";
import { dueState, type Ladder } from "@/lib/accountability";
import { Countdown } from "@/components/members/countdown";

const statusPill: Record<string, { text: string; className: string }> = {
  todo: { text: "To do", className: "bg-gold/20 text-gold-text" },
  late: { text: "Late: you can still hand it in", className: "bg-[#f6e1dc] text-[#8a2f1e]" },
  missed: { text: "Missed: it's not too late", className: "bg-[#f6e1dc] text-[#8a2f1e]" },
  submitted: { text: "Handed in", className: "bg-[#e1e9f6] text-[#29457a]" },
  needs_work: { text: "Needs another look", className: "bg-[#f6e1dc] text-[#8a2f1e]" },
  reviewed: { text: "Reviewed", className: "bg-[#e3f1e6] text-[#24613a]" },
};

function Row({ a, s }: { a: Assignment; s?: Submission }) {
  const due = dueLabel(a.due_at);
  const state = dueState(a);
  const pill = statusPill[s?.status ?? (state === "open" ? "todo" : state)];
  return (
    <li>
      <Link
        href={`/me/assignments/${a.id}`}
        className="flex flex-col gap-2 rounded-md border border-steel bg-white p-5 transition-colors hover:border-gold sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="min-w-0">
          <span className="block font-display text-xl leading-snug text-paper">{a.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <span className={due?.late && !s ? "text-sm text-[#a3402b]" : "text-sm text-paper-dim"}>{due?.text ?? "No due date"}</span>
            {!s && a.due_at && state === "open" && <Countdown due={a.due_at} />}
            {s?.late && <span className="rounded-full bg-[#f6e1dc] px-2 py-0.5 text-xs text-[#8a2f1e]">Handed in late</span>}
          </span>
        </span>
        <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-medium ${pill.className}`}>{pill.text}</span>
      </Link>
    </li>
  );
}

export default async function AssignmentsPage() {
  const { supabase, user } = await getMember();
  const { assignments, submissions } = await getMemberData();
  const [{ data: ladderRows }, { data: planRows }] = await Promise.all([
    supabase.rpc("accountability_ladder"),
    supabase.from("restoration_plans").select("*").eq("member_id", user?.id ?? "").eq("status", "active").order("created_at", { ascending: false }).limit(1),
  ]);
  const me = ((ladderRows ?? []) as Ladder[])[0] ?? null;
  const plan = (planRows ?? [])[0] as { plan: string; due_on: string | null; created_at: string } | undefined;
  const by = new Map(submissions.map((s) => [s.assignment_id, s]));
  const open = assignments.filter((a) => !by.has(a.id) || by.get(a.id)?.status === "needs_work");
  const done = assignments.filter((a) => by.has(a.id) && by.get(a.id)?.status !== "needs_work");
  const faithful = (me?.on_time_streak ?? 0) >= 5;

  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Assignments</h1>
      <p className="mt-2 max-w-xl text-paper-dim">Work from the pastor. Read the instructions, hand it in, and you&rsquo;ll get feedback here.</p>

      {plan && (
        <section className="mt-8 rounded-md border border-[#c9b8e8] bg-[#f3eefb] p-5">
          <p className="text-sm font-medium text-[#5b3f8f]">🟣 Your restoration plan with the pastor</p>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-paper">{plan.plan}</p>
          <p className="mt-2 text-xs text-paper-dim">
            Agreed {lagosDateTime(plan.created_at).split(",").slice(0, 2).join(",")}
            {plan.due_on && ` · finish by ${new Date(plan.due_on).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`}
            {" · "}When you finish it, it&rsquo;s a fresh start.
          </p>
        </section>
      )}

      {me && me.all_done > 0 && (
        <section className="mt-8 flex flex-wrap items-center gap-5 rounded-md border border-steel bg-white p-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#3d9a6a ${(me.all_on_time / me.all_done) * 360}deg, #e6e2d8 0deg)` }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-medium text-paper">
              {Math.round((me.all_on_time / me.all_done) * 100)}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-paper">
              You&rsquo;ve handed in {me.all_on_time} of {me.all_done} on time{me.all_on_time === me.all_done ? " 🙏" : "."}
            </p>
            <p className="mt-1 text-sm text-paper-dim">
              {faithful
                ? `${me.on_time_streak} on time in a row. Faithful in little, faithful in much (Luke 16:10).`
                : me.missed > 0
                  ? "Every assignment is a step with God. You can still hand in the ones you missed."
                  : "On time earns 5 growth points, late earns 2. Keep going."}
            </p>
          </div>
          {faithful && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-ink">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" />
              </svg>
              Faithful
            </span>
          )}
        </section>
      )}

      {assignments.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">No assignments yet.</p>
      ) : (
        <>
          <h2 className="mt-10 font-display text-2xl text-paper">To do</h2>
          {open.length === 0 ? (
            <p className="mt-3 text-paper-dim">Nothing waiting. Well done.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {open.map((a) => (
                <Row key={a.id} a={a} s={by.get(a.id)} />
              ))}
            </ul>
          )}
          {done.length > 0 && (
            <>
              <h2 className="mt-12 font-display text-2xl text-paper">Handed in</h2>
              <ul className="mt-4 space-y-3">
                {done.map((a) => (
                  <Row key={a.id} a={a} s={by.get(a.id)} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
