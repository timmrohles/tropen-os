# GIT_GOVERNANCE_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "**/.gitignore"
    - "**/.github/**"
    - "**/CODEOWNERS"
    - "**/package.json"
  keywords:
    - "Every PR"
    - "Every commit"
    - "branch protection"
    - "version bump"
    - "semantic versioning"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/*.test.tsx"
    - "**/*.generated.ts"
    - "**/migrations/**"
    - "hotfix branches during incidents (with post-incident cleanup required)"
related:
  - agent: architecture
    type: consult
    boundary: "Git governance owns commit and branch rules. Architecture owns critical path definitions."
  - agent: security
    type: overlaps
    boundary: "Security owns secret detection implementation. Git governance owns secret purge policy and history hygiene."
```

## Purpose

This agent enforces Git workflow consistency, commit hygiene, and repository governance to maintain project history quality and enable automated tooling. Without proper Git governance, repositories become archaeological digs where nobody can understand what changed when or why, making rollbacks difficult and security vulnerabilities permanent.

This agent contains 3 types of rules:
- **Hard boundaries** (R1–R3) — mechanically enforceable
- **Structural heuristics** (R4–R6) — judgment-based
- **Governance** (R7–R8) — process discipline

## Applicability

- Making commits to any branch
- Creating or merging pull requests
- Modifying version numbers or release tags
- Changing repository configuration files
- Excluded: Emergency hotfixes (with mandatory cleanup afterward)

---

## Rules

### HARD BOUNDARIES

### R1 — No Force Push to Protected Branches [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure branch protection rules in GitHub/GitLab/Bitbucket repository settings. Disable "Allow force pushes" for main, master, and release branches -->

**Why:** Force pushing rewrites shared history, breaking other developers' local repositories and destroying the audit trail.

**Bad → Good:**
```
// Bad
git push --force origin main
git push --force-with-lease origin main

// Good
git revert ABC123
git push origin main
```

**Enforced by:** Branch Protection Rules (BLOCKED, coverage: strong)

---

### R2 — Protected Branches Require PR and Reviews [BLOCKER] [BLOCKED]

<!-- GUIDE: Enable "Require a pull request before merging" and "Require approvals" in branch protection settings -->

**Why:** Bypassing the PR process eliminates code review, breaks CI/CD validation, and can introduce critical defects directly into production.

**Bad → Good:**
```
// Bad
git checkout main
git commit -m "hotfix"
git push origin main

// Good
git checkout -b fix/critical-issue
git commit -m "fix: resolve critical login issue"
git push origin fix/critical-issue
// Create PR for review
```

**Enforced by:** Branch Protection Rules (BLOCKED, coverage: strong)

---

### R3 — Secrets Must Be Purged from History [BLOCKER] [BLOCKED]

<!-- GUIDE: Use git-filter-repo or BFG Repo-Cleaner to remove secrets. Run git-secrets or truffleHog in CI to scan full commit history -->

**Why:** Once secrets are in Git history, they remain accessible even after deletion, requiring complete history rewrite to truly remove them.

**Bad → Good:**
```
// Bad
Commit 1: add API_KEY="sk_live_123..."
Commit 2: remove API_KEY (secret still in history)

// Good
git filter-repo --invert-paths --path file-with-secret
// Force all developers to re-clone after history rewrite
```

**Enforced by:** git-secrets/truffleHog (BLOCKED, coverage: partial)

---

### STRUCTURAL HEURISTICS

### R4 — Conventional Commit Format [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure commitlint with @commitlint/config-conventional in package.json or .commitlintrc -->

**Why:** Enables automated changelog generation, semantic versioning, and makes commit history searchable by change type.

**Bad → Good:**
```
// Bad
fixed the bug
Updated documentation
WIP stuff

