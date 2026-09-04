# **PS07: Telecom Network Incident Triage Assistant**

---

*Comprehensive Vibe Coding Project Specification (The 6 Foundation Documents)*

## **01\. PRD — Product Requirements Document**

---

**App Name:** NetTriage AI (or CyTriage Network Assistant)  
**Tagline:** Autonomous alert storm clustering and runbook triage assistant for network and security operations centers.

### **Problem Statement**

During network disruptions, cascading infrastructure failures trigger hundreds of overlapping alerts across distributed routers, switches, and monitoring agents within seconds. NOC/SOC operators experience intense alert fatigue, spending 20–30 critical minutes manually cross-referencing logs, filtering false positives, deduplicating alerts, and searching across static wikis for troubleshooting steps while downtime accumulates.

### **Target User**

Level 1 and Level 2 Network Operations Center (NOC) operators, Security Operations Center (SOC) analysts, and Site Reliability Engineers (SREs) who require instant, deterministic correlation of raw alert streams into actionable incident units with cited resolution steps.

### **Core Features (Must Have)**

* **Intelligent Alert Clustering & Noise Isolation:** Ingestion of JSON network alert batches; semantic and topological grouping into parent incidents; explicit suppression of isolated background noise.  
* **Local Runbook Retrieval-Augmented Generation (RAG):** Deterministic vector search over local Markdown runbooks with explicit source file and section citations.  
* **Evidence-Based Root Cause Hypothesis:** Summarized incident cards showing affected assets, timeline progression, severity ranking, and primary failure hypothesis.  
* **Fallback Escalation Generation:** Automated creation of structured escalation tickets for unknown anomalies lacking confident runbook matches.  
* **Sub-60-Second Processing Guarantee:** Deterministic pre-filtering engine ensuring complete ingestion, clustering, and retrieval within hard timeout limits.

### **Nice to Have (v2 / Post-MVP)**

* Interactive visual topology node graph linking symptom alerts to parent root-cause devices.  
* Multi-variable probable-cause probability distribution (e.g., 75% BGP peer flap, 25% physical optical loss).  
* Exportable post-mortem markdown reports for Jira/ServiceNow integration.

### **Out of Scope**

* Automated remediation / direct execution of CLI fixes or network configuration changes.  
* Live hardware telemetry polling via SNMP/NETCONF/RESTCONF.  
* Hosted cloud vector databases (e.g., Pinecone) requiring external networking.

### **User Stories**

* *As a Tier 1 NOC Analyst*, I want raw alert storms grouped into single actionable incidents so that I don't waste 30 minutes reading 50 redundant alerts for one router crash.  
* *As an SRE on call*, I want recommended remediation steps grounded in our internal runbooks with exact citations so that I can execute vetted procedures without hallucinated suggestions.  
* *As an Incident Commander*, I want unmapped incidents automatically escalated with summarized impact and evidence so that Tier 3 specialists receive clear context immediately.

### **Success Metrics**

* \>85% reduction in individual alert volume presented to operators (noise suppression and deduplication).  
* Mean Time to Identify (MTTI) and triage reduced from 15 minutes to \<45 seconds.  
* 100% citation compliance (zero uncited troubleshooting claims).

## ---

**02\. TRD — Technical Requirements Document**

---

| Component | Technology Choice & Specification |
| :---- | :---- |
| **Frontend Framework** | Next.js 14 (App Router) with TypeScript and Tailwind CSS |
| **Backend Runtime** | Python 3.11 with FastAPI and Uvicorn |
| **Vector Store** | FAISS (Facebook AI Similarity Search) running in-memory locally |
| **Embedding Model** | Google Gemini Embeddings (text-embedding-004) |
| **LLM Orchestration** | Google Gemini 1.5 Pro / Flash via official Google GenAI SDK |
| **State Management & Data Fetching** | TanStack React Query \+ Zustand (Frontend), Pydantic v2 (Backend) |
| **Icons & Styling** | Lucide React, Tailwind CSS Typography, JetBrains Mono font |
| **Hosting & Execution** | Local execution: Backend on http://127.0.0.1:8000, Frontend on http://localhost:3000 |

### **Third-Party APIs & Services**

* **Google Gemini API:** Performs alert semantic clustering, root-cause hypothesis synthesis, and runbook grounded generation (Gemini Free/Pay-as-you-go Tier).

### **Key Environment Variables**

