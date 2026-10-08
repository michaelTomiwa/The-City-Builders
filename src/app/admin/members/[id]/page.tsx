import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Empty, Panel, Pill, fieldLabel, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { careTags } from "@/lib/care";
import { daysSince, displayName, growth, growthPoints, initials, lagosDateTime, lagosToday, streak, type Member } from "@/lib/discipleship";
import { addCareNote, deleteCareNote, setMemberStatus, toggleCareDone } from "../../discipleship/actions";

export default async function AdminMember({ params }: PageProps<"/admin/members/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: row }, checkins, subs, lessons, attendance, bible, notes, programs, assignments, courses, partners] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("step_checkins").select("program_id, note, shared, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("submissions").select("assignment_id, status, submitted_at").eq("user_id", id),
    supabase.from("lesson_progress").select("course_id, completed_at").eq("user_id", id),
    supabase.from("attendance").select("service_id, service_date, created_at").eq("user_id", id).order("service_date", { ascending: false }),
    supabase.from("bible_reading").select("day, read_at").eq("user_id", id),
    supabase.from("care_notes").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("programs").select("id, title"),
    supabase.from("assignments").select("id, title"),
    supabase.from("courses").select("id, title"),
    supabase.from("prayer_partners").select("user_a, user_b").or(`user_a.eq.${id},user_b.eq.${id}`),
  ]);
  if (!row) notFound();
  const m = row as Member;
  const c = checkins.data ?? [];
  const s = subs.data ?? [];
  const l = lessons.data ?? [];
  const a = attendance.data ?? [];
  const b = bible.data ?? [];
  const reviewed = s.filter((x) => x.status === "reviewed").length;
  const g = growth(growthPoints({ steps: c.length, reviewed, lessons: l.length, attendance: a.length, bibleDays: b.length }));
  const activity = [...c.map((x) => x.created_at), ...l.map((x) => x.completed_at), ...a.map((x) => x.created_at), ...b.map((x) => x.read_at)].sort().reverse();
  const last = activity[0] ?? null;
  const quietDays = last ? daysSince(last) : null;
  const title = (list: { id: string; title: string }[] | null, key: string) => list?.find((x) => x.id === key)?.title ?? "";
  const partnerId = (partners.data ?? []).map((p) => (p.user_a === id ? p.user_b : p.user_a))[0];
  const { data: partner } = partnerId ? await supabase.from("profiles").select("full_name, email").eq("id", partnerId).maybeSingle() : { data: null };
  const today = lagosToday();
  const { data: teamRows } = await supabase.from("team_members").select("role, title, teams(id, name, color)").eq("user_id", id);
  const memberTeams = (teamRows ?? []) as unknown as { role: string; title: string | null; teams: { id: string; name: string; color: string } | null }[];
  const { count: invited } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("invited_by", id);
  const careNotes = (notes.data ?? []) as { id: string; tag: string; body: string; follow_up_on: string | null; done: boolean; created_at: string }[];

  const stats = [
    { label: "Growth", value: g.level.name, sub: `${g.points} points` },
    { label: "Streak", value: String(streak(activity)), sub: "days" },
    { label: "Steps kept", value: String(c.length), sub: "in programmes" },
    { label: "Services", value: String(a.length), sub: "attended" },
    { label: "Lessons", value: String(l.length), sub: "passed" },
    { label: "Bible", value: String(b.length), sub: "days read" },
  ];

  return (
    <div>
      <Link href="/admin/members" className="text-sm text-paper-dim hover:text-gold-text">
        All members
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 font-display text-xl text-gold-text">{initials(m)}</span>
        <div className="min-w-0 flex-1">
          <AdminHeader title={displayName(m)} />
          <p className="text-sm text-paper-dim">
            {[m.email, m.phone].filter(Boolean).join(" · ")} · joined {lagosDateTime(m.created_at).split(",").slice(0, 2).join(",")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/messages?m=${m.id}`} className={smallButton}>
            Message
          </Link>
          {m.phone && (
            <a href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className={smallButton}>
              WhatsApp
            </a>
          )}
          {m.email && (
            <a href={`mailto:${m.email}`} className={smallButton}>
              Email
            </a>
          )}
          {m.status !== "active" && (
            <form action={setMemberStatus}>
              <input type="hidden" name="id" value={m.id} />
              <button name="status" value="active" className="rounded-sm bg-[#3d9a6a] px-3 py-1.5 text-sm font-medium text-white">
                Approve
              </button>
            </form>
          )}
        </div>
      </div>

      {quietDays !== null && quietDays >= 7 && (
        <p className="mt-5 rounded-md border border-[#ecc4ba] bg-[#fbefec] px-4 py-2 text-sm text-[#8a2f1e]">
          Quiet for {quietDays} days. A call or message might help.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((x) => (
          <Panel key={x.label} className="p-4 sm:p-4">
            <p className="text-xs text-paper-dim">{x.label}</p>
            <p className="mt-1 font-display text-2xl text-paper">{x.value}</p>
            <p className="text-xs text-paper-dim">{x.sub}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Panel>
            <h2 className="font-display text-2xl text-paper">Pastoral care</h2>
            <p className="mt-1 text-sm text-paper-dim">Private to staff. Set a follow-up date and it shows on your dashboard until you tick it off.</p>
            <form action={addCareNote} className="mt-4 space-y-3 rounded-md border border-steel bg-white p-4">
              <input type="hidden" name="member_id" value={m.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={fieldLabel}>
                  Kind
                  <select name="tag" defaultValue="note" className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm font-normal">
                    {Object.entries(careTags).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={fieldLabel}>
                  Follow up on (optional)
                  <input type="date" name="follow_up_on" min={today} className="mt-1 h-10 w-full rounded-sm border border-steel bg-white px-2 text-sm font-normal" />
                </label>
              </div>
              <textarea name="body" required rows={3} placeholder="What's happening, what was said, what to pray for…" className="w-full rounded-sm border border-steel px-3 py-2 text-sm text-paper outline-none focus:border-gold" />
              <button className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Add note</button>
            </form>
            {careNotes.length === 0 ? (
              <p className="mt-4 text-sm text-paper-dim">No notes yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {careNotes.map((n) => (
                  <li key={n.id} className="rounded-md border border-steel bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Pill tone={careTags[n.tag]?.tone ?? "grey"}>{careTags[n.tag]?.label ?? n.tag}</Pill>
                      <span className="text-xs text-paper-dim">{lagosDateTime(n.created_at)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper">{n.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {n.follow_up_on && (
                        <span className={!n.done && n.follow_up_on <= today ? "font-medium text-[#8a2f1e]" : "text-paper-dim"}>
                          Follow up {new Date(n.follow_up_on).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                          {n.done ? " · done" : ""}
                        </span>
                      )}
                      {n.follow_up_on && (
                        <form action={toggleCareDone}>
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="member_id" value={m.id} />
                          <input type="hidden" name="done" value={String(n.done)} />
                          <button className="text-gold-text hover:underline">{n.done ? "Reopen" : "Mark done"}</button>
                        </form>
                      )}
                      <form action={deleteCareNote}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="member_id" value={m.id} />
                        <ConfirmButton message="Delete this note?" className="text-paper-dim hover:text-[#8a2f1e]">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <h2 className="font-display text-2xl text-paper">Shared with you</h2>
            {c.filter((x) => x.shared && x.note).length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Nothing shared yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {c
                  .filter((x) => x.shared && x.note)
                  .slice(0, 10)
                  .map((x, i) => (
                    <li key={i} className="border-l-2 border-gold pl-3 text-sm">
                      <p className="text-paper">{x.note}</p>
                      <p className="text-xs text-paper-dim">
                        {title(programs.data, x.program_id)} · {lagosDateTime(x.created_at)}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-medium text-paper">Recent attendance</h2>
            {a.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">No check-ins yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {a.slice(0, 8).map((x, i) => (
                  <li key={i} className="flex justify-between text-paper">
                    {x.service_id === "night-watch" ? "Night Watch" : "Morning Prayers"}
                    <span className="text-paper-dim">{new Date(x.service_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel>
            <h2 className="font-medium text-paper">Assignments</h2>
            {s.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Nothing handed in yet.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {s.map((x) => (
                  <li key={x.assignment_id} className="flex justify-between gap-2">
                    <Link href={`/admin/assignments/${x.assignment_id}`} className="truncate text-paper hover:text-gold-text">
                      {title(assignments.data, x.assignment_id)}
                    </Link>
                    <span className="shrink-0 text-xs text-paper-dim">{x.status === "submitted" ? "to review" : x.status === "needs_work" ? "needs work" : "reviewed"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel>
            <h2 className="font-medium text-paper">School</h2>
            {l.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">No lessons yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {[...new Set(l.map((x) => x.course_id))].map((cid) => (
                  <li key={cid} className="flex justify-between text-paper">
                    {title(courses.data, cid)}
                    <span className="text-xs text-paper-dim">{l.filter((x) => x.course_id === cid).length} lessons</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel>
            <h2 className="font-medium text-paper">Teams</h2>
            {memberTeams.length === 0 ? (
              <p className="mt-2 text-sm text-paper-dim">Not on a team yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {memberTeams
                  .filter((t) => t.teams)
                  .map((t) => (
                    <li key={t.teams!.id} className="flex items-center justify-between gap-2">
                      <Link href={`/admin/teams/${t.teams!.id}`} className="flex items-center gap-2 text-paper hover:text-gold-text">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.teams!.color }} />
                        {t.teams!.name}
                      </Link>
                      <span className="text-xs text-paper-dim">{t.title || (t.role === "lead" ? "Team lead" : t.role === "assistant" ? "Assistant lead" : "Member")}</span>
                    </li>
                  ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-paper-dim">Invited {invited ?? 0} {invited === 1 ? "person" : "people"} to the site</p>
          </Panel>
          <Panel>
            <h2 className="font-medium text-paper">Prayer partner</h2>
            <p className="mt-2 text-sm text-paper">
              {partner && partnerId ? (
                <Link href={`/admin/members/${partnerId}`} className="hover:text-gold-text">
                  {displayName(partner)}
                </Link>
              ) : (
                <span className="text-paper-dim">None yet</span>
              )}
            </p>
            {m.prayer_need && <p className="mt-2 text-sm text-paper-dim">Prayer need: {m.prayer_need}</p>}
          </Panel>
          {last && <p className="text-xs text-paper-dim">Last active {lagosDateTime(last)}</p>}
        </div>
      </div>
      {careNotes.length === 0 && s.length === 0 && c.length === 0 && (
        <div className="mt-6">
          <Empty>Once {displayName(m).split(" ")[0]} starts taking part, their activity shows here.</Empty>
        </div>
      )}
    </div>
  );
}
