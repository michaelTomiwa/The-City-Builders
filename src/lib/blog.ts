import type { Post } from "@/lib/supabase";
import { plainText } from "@/lib/post-text";

export type PostWithStats = Post & { comment_count: number; is_new?: boolean };

/** Published in the last day and a half: shown with a "New" label. */
export function isFresh(publishedAt: string | null | undefined, now = Date.now()) {
  return Boolean(publishedAt && now - Date.parse(publishedAt) < 36 * 3600_000 && Date.parse(publishedAt) <= now);
}

/** Posts come back with an embedded `post_comments(count)`; flatten it, and mark the fresh ones. */
export function withStats(rows: (Post & { post_comments?: { count: number }[] })[], now = Date.now()): PostWithStats[] {
  return rows.map(({ post_comments, ...post }) => ({
    ...post,
    comment_count: post_comments?.[0]?.count ?? 0,
    is_new: isFresh(post.published_at, now),
  }));
}

/** "This morning's word" / "Tonight's word", from the Lagos time a post went out. */
export function wordLabel(publishedAt: string | null | undefined, now = Date.now()) {
  if (!publishedAt) return "The latest word";
  const lagos = new Date(Date.parse(publishedAt) + 3600_000);
  const today = new Date(now + 3600_000).toISOString().slice(0, 10);
  if (lagos.toISOString().slice(0, 10) !== today) return "The latest word";
  const hour = lagos.getUTCHours();
  return hour < 12 ? "This morning's word" : hour < 17 ? "Today's word" : "Tonight's word";
}

export function readingMinutes(content: string) {
  const words = plainText(content).split(" ").filter(Boolean).length;
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
