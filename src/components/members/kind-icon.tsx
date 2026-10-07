import { stepKinds, type StepKind } from "@/lib/discipleship";
import { cn } from "@/lib/utils";

/** The coloured badge for a step's kind: pray, fast, study and so on. */
export function KindIcon({ kind, className }: { kind: StepKind; className?: string }) {
  const k = stepKinds[kind] ?? stepKinds.custom;
  return (
    <span
      className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: `${k.color}22`, color: k.color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={k.icon} />
      </svg>
    </span>
  );
}
