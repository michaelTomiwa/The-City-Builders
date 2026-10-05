import { supabase, type ChurchEvent } from "@/lib/supabase";

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventsPage() {
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });

  const events = (data ?? []) as ChurchEvent[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm text-paper-dim">Gatherings</p>
      <h1 className="mt-3 font-display text-4xl text-paper sm:text-5xl">
        Come build with us.
      </h1>
      <p className="mt-4 max-w-xl text-paper-dim leading-relaxed">
        Services, prayer watches, and programs — online and in Nigeria.
      </p>

      <ul className="mt-14 divide-y divide-steel/60">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-2 py-7 sm:flex-row sm:gap-10">
            <div className="w-56 shrink-0">
              <p className="text-gold-text">{formatDate(event.starts_at)}</p>
              <p className="text-sm text-paper-dim">{formatTime(event.starts_at)}</p>
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
          <li className="py-12 text-paper-dim">No gatherings scheduled right now.</li>
        )}
      </ul>
    </div>
  );
}
