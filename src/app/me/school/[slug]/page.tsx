import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchool } from "@/lib/school-data";
import { ProgressRing } from "@/components/members/progress-ring";
import { cn } from "@/lib/utils";

export default async function CoursePage({ params }: PageProps<"/me/school/[slug]">) {
  const { slug } = await params;
  const { courses, lessons, progress } = await getSchool();
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();
  const own = lessons.filter((l) => l.course_id === course.id);
  const done = new Map(progress.map((p) => [p.lesson_id, p]));
  const finished = own.filter((l) => done.has(l.id)).length;
  const complete = own.length > 0 && finished === own.length;
  const next = own.find((l) => !done.has(l.id));

  return (
    <div>
      <Link href="/me/school" className="text-sm text-paper-dim hover:text-gold-text">
        Discipleship School
      </Link>
      <div className="on-night relative mt-4 overflow-hidden rounded-md bg-night p-6 text-starlight sm:p-8">
        {course.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-lamp">{own.length} lessons</p>
            <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">{course.title}</h1>
            {course.summary && <p className="mt-3 text-lg leading-relaxed text-starlight-dim">{course.summary}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {next && (
                <Link href={`/me/school/${course.slug}/${next.id}`} className="inline-flex h-11 items-center bg-gold px-6 font-medium text-ink hover:bg-gold-soft">
                  {finished === 0 ? "Start the course" : "Continue"}
                </Link>
              )}
              {complete && (
                <Link href={`/me/school/${course.slug}/certificate`} className="inline-flex h-11 items-center bg-gold px-6 font-medium text-ink hover:bg-gold-soft">
                  View your certificate
                </Link>
              )}
            </div>
          </div>
          <ProgressRing value={own.length ? finished / own.length : 0} size={96} stroke={7} label={`${finished}/${own.length}`} />
        </div>
      </div>

      <ol className="mt-8 space-y-3">
        {own.map((l, i) => {
          const p = done.get(l.id);
          const locked = i > 0 && !done.has(own[i - 1].id) && !p;
          return (
            <li key={l.id}>
              <Link
                href={locked ? "#" : `/me/school/${course.slug}/${l.id}`}
                aria-disabled={locked}
                className={cn(
                  "flex items-center gap-4 rounded-md border bg-white p-4 transition-colors",
                  p ? "border-[#bfe0c8]" : "border-steel hover:border-gold",
                  locked && "pointer-events-none opacity-55"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg",
                    p ? "bg-[#3d9a6a] text-white" : next?.id === l.id ? "bg-gold text-ink" : "bg-dusk text-paper-dim"
                  )}
                >
                  {p ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-paper">{l.title}</span>
                  <span className="text-sm text-paper-dim">
                    {[l.video_url ? "Video" : null, l.scripture, p && p.total ? `Quiz ${p.score}/${p.total}` : null].filter(Boolean).join(" · ") || "Reading"}
                  </span>
                </span>
                {locked && <span className="text-xs text-paper-dim">Finish the lesson before</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
