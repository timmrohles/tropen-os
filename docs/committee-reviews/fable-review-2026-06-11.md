# Fable-5-Review — TropenOS
Datum: 2026-06-11
Modell: `claude-fable-5`
Input: 36.461 Tokens | Output: 10.286 Tokens
Kosten: $0.8789 (~€0.8174)
Dauer: 141.5s

---

# Technisches Assessment: TropenOS

**Reviewer:** Unabhängiger Senior-Architekt · **Basis:** Repo Map, CLAUDE.md, ARCHITECT.md, Roadmap, Engineering Standard, Manifest

---

## 1. Executive Summary

TropenOS ist eine Production-Readiness-Audit-Plattform für Vibe-Coder — Next.js 15 / React 19 / Supabase / Claude — mit einem eigenen 255-Regeln-Audit-System, das das Projekt auf sich selbst anwendet (Self-Score: 96,70%). Der Reifegrad ist für ein faktisch von einer Person getriebenes Projekt bemerkenswert hoch, vor allem in Prozess-Disziplin, Dokumentation und Abstraktions-Hygiene. Gleichzeitig trägt das Projekt zwei strukturelle Hypotheken: ein Datenzugriffsmodell, das RLS systematisch umgeht und Autorisierung in ~80 Route-Handler dezentralisiert, und eine massive eingefrorene Feature-Substanz (Workspaces, Feeds, Agents, Chat, Cockpit — 113+ Migrationen) unter einem MVP, das offiziell aus drei Features besteht. Der Gesamteindruck: ein außergewöhnlich reflektiertes Projekt, dessen größtes Risiko die Diskrepanz zwischen dokumentierter Disziplin und tatsächlich erzwungener Disziplin ist.

---

## 2. Architektur-Stärken

**Adapter-Disziplin (Principle 4 wird gelebt, nicht nur behauptet).** E-Mail über `src/lib/email/` (Resend ↔ Nodemailer austauschbar), Monitoring über `src/lib/monitoring/`, Rate Limiting über `src/lib/ratelimit/`, LLM-Zugriff zwangskanalisiert über `src/lib/llm/anthropic.ts` mit explizitem Verbot, `@anthropic-ai/sdk` direkt zu importieren. Das ist genau die Kapselung, die bei Provider-Preiserhöhungen oder Self-Hosting-Anforderungen den Unterschied macht.

**Konsistente API-Fehlerbehandlung als Bibliothek.** `apiError()`, `apiValidationError()`, `validateBody()` mit Zod, `parsePaginationParams()` mit Limit-Cap — die Querschnittsbelange sind zentralisiert statt per Route copy-gepastet. Das sieht man in dieser Konsequenz selten.

**Budget-Enforcement als First-Class-Concern.** `check_and_reserve_budget` als RPC mit Reservierung (nicht nur Post-hoc-Tracking), HTTP 402 mit `BUDGET_EXHAUSTED`-Code, Enforcement-Status-Tabelle pro Route in der Doku, Kostenschätzungen in `src/lib/budget.ts`. Für ein LLM-Produkt mit 95%-Margen-Ziel ist das die richtige Priorität.

**SSRF-Guard existiert (`src/lib/feeds/ssrf-guard.ts`).** Server-seitige Fetches mit User-URLs sind die klassische Lücke in KI-generierten Codebases — hier wurde sie proaktiv adressiert und sogar in den eigenen Engineering Standard kodifiziert.

**Prozess-Selbstkorrektur.** Die Pivot-Disziplin-Sektion dokumentiert die eigenen Fehler vom 27.–29. April (drei Pivots in 48h, "tsc + lint grün" als Schein-Validierung) und leitet nicht-verhandelbare Regeln ab. Das ist organisationale Reife, die in den meisten Teams mit 20 Leuten nicht existiert.

**Echtes Dogfooding mit externem Benchmark.** 49 Fremd-Repos (Lovable/Bolt/Cursor/manuell) per Tarball-API gescannt, Ergebnisse in DB mit `is_benchmark`-Flag, Phase 2.5 erzwingt Validierung der Engine vor weiterem Polish. Die Sequenz-Constraint "Validierung vor Polish-Sprint-B" ist genau richtig.

