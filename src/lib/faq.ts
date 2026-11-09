import { CHURCH_EMAIL, CHANNEL_URL } from "@/lib/schedule";

/*
  The questions people ask most, answered plainly. Shown on /faq, on the home
  page, and given to Google as FAQ data.
*/

export type Faq = { question: string; answer: string; link?: { href: string; label: string } };

export function churchFaqs(address?: string | null): Faq[] {
  return [
    {
      question: "What is The City Builders?",
      answer:
        "The City Builders is a praying church led by Pastor Michael Tomiwa, based in Lagos, Nigeria, with members who join online from around the world. We focus on prayer, teaching and the prophetic, helping believers build strong foundations and understand their season.",
      link: { href: "/about", label: "About us" },
    },
    {
      question: "What time is Night Watch and Morning Prayers?",
      answer:
        "Night Watch is every night at 11:00 PM and Morning Prayers is every morning at 7:00 AM, Lagos time (West Africa Time, UTC+1). Both are streamed live on YouTube, so you can join from anywhere.",
      link: { href: "/live", label: "Watch live" },
    },
    {
      question: "How do I join a service online?",
      answer: `Open the Watch live page on this site at service time, or go to our YouTube channel (${CHANNEL_URL}). Tap "Notify me" on the site to get an alert on your phone 5 minutes before we go live.`,
      link: { href: "/live", label: "Watch live" },
    },
    {
      question: "What happens at Night Watch?",
      answer:
        "Night Watch is a time of prayer, worship and the word. We pray for one another, for families, for Lagos and the nations, and the pastor shares a word for the season. Come as you are; you can pray along from home.",
    },
    {
      question: "Where is the church?",
      answer: address
        ? `We meet in person at ${address}, and every service is also streamed live online.`
        : "We are based in Lagos, Nigeria, and we gather online every day, so you can join from anywhere in the world.",
      link: { href: "/contact", label: "Contact us" },
    },
    {
      question: "Who is the pastor of The City Builders?",
      answer: "The City Builders is led by Pastor Michael Tomiwa, who leads Night Watch, Morning Prayers and the church's teaching and prophetic ministry.",
      link: { href: "/pastor", label: "About Pastor Michael" },
    },
    {
      question: "Can I send a prayer request?",
      answer:
        "Yes. Write it on the prayer wall. You can share it publicly so others pray with you, or keep it private so only the pastor's team sees it. We pray over every request.",
      link: { href: "/prayer", label: "Prayer wall" },
    },
    {
      question: "What are this week's prayer points?",
      answer:
        "Every week the pastor gives the whole church prayer points, a fasting plan and a daily Bible reading. They are on the This week page, and you can send them to your family on WhatsApp.",
      link: { href: "/week", label: "This week's prayer points" },
    },
    {
      question: "How should I fast with the church?",
      answer:
        "Follow the fasting plan in the weekly instruction, for example from 6 AM to 12 noon on the days given, with water only, and spend the time in prayer and the word. If you have a health condition, are pregnant or take medication, speak to a doctor first and choose a gentler fast.",
      link: { href: "/topics/fasting", label: "Teachings on fasting" },
    },
    {
      question: "How do I become a member?",
      answer:
        "Create an account on the Join page. Once the pastor's team confirms you, your dashboard opens with daily steps, the weekly checklist, Bible reading, assignments and messages with the pastor.",
      link: { href: "/join", label: "Join the City Builders" },
    },
    {
      question: "Can I watch past messages?",
      answer: "Yes. Every Night Watch and message is on The watch page and our YouTube channel, and many are written up as posts on the blog.",
      link: { href: "/sermons", label: "Past messages" },
    },
    {
      question: "How can I give?",
      answer: "You can give securely online on the Give page. Thank you for building with us.",
      link: { href: "/give", label: "Give" },
    },
    {
      question: "How do I contact the church?",
      answer: `Write to us at ${CHURCH_EMAIL} or use the contact form. Questions, testimonies and invitations for Pastor Michael are all welcome.`,
      link: { href: "/contact", label: "Contact us" },
    },
  ];
}
