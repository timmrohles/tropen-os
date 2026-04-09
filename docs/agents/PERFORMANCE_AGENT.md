# PERFORMANCE_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "src/**"
    - "components/**"
    - "pages/**"
    - "api/**"
    - "lib/**"
    - "utils/**"
    - "app/api/**"
    - "pages/api/**"
    - "models/**"
    - "repositories/**"
    - "db/**"
  keywords:
    - "database query"
    - "bundle size"
    - "LCP"
    - "Core Web Vitals"
    - "pagination"
    - "image optimization"
    - "lazy loading"
    - "caching"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "**/migrations/**"
related:
  - agent: architecture
    type: overlaps
    boundary: "Architecture owns import boundaries and bundle structure decisions. Performance owns the size thresholds and Core Web Vitals enforcement."
  - agent: security
    type: overlaps
    boundary: "Security owns rate limiting for DoS protection. Performance owns response time targets and throughput optimization."
  - agent: observability
    type: overlaps
    boundary: "Observability owns metric definitions and dashboards. Performance owns the acceptable thresholds those metrics must stay within."
  - agent: architecture
    type: delegates
    boundary: "Performance defers to Architecture for import boundary and dependency decisions."
  - agent: security
    type: delegates
    boundary: "Performance defers to Security for DoS protection and rate limiting implementation."
  - agent: observability
    type: delegates
    boundary: "Performance defers to Observability for metric collection infrastructure and alerting configuration."
```

## Purpose

Ensures the application meets Core Web Vitals targets and performs efficiently under load. Prevents performance regressions from accumulating over time through automated checks and enforced patterns. Without it, slow load times, inefficient resource usage, and poor system responsiveness lead to user frustration and increased operational costs.

This agent contains 3 types of rules:
- **Hard boundaries** (R1–R3) — mechanically enforceable
- **Structural heuristics** (R4–R5) — judgment-based
- **Governance** (R6–R8) — process discipline

## Applicability

- Frontend components or pages are added/modified
- API endpoints are created or changed
- Database queries are introduced or modified
- Static assets are added or updated
- Excluded: Development tooling, test utilities, documentation-only changes

---

## Rules

### HARD BOUNDARIES

### R1 — Core Web Vitals Gates [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure Lighthouse CI with thresholds: LCP < 2.5s, INP < 200ms, CLS < 0.1 -->

**Why:** Poor Core Web Vitals directly impact user experience, conversion rates, and search rankings.

**Bad → Good:**
```
// Bad
Page loads with LCP > 2.5s, layout shifts during load

// Good
Page loads with LCP < 2.5s, stable layout, responsive interactions
```

**Enforced by:** Lighthouse CI (BLOCKED, coverage: strong)

---

### R2 — No Unbounded List Endpoints [BLOCKER] [BLOCKED]

<!-- GUIDE: Add pagination middleware that rejects requests without limit/offset or cursor parameters -->

**Why:** Unbounded queries cause exponential database load and timeout failures as data grows.

**Bad → Good:**
```
// Bad
GET /api/users → returns all users

// Good
GET /api/users?limit=20&offset=0 → returns paginated subset
```

**Enforced by:** API Middleware (BLOCKED, coverage: strong)

---

### R3 — Bundle Size Limits [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure webpack-bundle-analyzer with thresholds in next.config.js or vite.config.ts -->

**Why:** Large bundles directly impact LCP and INP by delaying critical resource availability.

**Bad → Good:**
```
// Bad
import entireLibrary from 'heavy-library'
const result = entireLibrary.oneFunction()

// Good
import { oneFunction } from 'heavy-library/oneFunction'
const result = oneFunction()
```

**Enforced by:** Bundle Analyzer (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — N+1 Query Detection [CRITICAL] [PREVENTED]

<!-- GUIDE: Enable query logging and add n-plus-1-detector to test suite -->

**Why:** N+1 queries cause exponential database load that scales with data size, causing production timeouts.

**Bad → Good:**
```
// Bad
users.forEach(user => getUserPosts(user.id)) // N+1 queries

// Good
getUsersWithPosts(userIds) // Single query with joins
```

**Enforced by:** Query Analyzer (PREVENTED, coverage: partial)

---

### R5 — Image Optimization Required [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure next/image or similar with automatic WebP/AVIF conversion and lazy loading -->

**Why:** Unoptimized images are the leading cause of slow LCP and excessive bandwidth usage.

**Bad → Good:**
```
// Bad
<img src="photo.jpg" width="800" height="600" />

// Good
<OptimizedImage src="photo.jpg" width="800" height="600" lazy />
```

**Enforced by:** ESLint Plugin (PREVENTED, coverage: partial)

---

### GOVERNANCE

### R6 — Multi-Layer Caching Strategy [WARNING] [REVIEWED]

<!-- GUIDE: Implement caching at CDN, API response, and database query layers -->

**Why:** Missing cache layers force expensive recomputation and database queries for repeated requests.

**Bad → Good:**
```
// Bad
Always fetch data fresh from database

// Good
Check cache → compute if miss → store result → return cached data
```

**Enforced by:** Architecture Review (REVIEWED, coverage: advisory)

---

### R7 — Lazy Loading Implementation [WARNING] [REVIEWED]

<!-- GUIDE: Use React.lazy() for route components and intersection observer for content -->

**Why:** Eager loading increases initial bundle size and delays time to interactive.

**Bad → Good:**
```
// Bad
import HeavyComponent from './HeavyComponent'

// Good
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

**Enforced by:** Code Review (REVIEWED, coverage: advisory)

---

### R8 — API Response Time Limits [WARNING] [ADVISORY]

<!-- GUIDE: Add response time monitoring middleware with p95 < 300ms alerts -->

**Why:** Slow APIs cascade to poor user experience and timeout failures under load.

**Bad → Good:**
```
// Bad
API endpoint takes 2000ms average response time

// Good
API endpoint takes <300ms p95 response time with caching
```

**Enforced by:** APM Monitoring (ADVISORY, coverage: strong)

---

## Exceptions

**BLOCKER:**
```
Override: R1
Scope:    admin-only pages with complex data visualization
Reason:   LCP target not achievable for heavy dashboard pages with real-time data
Approved: @timm
Expires:  2026-07-01 — re-evaluate after server components refactor
Control:  page must be behind auth; not indexed by search engines
```

**WARNING — solo/small team:**
```
Override: R6 — no CDN caching layer yet configured — @timm — expires 2026-06-01
```

## Checklist

```
□ Core Web Vitals pass (LCP < 2.5s, INP < 200ms, CLS < 0.1)?  (R1)
□ All list endpoints require pagination parameters?  (R2)
□ Bundle size within configured limits?  (R3)
□ No N+1 query patterns in new code?  (R4)
□ All images use optimized component (next/image or equivalent)?  (R5)
□ Caching strategy documented for frequently-accessed data?  (R6)
□ Heavy components lazy-loaded where appropriate?  (R7)
□ API endpoints monitored for response time regressions?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Lighthouse CI | PR | BLOCKED | strong |
| R2 | API Middleware | Runtime | BLOCKED | strong |
| R3 | Bundle Analyzer | CI | BLOCKED | strong |
| R4 | Query Analyzer | Test/CI | PREVENTED | partial |
| R5 | ESLint Plugin | pre-commit | PREVENTED | partial |
| R6 | Architecture Review | PR | REVIEWED | advisory |
| R7 | Code Review | PR | REVIEWED | advisory |
| R8 | APM Monitoring | Continuous | ADVISORY | strong |
