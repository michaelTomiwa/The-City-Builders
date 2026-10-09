import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getMember, getMemberData } from "@/lib/member-data";
import { dueLabel, lagosDateTime } from "@/lib/discipleship";
import { SubmissionForm } from "@/components/members/submission-form";
import { Countdown } from "@/components/members/countdown";
import { dueState } from "@/lib/accountability";
import { cn } from "@/lib/utils";

const prose =
  "text-[1.05rem] leading-[1.8] text-paper-dim [&_a]:text-gold-text [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:text-paper [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-paper [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-paper [&_img]:my-5 [&_img]:rounded-sm [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:text-paper [&_ul]:list-disc [&_ul]:pl-6 [&>*:first-child]:mt-0";

export default async function AssignmentPage({ params, searchParams }: PageProps<"/me/assignments/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const { user } = await getMember();
  const { assignments, submissions, programs } = await getMemberData();
  const a = assignments.find((x) => x.id === id);
  if (!a || !user) notFound();
  const sub = submissions.find((s) => s.assignment_id === a.id) ?? null;
  const due = dueLabel(a.due_at);
  const program = programs.find((p) => p.id === a.program_id);
  const state = dueState(a);

  return (
    <div>
      <Link href="/me/assignments" className="text-sm text-paper-dim hover:text-gold-text">
        All assignments
      </Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <article>
          <p className={due?.late && !sub ? "text-sm text-[#a3402b]" : "text-sm text-gold-text"}>
            {due?.text ?? "No due date"}
            {program && (
              <>
                {" · "}
                <Link href={`/me/programs/${program.id}`} className="underline-offset-4 hover:underline">
                  {program.title}
                </Link>
              </>
            )}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-paper sm:text-5xl">{a.title}</h1>
          {!sub && a.due_at && state === "open" && <Countdown due={a.due_at} className="mt-3" />}
          {a.instructions && (
            <div className={cn("mt-8", prose)}>
              <ReactMarkdown>{a.instructions}</ReactMarkdown>
            </div>
          )}
          {a.resources && (
            <section className="mt-10 rounded-md border border-steel bg-white p-5">
              <h2 className="text-sm font-medium text-gold-text">Resources</h2>
              <div className={cn("mt-3", prose)}>
                <ReactMarkdown>{a.resources}</ReactMarkdown>
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {sub?.feedback && (
            <section
              className={cn(
                "rounded-md border p-5",
                sub.status === "needs_work" ? "border-[#ecc4ba] bg-[#fbefec]" : "border-[#bfe0c8] bg-[#eef8f0]"
              )}
            >
              <p className={cn("text-sm font-medium", sub.status === "needs_work" ? "text-[#8a2f1e]" : "text-[#24613a]")}>
                {sub.status === "needs_work" ? "The pastor asked for another look" : "Feedback from the pastor"}
              </p>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-paper">{sub.feedback}</p>
              {sub.reviewed_at && <p className="mt-2 text-xs text-paper-dim">{lagosDateTime(sub.reviewed_at)}</p>}
            </section>
          )}
          {query.submitted && (
            <p className="rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]" role="status">
              {query.submitted === "late"
                ? "Handed in. Thank you for finishing it and for telling the pastor what happened. Late is better than never. 🙏"
                : "Handed in. The pastor will see it and you\u2019ll get feedback here."}
            </p>
          )}
          {typeof query.error === "string" && (
            <p className="rounded-md border border-[#ecc4ba] bg-[#fbefec] px-4 py-3 text-sm text-[#8a2f1e]" role="alert">
              {query.error}
            </p>
          )}
          <SubmissionForm assignmentId={a.id} userId={user.id} submission={sub} dueState={state} />
        </aside>
      </div>
    </div>
  );
}
