"use client";

import { useState } from "react";

const ytThumb = /^(https:\/\/i\.ytimg\.com\/vi\/[\w-]{11})\/(?:hq|sd|mq)default\.jpg$/;

/**
 * An image that, for YouTube thumbnails, first tries the sharp widescreen
 * version (no black bars) and falls back to the standard one if the video
 * doesn't have it.
 */
export function CoverImg({ src, className, loading }: { src: string; className?: string; loading?: "lazy" | "eager" }) {
  const match = src.match(ytThumb);
  const [current, setCurrent] = useState(match ? `${match[1]}/maxresdefault.jpg` : src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt=""
      className={className}
      loading={loading}
      onLoad={(e) => {
        // YouTube answers a missing maxres image with a tiny grey placeholder.
        if (match && current !== src && e.currentTarget.naturalWidth < 200) setCurrent(src);
      }}
      onError={() => {
        if (current !== src) setCurrent(src);
      }}
    />
  );
}
