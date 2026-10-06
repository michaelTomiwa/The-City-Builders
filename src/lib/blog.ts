import type { Post } from "@/lib/supabase";

export type PostWithStats = Post & { comment_count: number };

/** Posts come back with an embedded `post_comments(count)`; flatten it. */
export function withStats(rows: (Post & { post_comments?: { count: number }[] })[]): PostWithStats[] {
  return rows.map(({ post_comments, ...post }) => ({
    ...post,
    comment_count: post_comments?.[0]?.count ?? 0,
  }));
}

export function readingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K` : String(n);
}

export function formatCount(n: number, one: string, many: string) {
  return `${compact(n)} ${n === 1 ? one : many}`;
}

export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
