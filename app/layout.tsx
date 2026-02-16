// /app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "P1 with Matt & Tommy Predictions Play-Along | F1 Fan Leaderboard",
  description:
    "Make F1 race and season predictions, earn points after every Grand Prix, and compete on the fan leaderboard.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "P1 with Matt & Tommy Predictions Play-Along",
    description:
      "F1 fan prediction game inspired by P1 with Matt & Tommy. Lock in picks before FP1 and climb the leaderboard.",
    url: "https://www.p1withmattandtommyfanpredictions.com",
    siteName: "P1 with Matt & Tommy Predictions Play-Along",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "P1 with Matt & Tommy Predictions Play-Along",
    description:
      "Compete with the P1 community by making F1 race and season predictions.",
    images: ["/og-image.png"]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Navbar />
        {/* top padding so content doesn't sit under fixed navbar */}
        <main className="pt-28 md:pt-16">{children}</main>
      </body>
    </html>
  );
}
