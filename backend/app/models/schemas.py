from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Alert(BaseModel):
    id: str
    timestamp: str
    source_device: str
    subsystem: str
    severity: str = "INFO"  # CRITICAL, MAJOR, MINOR, INFO
    message: str
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    incident_id: Optional[str] = None
    is_noise: bool = False
    noise_reason: Optional[str] = None


class RunbookChunk(BaseModel):
    chunk_id: str
    runbook_id: str
    runbook_title: str
    heading: str
    line_start: int
    line_end: int
    content: str
    target_subsystem: str


class EvidenceItem(BaseModel):
    id: str
    incident_id: str
    runbook_id: str
    runbook_title: str
    section_heading: str
    cited_text: str
    line_reference: str
    confidence_score: float
    matched_parameters: Dict[str, Any] = Field(default_factory=dict)


class EscalationTicket(BaseModel):
    incident_id: str
    ticket_id: str
    severity: str
    title: str
    summary: str
    impact_assessment: str
    affected_assets: List[str]
    timeline_events: List[Dict[str, str]]
    unverified_parameters: Dict[str, Any] = Field(default_factory=dict)
    recommended_escalation_tier: str = "Tier 3 Network Engineering"
    suggested_action: str
    raw_markdown: str


class Incident(BaseModel):
    id: str
    title: str
    root_cause_hypothesis: str
    priority: str = "P2"  # P1, P2, P3, P4
    status: str = "ACTIVE"  # ACTIVE, MITIGATING, RESOLVED, ESCALATED
    matched_runbook_id: Optional[str] = None
    matched_runbook_title: Optional[str] = None
    confidence_score: float = 0.0
    created_at: str
    resolved_at: Optional[str] = None
    affected_devices: List[str] = Field(default_factory=list)
    subsystems: List[str] = Field(default_factory=list)
    alert_count: int = 0
    alerts: List[Alert] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    escalation_ticket: Optional[EscalationTicket] = None
    probable_causes: List[Dict[str, Any]] = Field(default_factory=list)
    post_mortem_report: Optional[str] = None
    topology_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    topology_links: List[Dict[str, Any]] = Field(default_factory=list)


class Runbook(BaseModel):
    id: str
    title: str
    target_subsystem: str
    file_path: str
    content_markdown: str
    updated_at: str
    chunks: List[RunbookChunk] = Field(default_factory=list)


class IngestRequest(BaseModel):
    alerts: List[Alert]


class IngestResponse(BaseModel):
    status: str
    total_received: int
    total_stored: int
    message: str


class TriageMetrics(BaseModel):
    total_raw_alerts: int
    deduplicated_count: int
    noise_suppressed_count: int
    incident_count: int
    noise_reduction_pct: float
    processing_time_ms: float


class TriageClusterResponse(BaseModel):
    incidents: List[Incident]
    noise_alerts: List[Alert]
    metrics: TriageMetrics


class StatusUpdateRequest(BaseModel):
    status: str


class RunbookMatchRequest(BaseModel):
    incident_id: Optional[str] = None
    query_text: str
    top_k: int = 1
