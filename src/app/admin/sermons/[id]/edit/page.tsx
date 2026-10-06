import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { SermonForm } from "@/components/admin/sermon-form";
import { saveSermon } from "../../../actions";

export default async function EditSermon({ params }: PageProps<"/admin/sermons/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: sermon }, { data: series }] = await Promise.all([
    supabase.from("sermons").select("*").eq("id", id).maybeSingle(),
    supabase.from("series").select("id, title").order("title"),
  ]);
  if (!sermon) notFound();
  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Edit sermon</h1>
      <div className="mt-8">
        <SermonForm sermon={sermon} series={series ?? []} action={saveSermon} />
      </div>
    </div>
  );
}
