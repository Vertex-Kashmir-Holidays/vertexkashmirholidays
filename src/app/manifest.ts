import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vertex Kashmir Holidays",
    short_name: "Vertex Kashmir",
    description:
      "Premium Kashmir tourism — curated honeymoon, family, adventure and luxury packages.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#166534",
    orientation: "portrait",
    icons: [
      {
        src: "/brand/icon.png",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/brand/icon.png",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
