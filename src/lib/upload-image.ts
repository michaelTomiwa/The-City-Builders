import { createClient } from "@/lib/supabase-browser";

/*
  Uploads an image from the admin to the public "media" bucket and returns its URL.
  Photos are scaled to at most 1600px wide and saved as JPEG (usually 150-400 KB),
  so pages stay fast and the 1 GB of free storage holds thousands of images.
  Logos keep their original format so transparent backgrounds survive.
*/

const MAX_WIDTH = 1600;
const SMALL_ENOUGH = 400 * 1024;

/** Scales a photo down to at most maxWidth and re-saves it as JPEG when it is large. */
export async function shrinkImage(file: File, maxWidth = MAX_WIDTH, keepOriginal = false): Promise<Blob> {
  if (file.type === "image/gif" || keepOriginal) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap || (bitmap.width <= maxWidth && file.size <= SMALL_ENOUGH)) {
    bitmap?.close();
    return file;
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.82));
}

export async function uploadImage(file: File, folder = "uploads", keepOriginal = false) {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  const blob = await shrinkImage(file, MAX_WIDTH, keepOriginal);
  if (blob.size > 10 * 1024 * 1024) throw new Error("That image is over 10 MB. Try a smaller one.");

  const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "image";
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
