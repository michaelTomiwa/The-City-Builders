import { getMember } from "@/lib/member-data";
import { getSchool } from "@/lib/school-data";
import { displayName } from "@/lib/discipleship";
import { renderCertificate } from "@/lib/certificate";

export async function GET(_req: Request, ctx: RouteContext<"/me/school/[slug]/certificate/image">) {
  const { slug } = await ctx.params;
  const { user, profile } = await getMember();
  if (!user) return new Response("Sign in first", { status: 401 });
  const { courses, lessons, progress } = await getSchool();
  const course = courses.find((c) => c.slug === slug);
  if (!course) return new Response("Not found", { status: 404 });
  const own = lessons.filter((l) => l.course_id === course.id);
  const mine = progress.filter((p) => p.course_id === course.id);
  if (own.length === 0 || mine.length < own.length) return new Response("Finish every lesson first", { status: 403 });
  const last = mine.reduce((a, p) => (p.completed_at > a ? p.completed_at : a), mine[0].completed_at);
  const date = new Date(last).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
  const image = await renderCertificate({ name: displayName(profile), course: course.title, date });
  image.headers.set("Content-Disposition", `inline; filename="${slug}-certificate.png"`);
  return image;
}
