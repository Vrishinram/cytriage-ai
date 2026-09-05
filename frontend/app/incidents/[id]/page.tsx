"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Terminal,
  Network,
  PieChart,
  Download,
  AlertCircle,
  Activity,
  Layers,
  Cpu,
} from "lucide-react";
import {
  Incident,
  fetchIncident,
  updateIncidentStatus,
  escalateIncident,
} from "@/lib/api";

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [copiedPostMortem, setCopiedPostMortem] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"runbook" | "topology" | "postmortem">("runbook");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const inc = await fetchIncident(id);
        setIncident(inc);
      } catch (err) {
        console.error("Failed to load incident:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    try {
      setUpdatingStatus(true);
      const updated = await updateIncidentStatus(incident.id, newStatus);
      setIncident(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEscalate = async () => {
    if (!incident) return;
    try {
      setUpdatingStatus(true);
      const ticket = await escalateIncident(incident.id);
      setIncident({
        ...incident,
        status: "ESCALATED",
        escalation_ticket: ticket,
      });
    } catch (err) {
      console.error("Failed to escalate:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const copyToClipboard = (text: string, isCmd: boolean = false, cmdKey?: string) => {
    navigator.clipboard.writeText(text);
    if (isCmd && cmdKey) {
      setCopiedCmd(cmdKey);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  const handleCopyPostMortem = () => {
    if (!incident?.post_mortem_report) return;
    navigator.clipboard.writeText(incident.post_mortem_report);
    setCopiedPostMortem(true);
    setTimeout(() => setCopiedPostMortem(false), 2000);
  };

  const handleDownloadPostMortem = () => {
    if (!incident?.post_mortem_report) return;
    const blob = new Blob([incident.post_mortem_report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postmortem-${incident.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3 p-8 rounded-3xl glass-apple">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading incident telemetry & FAISS match...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-300">Incident not found.</p>
        <Link href="/" className="text-sky-400 text-xs underline font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 px-6 glass-apple-header flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/"
            className="p-2 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all shadow-applePill shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${
                  incident.priority === "P1"
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                }`}
              >
                {incident.priority}
              </span>
              <span className="font-mono text-xs text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] shrink-0">
                {incident.id}
              </span>
              <h1 className="text-sm font-semibold text-white truncate">
                {incident.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl glass-apple space-x-1">
            <button
              onClick={() => handleStatusChange("MITIGATING")}
              disabled={updatingStatus || incident.status === "MITIGATING"}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                incident.status === "MITIGATING"
                  ? "bg-sky-500/20 text-sky-300 font-semibold shadow-applePill border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Mitigating
            </button>

            <button
              onClick={() => handleStatusChange("RESOLVED")}
              disabled={updatingStatus || incident.status === "RESOLVED"}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                incident.status === "RESOLVED"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold shadow-applePill border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Resolved
            </button>
          </div>

          <button
            onClick={handleEscalate}
            disabled={updatingStatus || incident.status === "ESCALATED"}
            className={`px-3.5 py-2 rounded-2xl text-xs font-medium transition-all duration-200 shadow-applePill ${
              incident.status === "ESCALATED"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold"
                : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25"
            }`}
          >
            Escalate Tier 3
          </button>
        </div>
      </div>

      {/* Split-Screen Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: Grouped Alerts & Probable Causes (42%) */}
        <div className="w-full lg:w-[42%] border-r border-white/[0.06] flex flex-col h-full overflow-hidden">
          {/* Incident Hypothesis & Probable Causes */}
          <div className="p-6 border-b border-white/[0.06] glass-apple space-y-4 shrink-0 overflow-y-auto max-h-[320px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Root Cause Hypothesis
              </span>
              <span className="text-slate-400">{incident.alerts.length} Cascaded Alerts</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06]">
              {incident.root_cause_hypothesis}
            </p>

            {/* Multi-Variable Probable-Cause Distribution */}
            {incident.probable_causes && incident.probable_causes.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                    <PieChart className="w-3.5 h-3.5 text-sky-400" />
                    Bayesian Probable-Cause Weight
                  </span>
                  <span>Confidence Model</span>
                </div>
                <div className="space-y-2">
                  {incident.probable_causes.map((pc, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{pc.cause}</span>
                        <span className="text-sky-400 font-semibold">{pc.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pc.risk === "CRITICAL"
                              ? "bg-rose-500"
                              : pc.risk === "HIGH"
                              ? "bg-amber-400"
                              : "bg-sky-400"
                          }`}
                          style={{ width: `${pc.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Assets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Assets:</span>
              {incident.affected_devices.map((d) => (
                <span
                  key={d}
                  className="font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-sky-300 text-[11px] border border-white/[0.06]"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Grouped Alerts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
              <span>Telemetry Alert Stream ({incident.alerts.length})</span>
              <span className="text-[10px] text-sky-400">Chronological</span>
            </div>

            {incident.alerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              return (
                <div
                  key={alert.id}
                  className="rounded-2xl glass-apple-card overflow-hidden text-xs transition-all"
                >
                  <div
                    onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                    className="p-3.5 cursor-pointer flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            alert.severity === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                              : alert.severity === "MAJOR"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                              : "bg-white/[0.05] text-slate-300 border border-white/[0.08]"
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-mono text-slate-200 text-xs font-medium">{alert.source_device}</span>
                        <span className="font-mono text-sky-400 text-[10px]">[{alert.subsystem}]</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed truncate">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 shrink-0 mt-0.5">
                      <span className="font-mono text-[10px]">{alert.timestamp.slice(11, 19)}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON Payload Drawer */}
                  {isExpanded && (
                    <div className="p-3.5 bg-black/40 border-t border-white/[0.06] text-[11px] space-y-1.5">
                      <div className="text-slate-400 flex justify-between items-center pb-1">
                        <span className="text-sky-400 font-medium">Raw Telemetry Payload</span>
                        <span className="font-mono text-slate-500 text-[10px]">{alert.id}</span>
                      </div>
                      <pre className="font-mono text-sky-300 overflow-x-auto p-3 bg-black/60 rounded-xl border border-white/[0.06]">
                        {JSON.stringify(alert.raw_payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Interactive Triage Tabs (58%) */}
        <div className="w-full lg:w-[58%] flex flex-col h-full overflow-hidden">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3 shrink-0 glass-apple-header">
            <div className="flex items-center p-1 rounded-2xl glass-apple space-x-1">
              <button
                onClick={() => setActiveTab("runbook")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "runbook"
                    ? "bg-white/[0.12] text-white shadow-applePill font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Runbook SOP
              </button>

              <button
                onClick={() => setActiveTab("topology")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "topology"
                    ? "bg-white/[0.12] text-white shadow-applePill font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Topology Graph
              </button>

              <button
                onClick={() => setActiveTab("postmortem")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "postmortem"
                    ? "bg-white/[0.12] text-white shadow-applePill font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Post-Mortem
              </button>
            </div>

            {activeTab === "postmortem" && incident.post_mortem_report && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPostMortem}
                  className="px-3 py-1.5 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-applePill transition-all"
                >
                  {copiedPostMortem ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPostMortem ? "Copied" : "Copy Markdown"}
                </button>
                <button
                  onClick={handleDownloadPostMortem}
                  className="px-3 py-1.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-applePill transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .md
                </button>
              </div>
            )}
          </div>

          {/* TAB CONTENT: Runbook View */}
          {activeTab === "runbook" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
              {incident.matched_runbook_id ? (
                <>
                  {/* Matched Banner */}
                  <div className="p-5 rounded-3xl glass-apple-card flex items-center justify-between gap-4 border border-sky-500/20 shadow-apple">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span>FAISS Deterministic Match</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-mono text-slate-200">{incident.matched_runbook_id}</span>
                      </div>
                      <h2 className="text-base font-semibold text-white">
                        {incident.matched_runbook_title || "Operational Runbook Procedure"}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-sky-400 font-semibold">
                        {Math.round(incident.confidence_score * 100)}% Confidence
                      </div>
                      <div className="w-24 h-1.5 bg-white/[0.08] rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, incident.confidence_score * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exact Cited Evidence Card */}
                  {incident.evidence.length > 0 && (
                    <div className="p-6 rounded-3xl glass-apple-card space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-sky-400 font-medium">
                          <FileText className="w-4 h-4 text-sky-400" />
                          Cited Runbook Evidence & Anchor
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          Ref: {incident.evidence[0].line_reference}
                        </span>
                      </div>

                      <div className="p-4 bg-white/[0.02] rounded-2xl border-l-4 border-sky-400 text-xs text-slate-200 leading-relaxed border border-white/[0.06]">
                        <div className="font-semibold text-sky-300 pb-1.5">
                          {incident.evidence[0].section_heading}
                        </div>
                        <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                          {incident.evidence[0].cited_text}
                        </p>
                      </div>

                      {/* Matched Parameters */}
                      {Object.keys(incident.evidence[0].matched_parameters).length > 0 && (
                        <div className="pt-2">
                          <div className="text-[11px] text-slate-400 mb-2 font-medium">
                            Extracted Matching Parameters:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(incident.evidence[0].matched_parameters).map(([k, v]) => (
                              <div
                                key={k}
                                className="px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono"
                              >
                                <span className="text-slate-400">{k}: </span>
                                <span className="text-sky-300 font-medium">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vetted Operational Remediation Procedure */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-sky-400" />
                        Vetted Remediation Procedures
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Deterministic SOP Steps
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Step 1 */}
                      <div className="p-5 rounded-3xl glass-apple-card space-y-2.5">
                        <div className="flex items-center justify-between text-slate-200 font-medium">
                          <span>Step 1: Diagnostics & Interface Isolation</span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                "show ip bgp summary | include 198.51.100.1\nshow interfaces eth0/1 transceiver detail",
                                true,
                                "cmd1"
                              )
                            }
                            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedCmd === "cmd1" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="p-3.5 bg-black/60 rounded-2xl text-sky-300 overflow-x-auto border border-white/[0.06] font-mono text-xs">
                          <code>
                            <span className="text-slate-500"># Query peer status and optic levels</span><br />
                            show ip bgp summary | include 198.51.100.1<br />
                            show interfaces eth0/1 transceiver detail
                          </code>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="p-5 rounded-3xl glass-apple-card space-y-2.5">
                        <div className="flex items-center justify-between text-slate-200 font-medium">
                          <span>Step 2: Safe BGP Soft-Reset / Load Shedding</span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                "clear ip bgp 198.51.100.1 soft in\nclear ip bgp 198.51.100.1 soft out",
                                true,
                                "cmd2"
                              )
                            }
                            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedCmd === "cmd2" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="p-3.5 bg-black/60 rounded-2xl text-sky-300 overflow-x-auto border border-white/[0.06] font-mono text-xs">
                          <code>
                            <span className="text-slate-500"># Trigger soft refresh to avoid tearing secondary routes</span><br />
                            clear ip bgp 198.51.100.1 soft in<br />
                            clear ip bgp 198.51.100.1 soft out
                          </code>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="p-5 rounded-3xl glass-apple-card space-y-2.5">
                        <div className="flex items-center justify-between text-slate-200 font-medium">
                          <span>Step 3: Verification & Route Integrity</span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                "show ip route 0.0.0.0/0\ntraceroute 8.8.8.8 numeric source Loopback0",
                                true,
                                "cmd3"
                              )
                            }
                            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedCmd === "cmd3" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="p-3.5 bg-black/60 rounded-2xl text-sky-300 overflow-x-auto border border-white/[0.06] font-mono text-xs">
                          <code>
                            show ip route 0.0.0.0/0<br />
                            traceroute 8.8.8.8 numeric source Loopback0
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Fallback Escalation View
                <div className="p-6 rounded-3xl glass-apple border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                      Fallback Escalation Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No deterministic runbook match found with high confidence (&ge;65%). A structured escalation ticket has been prepared with incident telemetry.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Interactive Topology Node Graph */}
          {activeTab === "topology" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4 text-sky-400" />
                  Incident Topology Correlation
                </span>
                <span className="text-slate-400">Root Cause & Dependency Links</span>
              </div>

              {/* SVG Topology Canvas */}
              <div className="flex-1 min-h-[380px] rounded-3xl glass-apple p-6 relative flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full min-h-[350px]" viewBox="0 0 560 220">
                  <defs>
                    <linearGradient id="linkGradientDown" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#BE123C" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="linkGradientNormal" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Connection Lines */}
                  {incident.topology_links?.map((l, idx) => {
                    const sourceNode = incident.topology_nodes?.find((n) => n.id === l.source);
                    const targetNode = incident.topology_nodes?.find((n) => n.id === l.target);
                    if (!sourceNode || !targetNode) return null;

                    const isDown = l.status === "DOWN";
                    const isDegraded = l.status === "DEGRADED";

                    return (
                      <g key={idx}>
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={isDown ? "url(#linkGradientDown)" : isDegraded ? "#F59E0B" : "url(#linkGradientNormal)"}
                          strokeWidth={isDown ? "2.5" : "2"}
                          strokeDasharray={isDown ? "6,4" : "none"}
                        />
                        {/* Link Label */}
                        <rect
                          x={(sourceNode.x + targetNode.x) / 2 - 60}
                          y={(sourceNode.y + targetNode.y) / 2 - 12}
                          width="120"
                          height="22"
                          fill="rgba(15, 23, 42, 0.9)"
                          rx="8"
                          stroke={isDown ? "#F43F5E" : "rgba(255, 255, 255, 0.1)"}
                          strokeWidth="1"
                        />
                        <text
                          x={(sourceNode.x + targetNode.x) / 2}
                          y={(sourceNode.y + targetNode.y) / 2 + 3}
                          fill={isDown ? "#FDA4AF" : "#94A3B8"}
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {l.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Topology Nodes */}
                  {incident.topology_nodes?.map((n) => {
                    const isCrit = n.status === "CRITICAL";
                    const isDeg = n.status === "DEGRADED" || n.status === "DOWN";

                    return (
                      <g key={n.id} className="cursor-pointer group/node">
                        {/* Glow halo for root cause node */}
                        {isCrit && (
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r="28"
                            fill="rgba(244, 63, 94, 0.2)"
                            className="animate-apple-pulse"
                          />
                        )}

                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="18"
                          fill={isCrit ? "rgba(244, 63, 94, 0.25)" : isDeg ? "rgba(245, 158, 11, 0.25)" : "rgba(56, 189, 248, 0.25)"}
                          stroke={isCrit ? "#F43F5E" : isDeg ? "#F59E0B" : "#38BDF8"}
                          strokeWidth="2.5"
                        />

                        {/* Node Label Box */}
                        <rect
                          x={n.x - 75}
                          y={n.y + 26}
                          width="150"
                          height="36"
                          fill="rgba(15, 23, 42, 0.85)"
                          rx="12"
                          stroke={isCrit ? "#F43F5E" : "rgba(255, 255, 255, 0.1)"}
                          strokeWidth="1.5"
                          className="shadow-applePill"
                        />
                        <text
                          x={n.x}
                          y={n.y + 41}
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="600"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {n.id}
                        </text>
                        <text
                          x={n.x}
                          y={n.y + 53}
                          fill={isCrit ? "#FDA4AF" : "#94A3B8"}
                          fontSize="8"
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {n.role}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Topology Legend */}
              <div className="flex items-center justify-between text-xs p-4 glass-apple-card rounded-2xl text-slate-300">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                    Root Cause Failure
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    Degraded Link
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                    Active Backup
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">Auto-correlated from 18 cascading alerts</span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Exportable Post-Mortem Report */}
          {activeTab === "postmortem" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-4">
              <div className="p-4 rounded-2xl glass-apple flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    ServiceNow / Jira ITSM Handoff Format
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Auto-synthesized post-mortem including 5-Whys root cause analysis, timeline, and SLA metrics.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPostMortem}
                    className="px-3 py-1.5 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-200 text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 shadow-applePill"
                  >
                    {copiedPostMortem ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPostMortem ? "Copied" : "Copy Report"}
                  </button>
                  <button
                    onClick={handleDownloadPostMortem}
                    className="px-3 py-1.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-applePill"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 rounded-3xl glass-apple-card font-mono text-xs text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {incident.post_mortem_report}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
