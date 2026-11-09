import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/site";

// Rebuilt at most once an hour, so new posts and messages show up for Google.
export const revalidate = 3600;

const staticPages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/live", priority: 0.9, changeFrequency: "daily" },
  { path: "/week", priority: 0.9, changeFrequency: "weekly" },
  { path: "/sermons", priority: 0.8, changeFrequency: "daily" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/events", priority: 0.7, changeFrequency: "weekly" },
  { path: "/prayer", priority: 0.7, changeFrequency: "daily" },
  { path: "/testimonies", priority: 0.6, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/give", priority: 0.5, changeFrequency: "monthly" },
  { path: "/join", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const [{ data: posts }, { data: sermons }, { data: pages }] = await Promise.all([
    supabase.from("posts").select("slug, published_at, updated_at").eq("published", true).lte("published_at", now),
    supabase.from("sermons").select("slug, streamed_at"),
    supabase.from("pages").select("slug, updated_at").eq("published", true),
  ]);

  return [
    ...staticPages.map((p) => ({ url: `${siteUrl}${p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...(posts ?? []).map((p) => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: p.updated_at ?? p.published_at ?? now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...(sermons ?? []).map((s) => ({ url: `${siteUrl}/sermons/${s.slug}`, lastModified: s.streamed_at ?? now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...(pages ?? []).map((p) => ({ url: `${siteUrl}/p/${p.slug}`, lastModified: p.updated_at ?? now, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
