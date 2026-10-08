import { getMember, getMemberData } from "@/lib/member-data";
import { firstName, lagosDateTime } from "@/lib/discipleship";
import { siteUrl } from "@/lib/site";
import { CopyButton } from "@/components/admin/copy-button";

export default async function InvitePage() {
  const { profile } = await getMember();
  const { invites } = await getMemberData();
  const link = `${siteUrl}/join?ref=${profile?.invite_code ?? ""}`;
  const message = `Hi! I'm part of The City Builders with Pastor Michael Tomiwa: Night Watch at 11 PM, Morning Prayers at 7 AM, Bible plans and a discipleship school. Join me: ${link}`;
  const joined = invites.filter((i) => i.status === "active").length;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <div className="on-night rounded-md bg-night p-6 text-starlight sm:p-10">
          <p className="text-lamp">Bring someone with you</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Invite a friend to build with us.</h1>
          <p className="mt-3 max-w-xl text-starlight-dim">
            Share your personal link. When someone joins through it and the pastor welcomes them, you both grow: you get 5 growth points, and
            they get a friend in the house.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-sm border border-night-3 bg-night-2 px-4 py-3 text-sm text-starlight">{link}</code>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-sm bg-[#25d366] px-5 font-medium text-white hover:bg-[#1fb457]"
            >
              Share on WhatsApp
            </a>
            <CopyButton text={link} label="Copy link" />
            <CopyButton text={message} label="Copy message" />
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl text-paper">People you&rsquo;ve invited</h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-paper-dim">No one yet. Who comes to mind? Send them the link today.</p>
        ) : (
          <ul className="mt-4 divide-y divide-steel rounded-md border border-steel bg-white">
            {invites.map((i, n) => (
              <li key={n} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-paper">{i.full_name ?? "New member"}</span>
                <span className="text-xs text-paper-dim">
                  {i.status === "active" ? "Joined" : i.status === "pending" ? "Waiting for approval" : "Not active"} · {lagosDateTime(i.joined_at).split(",").slice(0, 2).join(",")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="space-y-4">
        <div className="rounded-md border border-steel bg-white p-5 text-center">
          <p className="font-display text-5xl text-paper">{joined}</p>
          <p className="text-sm text-paper-dim">{joined === 1 ? "friend has joined" : "friends have joined"} through you</p>
          <p className="mt-2 text-xs text-gold-text">+{joined * 5} growth points</p>
        </div>
        <div className="rounded-md border border-steel bg-white p-5 text-sm text-paper-dim">
          <p className="font-medium text-paper">Ideas, {firstName(profile)}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Send it to one person you prayed for this week.</li>
            <li>Post it on your WhatsApp status before Night Watch.</li>
            <li>Invite your family to Morning Prayers together.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
