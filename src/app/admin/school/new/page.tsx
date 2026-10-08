import { AdminHeader } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";
import { saveCourse } from "../../discipleship/actions";

export default function NewCourse() {
  return (
    <div>
      <AdminHeader title="New course" description="Add lessons with a video, teaching notes, a scripture and a short quiz." />
      <div className="mt-8">
        <CourseForm action={saveCourse} />
      </div>
    </div>
  );
}
