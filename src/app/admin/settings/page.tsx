import { createClient } from "@/lib/supabase-server";
import { AdminHeader, Panel, fieldHint, fieldLabel, smallButton } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/admin/image-field";
import { DEFAULT_PASTOR_IMAGE } from "@/lib/settings";
import { deleteGivingLink, saveAnnouncement, saveBrand, saveGivingLink } from "../actions";

const STORAGE_LIMIT = 1024 * 1024 * 1024; // Supabase free plan: 1 GB of files

function megabytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminSettings({ searchParams }: PageProps<"/admin/settings">) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: settings }, { data: links }, { data: usageRows }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("giving_links").select("*").order("label"),
    supabase.rpc("media_usage"),
  ]);
  const usage = (Array.isArray(usageRows) ? usageRows[0] : usageRows) as { bytes: number; files: number } | null;
  const used = Number(usage?.bytes ?? 0);
  const percent = Math.min(100, (used / STORAGE_LIMIT) * 100);

  return (
    <div>
      <AdminHeader title="Settings" description="Logo and photos, the site-wide announcement, and the giving options on the Give page." />

      <Panel className="mt-8">
        <h2 className="font-display text-2xl text-paper">Logo and photos</h2>
        <p className="mt-1 text-sm text-paper-dim">Change these any time. The whole site updates within a minute.</p>
        {params.saved === "brand" && (
          <p className="mt-4 rounded-md border border-[#bfe0c8] bg-[#eef8f0] px-4 py-2 text-sm text-[#24613a]" role="status">
            Saved. The site now shows your new images.
          </p>
        )}
        <form action={saveBrand} className="mt-5">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="max-w-xs">
              <ImageField
                name="logo_url"
                label="Logo"
                defaultValue={settings?.logo_url ?? ""}
                folder="brand"
                keepOriginal
                fit="contain"
                aspect="aspect-square"
                previewClassName="bg-night"
              />
              <p className={fieldHint}>
                Shown in the header and footer, on the dark night background. A PNG with a transparent background looks
                best. Remove it to go back to the built-in City Builders mark.
              </p>
            </div>
            <div className="max-w-xs">
              <ImageField
                name="pastor_image_url"
                label="Pastor's photo"
                defaultValue={settings?.pastor_image_url ?? ""}
                folder="brand"
                aspect="aspect-[4/5]"
              />
              <p className={fieldHint}>
                Used on the homepage welcome and the About page. A portrait photo works best.
                {!settings?.pastor_image_url && (
                  <>
                    {" "}
                    Right now the site uses{" "}
                    <a href={DEFAULT_PASTOR_IMAGE} target="_blank" rel="noopener noreferrer" className="text-gold-text underline">
                      this photo
                    </a>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
          <Button type="submit" className="mt-6">
            Save logo and photos
          </Button>
        </form>
      </Panel>

      <Panel className="mt-6">
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

      <Panel className="mt-6">
        <h2 className="font-display text-2xl text-paper">Image storage</h2>
        <p className="mt-1 text-sm text-paper-dim">
          Every uploaded image is resized first, usually to 150 to 400 KB, so the free 1 GB holds thousands of them.
        </p>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-dusk" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
          <div className={percent > 85 ? "h-full bg-[#c2492f]" : "h-full bg-gold"} style={{ width: `${Math.max(percent, 0.5)}%` }} />
        </div>
        <p className="mt-2 text-sm text-paper">
          {megabytes(used)} of 1 GB used · {Number(usage?.files ?? 0)} {Number(usage?.files ?? 0) === 1 ? "image" : "images"}
        </p>
      </Panel>
    </div>
  );
}
