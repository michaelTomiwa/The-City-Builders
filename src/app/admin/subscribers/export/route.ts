import { createClient } from "@/lib/supabase-server";

function csvCell(value: string | null) {
  const s = value ?? "";
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The subscriber list as a CSV file. Row-level security limits it to admins. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first.", { status: 401 });

  const { data, error } = await supabase.from("subscribers").select("email, name, created_at").order("created_at");
  if (error) return new Response(error.message, { status: 403 });

  const lines = ["email,name,subscribed_at", ...(data ?? []).map((r) => [r.email, r.name, r.created_at].map(csvCell).join(","))];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="city-builders-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
