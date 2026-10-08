import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Testimonies",
  description: "What God is doing among the City Builders: healing, provision, direction and new life.",
};

export default async function TestimoniesPage() {
  const { data } = await supabase
    .from("testimonies")
    .select("id, title, body, display_name, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(60);
  const items = (data ?? []) as { id: string; title: string; body: string; display_name: string | null; created_at: string }[];

  return (
    <>
      <PageHero title="What God is doing." intro="Stories from the City Builders: answered prayer, healing, provision and new beginnings. Read one and take courage." />
      <div className="mx-auto max-w-6xl px-6 py-16">
        {items.length === 0 ? (
          <p className="text-lg text-paper-dim">The first testimonies are on their way.</p>
        ) : (
          <ul className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {items.map((t) => (
              <li key={t.id} className="mb-6 break-inside-avoid">
                <Reveal>
                  <article className="rounded-md border border-steel bg-white p-6">
                    <span className="font-display text-5xl leading-none text-gold/70" aria-hidden="true">
                      &ldquo;
                    </span>
                    <h2 className="font-display text-2xl leading-snug text-paper">{t.title}</h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-paper-dim">{t.body}</p>
                    <p className="mt-4 text-sm text-gold-text">
                      {t.display_name ?? "A City Builder"} ·{" "}
                      {new Date(t.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "Africa/Lagos" })}
                    </p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-12 rounded-md bg-night p-8 text-starlight">
          <p className="font-display text-3xl">Has God done something for you?</p>
          <p className="mt-2 text-starlight-dim">Members can share a testimony from their dashboard.</p>
          <Link href="/me/journal" className="mt-5 inline-flex h-11 items-center bg-gold px-6 font-medium text-ink hover:bg-gold-soft">
            Share yours
          </Link>
        </div>
      </div>
    </>
  );
}
