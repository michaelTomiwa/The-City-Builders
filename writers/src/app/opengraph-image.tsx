import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = site.fullName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "radial-gradient(circle at 15% 10%, #7c3aed 0%, transparent 55%), radial-gradient(circle at 90% 95%, #2563eb 0%, transparent 55%), #0a0720",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", opacity: 0.85 }}>
          {site.fullName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 108, fontWeight: 900, lineHeight: 0.9, letterSpacing: -4, textTransform: "uppercase" }}>
          <span>Scripts that</span>
          <span>refuse to be</span>
          <span style={{ color: "#38bdf8" }}>quiet.</span>
        </div>
        <div style={{ fontSize: 28, opacity: 0.75 }}>Film · TV · Stage · Audio · Brand</div>
      </div>
    ),
    size,
  );
}
