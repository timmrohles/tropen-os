# SECURITY_AGENT

## Meta

```yaml
version: 2.1
last_updated: 2026-04-09
triggers:
  files:
    - "**/auth/**"
    - "**/middleware*"
    - "**/api/**"
    - "**/*guard*"
    - "**/*session*"
    - "**/*token*"
    - "**/*cookie*"
  keywords:
    - auth
    - login
    - password
    - secret
    - token
    - session
    - cors
    - csrf
    - cookie
  exclusions:
    - "**/*.spec.*"
    - "**/*.test.*"
    - "**/fixtures/**"
    - ".env.example"
related:
  - agent: ERROR_HANDLING
    type: overlaps
    boundary: "SECURITY owns leakage risk. ERROR_HANDLING owns error lifecycle."
  - agent: API
    type: overlaps
    boundary: "SECURITY owns threat prevention. API owns contract shape."
  - agent: LEGAL
    type: consult
    boundary: "Consult for PII, regulated flows, LLM data governance."
  - agent: DEPENDENCIES
    type: delegates
    boundary: "CVE scanning and supply chain live in DEPENDENCIES."
  - agent: PLATFORM
    type: depends
    boundary: "Secrets injection at runtime. Environment config."
```

## Purpose

Defines security requirements for authentication, authorization,
input validation, secrets management, session security, and API
hardening.

## Applicability

- R1–R3, R5, R8: All projects
- R4: Only multi-tenant projects
- R6–R7: Only projects with public-facing endpoints
- R9: Only projects making LLM API calls

---

## Rules

### R1 — No secrets in code [BLOCKER] [BLOCKED]

Secrets (API keys, tokens, passwords, connection strings) must never
be hardcoded or committed. They must be provided through approved
secret management mechanisms.

<!-- GUIDE: Fill in your secret management approach.
     Delete this block after setup. -->

```
Local/Dev:      [.env.local / .env / etc.]
Production:     [Secret Manager / Vault / KMS / Runtime injection]
Access pattern: [e.g. env("API_KEY") or config.get("api_key")]
Validation:     [e.g. schema validation at app startup]
Rotation:       [e.g. quarterly, or immediately on suspected leak]
```

**Why:** A single leaked secret compromises the entire system.
Secrets persist in git history even after deletion. Environment
variables can also leak if exposed client-side — validate that
secrets are never bundled into frontend builds.

**Bad → Good:**
```
// ❌ Hardcoded secret
key = "sk-ant-api03-xxxxx"

// ✅ From environment, validated at startup
key = env("ANTHROPIC_API_KEY")
if not key → fail("ANTHROPIC_API_KEY not set")
```

**Enforced by:** gitleaks (pre-commit + CI, coverage: strong),
truffleHog (CI deep history scan, coverage: strong)

---

### R2 — Validate all external input [BLOCKER] [BLOCKED + REVIEWED]

All external input is validated before processing: request bodies,
query params, headers, cookies, webhook payloads, file uploads,
cron payloads, queue messages, and third-party API responses.

<!-- GUIDE: Fill in your validation setup.
     Delete this block after setup. -->

```
Validation lib: [Zod / Joi / Pydantic / class-validator / etc.]
Schema path:    [e.g. src/schemas/ or shared/schemas/]
```

**Why:** Unvalidated input is the root cause of injection attacks,
data corruption, and crashes. CI can check that validation exists
in route files (presence check), but cannot verify semantic
completeness or that all input vectors are covered. Review fills gaps.

**Bad → Good:**
```
// ❌ No validation — raw input used directly
handle POST /api/users:
  db.insert(users, request.body)

// ✅ Schema validates before processing
UserSchema = { email: valid_email, name: string(1..100) }

handle POST /api/users:
  data = validate(request.body, UserSchema)
  db.insert(users, data)
```

**Enforced by:** CI check for schema import in route files
(coverage: partial — presence only). Review for semantic
completeness and non-route input vectors (webhooks, queues, cron).

---

### R3 — Authentication and session security [BLOCKER]

No protected endpoint is reachable without authentication.
Auth check happens centrally — not per handler.
Session tokens are secured against theft and misuse.

<!-- GUIDE: Fill in your auth setup.
     Delete this block after setup. -->

```
Auth provider:  [Supabase Auth / NextAuth / Clerk / Lucia / etc.]
Auth guard:     [e.g. middleware / withAuth() / decorator]
Session type:   [JWT / Cookie / Session Token]
```

**Why:** A single unprotected endpoint leaks data or enables
unauthorized actions. Insecure session cookies allow session
hijacking via XSS or network interception.

