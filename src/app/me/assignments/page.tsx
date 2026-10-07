import Link from "next/link";
import { getMemberData } from "@/lib/member-data";
import { dueLabel, type Assignment, type Submission } from "@/lib/discipleship";

const statusPill: Record<string, { text: string; className: string }> = {
  todo: { text: "To do", className: "bg-gold/20 text-gold-text" },
  submitted: { text: "Handed in", className: "bg-[#e1e9f6] text-[#29457a]" },
  needs_work: { text: "Needs another look", className: "bg-[#f6e1dc] text-[#8a2f1e]" },
  reviewed: { text: "Reviewed", className: "bg-[#e3f1e6] text-[#24613a]" },
};

function Row({ a, s }: { a: Assignment; s?: Submission }) {
  const due = dueLabel(a.due_at);
  const pill = statusPill[s?.status ?? "todo"];
  return (
    <li>
      <Link href={`/me/assignments/${a.id}`} className="flex flex-col gap-2 rounded-md border border-steel bg-white p-5 transition-colors hover:border-gold sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          <span className="block font-display text-xl leading-snug text-paper">{a.title}</span>
          <span className={due?.late && !s ? "text-sm text-[#a3402b]" : "text-sm text-paper-dim"}>{due?.text ?? "No due date"}</span>
        </span>
        <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-medium ${pill.className}`}>{pill.text}</span>
      </Link>
    </li>
  );
}

export default async function AssignmentsPage() {
  const { assignments, submissions } = await getMemberData();
  const by = new Map(submissions.map((s) => [s.assignment_id, s]));
  const open = assignments.filter((a) => !by.has(a.id) || by.get(a.id)?.status === "needs_work");
  const done = assignments.filter((a) => by.has(a.id) && by.get(a.id)?.status !== "needs_work");

  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Assignments</h1>
      <p className="mt-2 max-w-xl text-paper-dim">Work from the pastor. Read the instructions, hand it in, and you&rsquo;ll get feedback here.</p>

      {assignments.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">No assignments yet.</p>
      ) : (
        <>
          <h2 className="mt-10 font-display text-2xl text-paper">To do</h2>
          {open.length === 0 ? (
            <p className="mt-3 text-paper-dim">Nothing waiting. Well done.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {open.map((a) => (
                <Row key={a.id} a={a} s={by.get(a.id)} />
              ))}
            </ul>
          )}
          {done.length > 0 && (
            <>
              <h2 className="mt-12 font-display text-2xl text-paper">Handed in</h2>
              <ul className="mt-4 space-y-3">
                {done.map((a) => (
                  <Row key={a.id} a={a} s={by.get(a.id)} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
