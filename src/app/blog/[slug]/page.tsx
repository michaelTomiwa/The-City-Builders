import type { Metadata } from "next";
import Link from "next/link";
import { absolute, jsonLd } from "@/lib/seo";
import { faqJsonLd, postFaq } from "@/lib/post-faq";
import { postSeries } from "@/lib/series";
import { SeriesCard } from "@/components/blog/series-card";
import { ReadNextBar } from "@/components/blog/read-next-bar";
import { NotifyMe } from "@/components/site/notify-me";
import { topicSlug } from "@/lib/topics";
import { WhatsAppShare } from "@/components/site/whatsapp-share";
import { siteUrl } from "@/lib/site";
import { notFound } from "next/navigation";
import { postHtml } from "@/lib/post-html";
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
  const description = post.excerpt ?? undefined;
  return {
    title: post.title,
    description,
    keywords: post.tags ?? undefined,
    authors: [{ name: "Pastor Michael Tomiwa" }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: ["Pastor Michael Tomiwa"],
      tags: post.tags ?? undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [{ data: commentRows }, { data: others }, series] = await Promise.all([
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
    postSeries(post.content),
  ]);
  const part = series ? series.parts.findIndex((p) => p.id === post.id) + 1 : 0;

  const comments = (commentRows ?? []) as PostComment[];
  const nextInSeries = series && part > 0 ? series.parts[part] : undefined;
  const inSeries = new Set((series?.parts ?? []).map((p) => p.id));
  const candidates = withStats((others ?? []) as Row[]).filter((p) => !inSeries.has(p.id));
  const postTags = new Set(post.tags ?? []);
  const related: PostWithStats[] = [
    ...candidates.filter((p) => (p.tags ?? []).some((t) => postTags.has(t))),
    ...candidates.filter((p) => !(p.tags ?? []).some((t) => postTags.has(t))),
  ].slice(0, 3);

  const faq = postFaq(postHtml(post.content));
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: absolute(post.cover_image_url || `/blog/${post.slug}/opengraph-image`),
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: { "@type": "Person", name: "Pastor Michael Tomiwa", url: absolute("/pastor") },
    publisher: { "@id": `${siteUrl}/#church`, "@type": "Church", name: "The City Builders" },
    mainEntityOfPage: absolute(`/blog/${post.slug}`),
    keywords: (post.tags ?? []).join(", ") || undefined,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleLd)} />
      {faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faq))} />}
      <header className="on-night sky relative overflow-hidden text-starlight">
        <Stars />
        <Celestial />
        <div className="relative mx-auto max-w-3xl px-6 pt-14 pb-16 sm:pt-20">
          <Link href="/blog" className="hero-rise text-sm text-starlight-dim hover:text-lamp">
            All posts
          </Link>
          {(post.tags ?? []).length > 0 && (
            <p className="hero-rise mt-6 flex flex-wrap gap-x-3 text-lamp [animation-delay:60ms]">
              {(post.tags ?? []).map((t) => (
                <Link key={t} href={`/topics/${topicSlug(t)}`} className="underline-offset-4 hover:underline">
                  {t}
                </Link>
              ))}
            </p>
          )}
          <h1 className="hero-rise mt-3 font-display text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.04] [animation-delay:120ms]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="hero-rise mt-5 text-lg leading-relaxed text-starlight-dim [animation-delay:180ms]">{post.excerpt}</p>
          )}
          <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-starlight-dim [animation-delay:240ms]">
            <Link href="/pastor" className="text-starlight underline-offset-4 hover:text-lamp hover:underline">
              Pastor Michael Tomiwa
            </Link>
            {post.published_at && <span>{formatPostDate(post.published_at)}</span>}
            <span className="inline-flex items-center gap-1.5">
              <MetaIcon name="clock" />
              {readingMinutes(post.content)} min read
            </span>
            <ViewCounter slug={post.slug} initial={post.views ?? 0} />
            {series && part > 0 && (
              <span className="rounded-full border border-lamp/40 px-2.5 py-0.5 text-xs text-lamp">
                Part {part} · {series.name}
              </span>
            )}
          </div>
          <WhatsAppShare
            className="hero-rise mt-6 [animation-delay:300ms]"
            text={`*${post.title}*\nA word from Pastor Michael Tomiwa${post.excerpt ? `: ${post.excerpt}` : ""}`}
            url={absolute(`/blog/${post.slug}`)}
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14">
        {post.cover_image_url && (
          <CoverArt src={post.cover_image_url} title={post.title} className="mb-12 aspect-[16/9]" />
        )}

        <div className="post-body" dangerouslySetInnerHTML={{ __html: postHtml(post.content) }} />

        {series && <SeriesCard name={series.name} parts={series.parts} currentId={post.id} />}

        <div className="mt-14 flex flex-col gap-6 border-y border-steel py-6 sm:flex-row sm:items-center sm:justify-between">
          <AmenButton slug={post.slug} initial={post.likes ?? 0} />
          <ShareBar title={post.title} path={`/blog/${post.slug}`} />
        </div>

        <Comments postId={post.id} comments={comments} />

        <div className="on-night mt-16 grid gap-8 rounded-md bg-night p-6 text-starlight sm:p-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl">Never miss a word</h2>
            <p className="mt-2 text-starlight-dim">Turn on alerts and your phone tells you the moment a new word is posted, and 5 minutes before Night Watch.</p>
            <NotifyMe className="mt-5" label="Alert me to new words" />
          </div>
          <div className="md:border-l md:border-white/10 md:pl-8">
            <h2 className="font-display text-2xl">Or by email</h2>
            <p className="mt-2 text-starlight-dim">New posts and the Word for the Month, straight to your inbox.</p>
            <div className="mt-5">
              <SubscribeForm tone="night" />
            </div>
          </div>
        </div>
      </div>

      {(nextInSeries || related[0]) && (
        <ReadNextBar
          href={`/blog/${(nextInSeries ?? related[0]).slug}`}
          title={(nextInSeries ?? related[0]).title}
          label={nextInSeries ? `Read next · Part ${part + 1}` : "Read next"}
        />
      )}

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
