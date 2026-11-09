import { supabase, type Post } from "@/lib/supabase";
import { topicInfo, topicSlug } from "@/lib/topics";

type PostRow = Pick<Post, "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "published_at" | "tags">;

/** Every published post, newest first (light columns only). */
export async function publishedPosts(now = Date.now()) {
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, tags")
    .eq("published", true)
    .lte("published_at", new Date(now).toISOString())
    .order("published_at", { ascending: false });
  return (data ?? []) as PostRow[];
}

/** All topics in use, with how many posts each has. */
export async function allTopics() {
  const posts = await publishedPosts();
  const counts = new Map<string, { slug: string; title: string; count: number }>();
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      const slug = topicSlug(t);
      if (!slug) continue;
      const entry = counts.get(slug) ?? { slug, title: topicInfo(slug, t).title, count: 0 };
      entry.count++;
      counts.set(slug, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

export async function topicPosts(slug: string) {
  const posts = await publishedPosts();
  const matching = posts.filter((p) => (p.tags ?? []).some((t) => topicSlug(t) === slug));
  const tag = matching[0]?.tags?.find((t) => topicSlug(t) === slug);
  return { posts: matching, info: topicInfo(slug, tag) };
}
