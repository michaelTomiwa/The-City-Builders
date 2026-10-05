import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { LogoMark } from "@/components/site/logo-mark";
import { signOut } from "./actions";

const navItems = [
  { href: "/admin", label: "Posts" },
  { href: "/admin/posts/new", label: "New post" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/pages/new", label: "New page" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return children;

  return (
    <div className="min-h-screen bg-midnight md:flex">
      <aside className="flex shrink-0 flex-col justify-between border-b border-steel/60 px-6 py-6 md:w-56 md:border-b-0 md:border-r md:px-5 md:py-8">
        <div>
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7 text-gold" />
            <span className="font-display text-lg text-paper">Admin</span>
          </Link>
          <nav className="mt-10 flex flex-row flex-wrap gap-x-5 gap-y-2 text-sm md:flex-col md:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-paper-dim transition-colors hover:text-gold-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm md:mt-0">
          <Link href="/" className="text-paper-dim hover:text-gold-text">
            View site
          </Link>
          <form action={signOut}>
            <button className="text-paper-dim hover:text-gold-text">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-4xl px-6 py-12">{children}</main>
    </div>
  );
}
