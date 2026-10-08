import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill } from "@/components/admin/ui";
import type { Course } from "@/lib/school";

export default async function AdminSchool() {
  const supabase = await createClient();
  const [{ data }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("*").order("sort").order("created_at"),
    supabase.from("lessons").select("id, course_id"),
    supabase.from("lesson_progress").select("user_id, course_id"),
  ]);
  const courses = (data ?? []) as Course[];

  return (
    <div>
      <AdminHeader
        title="Discipleship School"
        description="Courses of short lessons with a video, notes and a quiz. Members earn a certificate for each course they finish."
        action={{ href: "/admin/school/new", label: "New course" }}
      />
      {courses.length === 0 ? (
        <div className="mt-8">
          <Empty>No courses yet. Create one and load the ready-made &ldquo;Foundations of Faith&rdquo; course to start.</Empty>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {courses.map((c) => {
            const total = (lessons ?? []).filter((l) => l.course_id === c.id).length;
            const rows = (progress ?? []).filter((p) => p.course_id === c.id);
            const byUser = new Map<string, number>();
            rows.forEach((r) => byUser.set(r.user_id, (byUser.get(r.user_id) ?? 0) + 1));
            const graduates = [...byUser.values()].filter((v) => total > 0 && v >= total).length;
            return (
              <li key={c.id}>
                <Link href={`/admin/school/${c.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-paper">{c.title}</span>
                      {c.status !== "published" && <Pill tone="grey">{c.status === "draft" ? "Draft" : "Archived"}</Pill>}
                    </span>
                    <span className="text-sm text-paper-dim">{total} lessons</span>
                  </span>
                  <span className="text-sm text-paper-dim">
                    {byUser.size} started · {graduates} {graduates === 1 ? "certificate" : "certificates"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
