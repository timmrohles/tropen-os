# LEGAL_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "**/models/**"
    - "**/user/**"
    - "**/consent/**"
    - "**/ai/**"
    - "**/gdpr/**"
  keywords:
    - "personal data"
    - "PII"
    - "consent"
    - "GDPR"
    - "DSGVO"
    - "AI Act"
    - "third-party integration"
    - "data deletion"
    - "user rights"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "**/migrations/**"
related:
  - agent: security
    type: overlaps
    boundary: "Security owns encryption and access control implementation. Legal owns what data needs protection and the compliance obligations that drive those requirements."
  - agent: observability
    type: overlaps
    boundary: "Observability owns logging configuration and PII scrubbing implementation. Legal identifies what cannot be logged and defines the regulatory basis for scrubbing rules."
  - agent: security
    type: delegates
    boundary: "Legal defers to Security for authentication and encryption implementation details."
  - agent: observability
    type: delegates
    boundary: "Legal defers to Observability for logging configuration specifics and PII scrubbing mechanics."
```

## Purpose

Ensures compliance with GDPR/DSGVO, EU AI Act, and data protection standards by reviewing code for proper PII handling, consent management, and legal basis documentation. Prevents regulatory fines (up to 4% annual revenue), legal liabilities, and erosion of user trust from non-compliant data practices.

This agent contains 3 types of rules:
- **Hard boundaries** (R1–R3) — mechanically enforceable
- **Structural heuristics** (R4–R6) — judgment-based
- **Governance** (R7–R8) — process discipline

## Applicability

- Processing, storing, or transmitting personal data (PII)
- Implementing consent mechanisms or user rights endpoints
- Integrating AI/ML systems or third-party services
- Creating data retention or deletion workflows
- Excluded: Internal tools without user data, fully anonymized datasets, infrastructure scripts

---

## Rules

### HARD BOUNDARIES

### R1 — PII Classification Required [BLOCKER] [BLOCKED]

<!-- GUIDE: Use @PII decorator or PII<T> type wrapper for all personal data fields in data models -->

**Why:** Untagged personal data cannot be properly protected, deleted, or audited. Leads to data breaches and inability to fulfill user rights requests under GDPR.

**Bad → Good:**
```
// Bad
interface User {
  email: string
  name: string
  birthDate: Date
}

// Good
interface User {
  email: PII<string>
  name: PII<string>
  birthDate: PII<Date>
}
```

**Enforced by:** PII Type Checker (BLOCKED, coverage: strong)

---

### R2 — No PII in Log Statements [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure static analysis to flag any PII-annotated variables in logging calls -->

**Why:** Logging PII creates data leaks in less-secure storage systems, violating GDPR and exposing sensitive data to unauthorized access.

**Bad → Good:**
```
// Bad
logger.info("User login failed for: " + user.email)

// Good
logger.info("User login failed for user_id: " + user.id)
```

**Enforced by:** PII Log Scanner (BLOCKED, coverage: strong)

---

### R3 — AI Transparency Disclosure [BLOCKER] [BLOCKED]

<!-- GUIDE: All UI components rendering AI-generated content must include AICopyrightDisclaimer component -->

**Why:** EU AI Act mandates transparency when users interact with AI systems. Hidden AI usage violates transparency obligations and enables deception.

**Bad → Good:**
```
// Bad
function AIResponse({ content }) {
  return <div>{content}</div>
}

// Good
function AIResponse({ content }) {
  return (
    <div>
      {content}
      <AICopyrightDisclaimer type="text" model="gpt-4" />
    </div>
  )
}
```

**Enforced by:** AI Disclosure Linter (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Consent Must Be Opt-In [CRITICAL] [PREVENTED]

<!-- GUIDE: Consent UI components cannot have pre-checked boxes or default-enabled toggles -->

**Why:** GDPR requires freely given, explicit consent. Pre-checked boxes are dark patterns that invalidate consent, making data processing illegal.

**Bad → Good:**
```
// Bad
<ConsentCheckbox 
  label="Subscribe to marketing" 
  defaultChecked={true}
/>

// Good
<ConsentCheckbox 
  label="Subscribe to marketing" 
  defaultChecked={false}
  requireExplicitAction={true}
