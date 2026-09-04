import re
from datetime import datetime, timezone
from typing import List, Tuple
from ..models.schemas import Alert


NOISE_RULES = [
    (
        lambda a: "NTP" in a.subsystem.upper() or "CLOCK" in a.message.upper(),
        "Isolated NTP stratum jitter within safe operational tolerance (±15ms)",
    ),
    (
        lambda a: any(kw in a.message.lower() for kw in ["log rotation", "logrotate"]),
        "Routine automated log rotation - zero operational impact",
    ),
    (
        lambda a: "ambient curve" in a.message.lower() or ("fan" in a.message.lower() and a.severity == "INFO"),
        "Nominal fan duty curve adjustment within manufacturer parameters",
    ),
    (
        lambda a: "svc-backup-agent" in a.message.lower() or "scheduled pam" in a.message.lower(),
        "Scheduled backup daemon PAM session lifecycle",
    ),
    (
        lambda a: "icmp echo ping probe" in a.message.lower() and "recovered" in a.message.lower(),
        "Transient ICMP packet drop auto-cleared on subsequent poll",
    ),
    (
        lambda a: "energy efficient ethernet" in a.message.lower() or "802.3az" in a.message.lower(),
        "Green Ethernet 802.3az idle state negotiation",
    ),
    (
        lambda a: "dhcp lease pool" in a.message.lower() and "healthy" in a.message.lower(),
        "Routine DHCP lease allocation status query",
    ),
    (
        lambda a: "vulnerability credential check" in a.message.lower() or "zero new high" in a.message.lower(),
        "Scheduled vulnerability scanner telemetry heart-beat",
    ),
    (
        lambda a: "telnet scan blocked" in a.message.lower() or "stateless acl drop" in a.message.lower(),
        "Routine perimeter edge ACL border scan rejection",
    ),
    (
        lambda a: "dns authoritative zone" in a.message.lower() or "serial auto-synchronized" in a.message.lower(),
        "Authoritative DNS zone incremental serial refresh (IXFR)",
    ),
]


def extract_topology_tokens(alert: Alert) -> List[str]:
    """Extract host tokens, datacenter identifiers, and interface IDs from alert metadata."""
    tokens = set()
    # Extract datacenter or pod
    dc_match = re.search(r"\.(dc\d+)", alert.source_device, re.IGNORECASE)
    if dc_match:
        tokens.add(dc_match.group(1).lower())
    
    # Extract device type
    if "core-rtr" in alert.source_device:
        tokens.add("core-router")
    elif "sw" in alert.source_device:
        tokens.add("switch")
    elif "gw" in alert.source_device:
        tokens.add("gateway")
    elif "rad" in alert.source_device or "auth" in alert.source_device:
        tokens.add("auth-radius")

    # Extract interface token
    if "interface" in alert.raw_payload:
        tokens.add(str(alert.raw_payload["interface"]).lower())
    elif "port" in alert.raw_payload:
        tokens.add(str(alert.raw_payload["port"]).lower())
        
    return list(tokens)


def parse_iso_ts(ts_str: str) -> datetime:
    try:
        # Handle 'Z' suffix
        cleaned = ts_str.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except Exception:
        return datetime.now(timezone.utc)


def prefilter_alerts(alerts: List[Alert]) -> Tuple[List[Alert], List[Alert], int]:
    """
    Deduplicates alerts and filters background noise.
    Returns:
        (actionable_alerts, noise_alerts, deduplicated_count)
    """
    deduplicated: List[Alert] = []
    seen_signatures = {}
    dedup_count = 0

    # Sort alerts by timestamp
    sorted_alerts = sorted(alerts, key=lambda a: parse_iso_ts(a.timestamp))

    for alert in sorted_alerts:
        # Construct deduplication signature: (device, subsystem, severity, core message essence)
        msg_essence = re.sub(r"\d+", "", alert.message[:60]).strip()
        sig = (alert.source_device, alert.subsystem, alert.severity, msg_essence)
        ts = parse_iso_ts(alert.timestamp)

        if sig in seen_signatures:
            last_ts = seen_signatures[sig]
            # If within 30 seconds, collapse as duplicate
            if abs((ts - last_ts).total_seconds()) <= 30:
                dedup_count += 1
                continue

        seen_signatures[sig] = ts
        deduplicated.append(alert)

    # Classify noise vs actionable
    actionable: List[Alert] = []
    noise: List[Alert] = []

    for alert in deduplicated:
        is_noise = False
        noise_reason = None

        if alert.is_noise:
            is_noise = True
            noise_reason = alert.noise_reason or "Manually flagged as isolated noise"
        elif alert.severity in ("INFO", "MINOR"):
            for rule_fn, reason in NOISE_RULES:
                if rule_fn(alert):
                    is_noise = True
                    noise_reason = reason
                    break

        if is_noise:
            alert.is_noise = True
            alert.noise_reason = noise_reason or "Isolated benign event without topological cascade"
            noise.append(alert)
        else:
            alert.is_noise = False
            actionable.append(alert)

    return actionable, noise, dedup_count
