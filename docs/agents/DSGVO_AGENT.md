```markdown
---
version: 1.0
type: regulatory
triggers:
  - "Every PR in a project processing EU user data"
exclusions:
  - "Internal tools with no external users"
  - "Purely static sites without user interaction"
related_agents:
  consult: []
  overlap: []
  defer_to: []
---

## Purpose
This agent enforces GDPR compliance for applications handling EU personal data. GDPR violations can result in fines up to 4% of worldwide annual revenue or €20 million. This agent catches technical compliance gaps detectable through static analysis and configuration checks.

## Applicability
This agent applies when:
- Project processes personal data of EU residents
- Web application with user accounts, forms, or tracking
- E-commerce, SaaS, or marketing sites targeting EU

Excluded: Internal tools, static documentation sites, pure APIs without direct user interaction

## Rules

### KATEGORIE 1: Pflichtseiten & Datenschutzerklärung

### R1 — Privacy Policy Page Required
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** DSGVO Art. 13, 14

<!-- GUIDE: Every EU-facing application must have an accessible privacy policy -->

**Why:** Missing privacy policy violates transparency obligations and can result in immediate enforcement action.

**Checker:**
```
// Check for privacy policy routes/pages
find src/app pages -type d \( -name "datenschutz" -o -name "privacy" \) -print -quit | grep -q .
```

**Enforced by:** CI Script (BLOCKED) — Coverage: High

### R2 — Privacy Policy Content Completeness
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** DSGVO Art. 13(1), 14(1)

<!-- GUIDE: Privacy policy must contain all mandatory information elements -->

**Why:** Incomplete privacy notices violate information requirements and weaken legal basis for processing.

**Checker:**
```
// Check for mandatory keywords in privacy policy
grep -qE "Verantwortliche|controller|Rechtsgrundlage|legal basis|Speicherdauer|retention|Betroffenenrechte|data subject rights" $(find src/app pages -path '*/datenschutz/*' -o -path '*/privacy/*')
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Medium

### R3 — Imprint Page Required
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** TMG §5, DSGVO Art. 13(1)(a)

<!-- GUIDE: German/EU sites require imprint with responsible party identification -->

**Why:** Missing imprint violates disclosure requirements and makes GDPR controller identification impossible.

**Checker:**
```
// Check for imprint/impressum routes
find src/app pages -type d \( -name "impressum" -o -name "imprint" \) -print -quit | grep -q .
```

**Enforced by:** CI Script (BLOCKED) — Coverage: High

### KATEGORIE 2: Consent & Tracking

### R4 — Cookie Consent Library Present
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** ePrivacy Directive Art. 5(3), DSGVO Art. 7

<!-- GUIDE: Non-essential cookies require explicit consent through proper consent management -->

**Why:** Missing consent mechanism for tracking cookies violates EU consent requirements.

**Checker:**
```
// Check for common CMP libraries in dependencies
grep -E "cookiebot|cookieconsent|tarteaucitron|usercentrics|onetrust|klaro|@cookiehub/cookie-consent-banner" package.json pnpm-lock.yaml yarn.lock package-lock.json
```

**Enforced by:** CI dependency check (BLOCKED) — Coverage: High

### R5 — No Tracking Before Consent
**Severity:** BLOCKER
**Enforcement:** PREVENTED
**Art. / Standard:** ePrivacy Directive Art. 5(3), DSGVO Art. 7(1)

<!-- GUIDE: Analytics and advertising scripts must not load before user consent -->

**Why:** Pre-consent tracking violates consent requirements and can trigger immediate regulatory action.

**Checker:**
```
// Flag unconditional loading of tracking scripts
grep -E "gtag|gtm|facebook|fbevents|hotjar|mixpanel|amplitude" src/app/layout.tsx pages/_app.tsx pages/_document.tsx app/layout.tsx --exclude-dir=components
```

**Enforced by:** ESLint rule (PREVENTED) — Coverage: High

### R6 — Privacy-First Analytics Configuration
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** DSGVO Art. 25 (Data Protection by Design)

<!-- GUIDE: Analytics tools should be configured for privacy compliance (IP anonymization, EU servers) -->

**Why:** Non-compliant analytics configuration can constitute unauthorized data transfer to third countries.

