# ACCESSIBILITY_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "src/components/**/*.tsx"
    - "src/views/**/*.tsx"
    - "src/pages/**/*.tsx"
    - "src/ui/**/*.tsx"
  keywords:
    - accessibility
    - aria
    - wcag
    - keyboard navigation
    - focus
    - screen reader
    - contrast
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "migrations/**"
    - "**/*.stories.tsx"
related:
  - agent: architecture
    type: consult
    boundary: "Architecture Agent owns component structure decisions. Accessibility Agent owns interaction patterns within those components."
  - agent: security
    type: overlaps
    boundary: "Security Agent owns form validation logic. Accessibility Agent owns form labeling and semantic patterns."
  - agent: design-system
    type: delegates
    boundary: "Design System Agent owns color palettes and typography scales. Accessibility Agent defers contrast ratio choices to Design System Agent."
```

## Purpose

This agent ensures UI components meet WCAG 2.1 AA accessibility standards through semantic HTML, proper ARIA usage, and keyboard navigation. Without accessibility compliance, applications exclude users with disabilities, face legal compliance risks, and create barriers that are costly to fix later.

**Gewicht im Audit: ×3 (kritisch — EU Accessibility Act 2025 ist seit Juni 2025 in Kraft und gilt für B2B SaaS).**

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8) — process discipline

## Applicability

- Applies when creating or modifying UI components that users interact with, adding form controls, navigation elements, or interactive widgets, implementing focus management or keyboard shortcuts, or using color to convey information or state
- Excluded: Backend logic, build scripts, internal development tooling

---

## Rules

### HARD BOUNDARIES

### R1 — Use Semantic HTML Elements [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint with jsx-a11y plugin, enable "jsx-a11y/no-static-element-interactions" and "jsx-a11y/anchor-is-valid" rules -->

**Why:** Screen readers and keyboard navigation depend on semantic elements to understand page structure and provide appropriate interaction methods.

**Bad → Good:**
```
// ❌ <div onClick={handleSubmit}>Submit</div>
// ❌ <div onClick={navigate}>Go to Profile</div>

// ✅ <button onClick={handleSubmit}>Submit</button>
// ✅ <a href="/profile">Go to Profile</a>
```

**Enforced by:** ESLint jsx-a11y (BLOCKED, coverage: strong)

---

### R2 — Maintain WCAG Color Contrast Ratios [BLOCKER] [BLOCKED]

<!-- GUIDE: Run axe-core in CI pipeline, configure minimum contrast ratios: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold) -->

**Why:** Insufficient color contrast makes text unreadable for users with visual impairments, affecting 1 in 12 men and 1 in 200 women.

**Bad → Good:**
```
// ❌ color: #999999 on #FFFFFF background (2.85:1 ratio)

// ✅ color: #767676 on #FFFFFF background (4.54:1 ratio)
```

**Enforced by:** axe-core (BLOCKED, coverage: strong)

---

### R3 — Ensure All Interactive Elements Are Keyboard Accessible [BLOCKER] [PREVENTED]

<!-- GUIDE: Test with Tab/Shift+Tab navigation, ensure all interactive elements receive focus and respond to Enter/Space appropriately -->

**Why:** Users who cannot use a mouse must be able to operate all functionality through keyboard alone.

**Bad → Good:**
```
// ❌ <div onClick={openModal}>Open Dialog</div>

// ✅ <button onClick={openModal}>Open Dialog</button>
// Or for custom elements:
// ✅ <div onClick={openModal} onKeyDown={handleKeyDown} tabIndex="0" role="button">Open Dialog</div>
```

**Enforced by:** ESLint jsx-a11y (PREVENTED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Provide Accessible Names for Form Controls [CRITICAL] [PREVENTED]

<!-- GUIDE: Every input must have associated label via htmlFor/id, aria-label, or aria-labelledby attributes -->

**Why:** Screen reader users cannot understand the purpose of form fields without proper labels.

**Bad → Good:**
```
// ❌ <input type="email" placeholder="Enter email" />

