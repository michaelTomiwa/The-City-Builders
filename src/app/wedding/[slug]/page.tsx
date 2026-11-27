import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { eventLabel, getWedding, googleCalendarLink, lagosIso, mapLink, weddingSlugs } from "@/lib/wedding";
import { absolute } from "@/lib/seo";
import { Adire } from "@/components/wedding/adire";
import { Countdown } from "@/components/wedding/countdown";
import { RsvpForm } from "@/components/wedding/rsvp-form";
import { Wishes, type Wish } from "@/components/wedding/wishes";
import { CopyText } from "@/components/wedding/copy-text";

export const revalidate = 60;

export function generateStaticParams() {
  return weddingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/wedding/[slug]">): Promise<Metadata> {
  const w = getWedding((await params).slug);
  if (!w) return {};
  const main = w.events.find((e) => e.id === w.mainEvent) ?? w.events[0];
  const d = eventLabel(main);
  const title = `${w.groom} & ${w.bride}`;
  const description = `${d.weekday} ${d.day} ${d.month} ${d.year}, ${w.city}. Celebrate with us, and let us know you're coming. ${w.hashtag}`;
  return {
    title: { absolute: `${title} · ${w.hashtag}` },
    description,
    // A family occasion: shareable by link, kept out of search results.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
  };
}

