import Link from "next/link";
import Image from "next/image";
import { supabase, type Post, type ChurchEvent } from "@/lib/supabase";
import { LiveStream } from "@/components/site/live-stream";
import { RecentSessions } from "@/components/site/recent-sessions";
import { NightCity } from "@/components/site/night-city";
import { WatchClock } from "@/components/site/watch-clock";
import { Stars } from "@/components/site/stars";
import { Celestial } from "@/components/site/celestial";
import { HeroHeadline } from "@/components/site/hero-headline";
import { Parallax } from "@/components/site/parallax";
import { ScriptureBand } from "@/components/site/scripture-band";
import { DailyRhythm } from "@/components/site/daily-rhythm";
import { Reveal } from "@/components/site/reveal";
import { VerseOfDay } from "@/components/tools/verse-of-day";
import { CopyEmail } from "@/components/site/copy-email";
import { CHANNEL_URL, CHURCH_EMAIL } from "@/lib/schedule";

export const revalidate = 60;

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function getHomeData() {
  const [{ data: posts }, { data: events }] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("events")
      .select("*")
      .gte("starts_at", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
  ]);

  return {
    posts: (posts ?? []) as Post[],
    events: (events ?? []) as ChurchEvent[],
  };
}

const series = [
  {
    name: "Word for the Month",
    when: "Each new month",
    body: "A prophetic word to carry into the weeks ahead: direction for the season you're actually in.",
    href: "/sermons",
    cta: "Hear this month's word",
  },
  {
    name: "Compass",
    when: "Multi-day series",
    body: "Teaching on discerning direction when the way isn't clear.",
    href: "/sermons",
    cta: "Start the series",
  },
];

const firstWatch = [
  {
    title: "Subscribe on YouTube",
    body: "Every gathering streams on @thecitybuilderscity. Turn on notifications so you know the moment we go live.",
    href: CHANNEL_URL,
    cta: "Open the channel",
    external: true,
  },
  {
    title: "Join a watch",
    body: "Night Watch is at 11:00 PM and Morning Prayers at 7:00 AM, Lagos time, every day. Come as you are and pray along in the chat.",
    href: "/events",
    cta: "See the daily times",
    external: false,
  },
  {
    title: "Tell us you came",
    body: "Send a prayer request or write to the team. We'd love to know your name and pray for your season.",
    href: "/contact",
    cta: "Say hello",
    external: false,
  },
];

