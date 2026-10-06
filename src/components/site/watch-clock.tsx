"use client";

import { useEffect, useState } from "react";

const STREAMS_URL = "https://www.youtube.com/@thecitybuilderscity/streams";
const CHANNEL_URL = "https://www.youtube.com/@thecitybuilderscity?sub_confirmation=1";
const TWO_HOURS = 1000 * 60 * 60 * 2;

export type WatchEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
};

function endOf(event: WatchEvent) {
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

function calendarStamp(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function googleCalendarUrl(event: WatchEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.title} — The City Builders`,
    dates: `${calendarStamp(new Date(event.starts_at).getTime())}/${calendarStamp(endOf(event))}`,
    details: `${event.description ?? ""}\n\nWatch live: ${STREAMS_URL}`.trim(),
    location: event.location ?? STREAMS_URL,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function icsUrl(event: WatchEvent) {
  const escape = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The City Builders//Watch//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@thecitybuilders`,
    `DTSTAMP:${calendarStamp(Date.now())}`,
    `DTSTART:${calendarStamp(new Date(event.starts_at).getTime())}`,
    `DTEND:${calendarStamp(endOf(event))}`,
    `SUMMARY:${escape(`${event.title} — The City Builders`)}`,
    `DESCRIPTION:${escape(`Watch live: ${STREAMS_URL}`)}`,
    `LOCATION:${escape(event.location ?? STREAMS_URL)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
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

  const reference = now ?? 0;
  const live = now
    ? events.find((e) => new Date(e.starts_at).getTime() <= now && now < endOf(e))
    : undefined;
  const next = events.find((e) => new Date(e.starts_at).getTime() > reference);

  return (
    <div className="w-full max-w-sm border border-night-3 bg-night-2/80 p-6 backdrop-blur-sm">
      <p className="text-sm text-starlight-dim">
        {now ? `It's ${lagosTime(new Date(now))} in Lagos` : "Lagos time"}
      </p>

      {live ? (
        <>
          <p className="mt-5 flex items-center gap-2 text-lamp">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e55a3c] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e55a3c]" />
            </span>
            Live now
          </p>
          <p className="mt-2 font-display text-2xl text-starlight">{live.title}</p>
          <a
            href={STREAMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 w-full items-center justify-center bg-lamp px-6 text-[0.95rem] font-medium text-ink transition-colors hover:bg-gold-soft"
          >
            Join the live watch
          </a>
        </>
      ) : next ? (
        <>
          <p className="mt-5 text-sm text-starlight-dim">Next gathering</p>
          <p className="mt-1 font-display text-2xl leading-snug text-starlight">{next.title}</p>
          <p className="mt-1 text-sm text-starlight-dim">{lagosDate(next.starts_at)}, Lagos time</p>

          <div className="mt-6 grid grid-cols-4 gap-2" aria-hidden="true">
            {splitDuration(now ? new Date(next.starts_at).getTime() - now : 0).map((part) => (
              <div key={part.label} className="border-t border-night-3 pt-2">
                <p className="text-3xl font-light tabular-nums text-starlight">
                  {now ? String(part.value).padStart(2, "0") : "--"}
                </p>
                <p className="text-xs text-starlight-dim">{part.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a
              href={googleCalendarUrl(next)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lamp underline-offset-4 hover:underline"
            >
              Add to Google Calendar
            </a>
            <a
              href={icsUrl(next)}
              download="city-builders-gathering.ics"
              className="text-lamp underline-offset-4 hover:underline"
            >
              Download for Apple / Outlook
            </a>
          </div>
        </>
      ) : (
        <>
          <p className="mt-5 font-display text-2xl leading-snug text-starlight">
            The next watch hasn&rsquo;t been scheduled yet.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-starlight-dim">
            New gatherings are announced on our YouTube channel first. Subscribe
            and turn on notifications to hear when we go live.
          </p>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 w-full items-center justify-center border border-lamp px-6 text-[0.95rem] font-medium text-lamp transition-colors hover:bg-lamp hover:text-ink"
          >
            Subscribe on YouTube
          </a>
        </>
      )}
    </div>
  );
}