* GEMINI\_API\_KEY: API credential for Gemini model queries and embedding generation.  
* NEXT\_PUBLIC\_API\_BASE\_URL: Base URL for backend communications (e.g., http://127.0.0.1:8000/api/v1).  
* RUNBOOKS\_DIR\_PATH: Absolute or relative path to the local Markdown runbook repository (./data/runbooks).  
* LOG\_LEVEL: Operational logging verbosity (INFO / DEBUG).

### **Hard Technical Constraints**

* Maximum single-query latency must remain under 60 seconds.  
* Vector database and runbooks must operate strictly locally; zero dependency on cloud-managed vector stores.  
* Strict deterministic pre-filtering before LLM ingestion to minimize token usage and prevent payload drops.

## ---

**03\. App Flow — Navigation & User Journey Map**

---

**Navigation Structure:** Persistent dark sidebar with high-contrast indicator badges.

### **Pages List**

* / (Live Incident Dashboard): Overview metrics, active incident cards, noise suppression counters, and alert ingest triggers.  
* /incidents/\[id\] (Incident Deep-Dive & Runbook Triage): Detailed breakdown of grouped alerts, topology context, root-cause evidence, and exact cited runbook steps.  
* /runbooks (Knowledge Base Viewer): Interactive index of all indexed Markdown runbooks and their chunk embeddings.  
* /noise (Noise Inspection Queue): Read-only log viewer of suppressed, non-critical alerts left unclustered for verification.

### **Entry Point & Onboarding**

User lands directly on /. If no alerts are loaded, an empty-state banner invites the user to "Load Demo Cascade Batch" or "Upload Alert Stream JSON".

### **Core User Journeys**

1. **Journey 1: Ingest & Triage Alert Storm**  
   Click "Simulate Alert Cascade" → Backend runs deterministic deduplication → Gemini clusters 50 alerts into 3 root incidents and 10 noise logs → UI updates live counters → Incidents display ranked by Severity (P1/P2/P3).  
2. **Journey 2: Inspect Incident & Execute Vetted Runbook**  
   Select P1 Core Router Failure → Route transitions to /incidents/inc-001 → Right pane displays exact matched runbook: *"BGP-04: Core Peering Link Recovery"* → Click \[View Evidence\] to highlight matching log parameters (interface: eth0/1, status: DOWN) → Click "Mark Mitigated" or "Escalate to Tier 3".  
3. **Journey 3: Unmapped Incident Escalation**  
   Select anomaly lacking runbook match → UI displays yellow indicator: "No Deterministic Runbook Found" → Displays auto-generated Structured Escalation Ticket containing failed hostnames, event timeline, and unverified parameters → Click "Copy Escalation Summary".

### **Edge, Error & Empty States**

* **Empty State:** Clean radar animation with text: *"Network telemetry stable. No active incident clusters."*  
* **API Timeout / Error:** Non-blocking banner with instant fallback switch: *"LLM gateway unreachable. Switched to cached local ruleset."*

## ---

**04\. UI/UX Design Brief — Visual & Interaction Guide**

---

| Attribute | Design Specification |
| :---- | :---- |
| **Aesthetic Direction** | Cyberpunk/Defensive SOC interface; dark mode primary, minimalist cards, high-contrast status cues. |
| **Background Color** | Deep Space Navy: \#0B1120 (body), \#1E293B (surface cards), \#0F172A (sidebar). |
| **Text Color** | Primary: \#F8FAFC (slate-50), Secondary: \#94A3B8 (slate-400), Code/Logs: \#38BDF8 (sky-400). |
| **Accent & Status Colors** | Cyan CTA: \#06B6D4, Critical (P1): \#EF4444, Warning (P2): \#F59E0B, Healthy: \#10B981. |
| **Typography** | UI: *Inter* (400, 500, 600); Monospace / Logs / Identifiers: *JetBrains Mono*. |
| **Component Styling** | 8px border-radius; subtle 1px border rgba(148, 163, 184, 0.1); cyan glow on active card hover. |
| **Key Patterns** | Split-screen triage layout (incident list on left 40%, runbook evidence pane on right 60%); expandable JSON drawer. |
| **Inspiration** | Datadog Event Correlation, Linear dark mode, Grafana dashboards. |

## ---

**05\. Backend Schema — Data Model & API Architecture**

### ---

**Database / In-Memory Models**

Table: alerts  
  \- id: VARCHAR(36) PRIMARY KEY (UUID)  
  \- timestamp: TIMESTAMP WITH TIME ZONE  
  \- source\_device: VARCHAR(100) (e.g. "core-router-01.dc1")  
  \- subsystem: VARCHAR(50) (e.g. "BGP", "INTERFACE", "AUTH")  
  \- severity: VARCHAR(20) ("CRITICAL", "MAJOR", "MINOR", "INFO")  
  \- message: TEXT  
  \- raw\_payload: JSON  
  \- incident\_id: VARCHAR(36) NULLABLE (FK \-\> incidents.id)  
  \- is\_noise: BOOLEAN DEFAULT FALSE

Table: incidents  
  \- id: VARCHAR(36) PRIMARY KEY (UUID)  
  \- title: VARCHAR(255)  
  \- root\_cause\_hypothesis: TEXT  
  \- priority: VARCHAR(10) ("P1", "P2", "P3", "P4")  
  \- status: VARCHAR(20) ("ACTIVE", "MITIGATING", "RESOLVED", "ESCALATED")  
  \- matched\_runbook\_id: VARCHAR(100) NULLABLE (FK \-\> runbooks.id)  
  \- confidence\_score: FLOAT  
  \- created\_at: TIMESTAMP WITH TIME ZONE  
  \- resolved\_at: TIMESTAMP WITH TIME ZONE NULLABLE

Table: runbooks  
  \- id: VARCHAR(100) PRIMARY KEY (e.g. "RB-NET-BGP-001")  
  \- title: VARCHAR(255)  
  \- target\_subsystem: VARCHAR(50)  
  \- file\_path: VARCHAR(255)  
  \- content\_markdown: TEXT  
  \- updated\_at: TIMESTAMP WITH TIME ZONE

Table: incident\_evidence  
  \- id: VARCHAR(36) PRIMARY KEY  
  \- incident\_id: VARCHAR(36) (FK \-\> incidents.id)  
  \- runbook\_id: VARCHAR(100) (FK \-\> runbooks.id)  
  \- cited\_text: TEXT  
  \- line\_reference: VARCHAR(50)

### **Core REST API Endpoints**

* POST /api/v1/alerts/ingest: Ingests array of raw JSON alert objects.  
* POST /api/v1/triage/cluster: Executes deduplication, noise filtering, and LLM incident clustering.  
* GET /api/v1/incidents: Lists all active and resolved incident groups.  
* GET /api/v1/incidents/{id}: Retrieves detailed incident metadata, grouped alert list, and runbook matches.  
* POST /api/v1/runbooks/match: Queries local FAISS vector index with incident signature and returns top-1 runbook.  
* POST /api/v1/incidents/{id}/escalate: Generates structured handoff escalation document.

## ---

**06\. Implementation Plan — Step-by-Step Build Sequence**

1. ---

   **Phase 1: Project Scaffolding & Environment Init**  
   Initialize FastAPI backend directory, Python virtual environment, install requirements (fastapi, uvicorn, faiss-cpu, google-genai, pydantic). Initialize Next.js 14 TypeScript frontend with Tailwind CSS and Lucide icons.  
2. **Phase 2: Synthetic Data & Runbook Authoring**  
   Create data/alerts\_demo.json containing 50 structured network alerts (3 cascading failure scenarios: Core BGP Link Flap, Power Supply Failure on Switch Stack, Authentication Storm; plus 10 random noise events). Author 3 Markdown runbooks under data/runbooks/ with explicit operational remediation steps.  
3. **Phase 3: Deterministic Pre-Filtering Engine**  
   Implement Python pre-processor to deduplicate repeated alert signatures, collapse time-window duplicates (±30s), and extract topological host tokens before invoking external APIs.  
4. **Phase 4: LLM Incident Clustering Service**  
   Construct strict Pydantic schema for Gemini clustering output. Write prompt orchestrating semantic grouping into parent incidents while enforcing isolation of unassociated alerts as noise.  
5. **Phase 5: Local FAISS Vector Indexing & RAG Pipeline**  
   Implement runbook markdown chunker. Generate embeddings via text-embedding-004 and store in local FAISS index. Implement vector similarity search retrieving the top matching runbook with exact section quotes.  
6. **Phase 6: Escalation Generator & Fallback Handling**  
   Implement deterministic fallback logic when vector similarity drops below threshold (0.65), generating an incident handoff summary detailing affected subnets and unverified parameters.  
7. **Phase 7: Frontend NOC Dashboard & Incident View**  
   Build Next.js split-view triage console. Style with dark navy/slate theme, glowing cyan interactive accents, and P1/P2/P3 severity tags. Connect to FastAPI backend endpoints via React Query.  
8. **Phase 8: Demo Hardening & Latency Verification**  
   Pre-cache demo cascade JSON responses to local fallback file for offline demo resilience. Verify end-to-end response time is well within the 60-second limit.

**Done Criteria:** Uploading the 50-alert demo JSON produces exactly 3 clustered incidents with cited runbook procedures, cleanly segregates the 10 noise alerts, and displays all evidence on the Next.js dashboard in under 30 seconds.