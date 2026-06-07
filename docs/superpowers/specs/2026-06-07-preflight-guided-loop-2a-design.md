# Pre-Flight Scheibe 2a — Geführter Loop + verzögerte Generierung

**Datum:** 2026-06-07
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan
**Bezug:** ADR-030 (Prämissen-Modell v2). Sub-Scheibe von „Scheibe 2 — Geführte Entwicklung".
**Branch-Basis:** gestapelt auf `claude/preflight-premises-v2` (Scheibe 1).

## 1. Ziel & Scope

Den Geburtsfehler „Startpaket aus 5 Wörtern" beheben: Die Analyse erzeugt **nicht mehr sofort** ein Startpaket. Stattdessen klärt der Nutzer die **roten Lücken** in einem geführten Loop (KI-Vorschlag aus der Analyse → **übernehmen / anpassen / parken**), die Entscheidungen werden persistiert, und das Startpaket entsteht **erst nach Erreichen des Mindeststandards aus diesen Entscheidungen**.

**Architektur-prägend** (ADR-030, 24h-Gate erfüllt): verschiebt die Generierung ans Ende → Datenfluss-Änderung.

**Bewusst NICHT in 2a** (spätere Sub-Scheiben): On-Ramp / geführte Konzept-Entwicklung bei (fast) leerem Input (2b) · „diskutieren"-Chat pro Lücke (Scheibe 3) · Next-Steps-Roadmap (Scheibe 4) · frische LLM-Vorschläge pro Lücke (Default = Wiederverwendung der Analyse).

## 2. Engine-Split (`src/lib/preflight/`)

Heute: `runPreflight(raw, pivots)` macht normalize → `analyzeInput` → `buildGapList` → `generateStartpaket` → migration-audit → `{ summary, gaps, startpaket }`.

**Neu — zwei getrennte Funktionen:**

```typescript
// run.ts (oder analyze-phase.ts) — NUR Analyse, kein Startpaket
export async function analyzePreflight(raw: string, pivots: PreflightPivots): Promise<{ summary: ResultSummary; gaps: GapList; nodes: NodeAnalysis[] }> {
  const text = normalizeInput(raw)
  const { nodes, projectLabel } = await analyzeInput(text, pivots)
  const gaps = buildGapList(nodes)
  const headline = gaps.red.length > 0
    ? `${gaps.red.length} Dinge solltest du zuerst entscheiden — fang oben an.`
    : 'Keine Blocker — du kannst loslegen.'
  return { summary: { projectLabel, headline, thin: isThinInput(text, gaps) }, gaps, nodes }
}
```

`nodes` (NodeAnalysis[], inkl. entschiedener/n.r.-Knoten) wird im Run mitgespeichert, weil die spätere Generierung sie braucht (auch entschiedene Knoten fließen ins Startpaket).

`generateStartpaket` (in `generate.ts`) bekommt die **Entscheidungen** dazu:

```typescript
export async function generateStartpaket(
  text: string, nodes: NodeAnalysis[], pivots: PreflightPivots, decisions: DecisionMap
): Promise<Startpaket>
```
Der Generate-Prompt listet pro offener roter Lücke die getroffene Entscheidung (übernommener Default-Text / Custom-Wert / „bewusst geparkt") und baut das Startpaket daraus. `auditMigrationSql` bleibt im Generate-Pfad.

`runPreflight` (alt, monolithisch) wird entfernt; Aufrufer (analyze-Route, runs-Route) nutzen `analyzePreflight`.

## 3. Typen (`src/lib/preflight/types.ts`)

```typescript
export type DecisionChoice = 'default' | 'custom' | 'parked'
export interface Decision { choice: DecisionChoice; value?: string }
export type DecisionMap = Record<string, Decision>  // key = Korsett-nodeId

/** Mindeststandard erreicht: jede offene rote Lücke hat eine Entscheidung. */
export function isMinStandardMet(gaps: GapList, decisions: DecisionMap): boolean {
  return gaps.red.every(g => decisions[g.id] !== undefined)
}
```

`PreflightResult` (heute `{ summary, gaps, startpaket }`) wird **nicht mehr** als Ganzes erzeugt. Der Run speichert `{ summary, gaps, nodes }` (kein startpaket); `startpaket` lebt am Projekt. `nodes` ist server-intern (für die Generierung), wird nicht an den Client gesendet.

## 4. Datenmodell + Migration

Datei `supabase/migrations/20260607000001_preflight_decisions_startpaket.sql` (additive JSONB, keine Daten-Migration):

```sql
ALTER TABLE preflight_projects ADD COLUMN decisions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE preflight_projects ADD COLUMN startpaket JSONB;  -- nullable: erst nach Generierung
```

- **Runs:** neue Läufe schreiben `result = { summary, gaps, nodes }` (kein `startpaket`). Alt-Läufe (CRUD-Scheibe) behalten ihr `result.startpaket` → Anzeige-Fallback (§8).
- Regel „Git zuerst, dann DB": Datei committen, dann anwenden (MCP `apply_migration` + History-Angleichung an Dateiversion).

## 5. API-Routen

| Route | Methode | Änderung |
|-------|---------|----------|
| `…/analyze` | POST | **Geändert:** `analyzePreflight` statt `runPreflight`; Run-`result = { summary, gaps }`; Projekt+Run-Anlage wie bisher. Antwort `{ projectId }`. |
| `…/projects/[id]/decisions` | PATCH | **Neu:** Body `{ nodeId, choice, value? }` (validiert via Zod `decisionBody`). Liest `project.decisions`, setzt/überschreibt `[nodeId]`, schreibt zurück. Antwort: aktualisierte `decisions`. |
| `…/projects/[id]/generate` | POST | **Neu:** lädt neuesten Run (`nodes` + `gaps` + `input_text`) + Projekt-`pivots`/`decisions`; prüft `isMinStandardMet(gaps, decisions)` **server-seitig** → sonst `409 { code: 'MIN_STANDARD_NOT_MET' }`; sonst `generateStartpaket(input, nodes, pivots, decisions)` → speichert `project.startpaket` (+`updated_at`). Budget-Check (`'preflight'`). Antwort `{ startpaket }`. |
| `…/projects/[id]` | GET | **Geändert:** liefert `{ id, name, pivots, input, decisions, startpaket, result }` — `result` = neuester Run (`{ summary, gaps }`), `startpaket` = `project.startpaket ?? run.result.startpaket` (Fallback). |
| `…/projects/[id]/runs` | POST | **Geändert:** `analyzePreflight`; neuer Run nur `{ summary, gaps }`. Decisions am Projekt bleiben (per nodeId). |

Alle: `getAuthUser` → `getPreflightProjectForUser` (Org-Scope), strukturierte Fehler. Validatoren in `src/lib/validators/preflight.ts` (`decisionBody`).

## 6. Gate-Berechnung

`isMinStandardMet(gaps, decisions)` (pure, §3) — Single Source. Client nutzt es für UI (Fortschritt, Button-Enable); `generate`-Route validiert nochmal (kein Vertrauen auf Client). Anwendbare 🔴 = `gaps.red` (buildGapList liefert dort bereits nur offene rote Knoten).

## 7. UI

### `PreflightLoop` (Umbau von `PreflightResult.tsx` → Detail-Komposition)
Props neu: `gaps`, `decisions`, `startpaket`, `projectId`, `onDecision(nodeId, choice, value?)`, `onGenerate()`.
- **Fortschrittsbalken** zum Mindeststandard: `gaps.red.filter(g => decisions[g.id]).length / gaps.red.length`.
- **`GapCard` interaktiv** (Umbau): pro Lücke KI-Vorschlag (= `gap.action ?? gap.default`), Buttons **[Übernehmen]** (`choice:'default'`, value = Vorschlag) · **[Anpassen]** (inline Textfeld → `choice:'custom'`) · **[Parken]** (`choice:'parked'`). Geklärte/geparkte eingeklappt mit Status. 🟡 sichtbar, optional parkbar, **nicht** im Gate.
- **„Startpaket erstellen"** — disabled bis `isMinStandardMet`; Label zeigt Rest („noch N rote Lücken"). Klick → `onGenerate` → POST generate → `startpaket` gesetzt → `ArtifactBrowser` erscheint.
- Wenn `startpaket` schon vorhanden: Browser direkt zeigen + „Neu generieren" (nach Decision-Änderungen).

