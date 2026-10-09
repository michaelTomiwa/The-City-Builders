import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, Tabs } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AssignmentForm } from "@/components/admin/assignment-form";
import { activeMembers } from "@/lib/admin-discipleship";
import { displayName, lagosDateTime, type Assignment, type Submission } from "@/lib/discipleship";
import { dueState, lateReasonLabel } from "@/lib/accountability";
import { deleteAssignment, reviewSubmission, saveAssignment } from "../../discipleship/actions";

const statusPill = {
  submitted: <Pill tone="gold">To review</Pill>,
  needs_work: <Pill tone="red">Needs work</Pill>,
  reviewed: <Pill tone="green">Reviewed</Pill>,
};

export default async function AdminAssignment({ params, searchParams }: PageProps<"/admin/assignments/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const tab = query.tab === "edit" ? "edit" : "submissions";
  const supabase = await createClient();

  const [{ data: row }, { data: subRows }, { data: memberRows }, { data: programs }] = await Promise.all([
    supabase.from("assignments").select("*").eq("id", id).maybeSingle(),
    supabase.from("submissions").select("*").eq("assignment_id", id).order("submitted_at", { ascending: false }),
    supabase.from("assignment_members").select("user_id").eq("assignment_id", id),
    supabase.from("programs").select("id, title").order("start_date", { ascending: false }),
  ]);
  if (!row) notFound();
  const a = row as Assignment;
  const subs = (subRows ?? []) as Submission[];
  const selected = (memberRows ?? []).map((r) => r.user_id as string);
  const { members, picker } = await activeMembers(supabase);
  const nameOf = new Map(members.map((m) => [m.id, displayName(m)]));

  // Private files: short-lived links for the pastor to open.
  const files = new Map<string, string>();
  await Promise.all(
    subs
      .filter((s) => s.file_path)
      .map(async (s) => {
        const { data } = await supabase.storage.from("submissions").createSignedUrl(s.file_path!, 60 * 60);
        if (data?.signedUrl) files.set(s.id, data.signedUrl);
      })
  );

  const audience = a.audience === "everyone" ? members : members.filter((m) => selected.includes(m.id));
  const handedIn = new Set(subs.map((s) => s.user_id));
  const missing = audience.filter((m) => !handedIn.has(m.id));
  const order = { submitted: 0, needs_work: 1, reviewed: 2 };
  subs.sort((x, y) => order[x.status] - order[y.status]);

  return (
    <div>
      <Link href="/admin/assignments" className="text-sm text-paper-dim hover:text-gold-text">
        All assignments
      </Link>
      <div className="mt-3">
        <AdminHeader
          title={a.title}
          description={
            <>
              {a.status === "draft" ? "Draft · " : a.status === "archived" ? "Archived · " : ""}
              {a.due_at ? `Due ${lagosDateTime(a.due_at)}` : "No due date"} · {subs.length} of {audience.length} handed in
            </>
          }
        />
      </div>
      {query.saved && (
        <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
          Saved. {a.status === "published" ? "Members can see it now." : "It's a draft, so only staff can see it."}
        </p>
      )}
      <div className="mt-6">
        <Tabs
          active={tab}
          items={[
            { id: "submissions", label: "Submissions", count: subs.length, href: `/admin/assignments/${id}` },
            { id: "edit", label: "Edit", href: `/admin/assignments/${id}?tab=edit` },
          ]}
        />
      </div>

      {tab === "edit" ? (
        <div className="mt-6">
          <AssignmentForm assignment={a} programs={programs ?? []} members={picker} selected={selected} action={saveAssignment} />
          <form action={deleteAssignment} className="mt-10 border-t border-steel pt-6">
            <input type="hidden" name="id" value={a.id} />
            <ConfirmButton message="Delete this assignment and all submissions? This can't be undone." className="text-sm text-[#8a2f1e] hover:underline">
              Delete assignment
            </ConfirmButton>
          </form>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            {subs.length === 0 ? (
              <Empty>No one has handed in yet.</Empty>
            ) : (
              subs.map((s) => (
                <article key={s.id} className="rounded-md border border-steel bg-white p-5">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-paper">{nameOf.get(s.user_id) ?? "Member"}</p>
                    <span className="flex items-center gap-2 text-xs text-paper-dim">
                      {lagosDateTime(s.updated_at ?? s.submitted_at)}
                      {s.late && <Pill tone="red">Late</Pill>}
                      {statusPill[s.status]}
                    </span>
                  </header>
                  {s.late && (
                    <p className="mt-3 rounded-sm bg-[#fbefec] px-3 py-2 text-sm text-paper">
                      <span className="font-medium text-[#8a2f1e]">Why it was late: </span>
                      {lateReasonLabel(s.late_reason)}
                      {s.late_note && <span className="text-paper-dim"> · &ldquo;{s.late_note}&rdquo;</span>}
                    </p>
                  )}
                  {s.body && <p className="mt-3 whitespace-pre-line leading-relaxed text-paper">{s.body}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {files.get(s.id) && (
                      <a href={files.get(s.id)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-dusk px-3 py-1 text-gold-text hover:bg-gold/15">
                        Open file: {s.file_name ?? "attachment"}
                      </a>
                    )}
                    {s.link_url && (
                      <a href={s.link_url} target="_blank" rel="noopener noreferrer" className="max-w-full truncate rounded-full bg-dusk px-3 py-1 text-gold-text hover:bg-gold/15">
                        {s.link_url}
                      </a>
                    )}
                  </div>
                  <form action={reviewSubmission} className="mt-4 border-t border-steel pt-4">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="assignment_id" value={a.id} />
                    <textarea
                      name="feedback"
                      rows={2}
                      defaultValue={s.feedback ?? ""}
                      placeholder="Feedback for them (they'll see this)"
                      className="w-full resize-y rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button name="status" value="reviewed" className="rounded-sm bg-[#3d9a6a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#33845a]">
                        Mark reviewed
                      </button>
                      <button name="status" value="needs_work" className="rounded-sm border border-steel bg-white px-4 py-1.5 text-sm text-paper hover:border-[#c2492f] hover:text-[#8a2f1e]">
                        Ask for another look
                      </button>
                    </div>
                  </form>
                </article>
              ))
            )}
          </div>
          <aside className="rounded-md border border-steel bg-white/80 p-5 lg:self-start">
            <h2 className="font-medium text-paper">{dueState(a) === "missed" ? "Missed" : "Not handed in yet"}</h2>
            {missing.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Everyone has handed in.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {missing.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <span className="truncate text-paper">{displayName(m)}</span>
                    {m.phone && (
                      <a href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-gold-text hover:underline">
                        WhatsApp
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
