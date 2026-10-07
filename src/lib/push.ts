import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

/*
  Sends a web push alert to every phone and laptop that tapped "Notify me".
  The subscriptions are only readable with PUSH_SECRET, which lives on the server.
*/

export type Alert = { key: string; title: string; body: string; url?: string };

export function pushConfigured() {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY && process.env.PUSH_SECRET
  );
}

/** Sends the alert once. Returns null if an alert with this key already went out. */
export async function sendAlert(alert: Alert): Promise<{ sent: number; failed: number } | null> {
  if (!pushConfigured()) throw new Error("Live alerts aren't set up yet: VAPID_PRIVATE_KEY and PUSH_SECRET are missing on Vercel.");
  const secret = process.env.PUSH_SECRET!;

  const { data: claimed, error: claimError } = await supabase.rpc("claim_push_send", {
    p_secret: secret,
    p_key: alert.key,
    p_title: alert.title,
    p_body: alert.body,
  });
  if (claimError) throw new Error(claimError.message);
  if (!claimed) return null;

  const { data: targets, error } = await supabase.rpc("push_targets", { p_secret: secret });
  if (error) throw new Error(error.message);

  webpush.setVapidDetails(
    `mailto:response.citybuilders@gmail.com`,
    VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY!
  );

  const payload = JSON.stringify({ title: alert.title, body: alert.body, url: alert.url ?? "/live", tag: alert.key });
  const gone: string[] = [];
  let sent = 0;

  const rows = (targets ?? []) as { endpoint: string; p256dh: string; auth: string }[];
  for (let i = 0; i < rows.length; i += 50) {
    await Promise.all(
      rows.slice(i, i + 50).map(async (t) => {
        try {
          await webpush.sendNotification(
            { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
            payload,
            { TTL: 60 * 30, urgency: "high" }
          );
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(t.endpoint);
        }
      })
    );
  }

  await Promise.all(gone.map((endpoint) => supabase.rpc("remove_push_subscription", { p_endpoint: endpoint })));
  await supabase.rpc("finish_push_send", { p_secret: secret, p_key: alert.key, p_sent: sent, p_gone: gone });

  return { sent, failed: rows.length - sent };
}
