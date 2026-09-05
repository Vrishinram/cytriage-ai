TRACK_ID=PS6
# NetTriage AI — Telecom Network Incident Triage Assistant

> **Autonomous alert storm clustering, local FAISS RAG runbook triage, and topological root-cause analysis for NOC/SOC operations.**

NetTriage AI is an enterprise-grade autonomous incident triage engine designed for telecom network operations centers (NOC) and security operation centers (SOC). During critical cascading network failures and alert storms, NetTriage AI suppresses noisy telemetry, groups alerts into root-cause clusters, retrieves authoritative standard operating procedures (SOPs) with exact cited line references, and synthesizes structured escalation tickets and post-mortem incident reports.

---

## 🚀 Quick Start (Single Command)

NetTriage AI runs both backend and frontend together from a single Python command:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Set your Gemini API Key
export GEMINI_API_KEY="your-gemini-api-key"
# On Windows PowerShell: $env:GEMINI_API_KEY="your-gemini-api-key"

# 3. Start the application
python app.py
```

The unified application will immediately start serving at **`http://localhost:8000`**.

> **Note:** If `GEMINI_API_KEY` is not provided or network is offline, NetTriage AI automatically and gracefully falls back to its built-in local vector indexing and deterministic inference pipeline without any crashes.

---

## 🎥 Demo Video

- **Walkthrough Video:** [NetTriage AI Demo Video (2-3 Minutes)](https://youtu.be/placeholder-demo-video)
  *(Showcasing normal triage flow with citation retrieval and difficult cascading multi-tier incident handling)*

---

## 📁 Repository Structure

```
.
├── app.py                     # Root entry point: launches backend + static frontend on port 8000
├── requirements.txt           # Python dependencies (FastAPI, Uvicorn, NumPy, FAISS, google-genai)
├── README.md                  # Project overview & submission documentation
├── backend/                   # Python backend engine
│   ├── app/
│   │   ├── main.py            # FastAPI application with static mount and API router
│   │   ├── config.py          # Environment settings and paths
│   │   ├── api/
│   │   │   └── endpoints.py   # REST API endpoints (/api/v1/incidents, /api/v1/runbooks, etc.)
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic schemas (Incidents, Alerts, Evidence, Escalation)
│   │   └── services/
│   │       ├── prefilter.py   # Deduplication & maintenance-window noise suppression
│   │       ├── triage_engine.py # Deterministic + LLM clustering, topology builder, post-mortems
│   │       ├── vector_store.py  # Local FAISS / NumPy vector store & gemini-embedding-001 integration
│   │       └── escalation.py   # Structured Tier 3 escalation ticket generator
├── data/
│   ├── alerts_demo.json       # 38 realistic telecom network alerts across 3 incident storms
│   └── runbooks/              # Authority SOP Runbooks
│       ├── RB-NET-BGP-001.md  # Core BGP Peering Link & Route Flap Recovery
│       ├── RB-PWR-SW-002.md   # Switch Stack Power Supply & Chassis Thermal Fault
│       └── RB-SEC-RAD-003.md  # RADIUS / 802.1X Authentication Storm Mitigation
└── frontend/
    └── dist/                  # Committed production build files served directly by app.py
```

---

## 🧠 What Data & Documents Were Generated

1. **`data/alerts_demo.json`**:
   - **38 Realistic Multi-Vendor Alerts** representing Cisco IOS-XR, Arista EOS, Juniper Junos, and FreeRADIUS devices.
   - Covers 3 distinct cascading operational incident classes:
     - **Incident 1 (P1 Critical):** BGP Peering Link Flap & Optical Signal Loss (`core-rtr-01`, `core-rtr-02`).
     - **Incident 2 (P2 Major):** Aggregation Switch Stack Power Supply Failure & Chassis Thermal Hazard (`agg-sw-04`, `access-sw-12`).
     - **Incident 3 (P3 Medium):** 802.1X / RADIUS Gateway Authentication Storm & Dead-Server Failover (`edge-gw-01`, `auth-rad-01`).
   - Contains high-frequency duplicate alerts (compressed by fingerprint deduplication) and maintenance-window / polling routine alerts (classified and suppressed as noise).

2. **`data/runbooks/*.md`**:
   - Industry-standard SOP runbooks divided into granular sections (`Overview`, `Diagnostic Commands`, `Remediation Procedures`, `Escalation Path`).
   - Runbooks are parsed into section chunks, embedded using `gemini-embedding-001` (or local semantic embeddings), and indexed in local FAISS / NumPy vector space for RAG retrieval.

---

## 🛠 Sound Engineering & Design Principles

- **Single External Dependency:** Only Google Gemini API (`gemini-embedding-001` & Gemini 2.0 / 1.5) is used for external GenAI. No external vector databases, no 3rd-party SaaS or hidden endpoints.
- **Strict Evidence Citation:** Every recommendation links directly to an authoritative runbook chunk and line range (e.g. `RB-NET-BGP-001#L14-L35`). NetTriage refuses to hallucinate remediation steps when runbook confidence is insufficient.
- **Fail-Safe Fallback:** If the vector similarity score is below the threshold or the model is offline, the system safely triggers an **Automated Tier 3 Escalation Ticket** with timeline events and unverified parameters instead of hallucinating.
- **Ultra-Fast Startup:** Starts under 5 seconds with all runbooks pre-indexed and ready on port 8000.
