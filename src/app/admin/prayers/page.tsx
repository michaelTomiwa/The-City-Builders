import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, Tabs, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { updatePrayer } from "../actions";

type Row = {
  id: string;
  name: string | null;
  request: string;
  is_public: boolean;
  prayed_count: number;
  status: "new" | "prayed" | "answered";
  created_at: string;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

const statusTone = { new: "blue", prayed: "gold", answered: "green" } as const;
const statusLabel = { new: "New", prayed: "Prayed over", answered: "Answered" } as const;

export default async function AdminPrayers({ searchParams }: PageProps<"/admin/prayers">) {
  const params = await searchParams;
  const filter = typeof params.status === "string" ? params.status : "new";

  const supabase = await createClient();
  const { data } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
  const all = (data ?? []) as Row[];
  const count = (s: string) => all.filter((p) => p.status === s).length;
  const rows = filter === "all" ? all : all.filter((p) => p.status === filter);

  return (
    <div>
      <AdminHeader
        title="Prayer requests"
        description="Everything sent through the prayer wall, including private requests. Mark each one as you pray, and celebrate the answers."
      />

      <div className="mt-8">
        <Tabs
          active={filter}
          items={[
            { id: "new", label: "New", count: count("new"), href: "/admin/prayers" },
            { id: "prayed", label: "Prayed over", count: count("prayed"), href: "/admin/prayers?status=prayed" },
            { id: "answered", label: "Answered", count: count("answered"), href: "/admin/prayers?status=answered" },
            { id: "all", label: "All", count: all.length, href: "/admin/prayers?status=all" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <Empty>{filter === "new" ? "No new requests. Every one has been prayed over." : "Nothing here yet."}</Empty>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="rounded-md border border-steel bg-white/80 p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-paper">{p.name ?? "Anonymous"}</span>
                <span className="text-paper-dim">{when(p.created_at)}</span>
                <Pill tone={statusTone[p.status]}>{statusLabel[p.status]}</Pill>
                <Pill tone={p.is_public ? "grey" : "red"}>{p.is_public ? "On the wall" : "Private"}</Pill>
                {p.prayed_count > 0 && (
                  <span className="text-paper-dim">
                    {p.prayed_count} {p.prayed_count === 1 ? "person" : "people"} prayed
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-paper">{p.request}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["prayed", "answered", "new"] as const)
                  .filter((s) => s !== p.status)
                  .map((s) => (
                    <form key={s} action={updatePrayer}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="action" value={s} />
                      <button className={smallButton}>
                        {s === "prayed" ? "Mark prayed over" : s === "answered" ? "Mark answered" : "Move back to new"}
                      </button>
                    </form>
                  ))}
                <form action={updatePrayer}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="action" value={p.is_public ? "hide" : "show"} />
                  <button className={smallButton}>{p.is_public ? "Take off the wall" : "Show on the wall"}</button>
                </form>
                <form action={updatePrayer}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="action" value="delete" />
                  <ConfirmButton message="Delete this prayer request for good?" className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:bg-[#f6e1dc]">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
