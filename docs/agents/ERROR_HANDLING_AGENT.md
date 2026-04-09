# ERROR_HANDLING_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "**/*.ts"
    - "**/*.tsx"
    - "src/lib/errors/**"
    - "src/app/api/**"
  keywords:
    - try/catch
    - error handling
    - AppError
    - ValidationError
    - circuit breaker
    - retry
    - timeout
    - Zod validation
  exclusions:
    - "*.test.ts"
    - "*.spec.ts"
    - "*.test.tsx"
    - "*.generated.ts"
    - "migrations/**"
related:
  - agent: architecture
    type: consult
    boundary: "Error Handling owns error types and recovery patterns. Architecture owns overall system structure."
  - agent: security
    type: consult
    boundary: "Error Handling owns structured error responses. Security owns auth errors, injection attack handling, and what must never be leaked."
  - agent: observability
    type: consult
    boundary: "Error Handling owns error propagation patterns. Observability owns log formats, PII redaction, and error telemetry."
  - agent: security
    type: overlaps
    boundary: "Error Handling and Security both touch input validation errors; Security owns injection prevention, Error Handling owns validation error structure."
  - agent: observability
    type: overlaps
    boundary: "Error Handling and Observability both touch error logging; Observability owns log format and PII redaction, Error Handling owns what gets logged."
  - agent: security
    type: delegates
    boundary: "Error Handling delegates auth errors and injection attack handling to Security."
  - agent: observability
    type: delegates
    boundary: "Error Handling delegates log format decisions and PII redaction to Observability."
```

## Purpose

The Error Handling Agent ensures errors are caught, typed, and handled gracefully throughout the system. Without proper error handling, applications crash unexpectedly, users see cryptic messages, and debugging becomes impossible. This agent enforces structured error types, recovery patterns, and resilient external service integration.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8) — process discipline

## Applicability

- Writing try/catch blocks or error handling logic
- Creating API routes that return error responses
- Integrating with external services or databases
- Defining custom error types or validation schemas
- Excluded: Pure UI components, build scripts, authentication errors (Security Agent), error telemetry (Observability Agent)

---

## Rules

### HARD BOUNDARIES

### R1 — No Empty Catch Blocks [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint rule @typescript-eslint/no-empty-function for catch blocks -->

**Why:** Empty catch blocks silently swallow errors, making debugging impossible and hiding critical failures.

**Bad → Good:**
```
// Bad
try {
  dangerousOperation()
} catch (e) {
  // Silent failure — error is lost forever
}

// Good
try {
  dangerousOperation()
} catch (e) {
  logger.error('Operation failed', { error: e, context: 'user-action' })
  throw new AppError('Operation unavailable', 'OPERATION_FAILED')
}
```

**Enforced by:** ESLint (BLOCKED, coverage: strong)

---

### R2 — Structured Error Types Only [BLOCKER] [BLOCKED]

<!-- GUIDE: Import all error types from src/lib/errors.ts, never throw raw strings or generic Error objects -->

**Why:** Unstructured errors make it impossible to handle different failure modes appropriately or provide meaningful user feedback.

**Bad → Good:**
```
// Bad
throw "Something went wrong"
throw new Error("Database failed")

// Good
throw new DatabaseError('User query failed', { userId, query })
throw new ValidationError('Invalid email format', { field: 'email' })
```

**Enforced by:** TypeScript + ESLint (BLOCKED, coverage: strong)

---

### R3 — API Routes Must Catch All Errors [BLOCKER] [BLOCKED]

<!-- GUIDE: Wrap all API route handlers in try/catch, return { error: string, code?: string } format -->

**Why:** Uncaught errors in API routes crash the server and expose internal details to clients.

**Bad → Good:**
```
// Bad
export async function POST(request: Request) {
  const user = await database.createUser(data) // Can throw
  return Response.json(user)
}

// Good
export async function POST(request: Request) {
  try {
    const user = await database.createUser(data)
    return Response.json(user)
  } catch (error) {
    return Response.json(
      { error: 'User creation failed', code: 'USER_CREATE_ERROR' },
      { status: 500 }
    )
  }
}
```

**Enforced by:** Custom ESLint Rule (BLOCKED, coverage: partial)

---

### STRUCTURAL HEURISTICS

### R4 — External Calls Must Have Timeouts [CRITICAL] [PREVENTED]

<!-- GUIDE: Set timeout on fetch calls, database queries, and third-party SDK calls using AbortController or library timeout options -->

**Why:** External services can hang indefinitely, blocking threads and degrading user experience.

**Bad → Good:**
```
// Bad
const response = await fetch(externalAPI)

