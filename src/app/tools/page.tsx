import type { Metadata } from "next";
import { VerseOfDay } from "@/components/tools/verse-of-day";
import { PrayerTimer } from "@/components/tools/prayer-timer";
import { ReadingPlan } from "@/components/tools/reading-plan";
import { FastingTracker } from "@/components/tools/fasting-tracker";
import { ScriptureFlashcards } from "@/components/tools/scripture-flashcards";
import { WorshipEmbed } from "@/components/tools/worship-embed";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Resources — The City Builders",
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm text-paper-dim">Resources</p>
      <h1 className="mt-3 font-display text-4xl text-paper sm:text-5xl">
        Tools to help you build.
      </h1>
      <p className="mt-4 max-w-xl text-paper-dim leading-relaxed">
        Small tools for the walk — a word for today, a space to pray, a plan to
        read, a fast to keep. Everything here stays on your device.
      </p>

      <div className="mt-16 space-y-16">
        <Reveal>
          <section>
            <h2 className="font-display text-xl text-paper">Today&apos;s word</h2>
            <div className="mt-6">
              <VerseOfDay />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-t border-steel/60 pt-16">
            <h2 className="font-display text-xl text-paper">Prayer timer</h2>
            <p className="mt-2 max-w-md text-paper-dim">
              Set aside focused time, Night Watch style.
            </p>
            <div className="mt-6">
              <PrayerTimer />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-t border-steel/60 pt-16">
            <h2 className="font-display text-xl text-paper">Weekly reading plan</h2>
            <p className="mt-2 max-w-md text-paper-dim">
              Seven short readings, one for each day of the week.
            </p>
            <div className="mt-6 max-w-md">
              <ReadingPlan />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-t border-steel/60 pt-16">
            <h2 className="font-display text-xl text-paper">Fasting tracker</h2>
            <p className="mt-2 max-w-md text-paper-dim">
              Start a fast, mark each day you keep it.
            </p>
            <div className="mt-6">
              <FastingTracker />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-t border-steel/60 pt-16">
            <h2 className="font-display text-xl text-paper">Scripture memory</h2>
            <p className="mt-2 max-w-md text-paper-dim">
              Flashcards for the verses that carry a season.
            </p>
            <div className="mt-6 max-w-md">
              <ScriptureFlashcards />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-t border-steel/60 pt-16">
            <h2 className="font-display text-xl text-paper">Worship with us</h2>
            <p className="mt-2 max-w-md text-paper-dim">
              A message from a recent Night Watch.
            </p>
            <div className="mt-6 max-w-2xl">
              <WorshipEmbed />
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
