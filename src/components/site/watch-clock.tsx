"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  STREAMS_URL,
  googleCalendarUrl,
  icsDataUrl,
  serviceOccurrences,
  type Occurrence,
} from "@/lib/schedule";

export type WatchEvent = Omit<Occurrence, "recurring">;

const TWO_HOURS = 1000 * 60 * 60 * 2;

function endOf(event: Occurrence) {
  return event.ends_at
    ? new Date(event.ends_at).getTime()
    : new Date(event.starts_at).getTime() + TWO_HOURS;
}

function lagosTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

function lagosDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

function localTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isLagosZone() {
  const offset = new Date().getTimezoneOffset();
  return offset === -60;
}

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [
    { value: Math.floor(total / 86400), label: "days" },
    { value: Math.floor((total % 86400) / 3600), label: "hours" },
    { value: Math.floor((total % 3600) / 60), label: "min" },
    { value: total % 60, label: "sec" },
  ];
}

function Digit({ value }: { value: number }) {
  const text = String(value).padStart(2, "0");
  return (
    <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function WatchClock({ events }: { events: WatchEvent[] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (now === null) {
    return (
      <div className="h-[23rem] w-full max-w-sm border border-night-3 bg-night-2/80" aria-hidden="true" />
    );
  }

  const all: Occurrence[] = [...events, ...serviceOccurrences(now, 3)].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at)
  );
  const live = all.find((e) => new Date(e.starts_at).getTime() <= now && now < endOf(e));
  const next = all.find((e) => new Date(e.starts_at).getTime() > now);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm border border-night-3 bg-night-2/80 p-6 shadow-[0_0_60px_-20px_rgba(240,180,76,0.35)] backdrop-blur-sm"
    >
      <p className="text-sm text-starlight-dim">It&rsquo;s {lagosTime(new Date(now))} in Lagos</p>

      {live ? (
        <>
          <p className="mt-5 flex items-center gap-2 text-lamp">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e55a3c] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e55a3c]" />
            </span>
            Live now
          </p>
          <p className="mt-2 font-display text-3xl text-starlight">{live.title}</p>
          <p className="mt-1 text-sm text-starlight-dim">
            Started at {lagosTime(new Date(live.starts_at))}, Lagos time
          </p>
          <a
            href={STREAMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 w-full items-center justify-center bg-gold px-6 text-[0.95rem] font-medium text-ink transition-colors hover:bg-gold-soft"
          >
            Join the live watch
          </a>
          {next && (
            <p className="mt-4 text-sm text-starlight-dim">
              After this: {next.title}, {lagosDate(next.starts_at)}
            </p>
          )}
        </>
      ) : next ? (
        <>
          <p className="mt-5 text-sm text-starlight-dim">Next gathering</p>
          <p className="mt-1 font-display text-3xl leading-snug text-starlight">{next.title}</p>
          <p className="mt-1 text-sm text-starlight-dim">
            {lagosDate(next.starts_at)}, Lagos time
            {!isLagosZone() && <> ({localTime(next.starts_at)} where you are)</>}
          </p>

          <p className="sr-only">Starts {lagosDate(next.starts_at)}, Lagos time.</p>
          <div className="mt-6 grid grid-cols-4 gap-2" aria-hidden="true">
            {splitDuration(new Date(next.starts_at).getTime() - now).map((part) => (
              <div key={part.label} className="border-t border-lamp/40 pt-2">
                <p className="text-3xl font-light tabular-nums text-starlight">
                  <Digit value={part.value} />
                </p>
                <p className="text-xs text-starlight-dim">{part.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a
              href={googleCalendarUrl(next, next.recurring)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lamp underline-offset-4 hover:underline"
            >
              Add to Google Calendar
            </a>
            <a
              href={icsDataUrl(next, next.recurring)}
              download="city-builders-gathering.ics"
              className="text-lamp underline-offset-4 hover:underline"
            >
              Apple / Outlook
            </a>
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
