// src/lib/audit/checkers/security-scan-checker.ts
// Attack-vector scanner: asks "is this exploitable?" not "is this clean?"
// Static pattern matching only — no runtime analysis.

import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'
import type { ProjectFile } from '@/lib/file-access/types'

// ── Pattern Definition ────────────────────────────────────────────────────────

interface SecurityPattern {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  pattern: RegExp
  fileGlob: string[]        // file extensions to scan
  excludePattern?: RegExp   // paths to skip
  includePattern?: RegExp   // if set, file path must match (allowlist)
  message: string
  exploitability: string
  suggestion: string
}

// Helper: read file safely
function readSafe(rootPath: string, filePath: string): string {
  try { return fs.readFileSync(join(rootPath, filePath), 'utf-8') } catch { return '' }
}

// Helper: scan patterns against content lines, return findings
function scanPatterns(
  content: string,
  filePath: string,
  patterns: SecurityPattern[],
  extensions: string[],
): Finding[] {
  if (!extensions.some((ext) => filePath.endsWith(ext))) return []
  const lines = content.split('\n')
  const findings: Finding[] = []
  for (const p of patterns) {
    if (!p.fileGlob.some((ext) => filePath.endsWith(ext))) continue
    if (p.excludePattern?.test(filePath)) continue
    if (p.includePattern && !p.includePattern.test(filePath)) continue
    // postmessage-no-origin: skip if the file already validates e.origin
    if (p.id === 'postmessage-no-origin' && /e\.origin/.test(content)) continue
    for (let i = 0; i < lines.length; i++) {
      if (p.pattern.test(lines[i])) {
        if (p.id === 'typosquatting-risk') {
          // Extract the package name from the matching line
          const pkgMatch = lines[i].match(/"([^"]+)"\s*:/)
          const pkgName = pkgMatch?.[1] ?? 'unknown'
          findings.push({
            severity: p.severity,
            message: `Potential typosquatting: package "${pkgName}" may be misspelled — verify on npmjs.com`,
            filePath,
            line: i + 1,
            suggestion: `Run 'npm info ${pkgName}' to verify this package exists and has expected download counts`,
            agentSource: 'security-scan',
          })
          break
        }
        findings.push({
          severity: p.severity,
          message: `[${p.id}] ${p.message}`,
          filePath,
          line: i + 1,
          suggestion: p.suggestion,
          agentSource: 'security-scan',
        })
        break // one finding per pattern per file
      }
    }
  }
  return findings
}

function makeResult(
  ruleId: string,
  patternName: string,
  findings: Finding[],
): RuleResult {
  const hasCritical = findings.some((f) => f.severity === 'critical')
  const hasHigh = findings.some((f) => f.severity === 'high')
  // High/critical violations score harshly; medium-only violations get a more lenient curve
  const score = findings.length === 0 ? 5
    : hasCritical ? 1
    : hasHigh ? (findings.length <= 2 ? 3 : 2)
    : findings.length <= 3 ? 4 : findings.length <= 15 ? 3 : 2
  return {
    ruleId,
    score,
    reason: findings.length === 0
      ? `Keine ${patternName} Patterns gefunden`
      : `${findings.length} ${patternName} Pattern(s) gefunden`,
    findings,
    automated: true,
  }
}

// ── Pattern Definitions ───────────────────────────────────────────────────────

