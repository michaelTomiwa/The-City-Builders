import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";
import { InstructionView } from "@/components/site/instruction-view";
import { currentInstruction, instructionArchive, instructionMessage, instructionTitle, lagosDayNumber } from "@/lib/instruction";
import { weekLabel } from "@/lib/week";
import { absolute } from "@/lib/seo";
import { WhatsAppShare } from "@/components/site/whatsapp-share";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const ins = await currentInstruction(supabase);
  return {
    title: ins ? `This week: ${instructionTitle(ins)}` : "This week's prayer points",
    description: "This week's prayer points, fasting and Bible reading from The City Builders: what the whole house is praying and studying together.",
    // The dated page is the permanent address Google keeps; this one always shows the current week.
    alternates: { canonical: ins ? `/week/${ins.week_start}` : "/week" },
  };
}

export default async function WeekPage() {
  const [ins, archive] = await Promise.all([currentInstruction(supabase), instructionArchive(supabase)]);
  const past = archive.filter((w) => w.week_start !== ins?.week_start).slice(0, 12);

  return (
    <>
      <PageHero title="This week, together." intro="What the whole house is fasting, praying and studying this week. Join in wherever you are." />
      <div className="mx-auto max-w-6xl px-6 py-16">
        {ins ? (
          <>
            <InstructionView ins={ins} day={lagosDayNumber()} />
            <div className="mt-10 flex flex-col items-center gap-2 text-center">
              <WhatsAppShare label="Send this week's instruction on WhatsApp" text={instructionMessage(ins)} url={absolute("/week")} />
              <p className="text-sm text-paper-dim">Fast and pray together: send it to your family, friends and groups.</p>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-16 text-center text-lg text-paper-dim">
            This week&apos;s instruction is on its way. Check back soon.
          </p>
        )}
        {past.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="font-display text-3xl text-paper">Past weeks&apos; prayer points</h2>
            <ul className="mt-4 divide-y divide-steel/70">
              {past.map((w) => (
                <li key={w.week_start}>
                  <Link href={`/week/${w.week_start}`} className="flex flex-col py-3 hover:text-gold-text sm:flex-row sm:justify-between sm:gap-4">
                    <span className="text-paper">{instructionTitle(w)}</span>
                    <span className="shrink-0 text-sm text-paper-dim">{weekLabel(w.week_start)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="mt-10 text-center text-sm text-paper-dim">
          Members can tick it off day by day on{" "}
          <Link href="/me/week" className="text-gold-text hover:underline">
            their This Week checklist
          </Link>
          . New here?{" "}
          <Link href="/join" className="text-gold-text hover:underline">
            Join the City Builders
          </Link>
          .
        </p>
      </div>
    </>
  );
}
