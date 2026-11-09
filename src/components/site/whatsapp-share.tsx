import { cn } from "@/lib/utils";

/** "Share on WhatsApp": opens WhatsApp (app or web) with the message and link ready to send. */
export function WhatsAppShare({
  text,
  url,
  label = "Share on WhatsApp",
  size = "md",
  className,
}: {
  text: string;
  url?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const message = url ? `${text}\n\n${url}` : text;
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-[#25d366] font-medium text-white transition-colors hover:bg-[#1fb457]",
        size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2.5 text-sm",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.03c-.24.68-1.42 1.32-1.95 1.36-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.13 1.01-2.42.27-.29.58-.36.78-.36h.56c.18.01.42-.07.66.5.24.58.83 2 .9 2.15.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.13.59.17.29.74 1.22 1.58 1.98 1.09.97 2 1.27 2.29 1.41.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.38-.24.65-.14.26.1 1.68.79 1.97.94.29.14.48.21.55.33.07.12.07.7-.17 1.38z" />
      </svg>
      {label}
    </a>
  );
}
