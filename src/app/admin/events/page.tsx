import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteEvent } from "../actions";

function lagos(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

type EventRow = { id: string; title: string; starts_at: string; location: string | null };

function EventList({ items, faded }: { items: EventRow[]; faded?: boolean }) {
  return (
    <ul className="divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
      {items.map((e) => (
        <li key={e.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${faded ? "opacity-70" : ""}`}>
          <div>
            <p className="font-medium text-paper">{e.title}</p>
            <p className="mt-1 text-sm text-paper-dim">
              {lagos(e.starts_at)} WAT{e.location && `, ${e.location}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/events/${e.id}/edit`} className={smallButton}>
              Edit
            </Link>
            <form action={deleteEvent}>
              <input type="hidden" name="id" value={e.id} />
              <ConfirmButton message={`Delete “${e.title}”?`} className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:bg-[#f6e1dc]">
                Delete
              </ConfirmButton>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}


export default async function AdminEvents() {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
  const now = new Date().toISOString();
  const rows = (data ?? []) as EventRow[];
  const upcoming = rows.filter((e) => e.starts_at >= now).reverse();
  const past = rows.filter((e) => e.starts_at < now);

  return (
    <div>
      <AdminHeader
        title="Events"
        description={
          <>
            Special gatherings beyond the daily <Pill tone="gold">Night Watch, 11 PM</Pill> and{" "}
            <Pill tone="gold">Morning Prayers, 7 AM</Pill>. Upcoming ones drive the homepage countdown.
          </>
        }
        action={{ href: "/admin/events/new", label: "Add an event" }}
      />
      <h2 className="mt-10 font-display text-2xl text-paper">Upcoming</h2>
      <div className="mt-4">{upcoming.length ? <EventList items={upcoming} /> : <Empty>No special events scheduled.</Empty>}</div>
      {past.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl text-paper">Past</h2>
          <div className="mt-4">
            <EventList items={past} faded />
          </div>
        </>
      )}
    </div>
  );
}
