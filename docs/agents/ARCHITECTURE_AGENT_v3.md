# ARCHITECTURE_AGENT

## Meta

```yaml
version: 3.0
last_updated: 2026-04-03
triggers:
  files:
    - "[SOURCE_ROOT]/**"
    - "**/modules/**"
    - "**/packages/**"
  keywords:
    - refactor
    - restructure
    - move
    - split
    - extract
    - module
    - layer
    - boundary
    - folder
    - monorepo
  exclusions:
    - "**/*.spec.*"
    - "**/*.test.*"
    - "**/node_modules/**"
    - "**/dist/**"
    - "**/build/**"
related:
  - agent: CODE_STYLE
    type: overlaps
    boundary: "ARCHITECTURE owns layers, boundaries, dependency direction. CODE_STYLE owns naming, formatting, complexity metrics."
  - agent: PLATFORM
    type: consult
    boundary: "Consult for deployment-driven structure and monorepo-specific rules."
  - agent: DATABASE
    type: consult
    boundary: "Schema structure may influence module boundaries."
  - agent: API
    type: overlaps
    boundary: "ARCHITECTURE owns where API code lives. API owns endpoint contracts."
```

## Purpose

Defines project structure, dependency rules, module boundaries,
and documentation discipline. Prevents the project from becoming
an unnavigable blob as it grows.

This agent contains three types of rules:
- **Hard boundaries** (R1, R3, R6) — mechanically enforceable
- **Structural heuristics** (R2, R4, R5) — judgment-based, explicitly
  labeled as patterns not laws
- **Governance** (R7, R8) — process discipline

## Applicability

- R1–R3, R7–R8: All projects
- R4–R5: Projects with 10+ source files
- R6: Projects with shared code between client and server

---

## Rules

### HARD BOUNDARIES

### R1 — Project defines one explicit dependency model [BLOCKER] [BLOCKED]

The project has a documented dependency model with explicit allowed
import directions. No circular dependencies. The model is enforced
by tooling.

