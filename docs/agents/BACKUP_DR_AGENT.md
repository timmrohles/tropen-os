# BACKUP_DR_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "backup/**"
    - "disaster-recovery/**"
    - "infra/backup/**"
    - "config/backup/**"
    - "scripts/restore/**"
    - "terraform/**"
    - "Pulumi/**"
    - "docs/runbooks/dr/**"
  keywords:
    - backup
    - disaster recovery
    - restore
    - rto
    - rpo
    - pitr
    - replication
    - runbook
    - incident
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "migrations/**"
    - "*.local.*"
related:
  - agent: architecture
    type: consult
    boundary: "Architecture Agent owns system topology decisions. Backup DR Agent owns data durability and recovery configuration within that topology."
  - agent: security
    type: delegates
    boundary: "Security Agent owns backup encryption and access controls. Backup DR Agent defers encryption strategy and key management to Security Agent."
  - agent: observability
    type: overlaps
    boundary: "Observability Agent owns incident detection and alerting. Backup DR Agent owns incident classification frameworks and recovery procedure execution."
```

## Purpose

This agent ensures systems can survive data loss and outages through proper backup strategies, disaster recovery planning, and tested restore procedures. Without these safeguards, organizations face permanent data loss, extended downtime, and inability to meet business continuity requirements during critical incidents.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7) — process discipline

## Applicability

- Applies when configuring backup systems or schedules, implementing disaster recovery procedures, defining recovery objectives or incident classifications, creating restore scripts or runbooks, or setting up cross-region replication or off-site storage
- Excluded: Application-level caching, temporary data storage, development environment backups

---

## Rules

### HARD BOUNDARIES

### R1 — 3-2-1 Backup Rule Compliance [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure backup validation in your CI pipeline to check for 3 copies, 2 media types, 1 off-site location. For TropenOS/Supabase: verify PITR is enabled and that exports go to a separate cloud storage bucket (not same Supabase project). -->

**Why:** The 3-2-1 rule provides mathematically sound protection against simultaneous failures of storage media, facilities, and regional disasters.

**Bad → Good:**
```
# ❌ backup_config:
#      copies: 2
#      locations: ["local_disk", "same_datacenter"]

# ✅ backup_config:
#      copies: 3
#      media_types: ["disk", "tape"]
#      locations: ["primary_site", "secondary_site", "cloud_offsite"]
```

**Enforced by:** Backup Config Validator (BLOCKED, coverage: strong)

---

### R2 — Point-in-Time Recovery Configuration [BLOCKER] [BLOCKED]

<!-- GUIDE: Enable continuous log shipping and configure retention policies in your database cluster configuration. For TropenOS: verify Supabase PITR is active on the project dashboard and retention is set to at least 7 days. -->

**Why:** Without PITR capability, you can only restore to backup snapshots, potentially losing hours of critical business data.

**Bad → Good:**
```
# ❌ database_backup:
#      type: "full_snapshot"
#      schedule: "daily"

# ✅ database_backup:
#      type: "continuous_pitr"
#      log_shipping: true
#      retention: "30_days"
#      snapshot_schedule: "daily"
```

**Enforced by:** Database Config Validator (BLOCKED, coverage: strong)

---

### R3 — Recovery Objectives Definition [BLOCKER] [REVIEWED]

<!-- GUIDE: Document RTO/RPO in your service's operational runbook with business stakeholder approval. For TropenOS: add RTO/RPO targets to docs/runbooks/dr/ for each service tier. -->

**Why:** Without defined recovery objectives, teams cannot design appropriate backup strategies or make informed trade-offs between cost and availability.

**Bad → Good:**
```
# ❌ service_config:
#      backup: "enabled"

