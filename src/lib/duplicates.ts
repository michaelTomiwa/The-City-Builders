import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The id of an identical row created in the last minute, if there is one.
 * Saves check this before inserting, so a double tap or a retried request
 * never creates the same assignment, programme or message twice.
 */
export async function recentDuplicate(
  supabase: SupabaseClient,
  table: string,
  match: Record<string, string | null>,
  seconds = 60
): Promise<string | null> {
  let query = supabase
    .from(table)
    .select("id")
    .gte("created_at", new Date(Date.now() - seconds * 1000).toISOString());
  for (const [column, value] of Object.entries(match)) query = value === null ? query.is(column, null) : query.eq(column, value);
  const { data } = await query.order("created_at", { ascending: true }).limit(1);
  return (data?.[0]?.id as string | undefined) ?? null;
}
