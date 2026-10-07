"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { sendAlert } from "@/lib/push";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function text(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  return text(formData, key) || null;
}

/** Every admin action runs as a signed-in admin or author; RLS enforces the same on the database. */
async function staff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "member") {
    throw new Error("Your account isn't approved to make changes yet.");
  }
  return { supabase, user };
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Converts a datetime-local value entered in Lagos time to an ISO timestamp. */
function lagosToIso(value: string | null) {
  if (!value) return null;
  return new Date(`${value}:00+01:00`).toISOString();
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// Posts --------------------------------------------------------------------

export async function savePost(formData: FormData) {
  const { supabase, user } = await staff();

  const id = optional(formData, "id");
  const title = text(formData, "title");
  const status = text(formData, "status"); // draft | publish | schedule
  const scheduledFor = lagosToIso(optional(formData, "publish_at"));
  const existingPublishedAt = optional(formData, "existing_published_at");
  const tags = text(formData, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t, i, all) => all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i);

  let publishedAt: string | null = null;
  if (status === "publish") publishedAt = existingPublishedAt ?? new Date().toISOString();
  if (status === "schedule") publishedAt = scheduledFor ?? new Date().toISOString();

  const payload = {
    title,
    slug: text(formData, "slug") || slugify(title),
    excerpt: optional(formData, "excerpt"),
    content: (formData.get("content") as string) ?? "",
    cover_image_url: optional(formData, "cover_image_url"),
    published: status !== "draft",
    published_at: publishedAt,
    featured: formData.get("featured") === "on",
    tags,
    updated_at: new Date().toISOString(),
  };

  if (payload.featured) {
    // only one featured post at a time
    check((await supabase.from("posts").update({ featured: false }).eq("featured", true)).error);
  }

  if (id) {
    check((await supabase.from("posts").update(payload).eq("id", id)).error);
  } else {
    check((await supabase.from("posts").insert({ ...payload, author_id: user.id })).error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/blog", "layout");
  revalidatePath("/");
  redirect(`/admin/posts?saved=${encodeURIComponent(title)}`);
}

export async function togglePublish(formData: FormData) {
  const { supabase } = await staff();
  const id = text(formData, "id");
  const publish = text(formData, "publish") === "true";
  check(
    (
      await supabase
        .from("posts")
        .update({ published: publish, published_at: publish ? new Date().toISOString() : null })
        .eq("id", id)
    ).error
  );
  revalidatePath("/admin", "layout");
  revalidatePath("/blog", "layout");
  revalidatePath("/");
}

export async function toggleFeatured(formData: FormData) {
  const { supabase } = await staff();
  const id = text(formData, "id");
  const feature = text(formData, "feature") === "true";
  if (feature) check((await supabase.from("posts").update({ featured: false }).eq("featured", true)).error);
  check((await supabase.from("posts").update({ featured: feature }).eq("id", id)).error);
  revalidatePath("/admin", "layout");
  revalidatePath("/blog", "layout");
}

export async function duplicatePost(formData: FormData) {
  const { supabase, user } = await staff();
  const id = text(formData, "id");
  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single();
  check(error);
  const copy = {
    title: `${post.title} (copy)`,
    slug: `${post.slug}-copy-${Date.now().toString(36)}`,
    excerpt: post.excerpt,
    content: post.content,
    cover_image_url: post.cover_image_url,
    tags: post.tags ?? [],
    published: false,
    published_at: null,
    featured: false,
    author_id: user.id,
  };
  const { data: created, error: insertError } = await supabase.from("posts").insert(copy).select("id").single();
  check(insertError);
  revalidatePath("/admin", "layout");
  redirect(`/admin/posts/${created!.id}/edit`);
}

export async function deletePost(formData: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("posts").delete().eq("id", text(formData, "id"))).error);
  revalidatePath("/admin", "layout");
  revalidatePath("/blog", "layout");
  revalidatePath("/");
}

// Comments -----------------------------------------------------------------

export async function moderateComment(formData: FormData) {
  const { supabase } = await staff();
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (action === "delete") {
    check((await supabase.from("post_comments").delete().eq("id", id)).error);
  } else {
    check((await supabase.from("post_comments").update({ approved: action === "approve" }).eq("id", id)).error);
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/blog", "layout");
}

export async function approveAllComments() {
  const { supabase } = await staff();
  check((await supabase.from("post_comments").update({ approved: true }).eq("approved", false)).error);
  revalidatePath("/admin", "layout");
  revalidatePath("/blog", "layout");
}

// Prayer requests -------------------------------------------------------------

export async function updatePrayer(formData: FormData) {
  const { supabase } = await staff();
  const id = text(formData, "id");
  const action = text(formData, "action");
  if (action === "delete") {
    check((await supabase.from("prayer_requests").delete().eq("id", id)).error);
  } else if (action === "hide" || action === "show") {
    check((await supabase.from("prayer_requests").update({ is_public: action === "show" }).eq("id", id)).error);
  } else if (action === "new" || action === "prayed" || action === "answered") {
    check((await supabase.from("prayer_requests").update({ status: action }).eq("id", id)).error);
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/prayer");
}

// Sermons ---------------------------------------------------------------------

function youtubeId(input: string) {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export async function saveSermon(formData: FormData) {
  const { supabase } = await staff();
  const id = optional(formData, "id");
  const title = text(formData, "title");
  const link = text(formData, "youtube_url");
  const videoId = link ? youtubeId(link) : null;
  if (link && !videoId) throw new Error("That doesn't look like a YouTube link. Paste the full video URL.");

  const payload = {
    title,
    slug: text(formData, "slug") || slugify(title),
    speaker: text(formData, "speaker") || "Pastor Michael Tomiwa",
    series_id: optional(formData, "series_id"),
    youtube_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
    youtube_video_id: videoId,
    thumbnail_url: optional(formData, "thumbnail_url") ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null),
    description: optional(formData, "description"),
    streamed_at: lagosToIso(optional(formData, "streamed_at")) ?? new Date().toISOString(),
  };

  if (id) check((await supabase.from("sermons").update(payload).eq("id", id)).error);
  else check((await supabase.from("sermons").insert(payload)).error);

  revalidatePath("/admin", "layout");
  revalidatePath("/sermons", "layout");
  revalidatePath("/");
  redirect("/admin/sermons");
}

export async function deleteSermon(formData: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("sermons").delete().eq("id", text(formData, "id"))).error);
  revalidatePath("/admin", "layout");
  revalidatePath("/sermons", "layout");
  revalidatePath("/");
}

