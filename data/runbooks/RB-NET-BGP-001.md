# RB-NET-BGP-001: BGP-04 Core Peering Link & Route Flap Recovery

## Metadata
- **Runbook ID:** RB-NET-BGP-001
- **Subsystem:** BGP / INTERFACE / ROUTING
- **Target Devices:** core-rtr-01.dc1, core-rtr-02.dc1, edge-peering-*
- **Severity Level:** CRITICAL (P1)
- **Author:** Global NOC Architecture Team

---

## 1. Initial Assessment & Triage
When multiple BGP session state drops occur alongside interface carrier transitions on core aggregation nodes:
1. Verify physical link status and optic power levels on the peering interface (`eth0/1` or `TenGigE0/0/0/1`).
2. Check if the BGP neighbor state has transitioned from `ESTABLISHED` to `IDLE` or `ACTIVE`.
3. Inspect peer hold timers to confirm whether keepalive timeouts expired due to transient packet loss.

```bash
# Verify BGP neighbor state and flapping prefix counts
show ip bgp summary | include 198.51.100.1
show interfaces eth0/1 transceiver detail
show logging last 100 | match "BGP-5-ADJCHANGE"
```

## 2. Root Cause Isolation
- **Physical Layer (Layer 1):** Optical Rx power below -18 dBm indicates dirty fiber connectors or failing SFP+ optics.
- **Data Link Layer (Layer 2):** High CRC error rate on `eth0/1` suggests MTU mismatch or faulty patch panel cabling.
- **Routing Engine (Layer 3):** Excessive flap damping penalties applied to upstream Autonomous System (AS64512).

## 3. Step-by-Step Remediation Procedure
Execute the following commands sequentially in privileged configuration mode:

### Step 3.1: Interface Diagnostics & Bounce
```bash
configure terminal
interface eth0/1
  description "CORE-PEER-TRANSIT-PRIMARY"
  shutdown
  sleep 5
  no shutdown
exit
```

### Step 3.2: Soft Reset BGP Inbound/Outbound Peering
To avoid tearing down secondary routes, trigger a soft prefix refresh rather than a hard peer reset:
```bash
clear ip bgp 198.51.100.1 soft in
clear ip bgp 198.51.100.1 soft out
```

### Step 3.3: Failover Route Confirmation
Verify that traffic is rerouting seamlessly via the secondary peering core router:
```bash
show ip route 0.0.0.0/0
traceroute 8.8.8.8 numeric source Loopback0
```

## 4. Post-Incident Verification & Escalation Threshold
- Monitor interface for 120 seconds. Ensure zero input errors or CRC frame increments.
- Confirm BGP session state remains in `ESTABLISHED` state for more than 5 minutes.
- **Escalation Criteria:** If optic Tx/Rx remains degraded or peer stays in `ACTIVE` state for >3 minutes, escalate immediately to Tier 3 Optical Transport Engineering.