**Checker:**
```
// Check for IP anonymization or privacy-first analytics
grep -rE "anonymizeIp: true|plausible\.io|usefathom\.com|matomo\.cloud|vercel.*(analytics|insights)|umami" src/ next.config.* vercel.json
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Medium

### KATEGORIE 3: Datenverarbeitung & PII-Schutz

### R7 — No PII in Logging
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** DSGVO Art. 25, 32

<!-- GUIDE: Personal data must not appear in application logs -->

**Why:** PII in logs creates unauthorized processing and potential data breach exposure.

**Checker:**
```
// Disallow logging of common PII keywords
grep -rE "(console|logger)\.(log|info|warn|error)\(.*(email|password|phone|address|ssn|jwt|token).*\)" src/
```

**Enforced by:** ESLint rule (PREVENTED) — Coverage: High

### R8 — No PII in Error Responses
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** DSGVO Art. 25, 32

<!-- GUIDE: Error messages and stack traces must not expose personal data -->

**Why:** PII in error responses can leak sensitive data to unauthorized parties.

**Checker:**
```
// Flag potential PII leaks in API error handling
grep -rE "error.*(email|user|password)|stack.*trace" src/pages/api/ src/app/api/
```

**Enforced by:** ESLint rule (PREVENTED) — Coverage: High

### R9 — No PII in URL Parameters
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** DSGVO Art. 25, 32

<!-- GUIDE: Personal data must not be transmitted via URL query parameters -->

**Why:** PII in URLs appears in server logs, referrer headers, and browser history.

**Checker:**
```
// Search for PII keywords in URL parameters
grep -rE "(searchParams|query|params)\.get\(.*(email|password|token).*\)" src/
```

**Enforced by:** ESLint rule (PREVENTED) — Coverage: High

### R10 — Password Hashing Implementation
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** DSGVO Art. 32(1)(a)

<!-- GUIDE: Passwords must be cryptographically hashed, never stored in plaintext -->

**Why:** Plaintext password storage violates security of processing requirements.

**Checker:**
```
// Ensure strong password hashing library is present
grep -E "bcrypt|argon2|scrypt|pbkdf2|@node-rs/bcrypt" package.json
```

**Enforced by:** CI security scan (BLOCKED) — Coverage: High

### R11 — HTTPS and Security Headers
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** DSGVO Art. 32(1)(a)

<!-- GUIDE: All traffic must be encrypted and security headers configured -->

**Why:** Missing encryption violates technical security measures requirement.

**Checker:**
```
// Verify HSTS header configuration
grep -E "Strict-Transport-Security" next.config.ts next.config.js vercel.json netlify.toml middleware.ts
```

**Enforced by:** CI config validation (BLOCKED) — Coverage: High

### KATEGORIE 4: Betroffenenrechte

### R12 — Data Export Endpoint
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** DSGVO Art. 15, 20 (Right of Access & Portability)

<!-- GUIDE: Users must be able to export their personal data -->

**Why:** Missing data export functionality violates data portability rights.

**Checker:**
```
// Look for API endpoints related to data export
grep -rE "/api/.*export|/api/.*download.*data|/api/user.*data" src/app/api/ pages/api/ app/api/
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Medium

### R13 — Account Deletion Implementation
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** DSGVO Art. 17 (Right to Erasure)

<!-- GUIDE: Users must be able to delete their accounts and associated data -->

**Why:** Missing deletion capability violates right to erasure requirements.

**Checker:**
```
// Look for UI components and API endpoints for account deletion
grep -rE "delete.*account|account.*delete|/api/.*delete.*user" src/ pages/ app/
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Medium

### R14 — Soft Delete or Anonymization
**Severity:** WARNING
**Enforcement:** REVIEWED
**Art. / Standard:** DSGVO Art. 17, 25

<!-- GUIDE: Deleted data should be soft-deleted or anonymized rather than hard-deleted for legal compliance -->

**Why:** Immediate hard deletion can violate legal retention requirements and audit trails.

**Checker:**
```
// Check for soft-delete columns or anonymization logic
grep -rE "deleted_at|deletedAt|isDeleted|anonymize|AnonymizationService|scrubPII" src/lib/ prisma/ drizzle/ src/db/
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Low

### KATEGORIE 5: Technische Maßnahmen

### R15 — Rate Limiting on Authentication
**Severity:** CRITICAL
**Enforcement:** BLOCKED
**Art. / Standard:** DSGVO Art. 32(1)(b)

