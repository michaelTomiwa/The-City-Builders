import { formatCount, readingMinutes } from "@/lib/blog";
import type { PostWithStats } from "@/lib/blog";
import { cn } from "@/lib/utils";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const icons = {
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  heart: "M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.4 5c2 0 3.3 1.1 4 2.3h3.2C14.3 6.1 15.6 5 17.6 5 21 5 22.7 8.4 21.2 11.4 19 15.6 12 20 12 20Z",
};

export function MetaIcon({ name }: { name: keyof typeof icons }) {
  return <Icon d={icons[name]} />;
}

/** Reading time, reads, comments and likes — the numbers every post card carries. */
export function PostMeta({ post, className }: { post: PostWithStats; className?: string }) {
  const items = [
    { icon: "clock" as const, label: `${readingMinutes(post.content)} min read` },
    { icon: "eye" as const, label: formatCount(post.views ?? 0, "read", "reads") },
    { icon: "chat" as const, label: formatCount(post.comment_count, "comment", "comments") },
    { icon: "heart" as const, label: formatCount(post.likes ?? 0, "amen", "amens") },
  ];
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-sm text-paper-dim", className)}>
      {items.map((item) => (
        <li key={item.icon} className="inline-flex items-center gap-1.5">
          <MetaIcon name={item.icon} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
