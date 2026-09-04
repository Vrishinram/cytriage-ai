# RB-SEC-AUTH-003: SEC-01 RADIUS & TACACS+ Authentication Storm Containment

## Metadata
- **Runbook ID:** RB-SEC-AUTH-003
- **Subsystem:** AUTH / SECURITY / RADIUS
- **Target Devices:** edge-gw-01, edge-gw-02, auth-rad-01, auth-rad-02
- **Severity Level:** MAJOR (P2)
- **Author:** Network Security & Identity Operations

---

## 1. Initial Assessment & Triage
When edge gateways and RADIUS/TACACS servers report high authentication reject spikes and daemon queue saturation:
1. Identify if the surge originates from automated 802.1X supplicant reconnect loops or external credential stuffing.
2. Check RADIUS server worker thread pool latency and memory queue consumption.
3. Review firewall connection state tables for rate-limiting triggers on UDP port 1812/1813.

```bash
# Check AAA / RADIUS authentication statistics and backlog
show aaa servers
show aaa dead-criteria
show radius statistics
netstat -s -u | grep "buffer errors"
```

## 2. Root Cause Isolation
- **802.1X Client Roaming Loop:** Mass DHCP renewal or WLAN controller failover re-authenticating thousands of endpoints simultaneously.
- **RADIUS Backend LDAP Timeout:** Active Directory domain controller sync latency causing request backlog.
- **Brute Force / Credential Stuffing Attack:** Distributed external IP flood targeting public VPN/Captive Portal gateway.

## 3. Step-by-Step Remediation Procedure
Follow standard containment protocols:

### Step 3.1: Enable AAA Backoff and Rate-Limiting
Throttling excessive consecutive re-authentication retries on edge gateways:
```bash
configure terminal
aaa authentication dot1x default group radius
dot1x timeout quiet-period 60
dot1x max-req 3
dot1x reauth-max 2
exit
```

### Step 3.2: Drain and Failover to Secondary RADIUS Node
If primary node `auth-rad-01` memory exceeds 92%:
```bash
configure terminal
radius-server host 10.100.10.15 auth-port 1812 acct-port 1813 key 7 SecretKeyA deadtime 15
exit
```

### Step 3.3: Flush Hanging Auth Sessions
Clear orphaned incomplete handshake buffers:
```bash
clear aaa local user lockout
clear dot1x session all
```

## 4. Post-Incident Verification & Escalation Threshold
- Observe RADIUS server response time falling below 80ms.
- Validate queue drop counter ceases incrementing.
- **Escalation Criteria:** If client authentication failure rate remains above 40% after quiet-period throttling, escalate to SOC Identity Management on-call engineer.
