# SECURITY_SCAN_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "src/app/api/**/*.ts"
    - "src/lib/**/*.ts"
    - "package.json"
    - "supabase/migrations/**/*.sql"
  exclusions:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/__mocks__/**"
related:
  - agent: security
    type: complements
    boundary: "SECURITY_AGENT covers auth architecture + RLS coverage; this agent covers exploitability patterns via static regex scan"
  - agent: ai-integration
    type: overlaps
    boundary: "AI_INTEGRATION_AGENT covers token limits + fallback; this agent covers prompt injection + LLM output exploitation"
  - agent: dependencies
    type: delegates
    boundary: "DEPENDENCIES_AGENT owns dependency management process; this agent detects runtime-exploitable supply chain patterns"
```

## Purpose

This agent scans for directly exploitable attack vectors through static code analysis — not code quality, but actual exploitability. The question is not "is the code clean?" but "can an attacker exploit this code right now?" It covers injection, broken authentication, data exposure, client-side attacks, cryptographic failures, business logic flaws, AI-specific attack vectors, and supply chain risks, all detectable without runtime execution.

## Applicability

- Applies when: any TypeScript/JavaScript source file, SQL migration, or configuration file is modified
- Excluded: test files (`*.test.*`, `*.spec.*`), mock files (`__mocks__/`), example/fixture files
- Not applicable: runtime exploits, network-level attacks, social engineering, physical security

---

## Rules

### HARD BOUNDARIES

### R1 — No User Input in SQL / NoSQL / Command Queries [BLOCKER] [BLOCKED]

<!-- GUIDE: Ban direct string interpolation into DB queries; all DB access must go through Supabase parameterized client or ORM. -->

**Why:** SQL injection via template literals remains the most consistently exploited class of web vulnerabilities. A single unguarded query gives an attacker full database access or arbitrary code execution.

**Bad → Good:**
```
// ❌ SQL string concatenation
const res = db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ Parameterized query
const res = db.query('SELECT * FROM users WHERE id = $1', [userId])
```

**Enforced by:** regex pattern scan on `.ts`/`.js` files ([BLOCKED]) — Coverage: partial (catches template literals; misses manual string concatenation)

---

### R2 — No Hardcoded Secrets in Source Code [BLOCKER] [BLOCKED]

<!-- GUIDE: All secrets in .env.local / Vercel env vars. ANTHROPIC_API_KEY, JWT_SECRET, etc. never as string literals. -->

**Why:** Hardcoded secrets in source give any attacker with repository access (or a breach) immediate valid credentials. Rotation is impossible without a code deploy.

**Bad → Good:**
```
// ❌ Hardcoded secret
const apiKey = 'sk-ant-api-key-abc123...'

// ✅ Environment variable
const apiKey = process.env.ANTHROPIC_API_KEY
```

**Enforced by:** gitleaks (CLI checker) + regex pattern scan ([BLOCKED]) — Coverage: strong

---

### R3 — No eval() / new Function() with Dynamic Input [BLOCKER] [BLOCKED]

<!-- GUIDE: eval() is banned entirely. Artifact transformation uses sucrase (safe AST transform), not eval. -->

**Why:** `eval()` with any user-controlled input is Remote Code Execution. A single path that accepts user data and passes it to `eval()` compromises the entire server.

**Bad → Good:**
```
// ❌ Dynamic code execution
eval(userInput)
new Function('return ' + userCode)()

// ✅ JSON for data, AST transforms for code
JSON.parse(userInput)
sucrase.transform(userCode, { transforms: ['jsx'] })
```

**Enforced by:** regex pattern scan ([BLOCKED]) — Coverage: strong (catches direct eval; misses obfuscated paths)

---

### R4 — No Path Traversal via User-Controlled Paths [BLOCKER] [BLOCKED]

<!-- GUIDE: All fs operations use static paths or validate with path.resolve() + allowlist check. -->

**Why:** `fs.readFileSync(userInput)` with `../../etc/passwd` reads arbitrary server files. A single traversal exposes secrets, source code, and SSH keys.

**Bad → Good:**
```
// ❌ User-controlled path to fs
const content = fs.readFileSync(req.query.file)

// ✅ Resolve and validate
const safe = path.resolve(ALLOWED_DIR, req.query.file)
if (!safe.startsWith(ALLOWED_DIR)) throw new Error('Invalid path')
const content = fs.readFileSync(safe)
```

**Enforced by:** regex pattern scan ([BLOCKED]) — Coverage: partial (catches obvious patterns; misses indirect variables)

---

### R5 — No SSRF via User-Controlled URLs [BLOCKER] [BLOCKED]

<!-- GUIDE: Never pass user-provided URLs to fetch/axios without strict allowlist validation. -->

**Why:** Server-Side Request Forgery lets attackers access internal services (Supabase admin API, cloud metadata endpoints) that are otherwise unreachable from the internet.

**Bad → Good:**
```
// ❌ User-controlled URL to fetch
const data = await fetch(req.body.url)

// ✅ Allowlist validation
const ALLOWED = ['https://api.example.com', 'https://partner.com']
if (!ALLOWED.some(a => req.body.url.startsWith(a))) throw new Error('Blocked')
const data = await fetch(req.body.url)
```

**Enforced by:** regex pattern scan ([BLOCKED]) — Coverage: partial (catches obvious patterns)

---

### STRUCTURAL HEURISTICS

### R6 — Auth Tokens Must Not Be Stored in localStorage [CRITICAL] [REVIEWED]

<!-- GUIDE: Supabase session cookies are httpOnly by default. Never call localStorage.setItem for tokens, auth, jwt, session. -->

**Why:** localStorage is accessible to any JavaScript (including XSS payloads). httpOnly cookies are invisible to JS — a stolen cookie requires a more targeted CSRF, not just XSS.

**Bad → Good:**
```
// ❌ Token in localStorage
localStorage.setItem('token', accessToken)

// ✅ httpOnly cookie via Supabase SSR
// Supabase SSR client handles cookies automatically
```

**Enforced by:** regex pattern scan ([REVIEWED]) — Coverage: strong for explicit patterns

---

### R7 — Cryptographically Weak Algorithms Must Not Be Used for Security [CRITICAL] [REVIEWED]

<!-- GUIDE: Use crypto.randomUUID() or crypto.getRandomValues() for tokens. Passwords: bcrypt/argon2. Hashes: SHA-256+. -->

**Why:** MD5 and SHA-1 are broken for security purposes (collision attacks). `Math.random()` is predictable and allows session/token prediction attacks.

**Bad → Good:**
```
// ❌ Predictable token
const sessionId = Math.random().toString(36)
const hash = crypto.createHash('md5').update(password).digest('hex')

// ✅ Cryptographically secure
const sessionId = crypto.randomUUID()
const hash = await bcrypt.hash(password, 12)
```

**Enforced by:** regex pattern scan ([REVIEWED]) — Coverage: partial (catches named algorithms; misses custom weak implementations)

---

### R8 — LLM Output Must Not Be Executed as Code or Injected into DOM [CRITICAL] [REVIEWED]

<!-- GUIDE: LLM responses are data, never code. Artifact transformation uses Sucrase with restricted transform scope — no arbitrary code eval. -->

**Why:** An attacker who can influence LLM training data or inject into the conversation can execute arbitrary JavaScript if LLM output reaches `eval()` or `innerHTML`. This chains prompt injection into full XSS/RCE.

**Bad → Good:**
```
// ❌ LLM output executed
eval(llmResponse.code)
element.innerHTML = aiResult.html

// ✅ Sandboxed rendering
// Code: sucrase.transform in iframe sandbox
// HTML: DOMPurify.sanitize(aiResult.html)
```

**Enforced by:** regex pattern scan ([REVIEWED]) — Coverage: partial

---

### GOVERNANCE

### R9 — Mass Assignment Must Use Explicit Field Allowlist [WARNING] [REVIEWED]

**Why:** Accepting `req.body` directly into a DB update call allows attackers to set fields they should not control (e.g. `role: 'admin'`, `organization_id: '...'`). This is the #1 privilege escalation pattern in CRUD apps.

**Bad → Good:**
```
// ❌ Spread entire body into update
await db.from('users').update(req.body).eq('id', userId)

// ✅ Explicit allowlist
const { name, bio } = req.body
await db.from('users').update({ name, bio }).eq('id', userId)
```

**Enforced by:** regex pattern scan + code review ([REVIEWED]) — Coverage: partial

---

## Exceptions

- `Math.random()` for non-security purposes (UI animations, test fixtures, display randomization) is allowed
- `dangerouslySetInnerHTML` with DOMPurify-sanitized input is acceptable
- `eval()` is only acceptable in the artifact transformer (`/api/artifacts/transform`) where the transform is strictly sandboxed via sucrase with no user-supplied transforms

## Checklist

```
[ ] No SQL/NoSQL/command queries built with string interpolation
[ ] No hardcoded API keys, passwords, or JWT secrets in source
[ ] No eval() or new Function() with user-controlled input
[ ] No fs operations with user-supplied paths (without allowlist)
[ ] No fetch/axios calls with user-controlled URLs (without allowlist)
[ ] Auth tokens stored in httpOnly cookies, not localStorage
[ ] Tokens generated with crypto.randomUUID() or crypto.getRandomValues()
[ ] LLM output never passed to eval() or innerHTML
[ ] DB updates use explicit field allowlists, not req.body spread
```

## Tool Integration

```
scan mode: static pattern matching
file types: .ts, .tsx, .js, .jsx, .json, .sql, .yml, .yaml
exclude: *.test.*, *.spec.*, __mocks__/, node_modules/
pattern engine: regex per attack category
output: Finding[] with severity, filePath, line, suggestion
integration: security-scan-checker.ts → rule-registry.ts → /audit dashboard
```
