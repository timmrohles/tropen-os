# Killer-Detektor-Strategien 2026-05-04

> **Datum:** 2026-05-04
> **Anlass:** ADR-027 Schritt 2 — AST-Detektoren für 4 Killer-Kriterien
> **Status:** Review-Bereit
> **Zeitaufwand Phase 1:** ~45 Minuten

**Wichtige Vorarbeit:** Für alle 4 Killer-Kriterien gibt es bereits Basis-Implementierungen in den bestehenden Checkern:
- Secrets: `security-scan-checker.ts` (HARD-CODED-SECRET-Pattern, cat-3-rule-X)
- SQL-Injection: implizit in security-scan-checker.ts
- Auth-Check: `agent-security-checker.ts:checkAuthGuardConsistency` (cat-3-rule-15) — bereits mit Stub-Erkennung!
- CORS: `agent-security-checker.ts:checkCorsConfig` (cat-3-rule-18)

**Empfehlung:** Killer-Detektoren sind keine neuen Checker, sondern **Erweiterungen bestehender Findings** um das `isKiller: true`-Flag. Die Detection-Logik ist bereits vorhanden und kalibriert. Das minimiert FP-Risiko.

---

## Detektor 1 — Hardcoded Secrets

### Kontext aus ADR-027
- **Profil-Aktivierung:** Universal (alle Profile)
- **Schwellwert:** Binär
- **Coach-Wording:**
  > "🛑 Stopper: API-Key direkt im Code gefunden. Jeder mit Repo-Zugriff kann den Key lesen — auch nach Löschen bleibt er in der Git-History. Key in .env.local verschieben, in .gitignore aufnehmen und beim Provider rotieren."

### Detection-Pattern

**Bestehende Basis:** `security-scan-checker.ts` Pattern `hardcoded-secret`:
```
/(?:password|secret|api_?key|jwt_?secret|access_?token|private_?key|client_?secret)\s*[:=]\s*['"][^'"${\s]{8,}['"]/i
```

**Ergänzende Patterns für Killer-Version:**
```typescript
// Stripe-Schlüssel (Live-Keys = definitiv kein Test-Code)
/sk_live_[a-zA-Z0-9]{20,}/
/rk_live_[a-zA-Z0-9]{20,}/

// Anthropic API Key
/sk-ant-[a-zA-Z0-9-_]{20,}/

// OpenAI API Key
/sk-[a-zA-Z0-9]{20,}(?!["'])/  // achtung: Stripe-Keys auch sk-

// Supabase Service Role Key (JWT, beginnt mit eyJ)
// Nur service_role, nicht anon key (der ist public by design)
/service_role.*eyJ[A-Za-z0-9+/]{20,}/

// Generic: lange Hex/Base64-Strings in Assignments (>40 Zeichen, keine Template-Refs)
/(?:key|secret|token|password)\s*[:=]\s*['"][a-zA-Z0-9+/]{40,}['"]/i
```

**Beispiel-Code, der triggern soll:**
```typescript
const anthropicClient = new Anthropic({ apiKey: 'sk-ant-api03-xxxx' })
const secret = 'my-super-secret-password-123'
const stripeKey = 'sk_live_51ABC...'
```

### Allowlist-Regeln

1. **Publishable/Anon Keys (public by design):**
   - Stripe publishable keys: `pk_live_*`, `pk_test_*` → erlaubt (öffentlich)
   - Supabase anon key: in `NEXT_PUBLIC_*` Variablen → erlaubt
   - Stripe webhook endpoint secret in tests: erlaubt wenn in `.test.ts`

2. **Test-Dateien:** `*.test.ts`, `*.spec.ts`, `**/__tests__/**` → excludiert

3. **Example/Template-Dateien:** `.env.example`, `.env.sample`, `*.example.*` → excludiert

4. **scripts/ mit direkten API-Keys (bewusste Ausnahme per checker-feedback.md):**
   - `src/scripts/` → **bewusst excludiert** (CLAUDE.md: scripts use direct API keys, gateway billing not configured)

