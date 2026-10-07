import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getMemberData } from "@/lib/member-data";
import { dateOfDay, lagosToday, programPhase, type Checkin } from "@/lib/discipleship";
import { StepCard } from "@/components/members/step-card";
import { ProgressRing } from "@/components/members/progress-ring";
import { cn } from "@/lib/utils";

const prose =
  "text-[1.02rem] leading-[1.8] text-paper-dim [&_a]:text-gold-text [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-4 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:text-paper [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-paper [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-paper [&_img]:my-4 [&_img]:rounded-sm [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:text-paper [&_ul]:list-disc [&_ul]:pl-6 [&>*:first-child]:mt-0";

export default async function ProgramPage({ params }: PageProps<"/me/programs/[id]">) {
  const { id } = await params;
  const { programs, steps, checkins, assignments } = await getMemberData();
  const program = programs.find((p) => p.id === id);
  if (!program) notFound();

  const today = lagosToday();
  const { phase, day: currentDay, startsIn } = programPhase(program, today);
  const own = steps.filter((s) => s.program_id === program.id);
  const doneBy = new Map<string, Checkin>(checkins.map((c) => [c.step_id, c]));
  const done = own.filter((s) => doneBy.has(s.id)).length;
  const linked = assignments.filter((a) => a.program_id === program.id);
  const dayNumbers = Array.from({ length: program.days }, (_, i) => i + 1);

  return (
    <div>
      <Link href="/me/programs" className="text-sm text-paper-dim hover:text-gold-text">
        All programmes
      </Link>

      <div className="on-night relative mt-4 overflow-hidden rounded-md bg-night p-6 text-starlight sm:p-8">
        {program.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={program.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-lamp">
              {phase === "active" && `Day ${currentDay} of ${program.days}`}
              {phase === "upcoming" && `Starts in ${startsIn} ${startsIn === 1 ? "day" : "days"}`}
              {phase === "finished" && "Finished"}
            </p>
            <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">{program.title}</h1>
            {program.objective && (
              <p className="mt-3 text-lg leading-relaxed text-starlight-dim">
                <span className="text-starlight">Objective: </span>
                {program.objective}
              </p>
            )}
          </div>
          <ProgressRing value={own.length ? done / own.length : 0} size={96} stroke={7} label={`${done}/${own.length}`} track="rgba(169,177,201,0.25)" />
        </div>
        {/* day strip */}
        <ol className="relative mt-6 flex gap-1.5 overflow-x-auto pb-1" aria-label="Days">
          {dayNumbers.map((d) => {
            const daySteps = own.filter((s) => s.day === d);
            const complete = daySteps.length > 0 && daySteps.every((s) => doneBy.has(s.id));
            return (
              <li key={d}>
                <a
                  href={`#day-${d}`}
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm",
                    complete ? "bg-[#3d9a6a] text-white" : d === currentDay && phase === "active" ? "bg-lamp text-ink" : d < currentDay ? "bg-night-3 text-starlight" : "border border-night-3 text-starlight-dim"
                  )}
                  title={dateOfDay(program, d)}
                >
                  {d}
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          {dayNumbers.map((d) => {
            const daySteps = own.filter((s) => s.day === d);
            const locked = phase === "upcoming" || d > currentDay;
            return (
              <section key={d} id={`day-${d}`} className="scroll-mt-24">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-2xl text-paper">Day {d}</h2>
                  <span className="text-sm text-paper-dim">{dateOfDay(program, d)}</span>
                  {d === currentDay && phase === "active" && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold-text">Today</span>}
                </div>
                {daySteps.length === 0 ? (
                  <p className="mt-3 text-sm text-paper-dim">A day of rest. Keep the watch in your heart.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {daySteps.map((s) => (
                      <StepCard key={s.id} step={s} done={doneBy.get(s.id) ?? null} locked={locked} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {program.teaching && (
            <section className="rounded-md border border-steel bg-white p-5">
              <h2 className="text-sm font-medium text-gold-text">From the pastor</h2>
              <div className={cn("mt-3", prose)}>
                <ReactMarkdown>{program.teaching}</ReactMarkdown>
              </div>
            </section>
          )}
          {linked.length > 0 && (
            <section className="rounded-md border border-steel bg-white p-5">
              <h2 className="text-sm font-medium text-gold-text">Assignments for this programme</h2>
              <ul className="mt-3 space-y-2">
                {linked.map((a) => (
                  <li key={a.id}>
                    <Link href={`/me/assignments/${a.id}`} className="text-paper hover:text-gold-text">
                      {a.title}
                    </Link>
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
