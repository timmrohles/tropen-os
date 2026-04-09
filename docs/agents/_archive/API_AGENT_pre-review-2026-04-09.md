# API_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "api/**"
    - "routes/**"
    - "controllers/**"
    - "handlers/**"
    - "src/app/api/**"
    - "webhooks/**"
    - "openapi.yaml"
  keywords:
    - api
    - endpoint
    - webhook
    - versioning
    - rest
    - http
    - resilience
    - circuit breaker
    - openapi
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "openapi-generated/**"
related:
  - agent: architecture
    type: consult
    boundary: "Architecture Agent owns internal service-to-service call patterns. API Agent owns externally-facing HTTP endpoints and webhook handlers."
  - agent: security
    type: overlaps
    boundary: "Security Agent owns authentication, crypto, and injection prevention. API Agent owns versioning, error structure, and resilience patterns."
  - agent: observability
    type: delegates
    boundary: "Observability Agent owns internal error logging patterns. API Agent owns the error response structure returned to clients."
```

## Purpose

The API Agent ensures APIs are versioned, documented, resilient, and consistent from day one. It prevents breaking changes, undocumented endpoints, and cascading failures that plague production systems as they scale.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8) — process discipline

## Applicability

- Applies when adding or modifying HTTP endpoints, creating webhook handlers or external service integrations, or implementing retry logic or resilience patterns
- Excluded: Internal service-to-service calls (Architecture Agent), authentication logic (Security Agent)

---

## Rules

### HARD BOUNDARIES

### R1 — Public API routes must be versioned [WARNING] [REVIEWED]

<!-- GUIDE: Only applies to projects with external/public APIs. Internal Next.js App Router routes serving only the project's own frontend are EXEMPT — they are internal RPC endpoints, not public contracts. -->

**Applicability:** Only projects with external/public APIs. Most Next.js projects do NOT need API versioning — their `/api/*` routes are internal RPC endpoints called only by their own frontend.

**Detection — does the project have a public API?**
- OpenAPI/Swagger spec exists (`openapi.yaml`, `swagger.json`, etc.) → public API → rule applies
- External API documentation exists (`docs/api/`, `API.md`) → rule applies
- API keys issued to external consumers → rule applies
- Only internal `fetch()` calls from own components → **EXEMPT**

**Why:** Public APIs are contracts with external consumers. Breaking changes without versioning destroy trust and break integrations. Internal routes can change freely because the consumer (own frontend) is deployed simultaneously.

**Bad → Good:**
```
// Only for PUBLIC APIs exposed to external consumers:
// ❌ GET /api/users (external consumers hardcode this)
// ✅ GET /api/v1/users (breaking changes go to /api/v2/)

// Internal Next.js routes — NO versioning needed:
// /api/audit/trigger    — called only by own frontend ✓
// /api/cockpit/budget   — called only by own frontend ✓
```

**Enforced by:** Review (REVIEWED) — Coverage: judgment. Automated detection of public vs. internal API is partial.

---

### R2 — Consistent Error Response Structure [BLOCKER] [BLOCKED]

<!-- GUIDE: Implement global error middleware enforcing { error: { message, code } } format with TypeScript types. In TropenOS: use { error: string, code?: string } from src/lib/errors.ts — validateBody() and getAuthUser() already produce this shape. -->

**Why:** Inconsistent error formats break client error handling and make debugging impossible across endpoints.

**Bad → Good:**
```
// ❌ { "message": "Not found" }
// ❌ { "err": "Invalid input", "status": 400 }

// ✅ { "error": { "message": "User not found", "code": "USER_NOT_FOUND" } }
// ✅ { "error": { "message": "Invalid email", "code": "VALIDATION_ERROR", "field": "email" } }
```

**Enforced by:** TypeScript Type Guards (BLOCKED, coverage: strong)

---

### R3 — Webhook Signature Validation [BLOCKER] [BLOCKED]

<!-- GUIDE: Use webhook validation library (e.g., stripe-webhook-validator) in handler middleware -->

**Why:** Unvalidated webhooks allow attackers to trigger arbitrary actions by forging requests from external services.

**Bad → Good:**
```
// ❌ handleWebhook(request) {
// ❌   processEvent(request.body)
// ❌ }

// ✅ handleWebhook(request) {
//      if (!validateSignature(request.body, request.headers['x-signature'], SECRET)) {
//        throw new UnauthorizedError("Invalid signature")
//      }
//      processEvent(request.body)
//    }
```

**Enforced by:** Static Analysis (BLOCKED, coverage: partial)

---

### STRUCTURAL HEURISTICS

### R4 — Resilience Patterns Required [CRITICAL] [PREVENTED]

<!-- GUIDE: Use resilience library with timeout: 5000ms, retries: 3, exponential backoff, circuit breaker -->

**Why:** APIs without timeouts and retries create cascading failures that bring down entire systems during high load or network issues.

**Bad → Good:**
```
// ❌ const response = await fetch(externalAPI)

// ✅ const response = await resilientClient.get(externalAPI, {
//      timeout: 5000,
//      retries: 3,
//      circuitBreaker: { threshold: 5, resetTimeout: 60000 }
//    })
```

**Enforced by:** Code Scanner (PREVENTED, coverage: partial)

---

### R5 — Vendor Abstraction Layer [CRITICAL] [PREVENTED]

<!-- GUIDE: Create interfaces in services/abstractions/ and implement vendor-specific adapters. In TropenOS: follow the Service Adapter System pattern from CLAUDE.md — all external vendors behind adapters in src/lib/. -->

**Why:** Direct vendor coupling makes switching providers expensive and creates vendor lock-in that limits future architectural choices.

**Bad → Good:**
```
// ❌ import Stripe from 'stripe'
// ❌ const charge = await stripe.charges.create(...)

// ✅ interface PaymentGateway {
//      createCharge(amount: number): Promise<ChargeResult>
//    }
// ✅ class StripeAdapter implements PaymentGateway { ... }
// ✅ const charge = await paymentGateway.createCharge(amount)
```

**Enforced by:** Dependency Checker (PREVENTED, coverage: strong)

---

### R6 — OpenAPI Documentation Required [CRITICAL] [PREVENTED]

<!-- GUIDE: Use @nestjs/swagger decorators or equivalent, validate spec presence in CI -->

**Why:** Undocumented APIs create integration friction, support burden, and make breaking changes invisible until production.

**Bad → Good:**
```
// ❌ defineRoute('/users/:id', getUserHandler)

// ✅ defineRoute('/users/:id', {
//      summary: 'Get user by ID',
//      parameters: { id: 'User UUID' },
//      responses: { 200: UserDto }
//    }, getUserHandler)
```

**Enforced by:** Documentation Linter (PREVENTED, coverage: partial)

---

### GOVERNANCE

### R7 — Semantic HTTP Usage [WARNING] [REVIEWED]

<!-- GUIDE: Follow REST conventions: GET=read, POST=create, PUT=update, DELETE=remove, proper status codes -->

**Why:** Misused HTTP verbs break caching, confuse clients, and violate REST principles that enable web-scale architecture.

**Bad → Good:**
```
// ❌ GET /api/v1/users/123/delete
// ❌ POST /api/v1/users/123 (returns 200 for creation)

// ✅ DELETE /api/v1/users/123
// ✅ POST /api/v1/users (returns 201 Created)
```

**Enforced by:** API Linter (REVIEWED, coverage: advisory)

---

### R8 — Input/Output Contract Validation [WARNING] [REVIEWED]

<!-- GUIDE: Use schema validation library (Zod, class-validator) for all request/response contracts. In TropenOS: use validateBody() from src/lib/validators/ in every API route before business logic. -->

**Why:** Missing validation exposes internal data structures and creates security vulnerabilities through malformed input.

**Bad → Good:**
```
// ❌ createUser(@Body() userData: any) {
// ❌   return this.userService.create(userData)
// ❌ }

// ✅ createUser(@Body() userData: CreateUserDto) {
//      const user = this.userService.create(userData)
//      return UserResponseDto.from(user) // explicit output contract
//    }
```

**Enforced by:** Schema Validator (REVIEWED, coverage: partial)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which files/endpoints/area]
Reason:   [why this rule doesn't apply here — e.g., "Legacy endpoint, migration planned Q2"]
Approved: @[who — e.g., tech-lead]
Expires:  [date or "permanent — re-evaluate at [date]"]
Control:  [what mitigates the risk instead]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

## Checklist

```
□ All new external endpoints prefixed with /api/v[N]/?  (R1)
□ Error responses follow { error: { message, code } } structure?  (R2)
□ Webhook handlers validate HMAC/signature before processing?  (R3)
□ External HTTP calls have timeout, retry, and circuit breaker configured?  (R4)
□ External vendor SDKs accessed only through abstraction adapter?  (R5)
□ New endpoints have OpenAPI/swagger documentation?  (R6)
□ HTTP verbs and status codes follow REST semantics?  (R7)
□ Request bodies validated with Zod/DTO before business logic?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint Custom Rule | pre-commit/CI | BLOCKED | strong |
| R2 | TypeScript Type Guards | compile-time | BLOCKED | strong |
| R3 | Static Analysis | CI | BLOCKED | partial |
| R4 | Code Scanner | CI | PREVENTED | partial |
| R5 | Dependency Checker | CI | PREVENTED | strong |
| R6 | Documentation Linter | CI | PREVENTED | partial |
| R7 | API Linter | PR | REVIEWED | advisory |
| R8 | Schema Validator | CI | REVIEWED | partial |
