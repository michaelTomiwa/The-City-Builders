import { getMember } from "@/lib/member-data";
import { lagosDateTime } from "@/lib/discipleship";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteJournal, saveJournal, shareTestimony } from "../actions";

export default async function JournalPage({ searchParams }: PageProps<"/me/journal">) {
  const params = await searchParams;
  const { supabase, user } = await getMember();
  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });
  const entries = (data ?? []) as { id: string; title: string | null; body: string; shared: boolean; created_at: string }[];
  const { data: mine } = await supabase.from("testimonies").select("id, title, status, created_at").eq("user_id", user!.id).order("created_at", { ascending: false });
  const testimonies = (mine ?? []) as { id: string; title: string; status: string; created_at: string }[];

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="font-display text-4xl text-paper">Journal</h1>
        <p className="mt-2 text-paper-dim">Prayers, dreams, scriptures that spoke to you. Private unless you choose to share an entry with the pastor.</p>
        {params.saved && (
          <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
            Saved.
          </p>
        )}
        <form action={saveJournal} className="mt-6 rounded-md border border-steel bg-white p-5">
          <input
            name="title"
            placeholder="Title (optional)"
            className="h-10 w-full border-b border-steel bg-transparent font-display text-xl text-paper outline-none placeholder:text-paper-dim/60 focus:border-gold"
          />
          <textarea
            name="body"
            required
            rows={7}
            placeholder="Write what's on your heart…"
            className="mt-3 w-full resize-y bg-transparent text-[0.95rem] leading-relaxed text-paper outline-none placeholder:text-paper-dim/60"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-steel pt-3">
            <label className="flex items-center gap-2 text-sm text-paper-dim">
              <input type="checkbox" name="shared" className="accent-gold" />
              Share with the pastor
            </label>
            <button className="rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Save entry</button>
          </div>
        </form>

        <form action={shareTestimony} className="on-night mt-6 rounded-md bg-night p-5 text-starlight">
          <h2 className="font-display text-2xl">Share a testimony</h2>
          <p className="mt-1 text-sm text-starlight-dim">What has God done? Once the pastor approves it, it appears on the testimonies wall to encourage others.</p>
          {params.testimony === "sent" && (
            <p className="mt-3 rounded-sm bg-lamp/15 px-3 py-2 text-sm text-lamp" role="status">
              Thank you. The pastor will read it soon.
            </p>
          )}
          <input name="title" required placeholder="Headline, e.g. God healed my mother" className="mt-4 h-10 w-full rounded-sm border border-night-3 bg-night-2 px-3 text-sm text-starlight outline-none placeholder:text-starlight-dim/60 focus:border-lamp" />
          <textarea name="body" required rows={5} placeholder="Tell the story…" className="mt-2 w-full rounded-sm border border-night-3 bg-night-2 px-3 py-2 text-sm text-starlight outline-none placeholder:text-starlight-dim/60 focus:border-lamp" />
          <label className="mt-2 flex items-center gap-2 text-sm text-starlight-dim">
            <input type="checkbox" name="anonymous" className="accent-gold" />
            Share without my name
          </label>
          <button className="mt-3 rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Send testimony</button>
          {testimonies.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-night-3 pt-3 text-sm">
              {testimonies.map((t) => (
                <li key={t.id} className="flex justify-between gap-3">
                  <span className="truncate">{t.title}</span>
                  <span className="shrink-0 text-xs text-starlight-dim">{t.status === "approved" ? "On the wall" : t.status === "pending" ? "Waiting" : "Not shared"}</span>
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      <div>
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-steel bg-white/60 px-6 py-16 text-center text-paper-dim">
            Your first entry will appear here.
          </p>
        ) : (
          <ol className="relative space-y-6 border-l border-steel pl-6">
            {entries.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[1.85rem] top-1.5 h-3 w-3 rounded-full border-2 border-gold bg-midnight" aria-hidden="true" />
                <p className="text-xs text-paper-dim">
                  {lagosDateTime(e.created_at)}
                  {e.shared && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-gold-text">Shared with the pastor</span>}
                </p>
                {e.title && <h2 className="mt-1 font-display text-2xl text-paper">{e.title}</h2>}
                <p className="mt-2 whitespace-pre-line leading-relaxed text-paper">{e.body}</p>
                <form action={deleteJournal} className="mt-2">
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmButton message="Delete this entry?" className="text-xs text-paper-dim hover:text-[#8a2f1e]">
                    Delete
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
