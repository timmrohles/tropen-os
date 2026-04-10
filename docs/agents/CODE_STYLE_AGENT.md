# CODE_STYLE_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "src/**/*.ts"
    - "src/**/*.tsx"
    - "src/**/*.js"
    - "src/**/*.jsx"
    - "components/**/*.ts"
    - "components/**/*.tsx"
    - "lib/**/*.ts"
    - "utils/**/*.ts"
  keywords:
    - typescript
    - naming convention
    - code style
    - magic number
    - function size
    - complexity
    - dead code
    - commented code
    - any type
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "migrations/**"
related:
  - agent: architecture
    type: overlaps
    boundary: "Architecture Agent owns file organization and naming conventions at directory level. Code Style Agent owns in-file style, naming conventions, and complexity limits."
  - agent: security
    type: delegates
    boundary: "Security Agent owns secure coding practices. Code Style Agent defers to Security Agent when style intersects with security (e.g., error message content)."
  - agent: observability
    type: delegates
    boundary: "Observability Agent owns logging format standards. Code Style Agent defers to Observability Agent for logger usage patterns."
```

## Purpose

Enforces code style, readability, and maintainability standards across the codebase. Prevents cognitive overload, naming confusion, and the accumulation of technical debt that makes code harder to understand and modify. Without consistent style enforcement, codebases become inconsistent, harder to onboard new developers, and prone to subtle bugs from unclear intent.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6, R7) — judgment-based
- **Governance** (R8, R9) — process discipline

## Applicability

- Applies when writing or modifying TypeScript/JavaScript source files, or creating new components, utilities, or business logic
- Excluded: Generated code, migration files, third-party libraries, and external integration shims

---

## Rules

### HARD BOUNDARIES

### R1 — TypeScript Strict Mode & No Unresolved Any [BLOCKER] [BLOCKED]

<!-- GUIDE: Enable strict mode in tsconfig.json with "strict": true and "@typescript-eslint/no-explicit-any" ESLint rule. In TropenOS: strict mode is already required by CLAUDE.md — any use of 'any' must have an inline comment with justification. -->

**Why:** Using 'any' disables TypeScript's type-checking, defeating its purpose and hiding potential runtime errors that could crash production.

**Bad → Good:**
```
// ❌ function processUser(data: any) {
// ❌   return data.name.toLowerCase();
// ❌ }

// ✅ interface User {
//      name: string;
//    }
// ✅ function processUser(data: User): string {
//      return data.name.toLowerCase();
//    }
```

**Enforced by:** TypeScript Compiler + ESLint (BLOCKED, coverage: strong)

---

### R2 — No Empty Catch Blocks [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint rule "no-empty" with allowEmptyCatch: false -->

**Why:** Empty catch blocks swallow errors silently, making debugging nearly impossible as the application fails in unexpected ways without any record of the root cause.

**Bad → Good:**
```
// ❌ try {
// ❌   dangerousOperation();
// ❌ } catch (error) {
// ❌   // Error is ignored
// ❌ }

// ✅ try {
//      dangerousOperation();
//    } catch (error) {
//      logger.error("Operation failed", { error });
//      throw new HandledError("Could not complete operation", { cause: error });
//    }
```

**Enforced by:** ESLint (BLOCKED, coverage: strong)

---

### R3 — No Magic Numbers or Strings [BLOCKER] [BLOCKED]

<!-- GUIDE: Use ESLint rule "@typescript-eslint/no-magic-numbers" with ignoreEnums: true -->

**Why:** Magic values make code unclear and create maintenance nightmares when the same value appears in multiple places with different meanings.

**Bad → Good:**
```
// ❌ if (user.loginAttempts >= 3) {
// ❌   lockAccount(user);
// ❌ }
// ❌ setTimeout(callback, 300000);

// ✅ const MAX_LOGIN_ATTEMPTS = 3;
// ✅ const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
// ✅
// ✅ if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//      lockAccount(user);
//    }
// ✅ setTimeout(callback, SESSION_TIMEOUT_MS);
```

**Enforced by:** ESLint (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Consistent Naming Conventions [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure ESLint with "@typescript-eslint/naming-convention" rule. See CLAUDE.md Namenskonventionen table for TropenOS-specific conventions. -->

**Why:** Inconsistent naming creates cognitive load and makes code harder to search, understand, and maintain across team members.

**Bad → Good:**
```
// ❌ const user_name = "john";
// ❌ const UserAge = 25;
// ❌ function Get_User() {}

