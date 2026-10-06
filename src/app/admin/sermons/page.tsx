import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteSermon } from "../actions";

export default async function AdminSermons() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sermons")
    .select("id, title, slug, speaker, thumbnail_url, youtube_video_id, streamed_at, series:series_id(title)")
    .order("streamed_at", { ascending: false });

  const rows = (data ?? []) as unknown as {
    id: string;
    title: string;
    slug: string;
    speaker: string;
    thumbnail_url: string | null;
    youtube_video_id: string | null;
    streamed_at: string;
    series: { title: string } | null;
  }[];

  return (
    <div>
      <AdminHeader
        title="Sermons"
        description="The message archive. Paste a YouTube link to add one; the thumbnail and player come with it."
        action={{ href: "/admin/sermons/new", label: "Add a sermon" }}
      />
      {rows.length === 0 ? (
        <div className="mt-8">
          <Empty>No sermons yet.</Empty>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {rows.map((s) => (
            <li key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.thumbnail_url ?? (s.youtube_video_id ? `https://i.ytimg.com/vi/${s.youtube_video_id}/hqdefault.jpg` : "/images/about-illustration.jpg")}
                alt=""
                className="aspect-video w-full rounded-sm object-cover sm:w-36"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-paper">{s.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-paper-dim">
                  {new Date(s.streamed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Africa/Lagos" })}
                  {s.series && <Pill tone="gold">{s.series.title}</Pill>}
                  {!s.youtube_video_id && <Pill tone="red">No video link</Pill>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/sermons/${s.id}/edit`} className={smallButton}>
                  Edit
                </Link>
                <Link href={`/sermons/${s.slug}`} target="_blank" className={smallButton}>
                  View
                </Link>
                <form action={deleteSermon}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message={`Delete “${s.title}” from the archive?`} className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:bg-[#f6e1dc]">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
