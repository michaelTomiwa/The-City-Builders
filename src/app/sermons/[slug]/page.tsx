import type { Metadata } from "next";
import Link from "next/link";
import { absolute, jsonLd } from "@/lib/seo";
import { WhatsAppShare } from "@/components/site/whatsapp-share";
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

export async function generateMetadata({ params }: PageProps<"/sermons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from("sermons").select("title, description, speaker").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Message not found" };
  const description = data.description ?? `A message from ${data.speaker} at The City Builders.`;
  return {
    title: data.title,
    description,
    alternates: { canonical: `/sermons/${slug}` },
    openGraph: { title: data.title, description, type: "video.other", url: `/sermons/${slug}` },
  };
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

  const videoLd = sermon.youtube_video_id
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: sermon.title,
        description: sermon.description ?? `A message from ${sermon.speaker} at The City Builders.`,
        thumbnailUrl: sermon.thumbnail_url ? absolute(sermon.thumbnail_url) : `https://i.ytimg.com/vi/${sermon.youtube_video_id}/hqdefault.jpg`,
        uploadDate: sermon.streamed_at,
        embedUrl: `https://www.youtube.com/embed/${sermon.youtube_video_id}`,
        contentUrl: `https://www.youtube.com/watch?v=${sermon.youtube_video_id}`,
        ...(sermon.duration_seconds ? { duration: `PT${Math.round(sermon.duration_seconds / 60)}M` } : {}),
        publisher: { "@type": "Church", name: "The City Builders" },
      }
    : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {videoLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(videoLd)} />}
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
      <WhatsAppShare
        className="mt-5"
        text={`*${sermon.title}*\nWatch this message from ${sermon.speaker} at The City Builders.`}
        url={absolute(`/sermons/${sermon.slug}`)}
      />

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
