# RB-PWR-SW-002: PWR-02 Switch Stack Redundant Power Supply Fault Mitigation

## Metadata
- **Runbook ID:** RB-PWR-SW-002
- **Subsystem:** POWER / HARDWARE / CHASSIS
- **Target Devices:** agg-sw-*.dc2, access-sw-*.dc2
- **Severity Level:** MAJOR (P2)
- **Author:** Datacenter Facilities & Infrastructure Operations

---

## 1. Initial Assessment & Triage
When an alert storm indicates power supply module loss, thermal alarms, or PoE budget exhaustion on stacked switch units:
1. Identify the failing power supply unit (PSU-1 or PSU-2) and verify redundant circuit capacity.
2. Determine if the chassis fan trays are compensating with maximum RPM (acoustic anomaly and fan sensor alert).
3. Inspect internal PoE power consumption against remaining single-PSU budget.

```bash
# Query switch stack power supply and environment sensors
show environment power
show environment temperature
show power inline
show stack-power detail
```

## 2. Root Cause Isolation
- **Utility / PDU Feed Loss:** Upstream rack PDU branch breaker trip or ATS transfer failure.
- **Internal PSU Failure:** Blown capacitor or thermal fuse inside switch power bay.
- **PoE Over-Budget Drop:** Aggregate connected APs and IP phones drawing more than single 750W PSU supply threshold.

## 3. Step-by-Step Remediation Procedure
Execute the following procedures immediately to protect operational switch stack members:

### Step 3.1: Shed Low-Priority PoE Loads
If PoE budget is operating at >90% capacity on single PSU, immediately shed non-critical ports:
```bash
configure terminal
interface range GigabitEthernet1/0/24-48
  power inline never
exit
```

### Step 3.2: Verify Stack-Power Sharing Loop
Ensure StackPower cabling is maintaining resilient load-sharing across the backplane:
```bash
show stack-power neighbors
```

### Step 3.3: Dispatch On-Site DC Technician
Confirm visual LED state on physical chassis:
- Amber / Blinking Amber: Power module fault requiring hot-swap.
- Off: No AC input voltage (check C13/C14 power whip).

## 4. Post-Incident Verification & Escalation Threshold
- Ensure temperatures on sensor `Inlet-Temp-01` stabilize below 42°C.
- Verify switch stack member state remains `READY` with zero packet drops on uplink trunks.
- **Escalation Criteria:** If internal chassis temperature exceeds 55°C or secondary PSU fails, trigger emergency cutover to secondary core aggregation stack.
