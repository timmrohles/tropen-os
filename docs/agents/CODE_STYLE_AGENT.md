# CODE_STYLE_AGENT

## Meta

```yaml
version: 1.1
last_updated: 2024-01-10
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
    - immutability
    - side-effects
    - comments
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

This agent contains 4 types of rules:
- **Hard boundaries** (R1, R2, R3, R10) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6, R7, R11, R12, R13, R14, R15) — judgment-based
- **Code organization** (R16, R17, R18, R19, R20) — architectural clarity
- **Governance** (R8, R9, R21, R22, R23) — process discipline

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
```typescript
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
```typescript
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
```typescript
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

### R10 — Use Strict Equality Operators [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint with "eqeqeq" rule set to "always" to enforce === and !== over == and !=. Derived from OWASP Secure Coding Practices checklist, which emphasizes avoiding implicit type coercion to prevent subtle bugs. -->

**Why:** Non-strict equality (==) performs type coercion, leading to unexpected behavior and hard-to-debug issues, such as "0" == 0 evaluating to true.

**Bad → Good:**
```typescript
// ❌ if (userInput == 0) {
// ❌   return "zero";
// ❌ }

// ✅ if (userInput === 0) {
//      return "zero";
//    }
```

**Enforced by:** ESLint (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Consistent Naming Conventions [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure ESLint with "@typescript-eslint/naming-convention" rule. See CLAUDE.md Namenskonventionen table for TropenOS-specific conventions. -->

**Why:** Inconsistent naming creates cognitive load and makes code harder to search, understand, and maintain across team members.

**Bad → Good:**
```typescript
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
```typescript
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
```typescript
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
```typescript
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

### R11 — Prefer Const for Immutability [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "prefer-const". This is a core tenant of functional and predictable programming. -->

**Why:** Using `const` by default prevents accidental variable reassignment, which is a common source of bugs. It signals that a variable's reference will not change, making the code easier to reason about and follow. `let` should only be used when reassignment is explicitly intended.

**Bad → Good:**
```typescript
// ❌ let user = fetchUser(id);
// ❌ if (!user) {
// ❌   user = createDefaultUser();
// ❌ }
// ❌ let items = [1, 2, 3];
// ❌ items = items.map(i => i * 2);

// ✅ const user = fetchUser(id) ?? createDefaultUser();
// ✅ 
// ✅ const initialItems = [1, 2, 3];
// ✅ const doubledItems = initialItems.map(i => i * 2);
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R12 — No Parameter Reassignment [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "no-param-reassign". Modifying parameters is a side effect that can lead to unexpected behavior outside the function's scope. -->

**Why:** Reassigning function parameters obscures the original value and makes debugging difficult. It creates impure functions with side effects that are hard to trace. Instead, treat parameters as immutable and assign their modified values to new local variables.

**Bad → Good:**
```typescript
// ❌ function applyDiscount(price: number, discount: number): number {
// ❌   if (price < 0) {
// ❌     price = 0; // Mutation of the parameter
// ❌   }
// ❌   return price * (1 - discount);
// ❌ }

// ✅ function applyDiscount(price: number, discount: number): number {
//      const adjustedPrice = Math.max(0, price); // Assign to a new variable
//      return adjustedPrice * (1 - discount);
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R13 — Simplify Boolean Expressions [WARNING] [PREVENTED]

<!-- GUIDE: Use ESLint rules "no-unneeded-ternary" for direct returns and "yoda" for condition style. -->

**Why:** Explicitly comparing to `true` or using a ternary operator to return `true`/`false` is redundant and adds noise. "Yoda" conditions (e.g., `if ("red" === color)`) are less readable than the natural language order. Simple, direct boolean logic is easier to understand at a glance.

**Bad → Good:**
```typescript
// ❌ if (isComplete === true) {
// ❌   // ...
// ❌ }
// ❌ return user.isActive ? true : false;
// ❌ if (MAX_RETRIES < retries) { /* ... */ } // "Yoda" condition is less readable

// ✅ if (isComplete) {
//      // ...
//    }
// ✅ return user.isActive;
// ✅ if (retries > MAX_RETRIES) { /* ... */ } // Natural order
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R14 — Limit Line Length to 100 Characters [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure ESLint with "max-len" rule set to max: 100, ignoring comments and strings. Derived from OWASP guidelines on code readability to facilitate secure code reviews. -->

**Why:** Excessively long lines reduce readability, especially on smaller screens or during code reviews, increasing the chance of overlooking issues.

**Bad → Good:**
```typescript
// ❌ const veryLongVariableNameThatExceedsTheLineLimitAndMakesItHardToReadWithoutScrolling = initializeComplexObjectWithManyParameters(parameter1, parameter2, parameter3);

// ✅ const veryLongVariableNameThatExceedsTheLineLimitAndMakesItHardToReadWithoutScrolling =
// ✅   initializeComplexObjectWithManyParameters(
// ✅     parameter1,
// ✅     parameter2,
// ✅     parameter3
// ✅   );
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R15 — Use JSDoc for Function Documentation [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "jsdoc/require-jsdoc" for functions with cyclomatic complexity > 8, or when implementing business rules. -->

**Why:** Complex logic without documentation becomes unmaintainable as team members change and business requirements evolve. Documentation serves as specification and aids debugging.

**Bad → Good:**
```typescript
// ❌ function calculatePremium(age, coverage, history, location) {
// ❌   const base = coverage * 0.02;
// ❌   const ageFactor = age < 25 ? 1.5 : age > 65 ? 1.3 : 1.0;
// ❌   const historyFactor = history.length > 0 ? 1.2 : 0.9;
// ❌   const locationFactor = HIGH_RISK_AREAS.includes(location) ? 1.4 : 1.0;
// ❌   return base * ageFactor * historyFactor * locationFactor;
// ❌ }

// ✅ /**
//    * Calculates insurance premium based on risk factors
//    * 
//    * Business Rules:
//    * - Base premium is 2% of coverage amount
//    * - Age penalty: +50% for under 25, +30% for over 65
//    * - Claims history: +20% if any claims, -10% if no claims
//    * - Location penalty: +40% for high-risk areas
//    * 
//    * @param age - Driver age in years
//    * @param coverage - Coverage amount in dollars
//    * @param history - Array of previous claims
//    * @param location - ZIP code or area identifier
//    * @returns Monthly premium amount in dollars
//    */
// ✅ function calculateInsurancePremium(
//      age: number, 
//      coverage: number, 
//      history: Claim[], 
//      location: string
//    ): number {
//      const basePremium = coverage * PREMIUM_RATE;
//      const ageFactor = getAgeFactor(age);
//      const historyFactor = getHistoryFactor(history);
//      const locationFactor = getLocationFactor(location);
//      
//      return basePremium * ageFactor * historyFactor * locationFactor;
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: partial)

---

### CODE ORGANIZATION

### R16 — Consistent Import Organization [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint plugin "simple-import-sort" or "@typescript-eslint/consistent-type-imports" -->

**Why:** Consistent import organization improves code readability, reduces merge conflicts, and makes dependencies clearer. Separating type imports from value imports helps with tree-shaking and build optimization.

**Bad → Good:**
```typescript
// ❌ import { UserService } from './services/user';
// ❌ import React from 'react';
// ❌ import { User } from './types/user';
// ❌ import { validateInput } from '../utils/validation';
// ❌ import lodash from 'lodash';

// ✅ // External libraries first
// ✅ import React from 'react';
// ✅ import lodash from 'lodash';
// ✅ 
// ✅ // Types (separated)
// ✅ import type { User } from './types/user';
// ✅ 
// ✅ // Internal modules (relative imports last)
// ✅ import { UserService } from './services/user';
// ✅ import { validateInput } from '../utils/validation';
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R17 — Interface Segregation Principle [CRITICAL] [PREVENTED]

<!-- GUIDE: Use TypeScript interface design patterns; split large interfaces into focused, composable interfaces -->

**Why:** Large interfaces force implementers to depend on methods they don't use, violating the Interface Segregation Principle and making code harder to test and maintain.

**Bad → Good:**
```typescript
// ❌ interface UserManager {
// ❌   createUser(data: UserData): User;
// ❌   updateUser(id: string, data: Partial<UserData>): User;
// ❌   deleteUser(id: string): void;
// ❌   sendEmail(to: string, subject: string, body: string): void;
// ❌   generateReport(type: ReportType): Report;
// ❌   auditUserActions(userId: string): AuditLog[];
// ❌ }

// ✅ interface UserRepository {
//      createUser(data: UserData): User;
//      updateUser(id: string, data: Partial<UserData>): User;
//      deleteUser(id: string): void;
//    }
// ✅
// ✅ interface EmailService {
//      sendEmail(to: string, subject: string, body: string): void;
//    }
// ✅
// ✅ interface ReportGenerator {
//      generateReport(type: ReportType): Report;
//    }
// ✅
// ✅ interface AuditService {
//      auditUserActions(userId: string): AuditLog[];
//    }
```

**Enforced by:** Human Review (PREVENTED, coverage: partial)

---

### R18 — Explicit Return Types for Public Functions [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "@typescript-eslint/explicit-function-return-type" for exported functions only -->

**Why:** Explicit return types serve as documentation, prevent accidental API changes, and improve TypeScript's type inference performance for consumers of the function.

**Bad → Good:**
```typescript
// ❌ export function calculateTax(amount, rate) {
// ❌   return amount * rate;
// ❌ }

// ✅ export function calculateTax(amount: number, rate: number): number {
//      return amount * rate;
//    }
// ✅
// ✅ // Private/internal functions can use inference
// ✅ function helperCalculation(x: number, y: number) {
//      return x + y; // return type inferred as number
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R19 — Avoid Deep Nesting [CRITICAL] [PREVENTED]

<!-- GUIDE: Use ESLint rule "max-depth" with max: 4 levels of nesting -->

**Why:** Deep nesting increases cognitive load, makes code harder to follow, and often indicates missing abstractions or violation of single responsibility principle.

**Bad → Good:**
```typescript
// ❌ function processUserData(users) {
// ❌   for (const user of users) {
// ❌     if (user.active) {
// ❌       if (user.permissions) {
// ❌         for (const permission of user.permissions) {
// ❌           if (permission.type === 'admin') {
// ❌             if (permission.scope === 'global') {
// ❌               // 5 levels deep!
// ❌               user.isGlobalAdmin = true;
// ❌             }
// ❌           }
// ❌         }
// ❌       }
// ❌     }
// ❌   }
// ❌ }

// ✅ function processUserData(users: User[]): void {
//      users.forEach(user => {
//        if (!user.active || !user.permissions) return;
//        
//        const hasGlobalAdminPermission = user.permissions.some(
//          permission => permission.type === 'admin' && permission.scope === 'global'
//        );
//        
//        if (hasGlobalAdminPermission) {
//          user.isGlobalAdmin = true;
//        }
//      });
//    }
```

**Enforced by:** ESLint (PREVENTED, coverage: strong)

---

### R20 — Consistent Error Handling Patterns [CRITICAL] [PREVENTED]

<!-- GUIDE: Establish error handling patterns using custom error classes and consistent error propagation -->

**Why:** Inconsistent error handling makes debugging difficult and creates unpredictable behavior for consumers. Standardized error patterns improve maintainability and user experience.

**Bad → Good:**
```typescript
// ❌ function fetchUser(id) {
// ❌   try {
// ❌     const user = database.getUser(id);
// ❌     return user;
// ❌   } catch (e) {
// ❌     console.log("Error:", e);
// ❌     return null; // Inconsistent error handling
// ❌   }
// ❌ }
// ❌
// ❌ function deleteUser(id) {
// ❌   const user = database.deleteUser(id);
// ❌   if (!user) {
// ❌     throw new Error("Failed"); // Generic error
// ❌   }
// ❌ }

//