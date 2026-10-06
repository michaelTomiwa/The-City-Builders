import type { Metadata } from "next";
import { Gloock, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MotionProvider } from "@/components/site/motion-provider";
import { supabase } from "@/lib/supabase";

const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: "400",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The City Builders",
  description:
    "The City Builders — a faith-based ministry nurturing spiritual growth, discerning divine seasons, and building a people whose builder and maker is God. Led by Pastor Michael Tomiwa.",
};

async function getNavPages() {
  const { data } = await supabase
    .from("pages")
    .select("title, slug, nav_label, nav_order")
    .eq("published", true)
    .not("nav_label", "is", null)
    .order("nav_order", { ascending: true });

  return (data ?? []).map((p) => ({
    href: `/p/${p.slug}`,
    label: p.nav_label as string,
  }));
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const navPages = await getNavPages();

  return (
    <html
      lang="en"
      className={`${gloock.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-midnight text-paper">
        <MotionProvider>
          <SiteHeader extraLinks={navPages} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
