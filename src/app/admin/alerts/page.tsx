import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, Pill, fieldHint, fieldLabel } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pushConfigured } from "@/lib/push";
import { sendLiveAlert } from "../actions";

const presets = [
  { title: "We're live now", body: "Night Watch has started. Tap to join the watch room." },
  { title: "Morning Prayers are live", body: "Start the day with us. Tap to join." },
  { title: "Special service tonight", body: "Something different tonight. Tap for the details." },
];

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export default async function AdminAlerts({ searchParams }: PageProps<"/admin/alerts">) {
  const params = await searchParams;
  const preset = presets[Number(params.preset ?? -1)];
  const supabase = await createClient();
  const [{ count }, { data: sends }] = await Promise.all([
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
    supabase.from("push_sends").select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  const ready = pushConfigured();

  return (
    <div>
      <AdminHeader
        title="Live alerts"
        description={
          <>
            Phone and laptop alerts for people who tapped &ldquo;Notify me when we go live&rdquo;. They go out on their own 5
            minutes before Night Watch and Morning Prayers. Send one yourself any time below.
          </>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Panel>
          <p className="text-sm text-paper-dim">Devices signed up</p>
          <p className="mt-1 font-display text-4xl text-paper">{count ?? 0}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-paper-dim">Automatic alerts</p>
          <p className="mt-1 text-paper">10:55 PM and 6:55 AM</p>
          <p className="text-sm text-paper-dim">Lagos time, every day</p>
        </Panel>
        <Panel>
          <p className="text-sm text-paper-dim">Status</p>
          <p className="mt-2">{ready ? <Pill tone="green">Ready to send</Pill> : <Pill tone="red">Keys missing</Pill>}</p>
        </Panel>
      </div>

      <Panel className="mt-6">
        <h2 className="font-display text-2xl text-paper">Send an alert now</h2>
        {params.sent !== undefined && (
          <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
            Sent to {params.sent} {params.sent === "1" ? "device" : "devices"}.
          </p>
        )}
        {typeof params.error === "string" && (
          <p className="mt-4 rounded-md border border-[#ecc4ba] bg-[#fbefec] px-4 py-2 text-sm text-[#8a2f1e]" role="alert">
            {params.error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <a
              key={p.title}
              href={`/admin/alerts?preset=${i}`}
              className="rounded-full border border-steel bg-white px-3 py-1 text-sm text-paper hover:border-gold"
            >
              {p.title}
            </a>
          ))}
        </div>
        <form action={sendLiveAlert} className="mt-5 space-y-5" key={params.preset as string | undefined}>
          <div>
            <label htmlFor="title" className={fieldLabel}>
              Title
            </label>
            <Input id="title" name="title" required maxLength={60} defaultValue={preset?.title ?? ""} className="mt-2 bg-white" />
          </div>
          <div>
            <label htmlFor="body" className={fieldLabel}>
              Message
            </label>
            <Input id="body" name="body" maxLength={140} defaultValue={preset?.body ?? ""} className="mt-2 bg-white" />
          </div>
          <div>
            <label htmlFor="url" className={fieldLabel}>
              Opens (optional)
            </label>
            <Input id="url" name="url" placeholder="/live" className="mt-2 bg-white" />
            <p className={fieldHint}>Where tapping the alert takes people. Leave empty for the watch room.</p>
          </div>
          <Button type="submit" disabled={!ready}>
            Send to {count ?? 0} {count === 1 ? "device" : "devices"}
          </Button>
        </form>
      </Panel>

      <h2 className="mt-10 font-display text-2xl text-paper">Recent alerts</h2>
      {(sends ?? []).length === 0 ? (
        <div className="mt-4">
          <Empty>No alerts sent yet.</Empty>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {(sends ?? []).map((s) => (
            <li key={s.key} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">
                <span className="block font-medium text-paper">{s.title}</span>
                <span className="block text-paper-dim">{s.body}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-paper-dim">
                {s.key.startsWith("manual") ? <Pill tone="gold">Sent by hand</Pill> : <Pill tone="blue">Automatic</Pill>}
                {s.sent} reached · {when(s.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
