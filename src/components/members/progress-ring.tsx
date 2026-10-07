/** A circular progress ring with the percentage (or a label) in the middle. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 6,
  label,
  track = "rgba(169,177,201,0.25)",
  color = "#f0b44c",
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  track?: string;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-medium tabular-nums">{label ?? `${Math.round(v * 100)}%`}</span>
    </span>
  );
}
