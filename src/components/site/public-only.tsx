"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Hides the public site's header, footer and banner inside the admin and on wedding pages (which have their own look). */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/wedding")) return null;
  return <>{children}</>;
}
