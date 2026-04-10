# CONTENT_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "components/**"
    - "pages/**"
    - "lib/i18n/**"
    - "locales/**"
    - "src/components/**"
    - "src/pages/**"
  keywords:
    - i18n
    - translation
    - locale
    - hardcoded text
    - user-facing string
    - RTL
  exclusions:
    - "*.test.ts"
    - "*.spec.ts"
    - "*.test.tsx"
    - "*.generated.ts"
    - "migrations/**"
related:
  - agent: architecture
    type: consult
    boundary: "Content owns string externalization and i18n patterns. Architecture owns folder structure and module organization."
  - agent: security
    type: consult
    boundary: "Content owns user-facing message quality. Security owns error message leakage and sensitive data in messages."
  - agent: architecture
    type: delegates
    boundary: "Content delegates module organization decisions to Architecture."
  - agent: security
    type: delegates
    boundary: "Content delegates sensitive data handling in messages to Security."
```

## Purpose

Reviews content strategy implementation including i18n framework adoption, externalized strings, and user-facing message quality. Ensures the application can scale globally with consistent, actionable content from day one.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8) — process discipline

## Applicability

- Adding user-facing text in components or pages
- Implementing error messages or validation feedback
- Formatting dates, numbers, or currencies
- Adding new locales or RTL language support
- Excluded: internal logging, debug output, code comments, API documentation

---

## Rules

### HARD BOUNDARIES

### R1 — No Hardcoded User-Facing Text [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure eslint-plugin-i18next with "no-literal-string" rule in eslintrc.js -->

**Why:** Hardcoded strings make internationalization impossible and create inconsistent microcopy across features.

**Bad → Good:**
```
// Bad
button.text = "Save Changes"
throw new Error("Invalid email address")

// Good
button.text = t('actions.save_changes')
throw new Error(t('validation.invalid_email'))
```

**Enforced by:** ESLint (BLOCKED, coverage: strong)

---

### R2 — i18n Framework Required [BLOCKER] [BLOCKED]

<!-- GUIDE: Install react-i18next or similar, configure in app root, set up translation loading -->

**Why:** Without a proper i18n framework, text management becomes ad-hoc and translation workflows break down.

**Bad → Good:**
```
// Bad
const messages = { en: { hello: "Hello" }, de: { hello: "Hallo" } }
const text = messages[locale].hello

// Good
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
const text = t('greetings.hello')
```

**Enforced by:** Architecture Linting (BLOCKED, coverage: strong)

---

### R3 — Locale-Aware Formatting [BLOCKER] [PREVENTED]

<!-- GUIDE: Use Intl.NumberFormat, Intl.DateTimeFormat, or i18n library formatting functions -->

**Why:** Hardcoded number/date formats break user expectations in different locales and currencies.

**Bad → Good:**
```
// Bad
price = "$" + amount.toFixed(2)
date = day + "/" + month + "/" + year

// Good
price = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
date = new Intl.DateTimeFormat(locale).format(dateObject)
```

**Enforced by:** TypeScript + Linting (PREVENTED, coverage: partial)

---

### STRUCTURAL HEURISTICS

### R4 — RTL Layout Support [CRITICAL] [REVIEWED]

<!-- GUIDE: Use logical CSS properties (margin-inline-start vs margin-left), test with dir="rtl" -->

**Why:** RTL languages require mirrored layouts; hardcoded directional CSS breaks Arabic, Hebrew user experience.

**Bad → Good:**
```
// Bad
.sidebar { margin-left: 20px; float: left; }

// Good
.sidebar { margin-inline-start: 20px; float: inline-start; }
```

**Enforced by:** CSS Linting (REVIEWED, coverage: advisory)

---

### R5 — Actionable Error Messages [CRITICAL] [REVIEWED]

<!-- GUIDE: Error messages must include what went wrong, why, and what the user should do next -->

**Why:** Vague errors frustrate users and increase support burden; actionable messages enable self-service problem resolution.

**Bad → Good:**
```
// Bad
t('errors.invalid_input')
// → "Invalid input"

// Good
t('errors.email_format_invalid', {
  example: 'user@company.com'
})
// → "Email must be in format like user@company.com. Check for typos and try again."
```

**Enforced by:** Code Review (REVIEWED, coverage: partial)

---

### R6 — Translation Key Structure [CRITICAL] [PREVENTED]

<!-- GUIDE: Use hierarchical keys like 'feature.component.action' pattern -->

**Why:** Flat key structures become unmaintainable; nested keys enable bulk operations and context-aware translations.

**Bad → Good:**
```
// Bad
save_button_text: "Save"
save_button_loading: "Saving..."

// Good
buttons.save.default: "Save"
buttons.save.loading: "Saving..."
```

**Enforced by:** Translation Linting (PREVENTED, coverage: partial)

---

### GOVERNANCE

### R7 — Microcopy Consistency [WARNING] [REVIEWED]

<!-- GUIDE: Maintain glossary of standard terms, use consistent voice/tone across similar actions -->

**Why:** Inconsistent terminology confuses users and degrades product polish.

**Bad → Good:**
```
// Bad
"Delete Account" vs "Remove Profile" vs "Deactivate User"

// Good
"Delete Account" consistently for permanent removal
"Deactivate Account" consistently for temporary suspension
```

**Enforced by:** Code Review (REVIEWED, coverage: advisory)

---

### R8 — Content Security [WARNING] [REVIEWED]

<!-- GUIDE: Never expose internal system details, stack traces, or sensitive data in user messages -->

**Why:** Error messages can leak system architecture details or sensitive information to attackers.

**Bad → Good:**
```
// Bad
t('errors.database_connection_failed', {
  host: 'prod-db-01.internal',
  error: sqlException.message
})

// Good
t('errors.service_temporarily_unavailable')
```

**Enforced by:** Security Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R1
Scope:    Internal admin tooling strings
Reason:   Admin-only interface not subject to translation requirements
Approved: @[who]
Expires:  permanent — re-evaluate at 2027-01-01
Control:  Route guarded by requireOrgAdmin(); never user-facing
```

**WARNING — solo/small team:**
```
Override: R7 — microcopy glossary not yet established — @[who] — expires 2026-07-01
```

## Checklist

```
□ All user-facing strings externalized through t() calls?  (R1)
□ i18n framework configured and in use?  (R2)
□ Dates/numbers/currencies use Intl or i18n formatting?  (R3)
□ CSS uses logical properties for RTL compatibility?  (R4)
□ Error messages include what, why, and what to do next?  (R5)
□ Translation keys follow hierarchical feature.component.action structure?  (R6)
□ Consistent terminology across similar UI actions?  (R7)
□ No internal system details exposed in user-facing messages?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint | pre-commit | BLOCKED | strong |
| R2 | Architecture Lint | CI | BLOCKED | strong |
| R3 | TypeScript + Lint | pre-commit | PREVENTED | partial |
| R4 | CSS Linting | CI | REVIEWED | advisory |
| R5 | Code Review | PR | REVIEWED | partial |
| R6 | Translation Lint | CI | PREVENTED | partial |
| R7 | Code Review | PR | REVIEWED | advisory |
| R8 | Security Review | PR | REVIEWED | advisory |
