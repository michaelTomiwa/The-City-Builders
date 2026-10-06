"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CHURCH_EMAIL } from "@/lib/schedule";

const reasons = [
  "A question for the team",
  "Prayer or counsel",
  "I'm new and want to get involved",
  "Invite Pastor Michael to minister",
  "Partnership and giving",
  "Media or technical help",
];

/** Writes the message into the visitor's own email app, addressed to the church inbox. */
export function ContactForm() {
  const [name, setName] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const subject = `${reason}${name.trim() ? ` from ${name.trim()}` : ""}`;
    const body = `${message.trim()}\n\n${name.trim() ? `— ${name.trim()}` : ""}`;
    window.location.href = `mailto:${CHURCH_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm text-paper-dim">
            Your name
          </label>
          <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="contact-reason" className="text-sm text-paper-dim">
            What it&apos;s about
          </label>
          <select
            id="contact-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-sm border border-steel bg-dusk px-3 text-paper focus:border-gold"
          >
            {reasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className="text-sm text-paper-dim">
          Message
        </label>
        <Textarea
          id="contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit">Write the email</Button>
        <p className="text-sm text-paper-dim">Opens your email app with the message ready to send.</p>
      </div>
      {opened && (
        <p className="border-l-2 border-gold pl-4 text-sm text-paper-dim" role="status">
          If your email app didn&apos;t open, copy your message and send it to{" "}
          <a href={`mailto:${CHURCH_EMAIL}`} className="text-gold-text underline underline-offset-4">
            {CHURCH_EMAIL}
          </a>
          .
        </p>
      )}
    </form>
  );
}
