import { ImageResponse } from "next/og";
import { eventLabel, getWedding } from "@/lib/wedding";

/* The card WhatsApp shows when the invitation link is shared. */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Wedding invitation";

async function bodoni(italic: boolean) {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@${italic ? 1 : 0},500&display=swap`, { signal: AbortSignal.timeout(4000) }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await fetch(url, { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** The adire tile as an image (no filters, so the image renderer draws it exactly). */
function adireSvg() {
  const ink = "#b9c4f0";
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<circle cx="${40 + Math.cos(a) * 33}" cy="${40 + Math.sin(a) * 33}" r="2.2" fill="${ink}"/>`;
  }).join("");
  const field = [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => `<circle cx="${98 + c * 13 + (r % 2) * 6}" cy="${96 + r * 15}" r="${r % 2 ? 2 : 3}" fill="${ink}"/>`)).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="t" width="160" height="160" patternUnits="userSpaceOnUse"><g fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"><circle cx="40" cy="40" r="26"/><circle cx="40" cy="40" r="17"/><path d="M100 10 V70 M136 10 V70 M100 18 H136 M100 30 H136 M100 42 H136 M100 54 H136 M100 66 H136"/><path d="M40 92 C 62 104, 62 136, 40 150 C 18 136, 18 104, 40 92 Z"/><path d="M40 98 V146" stroke-width="1.6"/></g><circle cx="40" cy="40" r="7" fill="${ink}"/>${dots}${field}</pattern><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#12164a" stop-opacity="0.95"/><stop offset="0.55" stop-color="#12164a" stop-opacity="0.75"/><stop offset="1" stop-color="#12164a" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#1e2466"/><rect width="1200" height="630" fill="url(#t)" opacity="0.3"/><rect width="1200" height="630" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const w = getWedding((await params).slug);
  const [regular, italic] = await Promise.all([bodoni(false), bodoni(true)]);
  const main = w ? (w.events.find((e) => e.id === w.mainEvent) ?? w.events[0]) : null;
  const d = main ? eventLabel(main) : null;
  const fonts = [
    ...(regular ? [{ name: "Bodoni", data: regular, style: "normal" as const, weight: 500 as const }] : []),
    ...(italic ? [{ name: "Bodoni", data: italic, style: "italic" as const, weight: 500 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Bodoni", color: "#f7f6fc" }}>
        <img src={adireSvg()} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 26, color: "#b9c4f0" }}>Together with their families</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
            <span style={{ fontSize: 96, lineHeight: 1 }}>{w?.groom ?? "Wedding"}</span>
            <span style={{ fontSize: 132, fontStyle: "italic", color: "#c8a24e", margin: "0 22px", lineHeight: 1 }}>&</span>
            <span style={{ fontSize: 96, lineHeight: 1 }}>{w?.bride ?? ""}</span>
          </div>
          {d && (
            <div style={{ fontSize: 40, fontStyle: "italic", marginTop: 26 }}>
              {`${d.weekday}, ${d.day} ${d.month} ${d.year}`}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 34 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ width: i === 4 ? 16 : 10, height: i === 4 ? 16 : 10, borderRadius: 99, background: i % 4 === 0 && i !== 4 ? "#c8a24e" : "#d8432f" }} />
            ))}
          </div>
          {w && <div style={{ fontSize: 30, color: "#b9c4f0", marginTop: 26 }}>{`${w.city} · ${w.hashtag}`}</div>}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
