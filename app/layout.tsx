import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acadia Base Camp",
  description: "Aug 14–16, 2026 · Blackwoods Campground",
  appleWebApp: {
    capable: true,
    title: "Acadia",
    statusBarStyle: "black-translucent",
  },
};

// No maximumScale / userScalable: pinning the scale is the usual way to stop
// iOS zooming on an input focus, but every field here is already 16px, which
// prevents that on its own. Blocking zoom outright costs more than it saves on
// a phone read outdoors at arm's length.
export const viewport: Viewport = {
  themeColor: "#1F3D2B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* The same Google-hosted stylesheet the design reference uses; the
          build pipeline strips remote CSS @imports, so it must be a link.
          `precedence` opts into React's managed hoisting into <head>. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout covers every route; the rule targets the Pages Router */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
      <body>{children}</body>
    </html>
  );
}
