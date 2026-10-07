import { supabase } from "@/lib/supabase";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "A message from The City Builders";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase.from("sermons").select("title, speaker").eq("slug", slug).maybeSingle();
  return renderOgImage({
    title: data?.title ?? "A message from the watch",
    kicker: data?.speaker ?? "Pastor Michael Tomiwa",
    footer: "Watch the full message on The City Builders",
  });
}
