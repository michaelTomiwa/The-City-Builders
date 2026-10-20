import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { activeMembers } from "@/lib/admin-discipleship";
import { AdminHeader, Pill } from "@/components/admin/ui";
import { displayName, lagosDateTime } from "@/lib/discipleship";
import { addWeeks, forPerson, handedIn, inWeek, mondayOf, thisWeek, weekLabel, type WeekItem, type WeekTick } from "@/lib/week";
import { reviewHandIn } from "../actions";

export const metadata: Metadata = { title: "Hand-ins" };

function fileKind(name: string | null | undefined) {
  const ext = (name ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx", "odt", "rtf"].includes(ext)) return "Word document";
  if (["ppt", "pptx"].includes(ext)) return "Slides";
  if (["jpg", "jpeg", "png", "heic", "webp", "gif"].includes(ext)) return "Photo";
  if (["mp3", "m4a", "wav", "ogg", "aac", "webm"].includes(ext)) return "Voice note";
  return "File";
}

export default async function HandIns({ params, searchParams }: PageProps<"/admin/week/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const week = typeof query.w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.w) ? mondayOf(query.w) : thisWeek();
  const supabase = await createClient();

  const [{ data: row }, { members }, teamPeople, picked, tickRes] = await Promise.all([
    supabase.from("week_items").select("*").eq("id", id).is("owner_id", null).maybeSingle(),
    activeMembers(supabase),
    supabase.from("team_members").select("team_id, user_id"),
    supabase.from("week_item_members").select("item_id, user_id").eq("item_id", id),
    supabase.from("week_ticks").select("*").eq("item_id", id).eq("week_start", week),
  ]);
  const item = row as WeekItem | null;
  if (!item) notFound();

  const teamsOf = new Map<string, Set<string>>();
  for (const r of teamPeople.data ?? []) teamsOf.set(r.user_id, (teamsOf.get(r.user_id) ?? new Set()).add(r.team_id));
  const selected = new Map([[id, new Set((picked.data ?? []).map((r) => r.user_id as string))]]);
  const ticks = (tickRes.data ?? []) as WeekTick[];
  const tickOf = new Map(ticks.map((t) => [t.user_id, t]));
  const weekEnd = addWeeks(week, 1);
  const meant = inWeek(item, week)
    ? members.filter((m) => m.created_at.slice(0, 10) < weekEnd && forPerson(item, m.id, teamsOf.get(m.id) ?? new Set(), selected))
    : [];

  const withFiles = ticks.filter((t) => t.file_path);
  const urls = await Promise.all(withFiles.map((t) => supabase.storage.from("submissions").createSignedUrl(t.file_path!, 60 * 60).then((r) => r.data?.signedUrl ?? null)));
  const fileUrl = new Map(withFiles.map((t, i) => [t.user_id, urls[i]]));

  const people = meant.map((m) => ({ id: m.id, name: displayName(m), tick: tickOf.get(m.id) ?? null }));
  const work = people.filter((p) => handedIn(p.tick)).sort((a, b) => (b.tick!.updated_at ?? "").localeCompare(a.tick!.updated_at ?? ""));
  const toRead = work.filter((p) => !p.tick!.reviewed_at);
  const read = work.filter((p) => p.tick!.reviewed_at);
  const tickedOnly = people.filter((p) => p.tick && !handedIn(p.tick));
  const notYet = people.filter((p) => !p.tick);
  const nudge = (name: string) =>
    `Hi ${name.split(" ")[0]}, just a reminder to hand in "${item.title}"${item.submit_prompt ? ` (${item.submit_prompt.charAt(0).toLowerCase()}${item.submit_prompt.slice(1)})` : ""}. You can do it on the This Week page. 🙏`;

  const card = (p: (typeof work)[number]) => {
    const t = p.tick!;
    return (
      <li key={p.id} id={`p-${p.id}`} className="rounded-md border border-steel bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={`/admin/members/${p.id}`} className="font-medium text-paper hover:text-gold-text">
            {p.name}
          </Link>
          <span className="text-xs text-paper-dim">Handed in {lagosDateTime(t.updated_at ?? t.created_at)}</span>
        </div>
        {t.body && <div className="mt-3 max-h-96 overflow-y-auto whitespace-pre-line rounded-sm bg-dusk/50 p-4 leading-relaxed text-paper">{t.body}</div>}
        {t.file_path && (
          <a
            href={fileUrl.get(p.id) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-3 rounded-sm border border-steel px-4 py-3 text-sm hover:border-gold"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-night text-lg text-starlight" aria-hidden="true">
              📄
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-paper">{t.file_name ?? "File"}</span>
              <span className="text-xs text-paper-dim">{fileKind(t.file_name)} · tap to open or download</span>
            </span>
          </a>
        )}
        <form action={reviewHandIn} className="mt-4 border-t border-steel pt-4">
          <input type="hidden" name="item_id" value={id} />
          <input type="hidden" name="user_id" value={p.id} />
          <input type="hidden" name="week" value={week} />
          <label htmlFor={`fb-${p.id}`} className="text-sm text-paper">
            {t.reviewed_at ? "Your reply" : "Reply (optional)"}
          </label>
          <textarea
            id={`fb-${p.id}`}
            name="feedback"
            rows={2}
            maxLength={4000}
            defaultValue={t.feedback ?? ""}
            placeholder={`Encourage ${p.name.split(" ")[0]}, or ask them to go deeper…`}
            className="mt-1.5 w-full rounded-sm border border-steel bg-white px-3 py-2 text-sm text-paper outline-none focus:border-gold"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button className="h-9 rounded-sm bg-gold px-4 text-sm font-medium text-ink hover:bg-gold-soft">{t.reviewed_at ? "Update reply" : "Send reply"}</button>
            {!t.reviewed_at && <span className="text-xs text-paper-dim">Leave it empty to just mark it as read.</span>}
            {t.reviewed_at && <span className="text-xs text-[#24613a]">✓ Read {lagosDateTime(t.reviewed_at)}</span>}
          </div>
        </form>
      </li>
    );
  };

  return (
    <div>
      <Link href={`/admin/week?w=${week}#item-${id}`} className="text-sm text-gold-text hover:underline">
        ← This Week, {weekLabel(week)}
      </Link>
      <div className="mt-4">
        <AdminHeader title={item.title} description={item.submit_prompt ?? item.details ?? undefined} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill tone={item.submit === "required" ? "red" : "grey"}>📎 Hand-in {item.submit ?? "none"}</Pill>
        <Pill tone="blue">Week of {weekLabel(week)}</Pill>
      </div>

      {typeof query.note === "string" && (
        <p className="mt-6 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-3 text-sm text-[#24613a]" role="status">
          {query.note}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Handed in", value: `${work.length}/${people.length}` },
          { label: "To read", value: toRead.length },
          { label: "Ticked, nothing handed in", value: tickedOnly.length },
          { label: "Not yet", value: notYet.length },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-steel bg-white p-4">
            <p className="text-xs text-paper-dim">{s.label}</p>
            <p className="mt-1 font-display text-3xl text-paper">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-2xl text-paper">To read</h2>
            {toRead.length === 0 ? (
              <p className="mt-3 rounded-md border border-dashed border-steel bg-white/60 px-6 py-10 text-center text-paper-dim">
                {work.length ? "You've read everything handed in. 🙌" : "Nothing handed in yet."}
              </p>
            ) : (
              <ul className="mt-4 space-y-4">{toRead.map(card)}</ul>
            )}
          </section>
          {read.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-paper">Read</h2>
              <ul className="mt-4 space-y-4">{read.map(card)}</ul>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:self-start">
          <section className="rounded-md border border-steel bg-white p-5">
            <h2 className="font-display text-xl text-paper">Not handed in yet</h2>
            {notYet.length + tickedOnly.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Everyone has handed in. 🙌</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...notYet, ...tickedOnly].map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-paper">
                      {p.name}
                      {p.tick && <span className="ml-1 text-xs text-paper-dim">(ticked)</span>}
                    </span>
                    <Link href={`/admin/messages?m=${p.id}&draft=${encodeURIComponent(nudge(p.name))}`} className="shrink-0 text-gold-text hover:underline">
                      Message
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="text-xs leading-relaxed text-paper-dim">Your reply shows under their item on This Week and goes to their phone if alerts are on. Files open in a new tab for an hour; reload the page for a fresh link.</p>
        </aside>
      </div>
    </div>
  );
}
