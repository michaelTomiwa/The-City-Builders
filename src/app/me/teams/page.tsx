import Link from "next/link";
import { getMyTeams } from "@/lib/teams";
import { roleLabel } from "@/lib/teams";

export default async function MyTeams() {
  const teams = await getMyTeams();
  return (
    <div>
      <h1 className="font-display text-4xl text-paper sm:text-5xl">Your teams</h1>
      <p className="mt-2 max-w-xl text-paper-dim">Where you serve. See updates from your lead, your tasks, team prayer and meetings.</p>
      {teams.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-steel bg-white/60 px-6 py-12 text-center text-paper-dim">
          You&rsquo;re not on a team yet. The pastor places people on teams; speak to them if you&rsquo;d like to serve.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {teams.map(({ team, role, title }) => (
            <li key={team.id}>
              <Link href={`/me/teams/${team.slug}`} className="group flex overflow-hidden rounded-md border border-steel bg-white transition-colors hover:border-gold">
                <span className="w-2 shrink-0" style={{ backgroundColor: team.color }} />
                <span className="flex-1 p-5">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-2xl text-paper group-hover:text-gold-text">{team.name}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${team.color}26`, color: "#101c3a" }}>
                      {title || roleLabel[role]}
                    </span>
                  </span>
                  {team.description && <span className="mt-1 block text-sm text-paper-dim">{team.description}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
