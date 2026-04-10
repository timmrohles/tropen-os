# COST_AWARENESS_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "cloud/**"
    - "infra/**"
    - "terraform/**"
    - "src/llm/**"
    - "src/ai/**"
    - "package.json"
    - "requirements.txt"
    - "Dockerfile"
  keywords:
    - budget
    - token limit
    - rate limit
    - LLM cost
    - cloud spend
    - vendor lock-in
    - license
  exclusions:
    - "*.test.ts"
    - "*.spec.ts"
    - "*.test.tsx"
    - "*.generated.ts"
    - "migrations/**"
related:
  - agent: architecture
    type: consult
    boundary: "Cost Awareness owns cloud spend and budget enforcement. Architecture owns system design and module organization."
  - agent: security
    type: consult
    boundary: "Cost Awareness owns rate limiting for cost control. Security owns rate limiting for DoS protection and secret management for API keys."
  - agent: observability
    type: consult
    boundary: "Cost Awareness owns budget thresholds and alerts. Observability owns metric collection implementation."
  - agent: observability
    type: delegates
    boundary: "Cost Awareness delegates metric collection implementation to Observability."
  - agent: security
    type: delegates
    boundary: "Cost Awareness delegates secret management for API keys to Security."
  - agent: observability
    type: overlaps
    boundary: "Cost Awareness and Observability both touch metric collection and monitoring boundaries; Cost Awareness owns the budget dimension."
  - agent: security
    type: overlaps
    boundary: "Cost Awareness and Security both touch rate limiting; Security owns DoS prevention, Cost Awareness owns quota exhaustion."
```

## Purpose

Prevents runaway cloud costs, enforces token budgets, and maintains vendor independence. Without cost awareness, AI applications can burn through budgets in hours and create irreversible vendor dependencies.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5) — judgment-based
- **Governance** (R6, R7) — process discipline

## Applicability

- Configuring cloud resources or AI service integrations
- Adding external dependencies or SaaS integrations
- Implementing rate limiting or quota systems
- Excluded: Internal business logic, UI components, test utilities

---

## Rules

### HARD BOUNDARIES

### R1 — Budget Alert Configuration Required [BLOCKER] [BLOCKED]

<!-- GUIDE: Set up budget alerts in your cloud console (AWS Budget Alerts, Anthropic Console usage limits) with 50%, 80%, 100% thresholds -->

**Why:** Without automated budget alerts, cost overruns can drain accounts before anyone notices, especially with AI workloads that scale unpredictably.

**Bad → Good:**
```
// Bad
llm_client = AnthropicClient(api_key=key)
# No budget limits configured

// Good
llm_client = AnthropicClient(
  api_key=key,
  budget_alert_thresholds=[0.5, 0.8, 1.0],
  monthly_limit=1000.00
)
```

**Enforced by:** Infrastructure Validation (BLOCKED, coverage: strong)

---

### R2 — Token Budget Enforcement Per Entity [BLOCKER] [BLOCKED]

<!-- GUIDE: Implement token tracking with Redis counters or database quotas, reset monthly/daily based on subscription tier -->

**Why:** Uncontrolled token usage can exhaust budgets within hours and create poor user experience through service degradation.

**Bad → Good:**
```
// Bad
async function callLLM(prompt, user_id) {
  return await llm.complete(prompt)
}

// Good
async function callLLM(prompt, user_id, feature_tag) {
  await enforceTokenBudget(user_id, feature_tag, estimated_tokens)
  return await llm.complete(prompt)
}
```

**Enforced by:** Runtime Guards (BLOCKED, coverage: strong)

---

### R3 — Rate Limits On All LLM Endpoints [BLOCKER] [BLOCKED]

<!-- GUIDE: Use middleware like express-rate-limit or implement Redis-based rate limiting with per-user and global limits -->

**Why:** Unprotected LLM endpoints can be abused to exhaust quotas, create denial-of-service conditions, or trigger massive cost spikes.

**Bad → Good:**
```
// Bad
app.post("/ai/complete", async (req, res) => {
  const result = await llm.complete(req.body.prompt)
  res.json(result)
})

