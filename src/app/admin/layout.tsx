import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoMark } from "@/components/site/logo-mark";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "./actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return children;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role === "member") {
    if (profile?.status === "active") redirect("/me");
    return (
      <div className="mx-auto max-w-lg px-6 py-24">
        <LogoMark className="h-10 w-10 text-gold" />
        <h1 className="mt-6 font-display text-3xl text-paper">Access pending</h1>
        <p className="mt-3 leading-relaxed text-paper-dim">
          You&apos;re signed in as {user.email}, but this account can&apos;t edit the site yet. Ask an
          existing admin to set your role to &ldquo;admin&rdquo; or &ldquo;author&rdquo;.
        </p>
        <form action={signOut} className="mt-6">
          <button className="text-gold-text underline underline-offset-4">Sign out</button>
        </form>
      </div>
    );
  }

  const [{ count: pendingComments }, { count: newPrayers }, { count: pendingMembers }, { count: toReview }, { count: newTestimonies }] = await Promise.all([
    supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("approved", false),
    supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("testimonies").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="min-h-screen bg-[#f1f2f4] lg:flex">
      <aside className="on-night flex shrink-0 flex-col bg-night text-starlight lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8 text-lamp" />
            <span>
              <span className="block font-display text-lg leading-none">City Builders</span>
              <span className="text-xs text-starlight-dim">Admin</span>
            </span>
          </Link>
          <div className="flex gap-4 text-sm lg:hidden">
            <Link href="/" className="text-starlight-dim hover:text-lamp">
              View site
            </Link>
            <form action={signOut}>
              <button className="text-starlight-dim hover:text-lamp">Sign out</button>
            </form>
          </div>
        </div>

        <AdminNav
          counts={{
            comments: pendingComments ?? 0,
            prayers: newPrayers ?? 0,
            members: pendingMembers ?? 0,
            submissions: toReview ?? 0,
            testimonies: newTestimonies ?? 0,
          }}
        />

        <div className="mt-auto hidden border-t border-night-3 px-5 py-5 text-sm lg:block">
          <p className="truncate text-starlight">{profile.full_name ?? user.email}</p>
          <p className="text-xs capitalize text-starlight-dim">{profile.role}</p>
          <div className="mt-4 flex gap-4">
            <Link href="/" className="text-starlight-dim hover:text-lamp">
              View site
            </Link>
            <form action={signOut}>
              <button className="text-starlight-dim hover:text-lamp">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="w-full min-w-0 px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
