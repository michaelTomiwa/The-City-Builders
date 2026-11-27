/*
  Captions for the Clip Studio: read the .srt / .vtt file YouTube Studio
  gives you, edit the lines, and save them back out as .srt.
  All times are in seconds from the start of the source video.
*/

export type Cue = { id: string; start: number; end: number; text: string };

let n = 0;
export const cueId = () => `c${Date.now().toString(36)}${(n++).toString(36)}`;

/** "00:01:02,345", "01:02.3", "1:02" or "62.5" → seconds. */
export function parseTime(input: string): number | null {
  const s = input.trim().replace(",", ".");
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const m = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Seconds → "1:02.3" (or "1:02" without tenths). */
export function formatTime(t: number, tenths = true) {
  const safe = Math.max(0, t);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  const ss = tenths ? sec.toFixed(1).padStart(4, "0") : Math.floor(sec).toString().padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Seconds → "00:01:02,345" for .srt files. */
export function srtTime(t: number) {
  const ms = Math.round(Math.max(0, t) * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const p = (x: number, l = 2) => String(x).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(ms % 1000, 3)}`;
}

const cleanLine = (l: string) =>
  l
    .replace(/<[^>]*>/g, "") // <c>, <i>, <00:00:01.000> word timings
    .replace(/\{\\[^}]*\}/g, "") // {\an8}
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/** Reads an .srt or .vtt file (including YouTube's rolling auto-captions). */
export function parseCaptions(text: string): Cue[] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "").split("\n");
  const blank = (i: number) => i < 0 || !lines[i]?.trim();
  const timings = lines.flatMap((l, i) => (l.includes("-->") ? [i] : []));
  const out: Cue[] = [];
  let previous: string[] = [];
  timings.forEach((at, k) => {
    const [a, b] = lines[at].split("-->");
    const start = parseTime(a.trim().split(/\s+/)[0]);
    const end = parseTime(b.trim().split(/\s+/)[0]);
    let stop = k + 1 < timings.length ? timings[k + 1] : lines.length;
    // A cue number or name sits on its own line just before the next timing.
    if (stop < lines.length && !blank(stop - 1) && blank(stop - 2) && stop - 1 > at) stop -= 1;
    if (start === null || end === null || end - start < 0.05) return;
    const textLines = lines.slice(at + 1, stop).map(cleanLine).filter(Boolean);
    // YouTube auto-captions repeat the previous line before adding new words.
    const fresh = textLines.filter((l) => !previous.includes(l));
    if (textLines.length) previous = textLines;
    const body = fresh.join(" ").trim();
    if (body) out.push({ id: cueId(), start, end, text: body });
  });
  out.sort((x, y) => x.start - y.start);
  // Rolling captions overlap; end each line when the next one starts.
  for (let i = 0; i < out.length - 1; i++) if (out[i].end > out[i + 1].start) out[i].end = out[i + 1].start;
  return out;
}

/** Captions as an .srt file, e.g. to upload to YouTube with the finished Short. */
export function toSrt(cues: Cue[], offset = 0) {
  return cues
    .map((c, i) => `${i + 1}\n${srtTime(c.start - offset)} --> ${srtTime(c.end - offset)}\n${c.text}\n`)
    .join("\n");
}

/** Splits each caption into short phrases of a few words: the punchy Shorts style. */
export function chunkCues(cues: Cue[], maxWords = 4): Cue[] {
  const out: Cue[] = [];
  for (const c of cues) {
    const words = c.text.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      out.push(c);
      continue;
    }
    // Even groups, so no single word is left hanging on its own.
    const per = Math.ceil(words.length / Math.ceil(words.length / maxWords));
    const groups: string[] = [];
    for (let i = 0; i < words.length; i += per) groups.push(words.slice(i, i + per).join(" "));
    const total = groups.reduce((sum, g) => sum + g.length, 0);
    let t = c.start;
    groups.forEach((g, i) => {
      const end = i === groups.length - 1 ? c.end : t + ((c.end - c.start) * g.length) / total;
      out.push({ id: `${c.id}-${i}`, start: t, end, text: g });
      t = end;
    });
  }
  return out;
}

/** The caption showing at time t, if any. */
export function cueAt(cues: Cue[], t: number) {
  return cues.find((c) => t >= c.start && t < c.end) ?? null;
}
