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
export function churchJsonLd(logo?: string | null, streetAddress?: string | null) {
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
    address: { "@type": "PostalAddress", ...(streetAddress ? { streetAddress } : {}), addressLocality: "Lagos", addressCountry: "NG" },
    areaServed: ["Lagos", "Nigeria", "Worldwide (online)"],
    founder: { "@id": `${siteUrl}/pastor#person` },
    employee: { "@id": `${siteUrl}/pastor#person` },
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

/** The site itself, so search engines and AI tools know its name and who runs it. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "The City Builders",
    alternateName: ["City Builders Church", "The City Builders Lagos"],
    url: siteUrl,
    inLanguage: "en-NG",
    publisher: { "@id": `${siteUrl}/#church` },
  };
}

/** Pastor Michael Tomiwa, for the pastor page and as the author of posts. */
export function pastorJsonLd(image: string, bio: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/pastor#person`,
    name: "Michael Tomiwa",
    honorificPrefix: "Pastor",
    jobTitle: "Lead Pastor",
    description: bio,
    image: absolute(image),
    url: `${siteUrl}/pastor`,
    worksFor: { "@id": `${siteUrl}/#church`, "@type": "Church", name: "The City Builders" },
    sameAs: [CHANNEL_URL],
  };
}
