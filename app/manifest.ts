import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Acadia Base Camp",
    short_name: "Acadia",
    description: "Aug 14–16, 2026 · Blackwoods Campground",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F3E8",
    theme_color: "#1F3D2B",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
