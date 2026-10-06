import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { deletePage } from "../actions";
import { AdminHeader } from "@/components/admin/ui";

export default async function AdminPagesList() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, published, nav_label")
    .order("created_at", { ascending: false });

  return (
    <div>
      <AdminHeader
        title="Pages"
        description="Create custom pages and sections. Give a page a menu label to show it in the site menu automatically."
        action={{ href: "/admin/pages/new", label: "New page" }}
      />

      <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80 px-4">
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
