```markdown
---
version: 1.0
type: regulatory
triggers:
  - "Every PR in a project processing EU user data"
exclusions:
  - "Internal tools with no external users"
  - "Purely static sites without user interaction"
  - "B2B-only products without public access"
related_agents:
  consult: []
  overlap: ["ACCESSIBILITY_AGENT"]
  defer_to: []
---

## Purpose
Enforces compliance with the German Barrierefreiheitsstärkungsgesetz (BFSG), effective June 28, 2025, implementing the EU Accessibility Act. Failure to comply can result in fines up to €100,000, market bans, and cease-and-desist letters from advocacy groups. This agent catches regulatory requirements for accessibility compliance that go beyond basic WCAG implementation.

## Applicability
This agent applies when:
- B2C web applications with public access
- E-commerce platforms serving German/EU users
- Banking/financial services applications
- SaaS products accessible to the public
- Digital services falling under EU Accessibility Act scope

Excluded: Internal B2B tools, pure API backends, developer tooling without UI

## Rules

### KATEGORIE 1: BFSG Legal Obligations

### R1 — Accessibility Statement Required
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** BFSG §12, EN 301 549 Annex C

<!-- GUIDE: Must have dedicated accessibility statement page under /barrierefreiheit or /accessibility-statement with BFSG compliance details -->

**Why:** Legal requirement under BFSG §12 — missing statement can trigger immediate regulatory action and market access ban.

**Checker:**
```
# Look for accessibility statement route/page
find src/app -type d \( -name "barrierefreiheit" -o -name "accessibility-statement" \) | grep -q .
```

**Enforced by:** Custom CI Check (BLOCKED) — Coverage: High

### R2 — Accessibility Feedback Mechanism
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** BFSG §12 Abs. 3

<!-- GUIDE: Must provide email contact or form for accessibility feedback within the accessibility statement -->

**Why:** BFSG mandates user feedback mechanism for accessibility issues — regulatory audit requirement.

**Checker:**
```
# Check the content of the accessibility statement page for an email or contact form reference
grep -r "barrierefreiheit@\|a11y@\|feedback.*accessibility\|Kontaktformular.*Barriere" src/app/barrierefreiheit/
```

**Enforced by:** Custom CI Check (BLOCKED) — Coverage: High

### R3 — BFSG Applicability Documentation
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** BFSG §1-3 Anwendungsbereich

<!-- GUIDE: Document why BFSG applies to this product (B2C, public access, service type) in README or package.json -->

**Why:** Clear applicability assessment required for regulatory compliance and audit defense.

**Checker:**
```
# Check for an explicit acknowledgment of BFSG applicability in project configuration
grep -q "\"bfsg-applicable\": true" package.json
```

**Enforced by:** Manual Review (REVIEWED) — Coverage: Medium

### KATEGORIE 2: WCAG 2.1 AA Extended Requirements

### R4 — Semantic HTML Landmarks
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** WCAG 2.1 SC 1.3.1, SC 4.1.2

<!-- GUIDE: Use <nav>, <main>, <header>, <footer> elements instead of divs with semantic classes -->

**Why:** Screen readers require semantic landmarks for navigation — WCAG 2.1 AA compliance mandatory under BFSG.

**Checker:**
```
# Flag usage of common class names on divs that should be semantic elements
grep -r -E '<div .*class=".*(nav|header|main|footer).*"' src/components/layout
```

**Enforced by:** ESLint jsx-a11y (PREVENTED) — Coverage: High

### R5 — Document Language Declaration
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** WCAG 2.1 SC 3.1.1

<!-- GUIDE: Set lang attribute on html element or root layout component -->

**Why:** Without language declaration, screen readers cannot pronounce text correctly, making content incomprehensible.

**Checker:**
```
# Ensure the main layout/document file contains <html lang="...">
! grep -L -r '<html.*lang=".*"' src/app/layout.tsx
```

**Enforced by:** Custom CI Check (BLOCKED) — Coverage: High

### R6 — Skip Navigation Link
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** WCAG 2.1 SC 2.4.1

<!-- GUIDE: First focusable element should skip to main content -->

**Why:** Keyboard users must be able to skip repetitive navigation — WCAG 2.1 Level A requirement.

**Checker:**
```
# Search for common patterns of skip-to-content links in main layout components
grep -r "skip-to-content\|skip.*main\|zum.*inhalt" src/components/layout/
```

**Enforced by:** Manual Review (REVIEWED) — Coverage: Medium

### R7 — Heading Hierarchy Validation
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** WCAG 2.1 SC 1.3.1, SC 2.4.6

<!-- GUIDE: No heading level skipping (h1→h3), proper nesting order -->

**Why:** Screen readers use heading structure for content navigation — improper hierarchy breaks accessibility.

**Checker:**
```
# This is best checked by a dedicated tool. A grep is unreliable.
# Check with axe-core for the "heading-order" rule during CI tests
```

**Enforced by:** axe-core (PREVENTED) — Coverage: High

### R8 — Touch Target Sizing
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** WCAG 2.1 SC 2.5.5 AA

<!-- GUIDE: Interactive elements minimum 44x44px, check button/link CSS -->

**Why:** Mobile users with motor disabilities need adequate touch targets — too small targets discriminate against users with motor impairments.

**Checker:**
```
# Look for styles on interactive elements that are explicitly smaller than 44px
grep -r -E "(button|a, \[role=button\]) {.*(height|width): ([0-9]|[1-3][0-9]|4[0-3])px" src/styles/
```

**Enforced by:** Stylelint (BLOCKED) — Coverage: High

### R9 — Reduced Motion Support
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** WCAG 2.1 SC 2.3.3

<!-- GUIDE: Respect prefers-reduced-motion for animations -->

**Why:** Users with vestibular disorders can experience dizziness or nausea from motion — ignoring preferences violates BFSG compliance.

**Checker:**
```
# If animations/transitions are found, check for the presence of the corresponding media query
grep -q "animation\|transition" src/**/*.css && ! grep -q "prefers-reduced-motion" src/**/*.css
```

**Enforced by:** Stylelint (PREVENTED) — Coverage: High

### KATEGORIE 3: Assistive Technology Support

### R10 — Focus Indicators Present
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** WCAG 2.1 SC 2.4.7

<!-- GUIDE: Visible focus indicators on all interactive elements, no outline:none without replacement -->

**Why:** Without visible focus, keyboard-only users cannot identify which element they are operating — making the site unusable.

**Checker:**
```
# Find occurrences of `outline: none` or `outline: 0` without a replacement style in the same rule
grep -r -E ":focus {.*outline: (none|0)" src/**/*.css
```

**Enforced by:** Stylelint a11y (BLOCKED) — Coverage: High

### R11 — ARIA Live Regions
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** WCAG 2.1 SC 4.1.3

<!-- GUIDE: Dynamic content updates need aria-live, role=status/alert -->

**Why:** Screen readers miss dynamic content without live regions — status updates must be announced.

**Checker:**
```
# Search in dynamic components for ARIA live attributes
grep -ri "aria-live\|role=\"status\"\|role=\"alert\"" src/components/chat/ src/components/notifications/ --include=\*.{tsx,jsx}
```

**Enforced by:** Manual Review (REVIEWED) — Coverage: Medium

### R12 — Image Alt Text Compliance
**Severity:** BLOCKER
**Enforcement:** PREVENTED
**Art. / Standard:** WCAG 2.1 SC 1.1.1

<!-- GUIDE: All img elements need alt attribute or role=presentation for decorative -->

**Why:** Screen readers need text alternatives for images — missing alt text fails WCAG 2.1 Level A.

**Checker:**
```
# Find <img> tags that are missing an `alt` attribute entirely
grep -r -P '<img (?!.*\balt=)' src/
```

**Enforced by:** ESLint jsx-a11y (PREVENTED) — Coverage: High

### KATEGORIE 4: Testing & Compliance Documentation

### R13 — Automated Accessibility Testing
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** BFSG §12 Konformitätserklärung

<!-- GUIDE: axe-core integration in CI/CD pipeline for compliance validation -->

**Why:** BFSG compliance statement requires testing evidence — automated testing provides audit trail.

**Checker:**
```
# Check if a known accessibility testing library is listed in devDependencies
grep -q "\"@axe-core/react\"|\"axe-playwright\"|\"jest-axe\"" package.json
```

**Enforced by:** Custom CI Check (BLOCKED) — Coverage: High

### R14 — Screen Reader Testing Documentation
**Severity:** WARNING
**Enforcement:** ADVISORY
**Art. / Standard:** EN 301 549 Testing Requirements

<!-- GUIDE: Document screen reader testing results (NVDA, JAWS, VoiceOver) -->

**Why:** EN 301 549 requires assistive technology testing for full compliance certification.

**Checker:**
```
# Look for screen reader testing docs
find docs/ -name "*screen*reader*" -o -name "*nvda*" -o -name "*jaws*"
```

**Enforced by:** Documentation Review (ADVISORY) — Coverage: Low

## Exceptions
Overrides allowed only with legal review and documented in code with:
`// @bfsg-ignore R[Rule Number]: [Justification and ticket link]`
- Temporary technical limitations must include remediation timeline
- Third-party components exempt only with vendor accessibility statement
- All exceptions require BFSG compliance officer approval

