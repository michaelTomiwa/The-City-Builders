"use server";

import { supabase } from "@/lib/supabase";

export type FormState = { ok: boolean; message: string } | null;

function field(form: FormData, name: string, max: number) {
  const value = String(form.get(name) ?? "").trim();
  return value.slice(0, max);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendInquiry(_prev: FormState, form: FormData): Promise<FormState> {
  // Honeypot: real people never see or fill this field.
  if (field(form, "company_website", 200)) return { ok: true, message: "Thanks! We'll be in touch." };

  const name = field(form, "name", 120);
  const email = field(form, "email", 200);
  const message = field(form, "message", 5000);
  if (!name || !EMAIL.test(email) || message.length < 10) {
    return { ok: false, message: "Please add your name, a valid email and a few words about the project." };
  }
  if (!supabase) return { ok: false, message: "The form isn't connected yet. Please email us directly." };

  const { error } = await supabase.from("inquiries").insert({
    name,
    email,
    message,
    script_type: field(form, "script_type", 80) || null,
    budget: field(form, "budget", 80) || null,
  });
  if (error) return { ok: false, message: "Something went wrong sending that. Please try again or email us." };
  return { ok: true, message: `Thanks, ${name.split(" ")[0]}! Your brief is in. We reply within 48 hours.` };
}

export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  if (field(form, "company_website", 200)) return { ok: true, message: "Thank you for the review!" };

  const name = field(form, "name", 120);
  const quote = field(form, "quote", 1500);
  const rating = Math.min(5, Math.max(1, Number(form.get("rating")) || 5));
  if (!name || quote.length < 10) {
    return { ok: false, message: "Please add your name and at least a sentence about working with us." };
  }
  if (!supabase) return { ok: false, message: "Reviews aren't connected yet. Please email us instead." };

  const { error } = await supabase.from("reviews").insert({
    name,
    quote,
    rating,
    role: field(form, "role", 120) || null,
    project: field(form, "project", 160) || null,
  });
  if (error) return { ok: false, message: "Something went wrong saving that. Please try again." };
  return { ok: true, message: "Thank you! Your review will appear once it's approved." };
}
