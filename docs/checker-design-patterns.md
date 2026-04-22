# Checker Design Patterns

> Architektonische Referenz für die Entwicklung und Wartung von Audit-Checkern in Prodify.
> Jedes Pattern beschreibt einen Fehler-Typ, seinen Ursprung, die Lösung und einen
> verifizierten Praxis-Beleg aus dem Dogfooding-Prozess.
>
> **Version:** 1.0 — 2026-04-21
> **Quellen:** Dogfooding-Sessions 2026-04-14 bis 2026-04-21, checker-feedback.md, architect-log.md

---

## Wann dieses Dokument konsultiert wird

- Bevor ein neuer Checker geschrieben wird
- Wenn ein False Positive identifiziert wurde und das Pattern eingeordnet werden soll
- Wenn ein bestehender Checker überarbeitet wird
- Als Checkliste nach dem Schreiben (Abschnitt am Ende)

---

## Die Patterns

### P1 — Heuristik statt direkter Prüfung

**Symptom:** Der Checker verlässt sich auf strukturelle Merkmale (Pfad, Dateiname, Symbol-Existenz im Repo-Map) anstatt den Datei-Inhalt direkt zu lesen.

**Typischer Ursprung:** Der Entwickler möchte eine Datei-Lektüre sparen und nimmt an, dass Pfad-Muster ausreichend sind. Das Ergebnis: Der Checker trifft auf jede Datei mit dem richtigen Pfad zu, unabhängig davon, was darin steht.

**Lösung:** Die Datei mit `readContent(ctx, filePath)` lesen und inhaltliche Marker prüfen. Pfad-Muster als Vorfilter verwenden, nie als einzige Prüfung.

**Praxis-Beleg:** `checkServiceKeyInFrontend()` in `repo-map-checker.ts` prüfte ursprünglich ob eine Datei unter `src/app/` liegt als Indikator für "Client-Code" — false. Eine Server-Komponente unter `src/app/admin/` hat kein `'use client'` und darf `supabaseAdmin` nutzen. Fix: `readContent()` + `'use client'`-Direktive im Inhalt suchen.

#### P1.1 — Repo-Map-Index vs. direkter Dateisystem-Zugriff

**Symptom:** Checker prüft ob eine Datei existiert, die nicht als TS/TSX indexiert ist, und meldet fälschlich "Datei fehlt" — obwohl die Datei auf Disk vorhanden ist.

**Typischer Ursprung:** Der Repo-Map-Index enthält nur `.ts`/`.tsx`-Dateien (für schnelle Symbol- und Content-Analyse). Non-TS-Dateien wie `.env.example`, `CHANGELOG.md`, `CODEOWNERS`, `manifest.json`, Runbook-Markdown-Dateien, `sitemap.xml`, `robots.txt`, Service-Worker-Skripte etc. stehen dort grundsätzlich nicht. Wenn der Checker `ctx.filePaths.some(p => p.endsWith('.env.example'))` fragt, bekommt er immer `false` — unabhängig davon ob die Datei existiert.

**Lösung:** Für Non-TS-Existenzprüfungen die Utility `fileExists()` bzw. `fileExistsInAnyOf()` aus `src/lib/audit/utils/file-utils.ts` nutzen. Diese kapselt direkten Dateisystem-Zugriff via `existsSync` und behandelt `ctx.rootPath === undefined` (Benchmark-/In-Memory-Modus) korrekt mit `return false`.

```typescript
// Falsch — .env.example ist nie im Repo-Map-Index:
const hasExample = ctx.filePaths.some(p => p.endsWith('.env.example'))

// Richtig:
import { fileExists } from '../utils/file-utils'
const hasExample = ctx.filePaths.some(p => p.endsWith('.env.example'))
  || fileExists(ctx.rootPath, '.env.example')
```

**Faustregel:**
- **Content-Analyse von TS/TSX** → Repo-Map-Index + `readContent()`
- **Existenz-Prüfung von Non-TS-Dateien** → `fileExists()` / `fileExistsInAnyOf()`

**Praxis-Belege (alle 2026-04-21):**

| Checker | Datei | Session |
|---------|-------|---------|
| `checkWebManifest()` | `public/manifest.json` | 2026-04-21 |
| `checkEnvExample()` | `.env.example` | 2026-04-21 |
| `checkChangelog()` | `CHANGELOG.md` | 2026-04-21 |
| `checkBackupDocs()` | `docs/runbooks`, `docs/backup.md`, `RUNBOOK.md` | 2026-04-21 |
| `checkOfflineFallback()` | `public/sw.js`, `public/service-worker.js` | 2026-04-21 |
| `checkDeploymentDocs()` | `vercel.json`, `vercel.ts`, `Dockerfile`, `fly.toml` | 2026-04-21 |
| Utility-Konsolidierung | `src/lib/audit/utils/file-utils.ts` (Prompt 1) | 2026-04-21 |

---

### P2 — Unvollständiges Matching

**Symptom:** `content.match(pattern)` findet nur das erste Vorkommen. Checker zählt die Treffer (z.B. `imgNoLazy.length`) und liegt zu niedrig, oder übersieht ob ein Muster in einem strukturellen Kontext vorkommt.

**Typischer Ursprung:** `match()` gibt bei globalen Patterns ein Array zurück — aber nur bei Verwendung mit `/g`-Flag. Ohne `/g` liefert es entweder `null` oder ein Array mit einem Treffer plus Capture-Groups. Mit `/g` liefert es alle Treffer, aber nur als Strings, ohne Position.

**Lösung:** `[...content.matchAll(/pattern/g)]` für alle Treffer mit Position. Wenn der Kontext um jeden Treffer wichtig ist (Strukturprüfung), die Position für Slice-basierte Kontextprüfung nutzen.

