import Link from "next/link";
import Image from "next/image";
import { supabase, type Sermon, type Post, type ChurchEvent } from "@/lib/supabase";
import { Skyline } from "@/components/site/skyline";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getHomeData() {
  const [{ data: sermons }, { data: posts }, { data: events }] = await Promise.all([
    supabase
      .from("sermons")
      .select("*, series:series_id(id,title,slug)")
      .order("streamed_at", { ascending: false })
      .limit(3),
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
      .limit(4),
  ]);

  return {
    sermons: (sermons ?? []) as Sermon[],
    posts: (posts ?? []) as Post[],
    events: (events ?? []) as ChurchEvent[],
  };
}

export default async function HomePage() {
  const { sermons, posts, events } = await getHomeData();
  const nextEvent = events[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/hero-design-export.jpg"
          alt=""
          width={1199}
          height={685}
          priority
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-10 hidden w-[640px] opacity-80 sm:block lg:w-[760px]"
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 sm:pt-24">
          <p className="text-sm text-paper-dim">The City Builders · Pastor Michael Tomiwa</p>
          <h1 className="mt-6 max-w-3xl font-display text-[2.75rem] leading-[1.05] text-paper sm:text-6xl">
            A city whose builder and maker is God.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
            We teach, equip, and inspire you to build strong spiritual foundations,
            walk in clarity, and mature in your purpose — one watch, one word, one
            season at a time.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild>
              <a href="https://www.youtube.com/@thecitybuilderscity/streams" target="_blank" rel="noopener noreferrer">
                Watch live
              </a>
            </Button>
            <Link href="/blog" className="text-sm text-paper-dim hover:text-gold-text">
              Read the blog
            </Link>
          </div>

          {nextEvent && (
            <div className="mt-10 inline-flex items-center gap-3 border-l-2 border-gold pl-4 text-sm">
              <span className="text-paper-dim">Next gathering</span>
              <span className="text-paper">
                {nextEvent.title} — {formatDate(nextEvent.starts_at)}, {formatTime(nextEvent.starts_at)}
              </span>
            </div>
          )}
        </div>

        <Skyline className="h-40 w-full sm:h-56" />
      </section>

      {/* Welcome from the pastor */}
      <section className="border-t border-steel/60 bg-dusk/40">
        <Reveal className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-14">
          <Image
            src="/images/pastor-michael-tomiwa.jpg"
            alt="Pastor Michael Tomiwa"
            width={176}
            height={176}
            className="h-36 w-36 rounded-sm object-cover sm:h-44 sm:w-44"
            priority
          />
          <div>
            <p className="text-sm text-paper-dim">A word from Pastor Michael</p>
            <h2 className="mt-2 font-display text-3xl text-paper">
              Welcome, friend.
            </h2>
            <div className="mt-5 max-w-2xl space-y-4 text-paper-dim leading-relaxed">
              <p>
                If you&apos;ve found your way here, it&apos;s not by accident. Every
                season has a word attached to it, and I believe God has been
                preparing you to hear His for this one.
              </p>
              <p>
                At The City Builders, we don&apos;t just gather — we build. We build
                through prayer in the dead of night, through the Word in the
                morning, and through a community that refuses to let anyone carry
                their season alone. Whatever brought you to this page, I&apos;m
                glad you&apos;re here. Stay a while, read a message, bring us your
                prayer request — let&apos;s build together.
              </p>
            </div>
            <p className="mt-6 font-display text-lg text-paper">
              Pastor Michael Tomiwa
            </p>
          </div>
        </Reveal>
      </section>

      {/* What we build */}
      <section className="border-t border-steel/60">
        <Reveal className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl text-paper">What we build here</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-12">
            <div className="md:col-span-7 border-l border-steel/60 pl-6">
              <h3 className="font-display text-2xl text-gold-text">Night Watch</h3>
              <p className="mt-3 max-w-md text-paper-dim leading-relaxed">
                Late into the night, we stand watch in prayer and the prophetic word —
                contending for the season ahead, together.
              </p>
              <Link href="/sermons?series=night-watch" className="mt-4 inline-block text-sm text-paper hover:text-gold-text">
                Enter the watch
              </Link>
            </div>
            <div className="md:col-span-5 border-l border-steel/60 pl-6">
              <h3 className="font-display text-xl text-gold-text">Morning Prayers</h3>
              <p className="mt-3 text-paper-dim leading-relaxed">
                Begin the day anchored in prayer before the world asks anything of you.
              </p>
            </div>
            <div className="md:col-span-5 border-l border-steel/60 pl-6">
              <h3 className="font-display text-xl text-gold-text">Compass</h3>
              <p className="mt-3 text-paper-dim leading-relaxed">
                A multi-day series on discerning direction when the way isn&apos;t clear.
              </p>
            </div>
            <div className="md:col-span-7 border-l border-steel/60 pl-6">
              <h3 className="font-display text-2xl text-gold-text">Word for the Month</h3>
              <p className="mt-3 max-w-md text-paper-dim leading-relaxed">
                A prophetic word to carry into the weeks ahead — direction for the
                season you&apos;re actually in.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Latest from the watch */}
      {sermons.length > 0 && (
        <section className="border-t border-steel/60 bg-dusk/50">
          <Reveal className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl text-paper">Latest from the watch</h2>
              <Link href="/sermons" className="text-sm text-paper-dim hover:text-gold-text">
                All messages
              </Link>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {sermons.map((sermon) => (
                <Link
                  key={sermon.id}
                  href={`/sermons/${sermon.slug}`}
                  className="group block border-t border-steel/60 pt-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-xs text-paper-dim">
                    {sermon.series?.title ?? "Message"} · {formatDate(sermon.streamed_at)}
                  </p>
                  <h3 className="mt-2 font-display text-xl text-paper group-hover:text-gold-text">
                    {sermon.title}
                  </h3>
                  {sermon.description && (
                    <p className="mt-2 text-sm text-paper-dim line-clamp-2">
                      {sermon.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* From the blog */}
      {posts.length > 0 && (
        <section className="border-t border-steel/60">
          <Reveal className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl text-paper">From the blog</h2>
              <Link href="/blog" className="text-sm text-paper-dim hover:text-gold-text">
                All posts
              </Link>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block border-t border-steel/60 pt-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-xs text-paper-dim">
                    {post.published_at && formatDate(post.published_at)}
                  </p>
                  <h3 className="mt-2 font-display text-xl text-paper group-hover:text-gold-text">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-paper-dim line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Upcoming gatherings */}
      {events.length > 0 && (
        <section className="border-t border-steel/60 bg-dusk/50">
          <Reveal className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-3xl text-paper">Upcoming gatherings</h2>
            <ul className="mt-10 divide-y divide-steel/60">
              {events.map((event) => (
                <li key={event.id} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="w-48 shrink-0 text-sm text-gold-text">
                    {formatDate(event.starts_at)}
                  </span>
                  <div>
                    <p className="text-paper">{event.title}</p>
                    {event.location && (
                      <p className="text-sm text-paper-dim">{event.location}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* Resources teaser */}
      <section className="border-t border-steel/60 bg-dusk/40">
        <Reveal className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-paper">Tools for the walk</h2>
              <p className="mt-3 max-w-md text-paper-dim leading-relaxed">
                A verse for today, a prayer timer, a reading plan, a fasting
                tracker, scripture flashcards, and a message to watch — free to
                use, right on this site.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-block shrink-0 text-sm text-gold-text hover:text-ink"
            >
              Open resources
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Prayer + Give */}
      <section className="border-t border-steel/60">
        <Reveal className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-2">
          <div className="border-l-2 border-violet pl-6">
            <h2 className="font-display text-2xl text-paper">Carrying something heavy?</h2>
            <p className="mt-3 text-paper-dim leading-relaxed">
              Bring it to the wall. Our community stands with you in prayer, whether
              you share your name or not.
            </p>
            <Link href="/prayer" className="mt-4 inline-block text-sm text-gold-text hover:text-ink">
              Ask us to pray
            </Link>
          </div>
          <div className="border-l-2 border-gold pl-6">
            <h2 className="font-display text-2xl text-paper">Give toward the work</h2>
            <p className="mt-3 text-paper-dim leading-relaxed">
              Every gift helps us keep the watch running and reach more of the city.
            </p>
            <Link href="/give" className="mt-4 inline-block text-sm text-gold-text hover:text-ink">
              Give online
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
