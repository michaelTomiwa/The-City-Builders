"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

/*
  A Word-style editor for blog posts: what you see is what readers get.
  Saves HTML into a hidden form field, keeps an unsaved copy in this browser
  in case the page closes, and takes pasted or dropped photos.
*/

const fonts = [
  { label: "Default", value: "" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];
const sizes = ["", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"];
const textColors = ["#18203a", "#5b6478", "#a3402b", "#c2492f", "#c9952f", "#24613a", "#29457a", "#5b3f8f"];
const highlights = ["#fbe7a8", "#d6efd8", "#d8e6fb", "#f8d7e3", "#eadcf8"];

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm transition-colors disabled:opacity-35",
        active ? "bg-gold/25 text-paper" : "text-paper-dim hover:bg-white hover:text-paper",
        className
      )}
    >
      {children}
    </button>
  );
}

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-[18px] w-[18px]", className)} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  undo: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  redo: "m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3",
  left: "M4 6h16M4 10h10M4 14h16M4 18h10",
  center: "M4 6h16M7 10h10M4 14h16M7 18h10",
  right: "M4 6h16M10 10h10M4 14h16M10 18h10",
  justify: "M4 6h16M4 10h16M4 14h16M4 18h16",
  bullets: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  numbers: "M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3M3 11h2.5a.5.5 0 0 1 0 2H3",
  tasks: "m3.5 6 1.5 1.5L8 4.5M11 6h9M3.5 13.5h4v4h-4zM11 15.5h9",
  quote: "M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6",
  rule: "M4 12h16",
  link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  image: "M4 5h16v14H4zM8.5 10a1.5 1.5 0 1 0 0-.01M20 15l-5-5-9 9",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14",
  clear: "M6 6h12M12 6l-3 13M4 20l16-16",
  find: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  shrink: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  indent: "M4 6h16M10 10h10M10 14h10M4 18h16M4 9l3 3-3 3",
  outdent: "M4 6h16M10 10h10M10 14h10M4 18h16M7 9l-3 3 3 3",
};

function Sep() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-steel" aria-hidden="true" />;
}

/** Replace every match of `find` (any case) with `replace`; returns how many were changed. */
function replaceAll(editor: Editor, find: string, replace: string) {
  if (!find) return 0;
  const matches: { from: number; to: number }[] = [];
  const needle = find.toLowerCase();
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const hay = node.text.toLowerCase();
    let i = hay.indexOf(needle);
    while (i !== -1) {
      matches.push({ from: pos + i, to: pos + i + find.length });
      i = hay.indexOf(needle, i + find.length);
    }
  });
  if (!matches.length) return 0;
  const tr = editor.state.tr;
  for (const m of matches.reverse()) {
    if (replace) tr.insertText(replace, m.from, m.to);
    else tr.delete(m.from, m.to);
  }
  editor.view.dispatch(tr);
  return matches.length;
}

function countMatches(editor: Editor | null, find: string) {
  if (!editor || !find) return 0;
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n").toLowerCase();
  return text.split(find.toLowerCase()).length - 1;
}

