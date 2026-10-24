import type { MetadataRoute } from "next";

const BASE = process.env.APP_BASE_URL ?? "https://lacuno-app.vercel.app";

// Only the public pages are worth indexing; everything else needs sign-in.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/$", "/help"], disallow: ["/api/", "/auth/"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