5. **Placeholder-Werte:**
   ```typescript
   'your-api-key-here', 'xxx', 'placeholder', 'INSERT_HERE', 'CHANGEME'
   ```
   → excludiert (String-Inhalt-Prüfung)

6. **Kommentare und Docs:** Strings in Kommentarblöcken → excludiert

**Beispiel-Code, der NICHT triggern soll:**
```typescript
// src/scripts/generate-agents.ts — bewusst excludiert
const key = process.env.ANTHROPIC_API_KEY   // env-ref, kein Wert
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // public
const pkLive = 'pk_live_...' // publishable, erlaubt
const testSecret = 'fake-secret-for-test'  // in *.test.ts
```

### Stub-Erkennung
Keine spezifische Stub-Erkennung nötig — Pattern ist inhärent präzise.

### FP-Risiken

| FP-Risiko | Wahrscheinlichkeit | Mitigation |
|-----------|-------------------|------------|
| Supabase anon key in code (public by design) | Mittel | Allowlist: NEXT_PUBLIC_* Variablen-Namen |
| Scripts-Bereich mit direkten Keys | Hoch | Allowlist: src/scripts/ excludiert |
| Base64-kodierte nicht-geheime Daten | Niedrig | Pattern ist keyword-basiert, nicht rein längenbasiert |
| Test-Fixtures mit Fake-Keys | Mittel | Allowlist: *.test.ts excludiert |

**Geschätzte FP-Rate bei Self-Audit:** 0% (wenn Allowlists korrekt, alles in .env)

### Test-Cases

1. ✅ `const apiKey = 'sk-ant-api03-realkey'` → triggert (echter Key im Code)
2. ❌ `const key = process.env.ANTHROPIC_API_KEY` → triggert nicht (env-Referenz)
3. ❓ `const anonKey = 'eyJhbGci...'` (Supabase anon key) → triggert NICHT wenn `NEXT_PUBLIC_`-Kontext; **Edge-Case: triggert wenn in regulärer Variable ohne NEXT_PUBLIC_-Kontext** — das wäre ein echter Befund

---

## Detektor 2 — SQL-Injection-Risiko

### Kontext aus ADR-027
- **Profil-Aktivierung:** Universal (alle Profile)
- **Schwellwert:** Binär
- **Coach-Wording:**
  > "🛑 Stopper: Query-String-Konkatenation gefunden. Das ermöglicht SQL-Injection über User-Input. Prepared Statements oder Query-Builder wie Drizzle nutzen."

### Detection-Pattern

**Schlüssel-Erkenntnis:** Tropen OS verwendet Supabase Query Builder + Drizzle ORM — beide sind safe by design. SQL-Injection-Risiko entsteht nur bei Raw-SQL mit Variablen.

