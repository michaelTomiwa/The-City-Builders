/*
  The hero skyline: a city at night, under construction, with its windows
  coming on one by one. Generated from a fixed seed so the server and the
  browser always draw the same city.
*/

const WIDTH = 1440;
const HEIGHT = 360;
const GROUND = 352;

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Building = { x: number; w: number; h: number; layer: "back" | "front" };

function buildCity() {
  const rand = seeded(1110);
  const buildings: Building[] = [];

  for (const layer of ["back", "front"] as const) {
    let x = layer === "back" ? -20 : -10;
    while (x < WIDTH) {
      const w = 46 + Math.round(rand() * 70);
      const tall = layer === "back" ? 150 + rand() * 170 : 70 + rand() * 170;
      // keep the middle of the near row clear for the arch
      const overlapsArch = layer === "front" && x + w > 616 && x < 824;
      if (!overlapsArch) buildings.push({ x, w, h: Math.round(tall), layer });
      x += w + (layer === "back" ? 4 + rand() * 14 : 18 + rand() * 40);
    }
  }

  const windows: { x: number; y: number; lit: boolean; delay: number }[] = [];
  for (const b of buildings.filter((b) => b.layer === "front")) {
    const cols = Math.floor((b.w - 12) / 13);
    const rows = Math.floor((b.h - 20) / 17);
    const offset = (b.w - cols * 13 + 5) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = rand() < 0.28;
        windows.push({
          x: b.x + offset + c * 13,
          y: GROUND - b.h + 14 + r * 17,
          lit,
          delay: lit ? 0.4 + rand() * 2.6 : 0,
        });
      }
    }
  }

  return { buildings, windows };
}

const { buildings, windows } = buildCity();

export function NightCity({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="horizon-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b44c" stopOpacity="0" />
          <stop offset="1" stopColor="#f0b44c" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      <rect x="0" y="120" width={WIDTH} height={HEIGHT - 120} fill="url(#horizon-glow)" />

      {/* far row */}
      {buildings
        .filter((b) => b.layer === "back")
        .map((b, i) => (
          <rect key={`b${i}`} x={b.x} y={GROUND - b.h} width={b.w} height={b.h} fill="#1a2a57" />
        ))}

      {/* crane over the far row, working through the night */}
      <g stroke="#2c3f78" strokeWidth="3" fill="none">
        <path d="M1080 352 V40 M1060 40 H1260 M1080 40 L1120 18 L1160 40 M1080 70 L1110 40" />
        <path d="M1230 40 V96" strokeWidth="1.5" />
      </g>
      <rect x="1222" y="96" width="16" height="10" fill="#2c3f78" />
      <circle cx="1120" cy="16" r="3" fill="#e55a3c" className="animate-pulse" />

      {/* near row */}
      {buildings
        .filter((b) => b.layer === "front")
        .map((b, i) => (
          <rect key={`f${i}`} x={b.x} y={GROUND - b.h} width={b.w} height={b.h} fill="#0b1531" />
        ))}

      {/* the arch from the City Builders mark, standing in the middle of the city */}
      <g fill="#0b1531">
        <path d="M640 352 V250 A80 80 0 0 1 800 250 V352 H760 V262 A40 40 0 0 0 680 262 V352 Z" />
        <rect x="628" y="340" width="184" height="12" />
      </g>
      <path d="M708 176 H732 L727 196 H713 Z" fill="#f0b44c" className="window-lit" style={{ animationDelay: "3.1s" }} />

      {windows.map((w, i) =>
        w.lit ? (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width="8"
            height="10"
            fill="#f0b44c"
            className="window-lit"
            style={{ animationDelay: `${w.delay.toFixed(2)}s` }}
          />
        ) : (
          <rect key={i} x={w.x} y={w.y} width="8" height="10" fill="#16244a" />
        )
      )}

      <rect x="0" y={GROUND} width={WIDTH} height={HEIGHT - GROUND} fill="#0b1531" />
    </svg>
  );
}