**Praxis-Beleg:** `checkFetchInEffect()` in `state-deps-obs-checkers.ts` prüfte ursprünglich ob eine Datei *sowohl* `useEffect` *als auch* `fetch` enthält (Co-Occurrence). Das flaggte Dateien, die useEffect in einem anderen Kontext hatten als den Fetch. Fix: `matchAll(/useEffect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g)` — für jedes useEffect-Vorkommen den 600-Zeichen-Slice danach auf Fetch-Aufruf prüfen.

---

### P3 — Zu grobe Regex

**Symptom:** Das Regex-Pattern matcht korrekte Vorkommen, aber auch unschädliche Kontexte: String-Literale in Kommentaren, Konfigurationswerte, Typdefinitionen, Dokumentationsstrings.

**Typischer Ursprung:** Pattern werden auf dem "Happy Path" entwickelt — dem echten Problemfall. Andere Kontexte in denen dasselbe Token auftaucht werden nicht mitgedacht.

**Lösung:** Call-Site-Kontext in der Regex erzwingen:
- Für Importe: `from ['"]paketname['"]`
- Für Methodenaufrufe: `\bpaket\.\w+\s*\(`
- Für Funktionsaufrufe: `\bfunktionsname\s*\(`
- Nicht: nackter Bezeichner `paketname` ohne Kontext

**Praxis-Beleg:** `checkLLMTokenLimits()` in `category-gap-checkers.ts` hatte `generateText|streamText|chat\.create` als Pattern — ohne `\(`. Das matchte `Set(['generateText', 'streamText', ...])` in `graph-ranker.ts` (eine Datenstruktur, kein Funktionsaufruf). Fix: `generateText\s*\(|streamText\s*\(` — das `\(` erzwingt Funktionsaufruf-Kontext.

---

### P4 — Kulturell falsche Kalibrierung

**Symptom:** Der Checker flaggt Patterns, die in der Zielsprache oder dem Ziel-Framework idiomatisch sind. Entwickler, die Best Practices befolgen, werden bestraft.

**Typischer Ursprung:** Patterns aus allgemeinen Sicherheitsscannern (für mehrere Sprachen) werden unkritisch übernommen, ohne gegen sprachspezifische Idiome geprüft zu werden.

**Lösung:** Vor dem Finalisieren eines Patterns prüfen: Ist das in TypeScript/ESLint/framework-eslint als OK oder als Exception markiert? ESLint-Defaults und `typescript-eslint`-Empfehlungen sind gute Referenzen.

**Praxis-Beleg:** `== null` wurde in einem frühen Prototype als Sicherheits-Finding konzipiert. In TypeScript ist `value == null` der idiomatische Null-Check (trifft sowohl `null` als auch `undefined`), explizit von `typescript-eslint` als Exception in `eqeqeq`-Regel vorgesehen. Das Pattern wurde entfernt, bevor es in Produktion kam.

---

### P4.1 — Framework-blinde Kalibrierung (Spezialisierung von P4)

**Symptom:** Der Checker kennt das Framework (z.B. Next.js), ignoriert aber den Dateipfad-Kontext und Runtime-Unterschiede innerhalb des Frameworks. Gleiche Code-Patterns haben in verschiedenen Framework-Kontexten völlig unterschiedliche Semantik.

**Typischer Ursprung:** Ein Checker wird für React allgemein geschrieben und dann "Next.js-aware" gemacht — aber nur auf der Ebene der Suggestion-Texte, nicht auf der Ebene der Finding-Entscheidung.

**Drei Framework-Kontexte die unterschiedliche Guards brauchen:**
1. **Server Component** (Next.js App Router, kein `'use client'`): Manche Patterns sind dort unmöglich (useEffect läuft nicht). Finding wäre false positive.
2. **Client Component mit Framework-gebundener Logik** (Auth-State, Realtime, Browser APIs): Manche Patterns sind dort notwendig — kein RSC-Equivalent möglich. Finding wäre false positive.
3. **Client Component ohne Framework-spezifischen Bedarf**: Pattern ist Anti-Pattern. Finding ist echt.

**Lösung:** Framework-Kontext-Guards in dieser Reihenfolge prüfen:
```typescript
if (isNextJs) {
  const isAppRouterFile = /(?:[\\/]|^)(?:src[\\/])?app[\\/]/.test(file.path)
  if (isAppRouterFile) {
    if (/[\\/]api[\\/]/.test(file.path)) continue              // Route Handler: unmöglich
    const hasUseClient = content.includes("'use client'")
    if (!hasUseClient) continue                                  // Server Component: unmöglich
    if (CLIENT_STATE_INDICATORS.test(content)) continue         // Legitimer Client-State-Bedarf
  }
}
// Alle anderen Dateien: normales Finding
```

**Praxis-Beleg:** `checkFetchInEffect` (cat-9-rule-5) produzierte 56 Findings in TropenOS, davon der Großteil False Positives: Server Components (kein useEffect), Client Components mit `useAuth`/`supabase.channel`/`WebSocket`, API Route Handlers. Nach Framework-Guard: deutlich reduziert auf echte Fälle ohne Client-State-Bedarf. (checker-feedback.md, 2026-04-21)

---

### P5 — Pattern matcht im falschen Datei-Typ

**Symptom:** Der Checker findet das richtige Muster, aber in einer Datei wo dieses Muster harmlos oder erwünscht ist. Klassische Kandidaten: Audit-Infrastruktur selbst, Logger-Implementierungen, Type-Definition-Dateien, Next.js Error-Boundaries, Test-Fixtures.

