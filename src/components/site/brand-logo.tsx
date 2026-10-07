import { LogoMark } from "./logo-mark";
import { cn } from "@/lib/utils";

/** The church logo: the one uploaded in admin Settings, or the built-in City Builders mark. */
export function BrandLogo({ src, className }: { src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("object-contain", className)} />;
  }
  return <LogoMark className={className} />;
}
