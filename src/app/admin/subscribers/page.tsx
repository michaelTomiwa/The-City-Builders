import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CHURCH_EMAIL } from "@/lib/schedule";
import { deleteSubscriber } from "../actions";

function oneWeekAgo() {
  return new Date(Date.now() - 7 * 86_400_000).toISOString();
}

export default async function AdminSubscribers() {
  const supabase = await createClient();
  const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
  const rows = data ?? [];
  const weekAgo = oneWeekAgo();
  const thisWeek = rows.filter((r) => r.created_at >= weekAgo).length;
  const bcc = rows.map((r) => r.email).join(",");

  return (
    <div>
      <AdminHeader
        title="Subscribers"
        description={`People who asked for new posts and the Word for the Month by email. ${thisWeek} joined this week.`}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/admin/subscribers/export"
          className="inline-flex h-10 items-center rounded-sm bg-gold px-5 text-sm font-medium text-ink hover:bg-gold-soft"
        >
          Download as spreadsheet (CSV)
        </a>
        {rows.length > 0 && (
          <a
            href={`mailto:${CHURCH_EMAIL}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent("A word from The City Builders")}`}
            className="inline-flex h-10 items-center rounded-sm border border-steel bg-white px-5 text-sm text-paper hover:border-gold"
          >
            Email everyone
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <Empty>No subscribers yet. The sign-up form is on the blog and every post.</Empty>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="min-w-0 truncate text-paper">{r.email}</span>
              <span className="flex shrink-0 items-center gap-4 text-paper-dim">
                {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                <form action={deleteSubscriber}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message={`Remove ${r.email} from the list?`} className="text-[#8a2f1e] hover:underline">
                    Remove
                  </ConfirmButton>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
