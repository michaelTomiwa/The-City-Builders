import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, Tabs, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { lagosDateTime } from "@/lib/discipleship";
import { deleteTestimony, reviewTestimony } from "../discipleship/actions";

type T = { id: string; title: string; body: string; display_name: string | null; status: string; created_at: string };

export default async function AdminTestimonies({ searchParams }: PageProps<"/admin/testimonies">) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("testimonies").select("*").order("created_at", { ascending: false });
  const all = (data ?? []) as T[];
  const tab = typeof params.tab === "string" ? params.tab : "pending";
  const list = all.filter((t) => t.status === tab);

  return (
    <div>
      <AdminHeader title="Testimonies" description="Members share what God has done. Approve a testimony to put it on the public testimonies wall and the homepage." />
      <div className="mt-6">
        <Tabs
          active={tab}
          items={[
            { id: "pending", label: "Waiting", count: all.filter((t) => t.status === "pending").length, href: "/admin/testimonies" },
            { id: "approved", label: "On the wall", count: all.filter((t) => t.status === "approved").length, href: "/admin/testimonies?tab=approved" },
            { id: "declined", label: "Not shared", count: all.filter((t) => t.status === "declined").length, href: "/admin/testimonies?tab=declined" },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <div className="mt-6">
          <Empty>Nothing here.</Empty>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((t) => (
            <li key={t.id} className="rounded-md border border-steel bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-2xl text-paper">{t.title}</p>
                <span className="flex items-center gap-2 text-xs text-paper-dim">
                  {t.display_name ?? <Pill tone="grey">Anonymous</Pill>} · {lagosDateTime(t.created_at)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-paper-dim">{t.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.status !== "approved" && (
                  <form action={reviewTestimony}>
                    <input type="hidden" name="id" value={t.id} />
                    <button name="status" value="approved" className="rounded-sm bg-[#3d9a6a] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#33845a]">
                      Approve and publish
                    </button>
                  </form>
                )}
                {t.status !== "declined" && (
                  <form action={reviewTestimony}>
                    <input type="hidden" name="id" value={t.id} />
                    <button name="status" value="declined" className={smallButton}>
                      {t.status === "approved" ? "Take down" : "Don't share"}
                    </button>
                  </form>
                )}
                <form action={deleteTestimony}>
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmButton message="Delete this testimony?" className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:underline">
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
