import { sendWeeklyReportAlert } from "@/lib/push";

/* Pinged by Supabase pg_cron on Monday at 8:00 AM Lagos time; only sends on Mondays, once. */

export const dynamic = "force-dynamic";

async function handle() {
  try {
    const lagos = new Date(Date.now() + 3600_000);
    if (lagos.getUTCDay() !== 1) return Response.json({ result: "not Monday" });
    const result = await sendWeeklyReportAlert(lagos.toISOString().slice(0, 10));
    return Response.json({ result: result ?? "already sent" });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
