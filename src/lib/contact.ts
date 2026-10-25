// Support address shown on the Help page and in the footer. Override with
// NEXT_PUBLIC_SUPPORT_EMAIL (e.g. once a contact@ address on the domain exists).
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@lacuno.health";

// Demo video for the Help page: any YouTube link. Hidden until set.
export function demoVideoId(): string | null {
  const url = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
