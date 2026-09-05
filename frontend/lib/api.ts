export interface Alert {
  id: string;
  timestamp: string;
  source_device: string;
  subsystem: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFO" | string;
  message: string;
  raw_payload: Record<string, unknown>;
  incident_id?: string | null;
  is_noise: boolean;
  noise_reason?: string | null;
}

export interface EvidenceItem {
  id: string;
  incident_id: string;
  runbook_id: string;
  runbook_title: string;
  section_heading: string;
  cited_text: string;
  line_reference: string;
  confidence_score: number;
  matched_parameters: Record<string, unknown>;
}

export interface EscalationTicket {
  incident_id: string;
  ticket_id: string;
  severity: string;
  title: string;
  summary: string;
  impact_assessment: string;
  affected_assets: string[];
  timeline_events: Array<{
    timestamp: string;
    device: string;
    subsystem: string;
    severity: string;
    summary: string;
  }>;
  unverified_parameters: Record<string, unknown>;
  recommended_escalation_tier: string;
  suggested_action: string;
  raw_markdown: string;
}

export interface Incident {
  id: string;
  title: string;
  root_cause_hypothesis: string;
  priority: "P1" | "P2" | "P3" | "P4" | string;
  status: "ACTIVE" | "MITIGATING" | "RESOLVED" | "ESCALATED" | string;
  matched_runbook_id?: string | null;
  matched_runbook_title?: string | null;
  confidence_score: number;
  created_at: string;
  resolved_at?: string | null;
  affected_devices: string[];
  subsystems: string[];
  alert_count: number;
  alerts: Alert[];
  evidence: EvidenceItem[];
  escalation_ticket?: EscalationTicket | null;
  probable_causes?: Array<{ cause: string; percentage: number; risk: string }>;
  post_mortem_report?: string | null;
  topology_nodes?: Array<{ id: string; label: string; role: string; status: string; ip: string; x: number; y: number }>;
  topology_links?: Array<{ source: string; target: string; label: string; status: string }>;
}

export interface RunbookChunk {
  chunk_id: string;
  runbook_id: string;
  runbook_title: string;
  heading: string;
  line_start: number;
  line_end: number;
  content: string;
  target_subsystem: string;
}

export interface Runbook {
  id: string;
  title: string;
  target_subsystem: string;
  file_path: string;
  content_markdown: string;
  updated_at: string;
  chunks: RunbookChunk[];
}

export interface TriageMetrics {
  total_raw_alerts: number;
  deduplicated_count: number;
  noise_suppressed_count: number;
  incident_count: number;
  noise_reduction_pct: number;
  processing_time_ms: number;
}

export interface TriageClusterResponse {
  incidents: Incident[];
  noise_alerts: Alert[];
  metrics: TriageMetrics;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE_URL}/incidents`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchIncident(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
  return res.json();
}

export async function triggerCluster(alerts?: Alert[]): Promise<TriageClusterResponse> {
  const res = await fetch(`${API_BASE_URL}/triage/cluster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: alerts ? JSON.stringify({ alerts }) : JSON.stringify({}),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to trigger triage clustering");
  return res.json();
}

export async function updateIncidentStatus(id: string, status: string): Promise<Incident> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function escalateIncident(id: string): Promise<EscalationTicket> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/escalate`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to escalate incident");
  return res.json();
}

export async function fetchRunbooks(): Promise<Runbook[]> {
  const res = await fetch(`${API_BASE_URL}/runbooks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch runbooks");
  return res.json();
}

export async function fetchNoiseAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE_URL}/noise`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch noise alerts");
  return res.json();
}

export async function fetchMetrics(): Promise<TriageMetrics> {
  const res = await fetch(`${API_BASE_URL}/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}
