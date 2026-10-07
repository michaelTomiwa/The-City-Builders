import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "The City Builders watch room";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({ title: "Keep watch with us, live.", kicker: "The watch room" });
}
