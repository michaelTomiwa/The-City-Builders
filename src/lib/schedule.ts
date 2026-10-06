/*
  The standing rhythm of the house, in Lagos time (WAT, UTC+1 all year).
  Events from the admin are added on top of these.
*/

export const CHURCH_EMAIL = "response.citybuilders@gmail.com";
export const STREAMS_URL = "https://www.youtube.com/@thecitybuilderscity/streams";
export const CHANNEL_URL = "https://www.youtube.com/@thecitybuilderscity";

const WAT_OFFSET_HOURS = 1;

export type Service = {
  id: string;
  name: string;
  hour: number; // Lagos time, 24h
  minute: number;
  durationMinutes: number;
  label: string;
  description: string;
};

export const services: Service[] = [
  {
    id: "night-watch",
    name: "Night Watch",
    hour: 23,
    minute: 0,
    durationMinutes: 120,
    label: "11:00 PM",
    description:
      "We stand watch in prayer and the prophetic word, contending for the season ahead together.",
  },
  {
    id: "morning-prayers",
    name: "Morning Prayers",
    hour: 7,
    minute: 0,
    durationMinutes: 60,
    label: "7:00 AM",
    description: "Begin the day anchored in prayer, before the world asks anything of you.",
  },
];

export type Occurrence = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  recurring?: boolean;
};

/** The next `days` days of each service, starting from yesterday so a watch that began before midnight still counts. */
export function serviceOccurrences(now: number, days = 3): Occurrence[] {
  const lagosNow = new Date(now + WAT_OFFSET_HOURS * 3600_000);
  const out: Occurrence[] = [];

  for (let d = -1; d < days; d++) {
    for (const s of services) {
      const start = Date.UTC(
        lagosNow.getUTCFullYear(),
        lagosNow.getUTCMonth(),
        lagosNow.getUTCDate() + d,
        s.hour - WAT_OFFSET_HOURS,
        s.minute
      );
      out.push({
        id: `${s.id}-${start}`,
        title: s.name,
        starts_at: new Date(start).toISOString(),
        ends_at: new Date(start + s.durationMinutes * 60_000).toISOString(),
        location: "Online, YouTube Live",
        description: s.description,
        recurring: true,
      });
    }
  }

  return out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function liveService(now: number) {
  return serviceOccurrences(now, 1).find(
    (o) => new Date(o.starts_at).getTime() <= now && now < new Date(o.ends_at!).getTime()
  );
}

/** A Lagos wall-clock time for this service, expressed as a Date on today's date. */
export function serviceStartToday(service: Service, now: number) {
  const lagosNow = new Date(now + WAT_OFFSET_HOURS * 3600_000);
  return new Date(
    Date.UTC(
      lagosNow.getUTCFullYear(),
      lagosNow.getUTCMonth(),
      lagosNow.getUTCDate(),
      service.hour - WAT_OFFSET_HOURS,
      service.minute
    )
  );
}

function calendarStamp(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(s: string) {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function icsDataUrl(o: Occurrence, repeatDaily = false) {
  const start = new Date(o.starts_at).getTime();
  const end = o.ends_at ? new Date(o.ends_at).getTime() : start + 2 * 3600_000;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The City Builders//Watch//EN",
    "BEGIN:VEVENT",
    `UID:${o.id}@thecitybuilders`,
    `DTSTAMP:${calendarStamp(start)}`,
    `DTSTART:${calendarStamp(start)}`,
    `DTEND:${calendarStamp(end)}`,
    ...(repeatDaily ? ["RRULE:FREQ=DAILY"] : []),
    `SUMMARY:${escapeIcs(`${o.title} — The City Builders`)}`,
    `DESCRIPTION:${escapeIcs(`Watch live: ${STREAMS_URL}`)}`,
    `LOCATION:${escapeIcs(o.location ?? STREAMS_URL)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export function googleCalendarUrl(o: Occurrence, repeatDaily = false) {
  const start = new Date(o.starts_at).getTime();
  const end = o.ends_at ? new Date(o.ends_at).getTime() : start + 2 * 3600_000;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${o.title} — The City Builders`,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    details: `${o.description ?? ""}\n\nWatch live: ${STREAMS_URL}`.trim(),
    location: o.location ?? STREAMS_URL,
  });
  if (repeatDaily) params.set("recur", "RRULE:FREQ=DAILY");
  return `https://calendar.google.com/calendar/render?${params}`;
}
