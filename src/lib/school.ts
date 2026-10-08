/*
  The Discipleship School: courses made of lessons (a video, teaching notes,
  a scripture and a short quiz). Members pass a lesson with 70% and earn a
  certificate when every lesson in a course is done.
*/

export type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  sort: number;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  sort: number;
  title: string;
  video_url: string | null;
  body: string | null;
  scripture: string | null;
};

export type QuizQuestion = {
  id?: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string | null;
};

export type LessonProgress = {
  user_id: string;
  lesson_id: string;
  course_id: string;
  score: number | null;
  total: number | null;
  completed_at: string;
};

export function youtubeId(input: string | null | undefined) {
  const value = (input ?? "").trim();
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export type DraftLesson = {
  id?: string;
  title: string;
  video_url: string | null;
  scripture: string | null;
  body: string | null;
  questions: QuizQuestion[];
};

/** A complete starter course the pastor can load, edit and publish. */
export const starterCourse: { title: string; summary: string; lessons: DraftLesson[] } = {
  title: "Foundations of Faith",
  summary: "Four lessons on the ground every builder stands on: salvation, the Word, prayer and the Holy Spirit.",
  lessons: [
    {
      title: "Born again: the new life in Christ",
      video_url: null,
      scripture: "John 3:1-21",
      body:
        "## A new beginning\n\nJesus told Nicodemus, a teacher of Israel, that no one can see the kingdom of God unless they are **born again**. Salvation is not self-improvement; it is a new life given by God.\n\n> \"Therefore, if anyone is in Christ, he is a new creation.\" 2 Corinthians 5:17\n\n### What happened when you believed\n\n- Your sins were forgiven (Ephesians 1:7)\n- You became a child of God (John 1:12)\n- The Holy Spirit came to live in you (Romans 8:9)\n\nThis week, thank God every morning for the new life you have in Him.",
      questions: [
        { question: "What did Jesus say a person must be to see the kingdom of God?", options: ["Religious", "Born again", "Perfect", "Educated in the law"], answer: 1, explanation: "John 3:3: \"unless one is born again, he cannot see the kingdom of God.\"" },
        { question: "According to 2 Corinthians 5:17, anyone in Christ is…", options: ["A better person", "A new creation", "Free from all trouble", "A prophet"], answer: 1, explanation: null },
        { question: "Salvation is mainly…", options: ["Self-improvement", "A gift of new life from God", "Earned by good works", "Joining a church"], answer: 1, explanation: "Ephesians 2:8-9: by grace through faith, not of works." },
      ],
    },
    {
      title: "Living by the Word",
      video_url: null,
      scripture: "Psalm 119:105",
      body:
        "## A lamp and a light\n\nThe Bible is how God speaks to us every day. A builder who doesn't read the plans builds in the dark.\n\n### A simple daily rhythm\n\n1. **Read** a passage slowly\n2. **Reflect**: what does it say about God? About me?\n3. **Respond**: pray it back to Him and obey one thing\n\n> \"Your word is a lamp to my feet and a light to my path.\" Psalm 119:105",
      questions: [
        { question: "Psalm 119:105 calls God's word…", options: ["A sword and shield", "A lamp and a light", "Bread and water", "A rock and fortress"], answer: 1, explanation: null },
        { question: "Which is part of the daily rhythm in this lesson?", options: ["Read, reflect, respond", "Read as fast as possible", "Only read on Sundays", "Memorise a chapter a day"], answer: 0, explanation: null },
      ],
    },
    {
      title: "A life of prayer",
      video_url: null,
      scripture: "Matthew 6:5-15",
      body:
        "## Talking with your Father\n\nPrayer is not a performance; it is relationship. Jesus taught us to pray to *our Father*, in secret, simply and honestly.\n\n### The Lord's Prayer as a pattern\n\n- **Worship**: hallowed be Your name\n- **Surrender**: Your kingdom come, Your will be done\n- **Provision**: give us this day our daily bread\n- **Forgiveness**: forgive us, as we forgive\n- **Protection**: deliver us from the evil one\n\nJoin us at Night Watch (11 PM) or Morning Prayers (7 AM) to pray with the house.",
      questions: [
        { question: "Jesus taught us to begin prayer by addressing God as…", options: ["Master", "Our Father", "Almighty Judge", "Lord of hosts"], answer: 1, explanation: null },
        { question: "Where did Jesus say to pray (Matthew 6:6)?", options: ["On the street corners", "In your room with the door shut", "Only in the temple", "On a mountain"], answer: 1, explanation: "Pray to your Father who is in the secret place." },
      ],
    },
    {
      title: "Walking in the Spirit",
      video_url: null,
      scripture: "Galatians 5:16-25",
      body:
        "## Helped from the inside\n\nJesus promised a Helper, the Holy Spirit, who lives in every believer. He teaches, comforts, leads and empowers us.\n\n### The fruit of the Spirit\n\nLove, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control (Galatians 5:22-23).\n\nAsk Him each morning: *Holy Spirit, lead me today.*",
      questions: [
        { question: "Which of these is a fruit of the Spirit?", options: ["Ambition", "Patience", "Fame", "Wealth"], answer: 1, explanation: null },
        { question: "What did Jesus call the Holy Spirit in John 14:26?", options: ["The Helper", "The Judge", "The Prophet", "The Builder"], answer: 0, explanation: null },
      ],
    },
  ],
};
