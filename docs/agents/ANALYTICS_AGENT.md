# ANALYTICS_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "analytics/**"
    - "tracking/**"
    - "events/**"
    - "src/analytics/**"
    - "src/tracking/**"
  keywords:
    - analytics
    - tracking
    - event
    - consent
    - pii
    - gdpr
    - ccpa
    - session recording
    - mixpanel
    - amplitude
    - segment
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "migrations/**"
related:
  - agent: observability
    type: overlaps
    boundary: "Analytics Agent owns user behavior events. Observability Agent owns system health monitoring, logging, metrics, and tracing."
  - agent: security
    type: consult
    boundary: "Security Agent owns PII handling and encryption. Analytics Agent defers to Security Agent for all data protection techniques."
  - agent: legal
    type: delegates
    boundary: "Legal team owns consent mechanism compliance. Analytics Agent defers to Legal for final approval on consent flows."
```

## Purpose

Reviews user behavior analytics implementation to ensure proper separation from system observability, compliance with privacy regulations (GDPR/CCPA), and maintainable event schema design. Without this agent, projects risk legal fines from privacy violations, unreliable analytics data, and conflation of user tracking with system monitoring that makes both debugging and compliance impossible.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7) — process discipline

## Applicability

- Applies when implementing or modifying user behavior tracking events, designing or altering analytics event schemas, integrating with analytics services (e.g., Segment, Mixpanel, Amplitude), or implementing session recording or heatmap tracking
- Excluded: System health monitoring, error logging, performance metrics (handled by Observability Agent)

---

## Rules

### HARD BOUNDARIES

### R1 — No PII in Analytics Events [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure PII scanner (e.g., pii-scanner) in pre-commit hooks to detect patterns like emails, names, SSNs. Set up custom ESLint rule for analytics.track() calls. -->

**Why:** Sending Personally Identifiable Information to analytics platforms violates GDPR/CCPA, risking severe legal fines and permanent loss of user trust.

**Bad → Good:**
```
// ❌ analytics.track("User Signed Up", {
// ❌   email: "user@example.com",
// ❌   name: "John Doe",
// ❌   userId: 12345
// ❌ })

// ✅ analytics.track("User Signed Up", {
//      userId: hashPseudonym("user@example.com"),
//      timestamp: now()
//    })
```

**Enforced by:** PII Scanner (BLOCKED, coverage: strong)

---

### R2 — Analytics Consent Required [BLOCKER] [BLOCKED]

<!-- GUIDE: All analytics.track() calls must be wrapped in consent.hasConsent('analytics') check. Configure consent management library (OneTrust, Cookiebot) with ANALYTICS_CONSENT_REQUIRED=true -->

**Why:** Tracking users without explicit consent violates GDPR/CCPA, resulting in legal action and fines up to 4% of global revenue.

**Bad → Good:**
```
// ❌ trackUserAction("button_click", { buttonId: "cta-main" })

// ✅ if (consent.hasConsent("analytics")) {
//      trackUserAction("button_click", { buttonId: "cta-main" })
//    }
```

**Enforced by:** ESLint Analytics Plugin (BLOCKED, coverage: strong)

---

### R3 — Session Recording Requires Explicit Consent [BLOCKER] [BLOCKED]

<!-- GUIDE: Session recording tools (Hotjar, LogRocket) must check consent.hasConsent('session_recording') - a separate category from general analytics consent -->

**Why:** Session recordings capture highly invasive user interactions and require separate, explicit opt-in under privacy laws — general analytics consent is insufficient.

**Bad → Good:**
```
// ❌ if (consent.hasConsent("analytics")) {
// ❌   sessionRecorder.start()
// ❌ }

