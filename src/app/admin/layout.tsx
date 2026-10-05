import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { LogoMark } from "@/components/site/logo-mark";
import { signOut } from "./actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return children;

  return (
    <div className="min-h-screen bg-midnight">
      <header className="border-b border-steel/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7 text-gold" />
            <span className="font-display text-lg text-paper">Admin</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="text-paper-dim hover:text-gold-text">
              Posts
            </Link>
            <Link href="/admin/posts/new" className="text-paper-dim hover:text-gold-text">
              New post
            </Link>
            <Link href="/" className="text-paper-dim hover:text-gold-text">
              View site
            </Link>
            <form action={signOut}>
              <button className="text-paper-dim hover:text-gold-text">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
