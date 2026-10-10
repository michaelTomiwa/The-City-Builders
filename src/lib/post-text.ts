/* Plain-text helpers for posts, safe to use anywhere (no Markdown or HTML libraries). */

/** True when content was saved by the rich editor (HTML) rather than as Markdown. */
export function isHtml(content: string) {
  return /^\s*</.test(content);
}

/** The words of a post without any tags, for reading time, search and word counts. */
export function plainText(content: string) {
  const text = isHtml(content)
    ? content
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&[a-z]+;|&#\d+;/gi, " ")
    : content.replace(/[#>*_`~\-[\]()!]/g, " ");
  return text.replace(/\s+/g, " ").trim();
}
