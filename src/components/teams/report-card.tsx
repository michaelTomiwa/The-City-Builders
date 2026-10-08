import { lagosDateTime } from "@/lib/discipleship";
import { healthLabels, type TeamReport } from "@/lib/teams";

export function ReportCard({ r }: { r: TeamReport }) {
  const rows: [string, string | null][] = [
    ["What God is doing", r.god_doing],
    ["Growth", r.growth],
    ["Wins", r.wins],
    ["Concerns", r.concerns],
    ["Prayer points", r.prayer],
  ];
  return (
    <article className="rounded-md border border-steel bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-paper">
          {r.author_name ?? "Lead"} · {lagosDateTime(r.created_at).split(",").slice(0, 2).join(",")}
        </p>
        {r.health && <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs text-gold-text">{healthLabels[r.health]}</span>}
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium uppercase tracking-wide text-paper-dim">{k}</dt>
              <dd className="whitespace-pre-line text-paper">{v}</dd>
            </div>
          ))}
      </dl>
      {r.pastor_reply && (
        <div className="on-night mt-4 rounded-sm bg-night p-3 text-starlight">
          <p className="text-xs text-lamp">Pastor&rsquo;s reply</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{r.pastor_reply}</p>
        </div>
      )}
    </article>
  );
}

