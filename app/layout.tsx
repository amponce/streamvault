import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Movie Streams - AI-Powered Live TV",
  description: "Experience live TV like never before with AI-powered recommendations, smart scheduling, and a stunning glass UI. Movie Streams brings you 185+ channels with mood-based discovery and personalized suggestions.",
  keywords: ["IPTV", "streaming", "live TV", "AI recommendations", "TV guide", "EPG"],
  authors: [{ name: "Movie Streams" }],
  creator: "Movie Streams",
  openGraph: {
    title: "Movie Streams - AI-Powered Live TV",
    description: "Experience live TV like never before with AI-powered recommendations and a stunning glass UI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movie Streams - AI-Powered Live TV",
    description: "Experience live TV like never before with AI-powered recommendations and a stunning glass UI.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#8b5cf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#0a0a0f] overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
