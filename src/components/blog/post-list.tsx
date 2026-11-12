import Link from "next/link";
import { formatPostDate } from "@/lib/blog";
import { CoverImg } from "@/components/site/cover-img";
import type { Post } from "@/lib/supabase";

type Item = Pick<Post, "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "published_at">;

/** A simple, readable list of posts (used on topic and pastor pages). */
export function PostList({ posts }: { posts: Item[] }) {
  return (
    <ul className="divide-y divide-steel/70">
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/blog/${p.slug}`} className="group flex gap-5 py-6">
            {p.cover_image_url && (
              <CoverImg src={p.cover_image_url} className="hidden h-24 w-36 shrink-0 rounded-sm object-cover sm:block" loading="lazy" />
            )}
            <span className="min-w-0">
              {p.published_at && <span className="text-sm text-paper-dim">{formatPostDate(p.published_at)}</span>}
              <span className="mt-1 block font-display text-2xl leading-snug text-paper group-hover:text-gold-text">{p.title}</span>
              {p.excerpt && <span className="mt-1.5 block leading-relaxed text-paper-dim">{p.excerpt}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
