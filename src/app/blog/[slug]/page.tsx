import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { supabase, type Post, type PostComment } from "@/lib/supabase";
import { withStats, readingMinutes, formatPostDate, type PostWithStats } from "@/lib/blog";
import { Stars } from "@/components/site/stars";
import { Celestial } from "@/components/site/celestial";
import { CoverArt } from "@/components/blog/cover-art";
import { MetaIcon, PostMeta } from "@/components/blog/post-meta";
import { AmenButton, ShareBar, ViewCounter } from "@/components/blog/post-engagement";
import { Comments } from "@/components/blog/comments";
import { SubscribeForm } from "@/components/site/subscribe-form";

export const revalidate = 60;

type Row = Post & { post_comments?: { count: number }[] };

async function getPost(slug: string) {
  const { data } = await supabase
    .from("posts")
    .select("*, post_comments(count)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? withStats([data as Row])[0] : null;
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [{ data: commentRows }, { data: others }] = await Promise.all([
    supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", post.id)
      .eq("approved", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("posts")
      .select("*, post_comments(count)")
      .eq("published", true)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  const comments = (commentRows ?? []) as PostComment[];
  const candidates = withStats((others ?? []) as Row[]);
  const postTags = new Set(post.tags ?? []);
  const related: PostWithStats[] = [
    ...candidates.filter((p) => (p.tags ?? []).some((t) => postTags.has(t))),
    ...candidates.filter((p) => !(p.tags ?? []).some((t) => postTags.has(t))),
  ].slice(0, 3);

  return (
    <article>
      <header className="on-night sky relative overflow-hidden text-starlight">
        <Stars />
        <Celestial />
        <div className="relative mx-auto max-w-3xl px-6 pt-14 pb-16 sm:pt-20">
          <Link href="/blog" className="hero-rise text-sm text-starlight-dim hover:text-lamp">
            All posts
          </Link>
          {(post.tags ?? []).length > 0 && (
            <p className="hero-rise mt-6 text-lamp [animation-delay:60ms]">{(post.tags ?? []).join(", ")}</p>
          )}
          <h1 className="hero-rise mt-3 font-display text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.04] [animation-delay:120ms]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="hero-rise mt-5 text-lg leading-relaxed text-starlight-dim [animation-delay:180ms]">{post.excerpt}</p>
          )}
          <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-starlight-dim [animation-delay:240ms]">
            <span className="text-starlight">Pastor Michael Tomiwa</span>
            {post.published_at && <span>{formatPostDate(post.published_at)}</span>}
            <span className="inline-flex items-center gap-1.5">
              <MetaIcon name="clock" />
              {readingMinutes(post.content)} min read
            </span>
            <ViewCounter slug={post.slug} initial={post.views ?? 0} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14">
        {post.cover_image_url && (
          <CoverArt src={post.cover_image_url} title={post.title} className="mb-12 aspect-[16/9]" />
        )}

        <div className="text-lg leading-[1.8] text-paper-dim [&_a]:text-gold-text [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-6 [&_blockquote]:font-display [&_blockquote]:text-2xl [&_blockquote]:leading-snug [&_blockquote]:text-paper [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-paper [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-paper [&_img]:my-8 [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-6 [&_strong]:text-paper [&_ul]:list-disc [&_ul]:pl-6 [&>*:first-child]:mt-0">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-y border-steel py-6 sm:flex-row sm:items-center sm:justify-between">
          <AmenButton slug={post.slug} initial={post.likes ?? 0} />
          <ShareBar title={post.title} path={`/blog/${post.slug}`} />
        </div>

        <Comments postId={post.id} comments={comments} />

        <div className="mt-16 bg-night p-6 text-starlight sm:p-8">
          <h2 className="font-display text-2xl">Get the next post by email</h2>
          <p className="mt-2 text-starlight-dim">New posts and the Word for the Month, straight to your inbox.</p>
          <div className="mt-5">
            <SubscribeForm tone="night" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-steel bg-dusk/60">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-display text-3xl text-paper">Keep reading</h2>
            <ul className="mt-8 grid gap-10 md:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <CoverArt src={p.cover_image_url} title={p.title} className="aspect-[16/10]" />
                    <h3 className="mt-4 font-display text-xl leading-snug text-paper group-hover:text-gold-text">{p.title}</h3>
                    <PostMeta post={p} className="mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