**Typischer Ursprung:** `fileGlob: ['.ts', '.js']` ohne Pfad-Einschränkung erfasst auch die Checker-Dateien, die die Muster als String-Literale definieren, und Bibliotheksdateien die das Muster legitim nutzen.

**Lösung:** Zwei Mechanismen kombinieren:
1. `excludePattern: /Pfad\/zur\/AusnahmeRegex/` für bekannte harmlose Pfade
2. `includePattern: /Pfad\/zum\/ZielBereich/` wenn der Check nur für einen bestimmten Kontext sinnvoll ist (positive Allowlist schlägt negative Excludes)

Obligatorische Excludes für jeden neuen Security-Scanner:
- `/\.(?:test|spec)\./` — Test-Dateien
- `/\/lib\/audit\//` — Audit-Infrastruktur (enthält Pattern-Strings als Literale)
- Für HTTP-Response-bezogene Checks: `includePattern: /(?:\/app\/api\/|\/pages\/api\/).*\.[jt]sx?$/`

**Praxis-Beleg 1:** `math-random-security` in `security-scan-checker.ts` flaggte `finding-recommendations.ts` — dieser enthält `'Math.random() ist deterministisch'` als String in einer deutschen Erklärung, kein Aufruf. Fix: `excludePattern: /\.(?:test|spec)\.|\/lib\/audit\//`.

**Praxis-Beleg 2:** `select-star-api` scannte alle `.ts`-Dateien und produzierte 42 False Positives aus `src/actions/`, `src/lib/`, `scripts/`, `supabase/functions/`. Fix: `includePattern: /(?:\/app\/api\/|\/pages\/api\/).*\.[jt]sx?$/` — nur echte HTTP-Handler. (architect-log.md, 2026-04-20)

---

### P6 — Silent Read-Failure

**Symptom:** Ein Checker kann eine Datei nicht lesen (Datei nicht im Cache, rootPath nicht gesetzt, Datei außerhalb des Repo-Maps) und gibt `score: 5` zurück. Der User sieht eine saubere Bewertung für eine Kategorie, die nie wirklich geprüft wurde.

**Typischer Ursprung:** `readContent()` gibt `null` zurück wenn eine Datei nicht lesbar ist. Checker die darauf nicht reagieren, überspringen die Datei still und akkumulieren keine Violations → kein Finding → Pass.

**Warum das schlimmer ist als ein False Positive:** Ein False Positive erzeugt Aufwand. Eine Silent Failure erzeugt falsches Vertrauen — der User denkt, die Kategorie sei geprüft und in Ordnung.

**Lösung:**
1. Die `readContent()`-Hilfsfunktion **muss** einen Disk-Fallback haben:
   ```typescript
   function readContent(ctx: AuditContext, relPath: string): string | null {
     if (ctx.fileContents) {
       const c = ctx.fileContents.get(relPath)
       if (c !== undefined) return c
     }
     if (ctx.rootPath) {
       try { return readFileSync(join(ctx.rootPath, relPath), 'utf-8') } catch { return null }
     }
     return null
   }
   ```
2. Wenn ein Checker nach dem Lesen aller Dateien *null content* für alle hatte, soll er `score: null` (unevaluated) zurückgeben, nicht `pass(id, 5, '...')`.

**Praxis-Beleg:** `final-category-checkers.ts` hatte eine `readContent()`-Funktion ohne Disk-Fallback. `checkAPITimeouts()` und `checkUnlimitedQueries()` konnten keine Route-Dateien lesen → null Violations → score=5 für alle. Beim Fix des Fallbacks: `checkAPITimeouts()` fiel von score=5 auf score=2 (14 echte Findings). Das war nicht eine Regression — das war die erste korrekte Messung. Fix: `readFileSync`-Fallback ergänzt.

---

### P7 — Import-Graph-Abhängigkeit auf leerer Datenstruktur

**Symptom:** Checker verwendet `file.imports.some(...)` oder `file.exports` — Felder im Repo-Map die strukturell vorhanden sind, aber nie befüllt werden.

**Typischer Ursprung:** Die Repo-Map-Datenstruktur hat Import-Felder im TypeScript-Interface. Der Entwickler nimmt an, diese seien befüllt. In Wirklichkeit serialisiert `generate-repo-map.ts` diese Felder nicht, weil der AST-Parse-Schritt sie weglässt (nur `path`, `size`, `symbols`, `loc` werden geschrieben).

**Konsequenz:** Jede Bedingung auf `file.imports` ist immer `false` → Check schlägt immer fehl (oder besteht immer, je nach Logik).

**Lösung:** Immer `readContent(ctx, file.path)` + Regex/Substring-Suche statt Abhängigkeit vom Import-Graphen. Content-basierte Erkennung ist zuverlässiger und benötigt keine Vorverarbeitung.

**Praxis-Beleg 1:** `checkRateLimiting()` in `agent-security-checker.ts` prüfte `f.imports.some(imp => imp.target.includes('ratelimit'))` — immer false. Ergebnis: Rate Limiting war korrekt in `proxy.ts` implementiert, aber der Checker gab score=2 ("nicht konfiguriert"). Fix: `readFileSafe(ctx.rootPath, 'src/proxy.ts')` + Regex auf `Ratelimit\.slidingWindow`.

**Praxis-Beleg 2:** `checkBudgetEnforcement()` und `checkServiceKeyInFrontend()` in `repo-map-checker.ts` hatten dasselbe Problem. Alle drei Fixes: Content-basierte Erkennung via `readContent()`.

---

### P8 — Too-broad String Matching

**Verwandt mit P3**, aber spezifisch für Fälle wo der gesuchte String selbst ein valides Bezeichner-Token ist das in verschiedenen Kontexten auftaucht.

