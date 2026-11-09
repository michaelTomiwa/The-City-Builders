import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { churchFaqs } from "@/lib/faq";
import { faqJsonLd } from "@/lib/post-faq";
import { jsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Questions people ask",
  description: "Service times, how to join Night Watch online, prayer requests, fasting, membership and giving at The City Builders, answered.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const settings = await getSiteSettings();
  const faqs = churchFaqs(settings?.church_address);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer }))))} />
      <PageHero title="Questions people ask." intro="Service times, joining online, prayer, fasting, membership and giving. If your question isn't here, write to us." />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="divide-y divide-steel/70 border-y border-steel/70">
          {faqs.map((f, i) => (
            <details key={f.question} open={i < 2} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-2xl leading-snug text-paper">
                <h2>{f.question}</h2>
                <span className="shrink-0 font-sans text-3xl leading-none text-gold-text transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-paper-dim">{f.answer}</p>
              {f.link && (
                <Link href={f.link.href} className="mt-3 inline-block text-sm font-medium text-gold-text hover:underline">
                  {f.link.label} →
                </Link>
              )}
            </details>
          ))}
        </div>
        <p className="mt-10 text-center text-paper-dim">
          Still have a question?{" "}
          <Link href="/contact" className="text-gold-text hover:underline">
            Write to us
          </Link>
          .
        </p>
      </div>
    </>
  );
}
