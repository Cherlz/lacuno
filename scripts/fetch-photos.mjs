// Downloads the homepage photos from Unsplash at build time into public/images,
// so they're self-hosted (no hotlinking). Uses Unsplash's own download links,
// which also counts the download for the photographer. Credits and licenses:
// docs/IMAGE_CREDITS.md. Never fails the build: if a download fails, that
// section falls back to a plain background.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const PHOTOS = {
  "hero.jpg": "BUNNEclz-yQ", // Vitaly Gariev, Unsplash License
  "papers.jpg": "uwinmIQD8nU", // Vitaly Gariev, Unsplash License
};

mkdirSync("public/images", { recursive: true });

for (const [file, id] of Object.entries(PHOTOS)) {
  const out = `public/images/${file}`;
  if (existsSync(out)) continue;
  try {
    const signal = AbortSignal.timeout(30_000);
    // The download link redirects to the image CDN; ask it for a 2400px JPEG
    // instead of the full-size original.
    const res = await fetch(`https://unsplash.com/photos/${id}/download?force=true`, { redirect: "manual", signal });
    const location = res.headers.get("location");
    if (!location) throw new Error(`no redirect (HTTP ${res.status})`);
    const url = new URL(location);
    url.searchParams.set("w", "2400");
    url.searchParams.set("q", "80");
    url.searchParams.set("fm", "jpg");
    const img = await fetch(url, { signal });
    if (!img.ok || !img.headers.get("content-type")?.startsWith("image/")) throw new Error(`HTTP ${img.status}`);
    writeFileSync(out, Buffer.from(await img.arrayBuffer()));
    console.log(`fetch-photos: saved ${out}`);
  } catch (err) {
    console.warn(`fetch-photos: skipped ${file} (${err.message})`);
  }
}