**Symptom:** Pattern wie `openai|anthropic|fetch` matchen in:
- Enum-Werten: `VALID_PROVIDERS = ['openai', 'anthropic']`
- Kommentar-Erklärungen: `// Dieses Modul nutzt openai für ...`
- Typdeklarationen: `type Provider = 'openai' | 'anthropic'`
- Import-Pfaden anderer Packages: `from '@/lib/openai-wrapper'`

**Lösung:** Mindestens einer der folgenden Kontext-Anker:
- Import-Statement: `from ['"]openai['"]` oder `require\(['"]openai['"]\)`
- Methoden-Aufruf: `openai\.\w+\s*\(`
- Funktionsaufruf: `\bopenai\s*\(`
- Für fetch: `\bfetch\s*\(` (mit word boundary, verhindert `prefetch`)

**Praxis-Beleg:** `checkAPITimeouts()` in `final-category-checkers.ts` hatte `hasExternalCall = /fetch\s*\(|openai|anthropic|axios/i.test(content)`. Route `admin/models/route.ts` enthielt `const VALID_PROVIDERS = ['openai', 'anthropic', 'mistral', 'google']` — kein API-Aufruf, nur Konfiguration. Wurde als "LLM-Route ohne Timeout" geflagt. Fix: `from ['"]openai['"]|from ['"]@anthropic|generateText\s*\(|streamText\s*\(`.

---

### P9 — Geteilte Logik ohne Utility

**Symptom:** Drei oder mehr Checker implementieren dieselbe Entscheidungslogik unabhängig voneinander. Wenn ein Edge-Case gefunden wird, muss die Korrektur an mehreren Stellen repliziert werden — und wird es meist nicht.

**Typische Kandidaten für geteilte Logik:**
- "Ist das eine List-Route?" (excludiert Single-Resource, Config, Cron)
- "Ist das eine Next.js API Route?" (App Router + Pages Router)
- "Ist das ein Client-Component?" (`'use client'`-Check)
- "Ist das eine LLM-Route?" (Import + Aufruf-Pattern)

**Lösung:** Wenn zwei oder mehr Implementierungen derselben Logik divergieren → Extraktion in `src/lib/audit/utils/`. Alle Checker importieren von dort. Die Utility-Datei wird zur einzigen Quelle der Wahrheit.

**`src/lib/audit/utils/` ist das kanonische Verzeichnis für geteilte Checker-Logik.**
Neue Utilities folgen derselben Struktur: eine `.ts`-Datei + eine `.unit.test.ts`-Datei im selben Verzeichnis.

**Praxis-Beleg (2026-04-21):** `isListRoute()` existierte in zwei Checkern mit divergierenden Implementierungen:
- `agent-committee-checker.ts` (Pagination-Check): 26 NON_LIST_SEGMENTS, dynamic-parent check, cron check, hyphen check
- `final-category-checkers.ts` (Unlimited-Queries-Check): 19 NON_LIST_SEGMENTS, ohne dynamic-parent, cron, oder Hyphen-Checks

Als der Edge-Case "dynamisches Parent-Segment" (`/[id]/outcomes/`) gefunden wurde, wurde der Fix nur in `agent-committee-checker.ts` eingepflegt. `final-category-checkers.ts` hatte den gleichen Bug weiterhin.

Fix: `isListRoute()` extrahiert nach `src/lib/audit/utils/route-utils.ts`. Canonical = raffinierte Version aus `agent-committee-checker.ts`. 22 Unit-Tests. Score-Auswirkung: neutral (86.9% → 86.9%).

**Praxis-Beleg 2 (2026-04-21):** `ctx.rootPath ? existsSync(join(ctx.rootPath, '...')) : false`-Pattern trat 6× in `gap-checkers.ts` und `final-category-checkers.ts` auf — identisch, aber ohne geteilte Logik. Als der `.env.example`-Checker gefixt wurde, war der `checkOfflineFallback()`-Checker noch nicht migriert. Fix: `fileExists()` + `fileExistsInAnyOf()` extrahiert nach `src/lib/audit/utils/file-utils.ts`. Zweite Shared Utility im Utils-Verzeichnis, etabliert als Standard für Non-TS-Datei-Existenz-Prüfung (siehe P1.1).

---

### P10 — Unvollständige Pattern-Listen

**Symptom:** Checker mit einer festen Liste bekannter Strings/Pfade deklariert "nicht gefunden" wenn keiner der bekannten Patterns matcht — auch wenn eine semantisch equivalente Alternative vorhanden ist.

**Typischer Ursprung:** Die Liste wurde bei Entwicklung mit bekannten Konventionen befüllt. Projekte die andere, aber valide Konventionen verwenden, werden fälschlich als nicht-compliant bewertet.

**Lösung:** Hybrid-Ansatz:
1. Bekannte Patterns als Liste (schnell, explizit)
2. Heuristik als Fallback: Wenn keine bekannten Patterns matchen, suche nach semantisch plausiblen Kandidaten
3. Bei plausiblen Kandidaten: `pass` mit Hinweis ("möglicherweise vorhanden — manuell prüfen") statt hartes Fail

**Praxis-Beleg:** `checkAiTransparency()` in `compliance-checker.ts` kannte nur drei Disclosure-Pfade: `/ai-disclosure`, `/ki-hinweis`, `/ai-transparency`. Das Projekt hatte `/responsible-ai/` — inhaltlich identisch, aber nicht in der Liste. Ergebnis: score=1 ("keine Disclosure") obwohl eine vollständige responsible-AI-Seite vorhanden war. Fix: Liste auf 6 Patterns erweitert + Fallback auf `cmsg-avatar-toro`/`assistant-avatar` in Chat-Komponenten (Toro-Avatar als valide Content-Labeling-Form erkannt).

