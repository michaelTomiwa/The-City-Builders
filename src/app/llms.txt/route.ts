import { supabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/site";
import { CHANNEL_URL, CHURCH_EMAIL, services } from "@/lib/schedule";
import { churchFaqs } from "@/lib/faq";
import { getSiteSettings } from "@/lib/settings";
import { currentInstruction, instructionArchive, instructionTitle } from "@/lib/instruction";
import { allTopics, publishedPosts } from "@/lib/topic-data";

/*
  /llms.txt: a plain summary of the church and its best pages, so AI search
  tools (Google's AI answers, ChatGPT, Perplexity and others) describe us
  accurately and link to the right page.
*/

export const revalidate = 3600;

export async function GET() {
  const [settings, ins, weeks, posts, topics] = await Promise.all([
    getSiteSettings(),
    currentInstruction(supabase),
    instructionArchive(supabase),
    publishedPosts(),
    allTopics(),
  ]);
  const url = (path: string) => `${siteUrl}${path}`;
  const lines = [
    "# The City Builders",
    "",
    "> A praying church in Lagos, Nigeria, led by Pastor Michael Tomiwa, with members who join online from around the world. Prayer, teaching and the prophetic, helping believers build strong foundations and understand their season.",
    "",
    `- Services (every day, Lagos time, UTC+1): ${services.map((s) => `${s.name} at ${s.label}`).join("; ")}. Streamed live on YouTube: ${CHANNEL_URL}`,
    `- Location: ${settings?.church_address ? `${settings.church_address} (and online)` : "Lagos, Nigeria (gathers online)"}`,
    `- Contact: ${CHURCH_EMAIL}`,
    "",
    "## Key pages",
    `- [Watch live](${url("/live")}): join Night Watch or Morning Prayers`,
    `- [This week's prayer points](${url("/week")}): fasting plan, prayer points and daily Bible reading for the whole church`,
    `- [Questions people ask](${url("/faq")}): service times, joining online, prayer requests, fasting, membership, giving`,
    `- [Pastor Michael Tomiwa](${url("/pastor")}): who leads the church`,
    `- [Prayer wall](${url("/prayer")}): send a prayer request`,
    `- [Messages](${url("/sermons")}): past Night Watch and Sunday messages`,
    `- [Blog](${url("/blog")}) and [topics](${url("/topics")})`,
    `- [Join](${url("/join")}) · [Give](${url("/give")}) · [Contact](${url("/contact")})`,
  ];
  if (ins) lines.push("", "## This week", `- [${instructionTitle(ins)}](${url(`/week/${ins.week_start}`)})`, ...ins.prayer_points.map((p) => `  - ${p}`));
  if (weeks.length > 1) {
    lines.push("", "## Weekly prayer points archive", ...weeks.slice(0, 20).map((w) => `- [${instructionTitle(w)}](${url(`/week/${w.week_start}`)}) (week of ${w.week_start})`));
  }
  if (topics.length) lines.push("", "## Topics", ...topics.map((t) => `- [${t.title}](${url(`/topics/${t.slug}`)}): ${t.count} ${t.count === 1 ? "post" : "posts"}`));
  if (posts.length) lines.push("", "## Recent posts", ...posts.slice(0, 20).map((p) => `- [${p.title}](${url(`/blog/${p.slug}`)})${p.excerpt ? `: ${p.excerpt}` : ""}`));
  lines.push("", "## Common questions", ...churchFaqs(settings?.church_address).map((f) => `- **${f.question}** ${f.answer}`));

  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
