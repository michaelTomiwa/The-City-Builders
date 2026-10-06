import { verses } from "@/lib/verses";

/** A slow-moving band of building and watch scriptures between night and day. */
export function ScriptureBand() {
  const items = verses.slice(0, 8);
  const row = (duplicate: boolean) => (
    <ul
      className="flex shrink-0 items-baseline gap-14 pr-14"
      {...(duplicate ? { "data-duplicate": true, "aria-hidden": true } : {})}
    >
      {items.map((v) => (
        <li key={v.reference} className="flex shrink-0 items-baseline gap-4">
          <span className="whitespace-nowrap font-display text-2xl text-paper sm:text-3xl">&ldquo;{v.text}&rdquo;</span>
          <span className="text-sm text-gold-text">{v.reference}</span>
          <span className="ml-10 text-gold" aria-hidden="true">
            &#10022;
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Scriptures we build on" className="overflow-hidden border-y border-steel py-8">
      <div className="marquee">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
