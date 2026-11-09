"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { parseSermonReply, sermonPrompt, videoIdFrom } from "@/lib/sermon-post";

type Video = { id: string; title: string; publishedAt: string; thumbnail: string };

const box = "w-full rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold";

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section className="rounded-md border border-steel bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display", done ? "bg-[#3d9a6a] text-white" : "bg-night text-starlight")}>
          {done ? "✓" : n}
        </span>
        <h2 className="font-display text-2xl text-paper">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Three steps: pick the message, copy the prompt into Claude, paste Claude's reply back as a draft post. */
export function SermonToPost({ videos, action }: { videos: Video[]; action: (fd: FormData) => void }) {
  const [picked, setPicked] = useState<string>(videos[0]?.id ?? "");
  const [link, setLink] = useState("");
  const [transcript, setTranscript] = useState("");
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const videoId = (link && videoIdFrom(link)) || picked;
  const video = videos.find((v) => v.id === videoId);
  const draft = useMemo(() => parseSermonReply(reply), [reply]);
  const words = draft.body ? draft.body.split(/\s+/).filter(Boolean).length : 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(sermonPrompt + (transcript.trim() ? transcript.trim() : "\n(paste the transcript here)"));
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form action={action} onSubmit={() => setSending(true)} className="space-y-6">
      <input type="hidden" name="video" value={videoId ?? ""} />
      <input type="hidden" name="video_title" value={video?.title ?? ""} />

      <Step n={1} title="Pick the message" done={Boolean(videoId)}>
        {videos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {videos.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setPicked(v.id);
                  setLink("");
                }}
                className={cn("overflow-hidden rounded-md border-2 text-left transition-colors", videoId === v.id ? "border-gold" : "border-transparent hover:border-steel")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" className="aspect-video w-full object-cover" />
                <span className="block p-2">
                  <span className="line-clamp-2 text-xs font-medium text-paper">{v.title}</span>
                  <span className="text-[11px] text-paper-dim">{new Date(v.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Africa/Lagos" })}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <label className="mt-4 block text-sm text-paper-dim">
          {videos.length ? "Or paste a YouTube link" : "Paste the YouTube link"}
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className={cn(box, "mt-1 h-10")} />
        </label>
        {link && !videoIdFrom(link) && <p className="mt-1 text-xs text-[#8a2f1e]">That doesn&apos;t look like a YouTube link.</p>}
        {videoId && (
          <div className="mt-4 rounded-sm bg-dusk p-4 text-sm text-paper">
            <p className="font-medium">Get the transcript (about a minute)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-paper-dim">
              <li>
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="font-medium text-gold-text hover:underline">
                  Open the video on YouTube ↗
                </a>{" "}
                on a computer.
              </li>
              <li>Under the video, click <strong>…more</strong>, then <strong>Show transcript</strong>.</li>
              <li>In the transcript panel, click <strong>⋮</strong> → <strong>Toggle timestamps</strong> to hide the times.</li>
              <li>Select all the text in the panel and copy it.</li>
            </ol>
            <p className="mt-2 text-xs text-paper-dim">Captions usually appear a few hours after a live stream ends.</p>
          </div>
        )}
      </Step>

      <Step n={2} title="Ask Claude to write it" done={copied}>
        <label className="block text-sm text-paper-dim">
          Paste the transcript here (optional: you can also paste it straight into Claude)
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={5} placeholder="Paste the transcript…" className={cn(box, "mt-1")} />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={copy} className="h-10 rounded-sm bg-night px-5 text-sm font-medium text-starlight hover:bg-night-2">
            {copied ? "✓ Copied! Now paste it into Claude" : transcript.trim() ? "Copy prompt + transcript" : "Copy the prompt"}
          </button>
          <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gold-text hover:underline">
            Open Claude ↗
          </a>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-paper-dim hover:text-paper">See the prompt</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-sm bg-dusk p-3 text-xs text-paper">{sermonPrompt}</pre>
        </details>
      </Step>

      <Step n={3} title="Paste Claude's reply" done={Boolean(draft.body)}>
        <textarea
          name="reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={10}
          placeholder={"Copy Claude's whole reply (TITLE, SUMMARY, TAGS, POST, PLEASE CHECK) and paste it here."}
          className={box}
        />
        {draft.body && (
          <div className="mt-4 rounded-sm border border-[#bfe0c8] bg-[#f4faf5] p-4 text-sm">
            <p className="text-xs font-medium text-[#24613a]">Here&apos;s what will go into the draft</p>
            <p className="mt-2 font-display text-xl text-paper">{draft.title || video?.title || "(no title found: you can add one in the editor)"}</p>
            {draft.summary && <p className="mt-1 text-paper-dim">{draft.summary}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {draft.tags.map((t) => (
                <span key={t} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-paper">
                  {t}
                </span>
              ))}
              <span className="text-xs text-paper-dim">· about {words.toLocaleString()} words</span>
            </div>
            {draft.check.length > 0 && <p className="mt-2 text-xs text-[#8a2f1e]">{draft.check.length} things to check (shown in the editor)</p>}
          </div>
        )}
        <button
          disabled={!draft.body || sending}
          className="mt-4 h-11 w-full rounded-sm bg-gold text-sm font-medium text-ink hover:bg-gold-soft disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {sending ? "Making the draft…" : "Make a draft post"}
        </button>
        <p className="mt-2 text-xs text-paper-dim">It opens in the editor as a draft. Nothing is public until you choose Publish.</p>
      </Step>
    </form>
  );
}
