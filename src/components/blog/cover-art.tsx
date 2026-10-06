import { cn } from "@/lib/utils";

/** A post's cover image, or — when there isn't one — a lapis panel lettered with the title. */
export function CoverArt({
  src,
  title,
  className,
  large = false,
}: {
  src: string | null;
  title: string;
  className?: string;
  large?: boolean;
}) {
  if (src) {
    return (
      <span className={cn("block overflow-hidden bg-dusk-2", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      </span>
    );
  }

  const initial = title.trim().charAt(0).toUpperCase() || "C";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block overflow-hidden bg-[linear-gradient(160deg,#101c3a_0%,#1d2f63_60%,#3a3466_100%)]",
        className
      )}
    >
      <span className="absolute left-[12%] top-[18%] h-1 w-1 rounded-full bg-starlight/70" />
      <span className="absolute left-[70%] top-[12%] h-[3px] w-[3px] rounded-full bg-starlight/60" />
      <span className="absolute left-[84%] top-[34%] h-1 w-1 rounded-full bg-starlight/50" />
      <span className="absolute right-[10%] top-[12%] h-8 w-8 rounded-full bg-[#f4e7c6] shadow-[0_0_40px_6px_rgba(244,231,198,0.2)]" />
      <span
        className={cn(
          "absolute bottom-[16%] left-[7%] font-display leading-[0.8] text-lamp/90 transition-transform duration-700 group-hover:-translate-y-1",
          large ? "text-[9rem] sm:text-[12rem]" : "text-[6rem]"
        )}
      >
        {initial}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-[22%] bg-[linear-gradient(90deg,#0b1531_0_8%,transparent_8%_10%,#0b1531_10%_22%,transparent_22%_25%,#0b1531_25%_31%,transparent_31%_34%,#0b1531_34%_48%,transparent_48%_50%,#0b1531_50%_63%,transparent_63%_66%,#0b1531_66%_80%,transparent_80%_83%,#0b1531_83%_100%)] opacity-80" />
    </span>
  );
}
