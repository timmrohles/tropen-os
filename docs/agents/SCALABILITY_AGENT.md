# SCALABILITY_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "**/jobs/**"
    - "**/queues/**"
    - "**/workers/**"
    - "**/hooks/**"
    - "src/**"
    - "app/**"
    - "lib/**"
  keywords:
    - "session state"
    - "job queue"
    - "long operation"
    - "async"
    - "optimistic update"
    - "server state"
    - "global store"
    - "load testing"
    - "scaling"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "**/migrations/**"
related:
  - agent: architecture
    type: consult
    boundary: "Scalability owns stateless design and async patterns. Architecture owns module boundaries and folder structure."
  - agent: observability
    type: consult
    boundary: "Scalability owns scaling targets and thresholds. Observability owns the metrics and logging that surface scaling problems."
  - agent: architecture
    type: overlaps
    boundary: "Architecture owns folder structure decisions. Scalability owns session and state management patterns within that structure."
  - agent: security
    type: overlaps
    boundary: "Security owns session security and authentication. Scalability owns session storage strategy for horizontal scaling."
  - agent: architecture
    type: delegates
    boundary: "Scalability defers to Architecture for dependency rules and module boundary decisions."
  - agent: observability
    type: delegates
    boundary: "Scalability defers to Observability for logging infrastructure and metric collection."
```

## Purpose

Ensures the system can handle increasing load through stateless design, proper async processing, and predictable state management. Without this agent, applications become session-dependent, block on long operations, and accumulate unpredictable global state that breaks under load.

This agent contains 3 types of rules:
- **Hard boundaries** (R1–R2) — mechanically enforceable
- **Structural heuristics** (R3–R6) — judgment-based
- **Governance** (R7) — process discipline

## Applicability

- Backend services handle user requests or background tasks
- Frontend components manage application state or server data
- APIs perform operations longer than 3 seconds
- Load testing or capacity planning is required
- Excluded: Database schema design, infrastructure provisioning, caching strategies

---

## Rules

### HARD BOUNDARIES

### R1 — No Session State in App Servers [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure session middleware to use external stores (Redis, database) instead of memory. Set NODE_ENV=production to catch memory session usage. -->

**Why:** Session state in memory prevents horizontal scaling and causes user data loss during deployments.

**Bad → Good:**
```
// Bad
app.use(session({ store: new MemoryStore() }))
server.locals.userSessions = new Map()

// Good
app.use(session({ store: new RedisStore(redisClient) }))
await database.getUserSession(sessionId)
```

**Enforced by:** ESLint Custom Rules (BLOCKED, coverage: strong)

---

### R2 — Job Queue for Long Operations [BLOCKER] [BLOCKED]

<!-- GUIDE: Install BullMQ or AWS SQS SDK. Configure queue processing in separate worker processes. Set API timeout to 30s to catch synchronous long operations. -->

**Why:** Synchronous operations over 3 seconds block request threads and create poor user experience under load.

**Bad → Good:**
```
// Bad
POST /api/generate-report
await processLargeDataset() // 45 seconds
return { report: data }

// Good
POST /api/generate-report
await jobQueue.add('generate-report', { userId, params })
return { jobId: '12345', status: 'processing' }
```

**Enforced by:** Custom Linter (BLOCKED, coverage: partial)

---

### STRUCTURAL HEURISTICS

### R3 — Optimistic Updates with Rollback [BLOCKER] [PREVENTED]

<!-- GUIDE: Use React Query mutations with onMutate (optimistic) and onError (rollback). Cache the previous state before optimistic updates. -->

**Why:** Optimistic updates without rollback leave the UI in inconsistent states when operations fail.

**Bad → Good:**
```
// Bad
onClick={() => {
  setLiked(true) // optimistic, no rollback
  api.likePost(id)
}}

