import { runAssignmentCare } from "@/lib/push";

/*
  Pinged by Supabase pg_cron every hour (10 past): assignment reminders before
  the due date, and gentle follow-ups for people who miss. Each alert and each
  follow-up happens once, however often this is called.
*/

export const dynamic = "force-dynamic";

async function handle() {
  try {
    return Response.json({ result: await runAssignmentCare() });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
