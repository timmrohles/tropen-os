```markdown
---
version: 1.0
type: regulatory
triggers:
  - "Every PR in a project processing EU user data with AI dependencies"
exclusions:
  - "Internal tools with no external users"
  - "Purely static sites without user interaction"
  - "Projects without AI dependencies"
related_agents:
  consult: ["AI_INTEGRATION_AGENT"]
  overlap: []
  defer_to: ["LEGAL_AGENT"]
---

## Purpose
Enforces EU AI Act compliance (Regulation EU 2024/1689) for applications using AI systems. Non-compliance with high-risk AI obligations can result in fines up to €35 million or 7% of annual turnover. This agent catches regulatory violations in transparency, documentation, logging, and prohibited practices before AI systems go live.

## Applicability
This agent applies when:
- Projects contain AI dependencies: @anthropic-ai/sdk, openai, @google/generative-ai, @mistralai/mistral, ai, @ai-sdk/* in package.json
- Application processes EU user interactions through AI systems
Excluded: Pure data processing without AI model calls, internal tooling without user interaction

## Rules

### APPLICABILITY & CLASSIFICATION

### R1 — AI System Detection
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** AI Act Art. 3 (Definition "AI System")

<!-- GUIDE: Verify AI dependencies exist before applying other rules -->

**Why:** AI Act only applies to systems using machine learning models or logic-based systems for inference.

**Checker:**
```
grep -E "@anthropic-ai/sdk|openai|@google/generative-ai|@mistralai|@ai-sdk|^ai$" package.json
```

**Enforced by:** Pre-commit Hook (BLOCKED) — Coverage: High

### R2 — Risk Classification Documentation
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** AI Act Art. 6 (Risk Categories)

<!-- GUIDE: Create docs/ai-act-risk-classification.md stating: minimal-risk, limited-risk, high-risk, or unacceptable -->

**Why:** Risk classification determines applicable obligations; undocumented classification makes compliance impossible.

**Checker:**
```
grep -iE "ai-act-risk|risk-class|risikoklasse|minimal.risk|high.risk" docs/ README.md CLAUDE.md
```

**Enforced by:** Documentation Validator (BLOCKED) — Coverage: High

### TRANSPARENCY OBLIGATIONS

### R3 — AI Interaction Disclosure
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** AI Act Art. 50 Abs. 1

<!-- GUIDE: Users must be informed they're interacting with an AI system, not a human -->

**Why:** Failure to disclose AI interaction is a direct Art. 50 violation with immediate enforcement.

**Checker:**
```
grep -rE "KI|AI|artificial|assistant|bot|generiert|generated|powered by AI" src/components/ --include="*.tsx" --include="*.jsx"
```

**Enforced by:** Component Linter (BLOCKED) — Coverage: High

### R4 — AI-Generated Content Marking
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** AI Act Art. 50 Abs. 2

<!-- GUIDE: Mark AI-generated text, images, or other content as machine-generated using classes or aria-labels -->

**Why:** Users have right to know when content is AI-generated, especially for decision-making.

**Checker:**
```
grep -rE "ai-generated|ki-generiert|generated-by-ai|data-ai-content|machine-generated" src/ --include="*.tsx" --include="*.jsx"
```

**Enforced by:** ESLint Rule (PREVENTED) — Coverage: High

### R5 — Model Information Display
**Severity:** WARNING
**Enforcement:** REVIEWED
**Art. / Standard:** AI Act Art. 50 (Information Requirements)

<!-- GUIDE: Show which AI model is being used (GPT-4, Claude, etc.) in UI settings or chat footer -->

**Why:** Transparency about AI system capabilities supports informed user decisions.

**Checker:**
```
grep -rE "model.*name|modelName:|claude|gpt-4|gemini|llama" src/components/ --include="*.tsx"
```

**Enforced by:** Manual Review (REVIEWED) — Coverage: Low

### LOGGING & OVERSIGHT

### R6 — AI Decision Logging
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** AI Act Art. 12 (Record-keeping)

<!-- GUIDE: Log all AI model calls with timestamp, user context, input/output in DB schema -->

**Why:** Required audit trail for AI decisions, mandatory for high-risk applications.

**Checker:**
```
grep -rE "log.*model|log.*tokens|conversation.*log|ai_runs|ai_audit" src/ db/migrations/ prisma/schema.prisma
```

**Enforced by:** Schema Validator (BLOCKED) — Coverage: High

### R7 — Human Oversight Mechanism
**Severity:** CRITICAL
**Enforcement:** PREVENTED
**Art. / Standard:** AI Act Art. 14 (Human Oversight)

<!-- GUIDE: Implement feedback buttons (thumbs up/down), correction features, or human review triggers -->

**Why:** Users must be able to challenge or provide feedback on AI decisions.

**Checker:**
```
grep -rE "feedback|thumbs|correction|korrektur|human.review|override|report" src/components/ src/api/
```

**Enforced by:** Component Validator (PREVENTED) — Coverage: Medium

### R8 — Cost/Usage Transparency
**Severity:** WARNING
**Enforcement:** ADVISORY
**Art. / Standard:** AI Act Art. 13 (Transparency to Deployers)

<!-- GUIDE: Show token usage, costs, or rate limits to users in dashboard or settings -->

**Why:** Users should understand resource consumption of AI interactions.

**Checker:**
```
grep -rE "budget|cost.*display|token.*count|usage.*meter|credit_balance" src/components/
```

**Enforced by:** Manual Review (ADVISORY) — Coverage: Low

### GENERAL OBLIGATIONS

### R9 — AI Purpose Documentation
**Severity:** CRITICAL
**Enforcement:** BLOCKED
**Art. / Standard:** AI Act Art. 13 Abs. 1 (Technical Documentation)

<!-- GUIDE: Create docs/ai-intended-use.md describing specific purpose, limitations, and deployment context -->

**Why:** Technical documentation must specify intended purpose for risk classification and conformity assessment.

**Checker:**
```
grep -iE "intended.use|ai.purpose|einsatzzweck|bestimmungsgemäße|deployment.context" docs/ README.md
```

**Enforced by:** Documentation Gate (BLOCKED) — Coverage: Medium

### R10 — Prohibited AI Practices Check
**Severity:** BLOCKER
**Enforcement:** BLOCKED
**Art. / Standard:** AI Act Art. 5 (Prohibited Practices)

<!-- GUIDE: No subliminal manipulation, social scoring, biometric mass surveillance, or emotion recognition in workplace -->

**Why:** Prohibited AI practices carry maximum penalties and immediate enforcement action.

**Checker:**
```
grep -iE "subliminal|manipulation|social.scor|biometric.*surveillance|emotional.*exploit|emotion.*recognition.*workplace" src/ prompts/
```

**Enforced by:** Code Scanner (BLOCKED) — Coverage: High

### R11 — Data Quality Requirements
**Severity:** CRITICAL
**Enforcement:** REVIEWED
**Art. / Standard:** AI Act Art. 10 (Data Governance)

<!-- GUIDE: Validate AI training/input data quality and document bias mitigation measures -->

**Why:** Poor data quality in AI systems can lead to discriminatory outcomes and compliance violations.

**Checker:**
```
grep -rE "data.*quality|bias.*check|dataset.*validation|training.*data|fairness" src/ config/ docs/
```

**Enforced by:** Code Review (REVIEWED) — Coverage: Medium

### R12 — AI System Testing Documentation
**Severity:** WARNING
**Enforcement:** REVIEWED
**Art. / Standard:** AI Act Art. 9 (Risk Management)

<!-- GUIDE: Document AI model testing, validation metrics, and performance benchmarks in docs/ai-testing.md -->

**Why:** Systematic testing required for risk mitigation and regulatory compliance.

**Checker:**
```
grep -rE "ai.*test|model.*validation|performance.*metric|accuracy.*test|benchmark" tests/ docs/
```

**Enforced by:** Test Coverage Check (REVIEWED) — Coverage: Low

## Exceptions
- Internal development tools without external users may defer compliance until production deployment
- Academic research applications have modified requirements under Art. 2(5)
- Override approval requires legal team sign-off and must document Art. 83 legal basis

## Checklist

```
□ R1 — AI System Detection
□ R2 — Risk Classification Documentation
□ R3 — AI Interaction Disclosure
□ R4 — AI-Generated Content Marking
□ R5 — Model Information Display
□ R6 — AI Decision Logging
□ R7 — Human Oversight Mechanism
□ R8 — Cost/Usage Transparency
□ R9 — AI Purpose Documentation
□ R10 — Prohibited AI Practices Check
□ R11 — Data Quality Requirements
□ R12 — AI System Testing Documentation
```

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Pre-commit Hook | pre-commit | BLOCKED | High |
| R2 | Documentation Validator | CI | BLOCKED | High |
| R3 | Component Linter | pre-commit | BLOCKED | High |
| R4 | ESLint Rule | CI | PREVENTED | High |
| R5 | Manual Review | PR | REVIEWED | Low |
| R6 | Schema Validator | CI | BLOCKED | High |
| R7 | Component Validator | CI | PREVENTED | Medium |
| R8 | Manual Review | PR | ADVISORY | Low |
| R9 | Documentation Gate | CI | BLOCKED | Medium |
| R10 | Code Scanner | pre-commit | BLOCKED | High |
| R11 | Code Review | PR | REVIEWED | Medium |
| R12 | Test Coverage Check | PR | REVIEWED | Low |
```