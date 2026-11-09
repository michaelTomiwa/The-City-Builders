import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PostForm } from "@/components/admin/post-form";
import { savePost } from "../../../actions";

export default async function EditPostPage({ params, searchParams }: PageProps<"/admin/posts/[id]/edit">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let check: string[] = [];
  try {
    check = typeof query.check === "string" ? (JSON.parse(query.check) as string[]).filter((c) => typeof c === "string") : [];
  } catch {}
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();

  if (!post) notFound();

  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Edit post</h1>
      {query.from === "sermon" && (
        <section className="mt-6 rounded-md border border-gold/50 bg-[#fdf7ea] p-5">
          <p className="font-medium text-paper">Your draft from the sermon is ready. It&apos;s not public yet.</p>
          <p className="mt-1 text-sm text-paper-dim">
            Read it through, fix anything, then choose <strong>Publish</strong>. The video is at the top and its picture is the cover.
          </p>
          {check.length > 0 && (
            <>
              <p className="mt-4 text-sm font-medium text-[#8a2f1e]">Claude wasn&apos;t sure about these. Please check them:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-paper">
                {check.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      <div className="mt-8">
        <PostForm post={post} action={savePost} />
      </div>
    </div>
  );
}
