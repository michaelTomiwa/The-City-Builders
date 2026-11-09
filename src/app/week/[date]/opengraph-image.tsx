import { supabase } from "@/lib/supabase";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { fastDaysLabel, type Instruction } from "@/lib/instruction";
import { weekLabel } from "@/lib/week";

export const alt = "Weekly prayer points from The City Builders";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const { data } = await supabase.from("week_instructions").select("*").eq("week_start", date).eq("status", "published").maybeSingle();
  const ins = data as Instruction | null;
  return renderOgImage({
    title: ins?.theme ?? "Weekly prayer points",
    kicker: ins ? `Prayer points · ${weekLabel(ins.week_start)}` : "Prayer points",
    footer: ins?.fast_days.length ? `Fasting ${fastDaysLabel(ins.fast_days)} · prayer points · daily reading` : "Prayer points, fasting and daily Bible reading",
  });
}
