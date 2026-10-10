import sanitizeHtml from "sanitize-html";
import { isHtml, markdownToHtml } from "@/lib/post-content";

/*
  Turns a post (rich-editor HTML or older Markdown) into HTML that is safe to
  put on the page: only the formatting the editor can produce is kept, and
  anything else (scripts, event handlers, odd styles) is removed.
*/

const color = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;

export function postHtml(content: string) {
  const html = isHtml(content) ? content : markdownToHtml(content);
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "del", "sub", "sup", "mark", "span", "code", "pre",
      "blockquote", "ul", "ol", "li", "a", "img", "hr", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col", "label", "input", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      ul: ["data-type"],
      li: ["data-type", "data-checked"],
      input: ["type", "checked", "disabled"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
      col: ["style"],
      ol: ["start"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: [color],
        "background-color": [color],
        "text-align": [/^(left|right|center|justify)$/],
        "font-size": [/^\d{1,2}(\.\d+)?(px|pt|em|rem)$/],
        "font-family": [/^[\w\s,'"-]{1,80}$/],
        "line-height": [/^\d(\.\d+)?$/],
        width: [/^\d{1,4}(px|%)$/],
        "min-width": [/^\d{1,4}px$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tag, attribs) => ({
        tagName: "a",
        attribs: /^https?:/.test(attribs.href ?? "") ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
      }),
      input: (tag, attribs) => ({ tagName: "input", attribs: attribs.type === "checkbox" ? { ...attribs, disabled: "disabled" } : {} }),
    },
  });
}
