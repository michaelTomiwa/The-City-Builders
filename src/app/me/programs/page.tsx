import Link from "next/link";
import { getMemberData } from "@/lib/member-data";
import { lagosToday, programPhase } from "@/lib/discipleship";
import { ProgressRing } from "@/components/members/progress-ring";

const phaseLabel = { active: "Now", upcoming: "Coming up", finished: "Finished" };

export default async function ProgramsPage() {
  const { programs, steps, checkins } = await getMemberData();
  const today = lagosToday();
  const done = new Set(checkins.map((c) => c.step_id));
  const rows = programs.map((p) => {
    const own = steps.filter((s) => s.program_id === p.id);
    return { p, ...programPhase(p, today), total: own.length, done: own.filter((s) => done.has(s.id)).length };
  });
  const order = { active: 0, upcoming: 1, finished: 2 };
  rows.sort((a, b) => order[a.phase] - order[b.phase]);

  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Programmes</h1>
      <p className="mt-2 max-w-xl text-paper-dim">Seasons of prayer, fasting and study from Pastor Michael. Each one has a step for every day.</p>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">
          No programmes yet. When the pastor starts one, it appears here.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {rows.map(({ p, phase, day, startsIn, total, done }) => (
            <li key={p.id}>
              <Link href={`/me/programs/${p.id}`} className="group block overflow-hidden rounded-md border border-steel bg-white transition-colors hover:border-gold">
                <div className="on-night relative flex h-28 items-end bg-[linear-gradient(160deg,#101c3a_0%,#1d2f63_60%,#3a3466_100%)] p-4 text-starlight">
                  {p.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
                  )}
                  <span className="relative rounded-full bg-night/70 px-2.5 py-0.5 text-xs text-lamp">{phaseLabel[phase]}</span>
                </div>
                <div className="flex items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-snug text-paper group-hover:text-gold-text">{p.title}</p>
                    {p.objective && <p className="mt-1 line-clamp-2 text-sm text-paper-dim">{p.objective}</p>}
                    <p className="mt-2 text-xs text-paper-dim">
                      {phase === "active" && `Day ${day} of ${p.days}`}
                      {phase === "upcoming" && `Starts in ${startsIn} ${startsIn === 1 ? "day" : "days"} · ${p.days} days`}
                      {phase === "finished" && `${p.days} days · ${done} of ${total} steps kept`}
                    </p>
                  </div>
                  <ProgressRing value={total ? done / total : 0} size={60} stroke={5} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
