export function Marquee({
  items,
  reverse = false,
  speed = "30s",
  className = "",
}: {
  items: string[];
  reverse?: boolean;
  speed?: string;
  className?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={`relative flex overflow-hidden ${className}`} aria-hidden>
      <div
        className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10"
        style={{ "--marquee-speed": speed, animationDirection: reverse ? "reverse" : "normal" } as React.CSSProperties}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            {item}
            <span className="text-purple-hot">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
