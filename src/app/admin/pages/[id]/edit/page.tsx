import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PageForm } from "@/components/admin/page-form";
import { savePage } from "../../../actions";

export default async function EditCustomPage({ params }: PageProps<"/admin/pages/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();

  if (!page) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-paper">Edit page</h1>
      <div className="mt-8">
        <PageForm page={page} action={savePage} />
      </div>
    </div>
  );
}
