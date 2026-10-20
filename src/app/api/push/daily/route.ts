import { sendDailyReminders, sendFastDayAlert } from "@/lib/push";

/*
  Pinged by Supabase pg_cron at 6:00 AM Lagos time: fast-day alerts, then each member's steps. Only works between 5 and 10 AM
  Lagos time, and each day's reminders go out once.
*/

export const dynamic = "force-dynamic";

async function handle() {
  try {
    const lagos = new Date(Date.now() + 3600_000);
    const hour = lagos.getUTCHours();
    if (hour < 5 || hour >= 10) return Response.json({ result: "outside the morning window" });
    const day = lagos.toISOString().slice(0, 10);
    const fast = await sendFastDayAlert(day).catch((err: Error) => err.message);
    const result = await sendDailyReminders(day);
    return Response.json({ result: result ?? "already sent", fast: fast ?? "no fast alert to send" });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
