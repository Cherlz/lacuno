import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const peerHost = process.env.NEXT_PUBLIC_PEERJS_HOST
  ? ` http://${process.env.NEXT_PUBLIC_PEERJS_HOST}:* ws://${process.env.NEXT_PUBLIC_PEERJS_HOST}:* https://${process.env.NEXT_PUBLIC_PEERJS_HOST} wss://${process.env.NEXT_PUBLIC_PEERJS_HOST}`
  : "";

// Content Security Policy: scripts, styles, fonts and API calls only from this
// site. Images may come from https (account pictures) and blob: (record photos
// stored on the device). The app can't be embedded in other sites.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  // PeerJS only introduces the laptop and phone; photos then go device to device.
  // OpenStreetMap: the "nearby hospitals" search runs from the browser.
  `connect-src 'self' https://0.peerjs.com wss://0.peerjs.com https://overpass-api.de https://nominatim.openstreetmap.org${peerHost}`,
  "media-src 'self' blob:",
  "frame-src 'self' blob: https://www.youtube-nocookie.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.auth0.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Self-contained server build for the Docker image (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API answers contain health information: never cache them anywhere.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
