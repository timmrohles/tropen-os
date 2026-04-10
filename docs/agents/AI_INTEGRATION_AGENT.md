# AI_INTEGRATION_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "src/ai/**"
    - "src/llm/**"
    - "src/agents/**"
    - "prompts/**"
    - "src/lib/llm/**"
  keywords:
    - ai integration
    - llm
    - prompt
    - anthropic
    - openai
    - system prompt
    - token
    - ai provider
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "migrations/**"
    - "**/__fixtures__/**"
related:
  - agent: security
    type: consult
    boundary: "Security Agent owns prompt injection defenses and authentication with AI providers. AI Integration Agent owns provider abstraction and output validation patterns."
  - agent: architecture
    type: consult
    boundary: "Architecture Agent owns dependency injection patterns. AI Integration Agent owns provider abstraction interfaces and AI-specific resilience patterns."
  - agent: observability
    type: consult
    boundary: "Observability Agent owns AI operation logging, metrics, and cost tracking. AI Integration Agent owns the integration patterns that produce those signals."
```

## Purpose

This agent ensures AI integrations are secure, reliable, and maintainable by preventing prompt injection vulnerabilities, enforcing output validation, and requiring provider-agnostic abstractions. Without these rules, AI features become security holes, create vendor lock-in nightmares, and risk runaway costs from uncontrolled token usage.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7) — process discipline

## Applicability

- Applies when integrating with LLM providers (OpenAI, Anthropic, local models), building AI-powered features or agents, processing user input through AI systems, or implementing structured AI outputs
- Excluded: Pure ML/data science code without LLM integration, AI research prototypes

---

## Rules

### HARD BOUNDARIES

### R1 — No Direct User Input in System Prompts [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure ESLint rule to detect string interpolation of user variables into system prompts. User input must be passed via separate message role. In TropenOS: all LLM calls go through src/lib/llm/anthropic.ts — never interpolate user content into the system field. -->

**Why:** Direct template interpolation of user input into system prompts enables prompt injection attacks that can compromise the entire AI system and override safety instructions.

**Bad → Good:**
```
// ❌ systemPrompt = `You are a helpful assistant. User query: ${userInput}`

// ✅ messages = [
//      { role: "system", content: "You are a helpful assistant." },
//      { role: "user", content: sanitizedUserInput }
//    ]
```

**Enforced by:** ESLint Custom Rule (BLOCKED, coverage: strong)

---

### R2 — AI Output Validation Required [BLOCKER] [BLOCKED]

<!-- GUIDE: Use Zod schemas for AI output validation. Configure pre-commit hook to verify all AI responses are validated before use. -->

**Why:** AI outputs are unreliable and can contain malicious content, invalid data, or unexpected formats that break downstream systems or introduce security vulnerabilities.

**Bad → Good:**
```
// ❌ const result = await aiProvider.generate(prompt)
// ❌ await database.save(result.content)

// ✅ const result = await aiProvider.generate(prompt)
// ✅ const validated = OutputSchema.parse(result.content)
// ✅ await database.save(validated)
```

**Enforced by:** TypeScript with Zod (BLOCKED, coverage: strong)

---

### R3 — Provider Abstraction Required [BLOCKER] [BLOCKED]

<!-- GUIDE: Create IAIProvider interface in src/ai/types. Direct imports of provider SDKs (e.g., 'openai', '@anthropic-ai/sdk') forbidden outside src/ai/providers/. In TropenOS: use src/lib/llm/anthropic.ts — never import @anthropic-ai/sdk directly in routes or components. -->

**Why:** Direct provider coupling creates vendor lock-in, makes testing difficult, prevents fallback implementation, and makes provider switching extremely expensive.

**Bad → Good:**
```
// ❌ import { OpenAI } from 'openai'
// ❌ const response = await openai.chat.completions.create({...})

// ✅ interface IAIProvider {
//      generate(prompt: string, options: GenerateOptions): Promise<AIResponse>
//    }
// ✅ const response = await aiProvider.generate(prompt, options)
```

**Enforced by:** ESLint import/no-restricted-paths (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Token Limits Must Be Configured [CRITICAL] [PREVENTED]

<!-- GUIDE: Set maxTokens and maxContextTokens in all AI client configurations. Use environment variables for limits (e.g., MAX_OUTPUT_TOKENS=1000). In TropenOS: AI SDK v6 uses maxOutputTokens (not maxTokens). -->

**Why:** Unconfigured token limits lead to unexpectedly expensive API calls, potential service disruption from exceeding context windows, and unpredictable response truncation.

**Bad → Good:**
```
// ❌ aiClient.generate(prompt)

