import { createClient } from "@/lib/supabase-server";
import { AdminHeader } from "@/components/admin/ui";
import { ProgramForm } from "@/components/admin/program-form";
import { activeMembers } from "@/lib/admin-discipleship";
import { lagosToday } from "@/lib/discipleship";
import { saveProgram } from "../../discipleship/actions";

export default async function NewProgram() {
  const supabase = await createClient();
  const { picker } = await activeMembers(supabase);
  return (
    <div>
      <AdminHeader title="New programme" description="Pick a template or build your own: a step for every day, for everyone or for chosen people." />
      <div className="mt-8">
        <ProgramForm members={picker} defaultStart={lagosToday()} action={saveProgram} />
      </div>
    </div>
  );
}
