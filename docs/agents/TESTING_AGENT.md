# TESTING_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "src/**"
    - "app/**"
    - "lib/**"
  keywords:
    - "test"
    - "coverage"
    - "bug fix"
    - "regression"
    - "CI"
    - "unit test"
    - "integration test"
    - "E2E"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "**/migrations/**"
related:
  - agent: architecture
    type: consult
    boundary: "Testing owns test coverage and quality gates. Architecture owns test folder organization and structure."
  - agent: security
    type: consult
    boundary: "Testing owns test quality and coverage thresholds. Security owns test data security and credential handling in tests."
  - agent: observability
    type: consult
    boundary: "Testing owns CI test reliability. Observability owns test monitoring and failure tracking in production."
  - agent: architecture
    type: delegates
    boundary: "Testing defers to Architecture for test folder organization and import boundary rules."
  - agent: security
    type: delegates
    boundary: "Testing defers to Security for test credential handling and secure test data management."
```

## Purpose

Ensures comprehensive test coverage and quality across the testing pyramid. Prevents production bugs, maintains CI reliability, and enforces quality gates for AI-generated code. Without this agent, code becomes fragile, refactoring is dangerous, and confidence in product reliability erodes.

This agent contains 3 types of rules:
- **Hard boundaries** (R1–R3) — mechanically enforceable
- **Structural heuristics** (R4–R6) — judgment-based
- **Governance** (R7–R8) — process discipline

## Applicability

- Adding new business logic or API endpoints
- Modifying existing functionality
- Fixing bugs (regression test required)
- Excluded: documentation-only changes, pure refactoring without behavior changes

---

## Rules

### HARD BOUNDARIES

### R1 — CI Test Gate [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure CI to require all tests pass before merge. Set branch protection rules in GitHub/GitLab. Tests MÜSSEN den Merge blockieren (required status check). -->

**Why:** Broken tests in main branch cascade failures and block all developers from productive work.

**Bad → Good:**
```
// Bad
PR merged despite failing tests in CI
test suite has flaky tests that randomly fail
CI runs tests but doesn't block merge on failure

// Good
all tests must pass for merge approval
flaky tests fixed immediately or quarantined
GitHub Actions configured with required status checks:
  - "Test Suite" must pass
  - branch protection rule enforces check
```

**Enforced by:** CI Pipeline (BLOCKED, coverage: strong)

---

### R2 — Business Logic Coverage Minimum [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure coverage tool (jest, nyc, etc.) with threshold enforcement in package.json or CI config. Checker muss die Coverage-Config parsen und validieren dass der Threshold-Wert ≥80% ist — nicht nur die Existenz der Config-Datei prüfen. -->

**Why:** Insufficient test coverage means logic is unverified and can break silently during future refactors.

**Bad → Good:**
```
// Bad
business logic function with no tests
coverage tool reports 45% on core modules

// Good
every business function has unit tests
coverage consistently above 80% threshold
```

**Enforced by:** Coverage Tool (BLOCKED, coverage: strong)

---

### R3 — Regression Test Requirement [BLOCKER] [BLOCKED]

<!-- GUIDE: PR template includes checkbox for regression test. Code review checklist enforces this requirement. -->

**Why:** Fixed bugs that return waste customer trust and engineering time.

**Bad → Good:**
```
// Bad
bug fix without test to prevent recurrence
// commit message: "fix: Correct calculation error"
// No new test files added

// Good
bug fix includes failing-then-passing test
// new file: tests/regression/calculation_fix.test.ts
test("handles negative values correctly", () => {
  // This test failed before the fix
  assert(calculate(-10) == -20)
})
```

**Enforced by:** PR Review (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Testing Pyramid Balance [CRITICAL] [REVIEWED]

<!-- GUIDE: Monitor test execution time in CI. Flag PRs that add slow tests without justification. Use file count in unit/ vs e2e/ vs integration/ folders as proxy for pyramid balance, not exact execution ratios. -->

**Why:** Inverted test pyramid leads to slow, brittle test suites that developers avoid running.

**Bad → Good:**
```
// Bad
mostly E2E tests, few unit tests
test suite takes 20+ minutes to run
more files in e2e/ than unit/ folders

