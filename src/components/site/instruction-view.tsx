import Link from "next/link";
import { cn } from "@/lib/utils";
import { weekLabel } from "@/lib/week";
import { dayNames, dayShort, fastDaysLabel, passageLink, todayFrom, type Instruction } from "@/lib/instruction";

/** The week's instruction: fasting, prayer and study, with today picked out. */
export function InstructionView({ ins, day, showWeek = true, narrow = false }: { ins: Instruction; day: number; showWeek?: boolean; narrow?: boolean }) {
  const today = todayFrom(ins, day);
  const hasFast = ins.fast_days.length > 0;
  const readings = ins.readings.map((r, i) => ({ day: i + 1, passage: r.trim() })).filter((r) => r.passage);

  return (
    <div className="space-y-6">
      <section className="on-night rounded-md bg-night p-6 text-starlight sm:p-8">
        {showWeek && <p className="text-sm text-lamp">Week of {weekLabel(ins.week_start)}</p>}
        <h2 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{ins.theme}</h2>
        {ins.word && <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-starlight-dim">{ins.word}</p>}

        <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-lamp">Today, {dayNames[day - 1]}</p>
          <ul className={cn("mt-2 grid gap-2 text-sm", !narrow && "sm:grid-cols-3")}>
            <li className="flex gap-2">
              <span aria-hidden="true">{today.fasting ? "🍽️" : "☀️"}</span>
              <span>{today.fasting ? `Fast day${ins.fast_plan ? `: ${ins.fast_plan}` : ""}` : hasFast ? "No fast today" : "No fast this week"}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">📖</span>
              {today.reading ? (
                <a href={passageLink(today.reading)} target="_blank" rel="noopener noreferrer" className="underline decoration-lamp/50 underline-offset-2 hover:text-lamp">
                  Read {today.reading}
                </a>
              ) : (
                <span>{ins.memory_verse ? "Go over the memory verse" : "Catch up on the week's reading"}</span>
              )}
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🙏</span>
              <span>{ins.prayer_points.length ? `Pray the ${ins.prayer_points.length} prayer points` : (ins.prayer_plan ?? "Keep the watch in prayer")}</span>
            </li>
          </ul>
        </div>
      </section>

      <div className={cn("grid gap-6", narrow ? "md:grid-cols-2" : "lg:grid-cols-3")}>
        <section className="rounded-md border border-steel bg-white p-5">
          <h3 className="font-display text-2xl text-paper">Fasting</h3>
          {hasFast ? (
            <>
              <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Fast days">
                {dayShort.map((d, i) => {
                  const fast = ins.fast_days.includes(i + 1);
                  return (
                    <li
                      key={d}
                      className={cn(
                        "flex flex-col items-center rounded-sm py-2 text-xs",
                        fast ? "bg-gold text-ink" : "bg-dusk text-paper-dim",
                        i + 1 === day && "ring-2 ring-night ring-offset-1"
                      )}
                    >
                      <span className="font-medium">{d}</span>
                      <span aria-label={fast ? "fast" : "no fast"}>{fast ? "●" : "·"}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-paper">Fast on {fastDaysLabel(ins.fast_days)}.</p>
              {ins.fast_plan && <p className="mt-1 text-sm leading-relaxed text-paper-dim">{ins.fast_plan}</p>}
            </>
          ) : (
            <p className="mt-3 text-sm text-paper-dim">No fast set for this week.</p>
          )}
        </section>

        <section className="rounded-md border border-steel bg-white p-5">
          <h3 className="font-display text-2xl text-paper">Prayer</h3>
          {ins.prayer_plan && <p className="mt-2 text-sm leading-relaxed text-paper-dim">{ins.prayer_plan}</p>}
          {ins.prayer_points.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {ins.prayer_points.map((p, i) => (
                <li key={i} className="flex gap-3 text-paper">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-night text-xs text-starlight">{i + 1}</span>
                  <span className="leading-snug">{p}</span>
                </li>
              ))}
            </ol>
          ) : (
            !ins.prayer_plan && <p className="mt-3 text-sm text-paper-dim">No prayer points this week.</p>
          )}
        </section>

        <section className={cn("rounded-md border border-steel bg-white p-5", narrow && "md:col-span-2")}>
          <h3 className="font-display text-2xl text-paper">Study</h3>
          {readings.length > 0 && (
            <ul className="mt-4 divide-y divide-steel text-sm">
              {readings.map((r) => (
                <li key={r.day} className={cn("flex items-center justify-between gap-3 py-2", r.day === day && "font-medium")}>
                  <span className={r.day === day ? "text-gold-text" : "text-paper-dim"}>{r.day === day ? "Today" : dayShort[r.day - 1]}</span>
                  <a href={passageLink(r.passage)} target="_blank" rel="noopener noreferrer" className="text-right text-paper hover:text-gold-text">
                    {r.passage}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {ins.memory_verse && (
            <blockquote className="mt-4 border-l-2 border-gold pl-3">
              <p className="text-xs font-medium text-gold-text">Memory verse</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-paper">{ins.memory_verse}</p>
            </blockquote>
          )}
          {ins.question && (
            <div className="mt-4 rounded-sm bg-dusk p-3">
              <p className="text-xs font-medium text-paper-dim">Think about it</p>
              <p className="mt-1 text-sm text-paper">{ins.question}</p>
            </div>
          )}
          {!readings.length && !ins.memory_verse && !ins.question && <p className="mt-3 text-sm text-paper-dim">No study set this week.</p>}
        </section>
      </div>
    </div>
  );
}

/** A short card for the member dashboard: the theme and what today asks. */
export function InstructionToday({ ins, day }: { ins: Instruction; day: number }) {
  const today = todayFrom(ins, day);
  return (
    <section className="on-night rounded-md bg-night p-5 text-starlight">
      <p className="text-sm text-lamp">This week&apos;s instruction</p>
      <h2 className="mt-1 font-display text-2xl leading-tight">{ins.theme}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex gap-2">
          <span aria-hidden="true">{today.fasting ? "🍽️" : "☀️"}</span>
          <span>{today.fasting ? `Fast today${ins.fast_plan ? `: ${ins.fast_plan}` : ""}` : ins.fast_days.length ? `Fast on ${fastDaysLabel(ins.fast_days)}` : "No fast this week"}</span>
        </li>
        {today.reading && (
          <li className="flex gap-2">
            <span aria-hidden="true">📖</span>
            <a href={passageLink(today.reading)} target="_blank" rel="noopener noreferrer" className="underline decoration-lamp/50 underline-offset-2 hover:text-lamp">
              Read {today.reading}
            </a>
          </li>
        )}
        {ins.prayer_points.length > 0 && (
          <li className="flex gap-2">
            <span aria-hidden="true">🙏</span>
            <span>{ins.prayer_points.length} prayer points</span>
          </li>
        )}
      </ul>
      <Link href="/week" className="mt-4 inline-block text-sm text-lamp hover:underline">
        Read the full instruction →
      </Link>
    </section>
  );
}
