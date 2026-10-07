import { getMember, getMemberData } from "@/lib/member-data";
import { growth, levels, streak } from "@/lib/discipleship";
import { NotifyMe } from "@/components/site/notify-me";
import { updateProfile } from "../actions";
import { cn } from "@/lib/utils";

const field = "mt-1.5 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper outline-none focus:border-gold";

export default async function ProfilePage({ searchParams }: PageProps<"/me/profile">) {
  const params = await searchParams;
  const { profile, user } = await getMember();
  const { checkins, submissions, programs, steps } = await getMemberData();
  const reviewed = submissions.filter((s) => s.status === "reviewed").length;
  const g = growth(checkins.length + reviewed * 5);
  const done = new Set(checkins.map((c) => c.step_id));
  const finishedPrograms = programs.filter((p) => {
    const own = steps.filter((s) => s.program_id === p.id);
    return own.length > 0 && own.every((s) => done.has(s.id));
  }).length;

  const stats = [
    { label: "Steps kept", value: checkins.length },
    { label: "Programmes completed", value: finishedPrograms },
    { label: "Assignments reviewed", value: reviewed },
    { label: "Current streak", value: streak(checkins.map((c) => c.created_at)) },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div>
        <h1 className="font-display text-4xl text-paper">Your growth</h1>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-md border border-steel bg-white p-4">
              <dd className="font-display text-3xl text-paper">{s.value}</dd>
              <dt className="mt-1 text-xs text-paper-dim">{s.label}</dt>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 font-display text-2xl text-paper">The growth path</h2>
        <ol className="mt-4 space-y-3">
          {levels.map((l, i) => {
            const reached = i <= g.index;
            return (
              <li key={l.name} className={cn("flex items-center gap-4 rounded-md border p-4", i === g.index ? "border-gold bg-gold/10" : "border-steel bg-white", !reached && "opacity-60")}>
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg", reached ? "bg-gold text-ink" : "bg-dusk text-paper-dim")}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-paper">
                    {l.name}
                    {i === g.index && <span className="ml-2 text-xs font-normal text-gold-text">You are here</span>}
                  </span>
                  <span className="text-sm text-paper-dim">{l.line}</span>
                </span>
                <span className="shrink-0 text-xs text-paper-dim">{l.min}+ pts</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-paper-dim">One point for every step you keep, five for every assignment the pastor reviews.</p>
      </div>

      <aside className="space-y-6">
        <form action={updateProfile} className="rounded-md border border-steel bg-white p-5">
          <h2 className="font-display text-xl text-paper">Your details</h2>
          {params.saved && (
            <p className="mt-3 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-3 py-2 text-sm text-[#24613a]" role="status">
              Saved.
            </p>
          )}
          <label className="mt-4 block text-sm text-paper">
            Full name
            <input name="full_name" defaultValue={profile?.full_name ?? ""} className={field} />
          </label>
          <label className="mt-3 block text-sm text-paper">
            Phone
            <input name="phone" type="tel" defaultValue={profile?.phone ?? ""} className={field} />
          </label>
          <p className="mt-3 text-sm text-paper-dim">Email: {user?.email}</p>
          <button className="mt-4 rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Save</button>
        </form>
        <div className="on-night rounded-md bg-night p-5 text-starlight">
          <h2 className="font-display text-xl">Never miss a watch</h2>
          <p className="mt-1 text-sm text-starlight-dim">Get an alert on this phone 5 minutes before Night Watch and Morning Prayers.</p>
          <NotifyMe className="mt-4" />
        </div>
      </aside>
    </div>
  );
}
