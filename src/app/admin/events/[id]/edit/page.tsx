import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { EventForm } from "@/components/admin/event-form";
import { saveEvent } from "../../../actions";

export default async function EditEvent({ params }: PageProps<"/admin/events/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();
  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Edit event</h1>
      <div className="mt-8">
        <EventForm event={event} action={saveEvent} />
      </div>
    </div>
  );
}
