# AGENT_QUALITY_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "docs/agents/**/*.md"
  keywords:
    - agent document
    - rule document
    - agent review
    - quality review
  exclusions:
    - "docs/agents/_reviews/**"
related:
  - agent: architecture
    type: delegates
    boundary: "Architecture Agent owns code structure rules. Quality Agent reviews the agent document itself, not the code it governs."
  - agent: security
    type: delegates
    boundary: "Security Agent owns security rules. Quality Agent reviews whether security rules are well-documented in agent documents."
  - agent: observability
    type: delegates
    boundary: "Observability Agent owns logging rules. Quality Agent reviews whether those rules are clearly enforced in agent documents."
```

## Purpose

Reviews agent rule documents for structural completeness, rule quality, and boundary correctness. Prevents agent drift — where agent documents become vague, overlap with each other, or fail to provide actionable guidance. Without quality enforcement, agents accumulate ambiguous rules that developers ignore, duplicate coverage that creates confusion, and missing enforcement paths that let violations slip through.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — structural requirements that every agent document must meet
- **Structural heuristics** (R4, R5, R6) — rule quality standards that ensure actionability
- **Governance** (R7, R8) — boundary and process discipline

## Applicability

- Applies when creating a new agent document or modifying an existing one
- Applies when running the `review-agents.ts` script to audit the agent corpus
- Excluded: `_reviews/` directory, non-agent markdown files, code files

---

## Rules

### HARD BOUNDARIES

### R1 — Required Sections Present [BLOCKER] [BLOCKED]

<!-- GUIDE: Every agent document must have: ## Meta (yaml block with version/triggers/related), ## Purpose, ## Applicability, ## Rules (with rule subsections), ## Exceptions, ## Checklist, ## Tool Integration. Missing any section means the agent cannot be used by automated tooling. -->

**Why:** Agent documents without all required sections cannot be parsed by `agent-committee-checker.ts` and will silently fail enforcement, creating a gap where violations go undetected.

**Bad → Good:**
```
// ❌ Agent document missing ## Checklist and ## Tool Integration sections
// ❌ Automated checkers cannot verify rule coverage

// ✅ Agent document includes all 7 required sections
// ✅ Automated checkers can parse and enforce all rules
```

**Enforced by:** `review-agents.ts` (BLOCKED) — Coverage: High

---

### R2 — Every Rule Has Severity and Enforcement [BLOCKER] [BLOCKED]

<!-- GUIDE: Each rule heading must include [BLOCKER|CRITICAL|WARNING] and [BLOCKED|PREVENTED|REVIEWED|ADVISORY] in brackets. Format: ### R1 — Rule Name [SEVERITY] [ENFORCEMENT]. Without these, the checker cannot score findings correctly. -->

**Why:** Rules without severity and enforcement labels cannot be weighted in the audit scoring system, making the agent's rules invisible to the automated scoring pipeline.

**Bad → Good:**
```
// ❌ ### R3 — No Hardcoded Secrets
// ❌ (no severity or enforcement level — checker assigns default weight)

// ✅ ### R3 — No Hardcoded Secrets [BLOCKER] [BLOCKED]
// ✅ (checker correctly scores this as a blocking violation)
```

**Enforced by:** `review-agents.ts` (BLOCKED) — Coverage: High

---

### R3 — Rule Count Within Bounds [BLOCKER] [BLOCKED]

<!-- GUIDE: Every agent must have between 5 and 9 rules total. Fewer than 5 suggests incomplete coverage; more than 9 means the agent is too broad and should be split. Use the rule count check in review-agents.ts. -->

**Why:** Agents with fewer than 5 rules are insufficiently specific. Agents with more than 9 rules are too broad — they attempt to own too many domains, creating boundary conflicts and making reviews unmanageable.

**Bad → Good:**
```
// ❌ Agent has 3 rules — too few, major gaps in coverage
// ❌ Agent has 12 rules — too broad, candidate for splitting

// ✅ Agent has 6–8 rules — focused, complete within its domain
```

**Enforced by:** `review-agents.ts` (BLOCKED) — Coverage: High

---

### STRUCTURAL HEURISTICS

### R4 — Every Rule Has a Bad → Good Example [CRITICAL] [PREVENTED]

<!-- GUIDE: Every rule section must contain a "Bad → Good:" code block. Examples must be pseudocode (language-agnostic), not real code. The block must show a concrete violation and correction. Missing examples are flagged by the review script. -->

**Why:** Rules without examples are interpreted differently by different reviewers. Concrete examples eliminate ambiguity and allow developers to self-check without requiring a senior engineer.

**Bad → Good:**
```
// ❌ Rule says "avoid N+1 queries" with no example
// ❌ Developer doesn't know what a violation looks like in this codebase

