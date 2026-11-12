import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SeriesPart } from "@/lib/series";

/** The rest of the series under a post: every part, the one you're on, and a big "Next" button. */
export function SeriesCard({ name, parts, currentId }: { name: string; parts: SeriesPart[]; currentId: string }) {
  const index = parts.findIndex((p) => p.id === currentId);
  const next = parts[index + 1];
  const prev = index > 0 ? parts[index - 1] : null;
  return (
    <section className="mt-14 rounded-md border border-gold/40 bg-[#fdf7ea] p-6 sm:p-8" aria-label="More from this message">
      <p className="text-sm text-gold-text">
        From the message &ldquo;{name}&rdquo; · Part {index + 1}
      </p>
      {next ? (
        <Link href={`/blog/${next.slug}`} className="group mt-3 flex items-center justify-between gap-4 rounded-md bg-night px-5 py-4 text-starlight transition-colors hover:bg-night-2">
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-wide text-lamp">Read next · Part {index + 2}</span>
            <span className="mt-1 block font-display text-xl leading-snug sm:text-2xl">{next.title}</span>
          </span>
          <span className="shrink-0 text-2xl text-lamp transition-transform group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </Link>
      ) : (
        <p className="mt-2 font-display text-xl text-paper">You&apos;ve read every part so far. 🙏</p>
      )}
      <ol className="mt-5 space-y-1.5">
        {parts.map((p, i) => (
          <li key={p.id}>
            {p.id === currentId ? (
              <span className="flex gap-3 text-sm font-medium text-paper">
                <span className="w-5 shrink-0 text-gold-text">{i + 1}</span>
                {p.title} <span className="font-normal text-paper-dim">· you&apos;re here</span>
              </span>
            ) : (
              <Link href={`/blog/${p.slug}`} className={cn("flex gap-3 text-sm hover:text-gold-text", i < index ? "text-paper-dim" : "text-paper")}>
                <span className="w-5 shrink-0 text-paper-dim">{i + 1}</span>
                {p.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {prev && (
        <Link href={`/blog/${prev.slug}`} className="mt-4 inline-block text-sm text-gold-text hover:underline">
          ← Part {index}: {prev.title}
        </Link>
      )}
    </section>
  );
}
