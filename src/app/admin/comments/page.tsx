import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Pill, Tabs, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { approveAllComments, moderateComment } from "../actions";

type Row = {
  id: string;
  name: string;
  body: string;
  approved: boolean;
  created_at: string;
  posts: { title: string; slug: string } | null;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

export default async function AdminComments({ searchParams }: PageProps<"/admin/comments">) {
  const params = await searchParams;
  const filter = params.show === "approved" || params.show === "all" ? params.show : "waiting";

  const supabase = await createClient();
  const { data } = await supabase
    .from("post_comments")
    .select("id, name, body, approved, created_at, posts(title, slug)")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as unknown as Row[];
  const waiting = all.filter((c) => !c.approved);
  const rows = filter === "waiting" ? waiting : filter === "approved" ? all.filter((c) => c.approved) : all;

  return (
    <div>
      <AdminHeader
        title="Comments"
        description="New comments wait here until you approve them, so nothing appears on the blog without a look first."
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Tabs
          active={filter}
          items={[
            { id: "waiting", label: "Waiting", count: waiting.length, href: "/admin/comments" },
            { id: "approved", label: "Approved", count: all.length - waiting.length, href: "/admin/comments?show=approved" },
            { id: "all", label: "All", count: all.length, href: "/admin/comments?show=all" },
          ]}
        />
        {waiting.length > 1 && (
          <form action={approveAllComments}>
            <ConfirmButton message={`Approve all ${waiting.length} waiting comments?`} className={smallButton}>
              Approve all {waiting.length}
            </ConfirmButton>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <Empty>{filter === "waiting" ? "All caught up. No comments are waiting." : "No comments yet."}</Empty>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="rounded-md border border-steel bg-white/80 p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-paper">{c.name}</span>
                <span className="text-paper-dim">{when(c.created_at)}</span>
                {c.approved ? <Pill tone="green">Approved</Pill> : <Pill tone="gold">Waiting</Pill>}
                {c.posts && (
                  <span className="text-paper-dim">
                    on{" "}
                    <Link href={`/blog/${c.posts.slug}`} target="_blank" className="text-gold-text underline underline-offset-4">
                      {c.posts.title}
                    </Link>
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-paper">{c.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={moderateComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value={c.approved ? "hide" : "approve"} />
                  <button className={c.approved ? smallButton : "rounded-sm bg-gold px-3 py-1.5 text-sm font-medium text-ink hover:bg-gold-soft"}>
                    {c.approved ? "Hide" : "Approve"}
                  </button>
                </form>
                <form action={moderateComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="delete" />
                  <ConfirmButton message="Delete this comment for good?" className="rounded-sm px-3 py-1.5 text-sm text-[#8a2f1e] hover:bg-[#f6e1dc]">
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
