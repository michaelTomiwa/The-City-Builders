"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Page } from "@/lib/supabase";

export function PageForm({
  page,
  action,
}: {
  page?: Page;
  action: (formData: FormData) => void;
}) {
  const [title, setTitle] = useState(page?.title ?? "");

  return (
    <form action={action} className="space-y-6">
      {page && <input type="hidden" name="id" value={page.id} />}

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
          URL slug — page will live at /p/slug (leave blank to generate)
        </label>
        <Input
          id="slug"
          name="slug"
          defaultValue={page?.slug ?? ""}
          placeholder="auto-generated-from-title"
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
          rows={14}
          defaultValue={page?.content ?? ""}
          className="mt-2 font-mono text-sm"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="nav_label" className="text-sm text-paper-dim">
            Nav label (optional — shows this page in the site menu)
          </label>
          <Input id="nav_label" name="nav_label" defaultValue={page?.nav_label ?? ""} className="mt-2" />
        </div>
        <div>
          <label htmlFor="nav_order" className="text-sm text-paper-dim">
            Nav position (lower shows first)
          </label>
          <Input
            id="nav_order"
            name="nav_order"
            type="number"
            defaultValue={page?.nav_order ?? 0}
            className="mt-2"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-paper-dim">
        <input
          type="checkbox"
          name="published"
          defaultChecked={page?.published ?? false}
          className="h-4 w-4 accent-gold"
        />
        Published (visible on the public site)
      </label>

      <Button type="submit">{page ? "Save changes" : "Create page"}</Button>
    </form>
  );
}
