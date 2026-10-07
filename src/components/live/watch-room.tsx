"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHANNEL_ID } from "@/lib/youtube";
import { STREAMS_URL, liveService, serviceOccurrences } from "@/lib/schedule";
import { verses } from "@/lib/verses";
import { LiteYouTube } from "@/components/site/lite-youtube";
import { NotifyMe } from "@/components/site/notify-me";
import { PrayingNow, usePrayingNow } from "./praying-now";

export type Replay = { id: string; title: string; thumbnail: string } | null;

const prompts: Record<string, string[]> = {
  "night-watch": [
    "Thank Him for the day that is ending.",
    "Pray for your city, Lagos and wherever you are tonight.",
    "Lift your family to Him, one name at a time.",
    "Ask for the word over this season of your life.",
    "Stand in the gap for someone who can't pray tonight.",
  ],
  "morning-prayers": [
    "Give Him the first words of your day.",
    "Commit your work, plans and appointments to Him.",
    "Ask for wisdom in every decision ahead.",
    "Bless the people you will meet today.",
  ],
};

function lagosTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { v: Math.floor(s / 3600), l: "hours" },
    { v: Math.floor((s % 3600) / 60), l: "minutes" },
    { v: s % 60, l: "seconds" },
  ];
}

function verseFor(now: number) {
  const day = Math.floor((now + 3600_000) / 86_400_000);
  return verses[day % verses.length];
}

export function WatchRoom({ replay }: { replay: Replay }) {
  const [now, setNow] = useState<number | null>(null);
  const [forcePlayer, setForcePlayer] = useState(false);
  const [copied, setCopied] = useState(false);
  const praying = usePrayingNow();

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const live = now ? liveService(now) : undefined;
  const next = now ? serviceOccurrences(now, 2).find((o) => new Date(o.starts_at).getTime() > now) : undefined;
  const focusId = (live ?? next)?.id.startsWith("morning") ? "morning-prayers" : "night-watch";
  const verse = verseFor(now ?? 0);

  async function share() {
    const url = `${window.location.origin}/live`;
    const text = live ? `${live.title} is live now. Come and pray with us.` : "Keep watch with The City Builders.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "The City Builders, live", text, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-10 lg:gap-y-12">
      {/* The stage */}
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <AnimatePresence mode="wait">
            {now === null ? (
              <span key="wait" className="h-7" />
            ) : live ? (
              <motion.p
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#e55a3c]/60 bg-[#e55a3c]/10 px-3 py-1 text-sm text-starlight"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e55a3c] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e55a3c]" />
                </span>
                {live.title} is live, since {lagosTime(new Date(live.starts_at).getTime())}
              </motion.p>
            ) : (
              <motion.p key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-starlight-dim">
                It&rsquo;s {lagosTime(now)} in Lagos. We&rsquo;re off air right now.
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 text-sm text-lamp underline-offset-4 hover:underline"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v13m0-13-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {copied ? "Link copied" : "Invite someone"}
          </button>
        </div>

        <div className="overflow-hidden border border-night-3 bg-night-2 shadow-[0_0_80px_-30px_rgba(240,180,76,0.45)]">
          {live || forcePlayer ? (
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1`}
              title="The City Builders, live"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden px-6 text-center">
              <div
                className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[120%] w-[90%] -translate-x-1/2 rounded-full bg-lamp/10 blur-3xl"
                aria-hidden="true"
              />
              {next && now !== null ? (
                <>
                  <p className="relative text-sm text-starlight-dim sm:text-base">Next on air</p>
                  <p className="relative mt-1 font-display text-3xl text-starlight sm:text-5xl">{next.title}</p>
                  <p className="relative mt-1 text-sm text-starlight-dim">{lagosTime(new Date(next.starts_at).getTime())}, Lagos time</p>
                  <div className="relative mt-5 flex gap-4 sm:mt-8 sm:gap-8" aria-hidden="true">
                    {parts(new Date(next.starts_at).getTime() - now).map((p) => (
                      <div key={p.l} className="min-w-[3.5rem] sm:min-w-[5.5rem]">
                        <p className="font-display text-4xl tabular-nums text-lamp sm:text-7xl">{String(p.v).padStart(2, "0")}</p>
                        <p className="mt-1 text-xs text-starlight-dim sm:text-sm">{p.l}</p>
                      </div>
                    ))}
                  </div>
                  <p className="sr-only">
                    {next.title} starts at {lagosTime(new Date(next.starts_at).getTime())} Lagos time.
                  </p>
                </>
              ) : (
                <span className="h-40" />
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
          {!live && <NotifyMe />}
          <p className="text-sm text-starlight-dim">
            {live ? (
              <>
                Stream not loading?{" "}
                <a href={STREAMS_URL} target="_blank" rel="noopener noreferrer" className="text-lamp underline-offset-4 hover:underline">
                  Watch on YouTube
                </a>
              </>
            ) : (
              <>
                Starting early?{" "}
                <button type="button" onClick={() => setForcePlayer(true)} className="text-lamp underline-offset-4 hover:underline">
                  Open the live player
                </button>
              </>
            )}
          </p>
        </div>

      </div>

      {/* The side panel */}
      <aside className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <section className="border border-night-3 bg-night-2/70 p-6 backdrop-blur-sm">
          <h2 className="sr-only">Who is here</h2>
          <PrayingNow count={praying} />
        </section>

        <section className="border border-night-3 bg-night-2/70 p-6 backdrop-blur-sm">
          <h2 className="text-sm text-lamp">Scripture for the watch</h2>
          <blockquote className="mt-3 font-display text-2xl leading-snug text-starlight">&ldquo;{verse.text}&rdquo;</blockquote>
          <p className="mt-3 text-sm text-starlight-dim">{verse.reference}</p>
        </section>

        <section className="border border-night-3 bg-night-2/70 p-6 backdrop-blur-sm">
          <h2 className="text-sm text-lamp">Pray along</h2>
          <ol className="mt-4 space-y-3">
            {prompts[focusId].map((p, i) => (
              <li key={p} className="grid grid-cols-[1.75rem_1fr] gap-2 leading-snug text-starlight">
                <span className="font-display text-lg leading-tight text-lamp/80">{i + 1}</span>
                {p}
              </li>
            ))}
          </ol>
          <a href="/prayer" className="mt-5 inline-block text-sm text-lamp underline-offset-4 hover:underline">
            Need prayer? Post on the prayer wall
          </a>
        </section>
      </aside>

      {!live && replay && (
        <div className="min-w-0 lg:col-start-1">
          <h2 className="font-display text-2xl text-starlight">While you wait, the last watch</h2>
          <div className="mt-4 max-w-2xl overflow-hidden border border-night-3">
            <LiteYouTube id={replay.id} title={replay.title} thumbnail={replay.thumbnail} />
          </div>
          <p className="mt-3 text-starlight">{replay.title}</p>
        </div>
      )}
    </div>
  );
}