---

### P11 — Hardcodierte Regel-ID stimmt nicht mit Registry-Eintrag überein

**Symptom:** Checker-Funktion `checkFoo()` ist in `rule-registry.ts` unter Rule-ID `cat-X-rule-Y` registriert, hardcodiert intern aber `cat-X-rule-Z` (eine andere Regel). Befunde erscheinen in der DB unter der falschen Rule-ID, und die falsche `agentSource` aus der Registry wird per Fallback übernommen.

**Typischer Ursprung:** Die Regel-ID in der Funktion wurde beim ursprünglichen Schreiben korrekt gesetzt. Später wurde die Rule-Registry-Tabelle neu nummeriert oder die Funktion in eine andere Regel verschoben, ohne die interne Hardcodierung zu aktualisieren.

**Konsequenz:** Zwei parallel laufende Fehler:
1. Die falsche Regel-ID `cat-X-rule-Z` sammelt Befunde, die zu ihr nicht gehören (Score und agentSource der falschen Regel)
2. Die korrekte Regel `cat-X-rule-Y` hat 0 Befunde — der Score ist immer 5 (fälschlich "alles gut")

**Lösung:** Regel-ID in der Funktion (`pass()`/`fail()`-Aufrufe) an den Registry-Eintrag angleichen. Goldene Regel: Die ID in `pass()`/`fail()` muss identisch mit dem `id`-Feld des Registry-Eintrags sein, der die Funktion als `check` registriert.

**Praxis-Beleg (2026-04-22):** `checkErrorHandling()` hardcodierte `cat-2-rule-10` (Strict Equality), war aber in der Registry unter `cat-2-rule-16` (Error-Handling vollständig) registriert. `checkErrorBoundary()` hardcodierte `cat-2-rule-11` (Lighthouse Best Practices), war aber unter `cat-2-rule-17` (Error Boundary vorhanden) registriert. Beide Befunde wurden falscher agentSource zugeordnet; die richtigen Regeln zeigten immer score=5.

**Präventionsregel:** Beim Verschieben oder Umbenennen einer Checker-Funktion IMMER alle `pass()`/`fail()`-Aufrufe in ihr auf die neue Rule-ID aktualisieren. Beim Schreiben einer neuen Funktion IMMER den Registry-Eintrag zusammen mit der Funktion anlegen, nie nachträglich.

---

### P12 — Cross-Platform Command Execution (Windows ENOENT)

**Symptom:** `execFileSync('pnpm', ...)` oder `spawnSync('pnpm', ...)` wirft `ENOENT` auf Windows, obwohl `pnpm` in einer Shell korrekt funktioniert. Der Checker gibt `null` zurück (kein Ergebnis) für jeden Check der auf pnpm/npm/npx/yarn basiert.

**Typischer Ursprung:** `execFileSync`/`spawnSync` verwenden intern `CreateProcessW` auf Windows. Diese API löst PATHEXT (`.cmd`, `.exe`, `.bat`) **nicht** automatisch auf — das macht nur die Shell (`cmd.exe`/PowerShell). Node CLI-Tools wie pnpm, npm, npx, yarn sind auf Windows als `.cmd`-Batch-Skripte installiert. `'pnpm'` → ENOENT, `'pnpm.cmd'` → funktioniert.

**Warum das heimtückisch ist:** Die ENOENT wird im `catch`-Block von `run()` abgefangen und gibt `null` zurück. Der Checker interpretiert `null` als "Tool nicht installiert" und gibt `nullResult()` zurück — kein Score, kein Finding. Auf Windows wurden daher alle vier externen Tools (depcruise, Lighthouse, ESLint, pnpm audit) nie tatsächlich ausgeführt, was die historischen Audit-Scores auf Windows verzerrt hat.

**Betroffene Tools:** `pnpm`, `npm`, `npx`, `yarn` — **nicht** `git`, `gitleaks` oder andere native Binaries (diese haben kein .cmd-Wrapper-Problem).

**Lösung (zweistufig):**

Schritt 1 — Korrekter Dateiname via `platformCommand`:
```typescript
import { platformCommand, resolveNodeCli } from '../utils/platform-utils'
run(platformCommand('pnpm'), args, cwd)          // → 'pnpm.cmd' auf win32
runner(resolveNodeCli('pnpm', ctx.rootPath), args, cwd)  // mit .bin-Lookup
```

Schritt 2 — `shell: true` auf Windows, damit `cmd.exe` das `.cmd`-Skript interpretiert:
```typescript
// In der run()-Hilfsfunktion:
const shell = process.platform === 'win32'
execFileSync(cmd, args, { cwd, timeout, encoding: 'utf-8', shell })
```

**Warum beide Schritte nötig sind:** `platformCommand` liefert den korrekten Dateinamen (`pnpm.cmd`). Aber `CreateProcessW` — das Node.js intern für `execFileSync` nutzt — kann `.cmd`-Dateien NICHT direkt ausführen (nur `.exe`/`.com`). `.cmd`-Dateien sind Batch-Skripte die `cmd.exe` zur Interpretation brauchen. Erst `shell: true` fügt `cmd.exe /c` als Wrapper hinzu und macht die Ausführung möglich. Ohne `shell: true` scheitert der Aufruf sofort — auch wenn der Dateiname korrekt ist.

**Praxis-Beleg (2026-04-22):** Erster Fix (nur `platformCommand`) → Audit noch immer in ~1s fertig, keine Lighthouse-Findings. Zweiter Fix (`shell: true` in `run()` + `defaultRunCommand`) → Audit dauert >20s, alle vier externen Tools laufen durch.

