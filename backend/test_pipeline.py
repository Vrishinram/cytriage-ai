import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.vector_store import vector_store
from backend.app.services.triage_engine import cluster_and_triage
from backend.app.api.endpoints import load_demo_alerts

def main():
    print("=== Testing CyTriage Network Assistant Backend Pipeline ===")
    
    # 1. Load runbooks and build FAISS index
    vector_store.load_and_index_runbooks()
    print(f"Indexed Runbooks: {len(vector_store.runbooks)}")
    print(f"Indexed Chunks: {len(vector_store.chunks)}")
    assert len(vector_store.runbooks) >= 3, "Expected at least 3 runbooks"
    assert len(vector_store.chunks) > 5, "Expected chunks to be generated"

    # 2. Test vector search
    results = vector_store.search("BGP session flap optical Rx power drop eth0/1", top_k=2)
    print(f"Search results for BGP query: {len(results)}")
    for chunk, score in results:
        print(f"  - [{score:.3f}] {chunk.runbook_id} -> {chunk.heading} (L{chunk.line_start}-{chunk.line_end})")
    assert results[0][0].runbook_id == "RB-NET-BGP-001", "Expected BGP runbook match"

    # 3. Test alert cascade ingestion and triage
    raw_alerts = load_demo_alerts()
    print(f"Loaded {len(raw_alerts)} demo alerts.")
    assert len(raw_alerts) == 50, f"Expected 50 demo alerts, got {len(raw_alerts)}"

    incidents, noise, metrics = cluster_and_triage(raw_alerts)
    print("\n=== Triage Results ===")
    print(f"Processing Time: {metrics.processing_time_ms} ms")
    print(f"Total Raw Alerts: {metrics.total_raw_alerts}")
    print(f"Noise Suppressed: {metrics.noise_suppressed_count} (Reduction: {metrics.noise_reduction_pct}%)")
    print(f"Incidents Clustered: {metrics.incident_count}")

    assert len(incidents) == 3, f"Expected exactly 3 incidents, got {len(incidents)}"
    assert len(noise) == 10, f"Expected exactly 10 noise alerts, got {len(noise)}"

    for inc in incidents:
        print(f"\n[{inc.priority}] {inc.id}: {inc.title}")
        print(f"  Alerts: {inc.alert_count} | Devices: {', '.join(inc.affected_devices)}")
        print(f"  Matched Runbook: {inc.matched_runbook_id} (Confidence: {inc.confidence_score})")
        if inc.evidence:
            print(f"  Cited Evidence: {inc.evidence[0].section_heading} ({inc.evidence[0].line_reference})")
        if inc.escalation_ticket:
            print(f"  Escalation Ticket: {inc.escalation_ticket.ticket_id}")

    print("\nALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
