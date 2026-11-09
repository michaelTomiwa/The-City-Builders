import Link from "next/link";
import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { SermonToPost } from "@/components/admin/sermon-to-post";
import { getRecentVideos } from "@/lib/youtube";
import { createSermonDraft } from "../../actions";

export const metadata: Metadata = { title: "Sermon to post" };

export default async function SermonToPostPage() {
  const videos = await getRecentVideos(8);
  return (
    <div className="max-w-4xl">
      <Link href="/admin/posts" className="text-sm text-gold-text hover:underline">
        ← Blog posts
      </Link>
      <div className="mt-4">
        <AdminHeader
          title="Sermon to post"
          description="Turn a Night Watch or Sunday message into a blog post: get the transcript from YouTube, let Claude write it up, then paste the reply here. It becomes a draft for you to check and publish."
        />
      </div>
      <div className="mt-8">
        <SermonToPost videos={videos.map((v) => ({ id: v.id, title: v.title, publishedAt: v.publishedAt, thumbnail: v.thumbnail }))} action={createSermonDraft} />
      </div>
    </div>
  );
}
