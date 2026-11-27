import { ImageResponse } from "next/og";
import { LOGO_SVG } from "@/lib/brand";

/*
  The preview card WhatsApp, Facebook, X and iMessage show when a link to
  the site is shared: the night city, the City Builders mark, the page title
  and the daily service times.
*/

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString("base64")}`;

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
export function loadGloock() {
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
