import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Panel, fieldHint, fieldLabel, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteGivingLink, saveAnnouncement, saveGivingLink } from "../actions";

export default async function AdminSettings({ searchParams }: PageProps<"/admin/settings">) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: settings }, { data: links }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("giving_links").select("*").order("label"),
  ]);

  return (
    <div>
      <AdminHeader title="Settings" description="Site-wide announcement and the giving options on the Give page." />

      <Panel className="mt-8">
        <h2 className="font-display text-2xl text-paper">Announcement banner</h2>
        <p className="mt-1 text-sm text-paper-dim">A gold strip across the top of every page, for conferences, special services or urgent news.</p>
        {params.saved === "announcement" && (
          <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
            Announcement saved.
          </p>
        )}
        <form action={saveAnnouncement} className="mt-5 space-y-5">
          <div>
            <label htmlFor="announcement" className={fieldLabel}>
              Message
            </label>
            <Input
              id="announcement"
              name="announcement"
              maxLength={160}
              defaultValue={settings?.announcement ?? ""}
              placeholder="Join us for a 3-day Compass retreat, starting Friday at 11 PM"
              className="mt-2 bg-white"
            />
          </div>
          <div>
            <label htmlFor="announcement_link" className={fieldLabel}>
              Link (optional)
            </label>
            <Input
              id="announcement_link"
              name="announcement_link"
              defaultValue={settings?.announcement_link ?? ""}
              placeholder="/events or https://"
              className="mt-2 bg-white"
            />
            <p className={fieldHint}>Adds a &ldquo;Find out more&rdquo; link to the banner.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-paper">
            <input type="checkbox" name="announcement_active" defaultChecked={settings?.announcement_active ?? false} className="h-4 w-4 accent-gold" />
            Show the banner on the site
          </label>
          <Button type="submit">Save announcement</Button>
        </form>
      </Panel>

      <Panel className="mt-6">
        <h2 className="font-display text-2xl text-paper">Giving options</h2>
        <p className="mt-1 text-sm text-paper-dim">Each active option appears as a button on the Give page.</p>
        <ul className="mt-5 space-y-3">
          {(links ?? []).map((link) => (
            <li key={link.id} className="rounded-md border border-steel bg-white p-4">
              <form action={saveGivingLink} className="grid gap-3 sm:grid-cols-[1fr_1.6fr_auto_auto] sm:items-center">
                <input type="hidden" name="id" value={link.id} />
                <Input name="label" defaultValue={link.label} required aria-label="Button label" className="bg-white" />
                <Input name="url" defaultValue={link.url} required aria-label="Giving link" className="bg-white" />
                <label className="flex items-center gap-2 text-sm text-paper">
                  <input type="checkbox" name="is_active" defaultChecked={link.is_active} className="h-4 w-4 accent-gold" />
                  Active
                </label>
                <button className={smallButton}>Save</button>
              </form>
              <form action={deleteGivingLink} className="mt-2">
                <input type="hidden" name="id" value={link.id} />
                <ConfirmButton message={`Remove “${link.label}”?`} className="text-sm text-[#8a2f1e] hover:underline">
                  Remove
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={saveGivingLink} className="mt-5 grid gap-3 border-t border-steel pt-5 sm:grid-cols-[1fr_1.6fr_auto_auto] sm:items-center">
          <Input name="label" required placeholder="Give by card" aria-label="New button label" className="bg-white" />
          <Input name="url" required placeholder="https://flutterwave.com/…" aria-label="New giving link" className="bg-white" />
          <label className="flex items-center gap-2 text-sm text-paper">
            <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 accent-gold" />
            Active
          </label>
          <button className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft">Add option</button>
        </form>
      </Panel>
    </div>
  );
}