<!-- GUIDE: Authentication endpoints must be protected against brute force attacks -->

**Why:** Missing rate limiting enables unauthorized access attempts violating integrity measures.

**Checker:**
```
// Check for rate limiting libraries and usage near auth routes
grep -E "@upstash/ratelimit|express-rate-limit|rate-limiter|next-api-middleware" package.json src/app/api/auth/ pages/api/auth/
```

**Enforced by:** CI security check (BLOCKED) — Coverage: High

### R16 — CSRF Protection
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** DSGVO Art. 32(1)(b)

<!-- GUIDE: State-changing operations must be protected against CSRF attacks -->

**Why:** CSRF vulnerabilities can lead to unauthorized data processing.

**Checker:**
```
// Check for CSRF protection mechanisms
grep -rE "csrf|csurf|sameSite: '(strict|lax)'|server.*action" src/ next.config.ts middleware.ts
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Medium

### R17 — Content Security Policy
**Severity:** CRITICAL
**Enforcement:** BLOCKED
**Art. / Standard:** DSGVO Art. 32(1)(a)

<!-- GUIDE: CSP headers must be configured to prevent XSS and unauthorized script execution -->

**Why:** Missing CSP allows malicious script injection potentially compromising user data.

**Checker:**
```
// Verify CSP header configuration
grep -E "Content-Security-Policy|contentSecurityPolicy" next.config.ts next.config.js vercel.json netlify.toml middleware.ts
```

**Enforced by:** CI config validation (BLOCKED) — Coverage: High

### R18 — Cookie Policy Documentation
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** ePrivacy Directive Art. 5(3), DSGVO Art. 13

<!-- GUIDE: Cookie usage must be documented in privacy policy or separate cookie policy -->

**Why:** Undocumented cookie usage violates consent and transparency requirements.

**Checker:**
```
// Check for cookie documentation in privacy policy
grep -qi "cookie" $(find src/app pages -path '*/datenschutz/*' -o -path '*/privacy/*' -o -path '*/cookies/*')
```

**Enforced by:** Manual PR Review (REVIEWED) — Coverage: Medium

## Exceptions
Exceptions require:
1. Legal review documentation in PR description
2. Risk assessment by DPO (Data Protection Officer)
3. Compensating controls implementation
4. Exception approval in `gdpr-exceptions.md` with expiry date

## Checklist

```
□ R1 — Privacy Policy Page Required
□ R2 — Privacy Policy Content Completeness
□ R3 — Imprint Page Required
□ R4 — Cookie Consent Library Present
□ R5 — No Tracking Before Consent
□ R6 — Privacy-First Analytics Configuration
□ R7 — No PII in Logging
□ R8 — No PII in Error Responses
□ R9 — No PII in URL Parameters
□ R10 — Password Hashing Implementation
□ R11 — HTTPS and Security Headers
□ R12 — Data Export Endpoint
□ R13 — Account Deletion Implementation
□ R14 — Soft Delete or Anonymization
□ R15 — Rate Limiting on Authentication
□ R16 — CSRF Protection
□ R17 — Content Security Policy
□ R18 — Cookie Policy Documentation
```

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | CI Script | CI | BLOCKED | High |
| R2 | Manual Review | PR | REVIEWED | Medium |
| R3 | CI Script | CI | BLOCKED | High |
| R4 | CI dependency check | CI | BLOCKED | High |
| R5 | ESLint | pre-commit | PREVENTED | High |
| R6 | Manual Review | PR | REVIEWED | Medium |
| R7 | ESLint | pre-commit | PREVENTED | High |
| R8 | ESLint | pre-commit | PREVENTED | High |
| R9 | ESLint | pre-commit | PREVENTED | High |
| R10 | CI security scan | CI | BLOCKED | High |
| R11 | CI config validation | CI | BLOCKED | High |
| R12 | Manual Review | PR | REVIEWED | Medium |
| R13 | Manual Review | PR | REVIEWED | Medium |
| R14 | Manual Review | PR | REVIEWED | Low |
| R15 | CI security check | CI | BLOCKED | High |
| R16 | Manual Review | PR | REVIEWED | Medium |
| R17 | CI config validation | CI | BLOCKED | High |
| R18 | Manual Review | PR | REVIEWED | Medium |
```