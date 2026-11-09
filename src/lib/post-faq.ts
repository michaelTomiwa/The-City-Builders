const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/*
  A post's "Questions this message answers" section (an h2 with the word
  "questions", then each question as an h3 and its answer in the paragraphs
  under it) becomes FAQ data Google can show in search results.
*/

export function postFaq(html: string) {
  const start = html.search(/<h2[^>]*>[^<]*questions[^<]*<\/h2>/i);
  if (start < 0) return [];
  const rest = html.slice(start).replace(/^<h2[^>]*>.*?<\/h2>/i, "");
  const end = rest.search(/<h2[\s>]/i);
  const section = end < 0 ? rest : rest.slice(0, end);
  return section
    .split(/<h3[^>]*>/i)
    .slice(1)
    .map((part) => {
      const [q, ...a] = part.split(/<\/h3>/i);
      return { question: text(q), answer: text(a.join(" ")) };
    })
    .filter((f) => f.question && f.answer)
    .slice(0, 10);
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}
