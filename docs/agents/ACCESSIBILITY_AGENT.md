# ACCESSIBILITY_AGENT

## Meta

```yaml
version: 1.1
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
- **Hard boundaries** (R1, R2, R3, R9, R10, R11) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6, R12, R13, R14, R15) — judgment-based
- **Governance** (R7, R8, R16, R17, R18) — process discipline

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

### R9 — Provide Text Alternatives for Images [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint jsx-a11y "img-has-alt" rule, require alt text for informative images, alt="" for decorative -->

**Why:** Screen readers cannot interpret visual content without text alternatives, violating WCAG 2.1 Success Criterion 1.1.1.

**Bad → Good:**
```
// ❌ <img src="/chart.png" />
// ❌ <img src="/avatar.jpg" alt="Image" />

// ✅ <img src="/chart.png" alt="Sales increased 25% from Q1 to Q2" />
// ✅ <img src="/decorative-border.svg" alt="" role="presentation" />
```

**Enforced by:** ESLint jsx-a11y (BLOCKED, coverage: strong)

---

### R10 — Ensure Minimum Touch Target Size [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure stylelint-a11y plugin, enforce minimum 44x44px touch targets per WCAG 2.1 AAA guideline 2.5.5 -->

**Why:** Touch targets smaller than 44×44 CSS pixels are difficult to activate for users with motor impairments or those using assistive pointing devices.

**Bad → Good:**
```
// ❌ button { width: 24px; height: 24px; }

// ✅ button { 
//      width: 44px; 
//      height: 44px;
//      min-width: 44px;
//      min-height: 44px;
//    }
```

**Enforced by:** stylelint-a11y (BLOCKED, coverage: strong)

---

### R11 — Provide Skip Navigation Links [BLOCKER] [BLOCKED]

<!-- GUIDE: Include visually hidden skip links as first focusable element, targeting main content and navigation landmarks -->

**Why:** Keyboard and screen reader users need to bypass repetitive navigation content to reach main content efficiently, per WCAG 2.1 Success Criterion 2.4.1.

**Bad → Good:**
```
// ❌ <header><nav>...lengthy navigation...</nav></header><main>content</main>

// ✅ <a href="#main-content" className="skip-link">Skip to main content</a>
// ✅ <header><nav>...navigation...</nav></header>
// ✅ <main id="main-content">content</main>
```

**Enforced by:** axe-core (BLOCKED, coverage: strong)

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

### R12 — Use Proper Heading Hierarchy [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure ESLint jsx-a11y "heading-has-content" and custom rule for sequential heading levels (h1→h2→h3, no skipping) -->

**Why:** Screen readers use heading structure to navigate content; skipping heading levels or improper nesting creates confusing document outlines per WCAG 2.1 Success Criterion 2.4.6.

**Bad → Good:**
```
// ❌ <h1>Page Title</h1>
// ❌ <h3>Section Title</h3>  // Skipped h2
// ❌ <h5>Subsection</h5>     // Skipped h4

// ✅ <h1>Page Title</h1>
// ✅ <h2>Section Title</h2>
// ✅ <h3>Subsection</h3>
```

**Enforced by:** ESLint jsx-a11y + custom rules (PREVENTED, coverage: strong)

---

### R13 — Provide Form Error Identification and Suggestions [CRITICAL] [REVIEWED]

<!-- GUIDE: Associate error messages with form controls using aria-describedby, provide specific error descriptions and correction suggestions -->

**Why:** Users with cognitive disabilities and screen reader users need clear error identification and guidance to successfully complete forms per WCAG 2.1 Success Criteria 3.3.1 and 3.3.3.

**Bad → Good:**
```
// ❌ <input type="email" className={hasError ? 'error' : ''} />
// ❌ {hasError && <div>Invalid input</div>}

// ✅ <input 
// ✅   type="email" 
// ✅   aria-invalid={hasError}
// ✅   aria-describedby="email-error"
// ✅ />
// ✅ {hasError && 
// ✅   <div id="email-error" role="alert">
// ✅     Email format is invalid. Please enter a valid email like user@example.com
// ✅   </div>
// ✅ }
```

**Enforced by:** Code Review (REVIEWED, coverage: advisory)

---

### R14 — Ensure Sufficient Animation Control [CRITICAL] [REVIEWED]

<!-- GUIDE: Respect prefers-reduced-motion media query, provide pause/stop controls for auto-playing content longer than 5 seconds -->

**Why:** Users with vestibular disorders can experience nausea, dizziness, or seizures from excessive motion, per WCAG 2.1 Success Criteria 2.2.2 and 2.3.3.

**Bad → Good:**
```
// ❌ .carousel { animation: slide 3s infinite; }

