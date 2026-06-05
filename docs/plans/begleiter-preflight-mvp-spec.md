# Spec: Pre-Flight MVP — Slice 1 der Begleiter-Foundation

> **Status:** Spec (brainstorming abgeschlossen) · **Datum:** 2026-06-05
> **Basis:** `begleiter-korsett-v2.md` (Taxonomie), `begleiter-foundation-korsett.md` (Mechanik)
> **Phase:** 2 · erster Implementierungs-Slice

## 1 · Ziel & Erfolgskriterium

**Ziel:** Der dünnste echte Slice des Begleiters — Input (Design/Schema, beliebiger Reifegrad) → priorisierte **Lücken-Liste** + **Startpaket**. Bauen **ist** Validieren: dieser Slice geht in die L2-Calls, um die offene Premisse zu prüfen — *zieht ein Vibe-Coder so ein Tool, bevor er baut?*

**Erfolgskriterium:** Ein Nutzer paste sein Design → erlebt einen „oh, daran hätte ich nicht gedacht"-Moment **und** erhält ein brauchbares Startpaket. Messbar über persistierte Läufe (Beta).

## 2 · Scope

**In Slice 1:**
- Input: Paste · Datei-Upload (.md/.txt/.pdf) · vage Idee — *eine* Engine, graceful degradation
- Gestufte Engine: LLM-Analyse → deterministische Lücken-Liste → LLM-Generierung
- Startpaket: Decision-Log · `CLAUDE.md` · `.env.example` · **Migrations-Entwurf** (nur bei erkanntem Schema) **mit Selbst-Audit** durch `sec-db`-Checker
- Persistenz: projekt-/user-gescoped, RLS, löschbar
- Route `/preflight` in tropenOS (App-Shell, Auth, Design-System)

**Bewusst NICHT (YAGNI):** Elicit-Interview-UI · Schreiben ins User-Repo · Audit-Drift-Schleife · Domänen-Overlays jenseits Supabase/Next · Cross-User-Lernen.

## 3 · Architektur & Komponenten

### `src/lib/preflight/`
| Modul | Aufgabe |
|-------|---------|
| `korsett.ts` | Korsett v2 als typisierte Daten: `KorsettNode[]` (`id, domain, frage, warum, default, kosten: 'red'\|'yellow', appliesWhen`). Einzige Quelle, abgeleitet aus dem v2-Doc. |
| `ingest.ts` | Input normalisieren: Text (Paste) / Datei → Text (PDF-Parsing). |
| `analyze.ts` | **LLM-Analyse-Pass** (structured/`generateObject`): pro Knoten `status: decided\|open\|na` + `evidence`. Nicht-zutreffende Äste markiert der LLM als `na` (implizites `appliesWhen`). Modell: Sonnet. |
| `gaps.ts` | **deterministisch**: aus der Analyse die priorisierte Liste — offene 🔴 vor offenen 🟡, nach Domäne gruppiert, angereichert mit `frage/warum/default`. *(Haupt-Testfläche.)* |
| `generate.ts` | **LLM-Generier-Pass**: `{ decisionLog, claudeMd, envExample, migrationDraft? }`. `migrationDraft` nur wenn Schema erkannt; sonst weglassen + Hinweis. |
| `migration-audit.ts` | generiertes SQL als In-Memory-Datei durch `buildAuditContextFromFiles` + `sec-db`-Checker → Findings als Warnungen an den Entwurf hängen. |
| `types.ts` | geteilte Typen (`PreflightInput`, `NodeAnalysis`, `GapList`, `Startpaket`, `PreflightResult`). |

### API
`src/app/api/preflight/analyze/route.ts` — `POST { input }`:
`getAuthUser()` → `validateBody` (Zod) → `check_and_reserve_budget` (402 bei erschöpft) → `ingest → analyze → gaps → generate → migration-audit` → persistieren → `{ gaps, startpaket, runId }`.

### DB
Migration `preflight_runs` (`id, organization_id, user_id, input_text, result jsonb, created_at`) + RLS (org-scoped, eigener Lauf lesbar/löschbar). RLS **in derselben Migration** (dogfood sec-db-01). Decision-Log-Einträge im `result`-JSONB (Projekt-Verknüpfung → späterer Slice).

### UI `src/app/[locale]/(app)/preflight/`
- **Eingabe:** Textarea + Datei-Dropzone + „Analysieren"
- **Ergebnis:** Reifegrad-Signal oben („🔴 N offen → zuerst entscheiden") · Lücken-Liste (🔴/🟡, gruppiert, mit Begründung) · Startpaket in kopierbaren/downloadbaren Blöcken (Tabs: Decision-Log / CLAUDE.md / Migration-Entwurf *(mit Audit-Warnungen)* / .env.example)
- Reuse: App-UI-Primitives, Design-System

## 4 · Datenfluss
`Input → /api/preflight/analyze → [ingest → analyze(LLM) → gaps(det) → generate(LLM) → migration-audit(det)] → persist → JSON → UI (Anzeige + Copy/Download)`

## 5 · Datenschutz (dogfood den Moat)
`preflight_runs` RLS-org-gescoped. Input während Beta mit **Einwilligung** gespeichert, **löschbar**, mit Retention. **Kein Cross-User-Aggregieren/Lernen** — nur anonyme Aggregat-Metadaten (welche Domänen offen) mit Consent. Decision-Log dauerhaft (ermöglicht spätere Audit-Schleife).

## 6 · Fehlerbehandlung
- Auth-Check als erste Zeile · `validateBody` vor Logik
- Budget erschöpft → 402 `BUDGET_EXHAUSTED`
- LLM-Fehler → Structured-Output-Retry (AI SDK); harter Fehler → 500, spezifische Meldung
- Input zu kurz/leer → 400 „gib mehr Detail" (kein Crash)
- Kein Schema erkannt → Migration graceful weglassen, Hinweis im Startpaket

## 7 · Tests (Pflicht)
- **Unit:** `gaps.ts` (Sortierung/Gruppierung), `korsett.ts` (IDs eindeutig, `kosten` gültig, alle v2-Knoten vorhanden), Orchestrierung mit **gemocktem LLM** (Output-Shape), `migration-audit.ts`-Verdrahtung (gemockter Checker)
- **Integration:** API-Route mit gemocktem LLM (Happy-Path + Budget-402 + Input-leer-400)

## 8 · Wiederverwendung
Korsett v2 (Inhalt) · `@/lib/llm/anthropic` (AI SDK) · `check_and_reserve_budget` · `sec-db`-Checker + `buildAuditContextFromFiles` · App-Shell/Auth/Design-System · `validateBody`-Pattern.

## 9 · Offene Risiken
- **Migrations-Qualität** — entschärft durch Selbst-Audit; bleibt „Entwurf, prüfen", nie angewendet.
- **LLM-Analyse-Qualität bei vagem Input** — wird in den L2-Calls validiert.
- **Taxonomie-Sync** v2-Markdown → `korsett.ts` — manuell, synchron halten (langfristig generieren).