**Präventionsregel:** Nie `execFileSync('pnpm', ...)` ohne `shell: true` auf Windows. `git` und native `.exe`-Binaries sind ausgenommen (die laufen direkt). `execSync('pnpm ...', { shell: true })` (mit Shell-String) ist kein Problem, da Shell immer aktiv ist.

---

### P13 — Security-Checker: Pattern-Matching statt Keyword-Matching

**Symptom:** Ein Sicherheits-Checker flaggt Dateien die über Security-Regeln *schreiben*, nicht Security-Regeln *verletzen*. Klassischer Kontext: Rule-Pack-Definitionen, Agent-System-Prompts, Engineering-Standard-Dokumente als Template-String-Literale im Quellcode.

**Typischer Ursprung:** Keyword-basierte Patterns (`/secret|key|token/i`) matchen auf das bloße Vorkommen des Wortes, unabhängig vom strukturellen Kontext. Eine Datei die LLM-Agenten instruiert "schau bei API Keys auf..." enthält dasselbe Vokabular wie eine Datei die tatsächlich einen API Key hardcodet.

**Lösung:** Jedes Secret-Detection-Pattern braucht einen strukturellen Anker der echte Credential-Zuweisungen von Fließtext unterscheidet:

1. **Zuweisung erzwingen:** `keyword\s*[:=]\s*['"][8+ chars]['"]` — schon besser als reines Keyword-Matching, aber nicht ausreichend wenn Prompt-Text zufällig diese Struktur nachahmt (Beispiel-Code im Prompt)
2. **Bekannte Präfixe als zweiten Layer:** `sk-`, `eyJ`, `AKIA`, `xoxb-`, `ghp_` — diese Präfixe kommen in Dokumentationstext nicht natürlich vor. Ein Match hier ist zuverlässiger als keyword-basiertes Matching
3. **Documentation-Container ausschließen:** Dateien in `src/scripts/agent-gen-*`, `*-defs.ts` mit Template-String-Literalen, `docs/` — diese Pfade enthalten Dokumentation/Regel-Packs, keine Produktions-Credentials

**Komitee-spezifische Beobachtung:** Diese Fehlerklasse ist resistent gegen LLM-Konsens-Korrekturen. Alle LLMs haben im Training gelernt "Security-Vokabular in Datei → Credential-Risiko". Wenn alle Modelle dieselbe Heuristik teilen, bestätigen alle Modelle den False Positive — kein Modell korrigiert das andere. Dies ist ein **Common-Mode-Failure**: Multi-Model-Konsens multipliziert die Fehlerzuverlässigkeit statt sie zu erhöhen. Deterministische Exclusion-Rules im Checker-Code sind in dieser Klasse zuverlässiger als LLM-Mehrheiten.

**Praxis-Beleg (2026-04-22):** `hardcoded-secret` (cat-3-rule-21) wurde vom Multi-Model Komitee (4 Reviewer + Opus-Judge) als Finding für `src/scripts/agent-gen-defs.ts` gemeldet. Die Datei enthält LLM-System-Prompts die Agenten instruieren welche Security-Regeln zu prüfen sind — das erzeugt Security-Vokabular als Instruktions-Text, nicht als Credential-Zuweisung. Kein Modell hat widersprochen. Fix: `excludePattern` um `[\\/]scripts[\\/]agent-gen` erweitert.

---

### P14 — Threshold-Heuristik ohne Semantik-Check

**Symptom:** Der Checker zählt ein strukturelles Merkmal (Prop-Anzahl, Zeilen, Import-Count) und flaggt bei Überschreitung eines Schwellwerts — ohne zu prüfen, ob das gemessene Merkmal tatsächlich das Problem beschreibt das gemeldet werden soll.

**Typischer Ursprung:** Schwellwert-basierte Checks sind schnell zu schreiben und haben auf einfachen Fällen gute Recall-Werte. Sobald aber die Codebasis größer wird, flaggen sie viele Fälle die den Schwellwert überschreiten, das Problem aber strukturell nicht haben (Large-Interface-Komponenten, Konfigurations-Objekte, etc.).

**Lösung:** Den Semantik-Check hinzufügen, der den echten Problemfall vom strukturell ähnlichen False-Positive-Fall unterscheidet.

**Klassische Beispiele:**
- Prop-Count > 10 als Indikator für Prop-Drilling → stattdessen `propName={propName}` Identity-Forwarding suchen
- Zeilen > 300 als Indikator für God Component → stattdessen multiple unabhängige Verantwortlichkeiten detektieren
- Import-Count > 15 als Indikator für zu enge Kopplung → stattdessen betrachten ob die Imports thematisch kohärent sind

**Praxis-Beleg (2026-04-22):** `checkPropDrilling()` in `state-deps-obs-checkers.ts` flaggte jede Komponente mit >10 Props. `FindingsTable.tsx` hatte 12 Props und wurde als "prop drilling" gemeldet — alle 12 Props werden tatsächlich IN der Komponente genutzt, keiner wird weiter durchgereicht. Fix: Ersetze Prop-Count-Heuristik durch `propName={propName}`-Identity-Forwarding-Detektion (≥3 Props, die unverändert an Kinder weitergereicht werden).

---

### P15 — Kumulative Metrik misst das Falsche

**Symptom:** Checker summiert alle Dateien eines Typs und vergleicht das Ergebnis mit einem Schwellwert der für einen ganz anderen Scope gilt. Projekte mit vielen Routen/Modulen überschreiten den Schwellwert immer — egal wie gut optimiert sie sind.

