import { supabase, type SiteSettings } from "@/lib/supabase";

export const DEFAULT_PASTOR_IMAGE = "/images/pastor-michael-tomiwa.jpg";

export async function getSiteSettings() {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data ?? null) as SiteSettings | null;
}
