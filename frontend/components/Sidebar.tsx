"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Activity,
  VolumeX,
  BookOpen,
  Cpu,
  Server,
  Zap,
} from "lucide-react";
import { fetchIncidents, fetchNoiseAlerts, fetchRunbooks } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeCount, setActiveCount] = useState<number>(0);
  const [noiseCount, setNoiseCount] = useState<number>(0);
  const [runbookCount, setRunbookCount] = useState<number>(3);

  const refreshCounts = async () => {
    try {
      const [incidents, noise, runbooks] = await Promise.all([
        fetchIncidents().catch(() => []),
        fetchNoiseAlerts().catch(() => []),
        fetchRunbooks().catch(() => []),
      ]);
      setActiveCount(incidents.filter((i) => i.status !== "RESOLVED").length);
      setNoiseCount(noise.length);
      if (runbooks.length > 0) setRunbookCount(runbooks.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 8000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      href: "/",
      label: "Incident Triage",
      icon: ShieldAlert,
      badge: activeCount > 0 ? `${activeCount} Active` : null,
      badgeColor: "bg-rose-500/15 text-rose-300 border border-rose-500/25",
    },
    {
      href: "/noise",
      label: "Noise Queue",
      icon: VolumeX,
      badge: noiseCount > 0 ? `${noiseCount}` : null,
      badgeColor: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
    },
    {
      href: "/runbooks",
      label: "Runbook KB",
      icon: BookOpen,
      badge: `${runbookCount}`,
      badgeColor: "bg-sky-500/15 text-sky-300 border border-sky-500/25",
    },
  ];

  return (
    <aside className="w-64 glass-apple-sidebar flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 border border-white/10 text-sky-400 shadow-applePill">
              <Activity className="w-5 h-5 text-sky-400" />
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-apple-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-base">
                  NetTriage
                </span>
                <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-sky-300 border border-white/10">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-tight">
                Telecom SOC Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-medium text-slate-400/80 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.08] text-white shadow-applePill border border-white/[0.12]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-sky-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Telemetry Footer Status */}
      <div className="p-4">
        <div className="p-3.5 rounded-2xl glass-apple-card space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              API Gateway
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-apple-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              127.0.0.1:8000
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              Vector Index
            </span>
            <span className="text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full text-[11px] font-medium border border-sky-500/20">
              FAISS In-Memory
            </span>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              MTTI Target
            </span>
            <span className="text-slate-200 font-semibold">&lt; 45 Seconds</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
