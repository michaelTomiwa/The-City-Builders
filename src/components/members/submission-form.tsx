"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { submitAssignment } from "@/app/me/actions";
import { lagosDateTime, type Submission } from "@/lib/discipleship";
import { lateReasons } from "@/lib/accountability";
import { cn } from "@/lib/utils";

/** Hand in an assignment: write an answer, attach a file (photo, PDF, document) and/or add a link. */
export function SubmissionForm({
  assignmentId,
  userId,
  submission,
  dueState = "open",
}: {
  assignmentId: string;
  userId: string;
  submission: Submission | null;
  dueState?: "open" | "late" | "missed";
}) {
  const askWhy = !submission && dueState !== "open";
  const [reason, setReason] = useState<string>("");
  const [editing, setEditing] = useState(!submission || submission.status === "needs_work");
  const [file, setFile] = useState<{ path: string; name: string } | null>(
    submission?.file_path ? { path: submission.file_path, name: submission.file_name ?? "Attached file" } : null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(f: File | undefined) {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setError("That file is over 20 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    const safe = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
    const path = `${userId}/${assignmentId}/${Date.now()}-${safe}`;
    const { error } = await createClient().storage.from("submissions").upload(path, f, { contentType: f.type || undefined });
    setUploading(false);
    if (error) setError(error.message);
    else setFile({ path, name: f.name });
    if (input.current) input.current.value = "";
  }

  if (!editing && submission) {
    return (
      <section className="rounded-md border border-steel bg-white p-5">
        <p className="text-sm font-medium text-paper">Your submission</p>
        <p className="text-xs text-paper-dim">
          Handed in {lagosDateTime(submission.updated_at ?? submission.submitted_at)}
          {submission.late && <span className="ml-1.5 rounded-full bg-[#f6e1dc] px-2 py-0.5 text-[#8a2f1e]">Late</span>}
        </p>
        {submission.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-paper">{submission.body}</p>}
        {submission.file_name && <p className="mt-3 text-sm text-paper-dim">Attached: {submission.file_name}</p>}
        {submission.link_url && (
          <a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="mt-2 block truncate text-sm text-gold-text underline">
            {submission.link_url}
          </a>
        )}
        {submission.status !== "reviewed" && (
          <button type="button" onClick={() => setEditing(true)} className="mt-4 text-sm text-gold-text hover:underline">
            Edit and hand in again
          </button>
        )}
      </section>
    );
  }

  return (
    <form
      action={async (fd) => {
        setSending(true);
        await submitAssignment(fd);
      }}
      className="rounded-md border border-steel bg-white p-5"
    >
      <p className="font-display text-xl text-paper">{submission ? "Update your work" : askWhy ? "Hand it in late" : "Hand it in"}</p>
      {askWhy && (
        <fieldset className="mt-4 rounded-md border border-[#ecc4ba] bg-[#fbefec] p-4">
          <legend className="sr-only">What happened?</legend>
          <p className="text-sm font-medium text-[#8a2f1e]">{dueState === "missed" ? "This was missed, but it's not too late." : "This is past the due date."}</p>
          <p className="mt-1 text-sm text-paper">What happened? Only the pastor sees this.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lateReasons.map((r) => (
              <label
                key={r.id}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                  reason === r.id ? "border-gold bg-gold/20 text-paper" : "border-steel bg-white text-paper-dim hover:text-paper"
                )}
              >
                <input type="radio" name="late_reason" value={r.id} required checked={reason === r.id} onChange={() => setReason(r.id)} className="sr-only" />
                {r.label}
              </label>
            ))}
          </div>
          {reason === "struggling" && (
            <p className="mt-3 text-sm text-paper">
              Thank you for being honest. The pastor will hear about this straight away and reach out to you. 💛
            </p>
          )}
          <textarea
            name="late_note"
            rows={2}
            maxLength={2000}
            placeholder="A few words (optional)"
            className="mt-3 w-full resize-y rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
        </fieldset>
      )}
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="file_path" value={file?.path ?? ""} />
      <input type="hidden" name="file_name" value={file?.name ?? ""} />

      <label className="mt-4 block text-sm text-paper">
        Your answer
        <textarea
          name="body"
          rows={8}
          defaultValue={submission?.body ?? ""}
          placeholder="Write here…"
          className="mt-1.5 w-full resize-y rounded-sm border border-steel bg-white px-3 py-2 text-[0.95rem] leading-relaxed text-paper outline-none focus:border-gold"
        />
      </label>

      <div className="mt-4">
        <p className="text-sm text-paper">Attach a file (optional)</p>
        <input
          ref={input}
          type="file"
          className="sr-only"
          tabIndex={-1}
          accept="image/*,application/pdf,.doc,.docx,.txt,audio/*"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        {file ? (
          <div className="mt-1.5 flex items-center justify-between gap-3 rounded-sm border border-steel bg-dusk/50 px-3 py-2 text-sm">
            <span className="truncate text-paper">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="shrink-0 text-[#8a2f1e] hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-sm border-2 border-dashed border-steel py-4 text-sm text-paper-dim hover:border-gold hover:text-paper"
          >
            {uploading ? "Uploading…" : "Choose a photo, PDF, document or voice note"}
          </button>
        )}
      </div>

      <label className="mt-4 block text-sm text-paper">
        Link (optional)
        <input
          name="link_url"
          type="url"
          defaultValue={submission?.link_url ?? ""}
          placeholder="https://"
          className="mt-1.5 h-10 w-full rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-[#8a2f1e]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={uploading || sending} className="mt-5 h-11 w-full bg-gold font-medium text-ink hover:bg-gold-soft disabled:opacity-60">
        {sending ? "Handing in…" : submission ? "Hand in again" : askWhy ? "Hand in late" : "Hand in"}
      </button>
    </form>
  );
}
