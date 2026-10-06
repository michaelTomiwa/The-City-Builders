import Link from "next/link";
import { getRecentVideos, formatViews, type Video } from "@/lib/youtube";
import { CHANNEL_URL } from "@/lib/schedule";
import { LiteYouTube } from "./lite-youtube";
import { Reveal } from "./reveal";

function when(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Meta({ video }: { video: Video }) {
  const views = formatViews(video.views);
  return (
    <p className="text-sm text-paper-dim">
      {when(video.publishedAt)}
      {views && <>, {views}</>}
    </p>
  );
}

function VideoLink({ video, children, className }: { video: Video; children: React.ReactNode; className?: string }) {
  return video.external ? (
    <a href={video.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={video.href} className={className}>
      {children}
    </Link>
  );
}

/** The five most recent sessions: the newest plays in place, the next four line up beside it. */
export async function RecentSessions() {
  const videos = await getRecentVideos(5);
  if (videos.length === 0) return null;
  const [latest, ...rest] = videos;

  return (
    <section className="border-t border-steel">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl text-paper sm:text-5xl">Recent sessions</h2>
            <p className="mt-3 max-w-lg leading-relaxed text-paper-dim">
              Missed a watch? Catch up on the latest five, straight from our
              YouTube channel.
            </p>
          </div>
          <div className="flex gap-5 text-sm">
            <Link href="/sermons" className="text-gold-text underline-offset-4 hover:underline">
              Every past session
            </Link>
            <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-gold-text underline-offset-4 hover:underline">
              YouTube channel
            </a>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
          <Reveal>
            <div className="relative">
              <span className="absolute -top-3 left-4 z-10 bg-gold px-3 py-1 text-xs font-medium text-ink">Latest</span>
              <LiteYouTube id={latest.id} title={latest.title} thumbnail={latest.thumbnail} />
            </div>
            <VideoLink video={latest} className="group mt-5 block">
              <h3 className="font-display text-2xl leading-snug text-paper group-hover:text-gold-text sm:text-3xl">
                {latest.title}
              </h3>
            </VideoLink>
            <div className="mt-2">
              <Meta video={latest} />
            </div>
          </Reveal>

          <ol className="flex flex-col divide-y divide-steel border-y border-steel">
            {rest.map((video, i) => (
              <li key={video.id}>
                <Reveal delay={i * 0.08}>
                  <VideoLink video={video} className="group grid grid-cols-[8.5rem_1fr] gap-4 py-4 sm:grid-cols-[10rem_1fr]">
                    <span className="relative block aspect-video overflow-hidden bg-dusk-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-ink">
                          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-col justify-center">
                      <span className="line-clamp-2 font-medium leading-snug text-paper group-hover:text-gold-text">
                        {video.title}
                      </span>
                      <span className="mt-1">
                        <Meta video={video} />
                      </span>
                    </span>
                  </VideoLink>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
