"use client";

import { useOptimistic, useTransition } from "react";
import { prayForPartner } from "@/app/me/actions";

export type Partner = {
  partner_id: string;
  full_name: string | null;
  phone: string | null;
  prayer_need: string | null;
  prayed_for_me_today: boolean;
  i_prayed_today: boolean;
};

/** Your prayer partner: what to pray for, a one-tap "I prayed for you", and WhatsApp. */
export function PartnerCard({ partner }: { partner: Partner }) {
  const [prayed, setPrayed] = useOptimistic(partner.i_prayed_today);
  const [pending, start] = useTransition();
  const name = partner.full_name?.split(" ")[0] ?? "your partner";
  const phone = partner.phone?.replace(/[^0-9]/g, "");

  return (
    <section className="rounded-md border border-steel bg-white p-5">
      <p className="text-sm text-gold-text">Your prayer partner</p>
      <p className="mt-1 font-display text-2xl text-paper">{partner.full_name ?? "Partner"}</p>
      {partner.prayed_for_me_today && <p className="mt-1 text-sm text-[#24613a]">{name} prayed for you today 🙏</p>}
      <p className="mt-3 text-sm text-paper-dim">{partner.prayer_need ? <>Praying for: <span className="text-paper">{partner.prayer_need}</span></> : `${name} hasn't shared a prayer need yet.`}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={prayed || pending}
          onClick={() =>
            start(async () => {
              setPrayed(true);
              await prayForPartner();
            })
          }
          className={prayed ? "rounded-sm border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" : "rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft"}
        >
          {prayed ? `✓ You prayed for ${name} today` : `I prayed for ${name}`}
        </button>
        {phone && (
          <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-steel px-4 py-2 text-sm text-paper hover:border-gold">
            WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
