import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill } from "@/components/admin/ui";
import { lagosDateTime, type Assignment } from "@/lib/discipleship";

export default async function AdminAssignments() {
  const supabase = await createClient();
  const [{ data }, { data: subs }] = await Promise.all([
    supabase.from("assignments").select("*").order("created_at", { ascending: false }),
    supabase.from("submissions").select("assignment_id, status"),
  ]);
  const assignments = (data ?? []) as Assignment[];

  return (
    <div>
      <AdminHeader
        title="Assignments"
        description="Give the house work to do: reading, reflections, testimonies, outreach. Members hand in, you give feedback."
        action={{ href: "/admin/assignments/new", label: "New assignment" }}
      />
      {assignments.length === 0 ? (
        <div className="mt-8">
          <Empty>No assignments yet.</Empty>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {assignments.map((a) => {
            const mine = (subs ?? []).filter((s) => s.assignment_id === a.id);
            const waiting = mine.filter((s) => s.status === "submitted").length;
            return (
              <li key={a.id}>
                <Link href={`/admin/assignments/${a.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-paper">{a.title}</span>
                      {a.status !== "published" && <Pill tone="grey">{a.status === "draft" ? "Draft" : "Archived"}</Pill>}
                      {waiting > 0 && <Pill tone="gold">{waiting} to review</Pill>}
                    </span>
                    <span className="mt-0.5 block text-sm text-paper-dim">
                      {a.due_at ? `Due ${lagosDateTime(a.due_at)}` : "No due date"} · {a.audience === "everyone" ? "Everyone" : "Chosen people"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-paper-dim">{mine.length} handed in</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