// ✅ .carousel { animation: slide 3s infinite; }
// ✅ @media (prefers-reduced-motion: reduce) {
// ✅   .carousel { animation: none; }
// ✅ }
```

**Enforced by:** Code Review + CSS analysis (REVIEWED, coverage: advisory)

---

### R15 — Use Landmark Regions Appropriately [CRITICAL] [PREVENTED]

<!-- GUIDE: Use semantic HTML5 elements (header, nav, main, aside, footer) or ARIA landmarks, ensure single main landmark per page -->

**Why:** Screen reader users rely on landmark navigation to quickly move between page sections, per WCAG 2.1 Success Criterion 2.4.1.

**Bad → Good:**
```
// ❌ <div className="header">...</div>
// ❌ <div className="navigation">...</div>
// ❌ <div className="content">...</div>

// ✅ <header>...</header>
// ✅ <nav aria-label="Main navigation">...</nav>
// ✅ <main>...</main>
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

### R16 — Document Language and Language Changes [WARNING] [PREVENTED]

<!-- GUIDE: Set html lang attribute, use lang attribute on elements with different language content than page default -->

**Why:** Screen readers need language information to use correct pronunciation and speech characteristics per WCAG 2.1 Success Criteria 3.1.1 and 3.1.2.

**Bad → Good:**
```
// ❌ <html>
// ❌ <span>Café Résumé</span>

// ✅ <html lang="en">
// ✅ <span lang="fr">Café Résumé</span>
```

**Enforced by:** ESLint jsx-a11y (PREVENTED, coverage: strong)

---

### R17 — Provide Consistent Navigation and Identification [WARNING] [REVIEWED]

<!-- GUIDE: Maintain consistent navigation order and labeling across pages, use consistent identification for same-function components -->

**Why:** Predictable navigation patterns help users with cognitive disabilities and screen reader users understand site structure per WCAG 2.1 Success Criteria 3.2.3 and 3.2.4.

**Bad → Good:**
```
// ❌ Page 1: Home | About | Contact
// ❌ Page 2: Products | Home | About | Contact | Support

// ✅ Page 1: Home | About | Products | Contact | Support
// ✅ Page 2: Home | About | Products | Contact | Support
```

**Enforced by:** Design Review (REVIEWED, coverage: advisory)

---

### R18 — Implement Timeout Warnings and Extensions [WARNING] [REVIEWED]

<!-- GUIDE: Warn users before session timeouts, provide mechanism to extend or eliminate time limits for non-security essential timeouts -->

**Why:** Users with disabilities may need more time to read and interact with content per WCAG 2.1 Success Criterion 2.2.1.

**Bad → Good:**
```
// ❌ // Silent timeout after 20 minutes

// ✅ // Warning at 18 minutes with option to extend
// ✅ <TimeoutWarning 
// ✅   onExtend={() => extendSession(20 * 60 * 1000)}
// ✅   timeRemaining={timeLeft}
// ✅ />
```

**Enforced by:** Product Review (REVIEWED, coverage: advisory)

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
□ All images have appropriate alt text or alt="" for decorative?  (R9)
□ Interactive elements meet minimum 44x44px touch target size?  (R10)
□ Skip navigation links provided for keyboard users?  (R11)
□ Heading hierarchy is logical and sequential (h1→h2→h3)?  (R12)
□ Form errors clearly identified with correction suggestions?  (R13)
□ Animation respects prefers-reduced-motion preference?  (R14)
□ Landmark regions (header, nav, main, footer) properly used?  (R15)
□ Page language set and language changes marked with lang attribute?  (R16)
□ Navigation order and component identification consistent across pages?  (R17)
□ Timeout warnings provided with extension options?  (R18)
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
| R9 | ESLint jsx-a11y | pre-commit | BLOCKED | strong |
| R10 | stylelint-a11y | pre-commit | BLOCKED | strong |
| R11 | axe-core | CI | BLOCKED | strong |
| R12 | ESLint jsx-a11y + custom | pre-commit | PREVENTED | strong |
| R13 | Code Review | PR | REVIEWED | advisory |
| R14 | Code Review + CSS analysis | PR | REVIEWED | advisory |
| R15 | ESLint jsx-a11y | pre-commit | PREVENTED | strong |
| R16 | ESLint jsx-a11y | pre-commit | PREVENTED | strong |
| R17 | Design Review | design phase | REVIEWED | advisory |
| R18 | Product Review | feature planning | REVIEWED | advisory |