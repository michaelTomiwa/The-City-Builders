/*
  "Sermon to post": the pastor copies a ready-made prompt (plus the YouTube
  transcript) into Claude, then pastes Claude's reply back here. We read the
  title, summary, tags, post and "please check" list out of that reply.
*/

export const sermonPrompt = `You are helping Pastor Michael Tomiwa of The City Builders church (Lagos, Nigeria) turn a sermon transcript into a blog post for the church website.

The transcript below is auto-generated YouTube captions from one of our services. It has no punctuation, may mishear words, and includes songs, prayers, greetings and repetition.

Write a blog post of about 1,200 to 1,500 words that:
- Keeps the pastor's voice, message and main points. Do not add teaching he did not give.
- Opens with a strong first paragraph that draws the reader in.
- Uses clear headings (##) for each main point.
- Writes out every scripture he referenced in full, in the KJV, with the reference, as a quote (>).
- Includes 2 or 3 short memorable lines from the message as quotes.
- Ends with a short "This week" section (one or two things to do) and a closing prayer.
- Leaves out songs, announcements, greetings and filler.
- If a word or name in the transcript is unclear, make your best guess and list it at the end under PLEASE CHECK so the pastor can confirm.

Reply in exactly this shape, in Markdown:

TITLE: (short and strong)
SUMMARY: (one or two sentences for the blog list and Google)
TAGS: (2 to 4, comma separated, e.g. Prayer, Seasons, Faith)
POST:
(the post itself)
PLEASE CHECK:
- (anything you weren't sure about, or "Nothing")

Transcript:
`;

export type SermonDraft = { title: string; summary: string; tags: string[]; body: string; check: string[] };

const label = (name: string) => new RegExp(`^\\s*(?:\\d+[.)]\\s*)?(?:[#>*_\\s]*)${name}(?:[*_\\s]*)\\s*:?[*_\\s]*`, "i");

/** One labelled line, e.g. "TITLE: Rise and build" or "**Title:** Rise and build". */
function line(lines: string[], name: string) {
  const re = label(name);
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) return { value: "", index: -1 };
  const rest = lines[i].replace(re, "").trim();
  // The value may sit on the next non-empty line instead.
  if (rest) return { value: rest, index: i };
  const next = lines.slice(i + 1).findIndex((l) => l.trim());
  return next < 0 ? { value: "", index: i } : { value: lines[i + 1 + next].trim(), index: i + 1 + next };
}

const clean = (s: string) => s.replace(/^[*_#\s"“]+|[*_\s"”]+$/g, "").trim();

/** Reads Claude's reply. Anything not labelled is treated as the post itself. */
export function parseSermonReply(reply: string): SermonDraft {
  const lines = reply.replace(/\r\n/g, "\n").split("\n");
  const title = line(lines, "title");
  const summary = line(lines, "summary");
  const tags = line(lines, "tags");
  const postAt = lines.findIndex((l) => label("post").test(l) && !l.replace(label("post"), "").trim());
  const checkAt = lines.findIndex((l) => label("please check").test(l));

  const start = postAt >= 0 ? postAt + 1 : Math.max(title.index, summary.index, tags.index) + 1;
  const end = checkAt > start ? checkAt : lines.length;
  let body = lines.slice(start, end).join("\n").trim();
  // Drop a repeated title at the top of the post.
  const firstLine = body.split("\n")[0] ?? "";
  if (title.value && clean(firstLine).toLowerCase() === clean(title.value).toLowerCase()) body = body.split("\n").slice(1).join("\n").trim();
  body = body.replace(/^\s*(?:---|\*\*\*)\s*$/gm, "").trim();

  const check =
    checkAt >= 0
      ? [lines[checkAt].replace(label("please check"), ""), ...lines.slice(checkAt + 1)]
          .map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
          .filter((l) => l && !/^(none|nothing)\.?$/i.test(l))
      : [];

  return {
    title: clean(title.value).slice(0, 200),
    summary: clean(summary.value).slice(0, 400),
    tags: tags.value
      .split(/[,;]/)
      .map((t) => clean(t))
      .filter(Boolean)
      .slice(0, 4),
    body,
    check: check.slice(0, 12),
  };
}

/** A YouTube video id from a link (watch, youtu.be, live, shorts) or a bare id. */
export function videoIdFrom(input: string) {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|\/live\/|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}