export function RichEditor({ name, initialHtml, draftKey }: { name: string; initialHtml: string; draftKey: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [panel, setPanel] = useState<null | "link" | "find">(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [replaced, setReplaced] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ html: string; at: number } | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [counts, setCounts] = useState({ words: 0, chars: 0 });
  const editorRef = useRef<Editor | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const insertImages = useCallback(async (files: File[], at?: number) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return false;
    setError(null);
    for (const file of images) {
      setUploading((n) => n + 1);
      try {
        const src = await uploadImage(file, "posts");
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const ed = editorRef.current;
        if (ed) {
          const chain = ed.chain().focus();
          (at !== undefined ? chain.insertContentAt(at, { type: "image", attrs: { src, alt } }) : chain.setImage({ src, alt })).run();
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return true;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript,
      Superscript,
      Image.configure({ resize: { enabled: true, directions: ["top-left", "top-right", "bottom-left", "bottom-right"], minWidth: 80, alwaysPreserveAspectRatio: true } }),
      TableKit.configure({ table: { resizable: false } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing… Paste or drag photos straight in." }),
      CharacterCount,
    ],
    content: initialHtml,
    onCreate: ({ editor: ed }) => setCounts({ words: ed.storage.characterCount.words(), chars: ed.storage.characterCount.characters() }),
    editorProps: {
      attributes: { class: "post-body rich-editor-page", spellcheck: "true" },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.some((f) => f.type.startsWith("image/"))) {
          insertImages(files);
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.some((f) => f.type.startsWith("image/"))) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertImages(files, pos);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      setCounts({ words: ed.storage.characterCount.words(), chars: ed.storage.characterCount.characters() });
      const next = ed.isEmpty ? "" : ed.getHTML();
      setHtml(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify({ html: next, at: Date.now() }));
          setSavedAt(Date.now());
        } catch {
          // private browsing: no local copy, nothing else changes
        }
      }, 800);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // An unsaved copy from last time (the page closed, or the phone died).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(draftKey) ?? "null") as { html: string; at: number } | null;
        if (stored?.html && stored.html !== initialHtml) setDraft(stored);
      } catch {
        // nothing stored
      }
    }, 0);
    return () => clearTimeout(t);
  }, [draftKey, initialHtml]);

  // Once the post is saved, the local copy isn't needed.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const clear = () => {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
    };
    form.addEventListener("submit", clear);
    return () => form.removeEventListener("submit", clear);
  }, [draftKey]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            sub: e.isActive("subscript"),
            sup: e.isActive("superscript"),
            block: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : e.isActive("blockquote") ? "quote" : "p",
            align: (["center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
            bullets: e.isActive("bulletList"),
            numbers: e.isActive("orderedList"),
            tasks: e.isActive("taskList"),
            link: e.isActive("link"),
            table: e.isActive("table"),
            image: e.isActive("image"),
            font: (e.getAttributes("textStyle").fontFamily as string | undefined) ?? "",
            size: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
            color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            canIndent: e.can().sinkListItem("listItem") || e.can().sinkListItem("taskItem"),
            canOutdent: e.can().liftListItem("listItem") || e.can().liftListItem("taskItem"),
          }
        : null,
  });

  const c = () => editor!.chain().focus();

  function setBlock(value: string) {
    if (!editor) return;
    if (value === "p") c().setParagraph().run();
    else if (value === "quote") c().toggleBlockquote().run();
    else c().toggleHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }).run();
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) c().extendMarkRange("link").unsetLink().run();
    else {
      const href = /^(https?:|mailto:|tel:|\/)/.test(url) ? url : `https://${url}`;
      if (editor.state.selection.empty && !s?.link) c().insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href } }] }).run();
      else c().extendMarkRange("link").setLink({ href }).run();
    }
    setPanel(null);
  }

  const matches = panel === "find" ? countMatches(editor, find) : 0;
  const minutes = Math.max(1, Math.round(counts.words / 220));
  const select = "h-8 rounded border border-steel bg-white px-1.5 text-sm text-paper outline-none focus:border-gold";

  return (
    <div ref={rootRef} className={cn(full && "fixed inset-0 z-50 flex flex-col bg-[#e9eaed]")}>
      <input type="hidden" name={name} value={html} />

      {draft && (
        <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md border border-gold/60 bg-gold/10 px-4 py-2.5 text-sm">
          <span className="flex-1 text-paper">
            You have unsaved writing from{" "}
            {new Date(draft.at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" })}.
          </span>
          <button
            type="button"
            onClick={() => {
              editor?.commands.setContent(draft.html, { emitUpdate: true });
              setDraft(null);
            }}
            className="rounded-sm bg-gold px-3 py-1 font-medium text-ink hover:bg-gold-soft"
          >
            Restore it
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
              } catch {
                // ignore
              }
              setDraft(null);
            }}
            className="text-paper-dim hover:text-paper"
          >
            Discard
          </button>
        </div>
      )}

      <div className={cn("rounded-md border border-steel bg-[#e9eaed]", full && "flex min-h-0 flex-1 flex-col rounded-none border-0")}>
        {/* Ribbon */}
        <div className={cn("sticky top-0 z-10 border-b border-steel bg-[#f6f7f9]", !full && "rounded-t-md")}>
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
            <Btn title="Undo (Ctrl+Z)" onClick={() => c().undo().run()} disabled={!s?.canUndo}>
              <Icon d={icons.undo} />
            </Btn>
            <Btn title="Redo (Ctrl+Y)" onClick={() => c().redo().run()} disabled={!s?.canRedo}>
              <Icon d={icons.redo} />
            </Btn>
            <Sep />
            <select aria-label="Paragraph style" value={s?.block ?? "p"} onChange={(e) => setBlock(e.target.value)} className={cn(select, "w-36")}>
              <option value="p">Normal text</option>
              <option value="h2">Heading</option>
              <option value="h3">Subheading</option>
              <option value="h4">Small heading</option>
              <option value="quote">Quote / scripture</option>
            </select>
            <select
              aria-label="Font"
              value={s?.font ?? ""}
              onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}
              className={cn(select, "w-28")}
            >
              {fonts.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Font size"
              value={s?.size ?? ""}
              onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}
              className={cn(select, "w-16")}
            >
              {sizes.map((z) => (
                <option key={z || "auto"} value={z}>
                  {z ? z.replace("px", "") : "Size"}
                </option>
              ))}
            </select>
            <Sep />
            <Btn title="Bold (Ctrl+B)" active={s?.bold} onClick={() => c().toggleBold().run()} className="font-bold">
              B
            </Btn>
            <Btn title="Italic (Ctrl+I)" active={s?.italic} onClick={() => c().toggleItalic().run()} className="font-serif italic">
              I
            </Btn>
            <Btn title="Underline (Ctrl+U)" active={s?.underline} onClick={() => c().toggleUnderline().run()} className="underline underline-offset-2">
              U
            </Btn>
            <Btn title="Strikethrough" active={s?.strike} onClick={() => c().toggleStrike().run()} className="line-through">
              S
            </Btn>
            <Btn title="Subscript" active={s?.sub} onClick={() => c().toggleSubscript().run()}>
              x<sub className="text-[10px]">2</sub>
            </Btn>
            <Btn title="Superscript" active={s?.sup} onClick={() => c().toggleSuperscript().run()}>
              x<sup className="text-[10px]">2</sup>
            </Btn>
            <Sep />
            <details className="group relative">
              <summary className="flex h-8 cursor-pointer list-none items-center gap-1 rounded px-1.5 text-sm text-paper-dim hover:bg-white hover:text-paper" title="Text colour">
                <span className="font-semibold" style={{ borderBottom: `3px solid ${s?.color || "#18203a"}`, lineHeight: 1.1 }}>
                  A
                </span>
                <span className="text-[10px]">▾</span>
              </summary>
              <div className="absolute right-0 top-9 z-30 w-44 sm:left-0 sm:right-auto rounded-md border border-steel bg-white p-2 shadow-lg">
                <p className="px-1 text-xs text-paper-dim">Text colour</p>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {textColors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      title={col}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => c().setColor(col).run()}
                      className="h-7 rounded border border-steel"
                      style={{ background: col }}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => c().unsetColor().run()} className="mt-2 w-full rounded px-1 py-1 text-left text-xs text-paper-dim hover:bg-dusk">
                  Automatic
                </button>
                <p className="mt-2 px-1 text-xs text-paper-dim">Highlight</p>
                <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                  {highlights.map((col) => (
                    <button
                      key={col}
                      type="button"
                      title="Highlight"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => c().toggleHighlight({ color: col }).run()}
                      className="h-7 rounded border border-steel"
                      style={{ background: col }}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => c().unsetHighlight().run()} className="mt-2 w-full rounded px-1 py-1 text-left text-xs text-paper-dim hover:bg-dusk">
                  No highlight
                </button>
              </div>
            </details>
            <Sep />
            <Btn title="Align left" active={s?.align === "left"} onClick={() => c().setTextAlign("left").run()}>
              <Icon d={icons.left} />
            </Btn>
            <Btn title="Centre" active={s?.align === "center"} onClick={() => c().setTextAlign("center").run()}>
              <Icon d={icons.center} />
            </Btn>
            <Btn title="Align right" active={s?.align === "right"} onClick={() => c().setTextAlign("right").run()}>
              <Icon d={icons.right} />
            </Btn>
            <Btn title="Justify" active={s?.align === "justify"} onClick={() => c().setTextAlign("justify").run()}>
              <Icon d={icons.justify} />
            </Btn>
            <Sep />
            <Btn title="Bullet list" active={s?.bullets} onClick={() => c().toggleBulletList().run()}>
              <Icon d={icons.bullets} />
            </Btn>
            <Btn title="Numbered list" active={s?.numbers} onClick={() => c().toggleOrderedList().run()}>
              <Icon d={icons.numbers} />
            </Btn>
            <Btn title="Checklist" active={s?.tasks} onClick={() => c().toggleTaskList().run()}>
              <Icon d={icons.tasks} />
            </Btn>
            <Btn
              title="Indent"
              disabled={!s?.canIndent}
              onClick={() => (editor?.can().sinkListItem("listItem") ? c().sinkListItem("listItem").run() : c().sinkListItem("taskItem").run())}
            >
              <Icon d={icons.indent} />
            </Btn>
            <Btn
              title="Outdent"
              disabled={!s?.canOutdent}
              onClick={() => (editor?.can().liftListItem("listItem") ? c().liftListItem("listItem").run() : c().liftListItem("taskItem").run())}
            >
              <Icon d={icons.outdent} />
            </Btn>
            <Sep />
            <Btn title="Quote or scripture" active={s?.block === "quote"} onClick={() => c().toggleBlockquote().run()}>
              <Icon d={icons.quote} />
            </Btn>
            <Btn
              title="Link (Ctrl+K)"
              active={s?.link || panel === "link"}
              onClick={() => {
                setLinkUrl((editor?.getAttributes("link").href as string | undefined) ?? "");
                setPanel(panel === "link" ? null : "link");
              }}
            >
              <Icon d={icons.link} />
            </Btn>
            <Btn title="Insert a photo" onClick={() => picker.current?.click()} disabled={uploading > 0}>
              <Icon d={icons.image} />
            </Btn>
            <Btn title="Insert a table" active={s?.table} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              <Icon d={icons.table} />
            </Btn>
            <Btn title="Divider line" onClick={() => c().setHorizontalRule().run()}>
              <Icon d={icons.rule} />
            </Btn>
            <Btn title="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}>
              <Icon d={icons.clear} />
            </Btn>
            <Sep />
            <Btn title="Find and replace" active={panel === "find"} onClick={() => setPanel(panel === "find" ? null : "find")}>
              <Icon d={icons.find} />
            </Btn>
            <Btn title={full ? "Exit full screen (Esc)" : "Full screen"} active={full} onClick={() => setFull((f) => !f)}>
              <Icon d={full ? icons.shrink : icons.expand} />
            </Btn>
            <input
              ref={picker}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                insertImages(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>

          {panel === "link" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-steel px-3 py-2">
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                }}
                placeholder="Paste a web address, e.g. youtube.com/…"
                className="h-8 min-w-0 flex-1 rounded border border-steel bg-white px-2 text-sm outline-none focus:border-gold"
              />
              <button type="button" onClick={applyLink} className="h-8 rounded bg-night px-3 text-sm text-starlight">
                {linkUrl.trim() ? "Apply link" : "Remove link"}
              </button>
              <button type="button" onClick={() => setPanel(null)} className="text-sm text-paper-dim">
                Cancel
              </button>
            </div>
          )}

          {panel === "find" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-steel px-3 py-2 text-sm">
              <input
                autoFocus
                value={find}
                onChange={(e) => {
                  setFind(e.target.value);
                  setReplaced(null);
                }}
                placeholder="Find"
                className="h-8 w-40 rounded border border-steel bg-white px-2 outline-none focus:border-gold"
              />
              <input
                value={replace}
                onChange={(e) => setReplace(e.target.value)}
                placeholder="Replace with"
                className="h-8 w-40 rounded border border-steel bg-white px-2 outline-none focus:border-gold"
              />
              <button
                type="button"
                disabled={!matches}
                onClick={() => editor && setReplaced(replaceAll(editor, find, replace))}
                className="h-8 rounded bg-night px-3 text-starlight disabled:opacity-40"
              >
                Replace all
              </button>
              <span className="text-paper-dim">
                {replaced !== null ? `Replaced ${replaced}` : find ? `${matches} found` : ""}
              </span>
            </div>
          )}

          {(s?.table || s?.image) && (
            <div className="flex flex-wrap items-center gap-1 border-t border-steel px-2 py-1.5 text-xs">
              {s?.table && (
                <>
                  <span className="px-1 text-paper-dim">Table:</span>
                  {[
                    { label: "+ Row", run: () => c().addRowAfter().run() },
                    { label: "+ Column", run: () => c().addColumnAfter().run() },
                    { label: "− Row", run: () => c().deleteRow().run() },
                    { label: "− Column", run: () => c().deleteColumn().run() },
                    { label: "Header row", run: () => c().toggleHeaderRow().run() },
                    { label: "Delete table", run: () => c().deleteTable().run() },
                  ].map((b) => (
                    <button key={b.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={b.run} className="rounded border border-steel bg-white px-2 py-1 text-paper hover:border-gold">
                      {b.label}
                    </button>
                  ))}
                </>
              )}
              {s?.image && (
                <>
                  <span className="px-1 text-paper-dim">Photo: drag a corner to resize, or</span>
                  {[
                    { label: "Small", width: 280 },
                    { label: "Medium", width: 460 },
                    { label: "Full width", width: null },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => c().updateAttributes("image", { width: b.width, height: null }).run()}
                      className="rounded border border-steel bg-white px-2 py-1 text-paper hover:border-gold"
                    >
                      {b.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => c().deleteSelection().run()} className="rounded border border-steel bg-white px-2 py-1 text-[#8a2f1e] hover:border-[#c2492f]">
                    Remove photo
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* The page */}
        <div className={cn("overflow-y-auto px-3 py-6 sm:px-8 sm:py-10", full ? "min-h-0 flex-1" : "max-h-[78vh] min-h-[32rem]")}>
          <div className="mx-auto max-w-[816px] bg-white px-6 py-10 shadow-[0_1px_3px_rgba(16,28,58,0.12),0_8px_24px_-12px_rgba(16,28,58,0.25)] sm:px-[72px] sm:py-[64px]">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Status bar */}
        <div className={cn("flex flex-wrap items-center justify-between gap-2 border-t border-steel bg-[#f6f7f9] px-3 py-1.5 text-xs text-paper-dim", !full && "rounded-b-md")}>
          <span>
            {counts.words.toLocaleString()} words · {counts.chars.toLocaleString()} characters · about {minutes} min read
          </span>
          <span>
            {uploading > 0 ? "Uploading photo…" : error ? <span className="text-[#8a2f1e]">{error}</span> : savedAt ? "Copy kept on this device" : "Paste or drag photos straight in"}
          </span>
        </div>
      </div>
    </div>
  );
}
