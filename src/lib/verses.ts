export type Verse = {
  reference: string;
  text: string;
};

// A season/building/watch-themed set, matching City Builders' own content pillars.
export const verses: Verse[] = [
  {
    reference: "Hebrews 11:10",
    text: "For he was looking forward to the city with foundations, whose architect and builder is God.",
  },
  {
    reference: "Ecclesiastes 3:1",
    text: "For everything there is a season, and a time for every matter under heaven.",
  },
  {
    reference: "Psalm 127:1",
    text: "Unless the Lord builds the house, those who build it labor in vain.",
  },
  {
    reference: "1 Corinthians 3:11",
    text: "For no one can lay any foundation other than the one already laid, which is Jesus Christ.",
  },
  {
    reference: "Psalm 130:6",
    text: "My soul waits for the Lord more than watchmen wait for the morning.",
  },
  {
    reference: "Matthew 7:24",
    text: "Everyone then who hears these words of mine and does them will be like a wise man who built his house on the rock.",
  },
  {
    reference: "Isaiah 60:1",
    text: "Arise, shine, for your light has come, and the glory of the Lord has risen upon you.",
  },
  {
    reference: "Psalm 91:1",
    text: "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty.",
  },
  {
    reference: "Jeremiah 29:11",
    text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
  },
  {
    reference: "Lamentations 3:22-23",
    text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning.",
  },
  {
    reference: "Proverbs 24:3",
    text: "By wisdom a house is built, and by understanding it is established.",
  },
  {
    reference: "Mark 1:35",
    text: "And rising very early in the morning, while it was still dark, he departed and went out to a desolate place, and there he prayed.",
  },
  {
    reference: "Habakkuk 2:3",
    text: "For still the vision awaits its appointed time; it hastens to the end — it will not lie. If it seems slow, wait for it.",
  },
  {
    reference: "Psalm 118:22",
    text: "The stone that the builders rejected has become the cornerstone.",
  },
];

export function verseOfTheDay(date = new Date()): Verse {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return verses[dayOfYear % verses.length];
}
