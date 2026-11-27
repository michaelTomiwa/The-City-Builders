import { getWedding, weddingIcs } from "@/lib/wedding";
import { siteUrl } from "@/lib/site";

/** Every event of the wedding as a calendar file (Apple Calendar, Outlook, Google). */
export async function GET(_req: Request, ctx: RouteContext<"/wedding/[slug]/calendar.ics">) {
  const { slug } = await ctx.params;
  const w = getWedding(slug);
  if (!w) return new Response("Not found", { status: 404 });
  return new Response(weddingIcs(w, siteUrl), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${w.slug}.ics"`,
    },
  });
}
