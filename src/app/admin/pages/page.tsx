import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { deletePage } from "../actions";

export default async function AdminPagesList() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, published, nav_label")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-paper">Pages</h1>
        <Link
          href="/admin/pages/new"
          className="rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft"
        >
          New page
        </Link>
      </div>
      <p className="mt-3 text-sm text-paper-dim">
        Create custom pages and sections. Give a page a nav label to show it in
        the site menu automatically.
      </p>

      <ul className="mt-10 divide-y divide-steel/60">
        {(pages ?? []).map((page) => (
          <li key={page.id} className="flex items-center justify-between py-4">
            <div>
              <p className="text-paper">{page.title}</p>
              <p className="mt-1 text-xs text-paper-dim">
                {page.published ? "Published" : "Draft"} · /p/{page.slug}
                {page.nav_label && ` · in nav as "${page.nav_label}"`}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link href={`/admin/pages/${page.id}/edit`} className="text-gold-text hover:text-ink">
                Edit
              </Link>
              <form action={deletePage}>
                <input type="hidden" name="id" value={page.id} />
                <button className="text-paper-dim hover:text-violet">Delete</button>
              </form>
            </div>
          </li>
        ))}
        {(pages ?? []).length === 0 && (
          <li className="py-12 text-paper-dim">No custom pages yet — create the first one.</li>
        )}
      </ul>
    </div>
  );
}
