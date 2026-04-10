# OBSERVABILITY_AGENT

## Meta

```yaml
version: 3.0
last_updated: 2026-04-03
triggers:
  files:
    - "**/logging/**"
    - "**/monitoring/**"
    - "**/telemetry/**"
    - "**/observability/**"
    - "**/*logger*"
    - "**/*metrics*"
    - "**/*tracing*"
    - "**/*sentry*"
    - "**/*alert*"
  keywords:
    - log
    - trace
    - metric
    - alert
    - monitor
    - sentry
    - uptime
    - SLO
    - incident
    - latency
    - error rate
  exclusions:
    - "**/*.spec.*"
    - "**/*.test.*"
related:
  - agent: ERROR_HANDLING
    type: overlaps
    boundary: "OBSERVABILITY owns structured logging, metrics, alert quality, error classification. ERROR_HANDLING owns error detection, response lifecycle, user-facing behavior."
  - agent: PLATFORM
    type: depends
    boundary: "Monitoring infrastructure setup lives in PLATFORM. OBSERVABILITY owns what is monitored and what triggers action."
  - agent: PERFORMANCE
    type: overlaps
    boundary: "OBSERVABILITY owns latency/throughput/error metrics collection. PERFORMANCE owns optimization targets, budgets, Core Web Vitals."
  - agent: ANALYTICS
    type: overlaps
    boundary: "OBSERVABILITY = system health (is it working?). ANALYTICS = user behavior (is it used?). Events must not be duplicated. Shared event definitions belong in a common schema."
  - agent: SECURITY
    type: consult
    boundary: "Consult for PII classification. See R8 for logging restrictions."
```

## Purpose

Defines how the system is observed in production — structured
logging, event schemas, tracing, metrics, alerting, and incident
basics. Makes the difference between "it crashed and nobody knows
why" and "we saw it coming."

This agent contains three types of rules:
- **Hard boundaries** (R1, R8) — mechanically enforceable
- **Operational standards** (R2–R6) — require judgment and
  configuration, reviewed not blocked
- **Governance** (R7) — process discipline

**Important:** Rules marked [runtime] concern infrastructure and
configuration, not just code. They cannot be fully verified from
source alone — they require a running system or deployment config.

## Applicability

- R1–R3, R8: All projects
- R4: Projects with background jobs, queues, or multi-service calls
- R5–R6: Projects deployed with real users
- R7: All projects (even minimal)

---

## Rules

### HARD BOUNDARIES

### R1 — All logging is structured [BLOCKER] [BLOCKED]

No raw console output in application code. All operational logs
use a structured logger with consistent fields.

<!-- GUIDE: Fill in your logging setup.
     Delete this block after setup. -->

```
Logger:          [e.g. pino / winston / python logging / custom]
Format:          [JSON / structured key-value]
Required fields: [timestamp, level, event_name, context/metadata]
Output:          [stdout → platform collects / direct to service]
```

**Why:** Unstructured logs are unsearchable, unfilterable, and
useless for debugging production issues. Structured logs enable
search, alerting, and dashboards.

**Scope:** Application and runtime logs that matter operationally.
Dev-only scripts, one-off migration tooling, and local debug
helpers may be excluded explicitly in the lint config.

**Bad → Good:**
```
// ❌ Unstructured — unsearchable, no context
console.log("Error creating user")
console.log(error)

// ✅ Structured — searchable, filterable, contextual
logger.error("user.creation_failed", {
  user_id: user.id,
  error_message: error.message,
  stack: error.stack,
})
```

**Enforced by:** Lint rule banning console.log/warn/error in
application code (coverage: strong).

---

### R8 — No PII or secrets in logs [CRITICAL] [BLOCKED + REVIEWED]

Logs must not contain personally identifiable information (PII)
or secrets in cleartext. If PII must be logged for debugging,
it is redacted, hashed, or masked.

<!-- GUIDE: Define your PII and secrets policy for logging.
     Delete this block after setup. -->

```
Never log:      [e.g. passwords, API keys, tokens, credit card
                 numbers, SSNs, full email addresses]
Redact/hash:    [e.g. user email → hash, IP → truncated]
Allowed:        [e.g. user_id, org_id, request_id, anonymized IDs]
```

**Why:** PII in logs creates GDPR/compliance violations, and
secrets in logs are a direct security breach. Log aggregation
systems (Datadog, Elastic, CloudWatch) retain data — once PII
is in the log pipeline, removing it is expensive and unreliable.

**Bad → Good:**
```
// ❌ PII in cleartext
logger.info("user.created", { email: "john@example.com", ip: "192.168.1.1" })

// ❌ Secret in log context
logger.error("auth.failed", { token: "sk-ant-api03-xxxxx" })

// ✅ Redacted / anonymized
logger.info("user.created", { user_id: "usr_abc123" })
logger.error("auth.failed", { token_prefix: "sk-ant...xxxxx" })
```

**Enforced by:** Static analysis for known PII field names
(email, password, token, ssn, credit_card) in log calls
(coverage: partial — catches common patterns). Review for
complex or nested data structures that may contain PII.

