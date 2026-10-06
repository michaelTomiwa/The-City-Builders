import { supabase } from "@/lib/supabase";

export const CHANNEL_ID = "UCfzlRhIdzvmFSpc6sx4NyMg";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export type Video = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number | null;
  description: string | null;
  /** our own sermon page when we have one, otherwise YouTube */
  href: string;
  external: boolean;
};

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
}

function attr(xml: string, name: string, attribute: string) {
  const m = xml.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]*)"`));
  return m ? decode(m[1]) : null;
}

/** Parses YouTube's public channel feed (the last 15 uploads and streams). */
export function parseFeed(xml: string) {
  const entries = xml.split("<entry>").slice(1);
  return entries
    .map((entry) => {
      const id = tag(entry, "yt:videoId");
      if (!id) return null;
      const views = attr(entry, "media:statistics", "views");
      return {
        id,
        title: tag(entry, "title") ?? "Untitled",
        publishedAt: tag(entry, "published") ?? new Date().toISOString(),
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        views: views ? Number(views) : null,
        description: tag(entry, "media:description"),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

async function fetchFeed() {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch {
    return [];
  }
}

/**
 * The most recent sessions: straight from YouTube when the feed answers,
 * otherwise from our own sermon archive.
 */
export async function getRecentVideos(limit = 5): Promise<Video[]> {
  const [feed, { data: sermons }] = await Promise.all([
    fetchFeed(),
    supabase
      .from("sermons")
      .select("slug, title, youtube_video_id, thumbnail_url, description, streamed_at")
      .order("streamed_at", { ascending: false })
      .limit(40),
  ]);

  const archive = sermons ?? [];
  const slugByVideo = new Map(
    archive.filter((s) => s.youtube_video_id).map((s) => [s.youtube_video_id as string, s.slug as string])
  );

  if (feed.length > 0) {
    return feed.slice(0, limit).map((v) => {
      const slug = slugByVideo.get(v.id);
      return {
        ...v,
        href: slug ? `/sermons/${slug}` : `https://www.youtube.com/watch?v=${v.id}`,
        external: !slug,
      };
    });
  }

  return archive.slice(0, limit).map((s) => ({
    id: s.youtube_video_id ?? s.slug,
    title: s.title,
    publishedAt: s.streamed_at,
    thumbnail:
      s.thumbnail_url ??
      (s.youtube_video_id ? `https://i.ytimg.com/vi/${s.youtube_video_id}/hqdefault.jpg` : "/images/about-illustration.jpg"),
    views: null,
    description: s.description,
    href: `/sermons/${s.slug}`,
    external: false,
  }));
}

export function formatViews(n: number | null) {
  if (n === null) return null;
  if (n < 1000) return `${n} views`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K views`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
}

/** Only what YouTube itself returns (empty when the feed can't be reached). */
export async function getFeedVideos(limit = 6): Promise<Video[]> {
  const feed = await fetchFeed();
  return feed.slice(0, limit).map((v) => ({
    ...v,
    href: `https://www.youtube.com/watch?v=${v.id}`,
    external: true,
  }));
}
