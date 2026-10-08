import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Panel, Tabs } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CourseForm } from "@/components/admin/course-form";
import { activeMembers } from "@/lib/admin-discipleship";
import { displayName, lagosDateTime } from "@/lib/discipleship";
import type { Course, DraftLesson, Lesson } from "@/lib/school";
import { deleteCourse, saveCourse } from "../../discipleship/actions";

export default async function AdminCourse({ params, searchParams }: PageProps<"/admin/school/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const tab = query.tab === "edit" ? "edit" : "progress";
  const supabase = await createClient();
  const [{ data: row }, { data: lessonRows }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle(),
    supabase.from("lessons").select("*").eq("course_id", id).order("sort"),
    supabase.from("lesson_progress").select("*").eq("course_id", id),
  ]);
  if (!row) notFound();
  const course = row as Course;
  const lessons = (lessonRows ?? []) as Lesson[];
  const { data: qs } = lessons.length
    ? await supabase.from("quiz_questions").select("*").in("lesson_id", lessons.map((l) => l.id)).order("sort")
    : { data: [] };
  const drafts: DraftLesson[] = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    video_url: l.video_url,
    scripture: l.scripture,
    body: l.body,
    questions: (qs ?? [])
      .filter((q) => q.lesson_id === l.id)
      .map((q) => ({ id: q.id, question: q.question, options: q.options, answer: q.answer, explanation: q.explanation })),
  }));

  const { members } = await activeMembers(supabase);
  const rows = members
    .map((m) => {
      const mine = (progress ?? []).filter((p) => p.user_id === m.id);
      const last = mine.reduce<string | null>((a, p) => (!a || p.completed_at > a ? p.completed_at : a), null);
      return { m, done: mine.length, last };
    })
    .filter((r) => r.done > 0)
    .sort((a, b) => b.done - a.done);

  return (
    <div>
      <Link href="/admin/school" className="text-sm text-paper-dim hover:text-gold-text">
        Discipleship School
      </Link>
      <div className="mt-3">
        <AdminHeader title={course.title} description={`${course.status === "published" ? "Published" : course.status === "draft" ? "Draft" : "Archived"} · ${lessons.length} lessons`} />
      </div>
      {query.saved && (
        <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
          Saved.
        </p>
      )}
      <div className="mt-6">
        <Tabs
          active={tab}
          items={[
            { id: "progress", label: "Students", count: rows.length, href: `/admin/school/${id}` },
            { id: "edit", label: "Edit course", href: `/admin/school/${id}?tab=edit` },
          ]}
        />
      </div>
      {tab === "edit" ? (
        <div className="mt-6">
          <CourseForm course={course} lessons={drafts} action={saveCourse} />
          <form action={deleteCourse} className="mt-10 border-t border-steel pt-6">
            <input type="hidden" name="id" value={course.id} />
            <ConfirmButton message="Delete this course and everyone's progress in it?" className="text-sm text-[#8a2f1e] hover:underline">
              Delete course
            </ConfirmButton>
          </form>
        </div>
      ) : (
        <Panel className="mt-6">
          {rows.length === 0 ? (
            <p className="text-paper-dim">No one has started this course yet.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map(({ m, done, last }) => (
                <li key={m.id} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate text-paper">{displayName(m)}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-dusk">
                    <span className={done >= lessons.length ? "block h-full bg-[#3d9a6a]" : "block h-full bg-gold"} style={{ width: `${(done / Math.max(1, lessons.length)) * 100}%` }} />
                  </span>
                  <span className="w-44 text-right text-xs text-paper-dim">
                    {done >= lessons.length ? "Certificate earned" : `${done}/${lessons.length} lessons`}
                    {last ? ` · ${lagosDateTime(last).split(",").slice(0, 2).join(",")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
