/*
  Every word on the site lives here. Edit this file, push, and Vercel
  redeploys. Anything marked SAMPLE is placeholder copy: replace it with
  your real details before you share the link.
*/

export const site = {
  // SAMPLE: your organisation's name and one-line promise.
  name: "Inkhouse",
  fullName: "Inkhouse Writers Collective",
  tagline: "Scripts that refuse to be quiet.",
  description:
    "Inkhouse is a collective of screenwriters, playwrights and story architects writing film, TV, stage, audio and brand scripts that audiences can't look away from.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@example.com", // SAMPLE
  location: "Lagos · London · Remote worldwide", // SAMPLE
  socials: [
    // SAMPLE: delete any you don't use.
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "X", href: "https://x.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
  ],
};

export const stats = [
  // SAMPLE: use your real numbers.
  { value: 120, suffix: "+", label: "Scripts delivered" },
  { value: 9, suffix: "", label: "Formats we write" },
  { value: 14, suffix: "", label: "Countries reached" },
  { value: 98, suffix: "%", label: "Clients who come back" },
];

export const founder = {
  // SAMPLE: your bio. Drop a square photo in /public/team and set `photo`.
  name: "Your Name",
  role: "Founder & Head Writer",
  photo: null as string | null, // e.g. "/team/founder.jpg"
  headline: "I started Inkhouse because great stories deserve writers who show up loud.",
  bio: [
    "I've spent the last decade writing for the screen, the stage and the speaker. Feature drafts, episodic TV, stage plays, radio dramas and campaigns that had to land in thirty seconds or less.",
    "Somewhere along the way I noticed that the best scripts never come from one person working alone. So I built a room: a collective of writers who push each other, protect the story and deliver on time.",
    "Today Inkhouse writes for producers, directors, churches, brands and first-time filmmakers. My job is to make sure every page we hand over is one you'd fight to keep.",
  ],
  highlights: ["10+ years writing", "Film · TV · Stage", "Story editor & mentor"],
};

export const services = [
  {
    title: "Original scripts",
    body: "From a single sentence idea to a polished, production-ready draft: built with you, page by page.",
  },
  {
    title: "Script doctoring",
    body: "Already have a draft? We diagnose what's not working (structure, pace, dialogue, character) and fix it.",
  },
  {
    title: "Adaptations",
    body: "Novels, true stories, sermons and stage plays reshaped for the screen without losing their soul.",
  },
  {
    title: "Writers' room on demand",
    body: "A full room for your series: breaking story, building the bible, outlining seasons and writing episodes.",
  },
  {
    title: "Story development",
    body: "Loglines, treatments, pitch decks and series bibles that make producers and investors lean in.",
  },
  {
    title: "Coverage & feedback",
    body: "Honest, detailed reader's notes so you know exactly where your script stands before you send it out.",
  },
];

export const scriptTypes = [
  { title: "Feature Film", tag: "90–120 pages", body: "Theatrical and streaming features across drama, thriller, comedy and faith." },
  { title: "TV & Web Series", tag: "Pilots · Seasons", body: "Pilots, episodes and full-season arcs with a series bible to match." },
  { title: "Short Film", tag: "5–30 minutes", body: "Festival-ready shorts that do a lot with very little." },
  { title: "Stage Play", tag: "Theatre · Drama ministry", body: "Full-length plays, one-acts and church productions built for a live room." },
  { title: "Radio & Podcast Drama", tag: "Audio-first", body: "Scripts written for the ear: sound cues, voice and pace." },
  { title: "Commercials & Brand Films", tag: "15s · 30s · 60s", body: "Campaign scripts that sell without sounding like a sales pitch." },
  { title: "Documentary", tag: "Narration · Structure", body: "Interview frameworks, narration and story structure for non-fiction." },
  { title: "Music Video", tag: "Concept · Treatment", body: "Visual concepts and shot-by-shot treatments for artists." },
  { title: "Animation", tag: "Kids · Adult", body: "Animated series and shorts with characters built to last." },
];

export const steps = [
  { step: "01", title: "Discovery call", body: "We hear the idea, the audience and the budget. No forms to fill, just a conversation." },
  { step: "02", title: "Story blueprint", body: "Logline, outline and character map, signed off by you before a single scene is written." },
  { step: "03", title: "Drafting", body: "The room writes. You get regular check-ins and a full first draft on the agreed date." },
  { step: "04", title: "Rewrites & polish", body: "Notes, rewrites and a final polish until the script is ready for the camera or the stage." },
];

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  photo?: string | null;
};

// SAMPLE: replace with your real team. Photos go in /public/team.
export const team: TeamMember[] = [
  { name: "Team Member One", role: "Senior Screenwriter", bio: "Features and limited series. Loves a twist you don't see coming." },
  { name: "Team Member Two", role: "Playwright & Stage Lead", bio: "Writes for the live room: stage plays, drama ministry and one-acts." },
  { name: "Team Member Three", role: "TV Story Editor", bio: "Breaks seasons, builds series bibles and keeps the room on track." },
  { name: "Team Member Four", role: "Brand & Commercial Writer", bio: "Turns briefs into 30-second stories people actually remember." },
  { name: "Team Member Five", role: "Audio Drama Writer", bio: "Radio, podcast fiction and anything written for the ear." },
  { name: "Team Member Six", role: "Script Consultant", bio: "Coverage, notes and the honest feedback every draft needs." },
];

export type Review = {
  name: string;
  role?: string | null;
  project?: string | null;
  quote: string;
  rating: number;
  // Sample reviews show a "Sample" tag so nobody mistakes them for real
  // ones. Delete them once real reviews arrive.
  sample?: boolean;
};

export const reviews: Review[] = [
  {
    name: "Sample Client",
    role: "Producer",
    project: "Feature film",
    quote: "They took a messy idea and handed back a script our whole cast fell in love with. Delivered early, too.",
    rating: 5,
    sample: true,
  },
  {
    name: "Sample Client",
    role: "Director",
    project: "Web series, season one",
    quote: "The writers' room broke an entire season in three weeks. Every episode ends on a hook.",
    rating: 5,
    sample: true,
  },
  {
    name: "Sample Client",
    role: "Drama Ministry Lead",
    project: "Easter stage play",
    quote: "Our audience laughed, cried and stood up at the end. Best production we've ever staged.",
    rating: 5,
    sample: true,
  },
];

// SAMPLE: past projects shown above the reviews.
export const projects = [
  { title: "Project Title One", kind: "Feature Film", year: "2026" },
  { title: "Project Title Two", kind: "Web Series", year: "2025" },
  { title: "Project Title Three", kind: "Stage Play", year: "2025" },
  { title: "Project Title Four", kind: "Brand Campaign", year: "2024" },
];
