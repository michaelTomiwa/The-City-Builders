"use client";

import { useState } from "react";
import { MemberPicker, type PickerMember } from "./member-picker";
import { cn } from "@/lib/utils";

const ideas = ["Read Ephesians 1–3", "Attend Night Watch at least twice", "Call or visit one person from church", "Fast on Wednesday until 12 noon", "Pray 30 minutes for Lagos"];

/** Add an item to a week's checklist: for everyone, a team or chosen people, once or every week. */
export function WeekItemForm({
  week,
  teams,
  members,
  action,
}: {
  week: string;
  teams: { id: string; name: string }[];
  members: PickerMember[];
  action: (fd: FormData) => void;
}) {
  const [audience, setAudience] = useState<"everyone" | "team" | "selected">("everyone");
  const [chosen, setChosen] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  return (
    <form action={action} className="rounded-md border border-steel bg-white p-5">
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="members" value={JSON.stringify(chosen)} />
      <label htmlFor="item-title" className="text-sm font-medium text-paper">
        Add to the checklist
      </label>
      <input
        id="item-title"
        name="title"
        required
        maxLength={300}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Read Ephesians 1–3"
        className="mt-2 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper outline-none focus:border-gold"
      />
      {!title && (
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
        <select name="team_id" required className="mt-3 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper">
          {teams.length === 0 && <option value="">No teams yet</option>}
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      {audience === "selected" && <MemberPicker members={members} selected={chosen} onChange={setChosen} />}

      <label className="mt-4 flex items-start gap-2.5 text-sm text-paper">
        <input type="checkbox" name="repeats" className="mt-0.5 h-4 w-4 accent-[#c9952f]" />
        <span>
          Every week from now on
          <span className="block text-xs text-paper-dim">It rolls into each new week until you stop it.</span>
        </span>
      </label>
      <button className="mt-4 h-10 w-full rounded-sm bg-gold text-sm font-medium text-ink hover:bg-gold-soft">Add to this week</button>
    </form>
  );
}
