import type { Metadata } from "next";
import { Gloock, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MotionProvider } from "@/components/site/motion-provider";
import { supabase, type SiteSettings } from "@/lib/supabase";
import { PublicOnly } from "@/components/site/public-only";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { skyScript } from "@/lib/sky";
import { SkyClock } from "@/components/site/sky-clock";

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

async function getSettings() {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data ?? null) as SiteSettings | null;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [navPages, settings] = await Promise.all([getNavPages(), getSettings()]);

  return (
    <html
      lang="en"
      className={`${gloock.variable} ${hanken.variable} h-full antialiased`}
      data-sky="night"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skyScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-midnight text-paper">
        <MotionProvider>
          <SkyClock />
          <PublicOnly>
            <AnnouncementBar settings={settings} />
            <SiteHeader extraLinks={navPages} />
          </PublicOnly>
          <main className="flex-1">{children}</main>
          <PublicOnly>
            <SiteFooter />
          </PublicOnly>
        </MotionProvider>
      </body>
    </html>
  );
}
