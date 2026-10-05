"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published: boolean;
};

export function PostForm({
  post,
  action,
}: {
  post?: Post;
  action: (formData: FormData) => void;
}) {
  const [title, setTitle] = useState(post?.title ?? "");

  return (
    <form action={action} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <label htmlFor="title" className="text-sm text-paper-dim">
          Title
        </label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <label htmlFor="slug" className="text-sm text-paper-dim">
          URL slug (leave blank to generate from title)
        </label>
        <Input
          id="slug"
          name="slug"
          defaultValue={post?.slug ?? ""}
          placeholder="auto-generated-from-title"
          className="mt-2"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="text-sm text-paper-dim">
          Excerpt
        </label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt ?? ""}
          className="mt-2"
        />
      </div>

      <div>
        <label htmlFor="cover_image_url" className="text-sm text-paper-dim">
          Cover image URL (optional)
        </label>
        <Input
          id="cover_image_url"
          name="cover_image_url"
          defaultValue={post?.cover_image_url ?? ""}
          placeholder="https://…"
          className="mt-2"
        />
      </div>

      <div>
        <label htmlFor="content" className="text-sm text-paper-dim">
          Content (Markdown)
        </label>
        <Textarea
          id="content"
          name="content"
          required
          rows={16}
          defaultValue={post?.content ?? ""}
          className="mt-2 font-mono text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-paper-dim">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? false}
          className="h-4 w-4 accent-gold"
        />
        Published (visible on the public blog)
      </label>

      <Button type="submit">{post ? "Save changes" : "Create post"}</Button>
    </form>
  );
}
