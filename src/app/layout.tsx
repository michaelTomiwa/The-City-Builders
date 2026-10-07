import type { Metadata, Viewport } from "next";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const description =
  "Pray with Pastor Michael Tomiwa and The City Builders: Night Watch at 11 PM and Morning Prayers at 7 AM, Lagos time, every day. Sermons, prayer and the word for your season.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The City Builders",
    template: "%s — The City Builders",
  },
  description,
  applicationName: "The City Builders",
  // og:title / og:description fall back to each page's own <title> and description
  openGraph: {
    type: "website",
    siteName: "The City Builders",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    title: "City Builders",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#101c3a",
  colorScheme: "light",
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
