import type { MetadataRoute } from "next";

const BASE = process.env.APP_BASE_URL ?? "https://lacuno.health";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/help`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
