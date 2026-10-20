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
    if (error) return { error: error.message.includes("handed in") ? error.message : "That didn't save. Try again." };
  } else {
    const { error } = await supabase.from("week_ticks").delete().eq("item_id", itemId).eq("user_id", user.id).eq("week_start", week);
    if (error) return { error: "That didn't save. Try again." };
  }
  revalidatePath("/me", "layout");
  return { ok: true };
}

/** Hand in a write-up and/or a file for one of this week's items (this ticks it too). */
export async function handInWeekItem(itemId: string, input: { body: string; filePath: string | null; fileName: string | null }) {
  const { supabase, user } = await member();
  const body = input.body.trim().slice(0, 20000);
  const filePath = input.filePath && input.filePath.startsWith(`${user.id}/`) ? input.filePath.slice(0, 300) : null;
  if (!body && !filePath) return { error: "Write something or attach a file first." };
  const { error } = await supabase.from("week_ticks").upsert(
    { item_id: itemId, user_id: user.id, week_start: thisWeek(), body: body || null, file_path: filePath, file_name: filePath ? (input.fileName ?? "File").slice(0, 200) : null },
    { onConflict: "item_id,user_id,week_start" }
  );
  if (error) return { error: error.message.includes("handed in") ? error.message : "That didn't save. Try again." };
  revalidatePath("/me", "layout");
  revalidatePath("/admin/week", "layout");
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
