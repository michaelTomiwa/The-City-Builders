"use client";

import { motion } from "framer-motion";

const CHANNEL_ID = "UCfzlRhIdzvmFSpc6sx4NyMg";
const CHANNEL_URL = "https://www.youtube.com/@thecitybuilderscity/streams";
const LATEST_VIDEO_ID = "xWma4QfQSms";

export function LiveStream() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <motion.span
          className="h-2 w-2 rounded-full bg-violet"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="text-sm text-paper-dim">
          Live automatically when we&apos;re streaming
        </p>
      </div>
      <div className="mt-5 aspect-video w-full overflow-hidden rounded-sm border border-steel">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}`}
          title="The City Builders — live"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="mt-3 text-sm text-paper-dim">
        Nothing playing above? We&apos;re not live right now —{" "}
        <a
          href={`https://www.youtube.com/watch?v=${LATEST_VIDEO_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-text hover:text-ink"
        >
          watch our last broadcast
        </a>{" "}
        or see the{" "}
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-text hover:text-ink"
        >
          full schedule
        </a>
        .
      </p>
    </div>
  );
}
