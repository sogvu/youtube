import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import CommandPalette from "@/components/CommandPalette";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnimalTrend AI - YouTube Animal Trend Analyzer",
  description: "AI-powered Research Platform for YouTube Animal Creators to discover viral patterns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-[#09090b] text-[#fafafa] flex overflow-hidden font-sans">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 h-screen overflow-y-auto flex flex-col relative">
            {children}
          </main>
          <CommandPalette />
        </AuthProvider>
      </body>
    </html>
  );
}
