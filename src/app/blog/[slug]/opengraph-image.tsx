import { supabase } from "@/lib/supabase";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "A post from The City Builders blog";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase.from("posts").select("title, tags").eq("slug", slug).eq("published", true).maybeSingle();
  return renderOgImage({
    title: data?.title ?? "From the blog",
    kicker: data?.tags?.length ? `From the blog: ${data.tags.join(", ")}` : "From the blog",
    footer: "Read it on the City Builders blog",
  });
}
