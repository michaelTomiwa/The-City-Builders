import Link from "next/link";
import type { Post } from "@/lib/supabase";
import { readingMinutes, wordLabel } from "@/lib/blog";
import { serviceOccurrences } from "@/lib/schedule";
import { dayNames, fastDaysLabel, passageLink, todayFrom, lagosDayNumber, type Instruction } from "@/lib/instruction";
import { absolute } from "@/lib/seo";
import { WhatsAppShare } from "./whatsapp-share";
import { CoverImg } from "./cover-img";

/** The next service from now, in words: "Night Watch, tonight at 11 PM". */
function nextService(now = Date.now()) {
  const next = serviceOccurrences(now, 2).find((o) => Date.parse(o.starts_at) > now);
  if (!next) return null;
  const today = new Date(now + 3600_000).toISOString().slice(0, 10);
  const startLagos = new Date(Date.parse(next.starts_at) + 3600_000);
  const day = startLagos.toISOString().slice(0, 10) === today ? (startLagos.getUTCHours() >= 17 ? "tonight" : "today") : "tomorrow";
  const time = startLagos.getUTCHours() === 23 ? "11 PM" : `${((startLagos.getUTCHours() + 11) % 12) + 1} AM`;
  const minutes = Math.round((Date.parse(next.starts_at) - now) / 60_000);
  const soon = minutes <= 90 ? (minutes <= 60 ? `in ${minutes} min` : "in about an hour") : null;
  return { name: next.title, when: `${day} at ${time}`, soon };
}

function todayName(now = Date.now()) {
  return new Date(now).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "Africa/Lagos" });
}

/**
 * Near the top of the home page: the newest post as "This morning's word" or
 * "Tonight's word", with what today holds at the church beside it. It changes
 * through the day, so there's always a reason to come back.
 */
export function TodaysWord({ post, more, instruction }: { post: Post | null; more: Post[]; instruction: Instruction | null }) {
  const service = nextService();
  const day = lagosDayNumber();
  const today = instruction ? todayFrom(instruction, day) : null;

  return (
    <section className="border-b border-steel bg-[#fbf8f2]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:py-16">
        {post ? (
          <article className="group overflow-hidden rounded-md border border-steel bg-white sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-night sm:aspect-auto sm:min-h-72">
              {post.cover_image_url ? (
                <CoverImg src={post.cover_image_url} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              ) : (
                <span className="flex h-full min-h-48 items-center justify-center p-6 text-center font-display text-2xl text-lamp">{post.title}</span>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink shadow">{wordLabel(post.published_at)}</span>
            </Link>
            <div className="flex flex-col p-6 sm:p-7">
              <p className="text-sm text-gold-text">From Pastor Michael Tomiwa · {readingMinutes(post.content)} min read</p>
              <h2 className="mt-2 font-display text-3xl leading-tight text-paper">
                <Link href={`/blog/${post.slug}`} className="hover:text-gold-text">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && <p className="mt-3 leading-relaxed text-paper-dim">{post.excerpt}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                <Link href={`/blog/${post.slug}`} className="rounded-sm bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-soft">
                  Read it now
                </Link>
                <WhatsAppShare size="sm" label="Share" text={`*${post.title}*\nA word from Pastor Michael Tomiwa${post.excerpt ? `: ${post.excerpt}` : ""}`} url={absolute(`/blog/${post.slug}`)} />
              </div>
            </div>
          </article>
        ) : (
          <div />
        )}

        <aside className="on-night flex flex-col rounded-md bg-night p-6 text-starlight sm:p-7">
          <p className="text-sm text-lamp">{todayName()}</p>
          <h2 className="mt-1 font-display text-2xl">Today at The City Builders</h2>
          <ul className="mt-5 space-y-4 text-sm">
            {service && (
              <li className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5">🕯️</span>
                <span>
                  <span className="block text-starlight">
                    {service.name}, {service.when}
                    {service.soon && <span className="ml-2 rounded-full bg-lamp px-2 py-0.5 text-xs font-medium text-ink">{service.soon}</span>}
                  </span>
                  <Link href="/live" className="text-lamp hover:underline">
                    Join us live →
                  </Link>
                </span>
              </li>
            )}
            {instruction && today && (
              <li className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5">{today.fasting ? "🍽️" : "📖"}</span>
                <span>
                  <span className="block text-starlight">
                    {today.fasting
                      ? `${dayNames[day - 1]} is a fast day${instruction.fast_plan ? `: ${instruction.fast_plan}` : ""}`
                      : instruction.fast_days.length
                        ? `This week we fast on ${fastDaysLabel(instruction.fast_days)}`
                        : `This week: ${instruction.theme}`}
                  </span>
                  {today.reading ? (
                    <a href={passageLink(today.reading)} target="_blank" rel="noopener noreferrer" className="text-lamp hover:underline">
                      Today&apos;s reading: {today.reading} →
                    </a>
                  ) : (
                    <Link href="/week" className="text-lamp hover:underline">
                      This week&apos;s prayer points →
                    </Link>
                  )}
                </span>
              </li>
            )}
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5">🙏</span>
              <span>
                <span className="block text-starlight">Need prayer today?</span>
                <Link href="/prayer" className="text-lamp hover:underline">
                  Write it on the prayer wall →
                </Link>
              </span>
            </li>
          </ul>
          {more.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs uppercase tracking-wide text-starlight-dim">Earlier words</p>
              <ul className="mt-2 space-y-2">
                {more.map((p) => (
                  <li key={p.id}>
                    <Link href={`/blog/${p.slug}`} className="block text-sm leading-snug text-starlight hover:text-lamp">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
