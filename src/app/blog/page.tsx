import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { supabase, type Post } from "@/lib/supabase";
import { Reveal } from "@/components/site/reveal";
import { withStats, formatPostDate, formatCount, compact } from "@/lib/blog";
import { CoverArt } from "@/components/blog/cover-art";
import { PostMeta } from "@/components/blog/post-meta";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { SubscribeForm } from "@/components/site/subscribe-form";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "Reflections, teaching notes and words for the season from Pastor Michael Tomiwa and the City Builders team.",
};

export default async function BlogPage() {
  const { data } = await supabase
    .from("posts")
    .select("*, post_comments(count)")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const posts = withStats((data ?? []) as (Post & { post_comments?: { count: number }[] })[]);
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags ?? []))).sort();
  const mostRead = [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4);
  const totals = {
    reads: posts.reduce((n, p) => n + (p.views ?? 0), 0),
    comments: posts.reduce((n, p) => n + p.comment_count, 0),
  };

  return (
    <>
      <PageHero
        title="From the blog."
        intro="Reflections, teaching notes and words for the season, from Pastor Michael Tomiwa and the City Builders team."
      >
        {posts.length > 0 && (
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              { value: String(posts.length), label: posts.length === 1 ? "post" : "posts" },
              { value: compact(totals.reads), label: totals.reads === 1 ? "read" : "reads" },
              { value: compact(totals.comments), label: totals.comments === 1 ? "comment" : "comments" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-4xl">{stat.value}</dd>
                <span className="text-starlight-dim">{stat.label}</span>
              </div>
            ))}
          </dl>
        )}
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {!featured && (
          <p className="text-lg text-paper-dim">Nothing published yet. The first post is on its way.</p>
        )}

        {featured && (
          <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
            <Reveal>
              <Link href={`/blog/${featured.slug}`} className="group block">
                <div className="relative">
                  <CoverArt src={featured.cover_image_url} title={featured.title} large className="aspect-[16/9]" />
                  <span className="absolute left-4 top-4 bg-gold px-3 py-1 text-xs font-medium text-ink">
                    {featured.featured ? "Featured" : "Latest"}
                  </span>
                </div>
                {(featured.tags ?? []).length > 0 && (
                  <p className="mt-6 text-gold-text">{(featured.tags ?? []).join(", ")}</p>
                )}
                <h2 className="mt-2 font-display text-4xl leading-tight text-paper group-hover:text-gold-text sm:text-5xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-paper-dim">{featured.excerpt}</p>
                )}
                <p className="mt-4 text-sm text-paper-dim">
                  {featured.published_at && formatPostDate(featured.published_at)}
                </p>
                <PostMeta post={featured} className="mt-2" />
              </Link>
            </Reveal>

            <aside className="space-y-12">
              <div>
                <h2 className="font-display text-2xl text-paper">Most read</h2>
                <ol className="mt-5 space-y-5">
                  {mostRead.map((post, i) => (
                    <li key={post.id}>
                      <Link href={`/blog/${post.slug}`} className="group grid grid-cols-[2.5rem_1fr] gap-3">
                        <span className="font-display text-4xl leading-none text-gold/80">{i + 1}</span>
                        <span>
                          <span className="block font-medium leading-snug text-paper group-hover:text-gold-text">
                            {post.title}
                          </span>
                          <span className="mt-1 block text-sm text-paper-dim">
                            {formatCount(post.views ?? 0, "read", "reads")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-steel pt-8">
                <h2 className="font-display text-2xl text-paper">New posts by email</h2>
                <p className="mt-2 leading-relaxed text-paper-dim">
                  Get each new post and the Word for the Month in your inbox.
                </p>
                <div className="mt-4">
                  <SubscribeForm />
                </div>
              </div>
            </aside>
          </div>
        )}

        {rest.length > 0 && (
          <section className="mt-20 border-t border-steel pt-12">
            <h2 className="mb-8 font-display text-4xl text-paper">All posts</h2>
            <BlogExplorer posts={rest} tags={tags} />
          </section>
        )}
      </div>
    </>
  );
}
