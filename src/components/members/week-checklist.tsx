"use client";

import { useRef, useState, useTransition } from "react";
import { handInWeekItem, tickWeekItem } from "@/app/me/week-actions";
import { createClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

export type ChecklistItem = {
  id: string;
  title: string;
  details: string | null;
  group: string;
  personal: boolean;
  submit?: "none" | "optional" | "required";
  prompt?: string | null;
};

export type TickInfo = {
  note: string | null;
  body?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
  feedback?: string | null;
};

/** The week's items with big tick boxes. Ticking saves straight away; some items ask for a write-up or a file. */
export function WeekChecklist({
  items,
  ticked,
  userId,
  removeAction,
}: {
  items: ChecklistItem[];
  ticked: Record<string, TickInfo>;
  userId: string;
  removeAction?: (fd: FormData) => void;
}) {
  const [done, setDone] = useState<Record<string, TickInfo>>(ticked);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [handInFor, setHandInFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const groups = [...new Set(items.map((i) => i.group))];

  function toggle(item: ChecklistItem) {
    const id = item.id;
    const was = id in done;
    const info = done[id];
    if (!was && item.submit === "required") {
      setHandInFor(id);
      return;
    }
    if (was && (info?.body || info?.filePath) && !window.confirm("Untick this? What you handed in will be removed.")) return;
    setError(null);
    setDone((d) => {
      const next = { ...d };
      if (was) delete next[id];
      else next[id] = { note: null };
      return next;
    });
    if (!was && (item.submit ?? "none") === "none") setNoteFor(id);
    start(async () => {
      const r = await tickWeekItem(id, !was);
      if (r?.error) {
        setError(r.error);
        setDone((d) => {
          const next = { ...d };
          if (was) next[id] = info ?? { note: null };
          else delete next[id];
          return next;
        });
      }
    });
  }

  function saveNote(id: string, note: string) {
    setDone((d) => ({ ...d, [id]: { ...d[id], note: note || null } }));
    setNoteFor(null);
    start(async () => {
      await tickWeekItem(id, true, note);
    });
  }

  return (
    <div className="space-y-8">
      {error && <p className="rounded-sm bg-[#fbefec] px-3 py-2 text-sm text-[#8a2f1e]">{error}</p>}
      {groups.map((g) => (
        <section key={g}>
          <h3 className="text-sm font-medium text-gold-text">{g}</h3>
          <ul className="mt-3 space-y-2.5">
            {items
              .filter((i) => i.group === g)
              .map((item) => {
                const isDone = item.id in done;
                const info = done[item.id];
                const gaveWork = Boolean(info?.body || info?.filePath);
                const asks = item.submit && item.submit !== "none";
                return (
                  <li key={item.id} className={cn("rounded-md border bg-white p-4 transition-colors", isDone ? "border-[#bfe0c8] bg-[#f4faf5]" : "border-steel")}>
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => toggle(item)}
                        aria-pressed={isDone}
                        aria-label={isDone ? `Untick ${item.title}` : `Tick ${item.title}`}
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          isDone ? "scale-105 border-[#3d9a6a] bg-[#3d9a6a] text-white" : "border-steel bg-white hover:border-gold"
                        )}
                      >
                        {isDone && (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                            <path d="M5 12l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[1.05rem] leading-snug", isDone ? "text-paper-dim line-through decoration-[#3d9a6a]/60" : "text-paper")}>{item.title}</p>
                        {item.details && <p className="mt-1 text-sm leading-relaxed text-paper-dim">{item.details}</p>}
                        {asks && !gaveWork && handInFor !== item.id && (
                          <button
                            type="button"
                            onClick={() => setHandInFor(item.id)}
                            className={cn(
                              "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                              item.submit === "required" ? "bg-gold/20 text-gold-text hover:bg-gold/30" : "bg-dusk text-paper-dim hover:text-paper"
                            )}
                          >
                            <span aria-hidden="true">📎</span>
                            {item.submit === "required" ? "Hand in to tick this" : "Hand something in (optional)"}
                          </button>
                        )}
                        {gaveWork && handInFor !== item.id && (
                          <div className="mt-3 rounded-sm border border-[#bfe0c8] bg-white p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[#24613a]">✓ Handed in</span>
                              <button type="button" onClick={() => setHandInFor(item.id)} className="text-xs text-gold-text hover:underline">
                                Edit
                              </button>
                            </div>
                            {info?.body && <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-paper">{info.body}</p>}
                            {info?.fileName &&
                              (info.fileUrl ? (
                                <a href={info.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1.5 text-gold-text hover:underline">
                                  <span aria-hidden="true">📄</span>
                                  {info.fileName}
                                </a>
                              ) : (
                                <p className="mt-1.5 flex items-center gap-1.5 text-paper-dim">
                                  <span aria-hidden="true">📄</span>
                                  {info.fileName}
                                </p>
                              ))}
                          </div>
                        )}
                        {info?.feedback && (
                          <div className="mt-2 rounded-sm bg-night p-3 text-sm text-starlight">
                            <p className="text-xs text-lamp">From the pastor</p>
                            <p className="mt-1 whitespace-pre-line">{info.feedback}</p>
                          </div>
                        )}
                        {handInFor === item.id && (
                          <HandIn
                            item={item}
                            userId={userId}
                            initial={info}
                            onCancel={() => setHandInFor(null)}
                            onDone={(next) => {
                              setDone((d) => ({ ...d, [item.id]: { ...d[item.id], note: d[item.id]?.note ?? null, ...next } }));
                              setHandInFor(null);
                            }}
                          />
                        )}
                        {isDone && !asks && info?.note && noteFor !== item.id && (
                          <button type="button" onClick={() => setNoteFor(item.id)} className="mt-1.5 text-left text-sm text-[#24613a]">
                            &ldquo;{info.note}&rdquo;
                          </button>
                        )}
                        {isDone && noteFor === item.id && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveNote(item.id, String(new FormData(e.currentTarget).get("note") ?? "").trim());
                            }}
                            className="mt-2 flex gap-2"
                          >
                            <input
                              name="note"
                              autoFocus
                              defaultValue={info?.note ?? ""}
                              maxLength={500}
                              placeholder="Add a note (optional), e.g. who you called"
                              className="h-9 min-w-0 flex-1 rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
                            />
                            <button className="h-9 rounded-sm bg-night px-3 text-sm text-starlight">Save</button>
                            <button type="button" onClick={() => setNoteFor(null)} className="text-sm text-paper-dim">
                              Skip
                            </button>
                          </form>
                        )}
                      </div>
                      {item.personal && removeAction && (
                        <form action={removeAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="text-xs text-paper-dim hover:text-[#8a2f1e]" aria-label={`Remove ${item.title}`}>
                            Remove
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Write it up and/or attach a file (PDF, Word document, photo or voice note). Handing in ticks the item. */
function HandIn({
  item,
  userId,
  initial,
  onCancel,
  onDone,
}: {
  item: ChecklistItem;
  userId: string;
  initial?: TickInfo;
  onCancel: () => void;
  onDone: (info: Partial<TickInfo>) => void;
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [file, setFile] = useState<{ path: string; name: string } | null>(initial?.filePath ? { path: initial.filePath, name: initial.fileName ?? "File" } : null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(f: File | undefined) {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return setError("That file is over 20 MB.");
    setUploading(true);
    setError(null);
    const safe = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
    const path = `${userId}/week/${item.id}/${Date.now()}-${safe}`;
    const { error } = await createClient().storage.from("submissions").upload(path, f, { contentType: f.type || undefined });
    setUploading(false);
    if (error) setError("The file didn't upload. Check your connection and try again.");
    else setFile({ path, name: f.name });
    if (input.current) input.current.value = "";
  }

  async function send() {
    setSending(true);
    setError(null);
    const r = await handInWeekItem(item.id, { body, filePath: file?.path ?? null, fileName: file?.name ?? null });
    setSending(false);
    if (r?.error) return setError(r.error);
    onDone({ body: body.trim() || null, filePath: file?.path ?? null, fileName: file?.name ?? null, fileUrl: file?.path === initial?.filePath ? initial?.fileUrl : null });
  }

  return (
    <div className="mt-3 rounded-md border border-gold/50 bg-white p-4">
      <p className="text-sm font-medium text-paper">{item.prompt || "Hand in your work"}</p>
      <p className="text-xs text-paper-dim">Write it here, attach a file, or both. Only the pastor sees it.</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        maxLength={20000}
        autoFocus
        placeholder="Write your report or reflection here…"
        className="mt-3 w-full resize-y rounded-sm border border-steel bg-white px-3 py-2 text-[0.95rem] leading-relaxed text-paper outline-none focus:border-gold"
      />
      <input ref={input} type="file" className="sr-only" tabIndex={-1} accept="application/pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,image/*,audio/*" onChange={(e) => upload(e.target.files?.[0])} />
      {file ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-sm border border-steel bg-dusk/50 px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-paper">
            <span aria-hidden="true">📄</span>
            <span className="truncate">{file.name}</span>
          </span>
          <button type="button" onClick={() => setFile(null)} className="shrink-0 text-[#8a2f1e] hover:underline">
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border-2 border-dashed border-steel py-3.5 text-sm text-paper-dim hover:border-gold hover:text-paper"
        >
          {uploading ? "Uploading…" : "📎 Attach a PDF, Word document, photo or voice note"}
        </button>
      )}
      {error && (
        <p className="mt-2 text-sm text-[#8a2f1e]" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={uploading || sending || (!body.trim() && !file)}
          className="h-10 rounded-sm bg-gold px-5 text-sm font-medium text-ink hover:bg-gold-soft disabled:opacity-50"
        >
          {sending ? "Handing in…" : initial?.body || initial?.filePath ? "Save changes" : "Hand in"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-paper-dim hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  );
}
