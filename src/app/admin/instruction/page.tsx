import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Pill } from "@/components/admin/ui";
import { InstructionForm } from "@/components/admin/instruction-form";
import { InstructionView } from "@/components/site/instruction-view";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { lagosDateTime } from "@/lib/discipleship";
import { lagosDayNumber, type Instruction } from "@/lib/instruction";
import { addWeeks, mondayOf, thisWeek, weekLabel } from "@/lib/week";
import { deleteInstruction, saveInstruction, unpublishInstruction } from "./actions";

export const metadata: Metadata = { title: "Weekly instruction" };

export default async function AdminInstruction({ searchParams }: PageProps<"/admin/instruction">) {
  const query = await searchParams;
  const current = thisWeek();
  const week = typeof query.w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.w) ? mondayOf(query.w) : current;
  const supabase = await createClient();
  const [{ data: row }, { data: prev }, { data: recent }] = await Promise.all([
    supabase.from("week_instructions").select("*").eq("week_start", week).maybeSingle(),
    supabase.from("week_instructions").select("*").eq("week_start", addWeeks(week, -1)).maybeSingle(),
    supabase.from("week_instructions").select("week_start, theme, status").order("week_start", { ascending: false }).limit(8),
  ]);
  const ins = (row ?? null) as Instruction | null;
  const last = (prev ?? null) as Instruction | null;
  const copying = !ins && query.from === "last" && last;
  const initial = ins ?? (copying ? { ...last, theme: "", word: "", readings: [] } : null);
  const published = ins?.status === "published";
  const day = week === current ? lagosDayNumber() : 1;

  return (
    <div>
      <AdminHeader
        title="Weekly instruction"
        description="One word to the whole church each week: what to fast, what to pray and what to study. It shows on the website, on every member's dashboard and on their phones."
      />

      {typeof query.note === "string" && (
        <p className="mt-6 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]" role="status">
          {query.note}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href={`/admin/instruction?w=${addWeeks(week, -1)}`} className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold" aria-label="Previous week">
          ←
        </Link>
        <p className="font-display text-2xl text-paper">
          {weekLabel(week)}
          {week === current && <span className="ml-2 align-middle font-sans text-sm text-gold-text">this week</span>}
          {week === addWeeks(current, 1) && <span className="ml-2 align-middle font-sans text-sm text-gold-text">next week</span>}
        </p>
        <Link href={`/admin/instruction?w=${addWeeks(week, 1)}`} className="rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper hover:border-gold" aria-label="Next week">
          →
        </Link>
        {ins && <Pill tone={published ? "green" : "grey"}>{published ? "Published" : "Draft"}</Pill>}
        {week !== current && (
          <Link href="/admin/instruction" className="text-sm text-gold-text hover:underline">
            Back to this week
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          {!ins && last && !copying && (
            <p className="mb-6 rounded-md border border-dashed border-steel bg-white/60 px-4 py-3 text-sm text-paper-dim">
              Nothing written for this week yet.{" "}
              <Link href={`/admin/instruction?w=${week}&from=last`} className="text-gold-text hover:underline">
                Start from last week&apos;s fasting and prayer points
              </Link>
            </p>
          )}
          <InstructionForm key={`${week}-${copying ? "copy" : "own"}-${ins?.updated_at ?? ""}`} week={week} initial={initial} published={published} action={saveInstruction} />

          {ins && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-paper">{published ? "What everyone sees" : "Preview"}</h2>
              <p className="mt-1 text-sm text-paper-dim">
                {published ? (
                  <>
                    Live at{" "}
                    <Link href="/week" className="text-gold-text hover:underline">
                      /week
                    </Link>{" "}
                    and on every member&apos;s dashboard.
                  </>
                ) : (
                  "Only you can see this until you publish it."
                )}
              </p>
              <div className="mt-4">
                <InstructionView ins={ins} day={day} narrow />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:self-start">
          {ins && (
            <section className="rounded-md border border-steel bg-white p-5 text-sm">
              <p className="text-paper-dim">
                {published && ins.published_at ? `Published ${lagosDateTime(ins.published_at)}` : `Last saved ${lagosDateTime(ins.updated_at)}`}
              </p>
              <div className="mt-3 flex flex-col items-start gap-2">
                {published && (
                  <form action={unpublishInstruction}>
                    <input type="hidden" name="week" value={week} />
                    <button className="text-paper-dim hover:text-paper">Take it down (back to draft)</button>
                  </form>
                )}
                <form action={deleteInstruction}>
                  <input type="hidden" name="week" value={week} />
                  <ConfirmButton message="Delete this week's instruction?" className="text-paper-dim hover:text-[#8a2f1e]">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </section>
          )}
          <section className="rounded-md border border-steel bg-white p-5">
            <h2 className="font-display text-xl text-paper">Recent weeks</h2>
            {(recent ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Your weekly instructions will be listed here.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {(recent ?? []).map((r) => (
                  <li key={r.week_start}>
                    <Link href={`/admin/instruction?w=${r.week_start}`} className="flex justify-between gap-2 hover:text-gold-text">
                      <span className="truncate text-paper">{r.theme}</span>
                      <span className="shrink-0 text-paper-dim">{weekLabel(r.week_start)}</span>
                    </Link>
                    {r.status === "draft" && <span className="text-xs text-paper-dim">Draft</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="text-xs leading-relaxed text-paper-dim">
            Tip: write next week&apos;s on Saturday or Sunday and publish it then, so it&apos;s ready when the week starts. On fast days, everyone with alerts on gets a reminder at 6 AM.
          </p>
        </aside>
      </div>
    </div>
  );
}
