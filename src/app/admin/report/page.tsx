import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { reportText, weeklyReport } from "@/lib/report";
import { CopyButton } from "@/components/admin/copy-button";

export default async function WeeklyReport() {
  const supabase = await createClient();
  const r = await weeklyReport(supabase);
  const t = r.totals;
  const text = reportText(r);
  const max = Math.max(1, ...r.byDay.map((d) => d.night + d.morning));

  const tiles = [
    { label: "Active this week", value: `${t.active}/${t.members}` },
    { label: "Service check-ins", value: t.attendance },
    { label: "Steps kept", value: t.steps },
    { label: "Lessons passed", value: t.lessons },
    { label: "New sign-ups", value: t.newPeople },
    { label: "To review", value: t.toReview },
  ];

  return (
    <div>
      <AdminHeader title="Weekly report" description={`The week of ${r.range}. It arrives as an alert every Monday at 8 AM.`} />
      <div className="mt-6 flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-sm bg-[#25d366] px-5 text-sm font-medium text-white hover:bg-[#1fb457]">
          Share on WhatsApp
        </a>
        <CopyButton text={text} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((x) => (
          <Panel key={x.label} className="p-4 sm:p-4">
            <p className="text-xs text-paper-dim">{x.label}</p>
            <p className="mt-1 font-display text-3xl text-paper">{x.value}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-2xl text-paper">Attendance</h2>
          <div className="mt-5 flex h-44 items-end gap-3" role="img" aria-label="Check-ins per day">
            {r.byDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-paper-dim">{d.night + d.morning || ""}</span>
                <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-sm" style={{ height: `${((d.night + d.morning) / max) * 130 + 2}px` }}>
                  <div className="bg-[#7aa2e3]" style={{ flex: d.morning }} />
                  <div className="bg-night" style={{ flex: d.night }} />
                </div>
                <span className="text-xs text-paper-dim">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex gap-4 text-xs text-paper-dim">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-night" /> Night Watch</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#7aa2e3]" /> Morning Prayers</span>
          </p>
        </Panel>

        <Panel>
          <h2 className="font-display text-2xl text-paper">Most active</h2>
          {r.top.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">No activity yet this week.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {r.top.map((x, i) => (
                <li key={x.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="font-display text-xl text-gold/80">{i + 1}</span>
                    <Link href={`/admin/members/${x.id}`} className="text-paper hover:text-gold-text">
                      {x.name}
                    </Link>
                  </span>
                  <span className="text-paper-dim">{x.points} pts</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display text-2xl text-paper">Gone quiet</h2>
          <p className="mt-1 text-sm text-paper-dim">No activity for two weeks. A message could mean a lot.</p>
          {r.quiet.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">Everyone has been active. 🙌</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {r.quiet.map((x) => (
                <li key={x.id} className="flex justify-between gap-3">
                  <Link href={`/admin/members/${x.id}`} className="text-paper hover:text-gold-text">
                    {x.name}
                  </Link>
                  {x.phone && (
                    <a href={`https://wa.me/${x.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-text hover:underline">
                      WhatsApp
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display text-2xl text-paper">Follow-ups due</h2>
          {r.followUps.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">None due.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {r.followUps.map((f) => (
                <li key={f.id}>
                  <Link href={`/admin/members/${f.member_id}`} className="font-medium text-paper hover:text-gold-text">
                    {f.name}
                  </Link>
                  <p className="line-clamp-2 text-paper-dim">{f.body}</p>
                </li>
              ))}
            </ul>
          )}
          {r.newPeople.length > 0 && (
            <>
              <h3 className="mt-6 font-medium text-paper">New this week</h3>
              <p className="mt-1 text-sm text-paper-dim">{r.newPeople.map((x) => `${x.name}${x.status === "pending" ? " (waiting)" : ""}`).join(", ")}</p>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
