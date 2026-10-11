"use client";

import { useActionState, useState } from "react";
import { Loader2, Send, Star } from "lucide-react";
import { sendInquiry, submitReview, type FormState } from "@/app/actions";
import { scriptTypes } from "@/content/site";

const input =
  "w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-white placeholder:text-white/40 outline-none transition focus:border-purple-hot focus:bg-white/10 focus:ring-4 focus:ring-purple-hot/20";

function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this empty
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function Status({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p
      role="status"
      className={`rounded-2xl px-5 py-4 text-sm font-medium ${
        state.ok ? "bg-blue-hot/15 text-blue-hot" : "bg-red-500/15 text-red-300"
      }`}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-purple to-blue px-8 py-4 text-lg font-bold text-white shadow-[0_10px_40px_-10px_var(--purple-hot)] transition hover:scale-[1.02] disabled:opacity-60 sm:w-auto"
    >
      {pending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
      {pending ? "Sending…" : label}
    </button>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(sendInquiry, null);
  if (state?.ok) return <Status state={state} />;
  return (
    <form action={action} className="relative grid gap-4 sm:grid-cols-2">
      <Honeypot />
      <label className="sr-only" htmlFor="c-name">Name</label>
      <input id="c-name" name="name" required maxLength={120} placeholder="Your name" className={input} />
      <label className="sr-only" htmlFor="c-email">Email</label>
      <input id="c-email" name="email" type="email" required maxLength={200} placeholder="Email address" className={input} />
      <label className="sr-only" htmlFor="c-type">Script type</label>
      <select id="c-type" name="script_type" defaultValue="" className={`${input} appearance-none`}>
        <option value="" className="bg-stage">What are we writing?</option>
        {scriptTypes.map((t) => (
          <option key={t.title} value={t.title} className="bg-stage">{t.title}</option>
        ))}
        <option value="Not sure yet" className="bg-stage">Not sure yet</option>
      </select>
      <label className="sr-only" htmlFor="c-budget">Budget</label>
      <select id="c-budget" name="budget" defaultValue="" className={`${input} appearance-none`}>
        <option value="" className="bg-stage">Budget (optional)</option>
        <option className="bg-stage">Under $500</option>
        <option className="bg-stage">$500 – $2,000</option>
        <option className="bg-stage">$2,000 – $10,000</option>
        <option className="bg-stage">$10,000+</option>
        <option className="bg-stage">Let&apos;s talk</option>
      </select>
      <label className="sr-only" htmlFor="c-message">Project details</label>
      <textarea
        id="c-message"
        name="message"
        required
        minLength={10}
        maxLength={5000}
        rows={5}
        placeholder="Tell us the idea, the audience and your deadline…"
        className={`${input} resize-none sm:col-span-2`}
      />
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
        <SubmitButton pending={pending} label="Send the brief" />
        <Status state={state} />
      </div>
    </form>
  );
}

export function ReviewForm() {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(5);
  if (state?.ok) return <Status state={state} />;
  return (
    <form action={action} className="relative grid gap-4 sm:grid-cols-2">
      <Honeypot />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1 sm:col-span-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="p-1 transition hover:scale-110"
          >
            <Star size={28} className={n <= rating ? "fill-blue-hot text-blue-hot" : "text-white/25"} />
          </button>
        ))}
      </div>
      <input name="name" required maxLength={120} placeholder="Your name" aria-label="Your name" className={input} />
      <input name="role" maxLength={120} placeholder="Your role (e.g. Producer)" aria-label="Your role" className={input} />
      <input
        name="project"
        maxLength={160}
        placeholder="Project we worked on"
        aria-label="Project"
        className={`${input} sm:col-span-2`}
      />
      <textarea
        name="quote"
        required
        minLength={10}
        maxLength={1500}
        rows={4}
        placeholder="How was it working with us?"
        aria-label="Your review"
        className={`${input} resize-none sm:col-span-2`}
      />
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
        <SubmitButton pending={pending} label="Submit review" />
        <Status state={state} />
      </div>
    </form>
  );
}
