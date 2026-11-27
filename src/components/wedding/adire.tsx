/*
  Adire: Yoruba indigo resist-dyed cloth. Four hand-drawn motifs (the circle
  of "oniko" tie-dye, a ladder, a leaf and a dot field) repeat like a printed
  wrapper, with a faint wobble so it reads as cloth, not vector.
*/
export function Adire({ id, className, ink = "#b9c4f0", opacity = 0.32 }: { id: string; className?: string; ink?: string; opacity?: number }) {
  return (
    <svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <filter id={`${id}-cloth`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
        <pattern id={`${id}-tile`} width="160" height="160" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round">
            {/* oniko circle */}
            <circle cx="40" cy="40" r="26" />
            <circle cx="40" cy="40" r="17" />
            <circle cx="40" cy="40" r="7" fill={ink} stroke="none" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6;
              return <circle key={i} cx={40 + Math.cos(a) * 33} cy={40 + Math.sin(a) * 33} r="2.2" fill={ink} stroke="none" />;
            })}
            {/* ladder */}
            <path d="M100 10 V70 M136 10 V70" />
            {[18, 30, 42, 54, 66].map((y) => (
              <path key={y} d={`M100 ${y} H136`} />
            ))}
            {/* leaf */}
            <path d="M40 92 C 62 104, 62 136, 40 150 C 18 136, 18 104, 40 92 Z" />
            <path d="M40 98 V146 M40 112 L52 104 M40 112 L28 104 M40 126 L54 118 M40 126 L26 118 M40 140 L50 134 M40 140 L30 134" strokeWidth="1.6" />
            {/* dot field */}
            {[0, 1, 2, 3].flatMap((r) =>
              [0, 1, 2, 3].map((c) => <circle key={`${r}-${c}`} cx={98 + c * 13 + (r % 2) * 6} cy={96 + r * 15} r={r % 2 ? 2 : 3} fill={ink} stroke="none" />)
            )}
          </g>
          {/* the folds between squares of cloth */}
          <path d="M0 80 H160 M80 0 V160" stroke={ink} strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-tile)`} opacity={opacity} filter={`url(#${id}-cloth)`} />
    </svg>
  );
}
