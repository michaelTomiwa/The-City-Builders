import { supabase, type GivingLink } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";

export const revalidate = 60;

export default async function GivePage() {
  const { data } = await supabase
    .from("giving_links")
    .select("*")
    .eq("is_active", true);

  const links = (data ?? []) as GivingLink[];

  return (
    <>
      <PageHero
        title={<>Give toward the work.</>}
        intro={<>Every gift helps us keep the watch running, reach more of the city, and equip believers to build on a strong foundation.</>}
      />
    <div className="mx-auto max-w-2xl px-6 py-16">

      <div className="mt-10 space-y-4">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-sm border border-steel px-6 py-4 text-paper transition-colors hover:border-gold hover:text-gold-text"
          >
            {link.label}
          </a>
        ))}
      </div>

      <p className="mt-10 text-sm text-paper-dim">
        Prefer bank transfer or another method? Reach out to us through our{" "}
        <a
          href="https://www.youtube.com/@thecitybuilderscity"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-text hover:text-ink"
        >
          YouTube channel
        </a>{" "}
        and we&apos;ll point you the right way.
      </p>
    </div>
    </>
  );
}
