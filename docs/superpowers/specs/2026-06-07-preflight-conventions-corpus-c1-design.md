# Pre-Flight — Konventions-Regelkorpus + Renderer (Scheibe C1)

**Datum:** 2026-06-07
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan
**Bezug:** ADR-030 (Prämissen-Modell v2), ADR-021 (Prompt-Veredler — diese Arbeit ist Vorarbeit dafür).
**Branch-Basis:** gestapelt auf `claude/preflight-loop-2a`.

## 1. Problem & Ziel

Die heute generierte `CLAUDE.md`/`.cursorrules` ist **zu dünn**: Der Generate-Prompt sagt nur „leite den Inhalt aus den entschiedenen Knoten ab" — freies LLM-Schreiben ohne erzwungene Struktur und ohne Pflicht-Regelwerk. Ergebnis: generischer Text, „unsere Regeln" fehlen → Drift vorprogrammiert. Das untergräbt das Kernversprechen von Pre-Flight („bau danach drift-frei").

**Ziel:** Die Konventions-Datei wird zu einem echten, **tiefen Anti-Drift-Regelwerk**, dessen Tiefe **strukturell garantiert** ist — nicht der Laune eines LLM-Passes überlassen.

**Leitprinzip:** Universelle Regeln (Dateigröße, Naming, Ordnerstruktur, Error-Handling, Sicherheit, Pflege) werden **deterministisch aus einem kuratierten Korpus** gerendert. Das LLM darf nur noch *ergänzen* (Projekt-Schicht), nicht *kuratieren*.

## 2. Gesamt-Architektur (Kontext — eine Quelle, drei Sichten)

Ein **Regel-Korpus** ist die geteilte Quelle für drei Abnehmer:
- **Pre-Flight** *schreibt* die Regeln (CLAUDE.md) — diese Arbeit.
- **Audit** *prüft* sie (existiert) — spätere Anbindung.
- **Veredler** *injiziert* sie in Prompts (ADR-021) — spätere Anbindung.

Der Korpus wird **offline von einem Multi-Modell-Komitee kuratiert** (Scheibe **C2**, separat) aus den vorhandenen **Audit-Regeln (255) + 21 Agent-Packs** (`generate-agents.ts`-Muster). Zur Laufzeit wird er **deterministisch gefiltert + gerendert** (diese Scheibe **C1**).

## 3. Scope C1

**C1 baut:** Korpus-Struktur · einen **hand-kuratierten Starter-Korpus** (~40–60 Regeln) · den **Runtime-Renderer** (Filter + deterministische Baseline + ein LLM-Projekt-Pass) · Integration in `generateStartpaket`.

**Bewusst NICHT in C1:** Komitee-Kuration / Skalierung auf 255 Regeln (= C2) · Audit-/Veredler-Rendering · der breitere Startpaket-Rethink (README/.gitignore/migration-Gate, erklärter Handover) · die geführte Konzept-Tour (2b). Diese sind separat gequeued.

## 4. Komponenten C1

### 4.1 Typen (`src/lib/preflight/corpus/types.ts`)

```typescript
export type ConventionSection =
  | 'overview'        // Projekt-Überblick (LLM-Projekt-Schicht)
  | 'architecture'    // Architektur-Entscheidungen (LLM, aus Decisions)
  | 'code-rules'      // nicht-verhandelbare Code-Regeln
  | 'naming'          // Namenskonventionen
  | 'structure'       // Ordnerstruktur / was-wo
  | 'db'              // DB-Zugriff & Migrationen
  | 'error-handling'  // Fehlerbehandlung
  | 'security'        // Sicherheit & Secrets
  | 'maintenance'     // Pflege der Datei selbst (Größe, Aktualität)

export type RuleSeverity = 'must' | 'should'

export interface ConventionRule {
  id: string                 // stabil, z.B. 'code-file-size'
  section: ConventionSection
  rule: string               // imperativ („tun"): „Dateien > 300 Zeilen aufteilen."
  rationale?: string         // kurzer Grund (1 Satz) — optional
  appliesWhen?: string[]     // Filter-Tags; undefined = universell (immer)
  severity: RuleSeverity
  source: string             // Herkunft: 'claude-md' | 'agent:ARCHITECTURE' | 'audit:cat-1-rule-3' …
}
```

### 4.2 Starter-Korpus (`src/lib/preflight/corpus/rule-corpus.ts`)

Ein typisiertes `ConventionRule[]` (~40–60 Regeln), hand-kuratiert aus der Tropen-OS-`CLAUDE.md` + Kern-Agent-Packs. **Pflicht-Abdeckung** (universell, `appliesWhen` = undefined):
- **code-rules:** Dateigröße (>300 Warnung / >500 Verletzung), kein `any` ohne Begründung, keine Business-Logik in UI, keine Secrets im Code, semantisches HTML.
- **naming:** Komponenten PascalCase, Hooks `use*`, Utils camelCase, Konstanten UPPER_SNAKE, Ordner kebab-case.
- **structure:** klare Schicht-Trennung (UI / Logik / Daten), „was gehört wohin".
- **error-handling:** strukturierte Error-Typen, try/catch in API-Routen, keine generischen Messages.
- **security:** Auth-Check als erste Zeile in geschützten Routen, kein PII in Logs, Input-Validierung.
- **maintenance:** Datei aktuell halten, Abschnitte nicht löschen ohne Grund, Dateigröße der CLAUDE.md selbst im Blick.

**Bedingte Regeln** (`appliesWhen` gesetzt): z.B. `['stack:react']` (Hooks-Regeln, kein fetch-in-useEffect), `['db:true']` (Migrations-Workflow, RLS, kein direkter DB-Zugriff aus Frontend), `['auth:true']` (Session-Checks), `['platform:web']` (Barrierefreiheit-Basics).

> Der **Inhalt** der ~60 Regeln ist Implementierungsarbeit (Plan), nicht Teil dieser Spec. Die Spec fordert: alle oben gelisteten Pflicht-Abschnitte sind mit ≥3 universellen Regeln belegt.

### 4.3 Projekt-Tags ableiten (`deriveCorpusTags`)

```typescript
export function deriveCorpusTags(pivots: PreflightPivots, nodes: NodeAnalysis[]): string[]
```
Leitet Filter-Tags aus Pivots + Analyse ab:
- Stack-String → `stack:react`/`stack:next`/`stack:vue`… (Keyword-Match, deterministisch).
- `pivots.platform` → `platform:web`/`platform:native`.
- DB erkannt (Stack enthält supabase/postgres/prisma ODER ein db-Knoten ist `decided`/offen) → `db:true`.
- Auth erkannt (auth-Knoten vorhanden) → `auth:true`.
- `pivots.commercialModel !== 'none'` → `commerce:true`.
Rein regelbasiert, kein LLM.

### 4.4 Filtern (`filterCorpus`)

```typescript
export function filterCorpus(corpus: ConventionRule[], tags: string[]): ConventionRule[]
```
Eine Regel ist enthalten, wenn `appliesWhen` **undefined** (universell) ODER **mindestens ein** `appliesWhen`-Tag in `tags` liegt. So entstehen ~30–50 relevante statt 255 Regeln (Dateigröße/Brauchbarkeit).

### 4.5 Deterministisch rendern (`renderBaseline`)

```typescript
export function renderBaseline(rules: ConventionRule[]): string  // Markdown, KEIN LLM
```
Gruppiert nach `section` (feste Reihenfolge), rendert je Abschnitt eine Überschrift + Aufzählung der `rule`-Texte (mit `rationale` als Klammerzusatz, `must` vs `should` markiert). Deterministisch → dieselben Eingaberegeln ⇒ identische Ausgabe. **Das ist die garantierte Baseline** — sie kann nie wegfallen.

### 4.6 Renderer mit Projekt-Schicht (`renderConventions`)

```typescript
export async function renderConventions(
  text: string, nodes: NodeAnalysis[], pivots: PreflightPivots, decisions: DecisionMap,
): Promise<string>
```
Ablauf:
1. `tags = deriveCorpusTags(pivots, nodes)`
2. `rules = filterCorpus(corpus, tags)`
3. `baseline = renderBaseline(rules)` (deterministisch)
4. **Ein** LLM-Pass erzeugt **nur** die zwei Projekt-Schicht-Abschnitte aus `text` + `decisions` + `projectLabel`: `overview` (Projekt-Überblick) und `architecture` (Architektur-Entscheidungen **inkl. Datenmodell-Notizen** aus den Decisions). Prompt-Regel: *nur* diese zwei Abschnitte schreiben, die Baseline **nicht** wiederholen/verändern. Der `db`-Abschnitt bleibt damit **reine Baseline** (Regeln aus dem Korpus), das projektspezifische Datenmodell lebt im `architecture`-Block.
5. Komposition: `Projekt-Überblick (LLM)` + `Architektur-Entscheidungen inkl. Datenmodell (LLM)` + `baseline (deterministisch)`. Tool-Format-Kopf (CLAUDE.md vs .cursorrules vs AGENTS.md) via `pivots.buildTool` wie bisher.

### 4.7 Integration (`generate.ts`)

`generateStartpaket`: der `conventions.content` kommt jetzt aus `renderConventions(...)` statt aus dem generischen `conventionsContent`-Feld. Der bestehende `generateObject`-Call erzeugt weiterhin `decisionLog`, `envExample`, `migrationSql` — `conventionsContent` wird aus dessen SCHEMA/Prompt **entfernt**. `conventions.filename` bleibt `CONVENTIONS_FILENAME[pivots.buildTool]`.

## 5. Tests

- **`filterCorpus`:** universelle Regel immer drin; bedingte nur bei passendem Tag; kein Tag-Match → ausgeschlossen.
- **`deriveCorpusTags`:** „Next.js + Supabase" → enthält `stack:next`/`stack:react`-Familie + `db:true`; native → `platform:native`.
- **`renderBaseline`:** deterministisch (zweimal gleich) · enthält die Pflicht-Abschnitte · enthält konkrete Pflicht-Regeln (z.B. den Dateigröße-Text) · `must`/`should`-Markierung sichtbar.
- **`renderConventions`** (LLM gemockt): Ergebnis enthält die deterministische Baseline **wörtlich** (Beweis: Baseline kann nicht verdünnt werden) + den projektspezifischen Kopf.
- **`generate.ts`-Integration:** `conventions.content` enthält Baseline-Regeln; `conventionsContent` nicht mehr im Rest-Schema.

## 6. Dateien

**Neu:** `src/lib/preflight/corpus/types.ts` · `rule-corpus.ts` (Seed) · `render.ts` (`deriveCorpusTags`/`filterCorpus`/`renderBaseline`/`renderConventions`) · Tests dazu.
**Geändert:** `src/lib/preflight/generate.ts` (conventions via Renderer; `conventionsContent` aus Rest-Schema raus).

## 7. Folge-Scheiben

- **C2 — Komitee-Kuration:** Offline-Script skaliert den Korpus aus 255 Audit-Regeln + 21 Packs (Vorarbeit Veredler).
- Audit-/Veredler-Renderer · Startpaket-Rethink (README/.gitignore/migration-Gate, erklärter Handover) · geführte Konzept-Tour (2b).
