import { supabase } from "@/lib/supabase";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { currentInstruction, fastDaysLabel } from "@/lib/instruction";
import { weekLabel } from "@/lib/week";

export const alt = "This week at The City Builders: fasting, prayer and study";
export const size = ogSize;
export const contentType = ogContentType;
export const revalidate = 300;

export default async function Image() {
  const ins = await currentInstruction(supabase);
  return renderOgImage({
    title: ins?.theme ?? "This week, together",
    kicker: ins ? `This week · ${weekLabel(ins.week_start)}` : "This week",
    footer: ins?.fast_days.length ? `Fasting ${fastDaysLabel(ins.fast_days)} · prayer points · daily reading` : "What the whole house is fasting, praying and studying",
  });
}
