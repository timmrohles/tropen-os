# DEPENDENCIES_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "package.json"
    - "package-lock.json"
    - "yarn.lock"
    - "pnpm-lock.yaml"
    - ".github/dependabot.yml"
    - "renovate.json"
    - ".nvmrc"
  keywords:
    - dependency
    - lockfile
    - CVE
    - supply chain
    - SBOM
    - license
    - node version
  exclusions:
    - "*.test.ts"
    - "*.spec.ts"
    - "*.test.tsx"
    - "*.generated.ts"
    - "node_modules/**"
related:
  - agent: architecture
    type: consult
    boundary: "Dependencies owns external package management and supply chain security. Architecture owns internal module dependencies and boundaries."
  - agent: security
    type: consult
    boundary: "Dependencies owns dependency vulnerability scanning. Security owns secrets in dependency configs and exploitation patterns."
  - agent: security
    type: overlaps
    boundary: "Dependencies and Security both touch vulnerability exploitation patterns; Security owns exploitation remediation, Dependencies owns package selection."
  - agent: architecture
    type: overlaps
    boundary: "Dependencies and Architecture both touch module structure; Architecture owns internal boundaries, Dependencies owns external packages."
  - agent: security
    type: delegates
    boundary: "Dependencies delegates secrets in dependency config files to Security."
  - agent: architecture
    type: delegates
    boundary: "Dependencies delegates internal module structure and boundaries to Architecture."
```

## Purpose

Reviews dependency management, supply chain security, and version control to prevent vulnerable packages, inconsistent environments, and supply chain attacks. Without this agent, projects accumulate technical debt through outdated dependencies and expose themselves to security vulnerabilities.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8) — process discipline

## Applicability

- Changes to package managers (package.json, lockfiles)
- Dependency update configurations (Dependabot, Renovate)
- Runtime version specifications (.nvmrc, Dockerfile)
- Excluded: Internal module dependencies, vendored code not managed by package managers

---

## Rules

### HARD BOUNDARIES

### R1 — Lockfiles Must Be Committed [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure .gitignore to NOT exclude package-lock.json, yarn.lock, or pnpm-lock.yaml -->

**Why:** Missing lockfiles cause version drift between environments and unpredictable production behavior.

**Bad → Good:**
```
// Bad
.gitignore contains:
package-lock.json
yarn.lock

// Good
Lockfiles committed and consistent with package.json
CI uses: npm ci or yarn install --frozen-lockfile
```

**Enforced by:** Git hooks (BLOCKED, coverage: strong)

---

### R2 — No Critical CVEs in Dependencies [BLOCKER] [BLOCKED]

<!-- GUIDE: Set up npm audit or yarn audit in CI with --audit-level=critical flag -->

**Why:** Critical vulnerabilities provide direct attack vectors into production systems.

**Bad → Good:**
```
// Bad
npm audit shows:
Critical: 3, High: 8, Moderate: 12

// Good
npm audit shows no critical vulnerabilities
All critical CVEs addressed or suppressed with justification
```

**Enforced by:** npm audit (BLOCKED, coverage: strong)

---

### R3 — Node.js Version Pinned [BLOCKER] [BLOCKED]

<!-- GUIDE: Create .nvmrc file with exact version (e.g., "18.17.0"), not ranges -->

**Why:** Version drift between development and production causes hard-to-debug runtime failures.

**Bad → Good:**
```
// Bad
No .nvmrc file
engines: { node: ">=16" }

// Good
.nvmrc: 18.17.0
package.json engines matches .nvmrc exactly
```

**Enforced by:** CI/Docker (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Transitive Dependencies Scanned for Malware [CRITICAL] [PREVENTED]

<!-- GUIDE: Integrate socket.dev, Snyk, or similar tool that scans npm packages for malicious behavior -->

**Why:** Compromised transitive dependencies are a primary attack vector for supply chain attacks.

**Bad → Good:**
```
// Bad
Dependencies installed without supply chain scanning

