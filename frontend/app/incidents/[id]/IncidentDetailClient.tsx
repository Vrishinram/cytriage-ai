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
  AlertTriangle,
  Activity,
  ShieldCheck,
  Cpu,
  Server,
  Layers,
} from "lucide-react";
import {
  Incident,
  fetchIncident,
  updateIncidentStatus,
  escalateIncident,
} from "@/lib/api";

export default function IncidentDetailClient() {
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3 glass-apple p-8 rounded-3xl shadow-apple">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading incident telemetry & grounded evidence...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-300">Incident not found.</p>
        <Link href="/" className="text-sky-400 text-xs hover:underline font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 px-6 glass-apple-header flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all shadow-applePill"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  incident.priority === "P1"
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                }`}
              >
                {incident.priority} Critical
              </span>
              <span className="text-xs font-mono text-slate-400 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08]">
                {incident.id}
              </span>
              <h1 className="text-sm font-semibold text-white truncate max-w-xl">
                {incident.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusChange("MITIGATING")}
            disabled={updatingStatus || incident.status === "MITIGATING"}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-medium transition-all duration-200 ${
              incident.status === "MITIGATING"
                ? "bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-applePill font-semibold"
                : "glass-apple text-slate-300 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            Mitigating
          </button>

          <button
            onClick={() => handleStatusChange("RESOLVED")}
            disabled={updatingStatus || incident.status === "RESOLVED"}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-medium transition-all duration-200 ${
              incident.status === "RESOLVED"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-applePill font-semibold"
                : "glass-apple text-slate-300 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            Mark Resolved
          </button>

          <button
            onClick={handleEscalate}
            disabled={updatingStatus || incident.status === "ESCALATED"}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-medium transition-all duration-200 ${
              incident.status === "ESCALATED"
                ? "bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-applePill font-semibold"
                : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 shadow-applePill"
            }`}
          >
            Escalate to Tier 3
          </button>
        </div>
      </div>

      {/* Split-Screen Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: Grouped Alerts & Probable Causes (42%) */}
        <div className="w-full lg:w-[42%] border-r border-white/[0.07] flex flex-col h-full bg-black/20 overflow-hidden">
          {/* Incident Hypothesis & Probable Causes */}
          <div className="p-6 border-b border-white/[0.07] space-y-4 shrink-0 overflow-y-auto max-h-[340px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Root Cause Hypothesis
              </span>
              <span className="text-slate-400">{incident.alerts.length} Cascaded Alerts</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/[0.07]">
              {incident.root_cause_hypothesis}
            </p>

            {/* Multi-Variable Probable-Cause Distribution */}
            {incident.probable_causes && incident.probable_causes.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <PieChart className="w-3.5 h-3.5 text-sky-400" />
                    Probable-Cause Distribution
                  </span>
                  <span className="text-slate-500 text-[11px]">Bayesian Weight</span>
                </div>
                <div className="space-y-2.5">
                  {incident.probable_causes.map((pc, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{pc.cause}</span>
                        <span className="text-sky-400 font-semibold">{pc.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pc.risk === "CRITICAL"
                              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                              : pc.risk === "HIGH"
                              ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                              : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
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
              <span className="text-xs text-slate-400 mr-1">Assets:</span>
              {incident.affected_devices.map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-0.5 rounded-md bg-white/[0.04] text-sky-300 font-mono text-[11px] border border-white/[0.07]"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Grouped Alerts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 px-2 flex items-center justify-between">
              <span>Cascading Telemetry Log Stream ({incident.alerts.length})</span>
              <span className="text-[11px] text-sky-400">Chronological</span>
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
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
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
                        <span className="text-slate-200 font-mono font-medium">{alert.source_device}</span>
                        <span className="text-sky-400 font-mono text-[11px]">[{alert.subsystem}]</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 shrink-0 mt-1">
                      <span className="text-[11px] font-mono text-slate-400">{alert.timestamp.slice(11, 19)}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON Payload Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-black/60 border-t border-white/[0.07] text-xs space-y-2">
                      <div className="text-slate-400 flex justify-between items-center pb-1">
                        <span className="text-sky-400 font-semibold font-mono">RAW TELEMETRY PAYLOAD</span>
                        <span className="text-slate-500 font-mono text-[11px]">ID: {alert.id}</span>
                      </div>
                      <pre className="text-sky-300 overflow-x-auto p-3 bg-black/40 rounded-xl border border-white/[0.06] font-mono text-xs">
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
        <div className="w-full lg:w-[58%] flex flex-col h-full bg-black/10 overflow-hidden">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 pt-3 shrink-0 glass-apple-header">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("runbook")}
                className={`pb-3 text-xs font-medium transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === "runbook"
                    ? "text-sky-400 border-sky-400 font-semibold"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Runbook RAG & Citations
              </button>

              <button
                onClick={() => setActiveTab("topology")}
                className={`pb-3 text-xs font-medium transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === "topology"
                    ? "text-sky-400 border-sky-400 font-semibold"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Topology Graph
              </button>

              <button
                onClick={() => setActiveTab("postmortem")}
                className={`pb-3 text-xs font-medium transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === "postmortem"
                    ? "text-sky-400 border-sky-400 font-semibold"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Post-Mortem Report
              </button>
            </div>

            {activeTab === "postmortem" && incident.post_mortem_report && (
              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={handleCopyPostMortem}
                  className="px-3 py-1.5 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-200 text-xs flex items-center gap-1.5 shadow-applePill transition-all"
                >
                  {copiedPostMortem ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedPostMortem ? "Copied" : "Copy Markdown"}
                </button>
                <button
                  onClick={handleDownloadPostMortem}
                  className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs flex items-center gap-1.5 shadow-applePill font-medium transition-all"
                >
                  <Download className="w-3 h-3" />
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
                  <div className="p-5 rounded-3xl glass-apple flex items-center justify-between gap-4 shadow-apple">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span>FAISS Grounded Match</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-mono text-white font-semibold">{incident.matched_runbook_id}</span>
                      </div>
                      <h2 className="text-base font-semibold text-white">
                        {incident.matched_runbook_title || "Operational Runbook Procedure"}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-sky-400 font-semibold">
                        {Math.round(incident.confidence_score * 100)}% Confidence
                      </div>
                      <div className="w-28 h-1.5 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, incident.confidence_score * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exact Cited Evidence Card */}
                  {incident.evidence.length > 0 && (
                    <div className="p-6 rounded-3xl glass-apple-card space-y-3 shadow-apple">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-2 text-sky-400 font-semibold">
                          <FileText className="w-4 h-4 text-sky-400" />
                          CITED RUNBOOK EVIDENCE & ANCHOR
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Ref: {incident.evidence[0].line_reference}
                        </span>
                      </div>

                      <div className="p-4 bg-white/[0.02] rounded-2xl border-l-4 border-sky-400 text-xs text-slate-200 leading-relaxed border border-white/[0.06]">
                        <div className="font-semibold text-sky-300 pb-1">
                          {incident.evidence[0].section_heading}
                        </div>
                        <p className="text-slate-300 whitespace-pre-line">
                          {incident.evidence[0].cited_text}
                        </p>
                      </div>

                      {/* Matched Parameters */}
                      {Object.keys(incident.evidence[0].matched_parameters).length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs text-slate-400 mb-1.5 font-medium">
                            Extracted Matching Parameters:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(incident.evidence[0].matched_parameters).map(([k, v]) => (
                              <div
                                key={k}
                                className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono"
                              >
                                <span className="text-slate-400">{k}: </span>
                                <span className="text-sky-300 font-semibold">{String(v)}</span>
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
                      <span className="text-xs text-slate-400">
                        Deterministic SOP Steps
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Step 1 */}
                      <div className="p-5 rounded-3xl glass-apple-card space-y-2 border-l-4 border-l-sky-500">
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
                        <div className="p-4 bg-black/50 rounded-2xl text-sky-300 overflow-x-auto border border-white/[0.06] font-mono text-xs">
                          <code>
                            <span className="text-slate-500"># Query peer status and optic levels</span><br />
                            show ip bgp summary | include 198.51.100.1<br />
                            show interfaces eth0/1 transceiver detail
                          </code>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="p-5 rounded-3xl glass-apple-card space-y-2 border-l-4 border-l-sky-500">
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
                        <div className="p-4 bg-black/50 rounded-2xl text-sky-300 overflow-x-auto border border-white/[0.06] font-mono text-xs">
                          <code>
                            <span className="text-slate-500"># Trigger soft refresh to avoid tearing secondary routes</span><br />
                            clear ip bgp 198.51.100.1 soft in<br />
                            clear ip bgp 198.51.100.1 soft out
                          </code>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="p-5 rounded-3xl glass-apple-card space-y-2 border-l-4 border-l-sky-500">
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
                        <div className="p-4 bg-black/50 rounded-2xl text-sky-300 overflow-x-auto border border-white/[0.06] font-mono text-xs">
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
                <div className="p-6 rounded-3xl glass-apple border border-purple-500/30 space-y-4 shadow-apple">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30">
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
                  Live Topology Correlation Graph
                </span>
                <span className="text-slate-400">Root Cause & Dependency Links</span>
              </div>

              {/* SVG Topology Canvas */}
              <div className="flex-1 min-h-[380px] bg-black/40 rounded-3xl border border-white/[0.08] p-6 relative flex items-center justify-center overflow-hidden shadow-apple">
                <svg className="w-full h-full min-h-[350px]" viewBox="0 0 560 220">
                  <defs>
                    <linearGradient id="linkGradientDown" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#BE123C" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="linkGradientNormal" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
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
                          height="24"
                          fill="rgba(10, 14, 26, 0.85)"
                          rx="8"
                          stroke={isDown ? "rgba(244, 63, 94, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                          strokeWidth="1"
                        />
                        <text
                          x={(sourceNode.x + targetNode.x) / 2}
                          y={(sourceNode.y + targetNode.y) / 2 + 4}
                          fill={isDown ? "#FB7185" : "#94A3B8"}
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
                            fill="rgba(244, 63, 94, 0.25)"
                            className="animate-apple-pulse"
                          />
                        )}

                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="18"
                          fill={isCrit ? "#4C0519" : isDeg ? "#451A03" : "#082F49"}
                          stroke={isCrit ? "#F43F5E" : isDeg ? "#F59E0B" : "#38BDF8"}
                          strokeWidth="2.5"
                          className="transition-all duration-300"
                        />

                        {/* Node Label Box */}
                        <rect
                          x={n.x - 75}
                          y={n.y + 26}
                          width="150"
                          height="36"
                          fill="rgba(12, 16, 30, 0.9)"
                          rx="10"
                          stroke={isCrit ? "rgba(244, 63, 94, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                          strokeWidth="1"
                        />
                        <text
                          x={n.x}
                          y={n.y + 41}
                          fill="#F8FAFC"
                          fontSize="10"
                          fontWeight="bold"
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
                          fontWeight="600"
                          fontFamily="monospace"
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
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-apple-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                    Root Cause Failure
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    Degraded / Failover
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                    Active Transit Path
                  </span>
                </div>
                <span className="text-slate-400">Correlated from {incident.alerts.length} alerts</span>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Exportable Post-Mortem Report */}
          {activeTab === "postmortem" && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-4">
              <div className="p-5 rounded-3xl glass-apple flex items-center justify-between shadow-apple">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    ServiceNow / Jira ITSM Handoff Format
                  </span>
                  <p className="text-xs text-slate-400">
                    Auto-synthesized post-mortem report including 5-Whys RCA, chronological timeline, and MTTR/MTTI metrics.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPostMortem}
                    className="px-3 py-1.5 rounded-2xl glass-apple hover:bg-white/[0.08] text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-applePill transition-all"
                  >
                    {copiedPostMortem ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPostMortem ? "Copied!" : "Copy Report"}
                  </button>
                  <button
                    onClick={handleDownloadPostMortem}
                    className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-applePill transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Download .md
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 rounded-3xl glass-apple-card text-xs font-mono text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-apple border border-white/[0.07]">
                {incident.post_mortem_report}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
