import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "Gatherings at The City Builders";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({ title: "Pray with us every day.", kicker: "Gatherings" });
}
