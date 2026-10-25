import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Source_Sans_3 } from "next/font/google";
import { AccountGate } from "@/components/Account";
import { AppShell } from "@/components/AppShell";
import { authEnabled } from "@/lib/auth0";
import "./globals.css";

// Headings: Plus Jakarta Sans (bold, contemporary). Body: Source Sans 3 (crisp, very readable).
// Both cover Vietnamese; Source Sans also covers Cyrillic, since briefs are written in many languages.
const body = Source_Sans_3({ variable: "--font-sans-loaded", subsets: ["latin", "latin-ext", "vietnamese", "cyrillic"], weight: ["400", "500", "600", "700"] });
const display = Plus_Jakarta_Sans({ variable: "--font-display-loaded", subsets: ["latin", "latin-ext", "vietnamese"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "https://lacuno.health"),
  openGraph: {
    title: "Lacuno: the case conference they never got",
    description: "Upload every medical record, in any language. See where doctors disagree, what was never checked, and get a one-page brief for the next doctor.",
    siteName: "Lacuno",
    type: "website",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  title: "Lacuno — connect the dots in your medical records",
  description:
    "Upload every record. Lacuno shows where the doctors disagree, gives the case the multi-specialist review it never got, and hands the next doctor a one-page brief in their own language.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Lacuno", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0b6b66",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <AccountGate enabled={authEnabled}>
          <AppShell>{children}</AppShell>
        </AccountGate>
      </body>
    </html>
  );
}
