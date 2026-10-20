"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { pushConfigured, sendAlert } from "@/lib/push";
import { mondayOf, thisWeek } from "@/lib/week";
import { dayShort, fastDaysLabel } from "@/lib/instruction";

async function staff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "member") throw new Error("Your account isn't approved to make changes yet.");
  return { supabase };
}

function text(fd: FormData, key: string, max: number) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

function weekOf(fd: FormData) {
  const w = text(fd, "week", 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(w) ? mondayOf(w) : thisWeek();
}

function done(week: string, note: string) {
  revalidatePath("/admin/instruction");
  revalidatePath("/week");
  revalidatePath("/me", "layout");
  redirect(`/admin/instruction?w=${week}&note=${encodeURIComponent(note)}`);
}

export async function saveInstruction(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  const publish = fd.get("intent") === "publish";
  const theme = text(fd, "theme", 200);
  if (!theme) throw new Error("Give the week a theme first.");

  const fields = {
    theme,
    word: text(fd, "word", 5000) || null,
    fast_days: [...new Set(fd.getAll("fast_days").map(Number))].filter((d) => d >= 1 && d <= 7).sort(),
    fast_plan: text(fd, "fast_plan", 500) || null,
    prayer_points: text(fd, "prayer_points", 8000)
      .split("\n")
      .map((p) => p.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim().slice(0, 400))
      .filter(Boolean)
      .slice(0, 20),
    prayer_plan: text(fd, "prayer_plan", 500) || null,
    readings: [1, 2, 3, 4, 5, 6, 7].map((d) => text(fd, `reading_${d}`, 120)),
    memory_verse: text(fd, "memory_verse", 500) || null,
    question: text(fd, "question", 500) || null,
  };

  const { data: before } = await supabase.from("week_instructions").select("status").eq("week_start", week).maybeSingle();
  const wasPublished = before?.status === "published";
  const status = publish || wasPublished ? "published" : "draft";
  const { error } = await supabase.from("week_instructions").upsert({
    week_start: week,
    ...fields,
    status,
    ...(publish && !wasPublished ? { published_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  let added = 0;
  if (status === "published" && fd.get("checklist") === "on") {
    added = await addToChecklist(supabase, week, fields);
  }
  if (publish && !wasPublished && fd.get("notify") === "on" && pushConfigured()) {
    after(() => sendAlert({ key: `instruction-${week}`, title: "This week's instruction is out", body: `${theme}. Fasting, prayer and study for the week.`, url: "/week" }).catch(() => null));
  }

  const extra = added ? ` ${added} ${added === 1 ? "item" : "items"} added to everyone's This Week checklist.` : "";
  done(week, status === "draft" ? "Saved as a draft. Only you can see it." : wasPublished ? `Updated.${extra}` : `Published to everyone.${extra}`);
}

/** Turns the instruction into This Week items for everyone (skipping ones already there). */
async function addToChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  week: string,
  f: { fast_days: number[]; fast_plan: string | null; prayer_points: string[]; prayer_plan: string | null; readings: string[]; memory_verse: string | null }
) {
  const items: { title: string; details: string | null; submit?: string; submit_prompt?: string }[] = [];
  if (f.fast_days.length) items.push({ title: `Fast on ${fastDaysLabel(f.fast_days)}`, details: f.fast_plan });
  if (f.prayer_points.length || f.prayer_plan) items.push({ title: "Pray through this week's prayer points", details: f.prayer_plan });
  const reads = f.readings.map((r, i) => (r ? `${dayShort[i]}: ${r}` : "")).filter(Boolean);
  if (reads.length) items.push({ title: "Read this week's passages", details: reads.join(" · "), submit: "optional", submit_prompt: "Share what stood out to you" });
  if (f.memory_verse) items.push({ title: "Learn the memory verse", details: f.memory_verse.split("\n")[0].slice(0, 200) });
  if (!items.length) return 0;

  const { data: existing } = await supabase.from("week_items").select("title").is("owner_id", null).eq("start_week", week);
  const have = new Set((existing ?? []).map((e) => (e.title as string).toLowerCase()));
  const fresh = items.filter((i) => !have.has(i.title.toLowerCase()));
  if (!fresh.length) return 0;
  const start = (existing ?? []).length;
  await supabase.from("week_items").insert(fresh.map((i, n) => ({ ...i, audience: "everyone", start_week: week, repeats: false, sort: start + n })));
  return fresh.length;
}

export async function unpublishInstruction(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  await supabase.from("week_instructions").update({ status: "draft", updated_at: new Date().toISOString() }).eq("week_start", week);
  done(week, "Taken down. It's a draft again, and only you can see it.");
}

export async function deleteInstruction(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  await supabase.from("week_instructions").delete().eq("week_start", week);
  done(week, "Deleted.");
}
