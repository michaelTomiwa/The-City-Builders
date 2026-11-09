import { siteUrl } from "@/lib/site";
import { CHANNEL_URL, CHURCH_EMAIL, STREAMS_URL, serviceOccurrences, services } from "@/lib/schedule";

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

/** "2026-11-09T23:00:00+01:00": a time written in Lagos time, as Google prefers for events. */
function lagosIso(iso: string) {
  return new Date(Date.parse(iso) + 3600_000).toISOString().replace(/\.\d{3}Z$/, "+01:00");
}

/**
 * The next week of Night Watch and Morning Prayers as dated online events,
 * which Google can show as event results ("Night Watch, Tonight 11 PM").
 */
export function upcomingServicesJsonLd(now = Date.now()) {
  return serviceOccurrences(now, 7)
    .filter((o) => Date.parse(o.starts_at) > now)
    .map((o) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${o.title} with The City Builders`,
      description: `${o.description ?? ""} Live online with Pastor Michael Tomiwa. Free to join from anywhere.`.trim(),
      startDate: lagosIso(o.starts_at),
      endDate: o.ends_at ? lagosIso(o.ends_at) : undefined,
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url: absolute("/live") },
      image: [absolute("/opengraph-image")],
      organizer: { "@type": "Organization", name: "The City Builders", url: siteUrl },
      performer: { "@type": "Person", name: "Pastor Michael Tomiwa" },
      offers: { "@type": "Offer", price: 0, priceCurrency: "NGN", availability: "https://schema.org/InStock", url: absolute("/live"), validFrom: lagosIso(new Date(now - 86_400_000).toISOString()) },
      isAccessibleForFree: true,
    }));
}
