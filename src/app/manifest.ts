import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The City Builders",
    short_name: "City Builders",
    description:
      "Night Watch at 11 PM and Morning Prayers at 7 AM, Lagos time. Sermons, prayer and the Word for the season with Pastor Michael Tomiwa.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#101c3a",
    theme_color: "#101c3a",
    categories: ["lifestyle", "education", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Join the watch", url: "/#watch", description: "The live stream" },
      { name: "Prayer wall", url: "/prayer", description: "Send a prayer request" },
      { name: "Sermons", url: "/sermons", description: "Every past message" },
    ],
  };
}
