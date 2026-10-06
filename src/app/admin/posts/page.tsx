import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, Tabs, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { compact } from "@/lib/blog";
import { deletePost, duplicatePost, toggleFeatured, togglePublish } from "../actions";

type Row = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  published_at: string | null;
  updated_at: string | null;
  created_at: string;
  views: number;
  likes: number;
  featured: boolean;
  tags: string[];
  post_comments: { count: number }[];
};

function statusOf(p: Row, now: string) {
  if (!p.published) return "draft";
  if (p.published_at && p.published_at > now) return "scheduled";
  return "published";
}

function lagos(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export default async function AdminPosts({ searchParams }: PageProps<"/admin/posts">) {
  const params = await searchParams;
  const filter = typeof params.status === "string" ? params.status : "all";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const saved = typeof params.saved === "string" ? params.saved : null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, published, published_at, updated_at, created_at, views, likes, featured, tags, post_comments(count)")
    .order("created_at", { ascending: false });

  const now = new Date().toISOString();
  const all = (data ?? []) as Row[];
  const counts = {
    all: all.length,
    published: all.filter((p) => statusOf(p, now) === "published").length,
    scheduled: all.filter((p) => statusOf(p, now) === "scheduled").length,
    draft: all.filter((p) => statusOf(p, now) === "draft").length,
  };
  const rows = all
    .filter((p) => filter === "all" || statusOf(p, now) === filter)
    .filter((p) => !q || `${p.title} ${p.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  const href = (status: string) => `/admin/posts?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <AdminHeader
        title="Blog posts"
        description="Write, schedule and feature posts. Reads, comments and amens update as people visit."
        action={{ href: "/admin/posts/new", label: "Write a post" }}
      />

      {saved && (
        <p className="mt-6 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]" role="status">
          Saved &ldquo;{saved}&rdquo;.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          active={filter}
          items={[
            { id: "all", label: "All", count: counts.all, href: href("all") },
            { id: "published", label: "Published", count: counts.published, href: href("published") },
            { id: "scheduled", label: "Scheduled", count: counts.scheduled, href: href("scheduled") },
            { id: "draft", label: "Drafts", count: counts.draft, href: href("draft") },
          ]}
        />
        <form className="flex gap-2" action="/admin/posts">
          <input type="hidden" name="status" value={filter} />
          <label className="sr-only" htmlFor="post-search">
            Search posts
          </label>
          <input
            id="post-search"
            name="q"
            defaultValue={q}
            placeholder="Search titles and tags"
            className="h-10 w-full rounded-sm border border-steel bg-white px-3 text-sm text-paper lg:w-64"
          />
          <button className={smallButton}>Search</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <Empty>{q ? `No posts match “${q}”.` : "No posts here yet. Write the first one."}</Empty>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {rows.map((p) => {
            const status = statusOf(p, now);
            return (
              <li key={p.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/posts/${p.id}/edit`} className="font-medium text-paper hover:text-gold-text">
                      {p.title}
                    </Link>
                    {status === "published" && <Pill tone="green">Published</Pill>}
                    {status === "scheduled" && <Pill tone="blue">Scheduled for {lagos(p.published_at!)}</Pill>}
                    {status === "draft" && <Pill tone="grey">Draft</Pill>}
                    {p.featured && <Pill tone="gold">Featured</Pill>}
                  </div>
                  <p className="mt-1 text-sm text-paper-dim">
                    {compact(p.views)} reads, {p.post_comments?.[0]?.count ?? 0} comments, {compact(p.likes)} amens
                    {p.tags.length > 0 && <> &mdash; {p.tags.join(", ")}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/posts/${p.id}/edit`} className={smallButton}>
                    Edit
                  </Link>
                  {status === "published" && (
                    <Link href={`/blog/${p.slug}`} target="_blank" className={smallButton}>
                      View
                    </Link>
                  )}
                  <form action={togglePublish}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="publish" value={String(!p.published)} />
                    <button className={smallButton}>{p.published ? "Unpublish" : "Publish now"}</button>
                  </form>
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="feature" value={String(!p.featured)} />
                    <button className={smallButton}>{p.featured ? "Unfeature" : "Feature"}</button>
                  </form>
                  <form action={duplicatePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className={smallButton}>Duplicate</button>
                  </form>
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton
                      message={`Delete “${p.title}”? Its comments are deleted too. This can't be undone.`}
                      className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:bg-[#f6e1dc]"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
