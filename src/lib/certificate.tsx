import { ImageResponse } from "next/og";
import { LOGO_SRC, loadGloock } from "@/lib/og";

/** A course certificate as a 1600×1131 PNG (A4 landscape proportions), ready to download and share. */
export async function renderCertificate({ name, course, date }: { name: string; course: string; date: string }) {
  const gloock = await loadGloock();
  const display = gloock ? "Gloock" : "serif";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#101c3a", padding: 36 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#fbf8f1",
            border: "3px solid #c9973a",
            outline: "1px solid #c9973a",
            outlineOffset: -18,
            padding: "70px 110px",
            color: "#101c3a",
            fontFamily: "sans-serif",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} width={110} height={82} alt="" style={{ filter: "brightness(0.85)" }} />
          <div style={{ display: "flex", marginTop: 18, fontSize: 26, letterSpacing: 8, color: "#a8730f" }}>THE CITY BUILDERS · DISCIPLESHIP SCHOOL</div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 84, fontFamily: display }}>Certificate of Completion</div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 30, color: "#4a5578" }}>This certifies that</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 92, fontFamily: display, color: "#101c3a", borderBottom: "2px solid #c9973a", paddingBottom: 8 }}>
            {name}
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#4a5578" }}>has faithfully completed</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 52, fontFamily: display, textAlign: "center" }}>{course}</div>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 30 }}>{date}</div>
              <div style={{ display: "flex", width: 300, height: 2, background: "#101c3a", marginTop: 8 }} />
              <div style={{ display: "flex", marginTop: 8, fontSize: 22, color: "#4a5578" }}>Date</div>
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#a8730f", fontStyle: "italic" }}>&ldquo;A city whose builder and maker is God.&rdquo;</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 40, fontFamily: display }}>Michael Tomiwa</div>
              <div style={{ display: "flex", width: 300, height: 2, background: "#101c3a", marginTop: 4 }} />
              <div style={{ display: "flex", marginTop: 8, fontSize: 22, color: "#4a5578" }}>Pastor, The City Builders</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1600,
      height: 1131,
      fonts: gloock ? [{ name: "Gloock", data: gloock, weight: 400, style: "normal" }] : undefined,
    }
  );
}
