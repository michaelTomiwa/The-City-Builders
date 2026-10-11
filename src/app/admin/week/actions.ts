"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { recentDuplicate } from "@/lib/duplicates";
import { addWeeks, mondayOf } from "@/lib/week";

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

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function weekOf(fd: FormData) {
  const w = text(fd, "week");
  return /^\d{4}-\d{2}-\d{2}$/.test(w) ? mondayOf(w) : mondayOf(new Date(Date.now() + 3600_000).toISOString().slice(0, 10));
}

function done(week: string, note?: string) {
  revalidatePath("/admin/week");
  revalidatePath("/me", "layout");
  redirect(`/admin/week?w=${week}${note ? `&note=${encodeURIComponent(note)}` : ""}`);
}

export async function addWeekItem(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  const title = text(fd, "title").slice(0, 300);
  if (!title) throw new Error("Write the item first.");
  const audience = ["everyone", "team", "selected"].includes(text(fd, "audience")) ? text(fd, "audience") : "everyone";
  if (await recentDuplicate(supabase, "week_items", { title, start_week: week })) done(week);

  const { data: count } = await supabase.from("week_items").select("id").is("owner_id", null).eq("start_week", week);
  const { data: item, error } = await supabase
    .from("week_items")
    .insert({
      title,
      details: text(fd, "details").slice(0, 2000) || null,
      audience,
      team_id: audience === "team" ? text(fd, "team_id") || null : null,
      start_week: week,
      repeats: fd.get("repeats") === "on",
      sort: (count ?? []).length,
    })
    .select("id")
    .single();
  if (error || !item) throw new Error(error?.message ?? "Couldn't add it.");

  if (audience === "selected") {
    let people: string[] = [];
    try {
      people = JSON.parse(text(fd, "members") || "[]");
    } catch {
      people = [];
    }
    if (people.length) await supabase.from("week_item_members").insert(people.map((user_id) => ({ item_id: item.id, user_id })));
  }
  done(week);
}

/** A repeating item stops after the week before this one (it disappears from this week on). */
export async function stopRepeating(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  const { data: item } = await supabase.from("week_items").select("start_week").eq("id", text(fd, "id")).maybeSingle();
  if (item && item.start_week >= week) {
    await supabase.from("week_items").delete().eq("id", text(fd, "id"));
  } else {
    await supabase.from("week_items").update({ end_week: addWeeks(week, -1) }).eq("id", text(fd, "id"));
  }
  done(week, "Stopped. It's off the checklist from this week, and past weeks keep their ticks.");
}

export async function removeWeekItem(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  await supabase.from("week_items").delete().eq("id", text(fd, "id")).is("owner_id", null);
  done(week);
}

/** Copy last week's one-off items into this week (repeating items roll over by themselves). */
export async function copyLastWeek(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  const last = addWeeks(week, -1);
  const [{ data: previous }, { data: existing }] = await Promise.all([
    supabase.from("week_items").select("*").is("owner_id", null).eq("start_week", last).eq("repeats", false).order("sort"),
    supabase.from("week_items").select("title").is("owner_id", null).eq("start_week", week),
  ]);
  const have = new Set((existing ?? []).map((e) => (e.title as string).toLowerCase()));
  let copied = 0;
  for (const p of previous ?? []) {
    if (have.has((p.title as string).toLowerCase())) continue;
    const { data: item } = await supabase
      .from("week_items")
      .insert({ title: p.title, details: p.details, audience: p.audience, team_id: p.team_id, start_week: week, repeats: false, sort: p.sort })
      .select("id")
      .single();
    if (item && p.audience === "selected") {
      const { data: people } = await supabase.from("week_item_members").select("user_id").eq("item_id", p.id);
      if (people?.length) await supabase.from("week_item_members").insert(people.map((x) => ({ item_id: item.id, user_id: x.user_id })));
    }
    copied++;
  }
  done(week, copied ? `Copied ${copied} ${copied === 1 ? "item" : "items"} from last week.` : "Nothing new to copy from last week.");
}