---

## 3. Kritische Verbesserungspotenziale

### 3.1 supabaseAdmin als universeller Datenpfad — RLS ist faktisch dekorativ 🔴

**Problem:** Die Constraint "Alle Queries via `supabaseAdmin`" (Service Role, bypasses RLS) bedeutet: Row-Level Security existiert in der Datenbank, schützt aber keinen einzigen API-Pfad. Jede der ~80 Routes muss Autorisierung manuell implementieren — `verifyProjectAccess()`, `canWriteWorkspace()`, `requireWorkspaceAccess()` existieren, aber nichts *erzwingt* ihren Aufruf.

**Warum kritisch:** Eine einzige vergessene Ownership-Prüfung = horizontaler Datenleak über Organisationen hinweg. Das ist exakt OWASP API #1 (Broken Object Level Authorization) — die Regel, die euer eigener Engineering Standard als Pflicht listet. Ein Produkt, das anderen Security-Audits verkauft, kann sich diesen Fund im eigenen Pentest nicht leisten.

**Lösung:** Higher-Order-Wrapper als Pflicht-Pattern: `withProjectAccess(handler)`, `withOrgAdmin(handler)` — Route-Handler ohne Wrapper schlagen im eigenen Audit-Checker fehl (ihr habt die Infrastruktur dafür!). Mittelfristig: für Read-Pfade auf den anon-Client mit User-Session umstellen, sodass RLS als Defense-in-Depth greift; `supabaseAdmin` nur für legitime Service-Operationen (Cron, Webhooks, Aggregationen).

### 3.2 Duplizierte Auth- und Client-Infrastruktur 🔴

**Problem:** `getAuthUser()` existiert zweimal mit unterschiedlichen Signaturen (`src/lib/api/projects.ts` vs. `src/lib/api/workspaces.ts`). Dazu drei Supabase-Client-Quellen: `src/utils/supabase/server.ts`, `src/lib/supabase/server.ts` (`createServiceClient`) und `src/lib/supabase-admin.ts`.

**Warum kritisch:** Duplizierte Auth-Helper driften. Wenn `getAuthUser` in projects.ts eine Prüfung bekommt, die workspaces.ts nicht hat, entsteht eine asymmetrische Sicherheitslücke, die kein Reviewer sieht. Drei Client-Pfade verstärken 3.1: niemand weiß auf einen Blick, welche Route mit welcher Privilegienstufe in die DB geht.

**Lösung:** Ein `src/lib/auth/` Modul mit *einer* `getAuthUser()`, ein kanonischer Service-Client, die anderen als Re-Exports deprecaten und per ESLint-Regel (`no-restricted-imports`) blockieren.

### 3.3 Eingefrorene Substanz ist live erreichbare Angriffsfläche 🔴

**Problem:** Workspaces, Feeds, Agents, Conversations, Artifacts, Cockpit, Capabilities — alles "unter MVP eingefroren", aber die API-Routes sind deployed und erreichbar: `/api/agents/webhook/[agent_id]`, fünf Cron-Routes, und vor allem **`/api/debug/feeds` mit GET und POST**. Euer eigener Standard sagt wörtlich: "Debug-Endpoints und Beispiel-Routes aus Produktion entfernen."

**Warum kritisch:** Eingefrorener Code wird nicht gewartet, aber er authentifiziert, parst Input und schreibt in die DB. Das ist die schlechteste Kombination: volle Attack Surface, null Aufmerksamkeit. Vor Beta-Einladungen ist das ein Blocker.

**Lösung:** Vor Beta: `/api/debug/*` löschen (nicht flaggen — löschen). Eingefrorene Feature-Routes hinter einem Server-seitigen Feature-Flag mit 410-Response konsolidieren (das 410-Pattern habt ihr bereits im Backlog). Die Phase-4-Entscheidung "re-aktivieren/löschen" nicht bis Phase 4 schieben, soweit es Routes betrifft — Daten können warten, Endpoints nicht.

