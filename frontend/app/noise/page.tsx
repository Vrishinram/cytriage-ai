"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Info,
  VolumeX,
  Radio,
} from "lucide-react";
import { fetchNoiseAlerts, Alert } from "@/lib/api";

export default function NoiseQueuePage() {
  const [noiseAlerts, setNoiseAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadNoise = async () => {
    try {
      setLoading(true);
      const data = await fetchNoiseAlerts();
      setNoiseAlerts(data);
    } catch (err) {
      console.error("Failed to load noise alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNoise();
  }, []);

  const filteredAlerts = noiseAlerts.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.message.toLowerCase().includes(q) ||
      a.source_device.toLowerCase().includes(q) ||
      a.subsystem.toLowerCase().includes(q) ||
      (a.noise_reason && a.noise_reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Suppressed Noise Queue
            </h1>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-applePill">
              {noiseAlerts.length} Alerts Isolated
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Low-severity background telemetry filtered by deterministic pre-processing to eliminate operator alert fatigue.
          </p>
        </div>

        <button
          onClick={loadNoise}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-200 text-xs font-medium shadow-applePill transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : "text-slate-400"}`} />
          Refresh Queue
        </button>
      </div>

      {/* Noise Explanation Banner */}
      <div className="p-6 rounded-3xl glass-apple flex items-start gap-4 shadow-apple">
        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-white flex items-center gap-2 text-sm">
            Automated Noise Suppression Policy Active
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-apple-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </span>
          <p className="text-slate-300 leading-relaxed">
            Alerts in this queue are isolated from incident parent clusters because they match verified benign operational signatures (e.g. routine NTP stratum jitter, scheduled log rotation, nominal fan duty curves, and transient ICMP drops with auto-recovery).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search noise logs by device or suppression reason..."
            className="w-full pl-11 pr-4 py-2.5 glass-apple-input rounded-2xl text-xs placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredAlerts.length} of {noiseAlerts.length} suppressed logs
        </div>
      </div>

      {/* Noise Table */}
      <div className="rounded-3xl glass-apple-card overflow-hidden shadow-apple">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/[0.06] font-semibold">
              <tr>
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Device</th>
                <th className="p-4">Subsystem</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Telemetry Message</th>
                <th className="p-4 pr-6">Suppression Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No noise logs matching filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="p-4 pl-6 font-mono text-slate-400 whitespace-nowrap">
                      {alert.timestamp.slice(11, 19)}
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-200 group-hover:text-sky-300 transition-colors whitespace-nowrap">
                      {alert.source_device}
                    </td>
                    <td className="p-4 font-mono text-sky-400 whitespace-nowrap">
                      [{alert.subsystem}]
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-slate-300 text-[10px] border border-white/[0.08] font-medium">
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 max-w-md truncate group-hover:text-slate-100 transition-colors">
                      {alert.message}
                    </td>
                    <td className="p-4 pr-6 text-emerald-400 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {alert.noise_reason || "Isolated background event"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
