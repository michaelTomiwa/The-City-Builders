import Link from "next/link";
import Image from "next/image";
import { supabase, type Sermon, type Series } from "@/lib/supabase";
import { Reveal } from "@/components/site/reveal";

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

  const { data: sermons } = await query;
  const list = (sermons ?? []) as Sermon[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm text-paper-dim">Messages &amp; streams</p>
      <h1 className="mt-3 font-display text-4xl text-paper sm:text-5xl">
        The watch, archived.
      </h1>
      <p className="mt-4 max-w-xl text-paper-dim leading-relaxed">
        Every Night Watch, Morning Prayer, and series session — in one place.
      </p>

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
  );
}
