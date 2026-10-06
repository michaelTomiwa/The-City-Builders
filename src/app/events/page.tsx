import { supabase, type ChurchEvent } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";
import { DailyRhythm } from "@/components/site/daily-rhythm";

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export default async function EventsPage() {
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });

  const events = (data ?? []) as ChurchEvent[];

  return (
    <>
      <PageHero
        title={<>Come build with us.</>}
        intro={<>Services, prayer watches, and programs — online and in Nigeria.</>}
      />
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="font-display text-4xl text-paper">Every day</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-paper-dim">
        Two standing gatherings, streamed live on YouTube. Add them to your
        calendar and they&apos;ll repeat daily.
      </p>
      <div className="mt-8">
        <DailyRhythm />
      </div>

      <h2 className="mt-20 font-display text-4xl text-paper">Special gatherings</h2>
      <ul className="mt-8 divide-y divide-steel/60">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-2 py-7 sm:flex-row sm:gap-10">
            <div className="w-56 shrink-0">
              <p className="text-gold-text">{formatDate(event.starts_at)}</p>
              <p className="text-sm text-paper-dim">{formatTime(event.starts_at)} WAT</p>
            </div>
            <div>
              <h2 className="font-display text-xl text-paper">{event.title}</h2>
              {event.location && (
                <p className="mt-1 text-sm text-paper-dim">{event.location}</p>
              )}
              {event.description && (
                <p className="mt-2 max-w-xl text-paper-dim leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>
          </li>
        ))}
        {events.length === 0 && (
          <li className="py-12 text-paper-dim">No special gatherings are scheduled right now. Night Watch and Morning Prayers still run every day.</li>
        )}
      </ul>
    </div>
    </>
  );
}
