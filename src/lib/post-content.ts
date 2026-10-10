import { marked } from "marked";
export { isHtml, plainText } from "@/lib/post-text";

/*
  Blog posts are written in the rich editor and saved as HTML. Older posts
  were written in Markdown; they still display, and open in the editor as
  formatted text, becoming HTML the next time they're saved.
*/

/** Old Markdown posts as HTML, so the rich editor can open them. */
export function markdownToHtml(content: string) {
  return marked.parse(content, { async: false, gfm: true, breaks: false }) as string;
}
