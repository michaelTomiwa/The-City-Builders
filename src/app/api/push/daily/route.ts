import { sendDailyReminders } from "@/lib/push";

/*
  Pinged by Supabase pg_cron at 6:00 AM Lagos time. Only works between 5 and 10 AM
  Lagos time, and each day's reminders go out once.
*/

export const dynamic = "force-dynamic";

async function handle() {
  try {
    const lagos = new Date(Date.now() + 3600_000);
    const hour = lagos.getUTCHours();
    if (hour < 5 || hour >= 10) return Response.json({ result: "outside the morning window" });
    const result = await sendDailyReminders(lagos.toISOString().slice(0, 10));
    return Response.json({ result: result ?? "already sent" });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
