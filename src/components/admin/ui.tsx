import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-paper">{title}</h1>
        {description && <p className="mt-2 max-w-xl leading-relaxed text-paper-dim">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex h-10 shrink-0 items-center rounded-sm bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-gold-soft"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

const pillTones = {
  green: "bg-[#e3f1e6] text-[#24613a]",
  gold: "bg-gold/20 text-gold-text",
  blue: "bg-[#e1e9f6] text-[#29457a]",
  grey: "bg-dusk-2 text-paper-dim",
  red: "bg-[#f6e1dc] text-[#8a2f1e]",
};

export function Pill({ tone, children }: { tone: keyof typeof pillTones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", pillTones[tone])}>{children}</span>;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-md border border-steel bg-white/70 p-5 sm:p-6", className)}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-steel px-6 py-12 text-center text-paper-dim">{children}</p>;
}

export function Tabs({
  items,
  active,
}: {
  items: { href: string; label: string; count?: number; id: string }[];
  active: string;
}) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-md bg-dusk p-1" aria-label="Filter">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
          className={cn(
            "rounded px-3.5 py-1.5 text-sm transition-colors",
            active === item.id ? "bg-white text-paper shadow-sm" : "text-paper-dim hover:text-paper"
          )}
        >
          {item.label}
          {item.count !== undefined && <span className="ml-1.5 text-paper-dim">{item.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export const fieldLabel = "text-sm font-medium text-paper";
export const fieldHint = "mt-1 text-sm text-paper-dim";
export const smallButton =
  "rounded-sm border border-steel bg-white px-3 py-1.5 text-sm text-paper transition-colors hover:border-gold hover:text-gold-text";
