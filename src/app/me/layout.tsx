import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Stars } from "@/components/site/stars";
import { MemberNav } from "@/components/members/member-nav";
import { getMember, getMemberData } from "@/lib/member-data";
import { firstName, initials, lagosToday } from "@/lib/discipleship";
import { signOutMember } from "./actions";

export const metadata: Metadata = {
  title: "My dashboard",
  robots: { index: false },
};

export default async function MemberLayout({ children }: LayoutProps<"/me">) {
  const { user, profile } = await getMember();
  if (!user) redirect("/join");

  const approved = profile && (profile.status === "active" || profile.role !== "member");

  if (!approved) {
    return (
      <div className="on-night sky relative min-h-[75vh] overflow-hidden text-starlight">
        <Stars />
        <div className="relative mx-auto max-w-xl px-6 py-24 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lamp/15 text-2xl font-display text-lamp">
            {initials(profile ?? { full_name: null, email: user.email ?? null })}
          </span>
          <h1 className="mt-6 font-display text-4xl">
            {profile?.status === "inactive" ? "Your account is paused" : `Welcome, ${firstName(profile ?? { full_name: null, email: user.email ?? null })}.`}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-starlight-dim">
            {profile?.status === "inactive"
              ? "Please speak with the City Builders team if you think this is a mistake."
              : "You're on the list. The pastor's team will confirm you soon, and then your dashboard opens with today's steps."}
          </p>
          <p className="mt-8 text-sm text-starlight-dim">
            Questions? Write to{" "}
            <a href="mailto:response.citybuilders@gmail.com" className="text-lamp hover:underline">
              response.citybuilders@gmail.com
            </a>
          </p>
          <form action={signOutMember} className="mt-6">
            <button className="text-sm text-starlight-dim underline-offset-4 hover:text-lamp hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const { assignments, submissions } = await getMemberData();
  const { supabase } = await getMember();
  const { count: memoryDue } = await supabase
    .from("memory_verses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("due_on", lagosToday());
  const handedIn = new Map(submissions.map((s) => [s.assignment_id, s.status]));
  const toDo = assignments.filter((a) => !handedIn.has(a.id) || handedIn.get(a.id) === "needs_work").length;

  return (
    <div className="min-h-screen bg-midnight">
      <div className="on-night border-b border-night-3 bg-night text-starlight">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lamp/15 font-display text-lg text-lamp">
                {initials(profile)}
              </span>
              <div>
                <p className="text-xs text-starlight-dim">City Builders · Member</p>
                <p className="font-display text-xl leading-tight">{profile?.full_name ?? user.email}</p>
              </div>
            </div>
            <form action={signOutMember}>
              <button className="text-sm text-starlight-dim hover:text-lamp">Sign out</button>
            </form>
          </div>
          <div className="mt-6">
            <MemberNav badges={{ assignments: toDo, memory: memoryDue ?? 0 }} />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
