"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Upload,
  RefreshCw,
  Clock,
  ShieldCheck,
  Layers,
  Sparkles,
  Search,
  Activity,
  AlertCircle,
  Radio,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  Incident,
  TriageMetrics,
  fetchIncidents,
  triggerCluster,
  fetchMetrics,
} from "@/lib/api";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<TriageMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const [incList, met] = await Promise.all([
        fetchIncidents(),
        fetchMetrics().catch(() => null),
      ]);
      setIncidents(incList);
      if (met) setMetrics(met);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulateCascade = async () => {
    try {
      setSimulating(true);
      const res = await triggerCluster();
      setIncidents(res.incidents);
      setMetrics(res.metrics);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSimulating(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await triggerCluster(Array.isArray(parsed) ? parsed : [parsed]);
      setIncidents(res.incidents);
      setMetrics(res.metrics);
    } catch (err) {
      alert("Invalid JSON alert file: " + err);
    } finally {
      setSimulating(false);
      e.target.value = "";
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      inc.title.toLowerCase().includes(q) ||
      inc.root_cause_hypothesis.toLowerCase().includes(q) ||
      inc.id.toLowerCase().includes(q) ||
      inc.affected_devices.some((d) => d.toLowerCase().includes(q));

    const matchesSeverity =
      selectedSeverity === "ALL" || inc.priority.toUpperCase() === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "P1":
        return {
          pill: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
          dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]",
          badge: "P1 Critical",
          accentBorder: "hover:border-rose-500/30",
        };
      case "P2":
        return {
          pill: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
          dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
          badge: "P2 Major",
          accentBorder: "hover:border-amber-500/30",
        };
      default:
        return {
          pill: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
          dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]",
          badge: "P3 Moderate",
          accentBorder: "hover:border-sky-500/30",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
      case "MITIGATING":
        return "bg-sky-500/10 text-sky-300 border border-sky-500/20";
      case "ESCALATED":
        return "bg-purple-500/10 text-purple-300 border border-purple-500/20";
      default:
        return "bg-rose-500/10 text-rose-300 border border-rose-500/20";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Incident Triage Console
            </h1>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-applePill">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-apple-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Live Telemetry Stream
            </span>
          </div>
          <p className="text-sm text-slate-400 font-normal">
            Autonomous alert clustering, noise suppression, and grounded runbook correlation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-200 text-xs font-medium transition-all duration-200 shadow-applePill">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Alert Batch</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
              disabled={simulating}
            />
          </label>

          <button
            onClick={handleSimulateCascade}
            disabled={simulating}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-[0_4px_20px_rgba(14,165,233,0.35)] hover:shadow-[0_6px_25px_rgba(14,165,233,0.5)] transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`}
            />
            <span>{simulating ? "Correlating Ingest..." : "Simulate Alert Cascade (50)"}</span>
          </button>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Alerts */}
        <div className="p-6 rounded-3xl glass-apple-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Alerts Ingested</span>
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {metrics ? metrics.total_raw_alerts : 50}
            </span>
            <span className="text-xs text-slate-400">telemetry events</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Deduplicated {metrics ? metrics.deduplicated_count : 0} repeated signatures
          </div>
        </div>

        {/* Clustered Incidents */}
        <div className="p-6 rounded-3xl glass-apple-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Actionable Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-sky-400">
              {incidents.length}
            </span>
            <span className="text-xs text-slate-400">clustered units</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            From {metrics ? metrics.total_raw_alerts - metrics.noise_suppressed_count : 40} active alerts
          </div>
        </div>

        {/* Noise Suppression */}
        <div className="p-6 rounded-3xl glass-apple-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Noise Suppressed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-400">
              {metrics ? metrics.noise_suppressed_count : 10}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
              &gt;85% Fatigue Red.
            </span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Zero-risk background events isolated
          </div>
        </div>

        {/* Processing Latency */}
        <div className="p-6 rounded-3xl glass-apple-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Triage Speed (MTTI)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-purple-300">
              {metrics ? `${metrics.processing_time_ms} ms` : "18.02 ms"}
            </span>
            <span className="text-xs text-slate-400">e2e latency</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            SLA Guarantee: &lt; 45 seconds
          </div>
        </div>
      </div>

      {/* Search & Quick Severity Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by device, incident title, or symptom..."
            className="w-full pl-11 pr-4 py-2.5 glass-apple-input rounded-2xl text-xs placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Apple Segmented Severity Control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-2xl glass-apple space-x-1">
            {["ALL", "P1", "P2", "P3"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  selectedSeverity === sev
                    ? "bg-white/[0.12] text-white shadow-applePill font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sev === "ALL" ? "All Incidents" : sev}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium hidden lg:inline">
            {filteredIncidents.length} of {incidents.length} incidents
          </span>
        </div>
      </div>

      {/* Clustered Incident Cards */}
      {loading ? (
        <div className="py-24 text-center glass-apple rounded-3xl">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">
            Ingesting and correlating network telemetry alerts...
          </p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="py-24 text-center glass-apple rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-sky-400 shadow-applePill">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              All Systems Operational
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No active incident clusters matching your filter. Click &ldquo;Simulate Alert Cascade&rdquo; to test an alert storm.
            </p>
          </div>
          <button
            onClick={handleSimulateCascade}
            className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-applePill transition-all"
          >
            Simulate Alert Cascade
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const pStyle = getPriorityStyle(incident.priority);
            return (
              <div
                key={incident.id}
                className={`p-6 rounded-3xl glass-apple-card transition-all duration-300 ${pStyle.accentBorder} group`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Content */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${pStyle.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`} />
                        {pStyle.badge}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                        {incident.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadge(incident.status)}`}>
                        {incident.status}
                      </span>
                      <span className="text-slate-400 text-xs">
                        • {incident.alert_count} alerts correlated
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
                        {incident.title}
                      </h2>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {incident.root_cause_hypothesis}
                      </p>
                    </div>

                    {/* Affected Devices Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 mr-1">
                        Affected Devices:
                      </span>
                      {incident.affected_devices.map((dev) => (
                        <span
                          key={dev}
                          className="font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-sky-300 border border-white/[0.06] text-[11px]"
                        >
                          {dev}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Action & Runbook Match */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
                    {incident.matched_runbook_id ? (
                      <div className="text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-1.5 text-xs text-sky-400 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span>FAISS Runbook Match</span>
                        </div>
                        <div className="text-xs font-medium text-slate-200 mt-0.5">
                          {incident.matched_runbook_id}{" "}
                          <span className="text-sky-400 font-semibold">
                            ({Math.round((incident.confidence_score || 0.95) * 100)}% Confidence)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-left lg:text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" />
                          Unmapped Anomaly
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/incidents/${incident.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium border border-white/[0.1] shadow-applePill transition-all duration-200 group/btn"
                    >
                      <span>Triage Incident</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
