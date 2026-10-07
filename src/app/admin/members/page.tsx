import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, Tabs, smallButton } from "@/components/admin/ui";
import { displayName, growth, initials, lagosDateTime, streak, type Member } from "@/lib/discipleship";
import { approveAllPending, setMemberRole, setMemberStatus } from "../discipleship/actions";

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data }, { data: checkins }, { data: subs }, { data: me }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("step_checkins").select("user_id, created_at"),
    supabase.from("submissions").select("user_id, status"),
    supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle(),
  ]);
  const people = (data ?? []) as Member[];
  const isAdmin = me?.role === "admin";
  const pending = people.filter((p) => p.status === "pending");
  const tab = typeof params.tab === "string" ? params.tab : pending.length ? "pending" : "active";
  const list = people.filter((p) => (tab === "staff" ? p.role !== "member" : p.status === tab && p.role === "member"));

  const statsFor = (id: string) => {
    const mine = (checkins ?? []).filter((c) => c.user_id === id);
    const reviewed = (subs ?? []).filter((s) => s.user_id === id && s.status === "reviewed").length;
    const last = mine.reduce<string | null>((acc, c) => (!acc || c.created_at > acc ? c.created_at : acc), null);
    return {
      steps: mine.length,
      submissions: (subs ?? []).filter((s) => s.user_id === id).length,
      streak: streak(mine.map((c) => c.created_at)),
      level: growth(mine.length + reviewed * 5).level.name,
      last,
    };
  };

  return (
    <div>
      <AdminHeader
        title="Members"
        description="Everyone who signed up for a City Builders dashboard. Approve new people so they can see programmes and assignments."
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          items={[
            { id: "pending", label: "Waiting", count: pending.length, href: "/admin/members?tab=pending" },
            { id: "active", label: "Members", count: people.filter((p) => p.status === "active" && p.role === "member").length, href: "/admin/members?tab=active" },
            { id: "inactive", label: "Paused", count: people.filter((p) => p.status === "inactive").length, href: "/admin/members?tab=inactive" },
            { id: "staff", label: "Staff", count: people.filter((p) => p.role !== "member").length, href: "/admin/members?tab=staff" },
          ]}
        />
        {tab === "pending" && pending.length > 1 && (
          <form action={approveAllPending}>
            <button className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Approve all {pending.length}</button>
          </form>
        )}
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <Empty>
            {tab === "pending" ? "No one is waiting. Share the Members link on the site, /join, so people can sign up." : "No one here yet."}
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-steel overflow-hidden rounded-md border border-steel bg-white/80">
          {list.map((p) => {
            const s = statsFor(p.id);
            return (
              <li key={p.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-medium text-gold-text">{initials(p)}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-paper">{displayName(p)}</span>
                      {p.role !== "member" && <Pill tone="blue">{p.role === "admin" ? "Admin" : "Author"}</Pill>}
                    </span>
                    <span className="block truncate text-sm text-paper-dim">
                      {[p.email, p.phone].filter(Boolean).join(" · ")} · joined {lagosDateTime(p.created_at).split(",").slice(0, 2).join(",")}
                    </span>
                  </span>
                </div>

                {tab !== "pending" && (
                  <div className="flex shrink-0 gap-5 text-center text-xs text-paper-dim">
                    <span>
                      <span className="block font-display text-xl text-paper">{s.steps}</span>steps
                    </span>
                    <span>
                      <span className="block font-display text-xl text-paper">{s.streak}</span>streak
                    </span>
                    <span>
                      <span className="block font-display text-xl text-paper">{s.submissions}</span>handed in
                    </span>
                    <span>
                      <span className="block pt-1 text-sm text-paper">{s.level}</span>level
                    </span>
                  </div>
                )}

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {p.status !== "active" && (
                    <form action={setMemberStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <button name="status" value="active" className="rounded-sm bg-[#3d9a6a] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#33845a]">
                        {p.status === "pending" ? "Approve" : "Reactivate"}
                      </button>
                    </form>
                  )}
                  {p.status !== "inactive" && p.id !== user!.id && (
                    <form action={setMemberStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <button name="status" value="inactive" className={smallButton}>
                        {p.status === "pending" ? "Decline" : "Pause"}
                      </button>
                    </form>
                  )}
                  {isAdmin && p.id !== user!.id && p.status === "active" && (
                    <form action={setMemberRole} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="role" defaultValue={p.role} aria-label="Role" className="h-8 rounded-sm border border-steel bg-white px-1.5 text-sm text-paper">
                        <option value="member">Member</option>
                        <option value="author">Author</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button className={smallButton}>Set</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