**Boundary:** OBSERVABILITY owns log content restrictions.
SECURITY owns the PII classification. LEGAL owns the compliance
framework (GDPR, HIPAA). Consult both when in doubt.

---

### OPERATIONAL STANDARDS

*These rules require configuration and judgment. They define what
"good observability" looks like but depend on stack, scale, and
runtime — not just code.*

### R2 — Logs follow a naming convention and schema [CRITICAL] [REVIEWED]

Log events follow a naming pattern and include required fields
that make them searchable and aggregatable.

<!-- GUIDE: Define your event naming convention and required fields.
     Delete this block after setup. -->

```
Naming:      [e.g. domain.action_result — "user.login_success"]
Separator:   [dot / underscore / colon]

Required fields per event class:
  All events:    [timestamp, level, event_name, service_name]
  Request events: [+ trace_id, method, path, status, duration_ms]
  Error events:   [+ error_type, error_message, stack]
  Job events:     [+ job_id, trace_id, duration_ms, result]
```

**Why:** Without a convention, the same event gets logged five
ways. Without required fields, events are named but not
actionable — you can find them but not analyze them.

**Bad → Good:**
```
// ❌ Inconsistent naming, no structured fields
log("user logged in")
log("Login successful")
log("auth_success")

// ✅ Consistent naming + required fields
log("user.login_success", {
  user_id: "usr_123",
  method: "email",
  duration_ms: 342,
  trace_id: "tr_abc",
})
```

**Important:** System events (OBSERVABILITY) and user behavior
events (ANALYTICS) must use separate event namespaces or prefixes.
Do not mix operational logs with product analytics tracking.

**Enforced by:** Review — "Do new events follow the naming
convention and include required fields?" Lint rule for event name
format is possible but stack-specific (coverage: partial).

---

### R3 — Errors are classified by severity [CRITICAL] [REVIEWED]

Not all errors are equal. The system distinguishes severity levels
that drive different operational responses.

```
FATAL     — System down or data corrupted. Page on-call immediately.
ERROR     — Operation failed, user impacted. Investigate within hours.
WARNING   — Something wrong, system compensated. Monitor the trend.
INFO      — Normal operation. Useful for debugging. No action needed.
```

This classification is for operational logging and alert routing —
not a universal business taxonomy. A user entering a wrong password
is INFO (expected behavior), not ERROR.

<!-- GUIDE: Map your error types to these levels.
     Delete this block after setup. -->

```
FATAL:   [e.g. DB connection lost, critical migration failed, OOM]
ERROR:   [e.g. payment failed, auth service unreachable, data inconsistency]
WARNING: [e.g. retry succeeded, cache miss, slow query > Xms]
INFO:    [e.g. user created, request completed, cron ran, login failed]
```

**Why:** When every error is logged at the same level, alerts fire
constantly and get ignored. Classification enables meaningful
alerting — page for FATAL, ticket for ERROR, monitor WARNING trends.

**Boundary:** OBSERVABILITY owns classification and logging.
ERROR_HANDLING owns detection and response lifecycle.

**Enforced by:** Review — "Are new error logs classified at the
right level?" Logger wrapper can enforce severity as a required
field (coverage: strong for presence, judgment for correctness).

---

### R4 — All requests and jobs have trace IDs [CRITICAL] [REVIEWED]

_For projects with background jobs, queues, or multi-service calls._
_[runtime]_

Every incoming HTTP request gets a unique trace/correlation ID.
Every background job, queue message, and cron job propagates a
trace ID from its trigger. Every downstream call includes the
trace ID.

<!-- GUIDE: Fill in your tracing approach.
     Delete this block after setup. -->

```
Trace ID source: [e.g. OpenTelemetry / custom middleware / request ID]
Header name:     [e.g. x-request-id / traceparent]
Propagation:     [HTTP headers, job payloads, queue message metadata]
```

**Why:** When a user reports "my payment failed," you need to
trace that request through API → validation → payment → database →
webhook. Without trace IDs, you search through thousands of
unrelated log lines.

**Bad → Good:**
```
// ❌ No correlation — logs from different requests interleaved
log("payment started")
log("calling stripe")
log("payment confirmed")

// ✅ Trace ID connects the entire flow
trace_id = request.headers["x-request-id"]
log("payment.started", { trace_id, user_id, amount })
log("payment.stripe_call", { trace_id, stripe_id })

// ✅ Background job preserves trace ID from trigger
job = queue.process((msg) => {
  trace_id = msg.metadata.trace_id
  log("job.started", { trace_id, job_id })
})
```

**Enforced by:** Middleware auto-generates trace IDs for HTTP
(coverage: strong). Queue consumers and cron jobs need explicit
propagation (coverage: partial — review required). [runtime]

---

### R5 — Baseline health metrics are collected [CRITICAL] [REVIEWED]

_For projects deployed with real users._
_[runtime]_

The system collects baseline health signals, adapted to the
runtime model:

