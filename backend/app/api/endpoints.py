import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException

from ..config import DEMO_ALERTS_PATH
from ..models.schemas import (
    Alert,
    EscalationTicket,
    Incident,
    IngestRequest,
    IngestResponse,
    Runbook,
    RunbookMatchRequest,
    StatusUpdateRequest,
    TriageClusterResponse,
    TriageMetrics,
)
from ..services.escalation import generate_escalation_ticket
from ..services.triage_engine import cluster_and_triage
from ..services.vector_store import vector_store

router = APIRouter(prefix="/api/v1")

# In-memory storage for stateful NOC console operations
STORE_RAW_ALERTS: List[Alert] = []
STORE_INCIDENTS: Dict[str, Incident] = {}
STORE_NOISE_ALERTS: List[Alert] = []
STORE_METRICS: Optional[TriageMetrics] = None


def load_demo_alerts() -> List[Alert]:
    if not DEMO_ALERTS_PATH.exists():
        return []
    with open(DEMO_ALERTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        return [Alert(**item) for item in data]


@router.post("/alerts/ingest", response_model=IngestResponse)
async def ingest_alerts(req: Optional[IngestRequest] = None):
    global STORE_RAW_ALERTS
    if req and req.alerts:
        STORE_RAW_ALERTS = req.alerts
    else:
        # Load default 50-alert cascade demo batch
        STORE_RAW_ALERTS = load_demo_alerts()

    return IngestResponse(
        status="success",
        total_received=len(STORE_RAW_ALERTS),
        total_stored=len(STORE_RAW_ALERTS),
        message=f"Successfully ingested {len(STORE_RAW_ALERTS)} alerts into telemetry pipeline."
    )


@router.post("/triage/cluster", response_model=TriageClusterResponse)
async def trigger_triage_clustering(req: Optional[IngestRequest] = None):
    global STORE_RAW_ALERTS, STORE_INCIDENTS, STORE_NOISE_ALERTS, STORE_METRICS

    alerts_to_cluster = req.alerts if (req and req.alerts) else STORE_RAW_ALERTS
    if not alerts_to_cluster:
        # Auto-load demo cascade if empty
        alerts_to_cluster = load_demo_alerts()
        STORE_RAW_ALERTS = alerts_to_cluster

    incidents, noise, metrics = cluster_and_triage(alerts_to_cluster)

    STORE_INCIDENTS = {inc.id: inc for inc in incidents}
    STORE_NOISE_ALERTS = noise
    STORE_METRICS = metrics

    return TriageClusterResponse(
        incidents=incidents,
        noise_alerts=noise,
        metrics=metrics
    )


@router.get("/incidents", response_model=List[Incident])
async def list_incidents():
    if not STORE_INCIDENTS:
        # Trigger default triage if empty
        await trigger_triage_clustering()
    return list(STORE_INCIDENTS.values())


@router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    if not STORE_INCIDENTS:
        await trigger_triage_clustering()

    if incident_id not in STORE_INCIDENTS:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return STORE_INCIDENTS[incident_id]


@router.patch("/incidents/{incident_id}/status", response_model=Incident)
async def update_incident_status(incident_id: str, req: StatusUpdateRequest):
    if incident_id not in STORE_INCIDENTS:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    valid_statuses = ["ACTIVE", "MITIGATING", "RESOLVED", "ESCALATED"]
    if req.status.upper() not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{req.status}'. Must be one of {valid_statuses}."
        )

    inc = STORE_INCIDENTS[incident_id]
    inc.status = req.status.upper()
    return inc


@router.post("/incidents/{incident_id}/escalate", response_model=EscalationTicket)
async def escalate_incident(incident_id: str):
    if incident_id not in STORE_INCIDENTS:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    inc = STORE_INCIDENTS[incident_id]
    inc.status = "ESCALATED"

    if not inc.escalation_ticket:
        inc.escalation_ticket = generate_escalation_ticket(
            incident_id=inc.id,
            title=inc.title,
            priority=inc.priority,
            alerts=inc.alerts,
            root_cause_hypothesis=inc.root_cause_hypothesis,
            recommended_tier="Tier 3 Optical Transport Engineering" if "BGP" in inc.title else "Tier 3 Infrastructure On-Call"
        )

    return inc.escalation_ticket


@router.post("/runbooks/match")
async def match_runbook(req: RunbookMatchRequest):
    results = vector_store.search(req.query_text, top_k=req.top_k)
    return [
        {
            "chunk_id": chunk.chunk_id,
            "runbook_id": chunk.runbook_id,
            "runbook_title": chunk.runbook_title,
            "heading": chunk.heading,
            "line_start": chunk.line_start,
            "line_end": chunk.line_end,
            "content": chunk.content,
            "confidence_score": round(score, 3)
        }
        for chunk, score in results
    ]


@router.get("/runbooks", response_model=List[Runbook])
async def list_runbooks():
    return list(vector_store.runbooks.values())


@router.get("/noise", response_model=List[Alert])
async def list_noise_alerts():
    if not STORE_NOISE_ALERTS and not STORE_INCIDENTS:
        await trigger_triage_clustering()
    return STORE_NOISE_ALERTS


@router.get("/metrics")
async def get_metrics():
    if not STORE_METRICS:
        await trigger_triage_clustering()
    return STORE_METRICS