<!-- GUIDE: Define your dependency model. The specific model is a
     project decision — the rule is that one must exist, be
     documented, and be enforced. Common models:

     Layered:        Pages → Features → Shared → Core
     Feature-first:  Features → Shared → Core (no cross-feature)
     DDD:            Domain → Application → Infrastructure
     Hexagonal:      Domain → Ports → Adapters
     Package-based:  packages/* → packages/shared

     Delete this block after setup. -->

```
Dependency model: [e.g. layered / feature-first / DDD / hexagonal]

Allowed directions (imports flow downward only):

[LAYER 1]
    ↓
[LAYER 2]
    ↓
[LAYER 3]
    ↓
[LAYER 4]

Cross-layer rule: [e.g. "no cross-feature imports"]
```

**Why:** Without an explicit model, everything imports everything.
Dependencies become circular. Changes in one area break unrelated
areas. The specific model matters less than having one at all.

**Bad → Good:**
```
// ❌ No model — imports go everywhere
shared/db imports components/UserCard        // circular
lib/format imports pages/Dashboard           // upward

// ✅ Model enforced — imports flow downward
pages/Dashboard imports features/UserList
features/UserList imports shared/api-client
shared/api-client imports core/config
```

**Enforced by:** dependency-cruiser or eslint-plugin-boundaries
(coverage: strong for import direction and cycle detection. Note:
coverage depends on correct tool configuration — dynamic imports,
barrel files, and path aliases can create blind spots. Verify
config against your actual import patterns.)

---

### R3 — File size limits [CRITICAL] [BLOCKED + REVIEWED]

No source file exceeds the hard limit. Files approaching the
warning threshold are candidates for extraction.

<!-- GUIDE: Set your thresholds. The warning threshold triggers
     a review conversation. The hard limit fails CI.
     Test files, generated code, migrations, and config are
     typically excluded.
     Delete this block after setup. -->

```
Warning at:     [e.g. 250 lines — triggers review]
Hard limit:     [e.g. 500 lines — CI fails]
Exceptions:     [e.g. generated files, migrations, config,
                 test files, type definitions]
```

**Why:** Large files are the most common symptom of AI code rot.
File size is a proxy signal, not a quality metric — but it reliably
indicates structural degradation. Note: AI may "game" this rule
by splitting files without proper modularization. The warning
threshold exists to trigger a review, not just a mechanical split.

**Enforced by:** CI check at hard limit (BLOCKED, coverage: strong).
Lint warning at lower threshold triggers review for extraction
quality (REVIEWED).

**Boundary:** ARCHITECTURE owns file size limits as a structural
indicator. CODE_STYLE owns function-level complexity metrics.

---

### R6 — Client/server code boundary [CRITICAL] [BLOCKED + REVIEWED]

_Only for projects with shared code between client and server._

Code shared between client and server lives in an explicit shared
location. No server-only code leaks into client bundles. No
client-only code runs on server.

<!-- GUIDE: Define your boundary. Modern frameworks (Next.js, Nuxt,
     SvelteKit) blur this line with server components, server actions,
     and edge runtime. Define explicitly what is shared, server-only,
     and client-only in your stack.
     Delete this block after setup. -->

```
Shared location:  [e.g. shared/ or packages/common/]
Server-only:      [e.g. server/, api/, db/]
Client-only:      [e.g. components/, hooks/, views/]
Framework notes:  [e.g. "Server components in app/ are server-only.
                   Anything imported by 'use client' is client.
                   Use server-only package for hard enforcement."]
```

**Why:** Server code in client bundles leaks secrets, schemas, and
internal logic. Client code on server crashes at runtime.

**Bad → Good:**
```
// ❌ Server module imported in client component
client/Dashboard imports server/db-client     // secrets in bundle

// ✅ Shared code has no environment-specific imports
shared/types — pure types, no runtime imports
shared/validation — schemas, works everywhere
```

**Enforced by:** Bundle analysis (coverage: strong for detecting
server code in client builds). Import restriction rules in linter
(coverage: strong). Review for edge cases: isomorphic code, server
components, framework-specific patterns (coverage: judgment).

---

### STRUCTURAL HEURISTICS

*These rules require judgment. They represent proven patterns, not
universal laws. Violations are reviewed, not blocked.*

### R2 — Every file type has a defined home [WARNING] [REVIEWED]

New code goes into a predictable location. No "where should I
put this?" ambiguity.

<!-- GUIDE: Define your folder structure using placeholders.
     Replace entirely with your own layout.
     Delete this block after setup. -->

```
[SOURCE_ROOT]/
├── [PAGES_DIR]       ← Route definitions, entry points
├── [FEATURES_DIR]    ← Feature-specific code (self-contained)
├── [COMPONENTS_DIR]  ← Shared UI components
├── [LIB_DIR]         ← Business logic, API clients, utilities
├── [SHARED_DIR]      ← Types, config, constants
├── [SERVER_DIR]      ← Server-side code, API routes
└── [DB_DIR]          ← Database schema, migrations, seeds
```

**Decision tree — where does new code go?**
```
Is it a page/route entry point?   → [PAGES_DIR]
Is it specific to one feature?    → [FEATURES_DIR]/[feature-name]/
Is it a reusable UI element?      → [COMPONENTS_DIR]
Is it business logic or a client? → [LIB_DIR]
Is it a type/config/constant?     → [SHARED_DIR]
Is it an API endpoint?            → [SERVER_DIR]
Is it DB schema/migration?        → [DB_DIR]
None of the above?                → Ask before creating new location
```

**Forbidden generic folder names** (unless explicitly scoped):
`helpers/`, `misc/`, `temp/`, `stuff/`, `utils/` without clear purpose.
Use specific names: `lib/date-formatting/`, `shared/validation/`.

**Why:** AI coding tools create files wherever seems convenient.
Without clear placement, the same type of code ends up in three
locations. Navigation becomes guesswork.

**Enforced by:** Review — "Does this file live in the right place?"

---

### R4 — Feature code is co-located [WARNING] [REVIEWED]

_Heuristic, not law. For projects with 10+ source files._

Feature-specific code (components, logic, types, tests) lives
together in a feature directory. Features communicate through
shared layers, not direct cross-feature imports.

```
[FEATURES_DIR]/
├── user-profile/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   ├── types
│   └── index           ← public API of this feature
├── book-search/
│   └── ...
```

**When to bend this rule:** Small projects (< 10 files), libraries,
or projects where feature-folder overhead exceeds the benefit.
This is a scaling pattern, not a starting requirement.

**Why:** Scattered feature code means changing one feature touches
five directories. Co-located features are easier to understand,
test, move, and delete.

**Enforced by:** Review. eslint-plugin-boundaries can enforce
no cross-feature imports (coverage: strong for import rules).

---

### R5 — Shared code earns its place [WARNING] [REVIEWED]

_Heuristic, not law. For projects with 10+ source files._

Code moves to the shared layer when used by 2+ consumers.
No preemptive abstraction. Duplicate first, extract when proven.

**Immediate shared exceptions** (belong in shared from day one):
- Domain types that define canonical entities
- Configuration and environment access
- Auth contracts and session types

**Why:** AI tools create shared utilities preemptively, producing
dead abstractions and coupling. The "2+ consumers" heuristic is a
default guard against this — not a rigid threshold.

**Enforced by:** Review — "Is this shared code justified?"

---

### GOVERNANCE

### R7 — No new structural namespaces without review [CRITICAL] [REVIEWED]

New structural boundaries (top-level directories, package namespaces,
new architectural zones) require explicit approval. The AI must not
invent new structural concepts without human decision.

<!-- GUIDE: Define what counts as a "structural namespace."
     Examples:
     - Classic repo: direct children of src/ or project root
     - Monorepo: new packages in packages/
     - App router: new route groups in app/()
     For monorepo-specific structure rules → consult PLATFORM_AGENT.
     Delete this block after setup. -->

```
Protected levels: [e.g. src/*, packages/*, app/()]
```

**Why:** AI tools create folders opportunistically. Each unplanned
namespace erodes the structure. Structural changes should trigger
an ADR (R8).

**Enforced by:** Review — "Was a new structural namespace created?"
Future: CI check for new directories at protected levels.

---

### R8 — Architecture decisions are documented [CRITICAL] [REVIEWED]

Significant architecture decisions are recorded as ADRs. An ADR
answers: What? Why? What alternatives? What consequences?

<!-- GUIDE: Define your ADR location and format.
     Delete this block after setup. -->

```
ADR location: [e.g. docs/adr/]
ADR format:   [e.g. MADR / custom / minimal]
```

**ADR is required when:**
- New framework or major dependency added
- Dependency model (R1) changed
- New structural namespace created (R7)
- New persistence or state model introduced
- New auth pattern adopted
- Cross-cutting pattern introduced
- New critical external dependency (e.g. REST → GraphQL)

**Why:** In AI-coded projects, decisions happen fast and are
forgotten faster. Without ADRs, nobody knows why the project
is structured this way — including future-you and the AI.

**Enforced by:** Review — "Does this change trigger an ADR?"
The tool can check: structural change detected + no new ADR =
reminder.

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

After structural changes, new modules, or refactoring:

```
□ Dependency model documented and enforced?       (R1) [all]
□ New files in defined locations?                  (R2) [all]
□ No file exceeds hard limit?                     (R3) [all]
□ Feature code predominantly co-located?          (R4) [10+ files]
□ Shared code justified (2+ consumers or core)?   (R5) [10+ files]
□ No server code in client bundles?               (R6) [shared code]
□ No new structural namespaces without review?    (R7) [all]
□ Architecture change documented as ADR?          (R8) [all]
```

Status: ✅ yes | ❌ no | — n/a

---

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | dependency-cruiser / boundaries plugin | CI | BLOCKED | strong* |
| R3 | File line count (warning threshold) | CI | WARNING | strong |
| R3 | File line count (hard limit) | CI | BLOCKED | strong |
| R6 | Bundle analyzer | CI / release | BLOCKED | strong |
| R6 | Import restriction rules | CI | BLOCKED | strong |
| R4 | boundaries plugin (cross-feature) | CI | BLOCKED | strong |
| R2,R4,R5,R7,R8 | Review | Per feature | REVIEWED | judgment |

*R1 coverage depends on correct tool configuration. Dynamic imports,
barrel files, and path aliases can create blind spots.