```
Traffic       — requests/second or events/second
Failures      — errors/second, by type and endpoint
Latency       — p50, p95, p99 response times or job durations
Capacity      — resource utilization approaching limits
               (DB connections, memory, queue depth, concurrency,
               or cold-start duration for serverless)
```

These are the "Four Golden Signals" (Google SRE), translated
to your runtime. For serverless/edge, "capacity" becomes
concurrency limits, throttling events, and cold-start duration
instead of CPU/memory.

<!-- GUIDE: Fill in your metrics setup.
     Delete this block after setup. -->

```
Metrics tool:   [e.g. Prometheus / Datadog / Vercel Analytics]
Collection:     [middleware / auto-instrumentation / manual]
Dashboard:      [e.g. Grafana / Datadog / Vercel / built-in]
```

**Why:** Without metrics, you only know something is wrong when
users complain. With metrics, you see degradation before outages.

**Enforced by:** Review — "Are the four baseline signals being
collected?" [runtime — requires deployment verification]

---

### R6 — Alerts are actionable, not noisy [WARNING] [REVIEWED]

_For projects deployed with real users._
_[runtime]_

Every alert has a clear condition, threshold, and response action.
No alert fires without a defined "what to do when this triggers."

**Alert anatomy:**
```
Name:       [what is being monitored]
Condition:  [metric, threshold, duration]
Severity:   [page / ticket / monitor]
Response:   [what to do — runbook link or inline steps]
```

<!-- GUIDE: Start with 3–5 critical alerts, not 50 aspirational ones.
     Delete this block after setup. -->

**Suggested starter alerts:**
```
1. Error rate > [X]% for > 5 minutes        → page on-call
2. Latency p95 > [X]ms for > 10 minutes     → ticket
3. Database connection failures              → page on-call
4. Deployment failed                         → page on-call
5. Certificate expiry < 14 days              → ticket
```

**Anti-patterns:**
```
// ❌ 47 alerts, 40 fire daily, all ignored
// ❌ Alert with no response: "CPU > 80%" — and then what?
// ❌ Alert without threshold: "Any error" — fires constantly

// ✅ 5 alerts, each with clear action and response plan
```

**Why:** Alert fatigue is real. If developers get 20 alerts daily,
they mute all of them. Start with few, make each one worth the
interruption. Add more only when you've proven the existing ones
are actionable.

**Enforced by:** Review — "Does every alert have condition +
threshold + response?" Consider versioning alert configs as code.
[runtime]

---

### GOVERNANCE

### R7 — Incidents have a minimal response process [WARNING] [ADVISORY]

When production breaks, there is a defined process — even minimal.

```
Minimum process:
1. Detect    — Alert fires or user reports
2. Assess    — What is broken? Who is affected? How severe?
3. Mitigate  — Rollback? Feature flag? Hotfix?
4. Resolve   — Fix the root cause
5. Document  — What happened, why, what changed (blameless)
```

<!-- GUIDE: Define where incident docs live. Every runbook should
     include a "how to roll back" section.
     Delete this block after setup. -->

```
Runbook location:    [e.g. docs/runbooks/ or wiki]
Post-mortem format:  [e.g. "What → Why → What we changed"]
```

**Why:** Vibe-coded projects hit production fast. When something
breaks, the absence of any process turns a 30-minute fix into
a 3-hour panic.

**Enforced by:** Advisory — this is a practice, not a code rule.
The tool can remind: "You have 0 runbooks. Consider documenting
your top 3 failure scenarios."

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which area]
Reason:   [why]
Approved: @[who]
Expires:  [date]
Control:  [compensating measure]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

---

## Checklist

After changes to logging, monitoring, alerting, or error handling:

```
□ All logs structured (no raw console output)?    (R1) [all]
□ Log events follow naming + schema convention?   (R2) [all]
□ Errors classified by correct severity?          (R3) [all]
□ All requests and jobs have trace IDs?           (R4) [multi-service]
□ Four baseline health signals collected?         (R5) [deployed]*
□ Every alert has condition + response?           (R6) [deployed]*
□ Incident response process documented?           (R7) [all]
□ No PII or secrets in log output?                (R8) [all]
□ System logs and analytics events separated?     (—)  [all]
```

Status: ✅ yes | ❌ no | — n/a
*Requires runtime/deployment verification.

---

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Lint rule (no console.*) | CI | BLOCKED | strong |
| R8 | Static analysis (PII field names) | CI | BLOCKED | partial |
| R8 | Review | Per feature | REVIEWED | gaps |
| R2 | Event name lint (if available) | CI | BLOCKED | partial |
| R2 | Review | Per feature | REVIEWED | judgment |
| R3 | Logger (severity required field) | Runtime | BLOCKED | strong (presence) |
| R3 | Review | Per feature | REVIEWED | judgment |
| R4 | Middleware (auto trace ID for HTTP) | Runtime | BLOCKED | strong (HTTP) |
| R4 | Review | Per feature | REVIEWED | partial (queues) |
| R5 | Platform metrics check | Deployment | REVIEWED | runtime |
| R6 | Alert config review | Per deploy | REVIEWED | runtime |
| R7 | Runbook existence check | Monthly | ADVISORY | advisory |
