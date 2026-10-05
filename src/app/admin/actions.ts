"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function savePost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string).trim();
  const excerpt = (formData.get("excerpt") as string).trim() || null;
  const content = formData.get("content") as string;
  const coverImageUrl = (formData.get("cover_image_url") as string).trim() || null;
  const published = formData.get("published") === "on";
  let slug = (formData.get("slug") as string).trim();
  if (!slug) slug = slugify(title);

  const payload = {
    title,
    slug,
    excerpt,
    content,
    cover_image_url: coverImageUrl,
    published,
    published_at: published ? new Date().toISOString() : null,
    author_id: user.id,
  };

  if (id) {
    const { error } = await supabase.from("posts").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("posts").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/blog");
  redirect("/admin");
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/blog");
}

export async function savePage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string).trim();
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";
  const navLabel = (formData.get("nav_label") as string).trim() || null;
  const navOrder = Number(formData.get("nav_order") as string) || 0;
  let slug = (formData.get("slug") as string).trim();
  if (!slug) slug = slugify(title);

  const payload = {
    title,
    slug,
    content,
    published,
    nav_label: navLabel,
    nav_order: navOrder,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("pages").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("pages").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/pages");
  revalidatePath("/p/[slug]", "page");
  revalidatePath("/");
  redirect("/admin/pages");
}

export async function deletePage(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pages");
  revalidatePath("/");
}
