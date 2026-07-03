import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/shared/Layout";
import { SessionGuard } from "@/components/shared/SessionGuard";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AetherFlow AI | Autonomous Orchestration",
  description: "AI-powered Service Orchestrator for the Informal Economy",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${sora.variable} ${inter.variable} ${mono.variable} antialiased font-inter bg-black overflow-x-hidden`} suppressHydrationWarning>
        <div className="max-w-md mx-auto min-h-screen relative bg-background border-x border-white/[0.02]">
          <SessionGuard>
            <main className="min-h-screen">
              {children}
            </main>
            <BottomNav />
          </SessionGuard>
        </div>
      </body>
    </html>
  );
}