// Good
many fast unit tests (70%)
moderate integration tests (20%)
few critical E2E tests (10%)
file count reflects pyramid: unit/ > integration/ > e2e/
```

**Enforced by:** Manual Review (REVIEWED, coverage: partial)

---

### R5 — API Integration Coverage [CRITICAL] [PREVENTED]

<!-- GUIDE: Set up test database and ensure integration tests hit real database connections, not mocks. -->

**Why:** API contracts break silently without integration testing against real data persistence.

**Bad → Good:**
```
// Bad
API endpoints tested only with mocked database
integration tests use fake in-memory data

// Good
API tests run against real test database
database migrations tested in integration suite
```

**Enforced by:** Test Framework (PREVENTED, coverage: partial)

---

### R6 — AI Code Quality Gates [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure AI code detection tools and set higher coverage thresholds for AI-generated code blocks. -->

**Why:** AI-generated code can contain subtle logical errors or miss edge cases requiring higher scrutiny.

**Bad → Good:**
```
// Bad
AI-generated code merged with same standards as human code
no duplicate detection on generated functions

// Good
AI code requires ≥90% test coverage
duplicate detection flags similar generated blocks
security review required for AI authentication code
```

**Enforced by:** SonarQube (PREVENTED, coverage: strong)

---

### GOVERNANCE

### R7 — E2E Critical Path Coverage [WARNING] [REVIEWED]

<!-- GUIDE: Maintain list of critical user journeys. Verify E2E tests exist for each during architecture reviews. -->

**Why:** Critical user flows that break in production cause immediate business impact.

**Bad → Good:**
```
// Bad
no automated tests for user registration
core application flow only manually tested

// Good
E2E tests cover: registration, login, checkout
critical paths tested in production-like environment
```

**Enforced by:** Manual Review (REVIEWED, coverage: partial)

---

### R8 — Test Data Discipline [WARNING] [REVIEWED]

<!-- GUIDE: Establish test data factory patterns. Review PRs for hardcoded test values or production data usage. -->

**Why:** Hardcoded test data and production data leaks create brittle tests and security risks.

**Bad → Good:**
```
// Bad
tests use hardcoded production user IDs
sensitive data copied into test fixtures

// Good
test data generated through factories
production data never used in tests
sensitive fields use realistic fake data
```

**Enforced by:** Manual Review (REVIEWED, coverage: partial)

---

## Exceptions

**BLOCKER:**
```
Override: R2
Scope:    legacy untested code brought into scope during refactor
Reason:   80% coverage threshold not achievable without rewriting legacy module; incremental improvement agreed
Approved: @timm
Expires:  2026-07-01 — coverage must reach threshold by this date
Control:  no new untested code added to module during exception period; coverage tracked weekly
```

**WARNING — solo/small team:**
```
Override: R7 — E2E tests not yet implemented for all critical paths — @timm — expires 2026-07-01
```

## Checklist

```
□ All tests pass in CI before merge?  (R1)
□ Business logic coverage above 80% threshold?  (R2)
□ Bug fix includes a regression test?  (R3)
□ Test suite follows pyramid (unit > integration > E2E)?  (R4)
□ API integration tests run against real test database?  (R5)
□ AI-generated code has ≥90% coverage and security review?  (R6)
□ E2E tests cover all critical user journeys (registration, login, core flow)?  (R7)
□ Test data uses factories, never production data or hardcoded IDs?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | CI Pipeline | PR/merge | BLOCKED | strong |
| R2 | Coverage Tool | pre-commit/CI | BLOCKED | strong |
| R3 | PR Review | PR | BLOCKED | strong |
| R4 | Manual Review | PR | REVIEWED | partial |
| R5 | Test Framework | CI | PREVENTED | partial |
| R6 | SonarQube | CI/PR | PREVENTED | strong |
| R7 | Manual Review | PR | REVIEWED | partial |
| R8 | Manual Review | PR | REVIEWED | partial |