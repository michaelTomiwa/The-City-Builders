"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { dateOfDay, kindOrder, stepKinds, templates, type DraftStep, type Program, type Step, type StepKind } from "@/lib/discipleship";
import { cn } from "@/lib/utils";
import { fieldHint, fieldLabel } from "./ui";
import { ImageField } from "./image-field";
import { MemberPicker, type PickerMember } from "./member-picker";
import { KindIcon } from "@/components/members/kind-icon";

type Row = DraftStep & { key: string };

let counter = 0;
const key = () => `s${++counter}`;

function toRows(steps: DraftStep[]): Row[] {
  return steps.map((s) => ({ ...s, key: key() }));
}

export function ProgramForm({
  program,
  steps = [],
  members,
  selected = [],
  defaultStart,
  action,
}: {
  program?: Program;
  steps?: Step[];
  members: PickerMember[];
  selected?: string[];
  defaultStart: string;
  action: (fd: FormData) => void;
}) {
  const [title, setTitle] = useState(program?.title ?? "");
  const [objective, setObjective] = useState(program?.objective ?? "");
  const [days, setDays] = useState(program?.days ?? 3);
  const [start, setStart] = useState(program?.start_date ?? defaultStart);
  const [audience, setAudience] = useState<"everyone" | "selected">(program?.audience ?? "everyone");
  const [chosen, setChosen] = useState<string[]>(selected);
  const [status, setStatus] = useState<Program["status"]>(program?.status ?? "draft");
  const [rows, setRows] = useState<Row[]>(() =>
    toRows(steps.map((s) => ({ id: s.id, day: s.day, kind: s.kind, title: s.title, details: s.details, scripture: s.scripture, minutes: s.minutes })))
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => i + 1), [days]);

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (rows.length && !confirm("Replace the current steps with this template?")) return;
    setTitle(t.title);
    setObjective(t.objective);
    setDays(t.days);
    setRows(toRows(t.steps));
  }

  function update(k: string, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.key === k ? { ...x, ...patch } : x)));
  }

  function add(day: number, kind: StepKind = "pray") {
    const row: Row = { key: key(), day, kind, title: "", details: null, scripture: null, minutes: kind === "pray" ? 30 : null };
    setRows((r) => [...r, row]);
    setOpenKey(row.key);
  }

  function remove(k: string) {
    setRows((r) => r.filter((x) => x.key !== k));
  }

  function move(k: string, dir: -1 | 1) {
    setRows((r) => {
      const i = r.findIndex((x) => x.key === k);
      const day = r[i].day;
      let j = i + dir;
      while (j >= 0 && j < r.length && r[j].day !== day) j += dir;
      if (j < 0 || j >= r.length) return r;
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function copyToAllDays(day: number) {
    const source = rows.filter((r) => r.day === day);
    if (!source.length) return;
    if (!confirm(`Copy day ${day}'s steps to every other day? Steps already on those days stay.`)) return;
    const copies = dayList
      .filter((d) => d !== day)
      .flatMap((d) => source.map((s) => ({ ...s, id: undefined, key: key(), day: d })));
    setRows((r) => [...r, ...copies]);
  }

  const outOfRange = rows.filter((r) => r.day > days).length;
  const ordered = [...rows].sort((a, b) => a.day - b.day);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      {program && <input type="hidden" name="id" value={program.id} />}
      <input
        type="hidden"
        name="steps"
        value={JSON.stringify(ordered.map((r) => ({ id: r.id, day: r.day, kind: r.kind, title: r.title, details: r.details, scripture: r.scripture, minutes: r.minutes })))}
      />
      <input type="hidden" name="members" value={JSON.stringify(chosen)} />

      <div className="min-w-0 space-y-6">
        {!program && (
          <div className="rounded-md border border-steel bg-white/80 p-4">
            <p className={fieldLabel}>Start from a template</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="rounded-sm border border-steel bg-white px-3 py-2.5 text-left transition-colors hover:border-gold"
                >
                  <span className="block text-sm font-medium text-paper">{t.title}</span>
                  <span className="text-xs text-paper-dim">
                    {t.days} days · {t.steps.length} steps
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="title" className={fieldLabel}>
            Programme name
          </label>
          <Input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-12 bg-white font-display text-xl" placeholder="3 days of prayer for light" />
        </div>
        <div>
          <label htmlFor="objective" className={fieldLabel}>
            Objective
          </label>
          <Input id="objective" name="objective" value={objective} onChange={(e) => setObjective(e.target.value)} className="mt-2 bg-white" placeholder="What are we believing God for?" />
        </div>
        <div>
          <label htmlFor="teaching" className={fieldLabel}>
            Word from the pastor
          </label>
          <Textarea id="teaching" name="teaching" rows={6} defaultValue={program?.teaching ?? ""} className="mt-2 bg-white" placeholder="Why we're doing this, scriptures to hold onto, how to fast safely…" />
          <p className={fieldHint}>Shown beside the steps. Use **bold**, ## headings, &gt; quotes and - lists.</p>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-paper">Daily steps</h2>
            <span className="text-sm text-paper-dim">{rows.length} steps</span>
          </div>
          {outOfRange > 0 && (
            <p className="mt-2 text-sm text-[#8a2f1e]">
              {outOfRange} {outOfRange === 1 ? "step is" : "steps are"} after day {days} and won&apos;t be saved.
            </p>
          )}
          <div className="mt-4 space-y-4">
            {dayList.map((d) => {
              const dayRows = rows.filter((r) => r.day === d);
              return (
                <section key={d} className="rounded-md border border-steel bg-white/80">
                  <header className="flex items-center justify-between gap-3 border-b border-steel px-4 py-2.5">
                    <p className="text-sm">
                      <span className="font-medium text-paper">Day {d}</span>
                      <span className="ml-2 text-paper-dim">{start ? dateOfDay({ start_date: start }, d) : ""}</span>
                    </p>
                    {dayRows.length > 0 && days > 1 && (
                      <button type="button" onClick={() => copyToAllDays(d)} className="text-xs text-paper-dim hover:text-gold-text">
                        Copy to every day
                      </button>
                    )}
                  </header>
                  <ul className="divide-y divide-steel">
                    {dayRows.map((r) => {
                      const open = openKey === r.key || !r.title;
                      return (
                        <li key={r.key} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <KindIcon kind={r.kind} className="h-8 w-8" />
                            <input
                              value={r.title}
                              onChange={(e) => update(r.key, { title: e.target.value })}
                              placeholder={`${stepKinds[r.kind].label}: what should they do?`}
                              className="h-9 min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 text-paper outline-none hover:border-steel focus:border-gold focus:bg-white"
                            />
                            <div className="flex shrink-0 items-center gap-1 text-paper-dim">
                              <button type="button" onClick={() => move(r.key, -1)} className="rounded px-1.5 py-1 hover:bg-dusk" aria-label="Move up">
                                ↑
                              </button>
                              <button type="button" onClick={() => move(r.key, 1)} className="rounded px-1.5 py-1 hover:bg-dusk" aria-label="Move down">
                                ↓
                              </button>
                              <button type="button" onClick={() => setOpenKey(open ? null : r.key)} className="rounded px-2 py-1 text-xs hover:bg-dusk">
                                {open ? "Done" : "Edit"}
                              </button>
                              <button type="button" onClick={() => remove(r.key)} className="rounded px-1.5 py-1 text-[#8a2f1e] hover:bg-[#fbefec]" aria-label="Remove step">
                                ✕
                              </button>
                            </div>
                          </div>
                          {open && (
                            <div className="mt-3 grid gap-3 pl-11 sm:grid-cols-3">
                              <label className="text-xs text-paper-dim">
                                Kind
                                <select
                                  value={r.kind}
                                  onChange={(e) => update(r.key, { kind: e.target.value as StepKind })}
                                  className="mt-1 h-9 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper"
                                >
                                  {kindOrder.map((k) => (
                                    <option key={k} value={k}>
                                      {stepKinds[k].label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="text-xs text-paper-dim">
                                Minutes (optional)
                                <input
                                  type="number"
                                  min={1}
                                  value={r.minutes ?? ""}
                                  onChange={(e) => update(r.key, { minutes: e.target.value ? Number(e.target.value) : null })}
                                  className="mt-1 h-9 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper"
                                />
                              </label>
                              <label className="text-xs text-paper-dim">
                                Scripture (optional)
                                <input
                                  value={r.scripture ?? ""}
                                  onChange={(e) => update(r.key, { scripture: e.target.value })}
                                  placeholder="John 1:1-14"
                                  className="mt-1 h-9 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper"
                                />
                              </label>
                              <label className="text-xs text-paper-dim sm:col-span-3">
                                Guidance (optional)
                                <textarea
                                  value={r.details ?? ""}
                                  onChange={(e) => update(r.key, { details: e.target.value })}
                                  rows={2}
                                  placeholder="How to do it, what to focus on…"
                                  className="mt-1 w-full rounded-sm border border-steel bg-white px-2 py-1.5 text-sm text-paper"
                                />
                              </label>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap gap-1.5 px-4 py-2.5">
                    {(["pray", "fast", "study", "attend", "reflect", "custom"] as StepKind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => add(d, k)}
                        className="rounded-full border border-dashed border-steel px-3 py-1 text-xs text-paper-dim hover:border-gold hover:text-paper"
                      >
                        + {stepKinds[k].label}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <fieldset className="rounded-md border border-steel bg-white/80 p-4">
          <legend className="px-1 text-sm font-medium text-paper">Status</legend>
          {(
            [
              { id: "draft", label: "Draft", hint: "Only you can see it" },
              { id: "published", label: "Published", hint: "Members see it on their dashboard" },
              { id: "archived", label: "Archived", hint: "Hidden, progress kept" },
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

        <div className="grid grid-cols-2 gap-3 rounded-md border border-steel bg-white/80 p-4">
          <label className="text-sm text-paper">
            Starts
            <input type="date" name="start_date" required value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm" />
          </label>
          <label className="text-sm text-paper">
            Days
            <input
              type="number"
              name="days"
              min={1}
              max={90}
              required
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
              className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm"
            />
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

        <div className="rounded-md border border-steel bg-white/80 p-4">
          <ImageField name="cover_image_url" label="Cover image (optional)" defaultValue={program?.cover_image_url ?? ""} folder="programs" />
        </div>

        <Button type="submit" className="w-full">
          {status === "published" ? (program?.status === "published" ? "Save changes" : "Publish programme") : "Save"}
        </Button>
      </aside>
    </form>
  );
}
