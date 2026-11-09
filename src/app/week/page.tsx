import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";
import { InstructionView } from "@/components/site/instruction-view";
import { currentInstruction, instructionMessage, lagosDayNumber } from "@/lib/instruction";
import { absolute } from "@/lib/seo";
import { WhatsAppShare } from "@/components/site/whatsapp-share";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "This week",
  description: "This week's instruction for the City Builders: what we're fasting, praying and studying together.",
};

export default async function WeekPage() {
  const ins = await currentInstruction(supabase);

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
