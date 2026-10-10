import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

/*
  Web push alerts. Subscriptions are only readable with PUSH_SECRET, which
  lives on the server, through security-definer functions in the database.
*/

export type Alert = { key: string; title: string; body: string; url?: string };
type Target = { endpoint: string; p256dh: string; auth: string };
type Payload = { title: string; body: string; url: string; tag: string };

export function pushConfigured() {
  return Boolean(process.env.VAPID_PRIVATE_KEY && process.env.PUSH_SECRET);
}

function secret() {
  if (!pushConfigured()) throw new Error("Live alerts aren't set up yet: VAPID_PRIVATE_KEY and PUSH_SECRET are missing on Vercel.");
  return process.env.PUSH_SECRET!;
}

/** Claims an alert key so it is only ever sent once. False if it already went out. */
async function claim(alert: { key: string; title: string; body: string }) {
  const { data, error } = await supabase.rpc("claim_push_send", { p_secret: secret(), p_key: alert.key, p_title: alert.title, p_body: alert.body });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** Sends one payload per target (50 at a time) and cleans up phones that unsubscribed. */
async function deliver<T extends Target>(targets: T[], payloadFor: (t: T) => Payload | null) {
  webpush.setVapidDetails("mailto:response.citybuilders@gmail.com", VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY!);
  const gone: string[] = [];
  let sent = 0;
  for (let i = 0; i < targets.length; i += 50) {
    await Promise.all(
      targets.slice(i, i + 50).map(async (t) => {
        const payload = payloadFor(t);
        if (!payload) return;
        try {
          await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify(payload), {
            TTL: 60 * 60 * 3,
            urgency: "high",
          });
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(t.endpoint);
        }
      })
    );
  }
  await Promise.all(gone.map((endpoint) => supabase.rpc("remove_push_subscription", { p_endpoint: endpoint })));
  return { sent, gone: gone.length };
}

async function finish(key: string, sent: number) {
  await supabase.rpc("finish_push_send", { p_secret: secret(), p_key: key, p_sent: sent, p_gone: [] });
}

/** An alert to every phone that tapped "Notify me". Null if this alert key was already sent. */
export async function sendAlert(alert: Alert): Promise<{ sent: number; failed: number } | null> {
  if (!(await claim(alert))) return null;
  const { data, error } = await supabase.rpc("push_targets", { p_secret: secret() });
  if (error) throw new Error(error.message);
  const targets = (data ?? []) as Target[];
  const payload = { title: alert.title, body: alert.body, url: alert.url ?? "/live", tag: alert.key };
  const { sent } = await deliver(targets, () => payload);
  await finish(alert.key, sent);
  return { sent, failed: targets.length - sent };
}

type DigestRow = Target & { user_id: string; full_name: string | null; today_count: number; today_first: string | null; missed_yesterday: number };

/** Each member's morning reminder: today's first step, or a gentle nudge if they missed yesterday. */
export async function sendDailyReminders(day: string) {
  const key = `daily-${day}`;
  if (!(await claim({ key, title: "Morning reminders", body: "Personal step reminders" }))) return null;
  const { data, error } = await supabase.rpc("daily_digest", { p_secret: secret() });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DigestRow[];
  const { sent } = await deliver(rows, (r) => {
    const first = r.full_name?.split(" ")[0] ?? "friend";
    if (r.today_count > 0) {
      const more = r.today_count > 1 ? ` (+${r.today_count - 1} more)` : "";
      return { title: `Good morning, ${first}`, body: `Today: ${r.today_first}${more}`, url: "/me", tag: key };
    }
    if (r.missed_yesterday > 0) {
      return { title: `We missed you yesterday, ${first}`, body: `${r.missed_yesterday} ${r.missed_yesterday === 1 ? "step is" : "steps are"} waiting. Catch up today.`, url: "/me", tag: key };
    }
    return null;
  });
  await finish(key, sent);
  return { sent, members: new Set(rows.map((r) => r.user_id)).size };
}

/** Monday morning: tell the pastor and staff the weekly report is ready. */
export async function sendWeeklyReportAlert(day: string) {
  const key = `weekly-${day}`;
  const alert = { key, title: "Your weekly report is ready", body: "Who's growing, who's gone quiet, new members and testimonies." };
  if (!(await claim(alert))) return null;
  const { data, error } = await supabase.rpc("staff_push_targets", { p_secret: secret() });
  if (error) throw new Error(error.message);
  const { sent } = await deliver((data ?? []) as Target[], () => ({ title: alert.title, body: alert.body, url: "/admin/report", tag: key }));
  await finish(key, sent);
  return { sent };
}

type UserTarget = Target & { user_id: string };

/** A new-message alert to particular members' phones, or to every staff phone when users is "staff". */
export async function sendMessagePush(users: string[] | "staff", payload: (userId: string | null) => Omit<Payload, "tag"> | null, tag: string) {
  if (!pushConfigured()) return { sent: 0 };
  try {
    const { data, error } =
      users === "staff"
        ? await supabase.rpc("staff_push_targets", { p_secret: secret() })
        : await supabase.rpc("user_push_targets", { p_secret: secret(), p_users: users });
    if (error) return { sent: 0 };
    const rows = (data ?? []) as (Target & Partial<UserTarget>)[];
    const { sent } = await deliver(rows, (r) => {
      const p = payload(r.user_id ?? null);
      return p ? { ...p, tag } : null;
    });
    return { sent };
  } catch {
    return { sent: 0 };
  }
}

type ReminderRow = UserTarget & { kind: "24h" | "3h"; assignment_id: string; title: string; due_at: string };

/**
 * Every hour: alerts 24 hours and 3 hours before an assignment is due (to
 * people who haven't handed in yet), then the accountability follow-ups:
 * gentle messages for new misses, check-ins and flags for the pastor.
 */
export async function runAssignmentCare() {
  if (!pushConfigured()) return { reminders: 0, followUps: 0 };
  let reminders = 0;
  const { data: rows, error } = await supabase.rpc("assignment_reminder_targets", { p_secret: secret() });
  if (error) throw new Error(error.message);
  const groups = new Map<string, ReminderRow[]>();
  for (const r of (rows ?? []) as ReminderRow[]) {
    const key = `due${r.kind}-${r.assignment_id}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  for (const [key, list] of groups) {
    const first = list[0];
    const title = first.kind === "3h" ? "Due in 3 hours" : "Due tomorrow";
    const body = `"${first.title}" is due ${first.kind === "3h" ? "soon" : "in 24 hours"}. Hand it in on time 🙏`;
    if (!(await claim({ key, title, body }))) continue;
    const { sent } = await deliver(list, () => ({ title, body, url: `/me/assignments/${first.assignment_id}`, tag: key }));
    await finish(key, sent);
    reminders += sent;
  }

  const { data: actions, error: runError } = await supabase.rpc("run_accountability", { p_secret: secret() });
  if (runError) throw new Error(runError.message);
  const list = (actions ?? []) as { push_user: string | null; push_title: string; push_body: string; push_url: string }[];
  let followUps = 0;
  for (const a of list) {
    const { sent } = await sendMessagePush(a.push_user ? [a.push_user] : "staff", () => ({ title: a.push_title, body: a.push_body, url: a.push_url }), `care-${a.push_user ?? "staff"}`);
    followUps += sent;
  }
  return { reminders, followUps, actions: list.length };
}