// ✅ <label htmlFor="email">Email Address</label>
// ✅ <input id="email" type="email" />
```

**Enforced by:** ESLint jsx-a11y (PREVENTED, coverage: strong)

---

### R5 — Maintain Visible Focus Indicators [CRITICAL] [REVIEWED]

<!-- GUIDE: Never use outline: none without providing alternative focus styling with at least 2:1 contrast against adjacent colors -->

**Why:** Keyboard users must see which element currently has focus to navigate effectively through the interface.

**Bad → Good:**
```
// ❌ button:focus { outline: none; }

// ✅ button:focus-visible {
//      outline: 2px solid #0066CC;
//      outline-offset: 2px;
//    }
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

### R6 — Use ARIA Correctly and Sparingly [CRITICAL] [PREVENTED]

<!-- GUIDE: Enable ESLint jsx-a11y rules "jsx-a11y/aria-props", "jsx-a11y/aria-proptypes", and "jsx-a11y/no-redundant-roles" -->

**Why:** Incorrect ARIA attributes provide wrong information to assistive technologies, making interfaces more confusing than having no ARIA at all.

**Bad → Good:**
```
// ❌ <button role="button" aria-label="Submit" aria-labelledby="submit-text">
// ❌   <span id="submit-text">Submit Form</span>
// ❌ </button>

// ✅ <button aria-labelledby="submit-text">
// ✅   <span id="submit-text">Submit Form</span>
// ✅ </button>
```

**Enforced by:** ESLint jsx-a11y (PREVENTED, coverage: strong)

---

### GOVERNANCE

### R7 — Complex Widgets Must Follow ARIA Patterns [WARNING] [REVIEWED]

<!-- GUIDE: Follow WAI-ARIA Authoring Practices for tabs, accordions, menus, and custom controls -->

**Why:** Custom UI patterns need explicit ARIA to communicate their behavior and state to assistive technologies.

**Bad → Good:**
```
// ❌ <div className="tabs">
// ❌   <div onClick={selectTab1}>Tab 1</div>
// ❌   <div onClick={selectTab2}>Tab 2</div>
// ❌ </div>

// ✅ <div role="tablist">
// ✅   <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
// ✅   <button role="tab" aria-selected="false" aria-controls="panel2">Tab 2</button>
// ✅ </div>
```

**Enforced by:** Code Review (REVIEWED, coverage: advisory)

---

### R8 — Screen Reader Testing Required for New Components [WARNING] [REVIEWED]

<!-- GUIDE: Test new components with VoiceOver (macOS), NVDA (Windows), or ORCA (Linux), document testing in PR description -->

**Why:** Automated tools catch only 30-40% of accessibility issues; real assistive technology testing reveals actual user experience problems.

**Bad → Good:**
```
// ❌ PR description: "Added new modal component"

// ✅ PR description: "Added new modal component
//    Accessibility testing:
//    - ✓ VoiceOver announces modal title and purpose
//    - ✓ Focus trapped within modal when open
//    - ✓ Escape key closes modal and returns focus"
```

**Enforced by:** PR Review Process (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which files/components/area]
Reason:   [why this rule doesn't apply here]
Approved: @[who]
Expires:  [date or "permanent — re-evaluate at [date]"]
Control:  [what mitigates the accessibility risk instead]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

## Checklist

```
□ Semantic HTML used — no <div onClick> for buttons or links?  (R1)
□ Color contrast meets 4.5:1 (normal text) or 3:1 (large text)?  (R2)
□ All interactive elements reachable and operable by keyboard?  (R3)
□ All form controls have accessible labels via htmlFor/aria-label?  (R4)
□ Focus indicators visible — no bare outline:none?  (R5)
□ ARIA used correctly, no redundant roles?  (R6)
□ Complex widgets follow WAI-ARIA patterns (tabs, menus, accordions)?  (R7)
□ New components tested with screen reader and result documented in PR?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint jsx-a11y | pre-commit | BLOCKED | strong |
| R2 | axe-core | CI | BLOCKED | strong |
| R3 | ESLint jsx-a11y | pre-commit | PREVENTED | strong |
| R4 | ESLint jsx-a11y | pre-commit | PREVENTED | strong |
| R5 | Manual Review | PR | REVIEWED | advisory |
| R6 | ESLint jsx-a11y | pre-commit | PREVENTED | strong |
| R7 | Code Review | PR | REVIEWED | advisory |
| R8 | PR Review Process | PR | REVIEWED | advisory |