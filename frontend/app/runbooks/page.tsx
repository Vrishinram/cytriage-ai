"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  BookOpen,
  Cpu,
  FileCode,
  Layers,
} from "lucide-react";
import { fetchRunbooks, Runbook } from "@/lib/api";

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchRunbooks();
        setRunbooks(list);
        if (list.length > 0) setSelectedRunbook(list[0]);
      } catch (err) {
        console.error("Failed to load runbooks:", err);
      }
    };
    load();
  }, []);

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await fetch("http://127.0.0.1:8000/api/v1/runbooks/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_text: searchQuery, top_k: 3 }),
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Runbook Knowledge Base
          </h1>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25 shadow-applePill">
            {runbooks.length} Indexed Runbooks
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Locally indexed operational SOPs embedded into in-memory FAISS vector index for zero-hallucination triage.
        </p>
      </div>

      {/* Vector Store Query Simulator */}
      <div className="p-6 rounded-3xl glass-apple-card space-y-4 shadow-apple">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Interactive FAISS Vector Search Simulator</span>
          </div>
          <span className="text-xs text-slate-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.08] flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            Dim: 768 • FAISS Local IP
          </span>
        </div>

        <form onSubmit={handleTestSearch} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Test query (e.g. SFP optical loss Rx power drop, PSU breaker trip, RADIUS buffer overflow)..."
              className="w-full pl-11 pr-4 py-2.5 glass-apple-input rounded-2xl text-xs placeholder-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-[0_4px_16px_rgba(14,165,233,0.35)] disabled:opacity-50"
          >
            {searching ? "Searching..." : "Vector Search"}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-slate-400 font-medium">
              Top Vector Chunks Retrieved:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {searchResults.map((res: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 glass-apple rounded-2xl text-xs space-y-2 shadow-apple"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sky-400 font-semibold">{res.runbook_id}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
                      {Math.round(res.confidence_score * 100)}% Sim
                    </span>
                  </div>
                  <div className="text-white font-medium text-xs">
                    {res.heading}
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-3 leading-relaxed">
                    {res.content}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1 font-mono">
                    <Layers className="w-3 h-3 text-sky-400" />
                    Lines: L{res.line_start} - L{res.line_end}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Runbooks Split Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Runbook Directory */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-1">
            Indexed Operational Runbooks
          </div>

          {runbooks.map((rb) => {
            const isSelected = selectedRunbook?.id === rb.id;
            return (
              <div
                key={rb.id}
                onClick={() => setSelectedRunbook(rb)}
                className={`p-5 rounded-3xl cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "glass-apple bg-white/[0.08] border-sky-400/40 shadow-apple"
                    : "glass-apple-card hover:border-white/[0.14]"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-semibold ${isSelected ? "text-sky-400" : "text-slate-300"}`}>
                    {rb.id}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400">
                    {rb.chunks.length} chunks
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-1.5 leading-snug">
                  {rb.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>Subsystem:</span>
                  <span className="text-sky-300 font-medium">{rb.target_subsystem}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Markdown Document Viewer */}
        <div className="lg:col-span-2 rounded-3xl glass-apple-card p-6 flex flex-col space-y-4 shadow-apple">
          {selectedRunbook ? (
            <>
              <div className="border-b border-white/[0.06] pb-4 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                    <span className="font-semibold">{selectedRunbook.id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{selectedRunbook.target_subsystem}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                    Source: <code className="font-mono text-sky-300 text-[11px] bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">data/runbooks/{selectedRunbook.id}.md</code>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {selectedRunbook.title}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[600px] p-6 rounded-2xl bg-black/40 border border-white/[0.06] font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedRunbook.content_markdown}
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              Select a runbook to inspect source contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
