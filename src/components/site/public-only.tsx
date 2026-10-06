"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Hides the public site's header, footer and banner inside the admin. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
