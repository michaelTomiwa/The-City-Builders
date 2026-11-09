import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { allTopics } from "@/lib/topic-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Topics",
  description: "Teachings from The City Builders by topic: prayer, fasting, seasons, faith, the prophetic and more.",
  alternates: { canonical: "/topics" },
};

export default async function TopicsPage() {
  const topics = await allTopics();
  return (
    <>
      <PageHero title="Teachings by topic." intro="Prayer, fasting, seasons, faith and more: everything we've written, gathered by theme." />
      <div className="mx-auto max-w-6xl px-6 py-16">
        {topics.length === 0 ? (
          <p className="text-paper-dim">Topics will appear here as posts are published.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link href={`/topics/${t.slug}`} className="flex items-center justify-between rounded-md border border-steel bg-white px-5 py-4 transition-colors hover:border-gold">
                  <span className="font-display text-2xl text-paper">{t.title}</span>
                  <span className="text-sm text-paper-dim">
                    {t.count} {t.count === 1 ? "post" : "posts"}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/week" className="flex items-center justify-between rounded-md border border-gold/50 bg-[#fdf7ea] px-5 py-4 transition-colors hover:border-gold">
                <span className="font-display text-2xl text-paper">Weekly prayer points</span>
                <span className="text-sm text-gold-text">Every week →</span>
              </Link>
            </li>
          </ul>
        )}
      </div>
    </>
  );
}