**Typischer Ursprung:** Die Metrik-Definition stammt aus einer anderen Messgröße (z.B. "Initial Load JS < 400 KB" aus Browser-Dokumentation) und wird direkt auf alle verfügbaren Build-Artefakte angewendet, ohne den Geltungsbereich der ursprünglichen Metrik zu berücksichtigen.

**Lösung:** Den Geltungsbereich der Metrik klären und nur die relevanten Datei-Typen summieren.

**Typisches Beispiel:** `.next/static/chunks/` enthält Server-Chunks, alle Lazy-Load-Chunks aller Routen und die Initial-Load-Chunks. Nur letztere sind für "Initial Load JS" relevant.

**Praxis-Beleg (2026-04-22):** `checkBundleSizes()` in `external-tools-checker.ts` summierte alle `.js`-Dateien in `.next/static/chunks/` → 17 MB für eine 50+ Route App → immer Score 1. Das 400 KB-Target gilt nur für den Initial Load (framework + main + polyfills). Fix: Filterung auf `framework-*.js`, `main-*.js`, `polyfills-*.js`, `webpack-*.js`.

---

### P16 — Konventions-Ausnahmen fehlen in der Whitelist

**Symptom:** Ein Naming-Convention-Checker flaggt Dateien deren Namen bewusst von der Konvention abweichen — durch eine dokumentierte Projekt-Konvention, einen Framework-Standard oder ein explizites Muster für Spezial-Dateien.

**Typischer Ursprung:** Der Checker implementiert die Haupt-Konvention korrekt, aber nicht die Ausnahmen. Diese werden oft in einem anderen Kontext (z.B. God-Component-Check) bereits behandelt, aber nicht in den Naming-Check übertragen.

**Lösung:** Whitelist aufbauen und pflegen: Framework-reservierte Namen (`page`, `layout`, `error`), Bibliotheks-Konventionen (`shadcn/ui` kebab-case), Projekt-Konventionen (Underscore-Prefix für Reference-Dateien wie `_DESIGN_REFERENCE.tsx`).

**Warum Underscore-Prefix valide ist:** Das Unix-Convention für "private/internal" (z.B. `_private.py`), Next.js Private Folder Convention, eigene Codebase-Konventionen für Referenz-/Design-Dateien.

**Praxis-Beleg (2026-04-22):** `checkNamingConventions()` in `repo-map-checker.ts` flaggte `_DESIGN_REFERENCE.tsx` als PascalCase-Verletzung. Die Datei ist bewusst mit Underscore-Prefix benannt (in CLAUDE.md dokumentiert als Design-Referenz-Datei). `isExemptFile()` whitelistete bereits diese Datei für God-Component-Checks — aber nicht für Naming-Checks. Fix: `/^_[A-Z]/`-Guard in der PascalCase-Bedingung.

---

### P17 — Feature-blinde Auditierung (Frozen Path Problem)

**Symptom:** Der Checker produziert Findings für Code-Bereiche die nicht mehr aktiv gewartet werden — eingefrorne Features, deaktivierte Routen, Legacy-Pfade die noch existieren aber nicht in der Produktnavigation sind. Die Findings sind technisch korrekt, aber für den aktuellen Produktfokus nicht handlungsrelevant.

**Typischer Ursprung:** Der Checker kennt nur den Code, nicht den Produktstatus. Er scannt alle Dateien gleichmäßig und hat kein Konzept von "Diese Route ist eingefroren bis wir Q3 weiterentwickeln."

**Konsequenz:** Entwickler sehen viele Findings zu Code den sie bewusst nicht anfassen — das Rauschen senkt die Qualität aller anderen Findings. "Was soll ich als nächstes fixen?" ist nicht mehr zu beantworten wenn 40% der Findings zu eingefrorenem Code gehören.

**Lösung (Approach B — keine Datenmodell-Änderung):**
1. `AuditOptions.frozenPaths?: string[]` — Pipeline-Konfiguration für eingefrorne Pfade
2. `runAudit()` markiert Findings aus diesen Pfaden mit `finding.frozen = true`
3. Persistenz-Layer setzt diese Findings auf `status='dismissed', not_relevant_reason='frozen-path'`
4. UI zeigt sie nicht in der "Offen"-Ansicht — aber der User kann sie explizit über den "Nicht relevant"-Filter aufrufen

**CLI-Nutzung:**
```bash
pnpm exec tsx src/scripts/run-audit.ts --frozen-paths agenten,feeds,workspaces,chat,projects
```

**Wichtig:** Frozen Paths werden per `.includes()` gematcht — Substring, nicht Prefix. `'agenten'` matcht `src/app/agenten/`, `src/modules/agenten/` und alle anderen Pfade die den String enthalten.

**Praxis-Beleg (2026-04-22):** Tropen OS hatte 187 Findings im Refactoring-Run. Dogfooding-Analyse ergab: ~40+ Findings aus eingefrornenen Feature-Routen (`/agenten`, `/feeds`, `/workspaces`, `/chat`, `/artifacts`, `/projects`). Diese waren technisch korrekt, aber nicht handlungsrelevant für den aktuellen Produkt-Sprint. Mit `--frozen-paths`-Flag werden sie automatisch dismissed.

---

## Pattern-Übergreifende Prinzipien

Diese Regeln gelten immer, unabhängig vom konkreten Pattern:

**1. Silent Failure ist gefährlicher als ein False Positive.**
Ein FP erzeugt Rauschen. Ein Silent Failure (score=5 weil nichts gelesen werden konnte) erzeugt falsches Vertrauen. Im Zweifel lieber `score: null` (unevaluated) als `score: 5`.

