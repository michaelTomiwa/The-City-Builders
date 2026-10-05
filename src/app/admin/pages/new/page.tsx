import { PageForm } from "@/components/admin/page-form";
import { savePage } from "../../actions";

export default function NewCustomPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-paper">New page</h1>
      <div className="mt-8">
        <PageForm action={savePage} />
      </div>
    </div>
  );
}
