import type { Metadata } from "next";
import { getRecentVideos } from "@/lib/youtube";
import { Stars } from "@/components/site/stars";
import { WatchRoom, type Replay } from "@/components/live/watch-room";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Watch live",
  description:
    "The City Builders watch room: the live stream, scripture, prayer points and everyone keeping watch with you. Night Watch 11 PM and Morning Prayers 7 AM, Lagos time.",
};

export default async function LivePage() {
  const [latest] = await getRecentVideos(1).catch(() => []);
  const replay: Replay = latest ? { id: latest.id, title: latest.title, thumbnail: latest.thumbnail } : null;

  return (
    <div className="on-night relative min-h-[calc(100vh-4rem)] overflow-hidden bg-night text-starlight">
      <Stars />
      <div className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
        <h1 className="font-display text-[clamp(2.4rem,5vw,3.75rem)] leading-none">The watch room</h1>
        <p className="mt-3 max-w-xl text-starlight-dim">
          Pray with the whole house in real time. Keep this page open; the stream starts here on its own.
        </p>
      </div>
      <WatchRoom replay={replay} />
    </div>
  );
}
