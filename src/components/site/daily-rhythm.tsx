"use client";

import { useEffect, useState } from "react";
import {
  googleCalendarUrl,
  icsDataUrl,
  serviceOccurrences,
  services,
  type Service,
} from "@/lib/schedule";

function localLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function relative(ms: number) {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `in ${hours} h ${rest} min` : `in ${hours} h`;
}

function ServiceRow({ service, now }: { service: Service; now: number | null }) {
  const occurrences = now ? serviceOccurrences(now, 2).filter((o) => o.title === service.name) : [];
  const live = now
    ? occurrences.find((o) => new Date(o.starts_at).getTime() <= now && now < new Date(o.ends_at!).getTime())
    : undefined;
  const next = now ? occurrences.find((o) => new Date(o.starts_at).getTime() > now) : undefined;
  const sameZone = now !== null && new Date().getTimezoneOffset() === -60;
  const isNight = service.hour >= 19 || service.hour < 5;

  return (
    <li className="grid gap-6 border-b border-steel py-10 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-12">
      <div className="flex items-center gap-5">
        <span
          aria-hidden="true"
          className={
            isNight
              ? "relative h-14 w-14 shrink-0 rounded-full bg-night shadow-[inset_-10px_-6px_0_0_#f0b44c]"
              : "h-14 w-14 shrink-0 rounded-full bg-gradient-to-b from-lamp to-[#e07b3c] shadow-[0_0_40px_-6px_#f0b44c]"
          }
        />
        <p className="font-display text-[clamp(2.75rem,6vw,4.25rem)] leading-none text-paper tabular-nums">
          {service.label}
        </p>
      </div>

      <div>
        <h3 className="font-display text-3xl text-paper">{service.name}</h3>
        <p className="mt-2 max-w-md leading-relaxed text-paper-dim">{service.description}</p>
        <p className="mt-2 text-sm text-gold-text">
          Every day, Lagos time
          {next && !sameZone && <> ({localLabel(next.starts_at)} where you are)</>}
        </p>
      </div>

      <div className="flex flex-col gap-2 md:items-end">
        {live ? (
          <span className="inline-flex items-center gap-2 text-[#c2412a]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#e55a3c]" />
            On air now
          </span>
        ) : next ? (
          <span className="text-paper">Next one {relative(new Date(next.starts_at).getTime() - now!)}</span>
        ) : (
          <span className="text-paper-dim">&nbsp;</span>
        )}
        {next && (
          <span className="flex gap-4 text-sm">
            <a
              href={googleCalendarUrl(next, true)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-text underline-offset-4 hover:underline"
            >
              Google Calendar
            </a>
            <a
              href={icsDataUrl(next, true)}
              download={`${service.id}.ics`}
              className="text-gold-text underline-offset-4 hover:underline"
            >
              Apple / Outlook
            </a>
          </span>
        )}
      </div>
    </li>
  );
}

/** The two standing services, with the visitor's own local time and a daily calendar reminder. */
export function DailyRhythm() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <ul className="border-t border-steel">
      {services.map((s) => (
        <ServiceRow key={s.id} service={s} now={now} />
      ))}
    </ul>
  );
}
