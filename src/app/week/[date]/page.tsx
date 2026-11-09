import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";
import { InstructionView } from "@/components/site/instruction-view";
import { WhatsAppShare } from "@/components/site/whatsapp-share";
import { instructionArchive, instructionFaq, instructionMessage, instructionTitle, lagosDayNumber, type Instruction } from "@/lib/instruction";
import { addWeeks, mondayOf, thisWeek, weekLabel } from "@/lib/week";
import { absolute, jsonLd } from "@/lib/seo";
import { faqJsonLd } from "@/lib/post-faq";

export const revalidate = 300;

async function getWeek(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || mondayOf(date) !== date || date > thisWeek()) return null;
  const { data } = await supabase.from("week_instructions").select("*").eq("week_start", date).eq("status", "published").maybeSingle();
  return (data ?? null) as Instruction | null;
}

export async function generateMetadata({ params }: PageProps<"/week/[date]">): Promise<Metadata> {
  const { date } = await params;
  const ins = await getWeek(date);
  if (!ins) return { title: "Week not found" };
  const points = ins.prayer_points.slice(0, 2).join("; ");
  return {
    title: instructionTitle(ins),
    description: `Prayer points, fasting and Bible reading from The City Builders for the week of ${weekLabel(ins.week_start)}${points ? `: ${points}` : "."}`.slice(0, 158),
    alternates: { canonical: `/week/${ins.week_start}` },
    openGraph: { type: "article", url: `/week/${ins.week_start}`, publishedTime: ins.published_at ?? undefined },
  };
}

export default async function WeekArchivePage({ params }: PageProps<"/week/[date]">) {
  const { date } = await params;
  const ins = await getWeek(date);
  if (!ins) notFound();
  const current = ins.week_start === thisWeek();
  const faq = instructionFaq(ins);
  const archive = (await instructionArchive(supabase)).filter((w) => w.week_start !== ins.week_start).slice(0, 8);
  const prev = archive.find((w) => w.week_start === addWeeks(ins.week_start, -1));

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: instructionTitle(ins),
    description: ins.word ?? undefined,
    datePublished: ins.published_at ?? ins.updated_at,
    dateModified: ins.updated_at,
    author: { "@type": "Person", name: "Pastor Michael Tomiwa", url: absolute("/pastor") },
    publisher: { "@type": "Church", name: "The City Builders", url: absolute("/") },
    mainEntityOfPage: absolute(`/week/${ins.week_start}`),
    image: absolute(`/week/${ins.week_start}/opengraph-image`),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleLd)} />
      {faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faq))} />}
      <PageHero
        title={instructionTitle(ins)}
        intro={`The City Builders' prayer points, fasting and Bible reading for the week of ${weekLabel(ins.week_start)}. Use them on your own, with your family, or with us at Night Watch.`}
      />
      <div className="mx-auto max-w-6xl px-6 py-16">
        {current ? (
          <p className="mb-6 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]">This is this week&apos;s instruction. Join in today.</p>
        ) : (
          <p className="mb-6 text-sm text-paper-dim">
            From {weekLabel(ins.week_start)}.{" "}
            <Link href="/week" className="text-gold-text hover:underline">
              See this week&apos;s prayer points →
            </Link>
          </p>
        )}
        <InstructionView ins={ins} day={current ? lagosDayNumber() : 0} />

        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <WhatsAppShare label="Send these prayer points on WhatsApp" text={instructionMessage(ins)} url={absolute(`/week/${ins.week_start}`)} />
        </div>

        {faq.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="font-display text-3xl text-paper">Questions about this week</h2>
            <dl className="mt-6 space-y-6">
              {faq.map((f) => (
                <div key={f.question}>
                  <dt className="font-medium text-paper">{f.question}</dt>
                  <dd className="mt-1 leading-relaxed text-paper-dim">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {archive.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="font-display text-3xl text-paper">More weekly prayer points</h2>
            <ul className="mt-4 divide-y divide-steel/70">
              {archive.map((w) => (
                <li key={w.week_start}>
                  <Link href={`/week/${w.week_start}`} className="flex flex-col py-3 hover:text-gold-text sm:flex-row sm:justify-between sm:gap-4">
                    <span className="text-paper">{instructionTitle(w)}</span>
                    <span className="shrink-0 text-sm text-paper-dim">{weekLabel(w.week_start)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {prev && (
              <Link href={`/week/${prev.week_start}`} className="mt-4 inline-block text-sm text-gold-text hover:underline">
                ← The week before
              </Link>
            )}
          </section>
        )}
      </div>
    </>
  );
}