export default async function HomePage() {
  const { posts, events } = await getHomeData();

  return (
    <>
      {/* Hero: the city at night, keeping watch */}
      <section className="on-night sky relative overflow-hidden text-starlight">
        <Stars shooting />
        <Celestial />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pt-16 pb-[clamp(11rem,26vw,22rem)] sm:pt-24 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <HeroHeadline
              text="A city whose builder and maker is God."
              className="max-w-3xl font-display text-[clamp(2.9rem,7.5vw,6.25rem)] leading-[0.98]"
            />
            <p className="hero-rise mt-7 max-w-xl [animation-delay:700ms] text-lg leading-relaxed text-starlight-dim">
              The City Builders is Pastor Michael Tomiwa&apos;s ministry of prayer,
              teaching and the prophetic. We help you build strong spiritual
              foundations and understand the season you&apos;re in.
            </p>
            <div className="hero-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:850ms]">
              <a
                href="#watch"
                className="inline-flex h-12 items-center bg-gold px-7 font-medium text-ink shadow-[0_0_30px_-8px_#f0b44c] transition-all hover:-translate-y-0.5 hover:bg-gold-soft"
              >
                Join the watch
              </a>
              <Link
                href="/about"
                className="text-starlight underline decoration-lamp/60 underline-offset-[6px] hover:decoration-lamp"
              >
                New here? Meet the City Builders
              </Link>
            </div>
          </div>

          <WatchClock
            events={events.map((e) => ({
              id: e.id,
              title: e.title,
              starts_at: e.starts_at,
              ends_at: e.ends_at,
              location: e.location,
              description: e.description,
            }))}
          />
        </div>

        <Parallax distance={50} className="pointer-events-none absolute inset-x-0 bottom-0">
          <NightCity className="h-[clamp(9rem,24vw,22rem)] w-full" />
        </Parallax>
      </section>

      {/* The watch: live stream */}
      <section id="watch" className="on-night scroll-mt-20 bg-night text-starlight">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.7fr] lg:gap-14">
          <div>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">Join the watch</h2>
            <p className="mt-5 max-w-sm leading-relaxed text-starlight-dim">
              Every gathering streams live on YouTube. Wherever you are, you can
              pray with us in real time. When we&apos;re live, the stream starts
              here on its own.
            </p>
            <p className="mt-6">
              <Link href="/sermons" className="text-lamp underline-offset-4 hover:underline">
                Browse every past message
              </Link>
            </p>
          </div>
          <LiveStream />
        </div>
        {/* night gives way to morning */}
        <div className="h-32 bg-gradient-to-b from-night to-midnight sm:h-48" aria-hidden="true" />
      </section>

      <ScriptureBand />

      <RecentSessions />

      {/* A word from the pastor */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[minmax(0,320px)_1fr] md:gap-16">
          <div className="relative isolate">
            <Image
              src="/images/pastor-michael-tomiwa.jpg"
              alt="Pastor Michael Tomiwa"
              width={640}
              height={640}
              className="aspect-[4/5] w-full max-w-[320px] object-cover"
            />
            <div className="absolute -bottom-3 -right-3 -z-10 hidden h-full w-full max-w-[320px] border border-gold md:block" aria-hidden="true" />
          </div>
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl text-paper sm:text-5xl">Welcome, friend.</h2>
            <div className="mt-7 space-y-5 text-lg leading-relaxed text-paper-dim">
              <p>
                If you&apos;ve found your way here, it&apos;s not by accident. Every
                season has a word attached to it, and I believe God has been
                preparing you to hear His for this one.
              </p>
              <p>
                At The City Builders, we don&apos;t just gather. We build: through
                prayer in the dead of night, through the Word in the morning, and
                through a community that refuses to let anyone carry their season
                alone. Stay a while, watch a message, bring us your prayer
                request. Let&apos;s build together.
              </p>
            </div>
            <p className="mt-8 font-display text-2xl text-paper">Pastor Michael Tomiwa</p>
          </div>
        </div>
      </section>

      {/* Daily rhythm */}
      <section className="border-t border-steel">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h2 className="font-display text-4xl text-paper sm:text-5xl">Pray with us every day</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-paper-dim">
              Two watches, every day of the week, live on YouTube. The times below
              are Lagos time; we&apos;ll show yours too.
            </p>
          </Reveal>
          <div className="mt-12">
            <DailyRhythm />
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {series.map((r) => (
              <Reveal key={r.name}>
                <p className="text-gold-text">{r.when}</p>
                <h3 className="mt-2 font-display text-3xl text-paper">{r.name}</h3>
                <p className="mt-3 max-w-md leading-relaxed text-paper-dim">{r.body}</p>
                <Link
                  href={r.href}
                  className="mt-3 inline-block text-paper underline decoration-gold underline-offset-[5px] hover:text-gold-text"
                >
                  {r.cta}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Your first watch */}
      <section className="on-night relative overflow-hidden bg-night text-starlight">
        <Stars />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <h2 className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
              New here? Your first watch takes three steps.
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {firstWatch.map((step, i) => (
              <li key={step.title} className="relative border-t border-lamp/50 pt-6">
                <Reveal delay={i * 0.12}>
                  <span className="font-display text-6xl leading-none text-lamp">{i + 1}</span>
                  <h3 className="mt-4 font-display text-2xl">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-starlight-dim">{step.body}</p>
                  {step.external ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-lamp underline-offset-4 hover:underline"
                    >
                      {step.cta}
                    </a>
                  ) : (
                    <Link href={step.href} className="mt-4 inline-block text-lamp underline-offset-4 hover:underline">
                      {step.cta}
                    </Link>
                  )}
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>


      {/* Gatherings + writing */}
      {(events.length > 0 || posts.length > 0) && (
        <section className="border-t border-steel bg-dusk/60">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2">
            {events.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-3xl text-paper">Upcoming gatherings</h2>
                  <Link href="/events" className="shrink-0 text-sm text-gold-text hover:underline">
                    See all
                  </Link>
                </div>
                <ul className="mt-8 border-t border-steel">
                  {events.slice(0, 4).map((event) => (
                    <li key={event.id} className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-steel py-5">
                      <div>
                        <p className="text-paper">{formatDay(event.starts_at)}</p>
                        <p className="text-sm text-paper-dim">{formatTime(event.starts_at)} WAT</p>
                      </div>
                      <div>
                        <p className="font-medium text-paper">{event.title}</p>
                        {event.location && <p className="text-sm text-paper-dim">{event.location}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-3xl text-paper">From the blog</h2>
                  <Link href="/blog" className="shrink-0 text-sm text-gold-text hover:underline">
                    All posts
                  </Link>
                </div>
                <ul className="mt-8 border-t border-steel">
                  {posts.map((post) => (
                    <li key={post.id} className="border-b border-steel">
                      <Link href={`/blog/${post.slug}`} className="group block py-5">
                        <p className="font-display text-xl text-paper group-hover:text-gold-text">
                          {post.title}
                        </p>
                        {post.excerpt && (
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-paper-dim">
                            {post.excerpt}
                          </p>
                        )}
                        {post.published_at && (
                          <p className="mt-2 text-xs text-paper-dim">{formatPostDate(post.published_at)}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Today's word */}
      <section className="border-t border-steel">
        <Reveal className="mx-auto max-w-4xl px-6 py-24">
          <VerseOfDay />
        </Reveal>
      </section>

      {/* Keep building this week */}
      <section className="border-t border-steel">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-3 md:gap-10">
          <div>
            <h2 className="font-display text-2xl text-paper">Tools for the walk</h2>
            <p className="mt-3 leading-relaxed text-paper-dim">
              A verse for today, a prayer timer, a reading plan, a fasting tracker
              and scripture flashcards. Free, right here on the site.
            </p>
            <Link href="/tools" className="mt-4 inline-block text-gold-text underline-offset-4 hover:underline">
              Open the tools
            </Link>
          </div>
          <div>
            <h2 className="font-display text-2xl text-paper">Carrying something heavy?</h2>
            <p className="mt-3 leading-relaxed text-paper-dim">
              Bring it to the prayer wall. We&apos;ll stand with you in prayer,
              whether you share your name or not.
            </p>
            <Link href="/prayer" className="mt-4 inline-block text-gold-text underline-offset-4 hover:underline">
              Send a prayer request
            </Link>
          </div>
          <div>
            <h2 className="font-display text-2xl text-paper">Give toward the work</h2>
            <p className="mt-3 leading-relaxed text-paper-dim">
              Every gift keeps the watch streaming and helps us reach more of the
              city.
            </p>
            <Link href="/give" className="mt-4 inline-block text-gold-text underline-offset-4 hover:underline">
              Give online
            </Link>
          </div>
        </div>
      </section>

      {/* Write to us */}
      <section className="border-t border-steel bg-dusk/60">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-4xl text-paper sm:text-5xl">Write to the builders</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-paper-dim">
              Questions, testimonies, invitations for Pastor Michael, or just
              hello. The team reads every message.
            </p>
          </div>
          <div className="lg:text-right">
            <a
              href={`mailto:${CHURCH_EMAIL}`}
              className="block break-all font-display text-2xl text-gold-text underline-offset-[6px] hover:underline sm:text-3xl"
            >
              {CHURCH_EMAIL}
            </a>
            <div className="mt-3 flex flex-wrap gap-5 text-sm lg:justify-end">
              <CopyEmail className="text-paper-dim underline underline-offset-4 hover:text-paper" />
              <Link href="/contact" className="text-paper-dim underline underline-offset-4 hover:text-paper">
                Use the contact form
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
