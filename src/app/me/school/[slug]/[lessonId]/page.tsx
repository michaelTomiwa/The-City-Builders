import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getMember } from "@/lib/member-data";
import { getSchool } from "@/lib/school-data";
import { youtubeId } from "@/lib/school";
import { bibleLink } from "@/lib/discipleship";
import { LiteYouTube } from "@/components/site/lite-youtube";
import { LessonQuiz } from "@/components/members/lesson-quiz";

const prose =
  "text-[1.07rem] leading-[1.85] text-paper-dim [&_a]:text-gold-text [&_a]:underline [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-2xl [&_blockquote]:leading-snug [&_blockquote]:text-paper [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-paper [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-paper [&_img]:my-6 [&_img]:rounded-sm [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_strong]:text-paper [&_ul]:list-disc [&_ul]:pl-6 [&>*:first-child]:mt-0";

export default async function LessonPage({ params }: PageProps<"/me/school/[slug]/[lessonId]">) {
  const { slug, lessonId } = await params;
  const { supabase } = await getMember();
  const { courses, lessons, progress } = await getSchool();
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();
  const own = lessons.filter((l) => l.course_id === course.id);
  const index = own.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const lesson = own[index];
  const next = own[index + 1] ?? null;
  const mine = progress.find((p) => p.lesson_id === lesson.id) ?? null;
  const { data: quiz } = await supabase.rpc("lesson_quiz", { p_lesson: lesson.id });
  const questions = (quiz ?? []) as { id: string; question: string; options: string[] }[];
  const video = youtubeId(lesson.video_url);
  const allDone = own.every((l) => l.id === lesson.id || progress.some((p) => p.lesson_id === l.id));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/me/school/${course.slug}`} className="text-sm text-paper-dim hover:text-gold-text">
        {course.title}
      </Link>
      <p className="mt-4 text-sm text-gold-text">
        Lesson {index + 1} of {own.length}
      </p>
      <h1 className="mt-1 font-display text-4xl leading-tight text-paper sm:text-5xl">{lesson.title}</h1>
      {lesson.scripture && (
        <a
          href={bibleLink(lesson.scripture)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-dusk px-3 py-1 text-sm text-gold-text hover:bg-gold/15"
        >
          Read {lesson.scripture}
        </a>
      )}

      {video && (
        <div className="mt-8 overflow-hidden border border-steel">
          <LiteYouTube id={video} title={lesson.title} thumbnail={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`} />
        </div>
      )}

      {lesson.body && (
        <div className={`mt-10 ${prose}`}>
          <ReactMarkdown>{lesson.body}</ReactMarkdown>
        </div>
      )}

      <div className="mt-12">
        <LessonQuiz
          lessonId={lesson.id}
          questions={questions}
          passedBefore={mine ? { score: mine.score ?? 0, total: mine.total ?? 0 } : null}
          nextHref={next ? `/me/school/${course.slug}/${next.id}` : allDone ? `/me/school/${course.slug}/certificate` : `/me/school/${course.slug}`}
          nextLabel={next ? `Next: ${next.title}` : "See your certificate"}
        />
      </div>
    </div>
  );
}