**Route protection — Enforcement:**
```
Target:  PREVENTED (all routes private by default — public routes
         explicitly whitelisted in central config)
Current: [PREVENTED / BLOCKED / REVIEWED — fill in actual state]
```

<!-- GUIDE: PREVENTED = your framework denies access by default.
     Public routes must be explicitly registered in a central
     allowlist. If developers must remember to add auth guards
     per route → BLOCKED (linter) or REVIEWED.
     Delete this block after setup. -->

**Route protection — Bad → Good:**
```
// ❌ No auth — endpoint is publicly accessible
handle GET /api/admin/users → return db.query(users)

// ✅ Central auth guard (forgettable → BLOCKED/REVIEWED)
handle GET /api/admin/users [require_auth("admin")] → ...

// ✅✅ Best: Default-deny (PREVENTED)
// All /api/* routes require auth via central middleware
// Public routes explicitly listed: ["/api/health", "/api/auth/login"]
```

**Session cookies — Required attributes:**
```
HttpOnly   = true    (prevents XSS access to session token)
Secure     = true    (HTTPS only — required in production,
                      may be disabled in local dev)
SameSite   = Lax     (CSRF protection — Strict if no cross-site needed)
Domain     = [your domain only]
Path       = /       (or most restrictive path possible)
MaxAge     = [session duration, e.g. 86400 for 24h]
```

<!-- GUIDE: If your auth provider handles cookies automatically,
     verify its config matches these attributes. If you set
     cookies manually, enforce in code. The Secure flag requires
     HTTPS — in local dev without HTTPS this is expected behavior,
     not a violation. CI checks should run in production-like env.
     Delete this block after setup. -->

**Enforced by:** [depends on target/current — see above].
Cookie attributes: CI check on framework config or response headers
(coverage: strong in production-like env).

---

### R4 — Tenant isolation on every data query [BLOCKER]

Gilt nur für Multi-Tenant-Projekte (org_id, tenant_id oder workspace_id im DB-Schema).

Every data query filters by tenant. No user sees another tenant's data.

<!-- GUIDE: Fill in your tenant strategy.
     Delete this block after setup. -->

```
Tenant field:   [e.g. organization_id / team_id]
Roles:          [e.g. owner | admin | member | viewer]
```

**Why:** Tenant data leakage is a company-ending event. A single
missing filter exposes all customer data.

**Enforcement:**
```
Target:  PREVENTED (RLS on all tables / ORM-level automatic
         tenant injection — unfiltered queries return nothing)
Current: [PREVENTED / BLOCKED / REVIEWED — fill in actual state]
```

<!-- GUIDE: PREVENTED = database-level RLS policies filter
     automatically. App code doesn't need WHERE clauses.
     BLOCKED = CI/linter checks for unfiltered queries (coverage
     is stack-specific and often partial — be honest).
     REVIEWED = manual/AI review for tenant filter presence.
     Delete this block after setup. -->

**Bad → Good:**
```
// ❌ No tenant filter — returns ALL tenants' data
db.query(projects)

// ✅ Manual tenant filter (forgettable → BLOCKED/REVIEWED)
db.query(projects, where: org_id == current_user.org_id)

// ✅✅ Best: RLS makes unfiltered query safe (PREVENTED)
// DB policy: rows visible only where org_id = auth.org()
db.query(projects)  // returns only current tenant's data
```

**Enforced by:** [depends on target/current — see above]

---

### R5 — HTTP security headers [CRITICAL] [BLOCKED + REVIEWED]

All application responses include baseline security headers.
Configured centrally, tested in CI. CSP is the primary control
for framing and script restrictions.

<!-- GUIDE: Fill in your header config location.
     Delete this block after setup. -->

```
Config: [e.g. next.config.js / helmet / nginx.conf]
```

**Baseline headers:**
```
Content-Security-Policy    [project-specific — primary control for
                           framing, scripts, resources. Requires tuning.]
Strict-Transport-Security  max-age=31536000; includeSubDomains
                           (only if ALL subdomains are HTTPS-controlled)
X-Content-Type-Options     nosniff
Referrer-Policy            strict-origin-when-cross-origin
Permissions-Policy         camera=(), microphone=(), geolocation=()
```

Note: `X-Frame-Options` is superseded by CSP `frame-ancestors`.
Include only as legacy browser fallback if needed.

**Why:** Missing headers enable clickjacking, MIME sniffing, and
cross-site attacks. One-time setup, permanent protection. Header
presence is CI-testable; CSP policy quality requires review.

**Bad → Good:**
```
// ❌ No security headers
response.send(data)

// ✅ Complete security header set
response.setHeaders({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
})
response.send(data)

// ❌ Weak CSP — allows any script
'Content-Security-Policy': "script-src *"

// ✅ Restrictive CSP — only self and specific domains
'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdn.example.com; object-src 'none'"

// ❌ HSTS with includeSubDomains when not all subs controlled
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' // when legacy.example.com is HTTP-only

// ✅ HSTS without includeSubDomains for mixed subdomain scenarios
'Strict-Transport-Security': 'max-age=31536000'
```