// Good
const mutation = useMutation(likePost, {
  onMutate: () => { setLiked(true) },
  onError: () => { setLiked(false) } // rollback
})
```

**Enforced by:** React Query Mutation Linter (PREVENTED, coverage: partial)

---

### R4 — Server State Management [CRITICAL] [PREVENTED]

<!-- GUIDE: Install React Query or SWR. Configure default staleTime and cacheTime. Use useState/useReducer only for component-local state. -->

**Why:** Mixing server and client state causes cache inconsistencies and unnecessary API calls.

**Bad → Good:**
```
// Bad
const [users, setUsers] = useState([])
useEffect(() => { fetchUsers().then(setUsers) }, [])

// Good
const { data: users, isLoading } = useQuery('users', fetchUsers)
const [selectedId, setSelectedId] = useState(null) // local state
```

**Enforced by:** ESLint React Hooks Rules (PREVENTED, coverage: strong)

---

### R5 — Global State Boundaries [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure Zustand or Redux store only for authentication and theme data. Use URL state for filters/pagination via Next.js router or React Router. -->

**Why:** Global stores become performance bottlenecks when they contain data used by single components.

**Bad → Good:**
```
// Bad
globalStore.modalOpen = true // component-local
globalStore.searchFilters = { category: 'tech' } // should be URL

// Good
const [modalOpen, setModalOpen] = useState(false)
const router = useRouter()
const filters = router.query // { category: 'tech' }
```

**Enforced by:** Global Store Usage Linter (PREVENTED, coverage: partial)

---

### R6 — Load Testing Documentation [CRITICAL] [REVIEWED]

<!-- GUIDE: Use k6, Artillery, or JMeter. Document tests in /docs/load-testing.md with baseline numbers, target metrics, and test scenarios. -->

**Why:** Production load surprises cause outages when scaling behavior is unknown.

**Bad → Good:**
```
// Bad
// No load testing before major release

// Good
// Load test: 1000 concurrent users, 95th percentile <2s
// Bottlenecks: Database connections (pool size 20), Redis memory
// Scaling order: 1) DB pool 2) Redis cluster 3) App replicas
```

**Enforced by:** PR Review Checklist (REVIEWED, coverage: advisory)

---

### GOVERNANCE

### R7 — Scaling Runbook Documentation [WARNING] [REVIEWED]

<!-- GUIDE: Create /docs/scaling-runbook.md with identified bottlenecks in priority order. Include monitoring queries and scaling commands. -->

**Why:** Unknown scaling bottlenecks cause emergency scrambling during traffic spikes.

**Bad → Good:**
```
// Bad
// No scaling documentation

// Good
// Scaling order: 1) Database connection pool 2) Redis memory 3) App replicas
// Monitor: CPU >80%, DB connections >15, Redis memory >512MB
// Commands: kubectl scale deployment app --replicas=5
```

**Enforced by:** Documentation Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER:**
```
Override: R1
Scope:    legacy session store migration in progress
Reason:   existing memory sessions cannot be migrated without user disruption; phased migration required
Approved: @timm
Expires:  2026-06-01 — migration must be complete by this date
Control:  single-instance deployment during migration period; no horizontal scaling until complete
```

**WARNING — solo/small team:**
```
Override: R6 — no formal load testing yet; pre-customer MVP stage — @timm — expires 2026-07-01
```

## Checklist

```
□ No in-memory session stores (MemoryStore, server.locals)?  (R1)
□ Operations > 3s offloaded to job queue?  (R2)
□ Optimistic updates have onError rollback handlers?  (R3)
□ Server data managed via React Query/SWR (not useState + useEffect)?  (R4)
□ Global store limited to auth and theme; filters/pagination in URL?  (R5)
□ Load test results documented before major releases?  (R6)
□ Scaling runbook exists with bottleneck order and commands?  (R7)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint Custom Rules | pre-commit | BLOCKED | strong |
| R2 | Custom Linter | CI | BLOCKED | partial |
| R3 | React Query Mutation Linter | pre-commit | PREVENTED | partial |
| R4 | ESLint React Hooks Rules | pre-commit | PREVENTED | strong |
| R5 | Global Store Usage Linter | pre-commit | PREVENTED | partial |
| R6 | PR Review Checklist | PR | REVIEWED | advisory |
| R7 | Documentation Review | PR | REVIEWED | advisory |
