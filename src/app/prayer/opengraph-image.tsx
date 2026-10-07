import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "The City Builders prayer wall";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({ title: "Bring it to the wall. We will pray with you.", kicker: "Prayer wall" });
}
