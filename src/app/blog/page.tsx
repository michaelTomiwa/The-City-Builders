import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { supabase, type Post } from "@/lib/supabase";
import { Reveal } from "@/components/site/reveal";

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const posts = (data ?? []) as Post[];

  return (
    <>
      <PageHero
        title={<>From the blog.</>}
        intro={<>Reflections, teaching notes, and words for the season — from Pastor Michael Tomiwa and the City Builders team.</>}
      />
    <div className="mx-auto max-w-6xl px-6 py-16">

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        {posts.map((post, i) => (
          <Reveal key={post.id} delay={Math.min(i, 4) * 0.05}>
          <Link
            href={`/blog/${post.slug}`}
            className="group block border-t border-steel/60 pt-5 transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="text-xs text-paper-dim">
              {post.published_at && formatDate(post.published_at)}
            </p>
            <h2 className="mt-2 font-display text-2xl text-paper group-hover:text-gold-text">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mt-3 text-paper-dim leading-relaxed">{post.excerpt}</p>
            )}
          </Link>
          </Reveal>
        ))}
        {posts.length === 0 && (
          <p className="text-paper-dim">
            Nothing published yet — the first post is on its way.
          </p>
        )}
      </div>
    </div>
    </>
  );
}