### Detail-Seite (`[id]/page.tsx`)
Lädt `decisions`/`startpaket`/`gaps`; verdrahtet `onDecision` (PATCH decisions, optimistisch) + `onGenerate` (POST generate). `ArtifactBrowser` bekommt `startpaket` statt `result` (kleine Prop-Anpassung).

## 8. Rückwärtskompatibilität

Alt-Projekte (CRUD-Scheibe) haben `result.startpaket` am Run, leere `decisions`, `project.startpaket = null`. Detail-GET-Fallback `project.startpaket ?? run.result.startpaket` zeigt ihr altes Startpaket weiter. Ihre roten Lücken sind „unentschieden" → Loop bietet sie an; das alte Startpaket bleibt sichtbar, bis neu generiert wird. Kein Datenverlust, kein Bruch.

## 9. Fehlerbehandlung

- Gate nicht erreicht bei generate → `409 MIN_STANDARD_NOT_MET` (UI sollte Button ohnehin sperren; Server ist die Wahrheit).
- Budget erschöpft bei generate → `402 BUDGET_EXHAUSTED`.
- `analyzeInput`/`generateStartpaket` LLM-Fehler → strukturierte 500/400 wie bisher.
- decisions-PATCH: unbekannte `choice` → 400 (Zod).

## 10. Tests

- **Engine:** `analyzePreflight` gibt `{summary, gaps, nodes}` ohne startpaket (analyze gemockt); `generateStartpaket` nimmt decisions und referenziert sie im Prompt (Prompt-String-Assertion).
- **`isMinStandardMet`** (pure): leere decisions + rote Lücken → false; alle roten entschieden/geparkt → true; gelbe egal.
- **decisions-Route:** setzt/überschreibt Eintrag; 400 bei ungültiger choice; 404 fremde Org.
- **generate-Route:** 409 wenn Gate nicht erreicht; 200 + startpaket gespeichert wenn erreicht; 402 Budget.
- **analyze-Route:** Run-result hat keine startpaket-Eigenschaft mehr.
- UI: `pnpm typecheck` + `pnpm lint:design`.
- Bestehende Tests anpassen (analyze-Route-Test: startpaket nicht mehr erwartet; run/generate-Tests an neue Signaturen).

## 11. Dateien

**Neu:** `…/projects/[id]/decisions/route.ts` · `…/projects/[id]/generate/route.ts` · Tests dafür · Migration.
**Geändert:** `types.ts` (Decision*, isMinStandardMet) · `run.ts` (analyzePreflight, runPreflight raus) · `generate.ts` (decisions-Param) · `validators/preflight.ts` (decisionBody) · `analyze/route.ts` + `runs/route.ts` (analyzePreflight, result ohne startpaket) · `projects/[id]/route.ts` (GET liefert decisions/startpaket) · `PreflightResult.tsx`→Loop · `GapCard.tsx` (interaktiv) · `[id]/page.tsx` (Verdrahtung) · `ArtifactBrowser.tsx` (Prop `startpaket`).
