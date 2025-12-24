import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { ApiKeyModal } from "@/components/ui/ApiKeyModal";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "16Styles AI Platform",
  description: "Unified AI Platform - Story Factory, ScriptGen, VietVoice Pro, SceneJSON Pro",
  keywords: ["AI", "Story", "Script", "Voice", "Scene", "JSON", "Vietnam"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100 min-h-screen`}>
        <Providers>
          <Navbar />
          <ApiKeyModal />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
