/*
  Draws one frame of a Clip Studio clip onto a canvas: the video (cropped or
  fitted), captions, title, the City Builders mark, the pastor's name card and
  the closing card with the service times. The live preview and the export
  use this same function, so what you see is what you download.
*/

export type Aspect = "9:16" | "1:1" | "16:9";

export type ClipSettings = {
  aspect: Aspect;
  quality: 1080 | 720;
  layout: "fill" | "fit";
  focus: number; // 0 = left edge of the video, 1 = right edge (fill mode)
  zoom: number; // 1 to 2
  captionsOn: boolean;
  shortPhrases: boolean;
  captionStyle: "outline" | "box" | "gold";
  captionSize: "s" | "m" | "l";
  captionPos: "bottom" | "middle" | "top";
  title: string;
  showLogo: boolean;
  showName: boolean;
  nameLine: string;
  endCard: boolean;
  endLine: string;
};

export const END_CARD_SECONDS = 3;
export const NAME_CARD = { from: 0.6, to: 5.6 };

export function frameSize(aspect: Aspect, quality: 1080 | 720) {
  const short = quality;
  const long = Math.round((quality * 16) / 9);
  if (aspect === "9:16") return { w: short, h: long };
  if (aspect === "16:9") return { w: long, h: short };
  return { w: short, h: short };
}

export type Assets = { logo: HTMLImageElement | null; display: string; sans: string };

const GOLD = "#f0b44c";
const NIGHT = "#101c3a";
const STAR = "#e9ecf5";

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawVideo(ctx: CanvasRenderingContext2D, W: number, H: number, video: HTMLVideoElement, s: ClipSettings) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!vw || !vh) return;

  const cover = Math.max(W / vw, H / vh);
  if (s.layout === "fit") {
    // Blurred, darkened copy behind, the whole picture on top.
    ctx.save();
    ctx.filter = `blur(${Math.round(Math.max(W, H) / 40)}px) brightness(0.55)`;
    const bw = vw * cover * 1.1;
    const bh = vh * cover * 1.1;
    ctx.drawImage(video, (W - bw) / 2, (H - bh) / 2, bw, bh);
    ctx.restore();
    const fit = Math.min(W / vw, H / vh) * s.zoom;
    const fw = vw * fit;
    const fh = vh * fit;
    ctx.drawImage(video, (W - fw) / 2, (H - fh) / 2, fw, fh);
    return;
  }
  const scale = cover * s.zoom;
  const dw = vw * scale;
  const dh = vh * scale;
  const x = (W - dw) * s.focus;
  const y = (H - dh) / 2;
  ctx.drawImage(video, x, y, dw, dh);
}