### 3.4 Budget-Check fail-open + Alert "TODO: manuell" 🟠

**Problem:** "RPC-Fehler → Aufruf erlaubt" ist als Design dokumentiert. Der Anthropic-Console-Alert bei $100 ist als TODO markiert. Kombination: fällt der Budget-RPC aus (DB-Latenz, Migration, Bug), läuft Spend unbegrenzt und unbemerkt.

**Lösung:** Fail-open behalten, aber begrenzen: bei RPC-Fehler ein In-Memory/Redis-Zähler mit hartem Notfall-Cap pro Org pro Stunde. Sentry-Alert auf jeden Budget-RPC-Fehler. Den Console-Alert heute konfigurieren — das ist eine 5-Minuten-Aufgabe, die seit März als TODO steht.

### 3.5 Self-Audit-Score-Zirkularität: 96,7% vs. 820 Lint-Warnings vs. 183 offene Findings 🟠

**Problem:** Der Score wird mit `--skip-cli` gemessen — also ohne genau die externen Tools (depcruise, gitleaks, ESLint-detailed), die unbequeme Wahrheiten liefern würden. Gleichzeitig dokumentiert die Roadmap selbst 820 Lint-Warnings und ~183 offene Code-Qualität-Findings. "Production Grade 96,7%" und "820 Warnings" können nicht beide das Produktversprechen tragen.

**Warum kritisch:** Das ist nicht nur intern unsauber — es ist das Kernprodukt. Wenn Beta-User merken, dass der Hersteller seinen eigenen Score im Easy-Mode misst, ist die Coach-Autorität beschädigt. Ihr habt das Risiko erkannt ("Self-Audit-Score validiert Code, nicht Produkt"), aber die Zahl 96,70% steht prominent in CLAUDE.md als Erfolgsausweis.

**Lösung:** Den offiziellen Score nur noch mit `--with-tools` kommunizieren. Den `--skip-cli`-Score als "Fast-Check" labeln. Die 820 Warnings vor Beta auf <100 bringen — das ist die in Phase 2 geplante Welle, sie sollte vorgezogen werden.

### 3.6 Keine sichtbare Test-Infrastruktur 🟠

**Problem:** Die Repo Map zeigt keinerlei Test-Dateien, keine `__tests__`, keine Vitest/Playwright-Spuren. Testing ist Kategorie 10 des eigenen Standards. "BP-E2E-Hygiene-1" ist geplant, aber nachgelagert. Die Audit-Engine selbst — Checker, Scoring-Formel, AST-Detektoren — ist die geschäftskritischste Logik und offenbar ungetestet.

**Warum kritisch:** Der Score-Architektur-Refactor (ADR-027) hat die Scoring-Logik umgebaut. Ohne Regression-Tests weiß niemand, ob die 49-Repo-Benchmark-Scores vor und nach dem Refactor vergleichbar sind. Falsche Scores = falsches Produkt.

**Lösung:** Minimal-Invest mit maximalem Hebel: Snapshot-Tests für die Scoring-Formel (`score = Σ(rule_score × weight)/...`) plus Fixture-Repos (3–5 synthetische Mini-Projekte mit bekannten, handverifizierten Findings) als Golden-Master für die Checker. Kein 80%-Coverage-Ziel — gezielt die Engine absichern.

### 3.7 Design-System per Checkliste statt per Tooling 🟡

**Problem:** 25-Punkte-UI-Pflichtcheck in Prosa, Inline-Style-Objekte (`const s: Record<string, React.CSSProperties>`) statt Komponenten, Tailwind installiert aber nur für Globals. Die Durchsetzung hängt davon ab, dass ein LLM ohne persistentes Gedächtnis jedes Mal eine Checkliste liest — was ARCHITECT.md selbst als Versagensmodus benennt.

**Lösung:** Die Top-Verbote (Hex-Farben, fremde Icon-Libs, `div onClick`, türkis) als ESLint-Regeln (`no-restricted-syntax`, `no-restricted-imports`) kodieren. Eine Checkliste, die eine Maschine prüfen kann, gehört in die Maschine — das ist euer eigenes Principle 7.