// ✅ if (consent.hasConsent("session_recording")) {
//      sessionRecorder.start()
//    }
```

**Enforced by:** Code Scanner (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Separate Analytics from Observability [CRITICAL] [PREVENTED]

<!-- GUIDE: Use separate services for analytics (Mixpanel, Amplitude) and observability (DataDog, NewRelic). Configure dependency linter to prevent cross-imports. -->

**Why:** Mixing user behavior tracking with system monitoring creates compliance issues, makes consent management impossible, and pollutes both data streams.

**Bad → Good:**
```
// ❌ logger.info("user clicked button", { userId, buttonId, cpuUsage, memoryUsed })

// ✅ // User analytics (if consent given)
// ✅ analytics.track("button_clicked", { buttonId, pseudonymizedUserId })
// ✅ // System observability (separate)
// ✅ logger.info("button handler executed", { handlerName, responseTime })
```

**Enforced by:** Dependency Cruiser (PREVENTED, coverage: strong)

---

### R5 — Versioned Event Schemas [CRITICAL] [PREVENTED]

<!-- GUIDE: Store schemas in schemas/analytics/ directory with version field. Use schema validation library (Joi, AJV) in CI pipeline. -->

**Why:** Unversioned schemas break analytics dashboards when changed, corrupt historical data, and make analysis across time periods impossible.

**Bad → Good:**
```
// ❌ trackEvent("purchase", { amount, item })

// ✅ trackEvent("purchase", {
//      schemaVersion: "2.0",
//      amount: number,
//      itemId: string,
//      currency: string,
//      timestamp: ISO8601
//    })
```

**Enforced by:** Schema Validator (PREVENTED, coverage: partial)

---

### R6 — Pseudonymize User Identifiers [CRITICAL] [PREVENTED]

<!-- GUIDE: Use identity.getAnonymousId() from central identity service. Never use raw database IDs or emails in events. -->

**Why:** Direct user IDs enable re-identification, increasing privacy breach risk and making GDPR "right to be forgotten" compliance impossible.

**Bad → Good:**
```
// ❌ event: { userId: user.databaseId, email: user.email }

// ✅ event: { userId: identity.getAnonymousId(user), sessionId: generateUUID() }
```

**Enforced by:** Type Checker (PREVENTED, coverage: strong)

---

### GOVERNANCE

### R7 — Document Event Schemas [WARNING] [REVIEWED]

<!-- GUIDE: Maintain analytics_events.md with event catalog including purpose, schema, and business context for each event -->

**Why:** Undocumented events become technical debt when stakeholders need insights, leading to duplicate events and inconsistent tracking.

**Bad → Good:**
```
// ❌ track("btn_clk")

// ✅ // Documented in analytics_events.md:
// ✅ // Event: purchase_initiated
// ✅ // Purpose: Track when user starts checkout flow
// ✅ // Schema: v2.0 { productId: string, source: string }
// ✅ track("purchase_initiated", { productId, source: "product_page" })
```

**Enforced by:** Documentation Linter (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which files/endpoints/area]
Reason:   [why this rule doesn't apply here]
Approved: @[who]
Expires:  [date or "permanent — re-evaluate at [date]"]
Control:  [what mitigates the privacy/compliance risk instead]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

## Checklist

```
□ No PII (email, name, raw userId) in any analytics.track() call?  (R1)
□ All analytics.track() calls wrapped in consent.hasConsent('analytics') check?  (R2)
□ Session recording uses separate consent.hasConsent('session_recording') check?  (R3)
□ Analytics events use separate service from system observability/logging?  (R4)
□ Event payloads include schemaVersion field?  (R5)
□ User identifiers pseudonymized via identity.getAnonymousId()?  (R6)
□ New events documented in analytics_events.md with purpose and schema?  (R7)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | PII Scanner | pre-commit/CI | BLOCKED | strong |
| R2 | ESLint Analytics Plugin | pre-commit | BLOCKED | strong |
| R3 | Code Scanner | CI | BLOCKED | strong |
| R4 | Dependency Cruiser | CI | PREVENTED | strong |
| R5 | Schema Validator | CI | PREVENTED | partial |
| R6 | Type Checker | CI | PREVENTED | strong |
| R7 | Documentation Linter | PR | REVIEWED | advisory |
