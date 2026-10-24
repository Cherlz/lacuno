import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AccountGate } from "@/components/Account";
import { AppShell } from "@/components/AppShell";
import { authEnabled } from "@/lib/auth0";
import "./globals.css";

const inter = Inter({ variable: "--font-sans-loaded", subsets: ["latin", "latin-ext", "vietnamese", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "https://lacuno-app.vercel.app"),
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
  themeColor: "#0e6b68",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AccountGate enabled={authEnabled}>
          <AppShell>{children}</AppShell>
        </AccountGate>
      </body>
    </html>
  );
}
