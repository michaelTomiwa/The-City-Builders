import type { SupabaseClient } from "@supabase/supabase-js";
import { displayName, type Member } from "@/lib/discipleship";
import type { PickerMember } from "@/components/admin/member-picker";

/** Approved members (active, not staff), for audience pickers and progress tables. */
export async function activeMembers(supabase: SupabaseClient) {
  const { data } = await supabase.from("profiles").select("*").eq("status", "active").eq("role", "member").order("full_name");
  const members = (data ?? []) as Member[];
  const picker: PickerMember[] = members.map((m) => ({ id: m.id, name: displayName(m), email: m.email }));
  return { members, picker };
}