// Good
All dependencies scanned for:
- Typosquatting attempts
- Suspicious network activity
- Known malicious packages
```

**Enforced by:** Socket.dev/Snyk (PREVENTED, coverage: strong)

---

### R5 — SBOM Generated for Production Builds [CRITICAL] [PREVENTED]

<!-- GUIDE: Use syft or cyclonedx to generate Software Bill of Materials in CI -->

**Why:** Without dependency inventory, security teams cannot assess impact during vulnerability disclosure events.

**Bad → Good:**
```
// Bad
Production deployments without dependency manifest

// Good
SBOM.json generated containing:
- Direct and transitive dependencies
- Exact versions and checksums
- License information
```

**Enforced by:** CycloneDX/Syft (PREVENTED, coverage: partial)

---

### R6 — Dependency Updates Automated [CRITICAL] [REVIEWED]

<!-- GUIDE: Configure Dependabot or Renovate with security-only updates for production -->

**Why:** Manual dependency updates lead to accumulating security debt and delayed vulnerability patching.

**Bad → Good:**
```
// Bad
Dependencies updated manually and infrequently

// Good
Dependabot/Renovate configured:
- Security updates: immediate
- Minor updates: weekly batches
- Major updates: monthly with review
```

**Enforced by:** Dependabot/Renovate (REVIEWED, coverage: strong)

---

### GOVERNANCE

### R7 — AI-Generated Dependencies Reviewed [WARNING] [REVIEWED]

<!-- GUIDE: Flag PRs with new dependencies when AI tools are detected in commit messages -->

**Why:** AI code generation tools may suggest dependencies with security issues, typosquatting, or inappropriate licenses.

**Bad → Good:**
```
// Bad
AI suggests: import from 'lodash-es-utils'
Added without verification

// Good
Human verifies:
- Correct package name (not typosquatted)
- Maintainer reputation
- Security scan passed
```

**Enforced by:** PR Review Process (REVIEWED, coverage: advisory)

---

### R8 — Production Builds Signed [WARNING] [REVIEWED]

<!-- GUIDE: Configure sigstore/cosign for container images or npm provenance for packages -->

**Why:** Unsigned builds cannot guarantee integrity between publication and deployment, enabling supply chain tampering.

**Bad → Good:**
```
// Bad
Container images pushed unsigned
npm packages published without provenance

// Good
Build artifacts include:
- Cryptographic signatures
- Build provenance metadata
- Verification instructions
```

**Enforced by:** Sigstore/npm (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R2
Scope:    eslint-plugin-boundaries (High severity)
Reason:   Upstream fix not yet released; no exploit path in current usage context
Approved: @[who]
Expires:  2026-06-01
Control:  Input to affected code path is fully controlled; monitored for upstream patch
```

**WARNING — solo/small team:**
```
Override: R8 — build signing not yet configured — @[who] — expires 2026-07-01
```

## Checklist

```
□ Lockfile committed and CI uses --frozen-lockfile?  (R1)
□ Zero critical CVEs in npm audit output?  (R2)
□ Node.js version pinned in .nvmrc and package.json engines?  (R3)
□ Supply chain scan (socket.dev/Snyk) passing for all transitive deps?  (R4)
□ SBOM generated as part of production build?  (R5)
□ Dependabot or Renovate configured with security-first update schedule?  (R6)
□ Any AI-suggested new packages manually verified before merge?  (R7)
□ Container images and/or npm packages signed with provenance?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Git hooks | pre-commit | BLOCKED | strong |
| R2 | npm audit | CI | BLOCKED | strong |
| R3 | Docker/CI | build | BLOCKED | strong |
| R4 | Socket.dev/Snyk | CI | PREVENTED | strong |
| R5 | CycloneDX/Syft | build | PREVENTED | partial |
| R6 | Dependabot | weekly | REVIEWED | strong |
| R7 | PR labels | review | REVIEWED | advisory |
| R8 | Sigstore/npm | build | REVIEWED | advisory |
