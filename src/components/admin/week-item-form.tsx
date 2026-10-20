"use client";

import Link from "next/link";
import { useState } from "react";
import { MemberPicker, type PickerMember } from "./member-picker";
import { cn } from "@/lib/utils";
import type { WeekItem } from "@/lib/week";

const promptIdeas = ["Write a one-page report on what stood out to you", "Share three things God showed you", "Upload your notes (PDF or photo)"];

const ideas = ["Read Ephesians 1–3", "Attend Night Watch at least twice", "Call or visit one person from church", "Fast on Wednesday until 12 noon", "Pray 30 minutes for Lagos"];

/** Add an item to a week's checklist (or edit one): for everyone, a team or chosen people, once or every week, with or without something to hand in. */
export function WeekItemForm({
  week,
  teams,
  members,
  action,
  initial,
  initialMembers = [],
  onCancelHref,
}: {
  week: string;
  teams: { id: string; name: string }[];
  members: PickerMember[];
  action: (fd: FormData) => void;
  initial?: WeekItem;
  initialMembers?: string[];
  onCancelHref?: string;
}) {
  const [audience, setAudience] = useState<"everyone" | "team" | "selected">(initial?.audience ?? "everyone");
  const [chosen, setChosen] = useState<string[]>(initialMembers);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [submit, setSubmit] = useState<"none" | "optional" | "required">(initial?.submit ?? "none");
  const [prompt, setPrompt] = useState(initial?.submit_prompt ?? "");
  const editing = Boolean(initial);
  const fid = initial?.id ?? "new";

  return (
    <form action={action} className={cn("rounded-md bg-white", editing ? "" : "border border-steel p-5")}>
      <input type="hidden" name="week" value={week} />
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="members" value={JSON.stringify(chosen)} />
      <label htmlFor={`item-title-${fid}`} className="text-sm font-medium text-paper">
        {editing ? "What to do" : "Add to the checklist"}
      </label>
      <input
        id={`item-title-${fid}`}
        name="title"
        required
        maxLength={300}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Read Ephesians 1–3"
        className="mt-2 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper outline-none focus:border-gold"
      />
      {!title && !editing && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ideas.map((i) => (
            <button key={i} type="button" onClick={() => setTitle(i)} className="rounded-full bg-dusk px-2.5 py-1 text-xs text-paper-dim hover:text-paper">
              {i}
            </button>
          ))}
        </div>
      )}
      <textarea
        name="details"
        defaultValue={initial?.details ?? ""}
        rows={2}
        maxLength={2000}
        placeholder="A few words of explanation (optional)"
        className="mt-3 w-full rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
      />

      <div className="mt-3 grid grid-cols-3 gap-1 rounded bg-dusk p-1 text-sm">
        {(
          [
            { id: "everyone", label: "Everyone" },
            { id: "team", label: "A team" },
            { id: "selected", label: "Chosen people" },
          ] as const
        ).map((a) => (
          <label key={a.id} className={cn("cursor-pointer rounded py-1.5 text-center", audience === a.id ? "bg-white text-paper shadow-sm" : "text-paper-dim")}>
            <input type="radio" name="audience" value={a.id} checked={audience === a.id} onChange={() => setAudience(a.id)} className="sr-only" />
            {a.label}
          </label>
        ))}
      </div>
      {audience === "team" && (
        <select name="team_id" required defaultValue={initial?.team_id ?? undefined} className="mt-3 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper">
          {teams.length === 0 && <option value="">No teams yet</option>}
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      {audience === "selected" && <MemberPicker members={members} selected={chosen} onChange={setChosen} />}

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-paper">Hand something in?</legend>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded bg-dusk p-1 text-sm">
          {(
            [
              { id: "none", label: "Just tick" },
              { id: "optional", label: "Optional" },
              { id: "required", label: "Required" },
            ] as const
          ).map((o) => (
            <label key={o.id} className={cn("cursor-pointer rounded py-1.5 text-center", submit === o.id ? "bg-white text-paper shadow-sm" : "text-paper-dim")}>
              <input type="radio" name="submit" value={o.id} checked={submit === o.id} onChange={() => setSubmit(o.id)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
        {submit !== "none" && (
          <>
            <input
              name="submit_prompt"
              maxLength={500}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should they hand in? e.g. A one-page report"
              className="mt-2 h-10 w-full rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
            />
            {!prompt && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {promptIdeas.map((i) => (
                  <button key={i} type="button" onClick={() => setPrompt(i)} className="rounded-full bg-dusk px-2.5 py-1 text-xs text-paper-dim hover:text-paper">
                    {i}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-xs text-paper-dim">
              They can write it on the site or attach a PDF, Word document, photo or voice note.
              {submit === "required" && " They can only tick it once they've handed something in."}
            </p>
          </>
        )}
      </fieldset>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-paper">
        <input type="checkbox" name="repeats" defaultChecked={initial?.repeats ?? false} className="mt-0.5 h-4 w-4 accent-[#c9952f]" />
        <span>
          Every week from now on
          <span className="block text-xs text-paper-dim">It rolls into each new week until you stop it.</span>
        </span>
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button className="h-10 flex-1 rounded-sm bg-gold text-sm font-medium text-ink hover:bg-gold-soft">{editing ? "Save changes" : "Add to this week"}</button>
        {onCancelHref && (
          <Link href={onCancelHref} className="text-sm text-paper-dim hover:text-paper">
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
