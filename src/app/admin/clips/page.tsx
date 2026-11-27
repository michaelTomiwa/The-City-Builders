import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { ClipStudio } from "@/components/admin/clip-studio";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Clip studio" };

export default function ClipsPage() {
  return (
    <>
      <AdminHeader
        title="Clip studio"
        description="Turn part of a service into a Short: trim it, frame it vertical, add captions and the City Builders branding, then download an MP4. Clips up to 10 minutes. Everything happens on this computer; nothing is uploaded."
      />
      <ClipStudio siteHost={new URL(siteUrl).host} />
    </>
  );
}