// ✅ Rule shows: fetchUserAndPosts() calling DB in a loop (bad)
// ✅ vs: JOIN or Promise.all at call site (good)
```

**Enforced by:** `review-agents.ts` (PREVENTED) — Coverage: Medium

---

### R5 — No Boundary Conflicts Between Agents [CRITICAL] [REVIEWED]

<!-- GUIDE: Check the `related:` section in the agent's YAML. Each agent that could overlap must be listed with an explicit boundary statement. Use the boundary map in docs/agents/_reviews/summary.md to verify no two agents claim the same topic without a clear handoff. -->

**Why:** When two agents both flag the same pattern (e.g., both Observability and Analytics claiming "no PII in logs"), developers receive conflicting guidance and cannot determine which agent owns the decision.

**Bad → Good:**
```
// ❌ Both Analytics Agent and Observability Agent define:
// ❌ "Do not log user PII" — no stated ownership

// ✅ Observability Agent owns "no PII in logs" (technical enforcement)
// ✅ Analytics Agent defers: "See Observability Agent for logging PII"
```

**Enforced by:** Manual review via `review-agents.ts` output (REVIEWED) — Coverage: Medium

---

### R6 — Enforcement Tools Must Be Named [CRITICAL] [PREVENTED]

<!-- GUIDE: Every "Enforced by:" field must name a specific tool (e.g., ESLint, tsc, Zod, review-agents.ts, manual review) and include level (BLOCKED/REVIEWED) and coverage (High/Medium/Low). Generic enforcement like "CI checks" is not acceptable. -->

**Why:** Vague enforcement claims ("CI will catch this") create false confidence. If the named tool does not exist or is not configured, the rule is unenforced. Specific tool names allow the audit system to verify enforcement is actually in place.

**Bad → Good:**
```
// ❌ Enforced by: CI pipeline (BLOCKED) — Coverage: High
// ❌ (which CI step? which tool? not actionable)

// ✅ Enforced by: ESLint @typescript-eslint/no-explicit-any (BLOCKED) — Coverage: High
// ✅ (specific rule name → can verify it's in .eslintrc)
```

**Enforced by:** `review-agents.ts` (PREVENTED) — Coverage: Medium

---

### GOVERNANCE

### R7 — Agent Document Has Version and Last-Updated [WARNING] [REVIEWED]

<!-- GUIDE: The YAML frontmatter in ## Meta must include `version:` (semver) and `last_updated:` (ISO date). When rules change, bump the minor version. When the agent is replaced, bump major. Stale agents (last_updated > 90 days) should be reviewed. -->

**Why:** Without versioning, it is impossible to know whether an agent document reflects the current engineering standard or was written for an older architecture. Stale agents may enforce rules that contradict current CLAUDE.md or project structure.

**Bad → Good:**
```
// ❌ No version or date in YAML frontmatter
// ❌ Cannot determine if agent is current or 18 months out of date

// ✅ version: 1.2 / last_updated: 2026-04-09
// ✅ Review history trackable via git blame + version field
```

**Enforced by:** `review-agents.ts` (REVIEWED) — Coverage: Low

---

### R8 — Agent Checklist Matches Rule Count [WARNING] [REVIEWED]

<!-- GUIDE: The ## Checklist section must have exactly one checkbox per rule, in the same order as the rules. If you add or remove a rule, update the checklist immediately. The review script counts checkbox items and compares to rule count. -->

**Why:** A checklist that doesn't match the rules cannot be used for manual review. Developers doing pre-PR checks will either skip rules (checklist too short) or chase phantom rules (checklist too long).

**Bad → Good:**
```
// ❌ Agent has 7 rules but checklist has 5 items — 2 rules untracked
// ❌ Manual reviewers miss two rules entirely

// ✅ Agent has 7 rules, checklist has 7 items, in same order
// ✅ Full coverage at manual review time
```

**Enforced by:** `review-agents.ts` (REVIEWED) — Coverage: Low

---

## Exceptions

To override a quality rule for a specific agent document:
```
<!-- agent-override: AGENT_QUALITY_AGENT rule=[R1] reason="[justification]" approved-by="[name]" -->
```

## Checklist

- [ ] R1 — All required sections present
- [ ] R2 — Every rule has severity and enforcement labels
- [ ] R3 — Rule count between 5 and 9
- [ ] R4 — Every rule has a Bad → Good example
- [ ] R5 — No boundary conflicts (related section complete)
- [ ] R6 — Enforcement tools specifically named
- [ ] R7 — Version and last_updated present in YAML
- [ ] R8 — Checklist item count matches rule count

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | `review-agents.ts` | On agent doc change | BLOCKED | High |
| R2 | `review-agents.ts` | On agent doc change | BLOCKED | High |
| R3 | `review-agents.ts` | On agent doc change | BLOCKED | High |
| R4 | `review-agents.ts` | On agent doc change | PREVENTED | Medium |
| R5 | Manual + summary.md | PR review | REVIEWED | Medium |
| R6 | `review-agents.ts` | On agent doc change | PREVENTED | Medium |
| R7 | `review-agents.ts` | On agent doc change | REVIEWED | Low |
| R8 | `review-agents.ts` | On agent doc change | REVIEWED | Low |
