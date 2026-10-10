"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fieldHint, fieldLabel } from "./ui";
import { ImageField } from "./image-field";
import { RichEditor } from "./rich-editor";
import { isHtml, markdownToHtml } from "@/lib/post-content";

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

export function PostForm({ post, action }: { post?: Post; action: (formData: FormData) => void }) {
  const now = new Date().toISOString();
  const initialStatus = !post?.published ? "draft" : post.published_at && post.published_at > now ? "schedule" : "publish";

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [cover, setCover] = useState(post?.cover_image_url ?? "");
  const [status, setStatus] = useState<"draft" | "publish" | "schedule">(initialStatus);
  const initialHtml = post?.content ? (isHtml(post.content) ? post.content : markdownToHtml(post.content)) : "";

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
          <span className={fieldLabel}>Post</span>
          <div className="mt-2">
            <RichEditor name="content" initialHtml={initialHtml} draftKey={`post-draft-${post?.id ?? "new"}`} />
          </div>
          <p className={fieldHint}>
            Works like Word: headings, fonts, colours, lists, tables, photos and links. Shortcuts such as Ctrl+B and Ctrl+Z work, and a copy
            is kept on this device until you save.
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
          <ImageField
            name="cover_image_url"
            label="Cover image"
            value={cover}
            onChange={setCover}
            folder="covers"
            hint={cover ? undefined : "Without one, the post gets a night-sky cover with its first letter."}
          />
        </div>

        <Button type="submit" className="w-full">
          {status === "draft" ? "Save draft" : status === "schedule" ? "Schedule post" : post?.published ? "Update post" : "Publish post"}
        </Button>
      </aside>
    </form>
  );
}
