"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { recentDuplicate } from "@/lib/duplicates";
import { sendMessagePush } from "@/lib/push";
import { PASTOR_NAME } from "@/lib/messages";
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

function submitFields(fd: FormData) {
  const submit = ["optional", "required"].includes(text(fd, "submit")) ? text(fd, "submit") : "none";
  return { submit, submit_prompt: submit === "none" ? null : text(fd, "submit_prompt").slice(0, 500) || null };
}

function chosenPeople(fd: FormData) {
  try {
    const people = JSON.parse(text(fd, "members") || "[]");
    return Array.isArray(people) ? people.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
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
      ...submitFields(fd),
    })
    .select("id")
    .single();
  if (error || !item) throw new Error(error?.message ?? "Couldn't add it.");

  if (audience === "selected") {
    const people = chosenPeople(fd);
    if (people.length) await supabase.from("week_item_members").insert(people.map((user_id) => ({ item_id: item.id, user_id })));
  }
  done(week);
}

/** Change an item: wording, who it's for, whether it repeats and whether something must be handed in. Ticks are kept. */
export async function updateWeekItem(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  const id = text(fd, "id");
  const title = text(fd, "title").slice(0, 300);
  if (!title) throw new Error("Write the item first.");
  const audience = ["everyone", "team", "selected"].includes(text(fd, "audience")) ? text(fd, "audience") : "everyone";
  const { data: item } = await supabase.from("week_items").select("start_week, repeats, end_week").eq("id", id).is("owner_id", null).maybeSingle();
  if (!item) done(week, "That item has been removed.");
  const repeats = fd.get("repeats") === "on";
  const { error } = await supabase
    .from("week_items")
    .update({
      title,
      details: text(fd, "details").slice(0, 2000) || null,
      audience,
      team_id: audience === "team" ? text(fd, "team_id") || null : null,
      repeats,
      // Turning repeating off keeps it in the week it started in; turning it on clears any stop.
      end_week: repeats ? null : item!.end_week,
      ...submitFields(fd),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("week_item_members").delete().eq("item_id", id);
  if (audience === "selected") {
    const people = chosenPeople(fd);
    if (people.length) await supabase.from("week_item_members").insert(people.map((user_id) => ({ item_id: id, user_id })));
  }
  done(week, "Saved. Everyone sees the change straight away.");
}

/** The pastor's reply to what someone handed in. It shows under their item and goes to their phone. */
export async function reviewHandIn(fd: FormData) {
  const { supabase } = await staff();
  const week = weekOf(fd);
  const itemId = text(fd, "item_id");
  const userId = text(fd, "user_id");
  const feedback = text(fd, "feedback").slice(0, 4000) || null;
  const { error } = await supabase
    .from("week_ticks")
    .update({ feedback, reviewed_at: new Date().toISOString() })
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .eq("week_start", week);
  if (error) throw new Error(error.message);
  if (feedback) {
    const { data: item } = await supabase.from("week_items").select("title").eq("id", itemId).maybeSingle();
    after(() =>
      sendMessagePush([userId], () => ({ title: `${PASTOR_NAME} replied`, body: `On "${item?.title ?? "your hand-in"}": ${feedback.length > 120 ? `${feedback.slice(0, 117)}…` : feedback}`, url: "/me/week" }), `handin-${itemId}`)
    );
  }
  revalidatePath("/me", "layout");
  revalidatePath(`/admin/week/${itemId}`);
  redirect(`/admin/week/${itemId}?w=${week}&note=${encodeURIComponent(feedback ? "Reply sent." : "Marked as seen.")}#p-${userId}`);
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
      .insert({ title: p.title, details: p.details, audience: p.audience, team_id: p.team_id, start_week: week, repeats: false, sort: p.sort, submit: p.submit, submit_prompt: p.submit_prompt })
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
