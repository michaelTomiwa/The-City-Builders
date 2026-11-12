import { supabase } from "@/lib/supabase";

/*
  Posts written from the same sermon end with "From Pastor Michael Tomiwa's
  message “<name>”". Posts sharing that line form a series ("Part 2 of 5"),
  so a reader can carry on through the whole message.
*/

export function messageName(content: string) {
  return content.match(/message\s+[“"]([^”"<]{3,120})[”"]/)?.[1]?.trim() ?? null;
}

export type SeriesPart = { id: string; title: string; slug: string; published_at: string | null };

/** The published posts from the same message, oldest first (scheduled ones stay hidden until they go live). */
export async function postSeries(content: string) {
  const name = messageName(content);
  if (!name) return null;
  const pattern = `%message “${name.replace(/[%_\\]/g, (c) => `\\${c}`)}”%`;
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, published_at")
    .eq("published", true)
    .ilike("content", pattern)
    .order("published_at", { ascending: true });
  const parts = (data ?? []) as SeriesPart[];
  return parts.length > 1 ? { name, parts } : null;
}