## Checklist

```
□ R1 — Accessibility Statement Required
□ R2 — Accessibility Feedback Mechanism
□ R3 — BFSG Applicability Documentation
□ R4 — Semantic HTML Landmarks
□ R5 — Document Language Declaration
□ R6 — Skip Navigation Link
□ R7 — Heading Hierarchy Validation
□ R8 — Touch Target Sizing
□ R9 — Reduced Motion Support
□ R10 — Focus Indicators Present
□ R11 — ARIA Live Regions
□ R12 — Image Alt Text Compliance
□ R13 — Automated Accessibility Testing
□ R14 — Screen Reader Testing Documentation
```

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Custom CI Check | CI | BLOCKED | High |
| R2 | Custom CI Check | CI | BLOCKED | High |
| R3 | Manual Review | PR | REVIEWED | Medium |
| R4 | ESLint jsx-a11y | pre-commit | PREVENTED | High |
| R5 | Custom CI Check | CI | BLOCKED | High |
| R6 | Manual Review | PR | REVIEWED | Medium |
| R7 | axe-core | CI | PREVENTED | High |
| R8 | Stylelint | CI | BLOCKED | High |
| R9 | Stylelint | pre-commit | PREVENTED | High |
| R10 | Stylelint a11y | CI | BLOCKED | High |
| R11 | Manual Review | PR | REVIEWED | Medium |
| R12 | ESLint jsx-a11y | pre-commit | PREVENTED | High |
| R13 | Custom CI Check | CI | BLOCKED | High |
| R14 | Documentation Review | PR | ADVISORY | Low |
```