// ✅ const userName = "john";           // camelCase for variables
// ✅ const USER_STATUS = "active";      // UPPER_SNAKE_CASE for constants
// ✅ function getUser() {}              // camelCase for functions
// ✅ class UserProfile {}               // PascalCase for classes/components
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R5 — Function Size Limits [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "max-lines-per-function" with max: 30. In TropenOS: files >300 lines are a warning, >500 lines are a CI error (CLAUDE.md Code-Regeln). -->

**Why:** Large functions violate single responsibility principle and become difficult to test, debug, and understand.

**Bad → Good:**
```
// ❌ function processOrder(order) {
// ❌   // 50+ lines of mixed validation, calculation, database calls, and formatting
// ❌ }

// ✅ function processOrder(order: Order): ProcessedOrder {
//      validateOrder(order);
//      const total = calculateTotal(order);
//      const result = saveToDatabase(order, total);
//      return formatResponse(result);
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R6 — Cognitive Complexity Limits [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "complexity" with max: 15 for human code, max: 8 for AI-generated code -->

**Why:** High cognitive complexity makes code difficult to reason about and increases bug likelihood. AI-generated code should be held to stricter standards as it lacks human context.

**Bad → Good:**
```
// ❌ // nested ifs, multiple conditions
// ❌ function determineUserAccess(user, resource, context) {
// ❌   if (user.role === 'admin') {
// ❌     if (resource.type === 'sensitive') {
// ❌       if (context.department === user.department || user.isSuperAdmin) {
// ❌         return checkTimeConstraints(context) ? 'full' : 'limited';
// ❌       }
// ❌     }
// ❌   }
// ❌ }

// ✅ // early returns, extracted functions
// ✅ function determineUserAccess(user: User, resource: Resource, context: Context): AccessLevel {
//      if (!user.role) return 'none';
//      if (user.role === 'admin') {
//        return determineAdminAccess(user, resource, context);
//      }
//      return determineStandardAccess(user, resource, context);
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: partial)

---

### R7 — No Dead Code or Unused Imports [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rules "@typescript-eslint/no-unused-vars" and "unused-imports/no-unused-imports" -->

**Why:** Dead code increases bundle size, creates confusion about what's actually used, and can hide security vulnerabilities in unused dependencies.

**Bad → Good:**
```
// ❌ import { useState, useEffect, useMemo } from 'react';
// ❌ import { helperFunction } from './utils';
// ❌
// ❌ function Component() {
// ❌   const [data] = useState([]);
// ❌   return <div>{data.length}</div>;
// ❌ }

// ✅ import { useState } from 'react';
// ✅
// ✅ function Component() {
//      const [data] = useState([]);
//      return <div>{data.length}</div>;
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### GOVERNANCE

### R8 — File Size Limits [WARNING] [REVIEWED]

<!-- GUIDE: Use ESLint rule "max-lines" with max: 300 (warning at 300, error at 500). In TropenOS: CI blocks at 500 lines — split into focused modules (component, types, hooks, utils) as done with ChatArea.tsx and workspace-chat.ts. -->

**Why:** Large files become difficult to navigate, understand, and maintain. They often indicate violation of single responsibility principle.

**Bad → Good:**
```
// ❌ // 500+ line component file with mixed concerns

// ✅ // Split into focused modules:
// ✅ // UserProfile.tsx        (main component)
// ✅ // UserProfile.types.ts   (type definitions)
// ✅ // UserProfile.hooks.ts   (custom hooks)
// ✅ // UserProfile.utils.ts   (helper functions)
```

**Enforced by:** ESLint (REVIEWED, coverage: strong)

---

### R9 — No Commented-Out Code in Production [WARNING] [REVIEWED]

<!-- GUIDE: Manual review during PR process — look for blocks of commented code larger than 2 lines -->

**Why:** Commented-out code creates confusion about intent, adds noise, and often becomes stale. Version control serves as the proper history mechanism.

**Bad → Good:**
```
// ❌ function calculateTotal(items) {
// ❌   // const tax = 0.08; // old tax rate
// ❌   const tax = 0.0825; // new tax rate
// ❌   // return items.reduce((sum, item) => sum + item.price, 0) * (1 + tax);
// ❌   return items.reduce((sum, item) => sum + item.price * (1 + tax), 0);
// ❌ }

// ✅ function calculateTotal(items: Item[]): number {
//      const TAX_RATE = 0.0825;
//      return items.reduce((sum, item) => sum + item.price * (1 + TAX_RATE), 0);
//    }
```

**Enforced by:** Human Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which files/area]
Reason:   [why this rule doesn't apply here — e.g., "legacy integration requires any type"]
Approved: @[who — e.g., tech-lead]
Expires:  [date or "permanent — re-evaluate at [date]"]
Control:  [what mitigates the maintainability risk instead]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

## Checklist

```
□ TypeScript strict mode enabled, no unresolved 'any' without justification comment?  (R1)
□ No empty catch blocks — all errors logged or rethrown?  (R2)
□ No magic numbers or strings — all literals extracted to named constants?  (R3)
□ Naming follows camelCase/PascalCase/UPPER_SNAKE_CASE conventions?  (R4)
□ Functions under 30 lines — larger functions split into helpers?  (R5)
□ Cyclomatic complexity under 15 (human) or 8 (AI-generated)?  (R6)
□ No unused variables or imports?  (R7)
□ File under 300 lines (warning) / 500 lines (CI error)?  (R8)
□ No commented-out code blocks larger than 2 lines?  (R9)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | TypeScript Compiler + ESLint | pre-commit/CI | BLOCKED | strong |
| R2 | ESLint | pre-commit/CI | BLOCKED | strong |
| R3 | ESLint | pre-commit/CI | BLOCKED | strong |
| R4 | ESLint | pre-commit/CI | PREVENTED | strong |
| R5 | ESLint | pre-commit/CI | PREVENTED | strong |
| R6 | ESLint | pre-commit/CI | PREVENTED | partial |
| R7 | ESLint | pre-commit/CI | PREVENTED | strong |
| R8 | ESLint | PR | REVIEWED | strong |
| R9 | Human Review | PR | REVIEWED | advisory |
