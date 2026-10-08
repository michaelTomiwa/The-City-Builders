import { cache } from "react";
import { getMember } from "@/lib/member-data";
import type { Course, Lesson, LessonProgress } from "@/lib/school";

/** Published courses, their lessons and the member's progress. */
export const getSchool = cache(async () => {
  const { supabase, user } = await getMember();
  const [{ data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("*").eq("status", "published").order("sort").order("created_at"),
    supabase.from("lessons").select("*").order("sort"),
    supabase.from("lesson_progress").select("*").eq("user_id", user!.id),
  ]);
  const list = (courses ?? []) as Course[];
  const ids = new Set(list.map((c) => c.id));
  return {
    courses: list,
    lessons: ((lessons ?? []) as Lesson[]).filter((l) => ids.has(l.course_id)),
    progress: (progress ?? []) as LessonProgress[],
  };
});