// Events ----------------------------------------------------------------------

export async function saveEvent(formData: FormData) {
  const { supabase } = await staff();
  const id = optional(formData, "id");
  const title = text(formData, "title");
  const startsAt = lagosToIso(optional(formData, "starts_at"));
  if (!startsAt) throw new Error("Choose when the gathering starts.");

  const payload = {
    title,
    slug: text(formData, "slug") || `${slugify(title)}-${startsAt.slice(0, 10)}`,
    description: optional(formData, "description"),
    location: optional(formData, "location"),
    starts_at: startsAt,
    ends_at: lagosToIso(optional(formData, "ends_at")),
    cover_image_url: optional(formData, "cover_image_url"),
  };

  if (id) check((await supabase.from("events").update(payload).eq("id", id)).error);
  else check((await supabase.from("events").insert(payload)).error);

  revalidatePath("/admin", "layout");
  revalidatePath("/events");
  revalidatePath("/");
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("events").delete().eq("id", text(formData, "id"))).error);
  revalidatePath("/admin", "layout");
  revalidatePath("/events");
  revalidatePath("/");
}

// Settings, giving links, subscribers ---------------------------------------------

export async function saveAnnouncement(formData: FormData) {
  const { supabase } = await staff();
  check(
    (
      await supabase
        .from("site_settings")
        .update({
          announcement: optional(formData, "announcement"),
          announcement_link: optional(formData, "announcement_link"),
          announcement_active: formData.get("announcement_active") === "on",
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
    ).error
  );
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=announcement");
}

export async function saveGivingLink(formData: FormData) {
  const { supabase } = await staff();
  const id = optional(formData, "id");
  const payload = {
    label: text(formData, "label"),
    url: text(formData, "url"),
    is_active: formData.get("is_active") === "on",
  };
  if (!/^https?:\/\//.test(payload.url)) throw new Error("Giving links must start with https://");
  if (id) check((await supabase.from("giving_links").update(payload).eq("id", id)).error);
  else check((await supabase.from("giving_links").insert(payload)).error);
  revalidatePath("/give");
  revalidatePath("/admin/settings");
}

export async function deleteGivingLink(formData: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("giving_links").delete().eq("id", text(formData, "id"))).error);
  revalidatePath("/give");
  revalidatePath("/admin/settings");
}

export async function deleteSubscriber(formData: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("subscribers").delete().eq("id", text(formData, "id"))).error);
  revalidatePath("/admin/subscribers");
}

// Custom pages --------------------------------------------------------------------

export async function savePage(formData: FormData) {
  const { supabase } = await staff();

  const id = optional(formData, "id");
  const title = text(formData, "title");
  const payload = {
    title,
    slug: text(formData, "slug") || slugify(title),
    content: (formData.get("content") as string) ?? "",
    published: formData.get("published") === "on",
    nav_label: optional(formData, "nav_label"),
    nav_order: Number(formData.get("nav_order") as string) || 0,
    updated_at: new Date().toISOString(),
  };

  if (id) check((await supabase.from("pages").update(payload).eq("id", id)).error);
  else check((await supabase.from("pages").insert(payload)).error);

  revalidatePath("/admin/pages");
  revalidatePath("/p/[slug]", "page");
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function deletePage(formData: FormData) {
  const { supabase } = await staff();
  check((await supabase.from("pages").delete().eq("id", text(formData, "id"))).error);
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}

export async function sendLiveAlert(formData: FormData) {
  await staff();
  const title = text(formData, "title");
  const body = text(formData, "body");
  if (!title) redirect("/admin/alerts?error=" + encodeURIComponent("Give the alert a title."));

  let result: Awaited<ReturnType<typeof sendAlert>>;
  try {
    result = await sendAlert({ key: `manual-${Date.now()}`, title, body, url: optional(formData, "url") ?? "/live" });
  } catch (err) {
    redirect("/admin/alerts?error=" + encodeURIComponent((err as Error).message));
  }
  revalidatePath("/admin/alerts");
  redirect(`/admin/alerts?sent=${result?.sent ?? 0}`);
}
