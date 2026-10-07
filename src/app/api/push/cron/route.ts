import { services, serviceStartToday } from "@/lib/schedule";
import { sendAlert } from "@/lib/push";

/*
  Pinged by Supabase pg_cron at 10:55 PM and 6:55 AM Lagos time. It only sends
  when a service really starts in the next few minutes, and each service's alert
  goes out once per day, so calling it at any other time does nothing.
*/

export const dynamic = "force-dynamic";

async function handle() {
  const now = Date.now();
  for (const service of services) {
    const start = serviceStartToday(service, now).getTime();
    const minutes = (start - now) / 60_000;
    if (minutes < -2 || minutes > 12) continue;

    const day = new Date(start + 3600_000).toISOString().slice(0, 10);
    const result = await sendAlert({
      key: `${service.id}-${day}`,
      title: `${service.name} starts in ${Math.max(1, Math.round(minutes))} minutes`,
      body: "Come and watch with us. Tap to open the watch room.",
      url: "/live",
    });
    return Response.json({ service: service.id, result: result ?? "already sent" });
  }
  return Response.json({ result: "no service starting soon" });
}

async function safely() {
  try {
    return await handle();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = safely;
export const POST = safely;