/>
```

**Enforced by:** Consent UI Validator (PREVENTED, coverage: partial)

---

### R5 — Data Deletion Must Be Irreversible [CRITICAL] [PREVENTED]

<!-- GUIDE: User deletion functions must call AnonymizationService.scrubPII() not soft delete -->

**Why:** GDPR "right to be forgotten" requires permanent removal of personal data. Soft deletes violate this requirement and risk data resurrection.

**Bad → Good:**
```
// Bad
function deleteUser(userId) {
  user.isDeleted = true
  database.save(user)
}

// Good
function deleteUser(userId) {
  AnonymizationService.scrubPII(user)
  database.save(user) // PII fields now overwritten
}
```

**Enforced by:** Deletion Pattern Checker (PREVENTED, coverage: partial)

---

### R6 — Third-Party DPA Required [CRITICAL] [PREVENTED]

<!-- GUIDE: Maintain dpa_register.yml with Data Processing Agreements for all third-party PII processors -->

**Why:** GDPR requires Data Processing Agreements with all processors handling personal data. Missing DPAs create joint liability for violations.

**Bad → Good:**
```
// Bad
integrateService(apiKey)

// Good
integrateService(apiKey, dpaStatus: "signed-2024-01-15")
// with dpa_register.yml entry documenting agreement
```

**Enforced by:** DPA Registry Validator (PREVENTED, coverage: partial)

---

### GOVERNANCE

### R7 — Document Legal Basis [WARNING] [REVIEWED]

<!-- GUIDE: Functions processing PII must include @legal-basis docblock with GDPR Art. 6 justification -->

**Why:** GDPR requires valid legal basis for all PII processing. Documentation ensures compliance and provides audit trail for regulatory reviews.

**Bad → Good:**
```
// Bad
function sendMarketingEmail(user) {
  emailService.send(user.email)
}

// Good
/**
 * @legal-basis Consent reason="User opted into newsletter via settings"
 */
function sendMarketingEmail(user) {
  emailService.send(user.email)
}
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

### R8 — User Rights Implementation [WARNING] [REVIEWED]

<!-- GUIDE: Implement GDPR rights endpoints: /user/export, /user/delete, /user/rectify -->

**Why:** GDPR grants users rights to access, rectify, erase, and port their data. Missing implementation prevents compliance with user requests.

**Bad → Good:**
```
// Bad
// No user rights endpoints

// Good
app.post('/user/export', handleDataExport)
app.delete('/user/delete', handleAccountDeletion)
app.patch('/user/rectify', handleDataCorrection)
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER:**
```
Override: R1
Scope:    anonymized datasets only — no re-identification possible
Reason:   anonymized data is not PII under GDPR Art. 4; PII<T> wrapper not required
Approved: @[DPO-name]
Expires:  permanent — re-evaluate at 2027-01-01
Control:  anonymization must be irreversible; verified by DPO before each use
```

**WARNING — solo/small team:**
```
Override: R8 — user rights endpoints not yet implemented — @timm — expires 2026-06-01
```

## Checklist

```
□ All personal data fields typed with PII<T> wrapper?  (R1)
□ No PII variables appear in log statements?  (R2)
□ All AI-generated content has transparency disclosure component?  (R3)
□ All consent UI defaults to unchecked/disabled?  (R4)
□ User deletion calls AnonymizationService (not soft delete)?  (R5)
□ All third-party PII processors have signed DPA in dpa_register.yml?  (R6)
□ All PII-processing functions have @legal-basis docblock?  (R7)
□ GDPR rights endpoints exist (/export, /delete, /rectify)?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | PII Type Checker | pre-commit | BLOCKED | strong |
| R2 | PII Log Scanner | CI | BLOCKED | strong |
| R3 | AI Disclosure Linter | CI | BLOCKED | strong |
| R4 | Consent UI Validator | CI | PREVENTED | partial |
| R5 | Deletion Pattern Checker | CI | PREVENTED | partial |
| R6 | DPA Registry Validator | CI | PREVENTED | partial |
| R7 | Manual Review | PR | REVIEWED | advisory |
| R8 | Manual Review | PR | REVIEWED | advisory |
