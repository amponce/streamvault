import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Show Streams - Live TV & Movies",
  description: "Stream live TV and movies with AI-powered recommendations, smart scheduling, and a stunning glass UI. Show Streams brings you 200+ channels with mood-based discovery and personalized suggestions.",
  keywords: ["streaming", "live TV", "movies", "AI recommendations", "TV guide", "EPG", "free streaming"],
  authors: [{ name: "Show Streams" }],
  creator: "Show Streams",
  applicationName: "Show Streams",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Show Streams",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Show Streams - Live TV & Movies",
    description: "Stream live TV and movies with AI-powered recommendations and a stunning glass UI.",
    type: "website",
    siteName: "Show Streams",
    url: "https://showstreams.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Show Streams - Live TV & Movies",
    description: "Stream live TV and movies with AI-powered recommendations and a stunning glass UI.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} antialiased bg-[#0a0a0f] overflow-hidden`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