// Good
fix: resolve null pointer in user validation
docs: update API authentication guide
feat: add user profile export functionality
```

**Enforced by:** commitlint (PREVENTED, coverage: strong)

---

### R5 — Atomic Commits [CRITICAL] [REVIEWED]

<!-- GUIDE: Use git add -p to stage partial changes, split large commits with git reset HEAD^ -->

**Why:** Each commit should represent one logical change, making bisection, cherry-picking, and rollbacks reliable.

**Bad → Good:**
```
// Bad
feat: add user auth, fix typos, update dependencies, refactor utils

// Good
fix: correct typos in user interface labels
feat: implement JWT-based user authentication
chore: update security dependencies to latest
refactor: extract common utilities to shared module
```

**Enforced by:** Manual Review (REVIEWED, coverage: partial)

---

### R6 — Semantic Versioning Compliance [CRITICAL] [PREVENTED]

<!-- GUIDE: Use semantic-release or standard-version for automated versioning based on commit types -->

**Why:** Predictable versioning helps consumers understand compatibility and upgrade impact.

**Bad → Good:**
```
// Bad
1.0.0 → 1.0.1 (breaking API change)
2.1.0 → 3.0.0 (only bug fixes)

// Good
1.0.0 → 2.0.0 (breaking: remove deprecated auth method)
2.1.0 → 2.1.1 (fix: handle edge case in parsing)
2.1.1 → 2.2.0 (feat: add optional timeout parameter)
```

**Enforced by:** semantic-release (PREVENTED, coverage: strong)

---

### GOVERNANCE

### R7 — CODEOWNERS for Critical Paths [WARNING] [REVIEWED]

<!-- GUIDE: Create .github/CODEOWNERS file mapping critical directories to responsible teams -->

**Why:** Ensures architectural decisions and security-sensitive code changes get proper review from domain experts.

**Bad → Good:**
```
// Bad
No CODEOWNERS file, or missing entries for:
/src/auth/* /database/migrations/* /infrastructure/*

// Good
/src/auth/* @security-team
/database/migrations/* @database-team
/infrastructure/* @platform-team
*.tf @platform-team
```

**Enforced by:** CODEOWNERS file (REVIEWED, coverage: partial)

---

### R8 — Clean Commit Messages [WARNING] [REVIEWED]

<!-- GUIDE: Set up commit message templates with git config commit.template -->

**Why:** Good commit messages serve as project documentation and help during debugging and code archaeology.

**Bad → Good:**
```
// Bad
stuff
oops
minor changes
asdf

// Good
feat(auth): add password reset functionality

- Implement email-based password reset flow
- Add rate limiting for reset requests
- Include email templates for notifications
```

**Enforced by:** Manual Review (REVIEWED, coverage: advisory)

---

## Exceptions

**BLOCKER:**
```
Override: R4
Scope:    emergency hotfixes
Reason:   incident response requires immediate commit without format enforcement
Approved: @incident-commander
Expires:  temporary — cleanup required post-incident
Control:  post-incident review must retroactively squash/reformat commits
```

**WARNING — solo/small team:**
```
Override: R7 — CODEOWNERS not yet created — @timm — expires 2026-06-01
```

## Checklist

```
□ No force pushes to protected branches?  (R1)
□ All changes to protected branches go through PR with review?  (R2)
□ No secrets present in history? Scan run?  (R3)
□ Commits follow conventional format (type: description)?  (R4)
□ Each commit represents one logical change?  (R5)
□ Version bumps follow semantic versioning?  (R6)
□ CODEOWNERS covers critical paths (/src/auth, /database/migrations, /infrastructure)?  (R7)
□ Commit messages are descriptive and meaningful?  (R8)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Branch Protection | push | BLOCKED | strong |
| R2 | Branch Protection | PR | BLOCKED | strong |
| R3 | git-secrets/truffleHog | CI | BLOCKED | partial |
| R4 | commitlint | pre-commit | PREVENTED | strong |
| R5 | Manual Review | PR | REVIEWED | partial |
| R6 | semantic-release | CI/CD | PREVENTED | strong |
| R7 | CODEOWNERS file | PR | REVIEWED | partial |
| R8 | Manual Review | PR | REVIEWED | advisory |
