import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fieldHint, fieldLabel } from "./ui";

type ChurchEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
};

function toLagosInput(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 16);
}

export function EventForm({ event, action }: { event?: ChurchEvent; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div>
        <label htmlFor="title" className={fieldLabel}>
          Name
        </label>
        <Input id="title" name="title" required defaultValue={event?.title ?? ""} placeholder="Compass: Day One" className="mt-2 bg-white" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className={fieldLabel}>
            Starts (Lagos time)
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toLagosInput(event?.starts_at ?? null)}
            className="mt-2 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper"
          />
        </div>
        <div>
          <label htmlFor="ends_at" className={fieldLabel}>
            Ends (optional)
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLagosInput(event?.ends_at ?? null)}
            className="mt-2 h-11 w-full rounded-sm border border-steel bg-white px-3 text-paper"
          />
        </div>
      </div>
      <p className={fieldHint}>The homepage countdown and &ldquo;Live now&rdquo; badge use these times. Without an end time we assume two hours.</p>
      <div>
        <label htmlFor="location" className={fieldLabel}>
          Where
        </label>
        <Input id="location" name="location" defaultValue={event?.location ?? "Online, YouTube Live"} className="mt-2 bg-white" />
      </div>
      <div>
        <label htmlFor="description" className={fieldLabel}>
          Details
        </label>
        <Textarea id="description" name="description" rows={5} defaultValue={event?.description ?? ""} className="mt-2 bg-white" />
      </div>
      <div>
        <label htmlFor="cover_image_url" className={fieldLabel}>
          Image link (optional)
        </label>
        <Input id="cover_image_url" name="cover_image_url" defaultValue={event?.cover_image_url ?? ""} className="mt-2 bg-white" />
      </div>
      <Button type="submit">{event ? "Save event" : "Add event"}</Button>
    </form>
  );
}
