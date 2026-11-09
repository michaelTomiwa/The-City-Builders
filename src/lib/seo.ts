import { siteUrl } from "@/lib/site";
import { CHANNEL_URL, CHURCH_EMAIL, STREAMS_URL, services } from "@/lib/schedule";

/*
  Structured data (JSON-LD) so Google understands the church: who we are,
  when we meet, and what each post and message is.
*/

/** Render-safe JSON for a <script type="application/ld+json"> tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export function absolute(path: string) {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

/** The church itself, with the two daily online services. */
export function churchJsonLd(logo?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": `${siteUrl}/#church`,
    name: "The City Builders",
    url: siteUrl,
    logo: absolute(logo || "/icon.png"),
    image: absolute("/opengraph-image"),
    email: CHURCH_EMAIL,
    description: "A praying church led by Pastor Michael Tomiwa. Night Watch at 11 PM and Morning Prayers at 7 AM, Lagos time, every day.",
    address: { "@type": "PostalAddress", addressLocality: "Lagos", addressCountry: "NG" },
    founder: { "@type": "Person", name: "Michael Tomiwa", jobTitle: "Pastor" },
    sameAs: [CHANNEL_URL],
    event: services.map((s) => ({
      "@type": "Event",
      name: `${s.name} with The City Builders`,
      description: s.description,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url: STREAMS_URL },
      organizer: { "@id": `${siteUrl}/#church` },
      isAccessibleForFree: true,
      eventSchedule: {
        "@type": "Schedule",
        repeatFrequency: "P1D",
        startTime: `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}:00`,
        duration: `PT${s.durationMinutes}M`,
        scheduleTimezone: "Africa/Lagos",
      },
    })),
  };
}
