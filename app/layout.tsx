import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boiler Parts Compliance Mapper",
  description:
    "Pick a target market and operating pressure to see the applicable boiler code, required marking and what to request from your supplier. Compare two markets side by side.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap"
        />
        {/* Chillax is hosted by Fontshare. Replace this link with the embed code from the Chillax page if your Rivexa design system self-hosts it. */}
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=chillax@500,600,700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