const INJECTION_PATTERNS: SecurityPattern[] = [
  {
    id: 'sqli-template',
    severity: 'critical',
    pattern: /\.(?:query|execute|raw)\s*\(\s*`[^`]*\$\{/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'SQL/DB query built with template literal interpolation (SQL Injection risk)',
    exploitability: 'Attacker can inject arbitrary SQL commands',
    suggestion: 'Use parameterized queries: db.query("SELECT ... WHERE id = $1", [id])',
  },
  {
    id: 'nosql-injection',
    severity: 'critical',
    pattern: /\$where\s*:\s*(?:req\.|body\.|params\.|query\.)|\.find\s*\(\s*(?:req\.|body\.)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'NoSQL query constructed from user input (NoSQL Injection risk)',
    exploitability: 'Attacker can bypass authentication or exfiltrate all documents',
    suggestion: 'Validate and sanitize input; use strict schema for query construction',
  },
  {
    id: 'cmd-injection',
    severity: 'critical',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\([^)]*(?:req\.|params\.|query\.|body\.|\$\{[^}]*(?:req|params|query|body))/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Shell command constructed from user input (Command Injection risk)',
    exploitability: 'Attacker can execute arbitrary OS commands on the server',
    suggestion: 'Never pass user input to exec/spawn; use allowlisted commands with fixed args',
  },
  {
    id: 'path-traversal',
    severity: 'critical',
    pattern: /(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync|access|stat)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Filesystem operation with user-controlled path (Path Traversal risk)',
    exploitability: 'Attacker can read arbitrary files: ../../etc/passwd',
    suggestion: 'Resolve path, then verify it starts with the allowed directory prefix',
  },
  {
    id: 'ssrf',
    severity: 'high',
    pattern: /(?:fetch|axios\.(?:get|post|put|patch)|got\s*\(|https?\.(?:get|request))\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.|input\.|\$\{[^}]*(?:url|href|endpoint|target))/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'HTTP request to user-controlled URL (SSRF risk)',
    exploitability: 'Attacker can access internal services, cloud metadata, or VPC resources',
    suggestion: 'Validate URL against strict allowlist before making requests',
  },
  {
    id: 'open-redirect',
    severity: 'high',
    pattern: /(?:redirect|res\.redirect|NextResponse\.redirect)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Redirect target from user input (Open Redirect risk)',
    exploitability: 'Attacker can redirect users to phishing sites via trusted URL',
    suggestion: 'Validate redirect target against allowlist of safe internal paths',
  },
  {
    id: 'redos',
    severity: 'medium',
    pattern: /new RegExp\s*\([^)]*(?:req\.|params\.|query\.|body\.)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'RegExp constructed from user input (ReDoS risk)',
    exploitability: 'Attacker can cause catastrophic backtracking, blocking the event loop',
    suggestion: 'Use static regex patterns; validate/sanitize before regex matching',
  },
  {
    id: 'xss-dangerous-html',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/,
    fileGlob: ['.tsx', '.jsx', '.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'dangerouslySetInnerHTML usage (XSS risk if content is not sanitized)',
    exploitability: 'Attacker can inject and execute arbitrary JavaScript in user browsers',
    suggestion: 'Sanitize with DOMPurify before using dangerouslySetInnerHTML',
  },
  {
    id: 'template-injection',
    severity: 'high',
    pattern: /(?:Handlebars|Mustache|nunjucks|ejs)\.(?:render|compile)\s*\([^)]*(?:req\.|body\.|params\.)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Template engine rendering with user input (Server-Side Template Injection)',
    exploitability: 'Attacker can achieve remote code execution via template directives',
    suggestion: 'Keep templates static; pass user data only as template variables, never as template source',
  },
]

const AUTH_PATTERNS: SecurityPattern[] = [
  {
    id: 'hardcoded-secret',
    severity: 'critical',
    // Requires: security keyword + assignment operator + quoted value (8+ non-space chars).
    // This already avoids most natural-language false positives (no quotes after the keyword).
    // Additional exclusion: agent-gen definition scripts embed engineering-standard rules as
    // template-string literals — their text contains "Secret-Rewrite", "Service Role Key" etc.
    // as documentation vocabulary, not credential assignments. (checker-feedback.md 2026-04-22)
    pattern: /(?:password|secret|api_?key|jwt_?secret|access_?token|private_?key|client_?secret)\s*[:=]\s*['"][^'"${\s]{8,}['"]/i,
    fileGlob: ['.ts', '.js', '.json', '.yml', '.yaml', '.env'],
    excludePattern: /(?:\.(?:test|spec|example)|node_modules|\.env\.example|[\\/]scripts[\\/]agent-gen)/,
    message: 'Potential hardcoded secret or credential in source code',
    exploitability: 'Any code access (breach, leak, disgruntled employee) gives attacker valid credentials',
    suggestion: 'Move to environment variable; rotate the exposed credential immediately',
  },
  {
    id: 'localstorage-token',
    severity: 'high',
    pattern: /localStorage\.setItem\s*\(\s*['"](?:token|auth|jwt|session|access_token|refresh_token)['"]/i,
    fileGlob: ['.ts', '.tsx', '.js', '.jsx'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Auth token stored in localStorage (accessible to XSS)',
    exploitability: 'Any XSS can steal the token; no same-site protection',
    suggestion: 'Use httpOnly cookies; Supabase SSR handles this automatically',
  },
  {
    id: 'math-random-token',
    severity: 'high',
    pattern: /Math\.random\s*\(\s*\).*(?:token|secret|key|password|uuid|session|nonce|csrf)/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\.|\/lib\/audit\//,
    message: 'Math.random() used for security-sensitive value',
    exploitability: 'Math.random() is not cryptographically secure — values are predictable',
    suggestion: 'Use crypto.randomUUID() or crypto.getRandomValues(new Uint8Array(32))',
  },
  {
    id: 'password-in-url',
    severity: 'high',
    pattern: /(?:password|passwd|pwd|secret)=(?:[^&\s]{6,})/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Password or secret appears in URL string',
    exploitability: 'URLs are logged by proxies, CDNs, and browser history',
    suggestion: 'Send credentials in POST body or Authorization header, never in URL',
  },
  {
    id: 'jwt-alg-none',
    severity: 'critical',
    pattern: /(?:algorithm|alg)\s*:\s*['"](?:none|NONE)['"]/,
    fileGlob: ['.ts', '.js', '.json'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'JWT algorithm set to "none" — signature verification bypassed',
    exploitability: 'Attacker can forge any JWT without a valid signature',
    suggestion: 'Always require explicit algorithm (HS256/RS256); reject tokens with alg:none',
  },
  {
    id: 'weak-jwt-secret',
    severity: 'high',
    pattern: /(?:sign|verify)\s*\([^)]*,\s*['"][^'"]{1,15}['"]\s*[,)]/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'JWT signed/verified with very short secret (< 16 chars)',
    exploitability: 'Short secrets are brute-forceable; attacker can forge tokens',
    suggestion: 'Use at least 256-bit (32-char) random secret from environment variable',
  },
]

const DATA_EXPOSURE_PATTERNS: SecurityPattern[] = [
  {
    id: 'select-star-api',
    severity: 'medium',
    // Only flag SELECT * in actual HTTP handler files (Next.js App Router route.ts or pages/api/).
    // Server actions (src/actions/), lib files, scripts, and edge functions are excluded because
    // they don't directly serialize DB rows into HTTP responses — the caller controls projection.
    // Admin/cron/superadmin routes are excluded: privileged or internal, not user-facing.
    // Audit/library/agents/feeds routes are app-internal management APIs with no sensitive PII.
    // Perspectives/transformations are user-owned feature data — all columns are intentionally
    // returned to the authenticated owner; no cross-user exposure or PII columns.
    pattern: /\.select\s*\(\s*['"`]\*['"`]\s*\)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\.|\/api\/(?:admin|cron|superadmin|audit|library|agents|feeds|perspectives|transformations)\//,
    includePattern: /(?:^|\/)(?:app\/api\/|pages\/api\/).*\.[jt]sx?$/,
    message: 'SELECT * in API route — over-fetching exposes all columns',
    exploitability: 'Sensitive columns (password_hash, tokens, PII) leak in API response',
    suggestion: 'Select only required columns explicitly: .select("id, name, email")',
  },
  {
    id: 'sensitive-header-leak',
    severity: 'medium',
    pattern: /(?:setHeader|headers\.set)\s*\(\s*['"](?:x-powered-by|server)['"]/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Server technology header set explicitly — fingerprinting risk',
    exploitability: 'Attacker learns exact framework/version for targeted exploits',
    suggestion: 'Remove X-Powered-By; set generic Server header or omit it',
  },
  {
    id: 'stack-trace-response',
    severity: 'high',
    // Only flag when error internals appear directly inside NextResponse.json() or new Response() on the same line
    // This avoids false positives from: server actions, logger calls, variable assignments, and doc strings
    pattern: /(?:NextResponse\.json|new Response)\([^)]*(?:error|err|e|ex)\.(?:stack|message)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\.|\/src\/(?:lib\/audit\/build-time-rules)/,
    message: 'Stack trace or error internals sent in API response',
    exploitability: 'Reveals server file paths, library versions, and internal logic to attackers',
    suggestion: 'Use apiError() from @/lib/api-error — logs full error server-side, returns only a generic message',
  },
  {
    id: 'debug-endpoint',
    severity: 'high',
    pattern: /(?:router|app|Route)\s*\.(?:get|post|all)\s*\(\s*['"]\/(?:debug|test|admin\/debug|_debug)['"]/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Debug or test endpoint registered in application',
    exploitability: 'Debug endpoints often expose internal state, bypass auth, or allow code execution',
    suggestion: 'Remove debug endpoints from production; guard with IS_DEV environment check',
  },
  {
    id: 'pii-in-log',
    severity: 'high',
    pattern: /(?:log\.|console\.(?:log|info|warn|error))[^;]*['"](?:password|passwd|token|secret|ssn|credit_card|cvv|pan|iban)['"]/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Potential PII field name in log call',
    exploitability: 'Credentials and PII in logs are exfiltrated in log-management platform breaches',
    suggestion: 'Log only non-sensitive identifiers; redact sensitive fields before logging',
  },
]

const CLIENT_SIDE_PATTERNS: SecurityPattern[] = [
  {
    id: 'eval-usage',
    severity: 'critical',
    pattern: /(?:^|[^a-zA-Z.])eval\s*\(|new\s+Function\s*\(/,
    fileGlob: ['.ts', '.tsx', '.js', '.jsx'],
    excludePattern: /(?:\.(?:test|spec)|node_modules|sucrase|babel|transform|security-scan-checker)/,
    message: 'eval() or new Function() with potentially dynamic input',
    exploitability: 'Attacker-controlled input reaching eval() achieves Remote Code Execution',
    suggestion: 'Remove eval(); use JSON.parse for data, sucrase for sandboxed code transforms',
  },
  {
    id: 'prototype-pollution',
    severity: 'high',
    pattern: /Object\.(?:assign|merge|extend|defaults)\s*\(\s*(?:\{\}|Object\.create\(null\))?\s*,\s*(?:req\.body|body|input|data|params)\s*[,)]/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Object.assign/merge with user-supplied object (Prototype Pollution risk)',
    exploitability: 'Attacker can pollute Object.prototype, affecting all object property lookups',
    suggestion: 'Use explicit field extraction; validate input schema before merging',
  },
  {
    id: 'postmessage-no-origin',
    severity: 'medium',
    pattern: /addEventListener\s*\(\s*['"]message['"]/,
    fileGlob: ['.ts', '.tsx', '.js', '.jsx'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'postMessage listener without apparent origin check (check for e.origin validation)',
    exploitability: 'Any origin can send messages; attacker can trigger privileged actions',
    suggestion: 'Always check e.origin === EXPECTED_ORIGIN before processing postMessage data',
  },
  {
    id: 'innerhtml-assignment',
    severity: 'high',
    pattern: /\.innerHTML\s*=\s*(?!.*DOMPurify)/,
    fileGlob: ['.ts', '.tsx', '.js', '.jsx'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Direct innerHTML assignment without DOMPurify sanitization',
    exploitability: 'User-controlled content in innerHTML executes injected scripts',
    suggestion: 'Use textContent for text; use DOMPurify.sanitize() before innerHTML',
  },
  {
    id: 'localstorage-sensitive',
    severity: 'medium',
    pattern: /localStorage\.setItem\s*\(\s*['"][^'"]*(?:key|secret|private|credential|sensitive)['"]/i,
    fileGlob: ['.ts', '.tsx', '.js', '.jsx'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Sensitive data stored in localStorage (XSS-accessible)',
    exploitability: 'XSS can exfiltrate any localStorage value',
    suggestion: 'Use sessionStorage for non-sensitive session data; httpOnly cookies for credentials',
  },
]

const CRYPTO_PATTERNS: SecurityPattern[] = [
  {
    id: 'weak-hash-password',
    severity: 'critical',
    pattern: /createHash\s*\(\s*['"](?:md5|sha1|sha-1)['"]\s*\)/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'MD5 or SHA-1 hash algorithm used (cryptographically broken)',
    exploitability: 'MD5/SHA-1 are collision-broken and rainbow-table crackable for passwords',
    suggestion: 'For passwords: bcrypt/argon2. For integrity: SHA-256+. Never MD5/SHA-1 for security.',
  },
  {
    id: 'hardcoded-iv',
    severity: 'high',
    pattern: /(?:iv|salt|nonce|initVector)\s*[:=]\s*(?:Buffer\.from\s*\(\s*)?['"][0-9a-fA-F]{16,}['"]/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'Hardcoded IV, salt, or nonce in cryptographic operation',
    exploitability: 'Static IV defeats cipher mode security; enables known-plaintext attacks',
    suggestion: 'Generate fresh random IV per encryption: crypto.getRandomValues(new Uint8Array(16))',
  },
  {
    id: 'math-random-security',
    severity: 'high',
    pattern: /Math\.random\s*\(\s*\)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\.|\/lib\/audit\//,
    message: 'Math.random() usage (verify it is not used for security-sensitive values)',
    exploitability: 'Math.random() is seeded deterministically; values are predictable',
    suggestion: 'For security: crypto.randomUUID() or crypto.getRandomValues(). Math.random() OK for UI only.',
  },
  {
    id: 'http-not-https',
    severity: 'medium',
    pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^'"]{4,}['"]/,
    fileGlob: ['.ts', '.js', '.json'],
    excludePattern: /\.(?:test|spec|example)\./,
    message: 'Plain HTTP URL to external service (man-in-the-middle risk)',
    exploitability: 'Traffic can be intercepted and modified by network-positioned attacker',
    suggestion: 'Use HTTPS for all external service URLs; enforce HSTS in production',
  },
]

const BUSINESS_LOGIC_PATTERNS: SecurityPattern[] = [
  {
    id: 'mass-assignment',
    severity: 'high',
    // Require supabase/db chaining (.from('x').update(body)) — avoids crypto HMAC false positives
    pattern: /\.from\s*\([^)]+\).*\.(?:update|insert|upsert)\s*\(\s*(?:req\.body|body|input|data)\s*(?:,|\))/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'DB operation receives entire request body (Mass Assignment risk)',
    exploitability: 'Attacker adds "role":"admin" or "organization_id":"..." to request body',
    suggestion: 'Destructure only allowed fields: const { name, bio } = req.body; use { name, bio }',
  },
  {
    id: 'idor-missing-org-check',
    severity: 'high',
    pattern: /\.(?:select|update|delete)\s*\([^)]*\)\s*\.\s*eq\s*\(\s*['"]id['"]\s*,\s*(?:params|query|body|req)\./,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'DB query filters only by ID without apparent organization_id check (IDOR risk)',
    exploitability: 'Attacker can access other organizations\' resources by guessing IDs',
    suggestion: 'Always add .eq("organization_id", orgId) when filtering by resource ID',
  },
  // missing-auth-in-route: removed — zeilenbasierter Scanner kann Auth-Imports nicht prüfen.
  // cat-3-rule-15 (checkAuthGuardConsistency) übernimmt diesen Check mit Import-Analyse.
]

const AI_SECURITY_PATTERNS: SecurityPattern[] = [
  {
    id: 'prompt-injection-system',
    severity: 'critical',
    pattern: /role:\s*['"]system['"]\s*,\s*content:\s*`[^`]*\$\{/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\.|\/audit\/checkers\//,
    message: 'User input interpolated into LLM system prompt (Prompt Injection risk)',
    exploitability: 'Attacker overrides AI instructions; can exfiltrate system prompts or bypass guardrails',
    suggestion: 'Keep system prompts static; pass user data only in the "user" role message',
  },
  {
    id: 'llm-output-eval',
    severity: 'critical',
    pattern: /(?:eval|innerHTML\s*=|dangerouslySetInnerHTML)[^;]*(?:completion|\.text\b|llmResponse|aiResult|gptResult|claudeResult|modelOutput)/i,
    fileGlob: ['.ts', '.tsx', '.js', '.jsx'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'LLM output passed to eval() or DOM injection (chained RCE/XSS)',
    exploitability: 'Prompt injection chains into code execution if LLM output reaches eval/innerHTML',
    suggestion: 'Treat LLM output as untrusted data; sandbox code execution (iframe), sanitize HTML',
  },
  {
    id: 'no-token-limit',
    severity: 'medium',
    pattern: /generateText\s*\(\s*\{(?:(?!maxOutputTokens)[^}])*\}\s*\)/,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'generateText() call without maxOutputTokens (unbounded cost/DoS risk)',
    exploitability: 'Attacker triggers expensive completions causing budget exhaustion or service disruption',
    suggestion: 'Always set maxOutputTokens to a reasonable limit (e.g., maxOutputTokens: 2048)',
  },
  {
    id: 'system-prompt-in-api',
    severity: 'medium',
    pattern: /(?:GET|POST)\s*['""]\/api\/.*prompt['""]|systemPrompt.*(?:req\.query|req\.body|params\.)/i,
    fileGlob: ['.ts', '.js'],
    excludePattern: /\.(?:test|spec)\./,
    message: 'System prompt potentially exposed or user-configurable via API',
    exploitability: 'Attacker extracts proprietary system prompt or replaces it with malicious instructions',
    suggestion: 'Store system prompts server-side only; never return them in API responses',
  },
]

const SUPPLY_CHAIN_PATTERNS: SecurityPattern[] = [
  {
    id: 'unpinned-dependency',
    severity: 'medium',
    pattern: /['"](?:dependencies|devDependencies)['"][^}]*:\s*['"][*^~]['"]/,
    fileGlob: ['.json'],
    excludePattern: /node_modules/,
    message: 'Unpinned dependency version (^, ~, or *) in package.json',
    exploitability: 'Malicious version published to npm is automatically pulled on next install',
    suggestion: 'Pin exact versions; use pnpm lockfile + Renovate for controlled upgrades',
  },
  {
    id: 'git-url-dependency',
    severity: 'high',
    pattern: /['"](?:git\+https?:|github:|gitlab:|bitbucket:|git:\/\/)[^'"]+['"]/,
    fileGlob: ['.json'],
    excludePattern: /node_modules/,
    message: 'Dependency sourced from Git URL instead of npm registry',
    exploitability: 'Git repositories can be force-pushed; no immutability guarantees like npm',
    suggestion: 'Publish package to npm; use specific version + integrity hash from registry',
  },
  {
    id: 'postinstall-script',
    severity: 'high',
    pattern: /"postinstall"\s*:\s*"[^"]*(?:curl|wget|bash|sh\s|eval|node\s+-e)/,
    fileGlob: ['.json'],
    excludePattern: /node_modules/,
    message: 'postinstall script executes shell commands (supply chain risk)',
    exploitability: 'Compromised postinstall script runs arbitrary code on every developer machine',
    suggestion: 'Audit all postinstall scripts; prefer packages without lifecycle scripts',
  },
  {
    id: 'typosquatting-risk',
    severity: 'high', // high: Malware-Risiko, Supply-Chain-Angriff
    pattern: /"(?:lod4sh|lodahs|reaact-dom|react-d0m|nextjs|expresss|express\.js|reqwest|axois|c0rs|coers)"\s*:/i,
    fileGlob: ['.json'],
    excludePattern: /node_modules/,
    message: 'Potential typosquatted package name detected',
    exploitability: 'Typosquatted packages contain malware that executes on install',
    suggestion: 'Verify package name on npmjs.com; check download count and repository link',
  },
]

// ── File Scanner (repoMap-based) ──────────────────────────────────────────────

type PatternSet = SecurityPattern[]

function scanFiles(
  ctx: AuditContext,
  patterns: PatternSet,
  fileFilter: (path: string) => boolean,
): Finding[] {
  const findings: Finding[] = []
  const allExtensions = [...new Set(patterns.flatMap((p) => p.fileGlob))]

  for (const file of ctx.repoMap.files) {
    if (!fileFilter(file.path)) continue
    if (!allExtensions.some((ext) => file.path.endsWith(ext))) continue

    const content = readSafe(ctx.rootPath, file.path)
    if (!content) continue

    findings.push(...scanPatterns(content, file.path, patterns, allExtensions))
  }
  return findings
}

function scanFilesFromProject(
  files: ProjectFile[],
  patterns: PatternSet,
): Finding[] {
  const findings: Finding[] = []
  const allExtensions = [...new Set(patterns.flatMap((p) => p.fileGlob))]

  for (const file of files) {
    if (!allExtensions.some((ext) => file.path.endsWith(ext))) continue
    findings.push(...scanPatterns(file.content, file.path, patterns, allExtensions))
  }
  return findings
}

// ── Exported Check Functions ──────────────────────────────────────────────────

// Exclude node_modules, tests, and audit checker files (they contain pattern strings that trigger themselves)
const SRC_FILTER = (p: string) =>
  !p.includes('node_modules') && !p.includes('.test.') && !p.includes('.spec.') &&
  !/(?:[\\/]|^)src[\\/]lib[\\/]audit[\\/]/.test(p)

export async function checkInjectionPatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, INJECTION_PATTERNS, SRC_FILTER)
  return makeResult('cat-3-rule-20', 'Injection (SQL/Cmd/Path/SSRF/XSS)', findings)
}

export async function checkAuthPatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, AUTH_PATTERNS, SRC_FILTER)
  return makeResult('cat-3-rule-21', 'Authentication (Secrets/Token-Storage/Crypto)', findings)
}

export async function checkDataExposurePatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, DATA_EXPOSURE_PATTERNS, SRC_FILTER)
  return makeResult('cat-3-rule-22', 'Data Exposure (Debug/Stack-Trace/Over-fetch)', findings)
}

export async function checkClientSidePatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, CLIENT_SIDE_PATTERNS, SRC_FILTER)
  return makeResult('cat-3-rule-23', 'Client-Side (eval/Prototype-Pollution/innerHTML)', findings)
}

export async function checkCryptoPatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, CRYPTO_PATTERNS, SRC_FILTER)
  return makeResult('cat-3-rule-24', 'Cryptography (Weak-Hash/Static-IV/HTTP)', findings)
}

export async function checkBusinessLogicPatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, BUSINESS_LOGIC_PATTERNS, SRC_FILTER)
  return makeResult('cat-3-rule-25', 'Business Logic (Mass-Assignment/IDOR/Auth-Guard)', findings)
}

export async function checkAiSecurityPatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, AI_SECURITY_PATTERNS, SRC_FILTER)
  return makeResult('cat-22-rule-8', 'AI Security (Prompt-Injection/Output-Eval/Token-Limit)', findings)
}

export async function checkSupplyChainPatterns(ctx: AuditContext): Promise<RuleResult> {
  const findings = scanFiles(ctx, SUPPLY_CHAIN_PATTERNS, SRC_FILTER)
  return makeResult('cat-24-rule-6', 'Supply Chain (Unpinned-Deps/Git-URLs/Postinstall)', findings)
}

// ── External Scan (ProjectFile[] — no disk access) ────────────────────────────

export interface SecurityScanFromFilesResult {
  injection: RuleResult
  auth: RuleResult
  dataExposure: RuleResult
  clientSide: RuleResult
  crypto: RuleResult
  businessLogic: RuleResult
  aiSecurity: RuleResult
  supplyChain: RuleResult
}

export function runSecurityScanFromFiles(files: ProjectFile[]): SecurityScanFromFilesResult {
  const all = [
    ...INJECTION_PATTERNS,
    ...AUTH_PATTERNS,
    ...DATA_EXPOSURE_PATTERNS,
    ...CLIENT_SIDE_PATTERNS,
    ...CRYPTO_PATTERNS,
    ...BUSINESS_LOGIC_PATTERNS,
    ...AI_SECURITY_PATTERNS,
    ...SUPPLY_CHAIN_PATTERNS,
  ]
  void all // consumed via individual calls below

  return {
    injection:     makeResult('cat-3-rule-20', 'Injection', scanFilesFromProject(files, INJECTION_PATTERNS)),
    auth:          makeResult('cat-3-rule-21', 'Auth', scanFilesFromProject(files, AUTH_PATTERNS)),
    dataExposure:  makeResult('cat-3-rule-22', 'Data Exposure', scanFilesFromProject(files, DATA_EXPOSURE_PATTERNS)),
    clientSide:    makeResult('cat-3-rule-23', 'Client-Side', scanFilesFromProject(files, CLIENT_SIDE_PATTERNS)),
    crypto:        makeResult('cat-3-rule-24', 'Cryptography', scanFilesFromProject(files, CRYPTO_PATTERNS)),
    businessLogic: makeResult('cat-3-rule-25', 'Business Logic', scanFilesFromProject(files, BUSINESS_LOGIC_PATTERNS)),
    aiSecurity:    makeResult('cat-22-rule-8', 'AI Security', scanFilesFromProject(files, AI_SECURITY_PATTERNS)),
    supplyChain:   makeResult('cat-24-rule-6', 'Supply Chain', scanFilesFromProject(files, SUPPLY_CHAIN_PATTERNS)),
  }
}
