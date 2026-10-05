export function Skyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 320"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g className="skyline-draw" stroke="var(--gold)" strokeWidth="2">
        {/* horizon */}
        <path d="M0 300 H1200" strokeOpacity="0.5" />

        {/* building block 1 */}
        <path d="M40 300 V190 H140 V300" />
        <path d="M40 190 L90 160 L140 190" />

        {/* building block 2, taller */}
        <path d="M170 300 V120 H250 V300" />
        <path d="M185 140 H235 M185 165 H235 M185 190 H235 M185 215 H235 M185 240 H235" strokeOpacity="0.45" />

        {/* crane */}
        <path d="M290 300 V90 M290 90 H420 M290 130 L330 130 M400 90 V115" strokeWidth="2.5" />
        <path d="M400 115 L385 128 L415 128 Z" fill="var(--gold)" stroke="none" />

        {/* building block 3, central tallest */}
        <path d="M440 300 V70 H540 V300" />
        <path d="M455 95 H525 M455 125 H525 M455 155 H525 M455 185 H525 M455 215 H525 M455 245 H525" strokeOpacity="0.45" />
        <path d="M465 70 V40 M515 70 V40 M465 40 H515" />

        {/* scaffolding on block 4 */}
        <path d="M570 300 V200 H660 V300" />
        <path d="M570 220 H660 M570 260 H660 M595 200 V300 M635 200 V300" strokeOpacity="0.5" strokeDasharray="4 4" />

        {/* building block 5 */}
        <path d="M690 300 V150 H770 V300" />
        <path d="M705 170 H755 M705 200 H755 M705 230 H755 M705 260 H755" strokeOpacity="0.45" />

        {/* small spire cluster */}
        <path d="M800 300 V220 H850 V300" />
        <path d="M870 300 V180 H910 L930 150 L950 180 V300" />
        <path d="M970 300 V240 H1010 V300" />

        {/* far right, low */}
        <path d="M1040 300 V260 H1160 V300" />
        <path d="M1055 270 H1145" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}
