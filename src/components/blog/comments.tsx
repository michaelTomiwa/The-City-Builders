"use client";

import { useState } from "react";
import { supabase, type PostComment } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Approved comments, and a form whose comments wait for an admin to approve them. */
export function Comments({ postId, comments }: { postId: string; comments: PostComment[] }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    setStatus("sending");
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, name: name.trim(), body: body.trim() });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setBody("");
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-14">
      <h2 id="comments-heading" className="font-display text-3xl text-paper">
        {comments.length === 0 ? "Comments" : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-3 text-paper-dim">No comments yet. Share what this stirred in you.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {comments.map((c) => (
            <li key={c.id} className="grid grid-cols-[2.75rem_1fr] gap-4">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-night font-display text-lg text-lamp"
              >
                {c.name.trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-paper">
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-sm text-paper-dim">{timeAgo(c.created_at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-line leading-relaxed text-paper-dim">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 bg-dusk/70 p-6 sm:p-8">
        <h3 className="font-display text-2xl text-paper">Leave a comment</h3>
        {status === "sent" ? (
          <div className="mt-4 border-l-2 border-gold pl-4" role="status">
            <p className="text-paper">Thank you. Your comment will appear once the team approves it.</p>
            <button type="button" onClick={() => setStatus("idle")} className="mt-2 text-sm text-gold-text underline underline-offset-4">
              Write another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="comment-name" className="text-sm text-paper-dim">
                Your name
              </label>
              <Input
                id="comment-name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1.5 bg-midnight"
              />
            </div>
            <div>
              <label htmlFor="comment-body" className="text-sm text-paper-dim">
                Comment
              </label>
              <Textarea
                id="comment-body"
                required
                maxLength={2000}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1.5 bg-midnight"
              />
            </div>
            {status === "error" && (
              <p className="text-sm text-violet" role="alert">
                Your comment didn&apos;t send. Try again in a moment.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Posting" : "Post comment"}
              </Button>
              <p className="text-sm text-paper-dim">Comments are reviewed before they appear.</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