// Good
app.post("/ai/complete",
  rateLimiter({per_user: "10/hour", global: "1000/hour"}),
  async (req, res) => {
    const result = await llm.complete(req.body.prompt)
    res.json(result)
  }
)
```

**Enforced by:** API Middleware (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — License Compliance Check [CRITICAL] [PREVENTED]

<!-- GUIDE: Use tools like license-checker, pip-licenses, or FOSSA to scan dependencies and flag GPL/AGPL conflicts with commercial usage -->

**Why:** License violations can trigger expensive legal action, forced open-sourcing of proprietary code, or emergency dependency replacements.

**Bad → Good:**
```
// Bad
dependencies: {
  "some-gpl-library": "^1.0.0"  // GPL incompatible with commercial use
}

// Good
dependencies: {
  "some-mit-library": "^1.0.0"  // MIT compatible
}
# License scan: all dependencies cleared for commercial use
```

**Enforced by:** License Scanner (PREVENTED, coverage: strong)

---

### R5 — Cost Attribution Via Tags [CRITICAL] [REVIEWED]

<!-- GUIDE: Tag all cloud resources with cost-center, feature, environment, owner tags for cost allocation and budget tracking -->

**Why:** Without proper cost attribution, teams can't optimize spending or allocate infrastructure costs to the right business units.

**Bad → Good:**
```
// Bad
resource "aws_instance" "app" {
  instance_type = "t3.large"
}

// Good
resource "aws_instance" "app" {
  instance_type = "t3.large"
  tags = {
    cost-center = "engineering"
    feature = "ai-chat"
    environment = "production"
    owner = "ai-team"
  }
}
```

**Enforced by:** Infrastructure Review (REVIEWED, coverage: partial)

---

### GOVERNANCE

### R6 — Vendor Lock-in Risk Documentation [WARNING] [REVIEWED]

<!-- GUIDE: Create docs/vendor-analysis.md documenting proprietary features used, data portability, API compatibility, and migration complexity -->

**Why:** Hidden vendor dependencies create expensive migration barriers and reduce negotiating power during contract renewals.

**Bad → Good:**
```
// Bad
# No documentation of vendor-specific features used

// Good
# Vendor Risk Assessment
## Anthropic Claude
- Proprietary: Constitutional AI training methodology
- Portable: Standard OpenAI-compatible chat format
- Migration effort: Low (2-3 days)
- Exit strategy: Documented in migration-guide.md
```

**Enforced by:** Documentation Review (REVIEWED, coverage: partial)

---

### R7 — Exit Strategy Documentation [WARNING] [REVIEWED]

<!-- GUIDE: Document specific migration steps, data export procedures, API compatibility layers, and estimated timeline/cost in docs/exit-strategies/ -->

**Why:** Without documented exit strategies, vendor relationships become permanent dependencies that enable price increases and service degradation.

**Bad → Good:**
```
// Bad
# Using vendor services with no migration plan

// Good
# Exit Strategy: Anthropic → OpenAI
1. Export conversation history via API
2. Retrain prompt templates for GPT format
3. Update client libraries (estimated 2 days)
4. A/B test response quality (1 week)
Total migration time: 2 weeks
```

**Enforced by:** Documentation Review (REVIEWED, coverage: partial)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R1
Scope:    Local development environments
Reason:   Budget alerts not applicable to dev/test environments with no production spend
Approved: @[who]
Expires:  permanent — re-evaluate at 2027-01-01
Control:  CI gate ensures alerts are configured before production deployment
```

**WARNING — solo/small team:**
```
Override: R6 — vendor analysis doc not yet written — @[who] — expires 2026-07-01
```

## Checklist

```
□ Budget alerts configured at 50%, 80%, 100% thresholds?  (R1)
□ Token budget enforcement in place per user/org entity?  (R2)
□ Rate limits applied to all LLM endpoints?  (R3)
□ All dependencies scanned for license compatibility?  (R4)
□ Cloud resources tagged with cost-center, feature, environment, owner?  (R5)
□ Vendor-specific features documented with migration complexity?  (R6)
□ Exit strategy documented for each critical vendor?  (R7)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Infrastructure Validation | pre-deploy | BLOCKED | strong |
| R2 | Runtime Guards | runtime | BLOCKED | strong |
| R3 | API Middleware | runtime | BLOCKED | strong |
| R4 | License Scanner | pre-commit/CI | PREVENTED | strong |
| R5 | Infrastructure Review | PR | REVIEWED | partial |
| R6 | Documentation Review | PR | REVIEWED | partial |
| R7 | Documentation Review | PR | REVIEWED | partial |