**Enforced by:** CI test — assert baseline headers on response
(coverage: strong for presence). Review for CSP quality and
`includeSubDomains` applicability (coverage: advisory).

---

### R6 — Rate limiting on exposed endpoints [CRITICAL] [REVIEWED]

Gilt nur für Projekte mit öffentlichen oder Auth-Endpoints. Interne Tool-only-Apps sind ausgenommen.

All exposed and auth-relevant endpoints have rate limiting.
Protect against: brute force, scraping, cost explosion, and
resource starvation.

<!-- GUIDE: Fill in your rate limiting setup.
     Delete this block after setup. -->

```
Implementation: [express-rate-limit / upstash / proxy / etc.]
Strategy:       [per IP / per user / per token / per tenant]
```

**Priority endpoints (most restrictive first):**
```
Auth & reset:      [e.g. 10 attempts / 15 minutes]
Cost-sensitive:    [e.g. LLM/image/email: 20 / hour]
Mutation:          [e.g. writes: 60 / minute]
Public read:       [e.g. 200 / minute]
Bulk/export:       [e.g. 5 / hour]
```

**Why:** Without rate limiting, attackers can brute-force logins,
scrape data, abuse expensive operations (LLM calls, image gen,
email sending), or cause denial of service.

**Enforced by:** Integration test for critical endpoints — verifies
a limit exists (coverage: partial — tests existence, not whether
thresholds are appropriate). Review for coverage across all exposed
endpoints and appropriateness of limits.

---

### R7 — Restrictive CORS configuration [CRITICAL] [BLOCKED]

_Only for projects with public-facing endpoints._

CORS allows only known origins. Never wildcard in production.

```
Allowed origins: [e.g. https://app.example.com]
```

**Why:** Overly permissive CORS expands which origins browsers
allow to read API responses. Combined with credentialed requests
or weak CSRF protections, this exposes authenticated interactions.
CORS is not an auth layer — it works together with session
security (R3) and CSRF protections as part of a defense-in-depth
strategy.

**Bad → Good:**
```
// ❌ Any origin can read responses
cors(origin: "*")

// ✅ Only known origins
cors(origin: ["https://app.example.com"])
```

**Enforced by:** CI check for permissive or reflected origin
policies in production config (coverage: strong for wildcard
detection).

---

### R8 — No sensitive data in error responses [CRITICAL] [BLOCKED + REVIEWED]

Error messages to clients contain no stack traces, database schemas,
internal paths, query details, or framework-generated debug pages.
Log internally, respond generically.

**Why:** Detailed errors reveal system architecture, database
structure, and file paths to attackers. Leaks can come from
application code, framework defaults, ORM error serialization,
or upstream proxy error pages — not all are visible in code.

**Bad → Good:**
```
// ❌ Stack trace sent to client
respond(500, { error: exception.stacktrace })

// ❌ ORM error leaks schema details
respond(500, { error: exception.message })
// → "relation 'users' does not exist"

// ✅ Generic response, details only in logs
log.error("User creation failed", { error: exception, user_id })
respond(500, { error: "Something went wrong." })
```

**Enforced by:** Static analysis for error response patterns
(coverage: partial — catches explicit stack/message in responses,
misses framework defaults and serialized objects). Review for
framework-level error pages and non-obvious leaks (coverage:
requires runtime/deployment context).

**Boundary:** SECURITY owns leakage risk. ERROR_HANDLING owns
the error lifecycle. CONTENT owns user-facing error language.

---

### R9 — LLM interaction security [CRITICAL] [BLOCKED + REVIEWED]

_Only for projects making LLM API calls._

User input and system instructions are strictly separated.
LLM outputs that trigger actions are validated before execution.

**Why:** Prompt injection can override system instructions, leak
system prompts, exfiltrate data, or trigger unintended actions.
Role separation alone does not protect against indirect injection
via retrieved content, tool outputs, or multi-step attacks.

**Required controls:**

1. **Input separation** — No user input in system prompts.
   User content in `user` role only. [BLOCKED — static analysis
   can detect system-prompt template interpolation]
2. **Output validation** — LLM outputs that trigger tools,
   database writes, or external calls are validated against
   an allowed-actions schema. Validate action name, arguments,
   scope, and resource ownership. [REVIEWED]
3. **Retrieval trust** — Content from external sources (RAG,
   web search, user documents) is treated as untrusted input,
   never injected into system context. [REVIEWED]