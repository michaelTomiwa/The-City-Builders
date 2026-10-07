import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "The City Builders: a city whose builder and maker is God";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({ title: "A city whose builder and maker is God." });
}
