"use client";

import { useEffect, useState } from "react";

function parts(target: number, now: number) {
  const ms = Math.max(0, target - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

/** Days, hours, minutes and seconds to the wedding; "Married" after it. */
export function Countdown({ target, doneText }: { target: string; doneText: string }) {
  const when = Date.parse(target);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (now === null) return <div className="h-[4.5rem]" aria-hidden="true" />;
  const p = parts(when, now);
  if (p.done) return <p className="font-wed-display text-3xl italic text-[var(--wed-gold)] sm:text-4xl">{doneText}</p>;

  const units: [number, string][] = [
    [p.days, p.days === 1 ? "day" : "days"],
    [p.hours, p.hours === 1 ? "hour" : "hours"],
    [p.minutes, "min"],
    [p.seconds, "sec"],
  ];
  return (
    <div className="flex items-end gap-5 sm:gap-8" role="timer" aria-label={`${p.days} days, ${p.hours} hours and ${p.minutes} minutes to go`}>
      {units.map(([n, label]) => (
        <div key={label} className="flex flex-col">
          <span className="font-wed-display text-4xl tabular-nums leading-none text-[var(--wed-lace)] sm:text-5xl">{String(n).padStart(label.startsWith("day") ? 1 : 2, "0")}</span>
          <span className="mt-1.5 text-sm text-[var(--wed-mist)]">{label}</span>
        </div>
      ))}
    </div>
  );
}
