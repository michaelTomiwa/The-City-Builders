"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function PrayerForm() {
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!request.trim()) return;
    setStatus("submitting");

    const { error } = await supabase.from("prayer_requests").insert({
      name: name.trim() || null,
      request: request.trim(),
      is_public: isPublic,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("done");
    setName("");
    setRequest("");
  }

  if (status === "done") {
    return (
      <div className="border-l-2 border-gold pl-6">
        <p className="font-display text-xl text-paper">Received.</p>
        <p className="mt-2 text-paper-dim">
          Your request is with us now — we&apos;re praying.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-gold-text hover:text-ink"
        >
          Share another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="text-sm text-paper-dim">
          Name (optional)
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Who should we remember?"
          className="mt-2"
        />
      </div>

      <div>
        <label htmlFor="request" className="text-sm text-paper-dim">
          What&apos;s on your heart?
        </label>
        <Textarea
          id="request"
          required
          rows={4}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="Share as much or as little as you'd like."
          className="mt-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-paper-dim">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        Share on the public prayer wall
      </label>

      {status === "error" && (
        <p className="text-sm text-violet">
          Something went wrong — please try again in a moment.
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send to the wall"}
      </Button>
    </form>
  );
}
