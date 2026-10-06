import { EventForm } from "@/components/admin/event-form";
import { saveEvent } from "../../actions";

export default function NewEvent() {
  return (
    <div>
      <h1 className="font-display text-4xl text-paper">Add an event</h1>
      <div className="mt-8">
        <EventForm action={saveEvent} />
      </div>
    </div>
  );
}
