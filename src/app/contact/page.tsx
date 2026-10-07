import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { CopyEmail } from "@/components/site/copy-email";
import { CHANNEL_URL, CHURCH_EMAIL, services } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to The City Builders at ${CHURCH_EMAIL}.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Write to the builders."
        intro="Questions, prayer, an invitation for Pastor Michael, or just hello. Every message is read by the team."
      />

      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm />

        <aside className="space-y-10">
          <div>
            <h2 className="font-display text-2xl text-paper">Email us directly</h2>
            <a
              href={`mailto:${CHURCH_EMAIL}`}
              className="mt-3 block break-all text-lg text-gold-text underline-offset-4 hover:underline"
            >
              {CHURCH_EMAIL}
            </a>
            <CopyEmail className="mt-2 text-sm text-paper-dim underline underline-offset-4 hover:text-paper" />
          </div>

          <div>
            <h2 className="font-display text-2xl text-paper">Pray with us live</h2>
            <ul className="mt-3 space-y-2 text-paper-dim">
              {services.map((s) => (
                <li key={s.id}>
                  <span className="text-paper">{s.name}</span>, every day at {s.label} Lagos time
                </li>
              ))}
            </ul>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-gold-text underline-offset-4 hover:underline"
            >
              YouTube @thecitybuilderscity
            </a>
          </div>

          <div>
            <h2 className="font-display text-2xl text-paper">Need prayer now?</h2>
            <p className="mt-3 leading-relaxed text-paper-dim">
              Post it on the prayer wall and the community will stand with you,
              with your name or without it.
            </p>
            <Link href="/prayer" className="mt-3 inline-block text-gold-text underline-offset-4 hover:underline">
              Go to the prayer wall
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
