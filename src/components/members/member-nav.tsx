"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/me", label: "Today", exact: true },
  { href: "/me/programs", label: "Programmes" },
  { href: "/me/school", label: "School" },
  { href: "/me/bible", label: "Bible" },
  { href: "/me/teams", label: "Teams" },
  { href: "/me/messages", label: "Messages" },
  { href: "/me/assignments", label: "Assignments" },
  { href: "/me/journal", label: "Journal" },
  { href: "/me/profile", label: "Profile" },
];

export function MemberNav({ badges }: { badges: { assignments: number; memory: number; teams: number; messages: number } }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-6 flex gap-1 overflow-x-auto px-6 sm:mx-0 sm:px-0" aria-label="Member area">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const badge =
          item.href === "/me/assignments" ? badges.assignments : item.href === "/me/bible" ? badges.memory : item.href === "/me/teams" ? badges.teams : item.href === "/me/messages" ? badges.messages : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors",
              active ? "text-lamp" : "text-starlight-dim hover:text-starlight"
            )}
          >
            {item.label}
            {badge > 0 && <span className="rounded-full bg-lamp px-1.5 text-xs font-medium text-ink">{badge}</span>}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-lamp" />}
          </Link>
        );
      })}
    </nav>
  );
}
