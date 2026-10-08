/*
  Bible in a year: all 1,189 chapters, Genesis to Revelation, spread evenly
  over 365 days (about 3 a day). The text comes from bible-api.com (free,
  public-domain KJV and WEB), cached for a week.
*/

export const books: [string, number][] = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34], ["Joshua", 24], ["Judges", 21], ["Ruth", 4],
  ["1 Samuel", 31], ["2 Samuel", 24], ["1 Kings", 22], ["2 Kings", 25], ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10], ["Nehemiah", 13],
  ["Esther", 10], ["Job", 42], ["Psalms", 150], ["Proverbs", 31], ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66], ["Jeremiah", 52],
  ["Lamentations", 5], ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14], ["Joel", 3], ["Amos", 9], ["Obadiah", 1], ["Jonah", 4], ["Micah", 7],
  ["Nahum", 3], ["Habakkuk", 3], ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4],
  ["Matthew", 28], ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28], ["Romans", 16], ["1 Corinthians", 16], ["2 Corinthians", 13],
  ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4], ["Colossians", 4], ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6],
  ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5], ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5], ["2 John", 1],
  ["3 John", 1], ["Jude", 1], ["Revelation", 22],
];

const chapters: { book: string; chapter: number }[] = books.flatMap(([book, n]) => Array.from({ length: n }, (_, i) => ({ book, chapter: i + 1 })));

export const PLAN_DAYS = 365;

/** The chapters to read on a day of the plan (1–365). */
export function readingFor(day: number) {
  const d = Math.min(Math.max(1, Math.round(day)), PLAN_DAYS);
  const start = Math.floor(((d - 1) * chapters.length) / PLAN_DAYS);
  const end = Math.floor((d * chapters.length) / PLAN_DAYS);
  return chapters.slice(start, end);
}

/** "Genesis 1–3" or "Ruth 4 – 1 Samuel 2" */
export function readingLabel(day: number) {
  const r = readingFor(day);
  const first = r[0];
  const last = r[r.length - 1];
  if (first.book === last.book) return first.chapter === last.chapter ? `${first.book} ${first.chapter}` : `${first.book} ${first.chapter}–${last.chapter}`;
  return `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;
}

export function planDay(start: string | null, today: string) {
  if (!start) return null;
  return Math.min(PLAN_DAYS, Math.max(1, Math.round((Date.parse(today) - Date.parse(start)) / 86_400_000) + 1));
}

export type Verse = { verse: number; text: string };

/** One chapter's verses (KJV), or null if the Bible service can't be reached. */
export async function fetchChapter(book: string, chapter: number): Promise<Verse[] | null> {
  try {
    const base = process.env.BIBLE_API_URL ?? "https://bible-api.com";
    const res = await fetch(`${base}/${encodeURIComponent(`${book} ${chapter}`)}?translation=kjv`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { verses?: { verse: number; text: string }[] };
    return (data.verses ?? []).map((v) => ({ verse: v.verse, text: v.text.replace(/\s+/g, " ").trim() }));
  } catch {
    return null;
  }
}

/** Spaced repetition: after a correct recall, a verse comes back after these many days. */
export const memoryIntervals = [1, 2, 4, 7, 14, 30];

export function nextReview(box: number, knew: boolean, today: string) {
  const nextBox = knew ? Math.min(6, box + 1) : 1;
  const days = knew ? memoryIntervals[nextBox - 1] : 1;
  const due = new Date(Date.parse(today) + days * 86_400_000).toISOString().slice(0, 10);
  return { box: nextBox, due_on: due };
}
