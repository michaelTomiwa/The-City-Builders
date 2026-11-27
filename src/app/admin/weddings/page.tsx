import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, Pill, smallButton } from "@/components/admin/ui";
import { getWedding, weddingSlugs } from "@/lib/wedding";
import { moderateWish } from "../actions";

export const metadata: Metadata = { title: "Weddings" };

type Rsvp = { id: string; wedding: string; name: string; phone: string | null; attending: boolean; guests: number; events: string[]; note: string | null; created_at: string };
type Wish = { id: string; wedding: string; name: string; message: string; hidden: boolean; created_at: string };

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });

export default async function WeddingsAdmin() {
  const supabase = await createClient();
  const [{ data: r }, { data: wi }] = await Promise.all([
    supabase.from("wedding_rsvps").select("*").order("created_at", { ascending: false }),
    supabase.from("wedding_wishes").select("*").order("created_at", { ascending: false }),
  ]);
  const rsvps = (r ?? []) as Rsvp[];
  const wishes = (wi ?? []) as Wish[];

  return (
    <>
      <AdminHeader title="Weddings" description="Wedding pages the church hosts for couples: who's coming, and the wishes guests leave. To change a date, venue or story, ask for the wedding details file to be updated." />
      <div className="mt-8 space-y-12">
        {weddingSlugs().map((slug) => {
          const w = getWedding(slug)!;
          const mine = rsvps.filter((x) => x.wedding === slug);
          const yes = mine.filter((x) => x.attending);
          const guests = yes.reduce((n, x) => n + x.guests, 0);
          const wall = wishes.filter((x) => x.wedding === slug);
          return (
            <section key={slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-3xl text-paper">
                  {w.groom} &amp; {w.bride}
                </h2>
                <Link href={`/wedding/${slug}`} target="_blank" className="text-sm text-gold-text hover:underline">
                  Open their page
                </Link>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <Panel>
                  <p className="text-3xl text-paper">{guests}</p>
                  <p className="text-sm text-paper-dim">guests coming</p>
                </Panel>
                <Panel>
                  <p className="text-3xl text-paper">{yes.length}</p>
                  <p className="text-sm text-paper-dim">replied yes</p>
                </Panel>
                <Panel>
                  <p className="text-3xl text-paper">{mine.length - yes.length}</p>
                  <p className="text-sm text-paper-dim">can&apos;t come</p>
                </Panel>
                <Panel>
                  {w.events.map((e) => (
                    <p key={e.id} className="text-sm text-paper-dim">
                      <span className="text-paper">{yes.filter((x) => x.events.includes(e.id)).reduce((n, x) => n + x.guests, 0)}</span> at {e.name.toLowerCase()}
                    </p>
                  ))}
                </Panel>
              </div>

              <h3 className="mt-8 font-display text-2xl text-paper">Replies</h3>
              {mine.length ? (
                <div className="mt-3 overflow-x-auto rounded-md border border-steel bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-steel text-paper-dim">
                      <tr>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Reply</th>
                        <th className="px-4 py-2 font-medium">Attending</th>
                        <th className="px-4 py-2 font-medium">Phone</th>
                        <th className="px-4 py-2 font-medium">Note</th>
                        <th className="px-4 py-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-steel/70">
                      {mine.map((x) => (
                        <tr key={x.id} className="align-top">
                          <td className="px-4 py-3 text-paper">{x.name}</td>
                          <td className="px-4 py-3">{x.attending ? <Pill tone="green">Yes · {x.guests}</Pill> : <Pill tone="grey">No</Pill>}</td>
                          <td className="px-4 py-3 text-paper-dim">{x.attending ? w.events.filter((e) => x.events.includes(e.id)).map((e) => e.name).join(", ") || "—" : "—"}</td>
                          <td className="px-4 py-3 text-paper-dim">{x.phone ? <a href={`https://wa.me/${x.phone.replace(/\D/g, "")}`} className="hover:text-gold-text">{x.phone}</a> : "—"}</td>
                          <td className="max-w-xs px-4 py-3 text-paper-dim">{x.note ?? ""}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-paper-dim">{when(x.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No replies yet. Share the page link with the guests.</Empty>
              )}

              <h3 className="mt-8 font-display text-2xl text-paper">Wishes</h3>
              {wall.length ? (
                <ul className="mt-3 divide-y divide-steel/70 rounded-md border border-steel bg-white">
                  {wall.map((x) => (
                    <li key={x.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className={x.hidden ? "opacity-50" : ""}>
                        <p className="text-paper">{x.message}</p>
                        <p className="mt-1 text-sm text-paper-dim">
                          {x.name} · {when(x.created_at)} {x.hidden && <Pill tone="grey">Hidden</Pill>}
                        </p>
                      </div>
                      <form action={moderateWish} className="flex shrink-0 gap-2">
                        <input type="hidden" name="id" value={x.id} />
                        <button name="action" value={x.hidden ? "show" : "hide"} className={smallButton}>
                          {x.hidden ? "Show" : "Hide"}
                        </button>
                        <button name="action" value="delete" className={smallButton}>
                          Delete
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No wishes yet.</Empty>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
