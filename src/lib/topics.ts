/*
  Topic pages (/topics/prayer, /topics/fasting, ...) gather every post on a
  theme under a short introduction, so Google sees the site covers it deeply.
*/

export function topicSlug(tag: string) {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const intros: Record<string, { title: string; intro: string }> = {
  prayer: {
    title: "Prayer",
    intro:
      "Prayer is where the City Builders begin and end. Here are teachings, prayer points and words from Pastor Michael Tomiwa on how to pray, how to keep watch at night, and how to stay with God when answers seem slow.",
  },
  fasting: {
    title: "Fasting",
    intro:
      "How and why we fast: partial fasts, dry fasts and the Daniel fast, with Scripture and practical guidance. Fast with wisdom, and speak to a doctor first if you have a health condition.",
  },
  seasons: {
    title: "Seasons",
    intro:
      "Every season carries a word. Teachings on discerning the season you are in, waiting well, and moving when God moves, from the prophetic ministry of The City Builders.",
  },
  faith: {
    title: "Faith",
    intro: "Teachings on trusting God, standing on His word and walking by faith in every season of life.",
  },
  prophetic: {
    title: "The prophetic",
    intro: "Hearing God, understanding the times, and responding to the word of the Lord for this season.",
  },
  "night-watch": {
    title: "Night Watch",
    intro: "Night Watch is our daily prayer gathering at 11 PM, Lagos time. Here is why we keep watch at night, and what God does in the night season.",
  },
};

export function topicInfo(slug: string, fallbackTag?: string) {
  const known = intros[slug];
  if (known) return known;
  const title = fallbackTag ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title, intro: `Teachings, words and prayer points on ${title.toLowerCase()} from Pastor Michael Tomiwa and The City Builders.` };
}