function drawCaption(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, s: ClipSettings, a: Assets) {
  const base = Math.min(W, H);
  const size = Math.round(base * { s: 0.052, m: 0.066, l: 0.082 }[s.captionSize]);
  ctx.font = `800 ${size}px ${a.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const shown = s.captionStyle === "box" ? text : text.toUpperCase();
  const lines = wrap(ctx, shown, W * 0.82).slice(0, 3);
  const lh = size * 1.22;
  const centre = s.captionPos === "top" ? H * 0.24 : s.captionPos === "middle" ? H * 0.5 : s.aspect === "9:16" ? H * 0.7 : H * 0.83;
  const top = centre - ((lines.length - 1) * lh) / 2;

  if (s.captionStyle === "box") {
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const pad = size * 0.45;
    ctx.fillStyle = "rgba(16, 28, 58, 0.86)";
    roundRect(ctx, W / 2 - widest / 2 - pad, top - lh / 2 - pad * 0.5, widest + pad * 2, lines.length * lh + pad, size * 0.25);
    ctx.fill();
  }
  lines.forEach((l, i) => {
    const y = top + i * lh;
    if (s.captionStyle !== "box") {
      ctx.lineJoin = "round";
      ctx.lineWidth = size * 0.2;
      ctx.strokeStyle = "rgba(0,0,0,0.92)";
      ctx.strokeText(l, W / 2, y);
    }
    ctx.fillStyle = s.captionStyle === "gold" ? GOLD : "#ffffff";
    ctx.fillText(l, W / 2, y);
  });
}

function drawTitle(ctx: CanvasRenderingContext2D, W: number, H: number, title: string, s: ClipSettings, a: Assets) {
  const base = Math.min(W, H);
  const size = Math.round(base * 0.068);
  ctx.font = `400 ${size}px ${a.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrap(ctx, title, W * 0.84).slice(0, 2);
  const lh = size * 1.15;
  const top = s.aspect === "9:16" ? H * 0.115 : H * 0.12;
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = size * 0.4;
  ctx.fillStyle = STAR;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

function drawLogo(ctx: CanvasRenderingContext2D, W: number, H: number, a: Assets, s: ClipSettings) {
  if (!a.logo) return;
  const w = Math.min(W, H) * 0.12;
  const h = (w * 128) / 172;
  const m = Math.min(W, H) * 0.045;
  const y = s.aspect === "9:16" ? H * 0.035 : m;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = w * 0.15;
  ctx.drawImage(a.logo, m, y, w, h);
  ctx.restore();
}

function drawNameCard(ctx: CanvasRenderingContext2D, W: number, H: number, rel: number, s: ClipSettings, a: Assets) {
  const inT = ease((rel - NAME_CARD.from) / 0.5);
  const outT = ease((NAME_CARD.to - rel) / 0.5);
  const k = Math.min(inT, outT);
  if (k <= 0) return;
  const base = Math.min(W, H);
  const size = Math.round(base * 0.038);
  ctx.font = `700 ${size}px ${a.sans}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const parts = s.nameLine.split("·").map((p) => p.trim()).filter(Boolean);
  const main = parts[0] ?? "";
  const rest = parts.slice(1).join(" · ");
  const small = Math.round(size * 0.78);
  const mainW = ctx.measureText(main).width;
  ctx.font = `500 ${small}px ${a.sans}`;
  const restW = rest ? ctx.measureText(rest).width : 0;
  const pad = size * 0.7;
  const boxW = Math.max(mainW, restW) + pad * 2 + size * 0.25;
  const boxH = rest ? size * 2.9 : size * 1.9;
  const x = base * 0.06 - (1 - k) * boxW * 0.3;
  const y = s.aspect === "9:16" ? H * 0.53 : H - boxH - base * 0.08;

  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = "rgba(16, 28, 58, 0.9)";
  roundRect(ctx, x, y, boxW, boxH, size * 0.2);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, size * 0.25, boxH);
  ctx.font = `700 ${size}px ${a.sans}`;
  ctx.fillStyle = STAR;
  ctx.fillText(main, x + pad + size * 0.25, y + (rest ? size * 1.0 : boxH / 2));
  if (rest) {
    ctx.font = `500 ${small}px ${a.sans}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(rest, x + pad + size * 0.25, y + size * 2.0);
  }
  ctx.restore();
}

function drawEndCard(ctx: CanvasRenderingContext2D, W: number, H: number, cardT: number, s: ClipSettings, a: Assets) {
  const k = ease(cardT / 0.6);
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.75 * k;
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = k;

  const base = Math.min(W, H);
  const cx = W / 2;
  let y = H * (s.aspect === "16:9" ? 0.2 : 0.3);
  if (a.logo) {
    const lw = base * 0.3;
    const lh = (lw * 128) / 172;
    ctx.drawImage(a.logo, cx - lw / 2, y - (1 - k) * base * 0.03, lw, lh);
    y += lh + base * 0.07;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = STAR;
  ctx.font = `400 ${Math.round(base * 0.085)}px ${a.display}`;
  ctx.fillText("The City Builders", cx, y);
  y += base * 0.11;

  ctx.font = `700 ${Math.round(base * 0.045)}px ${a.sans}`;
  ctx.fillStyle = GOLD;
  ctx.fillText("Night Watch · 11 PM", cx, y);
  y += base * 0.065;
  ctx.fillText("Morning Prayers · 7 AM", cx, y);
  y += base * 0.06;
  ctx.font = `500 ${Math.round(base * 0.034)}px ${a.sans}`;
  ctx.fillStyle = "#a9b1c9";
  ctx.fillText("Every day, Lagos time · Join us live", cx, y);
  if (s.endLine.trim()) {
    y += base * 0.1;
    ctx.font = `600 ${Math.round(base * 0.036)}px ${a.sans}`;
    ctx.fillStyle = STAR;
    ctx.fillText(s.endLine.trim(), cx, y);
  }
  ctx.restore();
}

/**
 * One frame. `rel` is seconds since the clip's start; `cardT` is seconds into
 * the closing card (null while the clip itself is playing).
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  video: HTMLVideoElement,
  f: { rel: number; cardT: number | null; caption: string | null; s: ClipSettings; a: Assets }
) {
  const { s, a } = f;
  drawVideo(ctx, W, H, video, s);
  if (f.cardT !== null) {
    drawEndCard(ctx, W, H, f.cardT, s, a);
    return;
  }
  // A soft shade top and bottom so white text stays readable on bright video.
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0.35)");
  shade.addColorStop(0.2, "rgba(0,0,0,0)");
  shade.addColorStop(0.62, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  if (s.title.trim()) drawTitle(ctx, W, H, s.title.trim(), s, a);
  if (s.showLogo) drawLogo(ctx, W, H, a, s);
  if (s.showName && s.nameLine.trim()) drawNameCard(ctx, W, H, f.rel, s, a);
  if (s.captionsOn && f.caption) drawCaption(ctx, W, H, f.caption, s, a);
}

/** The best format this browser can record: MP4 where possible, else WebM. */
export function pickRecordingType() {
  if (typeof MediaRecorder === "undefined") return null;
  const types = ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}
