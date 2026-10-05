import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { deletePost } from "./actions";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role === "member") {
    return (
      <div className="border-l-2 border-gold pl-6">
        <h1 className="font-display text-2xl text-paper">Access pending</h1>
        <p className="mt-3 max-w-md text-paper-dim leading-relaxed">
          Your account ({user.email}) is signed in but not yet approved to
          publish. Ask the site owner to set your role to &ldquo;admin&rdquo; or
          &ldquo;author&rdquo; in Supabase.
        </p>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-paper">Blog posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft"
        >
          New post
        </Link>
      </div>

      <ul className="mt-10 divide-y divide-steel/60">
        {(posts ?? []).map((post) => (
          <li key={post.id} className="flex items-center justify-between py-4">
            <div>
              <p className="text-paper">{post.title}</p>
              <p className="mt-1 text-xs text-paper-dim">
                {post.published ? "Published" : "Draft"} · /blog/{post.slug}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link href={`/admin/posts/${post.id}/edit`} className="text-gold-text hover:text-ink">
                Edit
              </Link>
              <form action={deletePost}>
                <input type="hidden" name="id" value={post.id} />
                <button className="text-paper-dim hover:text-violet">Delete</button>
              </form>
            </div>
          </li>
        ))}
        {(posts ?? []).length === 0 && (
          <li className="py-12 text-paper-dim">No posts yet — create the first one.</li>
        )}
      </ul>
    </div>
  );
}
