import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Acadia Base Camp",
  description: "Aug 14–16, 2026 · Blackwoods Campground",
};

export const viewport: Viewport = {
  themeColor: "#1F3D2B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html>: Tailwind's @theme tokens resolve on
    // :root, which can't see variables scoped to <body>.
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
