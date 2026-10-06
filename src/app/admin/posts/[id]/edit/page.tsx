import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PostForm } from "@/components/admin/post-form";
import { savePost } from "../../../actions";

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();

  if (!post) notFound();

  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Edit post</h1>
      <div className="mt-8">
        <PostForm post={post} action={savePost} />
      </div>
    </div>
  );
}
