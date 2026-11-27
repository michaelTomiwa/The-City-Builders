/*
  Weddings hosted on the church site, e.g. /wedding/olalekan-and-christiana.
  Everything a couple's page shows lives here: edit this file to change the
  date, venues, story, colours or gift details.

  Times are Lagos time. Lines marked "PLACEHOLDER" are waiting on the couple.
*/

export type WeddingEvent = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM, Lagos time
  end: string;
  venue: string;
  address: string;
  note?: string;
};

export type Wedding = {
  slug: string;
  groom: string;
  bride: string;
  groomFull: string;
  brideFull: string;
  family: string; // "The Daramolas"
  monogram: string; // on the seal that opens the page
  hashtag: string;
  city: string;
  verse: { text: string; ref: string };
  welcome: string;
  rsvpBy: string; // YYYY-MM-DD
  mainEvent: string; // id of the event the countdown counts to
  events: WeddingEvent[];
  story: { when: string; title: string; text: string }[];
  colours: { name: string; hex: string }[];
  dressNote: string;
  gifts: { note: string; bank: string; accountName: string; accountNumber: string };
  contact: { name: string; phone: string }[];
};

const weddings: Record<string, Wedding> = {
  "olalekan-and-christiana": {
    slug: "olalekan-and-christiana",
    groom: "Olalekan",
    bride: "Christiana",
    groomFull: "Daramola Olalekan",
    brideFull: "Ayomide Christiana",
    family: "The Daramolas",
    monogram: "O&C",
    hashtag: "#TheDaramolas26",
    city: "Lagos",
    verse: { text: "A threefold cord is not quickly broken.", ref: "Ecclesiastes 4:12" },
    welcome:
      "Two lives, one cord, and God in the middle of it. Together with our families, we would love you to witness the day we become one, and to celebrate with us after.",
    rsvpBy: "2026-12-05", // PLACEHOLDER
    mainEvent: "wedding",
    events: [
      {
        id: "engagement",
        name: "Traditional engagement",
        date: "2026-12-18", // PLACEHOLDER
        start: "11:00",
        end: "16:00",
        venue: "Venue to be confirmed", // PLACEHOLDER
        address: "Lagos",
        note: "Families meet, the bride is presented, and the dancing starts.",
      },
      {
        id: "wedding",
        name: "Wedding service",
        date: "2026-12-19", // PLACEHOLDER
        start: "10:00",
        end: "12:30",
        venue: "The City Builders", // PLACEHOLDER
        address: "Lagos",
        note: "Vows, prayer and the blessing of the marriage.",
      },
      {
        id: "reception",
        name: "Reception",
        date: "2026-12-19", // PLACEHOLDER
        start: "14:00",
        end: "19:00",
        venue: "Venue to be confirmed", // PLACEHOLDER
        address: "Lagos",
        note: "Food, music, toasts and the first dance.",
      },
    ],
    story: [
      // PLACEHOLDER: the couple's own story
      { when: "The first hello", title: "Where it started", text: "A conversation that was meant to last five minutes and ran for two hours." },
      { when: "Friendship", title: "Becoming best friends", text: "Prayer, long calls, honest questions, and learning each other's hearts." },
      { when: "The question", title: "She said yes", text: "He asked, she cried, and both families started planning." },
      { when: "December 2026", title: "Forever begins", text: "Before God, family and friends, two become one." },
    ],
    colours: [
      { name: "Adire indigo", hex: "#1E2466" },
      { name: "Champagne gold", hex: "#C8A24E" },
      { name: "Coral bead", hex: "#D8432F" },
    ],
    dressNote: "Wear the colours of the day. Aso-ebi details are with the families; ask on the numbers below.",
    gifts: {
      note: "Your presence and your prayers are the gift we want most. If you would like to bless us further, you can send a gift here.",
      bank: "", // PLACEHOLDER
      accountName: "",
      accountNumber: "",
    },
    contact: [], // PLACEHOLDER: [{ name: "Aunty Bisi (bride's family)", phone: "+234 ..." }]
  },
};

export function getWedding(slug: string) {
  return weddings[slug] ?? null;
}

export function weddingSlugs() {
  return Object.keys(weddings);
}

/** An ISO time for a Lagos date and clock time. */
export function lagosIso(date: string, time: string) {
  return `${date}T${time}:00+01:00`;
}

export function eventLabel(e: WeddingEvent) {
  const d = new Date(`${e.date}T12:00:00+01:00`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "Africa/Lagos" }),
    day: d.toLocaleDateString("en-GB", { day: "numeric", timeZone: "Africa/Lagos" }),
    month: d.toLocaleDateString("en-GB", { month: "long", timeZone: "Africa/Lagos" }),
    year: d.toLocaleDateString("en-GB", { year: "numeric", timeZone: "Africa/Lagos" }),
    time: `${clock(e.start)} to ${clock(e.end)}`,
  };
}

function clock(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}

export function mapLink(e: WeddingEvent) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.address}`)}`;
}

export function googleCalendarLink(w: Wedding, e: WeddingEvent) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${w.groom} & ${w.bride}: ${e.name}`,
    dates: `${fmt(lagosIso(e.date, e.start))}/${fmt(lagosIso(e.date, e.end))}`,
    location: `${e.venue}, ${e.address}`,
    details: `${w.hashtag}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** All the events as an .ics file for Apple / Outlook calendars. */
export function weddingIcs(w: Wedding, site: string) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The City Builders//Wedding//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of w.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${w.slug}-${e.id}@citybuilders`,
      `DTSTAMP:${fmt(lagosIso(e.date, e.start))}`,
      `DTSTART:${fmt(lagosIso(e.date, e.start))}`,
      `DTEND:${fmt(lagosIso(e.date, e.end))}`,
      `SUMMARY:${esc(`${w.groom} & ${w.bride}: ${e.name}`)}`,
      `LOCATION:${esc(`${e.venue}, ${e.address}`)}`,
      `DESCRIPTION:${esc(`${w.hashtag}\n${site}/wedding/${w.slug}`)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
