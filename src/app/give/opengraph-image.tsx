import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "Give to The City Builders";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({ title: "Give toward the work.", kicker: "Give" });
}