function Beads({ count = 23 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const centre = Math.abs(i - (count - 1) / 2);
        const big = centre === 0;
        const gold = i % 4 === 0;
        return (
          <span
            key={i}
            className="wed-bead block rounded-full"
            style={{
              width: big ? 14 : gold ? 6 : 9,
              height: big ? 14 : gold ? 6 : 9,
              background: gold && !big ? "var(--wed-gold)" : "var(--wed-coral)",
              boxShadow: "inset -2px -2px 3px rgba(0,0,0,.25), inset 1px 1px 2px rgba(255,255,255,.35)",
              animationDelay: `${1.6 + centre * 0.05}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default async function WeddingPage({ params }: PageProps<"/wedding/[slug]">) {
  const { slug } = await params;
  const w = getWedding(slug);
  if (!w) notFound();

  const { data } = await supabase.from("wedding_wishes").select("id, name, message, created_at").eq("wedding", w.slug).order("created_at", { ascending: false }).limit(60);
  const wishes = (data ?? []) as Wish[];

  const main = w.events.find((e) => e.id === w.mainEvent) ?? w.events[0];
  const mainDate = eventLabel(main);
  const rsvpBy = eventLabel({ ...main, date: w.rsvpBy });
  const couple = `${w.groom} and ${w.bride}`;
  const share = `You're invited! ${w.groom} & ${w.bride} are getting married on ${mainDate.weekday} ${mainDate.day} ${mainDate.month} in ${w.city}. Details and RSVP: ${absolute(`/wedding/${w.slug}`)} ${w.hashtag}`;
  const hasBank = Boolean(w.gifts.accountNumber);

  return (
    <>
      {/* Hero: the cloth dyes in, the names rise, the beads are strung. */}
      <header className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[var(--wed-deep)] text-[var(--wed-lace)]">
        <div className="wed-dye absolute inset-0 -z-10 bg-[var(--wed-indigo)]">
          <Adire id="hero" className="absolute inset-0" opacity={0.3} />
        </div>
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 60% 55% at 50% 47%, rgba(18,22,74,.92) 0%, rgba(18,22,74,.7) 45%, rgba(18,22,74,0) 100%)" }} />

        <nav className="flex items-center justify-between px-5 py-5 sm:px-10">
          <span className="font-wed-display text-lg italic text-[var(--wed-mist)]">{w.hashtag}</span>
          <a href="#rsvp" className="border-b border-[var(--wed-gold)] pb-0.5 text-[var(--wed-lace)] hover:text-[var(--wed-gold)]">
            Reply to the invitation
          </a>
        </nav>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-16 pt-6 text-center">
          <p className="wed-rise text-lg text-[var(--wed-mist)]" style={{ animationDelay: "0.9s" }}>
            Together with their families
          </p>
          <h1 className="mt-4 font-wed-display font-medium leading-[0.86] tracking-[-0.02em]">
            <span className="wed-rise relative z-10 block text-[clamp(3.6rem,15vw,11rem)]" style={{ animationDelay: "1.05s" }}>
              {w.groom}
            </span>
            <span className="wed-rise relative z-0 -my-[0.12em] block text-[clamp(4.5rem,19vw,14rem)] font-normal italic leading-[0.8] text-[var(--wed-gold)]" style={{ animationDelay: "1.25s" }} aria-label="and">
              &amp;
            </span>
            <span className="wed-rise relative z-10 block text-[clamp(3.6rem,15vw,11rem)]" style={{ animationDelay: "1.4s" }}>
              {w.bride}
            </span>
          </h1>
          <p className="wed-rise mt-8 font-wed-display text-2xl italic sm:text-3xl" style={{ animationDelay: "1.7s" }}>
            {mainDate.weekday}, {mainDate.day} {mainDate.month} {mainDate.year}
          </p>
          <p className="wed-rise mt-1 text-lg text-[var(--wed-mist)]" style={{ animationDelay: "1.75s" }}>
            {w.city}, Nigeria
          </p>
          <div className="wed-rise mt-10" style={{ animationDelay: "1.9s" }}>
            <Countdown target={lagosIso(main.date, main.start)} doneText={`Mr & Mrs ${w.groomFull.split(" ")[0]}`} />
          </div>
        </div>

        <div className="pb-8">
          <Beads />
        </div>
      </header>

      {/* Welcome */}
      <section className="mx-auto max-w-3xl px-5 py-24 sm:py-32">
        <blockquote>
          <p className="font-wed-display text-[clamp(2.2rem,6vw,3.8rem)] italic leading-[1.08]">“{w.verse.text}”</p>
          <footer className="mt-4 text-lg text-[var(--wed-indigo)]/60">{w.verse.ref}</footer>
        </blockquote>
        <p className="mt-12 max-w-xl text-xl leading-[1.7]">{w.welcome}</p>
        <p className="mt-6 font-wed-display text-2xl italic">
          {w.groomFull} &amp; {w.brideFull}
        </p>
      </section>

      {/* The celebrations, in order */}
      <section className="border-t border-[var(--wed-indigo)]/15">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
          <h2 className="font-wed-display text-[clamp(2.4rem,6vw,4rem)] leading-none">The celebrations</h2>
          <ol className="mt-12">
            {w.events.map((e) => {
              const d = eventLabel(e);
              return (
                <li key={e.id} className="grid gap-x-10 gap-y-4 border-t border-[var(--wed-indigo)]/15 py-10 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <div className="flex items-baseline gap-3 sm:block">
                    <span className="font-wed-display text-6xl leading-none sm:text-7xl">{d.day}</span>
                    <span className="block text-lg text-[var(--wed-indigo)]/60 sm:mt-2">
                      {d.weekday}
                      <br className="hidden sm:block" /> {d.month}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-wed-display text-3xl sm:text-4xl">{e.name}</h3>
                    <p className="mt-2 text-lg">{d.time}</p>
                    <p className="text-lg">
                      {e.venue}
                      {e.address && e.address !== e.venue ? `, ${e.address}` : ""}
                    </p>
                    {e.note && <p className="mt-3 max-w-lg leading-relaxed text-[var(--wed-indigo)]/70">{e.note}</p>}
                    <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                      <a href={mapLink(e)} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--wed-coral)] decoration-2 underline-offset-[6px] hover:text-[var(--wed-coral)]">
                        Get directions
                      </a>
                      <a href={googleCalendarLink(w, e)} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--wed-coral)] decoration-2 underline-offset-[6px] hover:text-[var(--wed-coral)]">
                        Add to Google Calendar
                      </a>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="border-t border-[var(--wed-indigo)]/15 pt-8 text-[var(--wed-indigo)]/70">
            On an iPhone or using Outlook?{" "}
            <a href={`/wedding/${w.slug}/calendar.ics`} className="text-[var(--wed-indigo)] underline decoration-[var(--wed-coral)] decoration-2 underline-offset-[6px]">
              Save every date to your calendar
            </a>
          </p>
        </div>
      </section>

      {/* Our story */}
      <section className="relative isolate overflow-hidden bg-[var(--wed-indigo)] text-[var(--wed-lace)]">
        <Adire id="story" className="absolute inset-y-0 right-0 -z-10 w-1/3 max-sm:hidden" opacity={0.16} />
        <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
          <h2 className="font-wed-display text-[clamp(2.4rem,6vw,4rem)] leading-none">How we got here</h2>
          <ol className="relative mt-14 max-w-2xl border-l border-[var(--wed-gold)]/60 pl-10">
            {w.story.map((s) => (
              <li key={s.title} className="relative pb-12 last:pb-0">
                <span
                  className="absolute -left-[2.85rem] top-1.5 block h-3.5 w-3.5 rounded-full bg-[var(--wed-coral)]"
                  style={{ boxShadow: "inset -2px -2px 3px rgba(0,0,0,.3), inset 1px 1px 2px rgba(255,255,255,.35)" }}
                  aria-hidden="true"
                />
                <p className="text-[var(--wed-gold)]">{s.when}</p>
                <h3 className="mt-1 font-wed-display text-3xl">{s.title}</h3>
                <p className="mt-2 text-lg leading-relaxed text-[var(--wed-mist)]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Colours of the day */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
        <h2 className="font-wed-display text-[clamp(2.4rem,6vw,4rem)] leading-none">Colours of the day</h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--wed-indigo)]/75">{w.dressNote}</p>
        <ul className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
          {w.colours.map((c, i) => (
            <li key={c.name}>
              <div className="relative h-56 overflow-hidden sm:h-80" style={{ background: c.hex }}>
                <Adire id={`swatch-${i}`} className="absolute inset-0" ink="#ffffff" opacity={0.2} />
              </div>
              <p className="mt-3 font-wed-display text-xl leading-tight sm:text-2xl">{c.name}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* RSVP */}
      <section id="rsvp" className="scroll-mt-4 bg-[var(--wed-deep)] text-[var(--wed-lace)]">
        <div className="mx-auto grid max-w-5xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="font-wed-display text-[clamp(2.4rem,6vw,4rem)] leading-none">Will you celebrate with us?</h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--wed-mist)]">
              Please reply by {rsvpBy.weekday}, {rsvpBy.day} {rsvpBy.month}, so the families can plan seats and food.
            </p>
          </div>
          <RsvpForm wedding={w.slug} events={w.events.map(({ id, name }) => ({ id, name }))} couple={couple} />
        </div>
      </section>

      {/* Wishes */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
        <h2 className="font-wed-display text-[clamp(2.4rem,6vw,4rem)] leading-none">Pray over them</h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--wed-indigo)]/75">Leave a prayer or a word for {couple}. They&apos;ll read every one.</p>
        <div className="mt-12">
          <Wishes wedding={w.slug} initial={wishes} />
        </div>
      </section>

      {/* Gifts and questions */}
      <section className="border-t border-[var(--wed-indigo)]/15">
        <div className="mx-auto grid max-w-5xl gap-14 px-5 py-20 sm:grid-cols-2 sm:py-28">
          <div>
            <h2 className="font-wed-display text-4xl">Gifts</h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--wed-indigo)]/80">{w.gifts.note}</p>
            {hasBank ? (
              <dl className="mt-6 space-y-1 text-lg">
                <div>
                  <dt className="sr-only">Bank</dt>
                  <dd>{w.gifts.bank}</dd>
                </div>
                <div>
                  <dt className="sr-only">Account name</dt>
                  <dd>{w.gifts.accountName}</dd>
                </div>
                <div className="flex flex-wrap items-baseline gap-4">
                  <dt className="sr-only">Account number</dt>
                  <dd className="font-wed-display text-3xl tabular-nums">{w.gifts.accountNumber}</dd>
                  <span className="[&_button]:text-[var(--wed-coral)] [&_button:hover]:text-[var(--wed-indigo)]">
                    <CopyText text={w.gifts.accountNumber} label="Copy number" />
                  </span>
                </div>
              </dl>
            ) : (
              <p className="mt-6 italic text-[var(--wed-indigo)]/60">Account details will be shared here soon.</p>
            )}
          </div>
          <div>
            <h2 className="font-wed-display text-4xl">Questions</h2>
            {w.contact.length ? (
              <ul className="mt-4 space-y-3 text-lg">
                {w.contact.map((c) => (
                  <li key={c.phone}>
                    {c.name}
                    <br />
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} className="underline decoration-[var(--wed-coral)] decoration-2 underline-offset-[6px]">
                      {c.phone} on WhatsApp
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-lg leading-relaxed text-[var(--wed-indigo)]/80">Ask the families, or send your question with your reply above.</p>
            )}
          </div>
        </div>
      </section>

      <footer className="relative isolate overflow-hidden bg-[var(--wed-deep)] text-center text-[var(--wed-lace)]">
        <Adire id="foot" className="absolute inset-0 -z-10" opacity={0.12} />
        <div className="mx-auto max-w-4xl px-5 py-24">
          <Beads count={11} />
          <p className="mt-10 break-words font-wed-display text-[clamp(2.6rem,10vw,6rem)] italic leading-none text-[var(--wed-gold)]">{w.hashtag}</p>
          <p className="mt-6 text-lg text-[var(--wed-mist)]">Use it on every photo, so the couple can find them all.</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(share)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex h-14 items-center bg-[var(--wed-lace)] px-8 text-lg font-medium text-[var(--wed-indigo)] hover:bg-[var(--wed-gold)]"
          >
            Send the invitation on WhatsApp
          </a>
          <p className="mt-16 text-[var(--wed-mist)]">
            Hosted with love by{" "}
            <Link href="/" className="text-[var(--wed-lace)] underline decoration-[var(--wed-gold)] underline-offset-4">
              The City Builders
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}