// ✅ aiClient.generate(prompt, {
//      maxOutputTokens: MAX_OUTPUT_TOKENS,
//      maxContextTokens: MAX_CONTEXT_TOKENS
//    })
```

**Enforced by:** TypeScript Type Checking (PREVENTED, coverage: strong)

---

### R5 — Fallback Strategy Required [CRITICAL] [PREVENTED]

<!-- GUIDE: Implement circuit breaker pattern in AI service layer. Configure at least one fallback provider or cached response strategy. -->

**Why:** AI services are unreliable; without fallbacks, AI features become single points of failure that degrade user experience during outages or rate limiting.

**Bad → Good:**
```
// ❌ return await primaryProvider.generate(prompt)

// ✅ try {
//      return await primaryProvider.generate(prompt)
//    } catch (error) {
//      if (isRetryable(error)) {
//        return await fallbackProvider.generate(prompt)
//      }
//      throw error
//    }
```

**Enforced by:** Code Pattern Scanner (PREVENTED, coverage: partial)

---

### R6 — Deterministic Mode for Structured Outputs [CRITICAL] [PREVENTED]

<!-- GUIDE: Set temperature: 0 for any AI call expecting JSON, XML, or other structured output. Use seed parameter when available for reproducibility. -->

**Why:** Non-deterministic outputs make structured AI responses unreliable and difficult to validate, causing parsing failures and inconsistent behavior in production.

**Bad → Good:**
```
// ❌ aiProvider.generate(structuredPrompt, { temperature: 0.7 })

// ✅ aiProvider.generate(structuredPrompt, {
//      temperature: 0,
//      seed: DETERMINISTIC_SEED
//    })
```

**Enforced by:** ESLint Custom Rule (PREVENTED, coverage: partial)

---

### GOVERNANCE

### R7 — Response Caching Strategy [WARNING] [REVIEWED]

<!-- GUIDE: Implement Redis cache for expensive AI operations. Document cache keys and TTL strategy. Cache similar prompts with normalized keys. -->

**Why:** AI API calls are expensive and slow; without caching, identical requests waste money and degrade user experience through unnecessary latency.

**Bad → Good:**
```
// ❌ const response = await aiProvider.generate(expensivePrompt)

// ✅ const cacheKey = hashPrompt(expensivePrompt)
// ✅ const cached = await cache.get(cacheKey)
// ✅ if (cached) return cached
// ✅ const response = await aiProvider.generate(expensivePrompt)
// ✅ await cache.set(cacheKey, response, CACHE_TTL)
```

**Enforced by:** Code Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R[NUMBER]
Scope:    [which files/endpoints/area]
Reason:   [why this rule doesn't apply here]
Approved: @[who]
Expires:  [date or "permanent — re-evaluate at [date]"]
Control:  [what mitigates the security/reliability risk instead]
```

**WARNING — solo/small team:**
```
Override: R[NUMBER] — [reason] — @[who] — expires [date]
```

## Checklist

```
□ No user input interpolated directly into system prompt strings?  (R1)
□ All AI outputs validated with Zod schema before use?  (R2)
□ Provider SDK imports restricted to abstraction layer only?  (R3)
□ Token limits (maxOutputTokens/maxContextTokens) configured on every AI call?  (R4)
□ Fallback provider or cached strategy in place for AI calls?  (R5)
□ Structured output calls use temperature: 0?  (R6)
□ Expensive/repeated AI calls have caching strategy documented?  (R7)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | ESLint Custom Rule | pre-commit | BLOCKED | strong |
| R2 | TypeScript with Zod | pre-commit | BLOCKED | strong |
| R3 | ESLint import/no-restricted-paths | CI | BLOCKED | strong |
| R4 | TypeScript Type Checking | CI | PREVENTED | strong |
| R5 | Code Pattern Scanner | CI | PREVENTED | partial |
| R6 | ESLint Custom Rule | CI | PREVENTED | partial |
| R7 | Code Review | PR | REVIEWED | advisory |
