import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NetTriage AI - Telecom Incident Triage Assistant",
  description: "Autonomous alert storm clustering and runbook triage assistant for network and security operations centers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-[#070913] text-slate-100 min-h-screen flex antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden`}
      >
        <Sidebar />
        <main className="flex-1 min-w-0 h-screen overflow-y-auto relative">
          {/* Ambient Lighting Mesh */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[130px]" />
            <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px]" />
            <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
          </div>
          <div className="relative z-10 min-h-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
