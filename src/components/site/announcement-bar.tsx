import Link from "next/link";
import type { SiteSettings } from "@/lib/supabase";

/** The site-wide announcement the admin can switch on from Settings. */
export function AnnouncementBar({ settings }: { settings: SiteSettings | null }) {
  if (!settings?.announcement_active || !settings.announcement) return null;
  const link = settings.announcement_link;
  const external = link ? /^https?:\/\//.test(link) : false;

  return (
    <div className="bg-gold text-ink">
      <p className="mx-auto max-w-6xl px-6 py-2.5 text-center text-sm font-medium">
        {settings.announcement}
        {link &&
          (external ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="ml-3 underline underline-offset-4">
              Find out more
            </a>
          ) : (
            <Link href={link} className="ml-3 underline underline-offset-4">
              Find out more
            </Link>
          ))}
      </p>
    </div>
  );
}
