import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, type Sermon } from "@/lib/supabase";

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SermonPage({ params }: PageProps<"/sermons/[slug]">) {
  const { slug } = await params;

  const { data } = await supabase
    .from("sermons")
    .select("*, series:series_id(id,title,slug)")
    .eq("slug", slug)
    .maybeSingle();

  const sermon = data as Sermon | null;
  if (!sermon) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/sermons" className="text-sm text-paper-dim hover:text-gold-text">
        ← All messages
      </Link>

      <p className="mt-6 text-sm text-gold-text">{sermon.series?.title ?? "Message"}</p>
      <h1 className="mt-2 font-display text-4xl text-paper sm:text-5xl">
        {sermon.title}
      </h1>
      <p className="mt-4 text-sm text-paper-dim">
        {sermon.speaker} · {formatDate(sermon.streamed_at)}
      </p>

      {sermon.description && (
        <p className="prose-sermon mt-8 text-lg leading-relaxed text-paper-dim">
          {sermon.description}
        </p>
      )}

      {sermon.youtube_video_id ? (
        <div className="mt-8 aspect-video w-full overflow-hidden rounded-sm border border-steel">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${sermon.youtube_video_id}`}
            title={sermon.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        sermon.youtube_url && (
          <a
            href={sermon.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-sm bg-gold px-6 py-2.5 text-sm font-medium text-ink hover:bg-gold-soft"
          >
            Watch on YouTube
          </a>
        )
      )}
    </article>
  );
}
