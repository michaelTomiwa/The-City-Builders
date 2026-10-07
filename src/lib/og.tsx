import { ImageResponse } from "next/og";

/*
  The preview card WhatsApp, Facebook, X and iMessage show when a link to
  the site is shared: the night city, the City Builders mark, the page title
  and the daily service times.
*/

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 -2 172 128" fill="none"><g stroke="#f0b44c" stroke-width="4.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M30 108 V72 A70 70 0 0 1 170 72 V108"/><path d="M30 108 V86 M170 108 V86"/><path d="M37 64 L50 82 M163 64 L150 82" stroke-width="4"/><path d="M58 36 L68 58 M142 36 L132 58" stroke-width="4"/><path d="M100 24 V48" stroke-width="4"/><path d="M86 25 L114 25 L108 50 L92 50 Z" fill="#f0b44c" stroke="none"/><path d="M58 108 V82 A42 42 0 0 1 142 82 V108"/><path d="M100 50 V72" stroke-width="3.5"/><path d="M100 72 L108 82 L100 92 L92 82 Z" fill="#f0b44c" stroke="none"/><path d="M68 108 V88 H92 V108"/><path d="M92 108 V62 H118 V108" fill="#f0b44c"/><path d="M118 108 V94 H142 V108"/><path d="M22 108 H178 V122 H22 Z"/><path d="M22 108 V122 M68 108 V122 M118 108 V122 M142 108 V122" stroke-width="3"/><path d="M23 109 H67 V121 H23 Z" fill="#f0b44c" stroke="none"/></g></svg>`;
const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;

// The skyline along the bottom: [width, height, lit-window pattern]
const buildings: [number, number, number][] = [
  [70, 88, 3], [96, 124, 5], [60, 70, 2], [110, 150, 7], [80, 102, 4], [70, 78, 1],
  [150, 110, 0], [90, 138, 6], [64, 88, 3], [104, 120, 5], [76, 74, 2], [96, 132, 4],
];

const stars = [
  [60, 40], [180, 110], [320, 30], [470, 90], [610, 24], [760, 70], [880, 120],
  [1010, 40], [1130, 96], [240, 200], [700, 170], [1080, 210], [420, 160], [930, 260],
];

let gloockPromise: Promise<ArrayBuffer | null> | null = null;

/** Gloock, the site's display face, fetched once per server instance. Falls back to the default font. */
function loadGloock() {
  gloockPromise ??= (async () => {
    try {
      const css = await fetch("https://fonts.googleapis.com/css2?family=Gloock&display=swap", {
        signal: AbortSignal.timeout(4000),
      }).then((r) => r.text());
      const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) return null;
      return await fetch(url, { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer());
    } catch {
      return null;
    }
  })();
  return gloockPromise;
}

export async function renderOgImage({
  title,
  kicker,
  footer = "Night Watch 11:00 PM and Morning Prayers 7:00 AM, Lagos time",
}: {
  title: string;
  kicker?: string;
  footer?: string;
}) {
  const gloock = await loadGloock();
  const titleSize = title.length > 70 ? 54 : title.length > 42 ? 66 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(180deg, #0d1834 0%, #1b2a58 100%)",
          color: "#e9ecf5",
          fontFamily: "Hanken Grotesk, sans-serif",
        }}
      >
        {stars.map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: i % 3 === 0 ? 4 : 3,
              height: i % 3 === 0 ? 4 : 3,
              borderRadius: 4,
              background: "#e9ecf5",
              opacity: i % 2 === 0 ? 0.8 : 0.45,
            }}
          />
        ))}

        {/* the moon */}
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 60,
            width: 110,
            height: 110,
            borderRadius: 110,
            background: "#f4e7c6",
            boxShadow: "0 0 90px 20px rgba(244,231,198,0.25)",
          }}
        />

        {/* the city */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end", gap: 10 }}>
          {buildings.map(([w, h, lit], i) => (
            <div
              key={i}
              style={{
                width: w,
                height: h,
                background: "#0b1531",
                display: "flex",
                flexWrap: "wrap",
                alignContent: "flex-start",
                gap: 8,
                padding: "14px 10px",
              }}
            >
              {Array.from({ length: Math.floor((w - 20) / 16) * Math.floor((h - 28) / 22) }).map((_, j) => (
                <div
                  key={j}
                  style={{
                    width: 8,
                    height: 12,
                    background: (j * 7 + lit * 3) % 5 === 0 ? "#f0b44c" : "#16244a",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "56px 80px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} width={72} height={54} alt="" />
            <div style={{ display: "flex", fontSize: 30, fontFamily: gloock ? "Gloock" : "serif" }}>The City Builders</div>
          </div>
          {kicker && <div style={{ display: "flex", marginTop: 44, fontSize: 28, color: "#f0b44c" }}>{kicker}</div>}
          <div
            style={{
              display: "flex",
              marginTop: kicker ? 14 : 52,
              maxWidth: 900,
              fontSize: titleSize,
              lineHeight: 1.05,
              fontFamily: gloock ? "Gloock" : "serif",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 26, color: "#a9b1c9" }}>{footer}</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: gloock ? [{ name: "Gloock", data: gloock, weight: 400, style: "normal" }] : undefined,
    }
  );
}
