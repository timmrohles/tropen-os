# Pre-Flight — Geführte Konzept-Entwicklung (Scheibe 2b)

**Datum:** 2026-06-08
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan (zunächst nur Schicht 2b-1).
**Bezug:** ADR-030 (Prämissen-Modell v2, On-Ramp), Scheibe 2a (Lücken-Loop), Scheibe 3 (Per-Punkt-Chat — wird hier als 2b-3 vorweggenommen).
**Branch-Basis:** `claude/preflight-corpus-c2` (aktueller Stack-Kopf).

## 1. Problem

Bei *dünnem* Konzept produziert der 2a-Lücken-Loop eine Wand aus 🔴-Lücken — wertlos, wenn der Nutzer **noch nicht weiß, was er bauen will**. 2b setzt eine **Konzept-Aufbau-Schicht davor**: erst Coach-Arbeit auf Konzept-Ebene, DANN die bestehende Analyse → dann der 2a-Loop mit viel weniger Roten.

## 2. Architektur (Gesamt-2b)

```
Readiness-Check zu dünn
   → Button „Geführte Entwicklung starten" (On-Ramp, ADR-030)
   → Eingangs-Weiche: „Weißt du schon ziemlich genau, was du bauen willst?"
        ├─ Ja       → Strukturierter Fragebogen (4 Felder + KI-Default)
        └─ Unsicher → Offener Coach-Dialog (Coach-Chat, Scope=whole)
   → 4 Konzept-Felder (JSONB am Projekt, editierbar)
   → komponiert zu Konzept-Text + Pivots
   → bestehende analyzePreflight (run.ts)
   → bestehender 2a-Lücken-Loop → generate
```

**4 Konzept-Felder** (Konzept-Ebene des Readiness-Maßstabs): `wasFuerWen` · `kernFunktionen` · `nutzerDaten` · `verkauf`.

**Coach-Chat-Primitiv** (eine Komponente + Route, gebaut in 2b-2): Scope `whole` = offener Eingangs-Dialog; Scope `field` = Per-Punkt-„diskutieren" (2b-3). Schreibt strukturierte Felder zurück. „Fertig" = Nutzer klickt „Konzept übernehmen".

**Diszipliniert in 3 Schichten** (je für sich lauffähig, eigene Pläne):
| Schicht | Inhalt |
|---|---|
| **2b-1** (MVP-Kern) | On-Ramp + Eingangs-Weiche + Fragebogen + KI-Default + Komponieren→analyze + JSONB-Persistenz |
| **2b-2** | Coach-Chat-Primitiv + offener Eingangs-Dialog (Scope `whole`) |
| **2b-3** | Per-Feld-„diskutieren" (Coach-Chat Scope `field`) = Scheibe-3-Nebenprodukt |

---

## 3. Schicht 2b-1 — Detail (dieser Spec-Fokus)

### 3.1 Datenmodell
- Migration: `preflight_projects.concept JSONB DEFAULT NULL` (Timestamp-Format, wie `decisions`/`startpaket`).
- Typ `PreflightConcept` (`src/lib/preflight/concept-types.ts`):
```typescript
export interface PreflightConcept {
  mode: 'form' | 'dialog'        // 2b-1 nutzt nur 'form'; 'dialog' kommt 2b-2
  wasFuerWen: string
  kernFunktionen: string
  nutzerDaten: string
  verkauf: string
  transcript?: ConceptChatTurn[] // erst 2b-2
}
export const CONCEPT_FIELDS = ['wasFuerWen', 'kernFunktionen', 'nutzerDaten', 'verkauf'] as const
```