---

## 4. Architekturelle Bedenken (mittelfristig)

**Doppelte Schema-Wahrheit: Drizzle + Supabase-Migrationen.** Schema in `src/db/schema.ts` (Drizzle, nur für Typen), reale DB-Evolution in `supabase/migrations/`. Nichts garantiert Synchronität. In 6 Monaten driftet das Drizzle-Schema, und die "Typen" lügen über die Datenbank. Entweder Drizzle-Schema aus der DB generieren (introspection in CI) oder konsequent auf Supabase-generierte Typen umstellen.

**Type-Sprawl.** `src/lib/types.ts`, `src/types/*`, `src/db/schema.ts`, `src/lib/workspace-types.ts` — vier Quellen für Domänentypen, teilweise überlappend (Workspace existiert in schema.ts und types/workspace.ts). Das wird bei jedem Schema-Change zu Inkonsistenz-Jagden.

**Inline-Styles skalieren nicht.** Keine Media Queries, keine Pseudo-States, keine Theming-Fähigkeit in `React.CSSProperties`-Objekten. "Mobile-Verhalten 7 Tabs prüfen" steht nicht zufällig im Backlog — das Pattern macht Responsive strukturell teuer. Bevor das Produkt eine Mobile-Story braucht, sollte mindestens für neue Komponenten ein CSS-Modules- oder Tailwind-Pfad geöffnet werden.

**Prozess-Overhead vs. Solo-Realität.** ARCHITECT.md verlangt bis zu 26 Dokumente Pflicht-Lektüre pro Build. Das wird real entweder übersprungen oder performativ abgehakt — beides untergräbt die Autorität des Protokolls. Besser: 5 Dokumente hart verpflichtend, Rest kontextabhängig per Faustregel (die existiert ja schon, sollte aber die Hauptregel sein, nicht die Fußnote).

**Bus-Faktor 1.** Principle 10 ("Systems must survive their Creators") ist ausgerechnet der Punkt, an dem das Projekt am schwächsten ist. Die Doku ist exzellent, aber sie ist auf einen Workflow (Timm + Claude Code) zugeschnitten. Ein zweiter Mensch könnte heute nicht produktiv einsteigen, ohne die gesamte Doku-Archäologie (active/ vs. archive/ vs. synthese/ vs. adr/ vs. decisions/) zu durchdringen — die Anti-Verstreuungs-Regel kam erkennbar zu spät.

**Modell-Namen als Streu-Konstanten.** Modell-Strings stehen in Doku-Tabellen, Scripts und vermutlich Routen verteilt. Ein zentrales `src/lib/llm/models.ts` mit benannten Konstanten (`MODELS.CHAT`, `MODELS.CHEAP`, `MODELS.JUDGE`) würde den nächsten Modell-Wechsel von einem Grep-Marathon zu einem Einzeiler machen.

---

## 5. Überraschende Beobachtungen

**Positiv: Die dokumentierte Selbstkritik ist außergewöhnlich.** Projekte dokumentieren Erfolge; dieses dokumentiert Versagen ("drei Pivots in 48h", "Hand-Overs versteckten reale Bugs") mit Datum und abgeleiteten Regeln. Das ist Post-Mortem-Kultur auf Konzern-Niveau in einem Solo-Projekt.

**Positiv: Multi-Model-Komitee mit Kostentransparenz.** 4-Modell-Review + Opus-Judge mit Centgenau dokumentierten Kosten (€0,35–0,50 pro Review) ist ein origineller QA-Mechanismus — und die Kostendisziplin dabei (Cost Awareness, Kategorie 20) wird tatsächlich gelebt.

**Verdächtig: `redact(_value: unknown): string`.** Der Underscore-Prefix signalisiert einen ungenutzten Parameter. Entweder redaktiert die Funktion alles zu einer Konstante (legitim, aber dann ist der Name irreführend) oder sie ist ein Stub. Für eine Plattform, die DSGVO-Compliance auditiert, ist eine möglicherweise leere Redaction-Funktion im eigenen Logger ein Befund, den der eigene Scanner finden sollte.

