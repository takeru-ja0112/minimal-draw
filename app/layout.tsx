// "use client";
// import { useEffect } from "react";

import Toaster from "@/components/common/toast";
import BgObject from "@/components/organisms/BgObject";
import Header from "@/components/organisms/Header";
import type { Metadata } from "next";
import { ViewTransitions } from 'next-view-transitions';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minimal Draw",
  description: "Mini app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // useEffect(() => {
  //   if ("serviceWorker" in navigator) {
  //     navigator.serviceWorker
  //       .register("/custom-sw.js")
  //       .then((reg) => { console.log("SW registered!", reg); })
  //       .catch((err) => { console.error("SW registration failed!", err); alert("Service Worker登録に失敗しました。プッシュ通知は利用できません。"); });
  //   }
  // }, []);

  return (
    <ViewTransitions>
      <html lang="en">
        <head>
          <link rel="icon" href="/minimalDrawIcon.svg" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#fbbf24" />
          <link rel="apple-touch-icon" href="/minimalDrawIcon.svg" />
          <meta property="og:title" content="Minimal Draw" />
          <meta property="og:description" content="お題を線と丸と長方形で表現するボードゲーム！" />
          <meta property="og:image" content="/minimalDrawIcon.svg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-gray-100 to-gray-200 min-h-screen`}
        >
          <BgObject />
          {/* ヘッダーの高さ分全体をさげる */}
          <Header />
          <Toaster maxVisible={3} />
          <div className="pt-14">{children}</div>
          <footer className="text-center p-4 text-gray-500 text-sm">
            &copy; 2026, Takeru
          </footer>
        </body>
      </html>
    </ViewTransitions>
  );
}