**2. Call-Site-Kontext ist der Default, nicht die Ausnahme.**
Jedes Pattern auf einen String-Token sollte diesen Token in einem Aufruf-, Import- oder Deklarations-Kontext verankern. Nackter Bezeichner = Rauschen.

**3. Content beats Metadata.**
Repo-Map-Felder wie `f.imports`, `f.exports`, `f.symbols` können unvollständig sein. `readContent(ctx, path)` mit Regex ist zuverlässiger als indexierte Metadaten.

**4. Geteilte Logik ab drei Vorkommen.**
Wenn dieselbe Bedingung in drei Checkern auftaucht: sofort in `src/lib/audit/checkers/utils.ts` extrahieren. Redundante Implementierungen divergieren.

**5. Pattern-Listen sind grundsätzlich unvollständig.**
Jede feste Liste von Patterns, Pfaden oder Schlüsselwörtern wird beim nächsten Projekt eine valide Alternative verpassen. Hybrid aus Liste + Heuristik-Fallback ist besser als nur die Liste.

**6. Checker scannen sich selbst.**
Audit-Infrastruktur in `src/lib/audit/` enthält Pattern-Strings als String-Literale (für Erklärungs-Texte, Suggestions, Test-Fixtures). Security-Scanner und Pattern-Matcher müssen `excludePattern: /\/lib\/audit\//` oder äquivalent haben.

**7. Existenz-Prüfung ist nicht dasselbe wie Content-Analyse.**
Der Repo-Map-Index ist für TS/TSX-Content, nicht für Datei-Existenz im Allgemeinen. `ctx.filePaths` ist der falsche Ort für Non-TS-Dateien. `fileExists()` aus `src/lib/audit/utils/file-utils.ts` ist die richtige Abstraktionsschicht für direkten Dateisystem-Zugriff (siehe P1.1).

---

## Checkliste für neue Checker

Vor dem Commit eines neuen Checkers alle Punkte abhaken:

```
Lesbarkeit
[ ] Wird die Datei tatsächlich mit readContent() gelesen, nicht nur ihr Pfad geprüft?    (P1)
[ ] Gibt readContent() bei Nicht-Lesbarkeit null zurück, wird das Ergebnis geprüft?      (P6)
[ ] Wird bei null-Ergebnis für alle Dateien score: null zurückgegeben, nicht score: 5?   (P6)

Matching
[ ] Werden alle Vorkommen gefunden? matchAll() mit /g statt match()?                     (P2)
[ ] Hat das Pattern Call-Site-Kontext (from '...', \w+\.\w+\s*\(, etc.)?                (P3, P8)
[ ] Ist das Pattern gegen TypeScript/ESLint-Idiome kalibriert?                           (P4)

Datei-Scope
[ ] Sind /lib/audit/ und /\.(?:test|spec)\./ via excludePattern ausgeschlossen?          (P5)
[ ] Wenn der Check nur für HTTP-Handler gilt: includePattern /\/api\// gesetzt?           (P5)
[ ] Verlässt sich der Checker NICHT auf f.imports oder f.exports?                        (P7)

Architektur
[ ] Teilt der Checker Entscheidungslogik mit anderen Checkern? → utils.ts nutzen         (P9)
[ ] Enthält der Checker eine feste Pattern-Liste? → Heuristik-Fallback ergänzt?         (P10)
[ ] Selbst-Test: Produziert der Checker auf seinen eigenen Quellcode keine FPs?          (P5)
[ ] Non-TS-Datei-Existenz: wird fileExists() aus file-utils.ts genutzt, nicht ctx.filePaths? (P1.1)

Regel-ID Konsistenz
[ ] Stimmt die Rule-ID in pass()/fail() mit dem id-Feld im Registry-Eintrag überein?    (P11)
[ ] Wurde der Registry-Eintrag zusammen mit der Funktion angelegt (nicht nachträglich)?  (P11)

Cross-Platform
[ ] Wird execFileSync/spawnSync mit platformCommand() statt rohem 'pnpm'/'npm' aufgerufen? (P12)
[ ] Nur für pnpm/npm/npx/yarn — git und native Binaries sind ausgenommen               (P12)

Security-Pattern-Qualität
[ ] Hat jedes Secret-Detection-Pattern einen strukturellen Anker (Zuweisung oder bekannte Präfixe)?  (P13)
[ ] Sind Documentation-Container (agent-gen-defs, *-defs.ts, docs/) im excludePattern?               (P13)
[ ] Selbst-Test: Flaggt der Checker keine System-Prompts / Rule-Pack-Definitionen?                    (P13)

Metrik-Kalibrierung
[ ] Wird nur die semantisch relevante Teilmenge von Dateien/Werten gemessen? (nicht alle Artefakte)  (P15)
[ ] Wenn ein Schwellwert existiert: kommt er aus der gleichen Mess-Definition wie der Checker?        (P15)
[ ] Sind Konventions-Ausnahmen in der Whitelist? (Framework-Namen, Bibliotheks-Konventionen, _ALLCAPS) (P16)

Produkt-Kontext
[ ] Werden Findings aus eingefrornenen Pfaden via frozenPaths ausgefiltert oder explizit markiert?     (P17)
```

---

## Verwandte Dokumente

| Dokument | Inhalt |
|----------|--------|
| `docs/checker-feedback.md` | Log von gemeldeten False Positives und Fixes (Einzelfälle) |
| `docs/checker-test-repos.md` | 5 Benchmark-Repos für Checker-Regression-Tests |
| `docs/manual-checks.md` | 64 manuelle Checks die per Design nicht automatisierbar sind |
| `src/lib/audit/checkers/` | Alle Checker-Implementierungen |
| `src/lib/audit/rule-registry.ts` | Regel-Definitionen mit Gewichtung und Check-Funktion |