# ✅ service_config:
#      backup: "enabled"
#      rto: "4_hours"
#      rpo: "15_minutes"
#      business_impact: "revenue_critical"
```

**Enforced by:** Manual Review (REVIEWED, coverage: partial)

---

### STRUCTURAL HEURISTICS

### R4 — Quarterly Restore Testing [CRITICAL] [PREVENTED]

<!-- GUIDE: Add restore test automation to your quarterly maintenance schedule with documented results -->

**Why:** Untested backups are not backups — they're hopes. Regular testing catches corruption, configuration drift, and procedural gaps before disasters strike.

**Bad → Good:**
```
# ❌ backup_schedule:
#      frequency: "daily"
#      test_schedule: "never"

# ✅ backup_schedule:
#      frequency: "daily"
#      restore_test: "quarterly"
#      test_automation: true
#      results_documented: true
```

**Enforced by:** Backup Test Scheduler (PREVENTED, coverage: partial)

---

### R5 — Cross-Region Replication [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure your cloud provider's cross-region replication with appropriate consistency settings -->

**Why:** Single-region storage exposes your organization to regional disasters, network partitions, and provider-specific outages.

**Bad → Good:**
```
# ❌ storage_config:
#      replication: "local_redundancy"
#      regions: ["us-east-1"]

# ✅ storage_config:
#      replication: "cross_region"
#      primary_region: "us-east-1"
#      backup_regions: ["us-west-2", "eu-west-1"]
```

**Enforced by:** Infrastructure Validator (PREVENTED, coverage: strong)

---

### R6 — Disaster Recovery Runbook Currency [CRITICAL] [REVIEWED]

<!-- GUIDE: Version-control your DR runbooks and require quarterly reviews with dated approval signatures -->

**Why:** Outdated runbooks lead to incorrect procedures during high-stress incidents, potentially making disasters worse rather than resolving them.

**Bad → Good:**
```
# ❌ dr_runbook:
#      last_updated: "2022-03-15"
#      tested: false

# ✅ dr_runbook:
#      last_updated: "2024-01-15"
#      last_tested: "2024-01-10"
#      next_review: "2024-04-15"
#      approved_by: "ops_lead"
```

**Enforced by:** Documentation Review (REVIEWED, coverage: advisory)

---

### GOVERNANCE

### R7 — Incident Classification Framework [WARNING] [REVIEWED]

<!-- GUIDE: Define P0/P1/P2/P3 severity levels in your incident response documentation with escalation triggers -->

**Why:** Consistent incident classification enables appropriate resource allocation and communication during outages, preventing under-response to critical issues.

**Bad → Good:**
```
# ❌ incident_response:
#      classification: "urgent_or_not"

# ✅ incident_response:
#      p0: "total_system_outage"
#      p1: "major_functionality_impaired"
#      p2: "minor_functionality_impaired"
#      p3: "cosmetic_or_enhancement"
#      escalation_triggers: defined
```

**Enforced by:** Incident Management Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which services/environments/area]
Reason:   [why this rule doesn't apply here]
Approved: @[who]
Expires:  [date or "permanent — re-evaluate at [date]"]
Control:  [what mitigates the data loss risk instead]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

## Checklist

```
□ 3 backup copies exist across 2 media types with 1 off-site location?  (R1)
□ PITR enabled with at least 7-day retention on all production databases?  (R2)
□ RTO and RPO targets documented and stakeholder-approved per service?  (R3)
□ Restore test scheduled quarterly with automated execution and documented results?  (R4)
□ Cross-region replication configured for all production storage?  (R5)
□ DR runbook updated within last 90 days with last-tested date?  (R6)
□ Incident severity classification (P0–P3) defined with escalation triggers?  (R7)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Backup Config Validator | CI/PR | BLOCKED | strong |
| R2 | Database Config Validator | CI/PR | BLOCKED | strong |
| R3 | Manual Review | PR | REVIEWED | partial |
| R4 | Backup Test Scheduler | CI/quarterly | PREVENTED | partial |
| R5 | Infrastructure Validator | CI/PR | PREVENTED | strong |
| R6 | Documentation Review | PR | REVIEWED | advisory |
| R7 | Incident Management Review | PR | REVIEWED | advisory |
