# DESIGN_SYSTEM_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "components/**"
    - "ui/**"
    - "styles/**"
    - "design-system/**"
    - "themes/**"
    - "src/components/**"
    - "src/ui/**"
    - "src/styles/**"
  keywords:
    - design token
    - CSS variable
    - component API
    - deprecated component
    - theme
    - design system
    - lifecycle
  exclusions:
    - "*.test.ts"
    - "*.spec.ts"
    - "*.test.tsx"
    - "*.generated.ts"
    - "*.stories.ts"
    - "migrations/**"
    - "dist/**"
    - "build/**"
related:
  - agent: architecture
    type: consult
    boundary: "Design System owns component API design and token enforcement. Architecture owns component folder structure and module boundaries."
  - agent: security
    type: delegates
    boundary: "Design System delegates theme injection prevention to Security."
  - agent: observability
    type: delegates
    boundary: "Design System delegates component usage analytics to Observability."
  - agent: architecture
    type: overlaps
    boundary: "Design System and Architecture both touch component structure; Architecture owns module boundaries, Design System owns component API design."
```

## Purpose

Enforces design system consistency through standardized tokens, versioned components, and controlled theming. Prevents design drift and ensures maintainable UI code by requiring design tokens over hardcoded values and proper component lifecycle management. Without it, the application's UI becomes inconsistent, difficult to maintain, and slow to update.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8) — process discipline

## Applicability

- Creating or modifying UI components
- Adding styles or CSS variables
- Changing design tokens or theme definitions
- Updating component library versions
- Excluded: external library components, build-generated styles, test utilities, backend services

---

## Rules

### HARD BOUNDARIES

### R1 — Design Tokens Only [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint with no-hardcoded-colors rule, set up CSS variable linter in stylelint.config.js -->

**Why:** Hardcoded values create design drift and make theming impossible. Every pixel value becomes technical debt.

**Bad → Good:**
```
// Bad
background-color: #3B82F6;
margin: 16px;
font-size: 14px;

// Good
background-color: var(--color-primary-500);
margin: var(--spacing-md);
font-size: var(--text-sm);
```

**Enforced by:** ESLint + Stylelint (BLOCKED, coverage: strong)

---

### R2 — No Deprecated Components [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint with no-restricted-imports rule to ban imports from deprecated component paths or @deprecated JSDoc tags -->

**Why:** Using deprecated components introduces known bugs, accessibility issues, or outdated patterns that block future upgrades.

**Bad → Good:**
```
// Bad
import { OldButton, LegacyModal } from "ui-library";

// Good
import { Button, Modal } from "ui-library";
```

**Enforced by:** ESLint (BLOCKED, coverage: strong)

---

### R3 — Component Lifecycle Status Required [BLOCKER] [BLOCKED]

<!-- GUIDE: Add @lifecycle JSDoc tag to all exported components, configure TypeScript to require this annotation -->

**Why:** Components without lifecycle status create confusion about stability and usage guidelines.

**Bad → Good:**
```
// Bad
export const Button = () => { ... }

// Good
/**
 * @lifecycle stable
 * @since v2.1.0
 */
export const Button = () => { ... }
```

**Enforced by:** TypeScript + Custom Linter (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Component API Consistency [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure component API linter to check for standard prop patterns (size, variant, disabled, etc.) -->

**Why:** Inconsistent component APIs create cognitive overhead and reduce developer productivity.

**Bad → Good:**
```
// Bad
<Button size="large" color="blue" isDisabled />
<Input inputSize="big" theme="primary" disabled />

// Good
<Button size="lg" variant="primary" disabled />
<Input size="lg" variant="primary" disabled />
```

**Enforced by:** Custom ESLint Rule (PREVENTED, coverage: partial)

---

### R5 — Semantic Token Usage [CRITICAL] [PREVENTED]

<!-- GUIDE: Set up semantic token validation in design-tokens.config.js to flag primitive token usage in components -->

**Why:** Using primitive tokens directly couples components to specific values instead of semantic meaning.

**Bad → Good:**
```
// Bad
color: var(--blue-500);
padding: var(--space-4);

// Good
color: var(--color-primary);
padding: var(--spacing-component-padding);
```

**Enforced by:** Design Token Linter (PREVENTED, coverage: partial)

---

### R6 — Theme Changes Without Code Alterations [CRITICAL] [PREVENTED]

<!-- GUIDE: Design theming must be driven by CSS variables or configuration files, not conditional logic -->

**Why:** Embedding theme logic inside components makes them complex and tightly coupled to specific themes.

**Bad → Good:**
```
// Bad
const backgroundColor = theme === 'dark' ? 'black' : 'white';

// Good
backgroundColor: var(--theme-background);
// Theme switching handled by CSS variable updates
```

**Enforced by:** Theme Provider Linter (PREVENTED, coverage: strong)

---

### GOVERNANCE

### R7 — Component Documentation Required [WARNING] [REVIEWED]

<!-- GUIDE: Set up Storybook integration and require .stories.js files for all public components -->

**Why:** Undocumented components are harder to adopt and maintain, leading to duplicate implementations.

**Bad → Good:**
```
// Bad
export const ComplexForm = () => { ... }

// Good
/**
 * ComplexForm handles multi-step data collection
 * @example
 * <ComplexForm onSubmit={handleSubmit} />
 */
export const ComplexForm = () => { ... }
// + ComplexForm.stories.js exists
```

**Enforced by:** Storybook Coverage Check (REVIEWED, coverage: partial)

---

### R8 — Deprecation Timeline [WARNING] [REVIEWED]

<!-- GUIDE: Set up automated deprecation warnings in build process, require migration guide for deprecated components -->

**Why:** Components stuck in deprecated status create technical debt and confusion about migration paths.

**Bad → Good:**
```
// Bad
/**
 * @deprecated since v2.0.0
 */

// Good
/**
 * @deprecated since v2.0.0 - migrate to NewButton by v3.0.0
 * @see migration guide: /docs/migration/button
 */
```

**Enforced by:** Documentation Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R1
Scope:    src/components/layout/AppShell.tsx (body gradient)
Reason:   Body gradient requires exact rgba values not expressible via token alone
Approved: @[who]
Expires:  permanent — re-evaluate at 2027-01-01
Control:  Single isolated occurrence; value matches globals.css definition
```

**WARNING — solo/small team:**
```
Override: R7 — Storybook not yet configured — @[who] — expires 2026-07-01
```

## Checklist

```
□ All color/spacing/typography values use CSS variables (no hex, no raw px)?  (R1)
□ No imports from deprecated component paths?  (R2)
□ All exported components have @lifecycle JSDoc tag?  (R3)
□ Component props follow standard patterns (size, variant, disabled)?  (R4)
□ Semantic tokens used instead of primitive tokens in component styles?  (R5)
□ Theme switching handled by CSS variable swap, not conditional logic?  (R6)
□ All public components have JSDoc + Storybook story?  (R7)
□ Deprecated components have migration guide and removal version?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint + Stylelint | pre-commit | BLOCKED | strong |
| R2 | ESLint | pre-commit | BLOCKED | strong |
| R3 | TypeScript + Custom Linter | CI | BLOCKED | strong |
| R4 | Custom ESLint Rule | CI | PREVENTED | partial |
| R5 | Design Token Linter | CI | PREVENTED | partial |
| R6 | Theme Provider Linter | CI | PREVENTED | strong |
| R7 | Storybook Coverage | PR | REVIEWED | partial |
| R8 | Documentation Review | PR | REVIEWED | advisory |
