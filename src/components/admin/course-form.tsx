"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { starterCourse, type Course, type DraftLesson } from "@/lib/school";
import { cn } from "@/lib/utils";
import { fieldHint, fieldLabel } from "./ui";
import { ImageField } from "./image-field";

type Row = DraftLesson & { key: string };
let n = 0;
const k = () => `l${++n}`;

export function CourseForm({ course, lessons = [], action }: { course?: Course; lessons?: DraftLesson[]; action: (fd: FormData) => void }) {
  const [title, setTitle] = useState(course?.title ?? "");
  const [summary, setSummary] = useState(course?.summary ?? "");
  const [status, setStatus] = useState<Course["status"]>(course?.status ?? "draft");
  const [rows, setRows] = useState<Row[]>(() => lessons.map((l) => ({ ...l, key: k() })));
  const [open, setOpen] = useState<string | null>(null);

  function loadStarter() {
    if (rows.length && !confirm("Replace the lessons with the Foundations of Faith course?")) return;
    setTitle(starterCourse.title);
    setSummary(starterCourse.summary);
    const next = starterCourse.lessons.map((l) => ({ ...l, questions: l.questions.map((q) => ({ ...q })), key: k() }));
    setRows(next);
    setOpen(next[0].key);
  }

  const update = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const move = (key: string, dir: -1 | 1) =>
    setRows((r) => {
      const i = r.findIndex((x) => x.key === key);
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  function addLesson() {
    const row: Row = { key: k(), title: "", video_url: null, scripture: null, body: null, questions: [] };
    setRows((r) => [...r, row]);
    setOpen(row.key);
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      {course && <input type="hidden" name="id" value={course.id} />}
      <input
        type="hidden"
        name="lessons"
        value={JSON.stringify(rows.map((r) => ({ id: r.id, title: r.title, video_url: r.video_url, scripture: r.scripture, body: r.body, questions: r.questions })))}
      />

      <div className="min-w-0 space-y-6">
        {!course && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gold/50 bg-gold/10 p-4">
            <p className="text-sm text-paper">
              <span className="font-medium">New here?</span> Load a complete 4-lesson course with notes and quizzes, then make it yours.
            </p>
            <button type="button" onClick={loadStarter} className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">
              Load &ldquo;Foundations of Faith&rdquo;
            </button>
          </div>
        )}
        <div>
          <label htmlFor="title" className={fieldLabel}>
            Course title
          </label>
          <Input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-12 bg-white font-display text-xl" placeholder="Foundations of Faith" />
        </div>
        <div>
          <label htmlFor="summary" className={fieldLabel}>
            Summary
          </label>
          <Textarea id="summary" name="summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-2 bg-white" />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-paper">Lessons</h2>
            <span className="text-sm text-paper-dim">{rows.length} lessons</span>
          </div>
          <ol className="mt-4 space-y-3">
            {rows.map((r, i) => {
              const isOpen = open === r.key || !r.title;
              return (
                <li key={r.key} className="rounded-md border border-steel bg-white/90">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dusk font-display text-paper">{i + 1}</span>
                    <input
                      value={r.title}
                      onChange={(e) => update(r.key, { title: e.target.value })}
                      placeholder="Lesson title"
                      className="h-9 min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 font-medium text-paper outline-none hover:border-steel focus:border-gold focus:bg-white"
                    />
                    <span className="hidden text-xs text-paper-dim sm:inline">{r.questions.length} questions</span>
                    <button type="button" onClick={() => move(r.key, -1)} className="rounded px-1.5 py-1 text-paper-dim hover:bg-dusk" aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(r.key, 1)} className="rounded px-1.5 py-1 text-paper-dim hover:bg-dusk" aria-label="Move down">
                      ↓
                    </button>
                    <button type="button" onClick={() => setOpen(isOpen ? null : r.key)} className="rounded px-2 py-1 text-xs text-paper-dim hover:bg-dusk">
                      {isOpen ? "Close" : "Edit"}
                    </button>
                    <button type="button" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))} className="rounded px-1.5 py-1 text-[#8a2f1e] hover:bg-[#fbefec]" aria-label="Remove lesson">
                      ✕
                    </button>
                  </div>
                  {isOpen && (
                    <div className="space-y-4 border-t border-steel px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs text-paper-dim">
                          YouTube video (optional)
                          <input value={r.video_url ?? ""} onChange={(e) => update(r.key, { video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" className="mt-1 h-9 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper" />
                        </label>
                        <label className="text-xs text-paper-dim">
                          Scripture (optional)
                          <input value={r.scripture ?? ""} onChange={(e) => update(r.key, { scripture: e.target.value })} placeholder="John 3:1-21" className="mt-1 h-9 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper" />
                        </label>
                      </div>
                      <label className="block text-xs text-paper-dim">
                        Teaching notes
                        <textarea value={r.body ?? ""} onChange={(e) => update(r.key, { body: e.target.value })} rows={8} className="mt-1 w-full rounded-sm border border-steel bg-white px-3 py-2 font-mono text-sm text-paper" />
                      </label>

                      <div>
                        <p className="text-sm font-medium text-paper">Quiz</p>
                        <p className={fieldHint}>Members need 70% to pass. Leave empty for a reading-only lesson. Tap a letter to mark the right answer.</p>
                        <ol className="mt-3 space-y-3">
                          {r.questions.map((q, qi) => (
                            <li key={qi} className="rounded-sm border border-steel bg-dusk/30 p-3">
                              <div className="flex gap-2">
                                <input
                                  value={q.question}
                                  onChange={(e) => update(r.key, { questions: r.questions.map((x, j) => (j === qi ? { ...x, question: e.target.value } : x)) })}
                                  placeholder={`Question ${qi + 1}`}
                                  className="h-9 min-w-0 flex-1 rounded-sm border border-steel bg-white px-2 text-sm text-paper"
                                />
                                <button type="button" onClick={() => update(r.key, { questions: r.questions.filter((_, j) => j !== qi) })} className="px-2 text-[#8a2f1e]" aria-label="Remove question">
                                  ✕
                                </button>
                              </div>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {[0, 1, 2, 3].map((oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => update(r.key, { questions: r.questions.map((x, j) => (j === qi ? { ...x, answer: oi } : x)) })}
                                      className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs", q.answer === oi ? "border-[#3d9a6a] bg-[#3d9a6a] text-white" : "border-steel bg-white text-paper-dim")}
                                      title="Mark as the right answer"
                                    >
                                      {String.fromCharCode(65 + oi)}
                                    </button>
                                    <input
                                      value={q.options[oi] ?? ""}
                                      onChange={(e) =>
                                        update(r.key, {
                                          questions: r.questions.map((x, j) => {
                                            if (j !== qi) return x;
                                            const options = [...x.options];
                                            while (options.length < 4) options.push("");
                                            options[oi] = e.target.value;
                                            return { ...x, options };
                                          }),
                                        })
                                      }
                                      placeholder={oi < 2 ? `Option ${String.fromCharCode(65 + oi)}` : "Optional"}
                                      className="h-8 min-w-0 flex-1 rounded-sm border border-steel bg-white px-2 text-sm text-paper"
                                    />
                                  </div>
                                ))}
                              </div>
                              <input
                                value={q.explanation ?? ""}
                                onChange={(e) => update(r.key, { questions: r.questions.map((x, j) => (j === qi ? { ...x, explanation: e.target.value } : x)) })}
                                placeholder="Explanation shown after answering (optional)"
                                className="mt-2 h-8 w-full rounded-sm border border-steel bg-white px-2 text-xs text-paper"
                              />
                            </li>
                          ))}
                        </ol>
                        <button
                          type="button"
                          onClick={() => update(r.key, { questions: [...r.questions, { question: "", options: ["", "", "", ""], answer: 0, explanation: null }] })}
                          className="mt-3 rounded-full border border-dashed border-steel px-3 py-1 text-xs text-paper-dim hover:border-gold hover:text-paper"
                        >
                          + Add a question
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={addLesson} className="mt-4 w-full rounded-md border-2 border-dashed border-steel py-3 text-sm text-paper-dim hover:border-gold hover:text-paper">
            + Add a lesson
          </button>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <fieldset className="rounded-md border border-steel bg-white/80 p-4">
          <legend className="px-1 text-sm font-medium text-paper">Status</legend>
          {(
            [
              { id: "draft", label: "Draft", hint: "Only staff can see it" },
              { id: "published", label: "Published", hint: "In every member's School" },
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
        <div className="rounded-md border border-steel bg-white/80 p-4">
          <label className="text-sm text-paper">
            Order in the School
            <input type="number" name="sort" defaultValue={course?.sort ?? 0} className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm" />
          </label>
          <p className="mt-1 text-xs text-paper-dim">Lower numbers show first.</p>
        </div>
        <div className="rounded-md border border-steel bg-white/80 p-4">
          <ImageField name="cover_image_url" label="Cover image (optional)" defaultValue={course?.cover_image_url ?? ""} folder="courses" />
        </div>
        <Button type="submit" className="w-full">
          {status === "published" && course?.status !== "published" ? "Publish course" : "Save course"}
        </Button>
      </aside>
    </form>
  );
}
