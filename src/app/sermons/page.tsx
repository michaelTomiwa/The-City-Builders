import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { getFeedVideos, formatViews } from "@/lib/youtube";
import Image from "next/image";
import { supabase, type Sermon, type Series } from "@/lib/supabase";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Sermons",
  description: "Every Night Watch, Morning Prayer and series message from The City Builders, in one place.",
};

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SermonsPage({
  searchParams,
}: PageProps<"/sermons">) {
  const params = await searchParams;
  const seriesSlug = typeof params.series === "string" ? params.series : undefined;

  const { data: seriesList } = await supabase
    .from("series")
    .select("*")
    .order("title");

  let query = supabase
    .from("sermons")
    .select("*, series:series_id(id,title,slug)")
    .order("streamed_at", { ascending: false });

  if (seriesSlug) {
    const match = (seriesList as Series[] | null)?.find((s) => s.slug === seriesSlug);
    if (match) query = query.eq("series_id", match.id);
  }

  const [{ data: sermons }, fresh] = await Promise.all([query, seriesSlug ? Promise.resolve([]) : getFeedVideos(6)]);
  const list = (sermons ?? []) as Sermon[];

  return (
    <>
      <PageHero
        title={<>The watch, archived.</>}
        intro={<>Every Night Watch, Morning Prayer, and series session — in one place.</>}
      />
    <div className="mx-auto max-w-6xl px-6 py-16">
      {fresh.length > 0 && (
        <section className="mb-20">
          <h2 className="font-display text-4xl text-paper">Fresh from YouTube</h2>
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((video) => (
              <li key={video.id}>
                <a href={video.href} target="_blank" rel="noopener noreferrer" className="group block">
                  <span className="block aspect-video overflow-hidden bg-dusk-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="mt-3 line-clamp-2 block font-display text-xl leading-snug text-paper group-hover:text-gold-text">
                    {video.title}
                  </span>
                  <span className="mt-1 block text-sm text-paper-dim">
                    {formatDate(video.publishedAt)}
                    {formatViews(video.views) && <>, {formatViews(video.views)}</>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="font-display text-4xl text-paper">The archive</h2>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/sermons"
          className={`rounded-sm border px-4 py-1.5 text-sm transition-colors ${
            !seriesSlug ? "border-gold text-gold-text" : "border-steel text-paper-dim hover:text-paper"
          }`}
        >
          All
        </Link>
        {(seriesList as Series[] | null)?.map((s) => (
          <Link
            key={s.id}
            href={`/sermons?series=${s.slug}`}
            className={`rounded-sm border px-4 py-1.5 text-sm transition-colors ${
              seriesSlug === s.slug
                ? "border-gold text-gold-text"
                : "border-steel text-paper-dim hover:text-paper"
            }`}
          >
            {s.title}
          </Link>
        ))}
      </div>

      <Reveal>
        <ul className="mt-12 divide-y divide-steel/60">
          {list.map((sermon) => (
            <li key={sermon.id}>
              <Link
                href={`/sermons/${sermon.slug}`}
                className="group flex items-center gap-5 py-5 transition-transform duration-300 hover:translate-x-1"
              >
                {sermon.thumbnail_url && (
                  <div className="hidden h-16 w-28 shrink-0 overflow-hidden rounded-sm bg-dusk-2 sm:block">
                    <Image
                      src={sermon.thumbnail_url}
                      alt=""
                      width={224}
                      height={126}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="w-44 shrink-0 text-sm text-paper-dim">
                    {formatDate(sermon.streamed_at)}
                  </span>
                  <div>
                    <p className="text-xs text-gold-text">{sermon.series?.title ?? "Message"}</p>
                    <h2 className="mt-1 font-display text-xl text-paper group-hover:text-gold-text">
                      {sermon.title}
                    </h2>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {list.length === 0 && (
            <li className="py-12 text-paper-dim">No messages here yet — check back soon.</li>
          )}
        </ul>
      </Reveal>
    </div>
    </>
  );
}
