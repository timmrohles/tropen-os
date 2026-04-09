# PLATFORM_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "**/.github/workflows/**"
    - "**/.gitlab-ci.yml"
    - "**/Dockerfile"
    - "**/docker-compose.yml"
    - "**/infrastructure/**"
    - "**/deploy/**"
    - "**/terraform/**"
    - "**/pulumi/**"
    - "**/cdk/**"
    - "**/Makefile"
  keywords:
    - "CI/CD"
    - "deployment"
    - "infrastructure"
    - "pipeline"
    - "rollback"
    - "health check"
    - "IaC"
    - "zero-downtime"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "**/migrations/**"
    - "**/.env.local"
    - "**/docker-compose.override.yml"
related:
  - agent: architecture
    type: consult
    boundary: "Platform owns CI/CD pipeline and deployment patterns. Architecture owns system structure and module boundaries."
  - agent: security
    type: overlaps
    boundary: "Security owns secret scanning and authentication. Platform owns secret management in CI environments and deployment configuration."
  - agent: observability
    type: overlaps
    boundary: "Observability owns logging and monitoring dashboards. Platform owns health check endpoints and pipeline monitoring integration."
  - agent: security
    type: delegates
    boundary: "Platform defers to Security for secret scanning tooling and authentication configuration."
  - agent: observability
    type: delegates
    boundary: "Platform defers to Observability for logging configuration within pipelines and monitoring setup."
```

## Purpose

This agent ensures reliable deployments through proper CI/CD pipeline structure, zero-downtime deployment patterns, and Infrastructure as Code practices. Without it, deployments become manual, error-prone processes that cause outages and make rollbacks impossible.

This agent contains 3 types of rules:
- **Hard boundaries** (R1–R3) — mechanically enforceable
- **Structural heuristics** (R4–R6) — judgment-based
- **Governance** (R7–R8) — process discipline

## Applicability

- Modifying CI/CD pipeline configurations
- Adding deployment scripts or infrastructure code
- Changes affecting build, test, or deployment processes
- Infrastructure provisioning or health check implementations
- Excluded: Local development scripts, test utilities, application business logic

---

## Rules

### HARD BOUNDARIES

### R1 — All Infrastructure as Code [BLOCKER] [BLOCKED]

<!-- GUIDE: All infrastructure changes must be made through approved IaC tools (Terraform, Pulumi, CDK) and committed to the repository. Manual cloud console changes are forbidden for production. -->

**Why:** Manual infrastructure changes lead to configuration drift, making environments inconsistent, rollbacks impossible, and disaster recovery unreliable.

**Bad → Good:**
```
// Bad
manual_server_setup → gui_configuration → undocumented_changes

// Good
terraform_config → version_control → peer_review → automated_provisioning
```

**Enforced by:** Infrastructure Drift Detection (BLOCKED, coverage: strong)

---

### R2 — No Hardcoded Secrets [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure secret scanning tools like GitLeaks, TruffleHog, or GitHub Advanced Security in pre-commit and CI -->

**Why:** Hardcoded secrets in code create security vulnerabilities and make credential rotation impossible. Once in git history, they're compromised forever.

**Bad → Good:**
```
// Bad
API_KEY = "sk-1234567890abcdef"
DATABASE_URL = "postgres://user:pass@host/db"

// Good
API_KEY = process.env.API_KEY
DATABASE_URL = process.env.DATABASE_URL
```

**Enforced by:** Secret Scanner (BLOCKED, coverage: strong)

---

### R3 — Pipeline Stage Order Enforcement [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure your CI system to fail if stages run out of order or skip required steps: lint → test → build → staging → production -->

**Why:** Skipping validation stages allows bugs and regressions to reach production, causing instability and requiring emergency fixes.

**Bad → Good:**
```
// Bad
push → build → deploy_production

// Good
push → lint → type_check → unit_tests → build → integration_tests → deploy_staging → e2e_tests → deploy_production
```

**Enforced by:** CI Configuration Linter (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Zero-Downtime Deployment Required [CRITICAL] [PREVENTED]

<!-- GUIDE: Set up blue-green or rolling deployment strategy in your orchestrator (Kubernetes, Docker Swarm, ECS) -->

**Why:** Direct replacement deployments cause service interruptions and poor user experience during releases.

**Bad → Good:**
```
// Bad
stop_service → deploy_new_version → start_service

