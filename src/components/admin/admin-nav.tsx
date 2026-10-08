"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/report", label: "Weekly report" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/posts", label: "Blog posts" },
      { href: "/admin/sermons", label: "Sermons" },
      { href: "/admin/events", label: "Events" },
      { href: "/admin/pages", label: "Pages" },
    ],
  },
  {
    label: "Discipleship",
    items: [
      { href: "/admin/members", label: "Members", badge: "members" as const },
      { href: "/admin/programs", label: "Programmes" },
      { href: "/admin/school", label: "School" },
      { href: "/admin/assignments", label: "Assignments", badge: "submissions" as const },
      { href: "/admin/partners", label: "Prayer partners" },
      { href: "/admin/testimonies", label: "Testimonies", badge: "testimonies" as const },
      { href: "/admin/notices", label: "Word to members" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/comments", label: "Comments", badge: "comments" as const },
      { href: "/admin/prayers", label: "Prayer requests", badge: "prayers" as const },
      { href: "/admin/subscribers", label: "Subscribers" },
      { href: "/admin/alerts", label: "Live alerts" },
    ],
  },
  {
    label: "Site",
    items: [{ href: "/admin/settings", label: "Settings" }],
  },
];

export function AdminNav({
  counts,
}: {
  counts: { comments: number; prayers: number; members: number; submissions: number; testimonies: number };
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-6 lg:overflow-visible lg:pb-0" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.label} className="flex gap-1 lg:block">
          <p className="hidden px-2 pb-1 text-xs text-starlight-dim/70 lg:block">{group.label}</p>
          {group.items.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badge = "badge" in item && item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded px-3 py-2 text-sm transition-colors",
                  active ? "bg-night-2 text-lamp" : "text-starlight-dim hover:bg-night-2/60 hover:text-starlight"
                )}
              >
                {item.label}
                {badge > 0 && (
                  <span className="rounded-full bg-lamp px-2 py-0.5 text-xs font-medium text-ink">{badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
