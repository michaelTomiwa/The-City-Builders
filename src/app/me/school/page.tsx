import Link from "next/link";
import { getSchool } from "@/lib/school-data";
import { ProgressRing } from "@/components/members/progress-ring";

export default async function SchoolPage() {
  const { courses, lessons, progress } = await getSchool();
  const done = new Set(progress.map((p) => p.lesson_id));

  return (
    <div>
      <p className="text-sm text-gold-text">The City Builders</p>
      <h1 className="font-display text-4xl text-paper sm:text-5xl">Discipleship School</h1>
      <p className="mt-2 max-w-xl text-paper-dim">
        Short lessons from Pastor Michael: watch, read, answer a few questions, and earn a certificate for every course you finish.
      </p>

      {courses.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">
          The first course is being prepared. Check back soon.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {courses.map((c) => {
            const own = lessons.filter((l) => l.course_id === c.id);
            const finished = own.filter((l) => done.has(l.id)).length;
            const complete = own.length > 0 && finished === own.length;
            const next = own.find((l) => !done.has(l.id));
            return (
              <li key={c.id}>
                <Link href={`/me/school/${c.slug}`} className="group block overflow-hidden rounded-md border border-steel bg-white transition-colors hover:border-gold">
                  <div className="on-night relative flex h-36 items-end bg-[linear-gradient(150deg,#101c3a_0%,#24356b_55%,#5a4a7a_100%)] p-5 text-starlight">
                    {c.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
                    )}
                    <span className="relative font-display text-3xl leading-tight">{c.title}</span>
                    {complete && (
                      <span className="absolute right-4 top-4 rounded-full bg-lamp px-3 py-1 text-xs font-medium text-ink">Certificate earned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      {c.summary && <p className="line-clamp-2 text-sm text-paper-dim">{c.summary}</p>}
                      <p className="mt-2 text-sm text-paper">
                        {complete ? "Completed" : finished > 0 ? `Next: ${next?.title}` : `${own.length} lessons`}
                      </p>
                    </div>
                    <ProgressRing value={own.length ? finished / own.length : 0} size={60} stroke={5} label={`${finished}/${own.length}`} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
