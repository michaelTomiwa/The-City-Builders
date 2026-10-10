"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PostWithStats } from "@/lib/blog";
import { formatPostDate } from "@/lib/blog";
import { CoverArt } from "./cover-art";
import { PostMeta } from "./post-meta";
import { cn } from "@/lib/utils";
import { plainText } from "@/lib/post-text";

const sorts = [
  { id: "new", label: "Newest" },
  { id: "read", label: "Most read" },
  { id: "talked", label: "Most discussed" },
] as const;

type SortId = (typeof sorts)[number]["id"];

/** Search, tag filter and sort over every post below the featured one. */
export function BlogExplorer({ posts, tags }: { posts: PostWithStats[]; tags: string[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortId>("new");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts.filter((p) => {
      if (tag && !(p.tags ?? []).includes(tag)) return false;
      if (!q) return true;
      return [p.title, p.excerpt ?? "", plainText(p.content), ...(p.tags ?? [])].join(" ").toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      if (sort === "read") return (b.views ?? 0) - (a.views ?? 0);
      if (sort === "talked") return b.comment_count - a.comment_count;
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    });
  }, [posts, query, tag, sort]);

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search the blog</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-dim" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="h-11 w-full rounded-sm border border-steel bg-white/60 pl-10 pr-4 text-paper placeholder:text-paper-dim/70 focus:border-gold"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort posts">
          {sorts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                sort === s.id ? "bg-paper text-midnight" : "text-paper-dim hover:text-paper"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
          <button
            type="button"
            onClick={() => setTag(null)}
            aria-pressed={tag === null}
            className={cn(
              "rounded-full border px-3.5 py-1 text-sm transition-colors",
              tag === null ? "border-gold bg-gold/15 text-gold-text" : "border-steel text-paper-dim hover:text-paper"
            )}
          >
            All topics
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? null : t)}
              aria-pressed={tag === t}
              className={cn(
                "rounded-full border px-3.5 py-1 text-sm transition-colors",
                tag === t ? "border-gold bg-gold/15 text-gold-text" : "border-steel text-paper-dim hover:text-paper"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <motion.ul layout className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((post) => (
            <motion.li
              key={post.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/blog/${post.slug}`} className="group block">
                <CoverArt src={post.cover_image_url} title={post.title} className="aspect-[16/10]" />
                {(post.tags ?? []).length > 0 && (
                  <p className="mt-4 text-sm text-gold-text">{(post.tags ?? []).join(", ")}</p>
                )}
                <h3 className="mt-2 font-display text-2xl leading-snug text-paper group-hover:text-gold-text">
                  {post.title}
                </h3>
                {post.excerpt && <p className="mt-2 line-clamp-2 leading-relaxed text-paper-dim">{post.excerpt}</p>}
                <p className="mt-3 text-sm text-paper-dim">{post.published_at && formatPostDate(post.published_at)}</p>
                <PostMeta post={post} className="mt-2" />
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {shown.length === 0 && (
        <p className="mt-10 text-paper-dim">
          No posts match{query && <> &ldquo;{query}&rdquo;</>}
          {tag && <> in {tag}</>}. Try another word or clear the filters.
        </p>
      )}
    </div>
  );
}
