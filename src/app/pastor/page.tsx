import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { PostList } from "@/components/blog/post-list";
import { WhatsAppShare } from "@/components/site/whatsapp-share";
import { DEFAULT_PASTOR_IMAGE, getSiteSettings } from "@/lib/settings";
import { publishedPosts } from "@/lib/topic-data";
import { supabase } from "@/lib/supabase";
import { CHANNEL_URL, services } from "@/lib/schedule";
import { absolute, jsonLd, pastorJsonLd } from "@/lib/seo";

export const revalidate = 300;

const defaultBio = [
  "Pastor Michael Tomiwa leads The City Builders, a praying church based in Lagos, Nigeria, with a community that gathers online from around the world.",
  "His ministry is prayer, teaching and the prophetic: helping believers build strong spiritual foundations, walk in clarity, and discern and understand the seasons and times God has them in.",
  "Every night he leads Night Watch at 11 PM and every morning Morning Prayers at 7 AM, Lagos time, streamed live so anyone can pray along. Each week he gives the whole church prayer points, a fasting plan and a daily Bible reading.",
];

export const metadata: Metadata = {
  title: "Pastor Michael Tomiwa",
  description: "Pastor Michael Tomiwa leads The City Builders in Lagos, Nigeria: Night Watch, Morning Prayers, teaching and the prophetic. His messages, writing and ministry.",
  alternates: { canonical: "/pastor" },
  openGraph: { type: "profile", url: "/pastor" },
};

export default async function PastorPage() {
  const [settings, posts, { data: sermons }] = await Promise.all([
    getSiteSettings(),
    publishedPosts(),
    supabase.from("sermons").select("id, title, slug, streamed_at").order("streamed_at", { ascending: false }).limit(5),
  ]);
  const bio = settings?.pastor_bio?.trim() ? settings.pastor_bio.trim().split(/\n\s*\n/) : defaultBio;
  const photo = settings?.pastor_image_url || DEFAULT_PASTOR_IMAGE;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(pastorJsonLd(photo, bio.join(" ").slice(0, 600)))} />
      <PageHero title="Pastor Michael Tomiwa" intro="Lead pastor of The City Builders: prayer, teaching and the prophetic, from Lagos to the nations." />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Pastor Michael Tomiwa" className="aspect-[4/5] w-full rounded-sm object-cover" />
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-paper-dim">Leads</dt>
                <dd className="text-paper">The City Builders, Lagos, Nigeria</dd>
              </div>
              <div>
                <dt className="text-paper-dim">Every day, Lagos time</dt>
                {services.map((s) => (
                  <dd key={s.id} className="text-paper">
                    {s.name}, {s.label}
                  </dd>
                ))}
              </div>
              <div>
                <dt className="text-paper-dim">Watch</dt>
                <dd>
                  <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-gold-text hover:underline">
                    YouTube @thecitybuilderscity
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="font-display text-3xl text-paper">About Pastor Michael</h2>
            <div className="mt-4 space-y-5 text-lg leading-relaxed text-paper-dim">
              {bio.map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/live" className="rounded-sm bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-soft">
                Pray with him tonight
              </Link>
              <Link href="/contact" className="rounded-sm border border-steel bg-white px-5 py-2.5 text-sm text-paper hover:border-gold">
                Invite Pastor Michael
              </Link>
              <WhatsAppShare size="sm" text="Pray with Pastor Michael Tomiwa and The City Builders: Night Watch 11 PM and Morning Prayers 7 AM, Lagos time." url={absolute("/pastor")} />
            </div>

            {(sermons ?? []).length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-3xl text-paper">Recent messages</h2>
                <ul className="mt-4 divide-y divide-steel/70">
                  {(sermons ?? []).map((s) => (
                    <li key={s.id}>
                      <Link href={`/sermons/${s.slug}`} className="flex justify-between gap-4 py-3 hover:text-gold-text">
                        <span className="text-paper">{s.title}</span>
                        <span className="shrink-0 text-sm text-paper-dim">
                          {new Date(s.streamed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Africa/Lagos" })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {posts.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-3xl text-paper">Writing</h2>
                <PostList posts={posts.slice(0, 4)} />
                <Link href="/blog" className="text-sm font-medium text-gold-text hover:underline">
                  All posts →
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
