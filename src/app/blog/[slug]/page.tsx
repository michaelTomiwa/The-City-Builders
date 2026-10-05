import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { supabase, type Post } from "@/lib/supabase";

export const revalidate = 60;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const post = data as Post | null;
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="text-sm text-paper-dim hover:text-gold-text">
        ← All posts
      </Link>

      <h1 className="mt-6 font-display text-4xl text-paper sm:text-5xl">
        {post.title}
      </h1>
      {post.published_at && (
        <p className="mt-4 text-sm text-paper-dim">{formatDate(post.published_at)}</p>
      )}

      <div className="prose-sermon mt-10 space-y-5 text-lg leading-relaxed text-paper-dim [&_a]:text-gold-text [&_h2]:font-display [&_h2]:text-paper [&_h2]:text-2xl [&_h2]:pt-4 [&_strong]:text-paper">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
