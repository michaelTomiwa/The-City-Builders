import { createClient } from "@/lib/supabase-server";
import { AdminHeader } from "@/components/admin/ui";
import { AssignmentForm } from "@/components/admin/assignment-form";
import { activeMembers } from "@/lib/admin-discipleship";
import { saveAssignment } from "../../discipleship/actions";

export default async function NewAssignment() {
  const supabase = await createClient();
  const [{ picker }, { data: programs }] = await Promise.all([
    activeMembers(supabase),
    supabase.from("programs").select("id, title").neq("status", "archived").order("start_date", { ascending: false }),
  ]);
  return (
    <div>
      <AdminHeader title="New assignment" description="Write the instructions and teaching, choose who it's for, and set a due date." />
      <div className="mt-8">
        <AssignmentForm programs={programs ?? []} members={picker} action={saveAssignment} />
      </div>
    </div>
  );
}