### 3.2 Komposition (Engine, `src/lib/preflight/concept.ts`)
- `composeConceptText(concept): string` — deterministisch: fügt die 4 Felder zu einem strukturierten Konzept-Text zusammen (Markdown-Abschnitte je Feld). Leere Felder werden ausgelassen.
- `derivePivotsFromConcept(concept, existing): PreflightPivots` — mappt `verkauf` → `commercialModel` (Keyword-Heuristik: „shop/laden/produkte verkaufen" → `shop`, „abo/subscription" → `subscription`, „marktplatz/vermitteln" → `marketplace`, sonst bestehender Wert). Übrige Pivots bleiben.
- Beide rein + getestet (kein LLM).

### 3.3 KI-Default (Route `src/app/api/preflight/concept/suggest/route.ts`)
- POST, Body `{ seed: string }` (der dünne Ausgangs-Text). Auth-Check + validateBody (Zod) zuerst.
- Ein LLM-Call (`claude-haiku-4-5-20251001` via `@/lib/llm/anthropic`) mit JSON-Output-Prompt → `{ wasFuerWen, kernFunktionen, nutzerDaten, verkauf }` als Vorschläge.
- Antwort: `{ suggestions: {...} }`. Fehler → strukturierte JSON-Response; UI fällt auf leere Felder zurück (kein Crash).

### 3.4 Konzept speichern + Analyse auslösen (Route `src/app/api/preflight/projects/[id]/concept/route.ts`)
- PATCH, Body `conceptBody` (Zod: 4 Strings, `mode`). Auth + Projekt-Zugriffs-Check (bestehender Helfer aus T4).
- Speichert `concept` JSONB; komponiert → `composeConceptText` + `derivePivotsFromConcept`; ruft `analyzePreflight` mit dem komponierten Input; legt einen neuen `preflight_run` an (wie die bestehende runs-Route) und aktualisiert das Projekt. Antwort: das aktualisierte Projekt + Run (wie runs-Route).

### 3.5 UI
- **On-Ramp-Button** „Geführte Entwicklung starten": in `PreflightResult.tsx` (bei `summary.thin`) UND im Intake-Leerzustand (`EmptyStateIntro.tsx`/`IntakePanel.tsx`) sichtbar, wenn der Eingabe-Text zu kurz ist. Führt zur Konzept-Tour (Query-Param `?mode=concept` oder eigene Sub-Route `preflight/[id]/concept`).
- **`ConceptTour.tsx`** (`_components/`): Eingangs-Weiche (zwei große Karten Ja/Unsicher). „Unsicher" ist in 2b-1 **deaktiviert mit Hinweis „kommt bald"** (Coach-Dialog = 2b-2); „Ja" öffnet den Fragebogen.
- **`ConceptForm.tsx`**: 4 Felder (Textareas) mit Label + Kurzhilfe; „KI-Vorschlag holen"-Button (ruft suggest-Route, füllt Felder als editierbare Defaults); „Konzept übernehmen & analysieren"-Button (ruft concept-PATCH → navigiert zum aktualisierten Ergebnis/2a-Loop).
- Bestehendes Layout/Design-System (page-header, card, btn-*); kein neues Pattern. Design-Lint grün.

### 3.6 Tests (2b-1)
- `concept.ts`: `composeConceptText` (Felder rein → Text, leere ausgelassen), `derivePivotsFromConcept` (verkauf-Keywords → commercialModel) — deterministisch.
- `concept-types`: CONCEPT_FIELDS-Konsistenz.
- Validatoren: `conceptBody` + `suggestBody` (Zod) — gültig/ungültig.
- Routen: bestehende API-Test-Muster (Auth-Guard, Projekt-Zugriff).

---

## 4. Schicht 2b-2 (Ausblick — eigener Spec/Plan später)
Coach-Chat-Primitiv: `CoachChat.tsx` + `src/app/api/preflight/concept/chat/route.ts` (SSE-Streaming via bestehender LLM-Layer). Scope `whole`: System-Prompt = Coach, der die 4 Felder herausarbeitet; bei „Konzept übernehmen" extrahiert ein Abschluss-Call die 4 Felder → wie 2b-1 weiter. Transcript in `concept.transcript`. Eingangs-Weiche „Unsicher" wird scharfgeschaltet.

## 5. Schicht 2b-3 (Ausblick)
`CoachChat` mit Scope `field`: „diskutieren"-Button an jedem der 4 Felder (und perspektivisch an 2a-Lücken). Gleiche Route/Komponente, Kontext = ein Feld; Rückschreiben in genau dieses Feld. = Scheibe-3-Mechanik.

## 6. Draußen / YAGNI
- 2b-2 + 2b-3 werden NICHT in 2b-1 gebaut (nur Typen/Felder vorbereitet: `mode`, `transcript?`).
- Kein offener Dialog, kein Streaming-Chat in 2b-1.
- Migrationen: Git-zuerst-dann-DB; `concept`-Migration committen, dann anwenden.