// Good
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)
const response = await fetch(externalAPI, {
  signal: controller.signal
})
```

**Enforced by:** Custom Linter (PREVENTED, coverage: partial)

---

### R5 — Validate Before Business Logic [CRITICAL] [PREVENTED]

<!-- GUIDE: Use Zod schemas to validate all inputs before processing, especially in API routes and form handlers -->

**Why:** Invalid data causes unpredictable errors deep in business logic, making debugging difficult.

**Bad → Good:**
```
// Bad
export async function createUser(userData) {
  const user = await database.save(userData) // Fails with cryptic DB error
}

// Good
export async function createUser(userData) {
  const validated = userSchema.parse(userData) // Clear validation error
  const user = await database.save(validated)
}
```

**Enforced by:** TypeScript + Zod (PREVENTED, coverage: strong)

---

### R6 — Retry Transient Failures [CRITICAL] [REVIEWED]

<!-- GUIDE: Use exponential backoff for network errors, rate limits, and temporary service failures -->

**Why:** Temporary failures (network glitches, rate limits) should not cause permanent user-facing errors.

**Bad → Good:**
```
// Bad
try {
  return await apiCall()
} catch (error) {
  throw error // Fails permanently on temporary issues
}

// Good
return await retryWithBackoff(apiCall, {
  maxRetries: 3,
  baseDelay: 1000,
  retryOn: ['NETWORK_ERROR', 'RATE_LIMITED']
})
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

### GOVERNANCE

### R7 — User-Friendly Error Messages [WARNING] [REVIEWED]

<!-- GUIDE: Never expose stack traces, database errors, or internal system details to end users -->

**Why:** Technical error messages confuse users and potentially expose sensitive system information.

**Bad → Good:**
```
// Bad
return { error: error.stack } // Exposes internals
return { error: "Database connection failed on localhost:5432" }

// Good
return { error: "Unable to save your changes. Please try again." }
return { error: "Service temporarily unavailable", code: "SERVICE_DOWN" }
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

### R8 — Circuit Breaker for Cascading Failures [WARNING] [REVIEWED]

<!-- GUIDE: Implement circuit breaker pattern for critical external dependencies to prevent cascade failures -->

**Why:** When external services fail, continued attempts can overwhelm them and cascade failures through the system.

**Bad → Good:**
```
// Bad
// Always tries external service, even when it's known to be down

// Good
if (circuitBreaker.isOpen('payment-service')) {
  return fallbackPaymentResponse()
}
try {
  return await paymentService.process()
} catch (error) {
  circuitBreaker.recordFailure('payment-service')
  throw error
}
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R1
Scope:    src/app/error.tsx, src/app/global-error.tsx
Reason:   Next.js error boundary components intentionally catch and display errors without re-throwing
Approved: @[who]
Expires:  permanent — re-evaluate at 2027-01-01
Control:  Errors are rendered to user via error boundary UI; Sentry captures them via captureException
```

**WARNING — solo/small team:**
```
Override: R8 — circuit breaker library not yet selected — @[who] — expires 2026-07-01
```

## Checklist

```
□ No empty catch blocks anywhere in the codebase?  (R1)
□ All thrown errors use types from src/lib/errors.ts?  (R2)
□ Every API route handler wrapped in try/catch with structured JSON response?  (R3)
□ All external fetch/SDK calls have timeout via AbortController or option?  (R4)
□ Zod validation runs before any business logic in API routes?  (R5)
□ Transient failures (network, rate limit) retried with exponential backoff?  (R6)
□ User-facing error messages are human-readable with no internal details?  (R7)
□ Circuit breaker in place for critical external dependencies?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint | pre-commit/CI | BLOCKED | strong |
| R2 | TypeScript + ESLint | pre-commit | BLOCKED | strong |
| R3 | Custom ESLint Rule | CI/PR | BLOCKED | partial |
| R4 | Custom Linter | CI | PREVENTED | partial |
| R5 | TypeScript + Zod | pre-commit | PREVENTED | strong |
| R6 | Manual Review | PR | REVIEWED | advisory |
| R7 | Manual Review | PR | REVIEWED | advisory |
| R8 | Manual Review | PR | REVIEWED | advisory |
