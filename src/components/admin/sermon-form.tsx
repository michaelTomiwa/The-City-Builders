"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fieldHint, fieldLabel } from "./ui";
import { ImageField } from "./image-field";

type Sermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  series_id: string | null;
  youtube_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  streamed_at: string;
};

function videoIdFrom(input: string) {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const m = value.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function toLagosInput(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 16);
}

export function SermonForm({
  sermon,
  series,
  action,
}: {
  sermon?: Sermon;
  series: { id: string; title: string }[];
  action: (formData: FormData) => void;
}) {
  const [link, setLink] = useState(sermon?.youtube_url ?? "");
  const id = link ? videoIdFrom(link) : null;

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      {sermon && <input type="hidden" name="id" value={sermon.id} />}
      <div className="space-y-6">
        <div>
          <label htmlFor="youtube_url" className={fieldLabel}>
            YouTube link
          </label>
          <Input
            id="youtube_url"
            name="youtube_url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or a live link"
            className="mt-2 bg-white"
          />
          <p className={fieldHint}>
            {link && !id ? "That doesn't look like a YouTube video link yet." : "Paste any YouTube video, live or Shorts link; the thumbnail comes with it."}
          </p>
        </div>
        <div>
          <label htmlFor="title" className={fieldLabel}>
            Title
          </label>
          <Input id="title" name="title" required defaultValue={sermon?.title ?? ""} className="mt-2 bg-white" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="speaker" className={fieldLabel}>
              Speaker
            </label>
            <Input id="speaker" name="speaker" defaultValue={sermon?.speaker ?? "Pastor Michael Tomiwa"} className="mt-2 bg-white" />
          </div>
          <div>
            <label htmlFor="series_id" className={fieldLabel}>
              Series
            </label>
            <select
              id="series_id"
              name="series_id"
              defaultValue={sermon?.series_id ?? ""}
              className="mt-2 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper"
            >
              <option value="">No series</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="streamed_at" className={fieldLabel}>
              Streamed on (Lagos time)
            </label>
            <input
              id="streamed_at"
              name="streamed_at"
              type="datetime-local"
              defaultValue={toLagosInput(sermon?.streamed_at ?? null)}
              className="mt-2 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper"
            />
          </div>
          <div>
            <label htmlFor="slug" className={fieldLabel}>
              Web address (optional)
            </label>
            <Input id="slug" name="slug" defaultValue={sermon?.slug ?? ""} placeholder="made from the title" className="mt-2 bg-white" />
          </div>
        </div>
        <div>
          <label htmlFor="description" className={fieldLabel}>
            Notes
          </label>
          <Textarea id="description" name="description" rows={6} defaultValue={sermon?.description ?? ""} className="mt-2 bg-white" />
          <p className={fieldHint}>Key scriptures and points from the message.</p>
        </div>
        <ImageField name="thumbnail_url" label="Custom thumbnail (optional)" defaultValue={sermon?.thumbnail_url ?? ""} folder="sermons" hint="Leave empty to use the YouTube thumbnail." />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <div className="overflow-hidden rounded-md border border-steel bg-white">
          {id ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="Video thumbnail" className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-night text-sm text-starlight-dim">Paste a link to preview</div>
          )}
          {id && <p className="px-3 py-2 text-xs text-paper-dim">Video ID {id}</p>}
        </div>
        <Button type="submit" className="w-full">
          {sermon ? "Save sermon" : "Add sermon"}
        </Button>
      </aside>
    </form>
  );
}