**Verdächtig: Cron-Routes mit inkonsistenten Signaturen.** `/api/cron/agents` und `/api/cron/sync-feeds` nehmen `request` (vermutlich für Secret-Check), aber `/api/cron/feed-cleanup`, `feed-digest`, `feed-fetch`, `feed-process` nehmen **kein** Request-Objekt. Entweder prüfen sie das Cron-Secret über einen anderen Mechanismus — oder vier Cron-Endpoints sind unauthentifiziert per GET triggerbar. Das muss heute geprüft werden, nicht in Phase 4.

**Strukturell auffällig: Das Produkt frisst das Projekt.** Die Repo Map zeigt ein zweites, größeres Produkt unter dem MVP — Workspaces mit Cards/Connections/Canvas, ein komplettes Feed-System mit 3-Stage-Pipeline, Agent-Runner mit Webhooks, TTS, PPTX-Export, Bookmarks. Das MVP "drei Features, nicht mehr" steht auf einem Eisberg aus ~80% inaktiver Codebase. Die Roadmap weiß das ("Eingefrorene KMU-Substanz") — aber jeder Audit-Score, jede Lint-Welle, jedes Dependency-Update bezahlt für den ganzen Eisberg.

**Ironie-Befund:** Das eigene Audit-System triggert FPs auf den eigenen 410-Stub-Routes (Backlog-Punkt 10) — das Produkt findet die Probleme des Produkts. Das ist eigentlich das beste Validierungs-Signal, das es gibt, und sollte als Case Study ins Marketing.

---

## 6. Konkrete nächste Schritte

### 1. Security-Sweep über alle API-Routes (vor allem anderen, vor Beta)
Eine Tabelle: jede Route × {Auth-Check vorhanden? Ownership-Check vorhanden? Wrapper genutzt?}. Die vier parameterlosen Cron-Routes und `/api/debug/feeds` zuerst. Danach `withAuth`/`withProjectAccess`-Wrapper als Pflicht-Pattern einführen und als Checker-Regel ins eigene Audit-System gießen. **Begründung:** Das supabaseAdmin-Modell macht jede Route zur potenziellen BOLA-Lücke, und das Produktversprechen ("wir finden deine Security-Lücken") verträgt keinen eigenen Vorfall.

### 2. Audit-Engine mit Golden-Master-Tests absichern
3–5 Fixture-Mini-Repos mit handverifizierten Findings + Snapshot-Tests für Scoring-Formel und die neuen AST-Detektoren aus ADR-027. **Begründung:** Phase 2.5 validiert die Engine fachlich mit echten Daten — aber ohne Regression-Netz kann jeder weitere Checker-Fix die Benchmark-Vergleichbarkeit still zerstören. Validierung ohne Tests ist eine Momentaufnahme, kein Fundament.

### 3. Infrastruktur-Konsolidierung: ein Auth-Modul, ein Client-Pfad, Score ehrlich machen
`getAuthUser()` deduplizieren, Client-Imports per ESLint-Regel kanalisieren, offiziellen Score auf `--with-tools` umstellen und die 820-Warnings-Welle aus Phase 2 vorziehen. **Begründung:** Drei kleine Arbeiten, ein Effekt: die Diskrepanz zwischen dokumentiertem Anspruch und maschinell erzwungener Realität schließen — bevor Beta-User sie finden. Ein Coach, der seinen eigenen Standard im Easy-Mode misst, hat kein Glaubwürdigkeitsproblem, das Marketing lösen kann.

---

**Gesamturteil:** Überdurchschnittliche Substanz, exzellente Prozessreflexion, aber die Durchsetzung lebt zu sehr in Prosa und zu wenig in Tooling. Die drei Schritte oben verschieben genau das — von "dokumentierte Disziplin" zu "erzwungene Disziplin". Das ist im Übrigen exakt das Wertversprechen, das TropenOS seinen eigenen Kunden verkauft.