**Pattern:**
```typescript
// Template-Literal direkt in .query() oder äquivalenten Raw-SQL-Calls
/\.query\s*\(\s*`[^`]*\$\{/
/\.execute\s*\(\s*`[^`]*\$\{/

// String-Konkatenation in SQL-ähnlichen Kontexten
/(?:SELECT|INSERT|UPDATE|DELETE|WHERE|FROM)\s+.*\+\s*(?:req\.|params\.|body\.|query\.)/i

// neon() Raw SQL mit Interpolation (wenn verwendet)
/neon\s*\([^)]*\)\s*`[^`]*\$\{/
```

**Wichtige Ausnahme: Drizzle `sql` tagged template ist SAFE:**
```typescript
import { sql } from 'drizzle-orm'
sql`SELECT * FROM users WHERE id = ${userId}`  // SAFE — parametrisiert!
```

**Beispiel-Code, der triggern soll:**
```typescript
const result = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)
const query = 'SELECT * FROM ' + tableName + ' WHERE id = ' + userId
```

### Allowlist-Regeln

1. **Drizzle `sql` tagged template:** Pattern `import.*sql.*drizzle-orm` → Datei ist safe, sql-Tags excludieren
2. **Supabase Query Builder:** `.from()`, `.select()`, `.eq()`, `.filter()` → kein Raw-SQL
3. **Test-Dateien:** `*.test.ts`, `*.spec.ts` → excludiert
4. **String-Interpolation in Nicht-SQL-Strings:** nur triggern wenn SQL-Keywords vorhanden
5. **Template-Strings in Logging:** `console.log(\`Query: ${q}\`)` → nicht SQL-Injection

**Beispiel-Code, der NICHT triggern soll:**
```typescript
// Drizzle — safe
const result = await db.query.users.findMany({ where: eq(users.id, userId) })
const raw = sql`SELECT * FROM users WHERE id = ${userId}`  // Drizzle parametrisiert

// Supabase — safe
const { data } = await supabase.from('users').select('*').eq('id', userId)
```

### Stub-Erkennung
Keine spezifische Stub-Erkennung nötig.

### FP-Risiken

| FP-Risiko | Wahrscheinlichkeit | Mitigation |
|-----------|-------------------|------------|
| Drizzle `sql` tagged template fälschlich als SQL-Injection | Hoch | Import-Detection: Drizzle-sql-Tag ist safe |
| String-Konkatenation in Log-Messages | Mittel | Pattern prüft SQL-Keywords |
| Schema-Migrations-SQL mit Variablen | Niedrig | Migrations-Pfad excludieren |

**Geschätzte FP-Rate bei Self-Audit:** 0% (Tropen OS nutzt nur Supabase QB + Drizzle)

### Test-Cases

1. ✅ `db.query(\`WHERE id = ${userId}\`)` → triggert (Raw-SQL-Interpolation)
2. ❌ `sql\`WHERE id = ${userId}\`` (Drizzle import vorhanden) → triggert nicht (parametrisiert)
3. ❓ `supabase.rpc('fn', { id: userId })` → triggert nicht (RPC ist safe)

---

## Detektor 3 — API-Routes ohne Auth-Check

### Kontext aus ADR-027
- **Profil-Aktivierung:** Multi-User (Profile 4–5), strikt binär PLUS Stub-Erkennung
- **Schwellwert:** Jede einzelne Route ohne Auth ist ein Killer-Finding (nicht 20%-Schwelle)
- **Spaltungs-Entscheidung:** strikt binär PLUS automatische Stub-Erkennung (410/404/501-Only excludiert)

### Wichtige Beobachtung
`checkAuthGuardConsistency` (cat-3-rule-15) in `agent-security-checker.ts` **existiert bereits** und hat bereits Stub-Erkennung! Der bestehende Checker findet `audit/tasks/*` schon korrekt als FP-frei.

**Killer-Version unterscheidet sich in:**
- `isKiller: true` auf den Findings
- Keine Schwellwert-Logik (jede fehlende Route = Killer, nicht Prozentsatz)
- Expliziteres Stub-Pattern

### Detection-Pattern

Basis: Import-Analyse aus Repo-Map (`f.imports`). Route wird als "hat Auth" gewertet wenn:
```typescript
imp.symbols.includes('getUser') ||
imp.symbols.includes('requireAuth') ||
imp.symbols.includes('getAuthUser') ||
imp.symbols.includes('createClient') ||
imp.target.includes('supabase') ||
imp.target.includes('auth') ||
imp.target.includes('guards')
```

**Stub-Erkennung (bereits in Basis-Checker vorhanden, übernehmen):**
```typescript
const hasOnlyErrorResponses = content.length > 0
  && /status:\s*[45]\d\d/.test(content)
  && !/\.from\s*\(|supabase|getUser|createClient|fetch\s*\(/.test(content)
```

**Public-Route-Ausschlüsse (bereits in Basis-Checker vorhanden):**
```typescript
const publicPrefixes = [
  '/api/public/', '/api/auth/', '/api/health', '/api/webhooks/',
  '/api/s/', '/api/cron/', '/api/artifacts/transform',
]
```

**Beispiel-Code, der triggern soll:**
```typescript
// src/app/api/some-sensitive/route.ts
export async function GET(req: Request) {
  const data = await supabaseAdmin.from('sensitive_table').select()
  return NextResponse.json(data)  // KEIN getUser()!
}
```

### Allowlist-Regeln

1. **Public-Prefixes** (bestehende Liste aus Basis-Checker)
2. **Stub-Routes** (410/404/501-Only, kein Datenzugriff)
3. **Beta-Waitlist-Route** (`/api/beta/waitlist`) — intentionally public (POST ohne Auth)
4. **Webhook-Endpoints** — oft legitimerweise ohne User-Auth (kommen von externen Services)
5. **Cron-Routes** — verwenden CRON_SECRET statt User-Auth

**Beispiel-Code, der NICHT triggern soll:**
```typescript
// 410-Stub — excludiert
export async function GET() {
  return NextResponse.json({ error: 'Gone', code: 'GONE' }, { status: 410 })
}

// Public webhook — excludiert via publicPrefixes
// src/app/api/webhooks/stripe/route.ts
```

### FP-Risiken

| FP-Risiko | Wahrscheinlichkeit | Mitigation |
|-----------|-------------------|------------|
| Routes mit API-Key-Auth statt User-Auth | Mittel | Header-Pattern-Check: X-API-Key, Authorization: Bearer (non-JWT) |
| Service-to-Service Routes (interne APIs) | Niedrig | In bestehender publicPrefixes-Liste |
| Beta-Waitlist (intentionally public) | Hoch | Explizite Allowlist für `/api/beta/waitlist` |
| Audit-Trigger (öffentlich zugänglich für Org?) | Niedrig | Hat createClient() → wird nicht gemeldet |

**Geschätzte FP-Rate bei Self-Audit:** 1–3 Findings, davon 0–1 echte FPs (bestehende Stub-Erkennung ist gut)

### Test-Cases

1. ✅ Route mit `supabaseAdmin.from()` aber ohne `getUser()` → triggert (Killer)
2. ❌ 410-Stub ohne Datenzugriff → triggert nicht (Stub-Erkennung)
3. ❓ `/api/beta/waitlist` POST ohne Auth → triggert nicht (Allowlist)

---

## Detektor 4 — Open CORS auf Public Endpoints

### Kontext aus ADR-027
- **Profil-Aktivierung:** Public (Profile 3–5)
- **Schwellwert:** Binär
- **Coach-Wording:**
  > "🛑 Stopper: CORS auf '*' gesetzt. Jede Website kann deine API aufrufen und User-Sessions kapern. Origin auf deine Domain beschränken."

### Wichtige Beobachtung
`checkCorsConfig` (cat-3-rule-18) in `agent-security-checker.ts` **existiert bereits**. Pattern sucht nach Wildcard-Origin.

**Bestehende Detection:**
```typescript
combined.includes("'*'") && (combined.includes('cors') || combined.includes('Access-Control'))
```

**Ergänzende Patterns:**
```typescript
// Next.js headers()-API mit Wildcard
/Access-Control-Allow-Origin.*['"]\*['"]/
// Middleware mit cors-Paket
/origin:\s*['"]\*['"]/
/cors\s*\(\s*\{[^}]*origin:\s*true/  // origin: true = any
```

**Beispiel-Code, der triggern soll:**
```typescript
headers: { 'Access-Control-Allow-Origin': '*' }
cors({ origin: '*' })
cors({ origin: true })
```

### Allowlist-Regeln

1. **Öffentliche Asset-Endpoints ohne Auth und ohne User-Daten:** 
   - CDN-ähnliche Endpunkte die nur statische Daten zurückgeben
   - Aber: im Zweifel lieber triggern — User soll aktiv bestätigen
   
2. **Development-only Configs (NODE_ENV check):**
   ```typescript
   if (process.env.NODE_ENV !== 'production') cors({ origin: '*' })
   ```
   → nicht triggern (prod-gated)

3. **Test-Dateien:** `*.test.ts` → excludiert

4. **Kommentare und Dokumentation:** Pattern in Strings die nicht als Wert verwendet werden

**Beispiel-Code, der NICHT triggern soll:**
```typescript
// Dev-only — prod-gated
if (process.env.NODE_ENV !== 'production') {
  res.setHeader('Access-Control-Allow-Origin', '*')
}

// In Kommentar: "don't use origin: '*' in production"
```

### Stub-Erkennung
Keine spezifische Stub-Erkennung nötig.

### FP-Risiken

| FP-Risiko | Wahrscheinlichkeit | Mitigation |
|-----------|-------------------|------------|
| Wildcard in Kommentar-String (Warnhinweis) | Niedrig | Kontext-Prüfung: ist es ein Assignment? |
| Dev-only CORS (NODE_ENV-Check) | Mittel | Pattern: NODE_ENV-Check in gleichem Kontext |
| Dokumentations-Beispiele | Niedrig | In Kommentar-Blöcken excludiert |

**Geschätzte FP-Rate bei Self-Audit:** 0% (Tropen OS verwendet Vercel-natives CORS-Handling)

### Test-Cases

1. ✅ `cors({ origin: '*' })` in middleware.ts → triggert
2. ❌ Wildcard nur in Kommentar: `// don't use '*'` → triggert nicht
3. ❓ `if (isDev) cors({ origin: '*' })` → triggert NICHT (dev-gated), ✅ korrekte Entscheidung

---

## Übergreifende Beobachtungen

### Beobachtung 1 — Basis-Checker bereits vorhanden
Alle 4 Killer-Kriterien haben **bereits Basis-Implementierungen** in den bestehenden Checkern. Der kleinste sichere Schritt ist nicht "neue Checker schreiben" sondern "bestehende Findings um `isKiller: true` erweitern" plus Stub-Erkennung verbessern wo nötig. Das drastisch reduziert FP-Risiko.

### Beobachtung 2 — Tropen OS selbst ist wahrscheinlich Killer-frei
- Secrets: alles in .env.local (scripts/ excludiert per Allowlist)
- SQL-Injection: Supabase QB + Drizzle, kein Raw-SQL mit Interpolation
- Auth-Check: bestehender Checker findet < 3 FPs
- CORS: Vercel-natives Handling, kein Wildcard

Erwartete Killer-Findings nach Implementation: **0–2** (alle wahrscheinlich Stub-FPs oder Allowlist-Lücken)

### Beobachtung 3 — P4-Pattern-Risiko bei Secrets-Detektor
Der Secrets-Detektor ist anfällig für P4-Pattern: er könnte Keys in String-Literalen erkennen die in Kommentaren oder Doku-Strings stehen. Kontext-Prüfung (ist es ein Assignment?) ist Pflicht.

---

## Empfohlene Implementations-Reihenfolge

**Empfehlung: 4 → 1 → 3 → 2**

1. **CORS (4)** — einfachste Detection, geringstes FP-Risiko, bestehender Checker fast vollständig
2. **Hardcoded Secrets (1)** — hoher Coach-Wert, klare Allowlists, 0% FP-Erwartung wenn scripts/ excludiert
3. **Auth-Check (3)** — bestehender Checker ist Basis, nur isKiller-Flag + Schwellwert-Logik anpassen
4. **SQL-Injection (2)** — erfordert Drizzle-Import-Detection, komplexeste Allowlist-Logik

**Rationale:** Simpelstes zuerst (schnelle Erfolge), Komplexestes zuletzt (Drizzle-Kontext-Erkennung braucht mehr Sorgfalt).

---

## Offene Fragen für Timm-Review

1. **scripts/-Ausnahme für Secrets:** `src/scripts/` verwenden laut `checker-feedback.md` direkte API-Keys. Soll das als globale Ausnahme in der Allowlist stehen, oder soll der Detektor diese Dateien melden und der User manuell bestätigen?

2. **Profil-Gating im Checker:** Auth-Check und CORS sind nur für Profile 3–5 / 4–5 relevant. Da wir noch kein Profil-System haben (ADR-027 Schritt 5 ist nach diesem Sprint): sollen Killer-Detektoren **jetzt schon** Profil-Gating haben, oder alle Findings pauschal als `isKiller: true` markieren und Profil-Gating im UI-Pivot (Schritt 6) konfigurieren?

3. **isKiller-Flag Sichtbarkeit:** Bis zum UI-Pivot (ADR-027 Schritt 6) wird `isKiller: true` in der Datenstruktur gesetzt aber noch nicht UI-mäßig hervorgehoben. Ist das OK, oder soll ein minimales UI-Signal sofort kommen?
