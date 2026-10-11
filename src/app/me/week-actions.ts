"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { recentDuplicate } from "@/lib/duplicates";
import { thisWeek } from "@/lib/week";

async function member() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");
  return { supabase, user };
}

/** Tick (or untick) one item for this week, with an optional note. Only this week can be ticked. */
export async function tickWeekItem(itemId: string, done: boolean, note?: string) {
  const { supabase, user } = await member();
  const week = thisWeek();
  if (done) {
    const { error } = await supabase
      .from("week_ticks")
      .upsert({ item_id: itemId, user_id: user.id, week_start: week, note: note?.trim().slice(0, 500) || null }, { onConflict: "item_id,user_id,week_start" });
    if (error) return { error: "That didn't save. Try again." };
  } else {
    const { error } = await supabase.from("week_ticks").delete().eq("item_id", itemId).eq("user_id", user.id).eq("week_start", week);
    if (error) return { error: "That didn't save. Try again." };
  }
  revalidatePath("/me", "layout");
  return { ok: true };
}

/** Add a private item to my own week. */
export async function addMyWeekItem(fd: FormData) {
  const { supabase, user } = await member();
  const title = String(fd.get("title") ?? "").trim().slice(0, 300);
  if (title && !(await recentDuplicate(supabase, "week_items", { owner_id: user.id, title }))) {
    await supabase.from("week_items").insert({ title, owner_id: user.id, audience: "everyone", start_week: thisWeek(), repeats: false });
  }
  revalidatePath("/me", "layout");
}

export async function removeMyWeekItem(fd: FormData) {
  const { supabase, user } = await member();
  await supabase.from("week_items").delete().eq("id", String(fd.get("id"))).eq("owner_id", user.id);
  revalidatePath("/me", "layout");
}
