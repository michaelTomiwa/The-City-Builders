import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { PostList } from "@/components/blog/post-list";
import { topicPosts } from "@/lib/topic-data";
import { instructionArchive, instructionTitle } from "@/lib/instruction";
import { supabase } from "@/lib/supabase";
import { weekLabel } from "@/lib/week";
import { absolute, jsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { info, posts } = await topicPosts(slug);
  if (!posts.length) return { title: "Topic not found" };
  return {
    title: `${info.title}: teachings and prayer points`,
    description: info.intro.slice(0, 155),
    alternates: { canonical: `/topics/${slug}` },
  };
}

export default async function TopicPage({ params }: PageProps<"/topics/[slug]">) {
  const { slug } = await params;
  const { info, posts } = await topicPosts(slug);
  if (!posts.length) notFound();
  // Prayer and fasting pages also point to the weekly prayer points.
  const weeks = ["prayer", "fasting", "night-watch"].includes(slug) ? (await instructionArchive(supabase)).slice(0, 6) : [];

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${info.title} — The City Builders`,
      description: info.intro,
      url: absolute(`/topics/${slug}`),
      hasPart: posts.slice(0, 20).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absolute(`/blog/${p.slug}`) })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Topics", item: absolute("/topics") },
        { "@type": "ListItem", position: 2, name: info.title, item: absolute(`/topics/${slug}`) },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <PageHero title={info.title} intro={info.intro} />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <Link href="/topics" className="text-sm text-gold-text hover:underline">
            ← All topics
          </Link>
          <h2 className="mt-4 font-display text-3xl text-paper">
            {posts.length} {posts.length === 1 ? "teaching" : "teachings"} on {info.title.toLowerCase()}
          </h2>
          <div className="mt-2">
            <PostList posts={posts} />
          </div>
        </section>
        {weeks.length > 0 && (
          <aside className="lg:self-start">
            <h2 className="font-display text-2xl text-paper">Weekly prayer points</h2>
            <ul className="mt-3 space-y-3">
              {weeks.map((w) => (
                <li key={w.week_start}>
                  <Link href={`/week/${w.week_start}`} className="block rounded-sm border border-steel bg-white p-3 hover:border-gold">
                    <span className="block text-xs text-paper-dim">{weekLabel(w.week_start)}</span>
                    <span className="text-sm text-paper">{instructionTitle(w)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}
