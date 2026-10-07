import type { Metadata } from "next";
import { Stars } from "@/components/site/stars";
import { JoinForm } from "@/components/members/join-form";

export const metadata: Metadata = {
  title: "Members",
  description: "Sign in to your City Builders dashboard: programmes from the pastor, daily prayer, fasting and study, and your assignments.",
};

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/me") ? params.next : "/me";

  return (
    <div className="on-night sky relative overflow-hidden text-starlight">
      <Stars />
      <div className="relative mx-auto grid min-h-[80vh] max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-[1fr_26rem]">
        <div className="max-w-xl">
          <p className="text-lamp">The City Builders</p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.02]">Build with us, every day.</h1>
          <p className="mt-6 text-lg leading-relaxed text-starlight-dim">
            Your own space to follow what Pastor Michael gives the house: seasons of prayer, fasting and the Word, step by
            step. Tick off each day, write what God shows you, hand in your assignments and watch yourself grow.
          </p>
          <ul className="mt-8 grid gap-3 text-starlight sm:grid-cols-2">
            {[
              "Today's steps, ready when you wake",
              "Your streak and growth path",
              "Assignments with the pastor's feedback",
              "A private prayer journal",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-lamp" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <JoinForm next={next} />
      </div>
    </div>
  );
}
