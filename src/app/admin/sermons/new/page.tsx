import { createClient } from "@/lib/supabase-server";
import { SermonForm } from "@/components/admin/sermon-form";
import { saveSermon } from "../../actions";

export default async function NewSermon() {
  const supabase = await createClient();
  const { data: series } = await supabase.from("series").select("id, title").order("title");
  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Add a sermon</h1>
      <div className="mt-8">
        <SermonForm series={series ?? []} action={saveSermon} />
      </div>
    </div>
  );
}
