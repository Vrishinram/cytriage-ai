import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from ..models.schemas import Alert, EscalationTicket, Incident


def generate_escalation_ticket(
    incident_id: str,
    title: str,
    priority: str,
    alerts: List[Alert],
    root_cause_hypothesis: str,
    recommended_tier: str = "Tier 3 Network Engineering"
) -> EscalationTicket:
    ticket_id = f"ESC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    affected_assets = sorted(list({a.source_device for a in alerts}))
    
    # Extract timeline events
    timeline = []
    for a in sorted(alerts, key=lambda x: x.timestamp)[:8]:
        timeline.append({
            "timestamp": a.timestamp,
            "device": a.source_device,
            "subsystem": a.subsystem,
            "severity": a.severity,
            "summary": a.message[:90] + ("..." if len(a.message) > 90 else "")
        })

    # Consolidate unverified parameters
    unverified: Dict[str, Any] = {}
    for a in alerts:
        for k, v in a.raw_payload.items():
            if k not in unverified:
                unverified[k] = v

    # Build Impact Assessment
    impact = f"Degradation across {len(affected_assets)} critical infrastructure asset(s) ({', '.join(affected_assets)}). "
    if priority == "P1":
        impact += "Immediate operational severity: High risk of transit packet loss and transit peering isolation."
    elif priority == "P2":
        impact += "Redundancy failover active or hardware operating in non-redundant state. Service disruption pending if unresolved."
    else:
        impact += "Service performance degraded or high authentication retry latency observed."

    suggested_action = (
        "1. Dispatch Tier 3 on-call specialist for immediate telemetry verification.\n"
        "2. Review physical optic readings and power distribution feed status.\n"
        "3. Isolate flapping peer or shedding non-critical PoE workloads."
    )

    # Generate complete Markdown handoff document
    md_lines = [
        f"# NOC Incident Escalation Ticket: {ticket_id}",
        f"**Incident ID:** {incident_id}  ",
        f"**Severity:** {priority} | **Status:** ESCALATED TO {recommended_tier.upper()}  ",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "",
        "## 1. Executive Summary",
        f"{title}. {root_cause_hypothesis}",
        "",
        "## 2. Impact Assessment",
        impact,
        "",
        "## 3. Affected Assets & Infrastructure",
        "\n".join([f"- `{asset}`" for asset in affected_assets]),
        "",
        "## 4. Key Event Timeline",
        "| Timestamp | Device | Subsystem | Severity | Event Message |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ]
    for ev in timeline:
        md_lines.append(
            f"| `{ev['timestamp']}` | `{ev['device']}` | `{ev['subsystem']}` | **{ev['severity']}** | {ev['summary']} |"
        )

    md_lines.extend([
        "",
        "## 5. Unverified Telemetry Parameters",
        "```json",
        str(unverified),
        "```",
        "",
        "## 6. Recommended Action & Handoff Checklist",
        suggested_action,
        "",
        "---",
        "*Report autonomously synthesized by CyTriage Network Assistant Escalation Engine.*"
    ])

    raw_markdown = "\n".join(md_lines)

    return EscalationTicket(
        incident_id=incident_id,
        ticket_id=ticket_id,
        severity=priority,
        title=title,
        summary=root_cause_hypothesis,
        impact_assessment=impact,
        affected_assets=affected_assets,
        timeline_events=timeline,
        unverified_parameters=unverified,
        recommended_escalation_tier=recommended_tier,
        suggested_action=suggested_action,
        raw_markdown=raw_markdown
    )
