import { verseOfTheDay } from "@/lib/verses";

export function VerseOfDay() {
  const verse = verseOfTheDay();

  return (
    <div className="border-l-2 border-gold pl-6">
      <p className="font-display text-2xl leading-snug text-paper sm:text-[1.75rem]">
        &ldquo;{verse.text}&rdquo;
      </p>
      <p className="mt-3 text-sm text-gold-text">{verse.reference} · today&apos;s word</p>
    </div>
  );
}
