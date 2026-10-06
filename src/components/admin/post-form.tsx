"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fieldHint, fieldLabel } from "./ui";
import { cn } from "@/lib/utils";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  featured?: boolean;
  tags?: string[];
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** ISO → the "YYYY-MM-DDTHH:mm" a datetime-local input wants, in Lagos time. */
function toLagosInput(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 16);
}

const tools: { label: string; title: string; before: string; after?: string; line?: boolean }[] = [
  { label: "B", title: "Bold", before: "**", after: "**" },
  { label: "I", title: "Italic", before: "_", after: "_" },
  { label: "H2", title: "Heading", before: "## ", line: true },
  { label: "H3", title: "Small heading", before: "### ", line: true },
  { label: "“ ”", title: "Quote or scripture", before: "> ", line: true },
  { label: "• List", title: "Bullet list", before: "- ", line: true },
  { label: "1. List", title: "Numbered list", before: "1. ", line: true },
  { label: "Link", title: "Link", before: "[", after: "](https://)" },
];

export function PostForm({ post, action }: { post?: Post; action: (formData: FormData) => void }) {
  const now = new Date().toISOString();
  const initialStatus = !post?.published ? "draft" : post.published_at && post.published_at > now ? "schedule" : "publish";

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [content, setContent] = useState(post?.content ?? "");
  const [cover, setCover] = useState(post?.cover_image_url ?? "");
  const [status, setStatus] = useState<"draft" | "publish" | "schedule">(initialStatus);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const editor = useRef<HTMLTextAreaElement>(null);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 220));

  function applyTool(tool: (typeof tools)[number]) {
    const el = editor.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = content.slice(start, end);
    let next: string;
    let cursor: number;
    if (tool.line) {
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      next = content.slice(0, lineStart) + tool.before + content.slice(lineStart);
      cursor = end + tool.before.length;
    } else {
      const insert = `${tool.before}${selected || tool.title.toLowerCase()}${tool.after ?? ""}`;
      next = content.slice(0, start) + insert + content.slice(end);
      cursor = start + insert.length;
    }
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.published_at && status === "publish" && (
        <input type="hidden" name="existing_published_at" value={post.published_at} />
      )}

      <div className="min-w-0 space-y-6">
        <div>
          <label htmlFor="title" className={fieldLabel}>
            Title
          </label>
          <Input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="mt-2 h-12 bg-white font-display text-xl"
          />
        </div>

        <div>
          <label htmlFor="slug" className={fieldLabel}>
            Web address
          </label>
          <div className="mt-2 flex items-center rounded-sm border border-steel bg-white focus-within:border-gold">
            <span className="pl-3 text-sm text-paper-dim">/blog/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="h-11 w-full bg-transparent px-1 text-paper outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="excerpt" className={fieldLabel}>
            Summary
          </label>
          <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className="mt-2 bg-white" />
          <p className={fieldHint}>Shown on the blog page and when the post is shared.</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={fieldLabel}>Post</span>
            <div className="flex rounded bg-dusk p-0.5 text-sm" role="tablist">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn("rounded px-3 py-1 capitalize", tab === t ? "bg-white text-paper shadow-sm" : "text-paper-dim")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 overflow-hidden rounded-sm border border-steel bg-white">
            {tab === "write" && (
              <div className="flex flex-wrap gap-1 border-b border-steel bg-dusk/60 px-2 py-1.5">
                {tools.map((tool) => (
                  <button
                    key={tool.title}
                    type="button"
                    title={tool.title}
                    onClick={() => applyTool(tool)}
                    className="rounded px-2.5 py-1 text-sm text-paper-dim hover:bg-white hover:text-paper"
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={editor}
              id="content"
              name="content"
              required
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn("w-full resize-y bg-white px-4 py-3 font-mono text-sm leading-relaxed text-paper outline-none", tab === "preview" && "hidden")}
            />
            {tab === "preview" && (
              <div className="min-h-[30rem] px-6 py-5 text-[1.05rem] leading-[1.8] text-paper-dim [&_a]:text-gold-text [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:text-paper [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-paper [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-paper [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:text-paper [&_ul]:list-disc [&_ul]:pl-6">
                {title && <h1 className="mb-4 font-display text-4xl text-paper">{title}</h1>}
                {content ? <ReactMarkdown>{content}</ReactMarkdown> : <p className="text-paper-dim">Nothing written yet.</p>}
              </div>
            )}
          </div>
          <p className={fieldHint}>
            {words} words, about {minutes} min read. Use the buttons for headings, scripture quotes and lists.
          </p>
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <fieldset className="rounded-md border border-steel bg-white/80 p-4">
          <legend className="px-1 text-sm font-medium text-paper">Visibility</legend>
          <div className="space-y-2 text-sm">
            {[
              { id: "draft", label: "Draft", hint: "Only admins can see it" },
              { id: "publish", label: "Publish", hint: "Live on the blog now" },
              { id: "schedule", label: "Schedule", hint: "Goes live at a set time" },
            ].map((o) => (
              <label key={o.id} className="flex cursor-pointer items-start gap-2.5 rounded p-1.5 hover:bg-dusk/60">
                <input
                  type="radio"
                  name="status"
                  value={o.id}
                  checked={status === o.id}
                  onChange={() => setStatus(o.id as typeof status)}
                  className="mt-1 accent-gold"
                />
                <span>
                  <span className="block text-paper">{o.label}</span>
                  <span className="text-paper-dim">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {status === "schedule" && (
            <div className="mt-3">
              <label htmlFor="publish_at" className="text-sm text-paper">
                Publish at (Lagos time)
              </label>
              <input
                id="publish_at"
                name="publish_at"
                type="datetime-local"
                required
                defaultValue={toLagosInput(post?.published_at ?? null)}
                className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm text-paper"
              />
            </div>
          )}
          <label className="mt-4 flex items-center gap-2 border-t border-steel pt-4 text-sm text-paper">
            <input type="checkbox" name="featured" defaultChecked={post?.featured ?? false} className="h-4 w-4 accent-gold" />
            Feature at the top of the blog
          </label>
        </fieldset>

        <div className="rounded-md border border-steel bg-white/80 p-4">
          <label htmlFor="tags" className="text-sm font-medium text-paper">
            Topics
          </label>
          <Input id="tags" name="tags" defaultValue={(post?.tags ?? []).join(", ")} placeholder="Prayer, Seasons" className="mt-2 bg-white" />
          <p className="mt-1 text-xs text-paper-dim">Separate topics with commas. Readers can filter by them.</p>
        </div>

        <div className="rounded-md border border-steel bg-white/80 p-4">
          <label htmlFor="cover_image_url" className="text-sm font-medium text-paper">
            Cover image link
          </label>
          <Input
            id="cover_image_url"
            name="cover_image_url"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="https://"
            className="mt-2 bg-white"
          />
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Cover preview" className="mt-3 aspect-[16/9] w-full rounded-sm object-cover" />
          ) : (
            <p className="mt-1 text-xs text-paper-dim">Without one, the post gets a night-sky cover with its first letter.</p>
          )}
        </div>

        <Button type="submit" className="w-full">
          {status === "draft" ? "Save draft" : status === "schedule" ? "Schedule post" : post?.published ? "Update post" : "Publish post"}
        </Button>
      </aside>
    </form>
  );
}
