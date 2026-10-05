export function LogoMark({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 180" fill="none" className={className} aria-hidden="true">
      <g stroke={color} strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter">
        {/* outer arch, voussoir segments */}
        <path d="M30 108 V72 A70 70 0 0 1 170 72 V108" />
        {/* radial dividers on outer arch (7 wedges) */}
        <path d="M30 108 V86 M170 108 V86" />
        <path d="M37 64 L50 82 M163 64 L150 82" strokeWidth="4" />
        <path d="M58 36 L68 58 M142 36 L132 58" strokeWidth="4" />
        <path d="M100 24 V48" strokeWidth="4" />
        {/* keystone wedge at top, filled */}
        <path
          d="M86 25 L114 25 L108 50 L92 50 Z"
          fill={color}
          stroke="none"
        />

        {/* inner arch */}
        <path d="M58 108 V82 A42 42 0 0 1 142 82 V108" />

        {/* hanging pendant from keystone */}
        <path d="M100 50 V72" strokeWidth="3.5" />
        <path d="M100 72 L108 82 L100 92 L92 82 Z" fill={color} stroke="none" />

        {/* skyline: three buildings, center tallest filled */}
        <path d="M68 108 V88 H92 V108" />
        <path d="M92 108 V62 H118 V108" fill={color} />
        <path d="M118 108 V94 H142 V108" />

        {/* baseline, four segments, first filled */}
        <path d="M22 108 H178 V122 H22 Z" />
        <path d="M22 108 V122 M68 108 V122 M118 108 V122 M142 108 V122" strokeWidth="3" />
        <path d="M23 109 H67 V121 H23 Z" fill={color} stroke="none" />
      </g>
    </svg>
  );
}
