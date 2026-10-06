import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/site/page-hero";
import { PrayerForm } from "@/components/site/prayer-form";

export const revalidate = 0;

type PublicPrayer = {
  id: string;
  name: string | null;
  request: string;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function PrayerPage() {
  const { data } = await supabase
    .from("prayer_requests")
    .select("id,name,request,created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  const prayers = (data ?? []) as PublicPrayer[];

  return (
    <>
      <PageHero
        title={<>Bring it to the wall.</>}
        intro={<>Share what&apos;s on your heart — with your name or without it. Our community prays over every request.</>}
      />
    <div className="mx-auto max-w-6xl px-6 py-16">

      <div className="mt-14 grid gap-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-gold-text">Share a request</h2>
          <div className="mt-6">
            <PrayerForm />
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-gold-text">The wall</h2>
          <ul className="mt-6 space-y-6">
            {prayers.map((p) => (
              <li key={p.id} className="border-t border-steel/60 pt-4">
                <p className="text-paper leading-relaxed">{p.request}</p>
                <p className="mt-2 text-xs text-paper-dim">
                  {p.name || "Anonymous"} · {timeAgo(p.created_at)}
                </p>
              </li>
            ))}
            {prayers.length === 0 && (
              <p className="text-paper-dim">
                No public requests yet — be the first to share.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}
