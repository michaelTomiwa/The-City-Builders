import Link from "next/link";
import Image from "next/image";
import { supabase, type Sermon } from "@/lib/supabase";
import { Reveal } from "@/components/site/reveal";

export async function MomentsGallery() {
  const { data } = await supabase
    .from("sermons")
    .select("id, title, slug, thumbnail_url")
    .not("thumbnail_url", "is", null)
    .order("streamed_at", { ascending: false })
    .limit(7);

  const sermons = (data ?? []) as Pick<Sermon, "id" | "title" | "slug" | "thumbnail_url">[];
  if (sermons.length === 0) return null;

  const spans = [
    "sm:col-span-4 sm:row-span-2",
    "sm:col-span-2",
    "sm:col-span-2",
    "sm:col-span-3",
    "sm:col-span-3",
    "sm:col-span-3",
    "sm:col-span-3",
  ];

  return (
    <section className="border-t border-steel/60">
      <Reveal className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl text-paper">Moments from the watch</h2>
            <p className="mt-3 max-w-md text-paper-dim leading-relaxed">
              Teachings, prayer watches, and messages — straight from our own
              services.
            </p>
          </div>
          <Link href="/sermons" className="hidden text-sm text-paper-dim hover:text-gold-text sm:block">
            All messages
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4 sm:[grid-auto-rows:130px]">
          {sermons.map((sermon, i) => (
            <Link
              key={sermon.id}
              href={`/sermons/${sermon.slug}`}
              className={`group relative block aspect-video overflow-hidden rounded-sm bg-dusk-2 sm:aspect-auto ${spans[i] ?? "sm:col-span-2"}`}
            >
              <Image
                src={sermon.thumbnail_url!}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <p className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-sm font-medium text-paper opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {sermon.title}
              </p>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
