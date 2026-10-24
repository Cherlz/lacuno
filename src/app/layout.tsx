import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ variable: "--font-sans-loaded", subsets: ["latin", "latin-ext", "vietnamese", "cyrillic"] });

export const metadata: Metadata = {
  title: "Throughline — connect the dots in your medical records",
  description:
    "Upload every record. Throughline shows where the doctors disagree, gives the case the multi-specialist review it never got, and hands the next doctor a one-page brief in their own language.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Throughline", statusBarStyle: "default" },
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