// Good
deploy_new_version_parallel → health_check → switch_traffic → terminate_old_version
```

**Enforced by:** Deployment Script Validation (PREVENTED, coverage: partial)

---

### R5 — Rollback Automation Under 5 Minutes [CRITICAL] [PREVENTED]

<!-- GUIDE: Implement automated rollback scripts and test them in staging; measure and enforce time limits -->

**Why:** Manual rollbacks during incidents are slow and error-prone when systems are under stress, increasing downtime.

**Bad → Good:**
```
// Bad
manual_database_restore → manual_code_revert → manual_service_restart

// Good
automated_rollback_script → previous_version_deployment → traffic_switch (< 5min total)
```

**Enforced by:** Deployment Testing (PREVENTED, coverage: partial)

---

### R6 — Multi-AZ for Critical Services [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure IaC to deploy critical services across at least two availability zones -->

**Why:** Single-zone deployments create single points of failure that cause complete outages during zone failures.

**Bad → Good:**
```
// Bad
critical_service → single_availability_zone → zone_failure_causes_outage

// Good
critical_service → multiple_availability_zones → zone_failure_handled_gracefully
```

**Enforced by:** IaC Static Analysis (PREVENTED, coverage: partial)

---

### GOVERNANCE

### R7 — Staging-Production Parity [WARNING] [REVIEWED]

<!-- GUIDE: Use Infrastructure as Code to ensure staging mirrors production; validate with environment comparison tools -->

**Why:** Environment differences between staging and production cause deployment surprises and "works in staging" failures.

**Bad → Good:**
```
// Bad
staging: single_server, sqlite, no_ssl
production: cluster, postgres, ssl_required

// Good
staging: mini_cluster, postgres, ssl_required (scaled down replica of production)
```

**Enforced by:** Infrastructure Comparison (REVIEWED, coverage: advisory)

---

### R8 — Health Endpoints on All Services [WARNING] [REVIEWED]

<!-- GUIDE: Implement /health and /ready endpoints following Kubernetes probe patterns; configure in service manifests -->

**Why:** Services without health checks cannot be monitored properly or participate in load balancer rotation.

**Bad → Good:**
```
// Bad
service_starts → no_health_indication → traffic_immediately

// Good
service_starts → health_endpoint_ready → load_balancer_adds → traffic_flows
```

**Enforced by:** Service Documentation Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER:**
```
Override: R1
Scope:    one-time emergency infrastructure fix during active outage
Reason:   IaC pipeline unavailable during incident; manual change required to restore service
Approved: @timm
Expires:  temporary — IaC must be updated to reflect change within 24h of incident resolution
Control:  post-incident IaC sync required; change must be documented in incident report
```

**WARNING — solo/small team:**
```
Override: R6 — single-AZ deployment acceptable for MVP stage — @timm — expires 2026-09-01
```

## Checklist

```
□ All infrastructure changes made via IaC (Terraform/Pulumi/CDK)?  (R1)
□ No hardcoded secrets in code, configs, or pipeline files?  (R2)
□ Pipeline stages run in correct order (lint → test → build → staging → prod)?  (R3)
□ Deployment uses zero-downtime strategy (blue-green or rolling)?  (R4)
□ Automated rollback tested and executes within 5 minutes?  (R5)
□ Critical services deployed across multiple availability zones?  (R6)
□ Staging environment mirrors production configuration?  (R7)
□ All services expose /health and /ready endpoints?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Infrastructure Drift Detection | CI/PR | BLOCKED | strong |
| R2 | Secret Scanner | pre-commit/CI | BLOCKED | strong |
| R3 | CI Configuration Linter | CI | BLOCKED | strong |
| R4 | Deployment Script Validation | CI/PR | PREVENTED | partial |
| R5 | Deployment Testing | CI/PR | PREVENTED | partial |
| R6 | IaC Static Analysis | CI/PR | PREVENTED | partial |
| R7 | Infrastructure Comparison | PR | REVIEWED | advisory |
| R8 | Service Documentation Review | PR | REVIEWED | advisory |
