"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@/lib/discipleship";
import { cn } from "@/lib/utils";
import { fieldHint, fieldLabel } from "./ui";
import { MemberPicker, type PickerMember } from "./member-picker";

function toLagosInput(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 16);
}

export function AssignmentForm({
  assignment,
  programs,
  members,
  selected = [],
  action,
}: {
  assignment?: Assignment;
  programs: { id: string; title: string }[];
  members: PickerMember[];
  selected?: string[];
  action: (fd: FormData) => void;
}) {
  const [audience, setAudience] = useState<"everyone" | "selected">(assignment?.audience ?? "everyone");
  const [chosen, setChosen] = useState<string[]>(selected);
  const [status, setStatus] = useState<Assignment["status"]>(assignment?.status ?? "draft");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      {assignment && <input type="hidden" name="id" value={assignment.id} />}
      <input type="hidden" name="members" value={JSON.stringify(chosen)} />

      <div className="min-w-0 space-y-6">
        <div>
          <label htmlFor="title" className={fieldLabel}>
            Title
          </label>
          <Input id="title" name="title" required defaultValue={assignment?.title ?? ""} className="mt-2 h-12 bg-white font-display text-xl" placeholder="Write out your testimony" />
        </div>
        <div>
          <label htmlFor="instructions" className={fieldLabel}>
            Instructions and teaching
          </label>
          <Textarea
            id="instructions"
            name="instructions"
            rows={12}
            defaultValue={assignment?.instructions ?? ""}
            className="mt-2 bg-white"
            placeholder={"## What to do\n\nRead Nehemiah 1 and 2. Then answer:\n\n1. What burden did Nehemiah carry?\n2. What wall is God asking you to rebuild?\n\n> \"Let us rise up and build.\" Nehemiah 2:18"}
          />
          <p className={fieldHint}>Members read this in full. Use ## headings, **bold**, &gt; quotes, lists and links.</p>
        </div>
        <div>
          <label htmlFor="resources" className={fieldLabel}>
            Resources (optional)
          </label>
          <Textarea
            id="resources"
            name="resources"
            rows={4}
            defaultValue={assignment?.resources ?? ""}
            className="mt-2 bg-white"
            placeholder={"- [Sermon: Rise and build](https://youtube.com/…)\n- Nehemiah 1–2"}
          />
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <fieldset className="rounded-md border border-steel bg-white/80 p-4">
          <legend className="px-1 text-sm font-medium text-paper">Status</legend>
          {(
            [
              { id: "draft", label: "Draft", hint: "Only you can see it" },
              { id: "published", label: "Published", hint: "Members can see it and hand in" },
              { id: "archived", label: "Archived", hint: "Hidden, submissions kept" },
            ] as const
          ).map((o) => (
            <label key={o.id} className="flex cursor-pointer items-start gap-2.5 rounded p-1.5 text-sm hover:bg-dusk/60">
              <input type="radio" name="status" value={o.id} checked={status === o.id} onChange={() => setStatus(o.id)} className="mt-1 accent-gold" />
              <span>
                <span className="block text-paper">{o.label}</span>
                <span className="text-paper-dim">{o.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-3 rounded-md border border-steel bg-white/80 p-4">
          <label className="block text-sm text-paper">
            Due (Lagos time, optional)
            <input type="datetime-local" name="due_at" defaultValue={toLagosInput(assignment?.due_at ?? null)} className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm" />
          </label>
          <label className="block text-sm text-paper">
            Grace period after the due date
            <select name="grace_hours" defaultValue={String(assignment?.grace_hours ?? 48)} className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm">
              <option value="0">None: missed at the due time</option>
              <option value="24">1 day</option>
              <option value="48">2 days</option>
              <option value="72">3 days</option>
              <option value="168">1 week</option>
            </select>
            <span className="mt-1 block text-xs text-paper-dim">Late hand-ins in this time count as late, not missed. After it, people who haven&rsquo;t handed in get a gentle message from you.</span>
          </label>
          <label className="block text-sm text-paper">
            Part of a programme (optional)
            <select name="program_id" defaultValue={assignment?.program_id ?? ""} className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm">
              <option value="">None</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="rounded-md border border-steel bg-white/80 p-4">
          <legend className="px-1 text-sm font-medium text-paper">Who is it for?</legend>
          <div className="grid grid-cols-2 gap-1 rounded bg-dusk p-1 text-sm">
            {(["everyone", "selected"] as const).map((a) => (
              <label key={a} className={cn("cursor-pointer rounded py-1.5 text-center", audience === a ? "bg-white text-paper shadow-sm" : "text-paper-dim")}>
                <input type="radio" name="audience" value={a} checked={audience === a} onChange={() => setAudience(a)} className="sr-only" />
                {a === "everyone" ? "Everyone" : "Chosen people"}
              </label>
            ))}
          </div>
          {audience === "selected" && <MemberPicker members={members} selected={chosen} onChange={setChosen} />}
        </fieldset>

        <Button type="submit" className="w-full">
          {status === "published" && assignment?.status !== "published" ? "Publish assignment" : "Save"}
        </Button>
      </aside>
    </form>
  );
}
