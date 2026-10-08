import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { activeMembers } from "@/lib/admin-discipleship";
import { displayName, lagosToday } from "@/lib/discipleship";
import { pairEveryone, pairTwo, unpair } from "../discipleship/actions";

export default async function AdminPartners({ searchParams }: PageProps<"/admin/partners">) {
  const params = await searchParams;
  const supabase = await createClient();
  const weekAgo = new Date(Date.parse(lagosToday()) - 7 * 86_400_000).toISOString().slice(0, 10);
  const [{ members }, { data: pairs }, { data: prayers }] = await Promise.all([
    activeMembers(supabase),
    supabase.from("prayer_partners").select("*").order("created_at", { ascending: false }),
    supabase.from("partner_prayers").select("user_id, partner_id, prayed_on").gte("prayed_on", weekAgo),
  ]);
  const name = new Map(members.map((m) => [m.id, displayName(m)]));
  const paired = new Set((pairs ?? []).flatMap((p) => [p.user_a, p.user_b]));
  const unpaired = members.filter((m) => !paired.has(m.id));
  const count = (from: string, to: string) => (prayers ?? []).filter((p) => p.user_id === from && p.partner_id === to).length;

  return (
    <div>
      <AdminHeader title="Prayer partners" description="Pair members so everyone has someone praying for them by name, every day." />
      {params.paired && (
        <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
          Made {params.paired} new {params.paired === "1" ? "pair" : "pairs"}.
          {params.odd ? " One person is left over; pair them by hand below, or add them to a pair later." : ""}
        </p>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-paper">Pairs</h2>
            <span className="text-sm text-paper-dim">Prayers this week shown as A→B / B→A</span>
          </div>
          {(pairs ?? []).length === 0 ? (
            <div className="mt-4">
              <Empty>No pairs yet.</Empty>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-steel">
              {(pairs ?? []).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-paper">
                    {name.get(p.user_a) ?? "Member"} <span className="text-gold-text">&amp;</span> {name.get(p.user_b) ?? "Member"}
                  </span>
                  <span className="flex items-center gap-4 text-xs text-paper-dim">
                    <span>
                      {count(p.user_a, p.user_b)} / {count(p.user_b, p.user_a)} prayers
                    </span>
                    <form action={unpair}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message="Separate this pair?" className="hover:text-[#8a2f1e]">
                        Separate
                      </ConfirmButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-5">
          <Panel>
            <p className="font-medium text-paper">{unpaired.length} without a partner</p>
            <p className="mt-1 text-sm text-paper-dim">{unpaired.map((m) => displayName(m)).join(", ") || "Everyone has a partner."}</p>
            {unpaired.length > 1 && (
              <form action={pairEveryone} className="mt-4">
                <button className="w-full rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Pair them up at random</button>
              </form>
            )}
          </Panel>
          <Panel>
            <p className="font-medium text-paper">Pair two people</p>
            <form action={pairTwo} className="mt-3 space-y-2">
              {(["user_a", "user_b"] as const).map((f) => (
                <select key={f} name={f} required defaultValue="" className="h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper">
                  <option value="" disabled>
                    Choose a member
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {displayName(m)}
                    </option>
                  ))}
                </select>
              ))}
              <button className={smallButton}>Pair</button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
