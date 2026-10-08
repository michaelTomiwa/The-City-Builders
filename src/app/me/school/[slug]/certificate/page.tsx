import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchool } from "@/lib/school-data";

export default async function CertificatePage({ params }: PageProps<"/me/school/[slug]/certificate">) {
  const { slug } = await params;
  const { courses, lessons, progress } = await getSchool();
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();
  const own = lessons.filter((l) => l.course_id === course.id);
  const finished = progress.filter((p) => p.course_id === course.id).length;
  const complete = own.length > 0 && finished >= own.length;
  const src = `/me/school/${slug}/certificate/image`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/me/school/${slug}`} className="text-sm text-paper-dim hover:text-gold-text">
        {course.title}
      </Link>
      {complete ? (
        <>
          <h1 className="mt-4 font-display text-4xl text-paper sm:text-5xl">Well done. You finished it.</h1>
          <p className="mt-2 text-paper-dim">Download your certificate and share it. Let it encourage someone else to start.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Certificate for ${course.title}`} className="mt-8 w-full rounded-sm border border-steel shadow-[0_30px_80px_-40px_rgba(16,28,58,0.6)]" />
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={src} download={`${slug}-certificate.png`} className="inline-flex h-11 items-center bg-gold px-6 font-medium text-ink hover:bg-gold-soft">
              Download certificate
            </a>
            <Link href="/me/school" className="inline-flex h-11 items-center border border-steel bg-white px-6 text-paper hover:border-gold">
              Back to the school
            </Link>
          </div>
        </>
      ) : (
        <p className="mt-10 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">
          Finish all {own.length} lessons to unlock your certificate. You&rsquo;ve done {finished}.
        </p>
      )}
    </div>
  );
}
