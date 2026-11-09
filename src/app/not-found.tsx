import Link from "next/link";
import type { Metadata } from "next";
import { Stars } from "@/components/site/stars";
import { Celestial } from "@/components/site/celestial";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

const ways = [
  { href: "/live", label: "Watch live", hint: "Night Watch 11 PM · Morning Prayers 7 AM" },
  { href: "/week", label: "This week", hint: "What we're fasting, praying and studying" },
  { href: "/sermons", label: "The watch", hint: "Every message, ready to watch" },
  { href: "/blog", label: "Blog", hint: "Words for your season" },
  { href: "/prayer", label: "Prayer wall", hint: "Ask for prayer, or pray for someone" },
];

/** Shown for any address that doesn't exist: a way back into the city instead of a dead end. */
export default function NotFound() {
  return (
    <section className="on-night sky relative overflow-hidden text-starlight">
      <Stars />
      <Celestial />
      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
        <p className="text-sm tracking-wide text-lamp">404</p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4rem)] leading-[1.05]">This street isn&apos;t built yet.</h1>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-starlight-dim">
          The page you were looking for has moved or never existed. Here are some good places to go instead.
        </p>
        <ul className="mx-auto mt-10 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          {ways.map((w) => (
            <li key={w.href}>
              <Link href={w.href} className="block rounded-md border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:border-lamp/60 hover:bg-white/10">
                <span className="block font-medium text-starlight">{w.label} →</span>
                <span className="mt-0.5 block text-sm text-starlight-dim">{w.hint}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/" className="flex h-full items-center justify-center rounded-md bg-lamp px-5 py-4 font-medium text-ink transition-colors hover:bg-gold-soft">
              Back to the home page
            </Link>
          </li>
        </ul>
        <p className="mt-10 text-sm italic text-starlight-dim">&ldquo;Except the LORD build the house, they labour in vain that build it.&rdquo; Psalm 127:1</p>
      </div>
    </section>
  );
}
