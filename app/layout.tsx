import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fontUi = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Signal — HLS Stream Player",
  description:
    "Paste any HLS (.m3u8) stream URL and play it instantly with adaptive bitrate, live level telemetry, and a clean player console.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontUi.variable} ${fontMono.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
