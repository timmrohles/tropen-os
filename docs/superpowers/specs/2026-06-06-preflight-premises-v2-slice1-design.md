# Pre-Flight Prämissen-Modell v2 — Scheibe 1: Prämissen-Erfassung

**Datum:** 2026-06-06
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan
**Bezug:** ADR-030 (Hybrid-Richtung + Scheiben-Zerlegung)
**Branch-Basis:** nach Merge von PR #46 (Pre-Flight CRUD)

## 1. Ziel & Scope

Bessere, folgenreichere Prämissen im Intake + Analyse — ohne den geführten Loop (das ist Scheibe 2). Konkret:
- `stack` von Freitext → **kuratierte Auswahl + „Anderes" + „weiß nicht"**.
- Neue Pivots **Plattform** (Web/Native/Beides) und **Vertriebsmodell** (kein Verkauf/Shop/Abo/Marktplatz).
- Diese Prämissen verdrahten mit dem **Korsett** (neue Knoten) + dem **Analyse-Prompt** (Ableitungsregeln).
- **Ehrlichkeits-Hinweis** im Ergebnis (#2).

**Flow bleibt (A):** Konzept + Pivots zusammen → Analyse → Ergebnis. Echte KI-Ableitung der Pivots aus dem Konzept = Scheibe 2 (KI-Defaults im Loop).

**Bewusst NICHT in Scheibe 1:** geführter Loop, KI-Default-Vorschläge, „diskutieren"-Chat, Next-Steps-Roadmap, Pivot-Vorbefüllung aus dem Konzept.

### Nicht-Ziel: keine Migration
`preflight_projects.pivots` und `preflight_runs.result` sind JSONB. Neue Pivot-Felder sind rückwärtskompatibel: alte Läufe ohne `platform`/`commercialModel` werden als `'unsure'`/`'none'` behandelt. **Keine DB-Migration.**

## 2. Typen (`src/lib/preflight/types.ts`)

```typescript
export type Platform = 'web' | 'native' | 'both' | 'unsure'
export type CommercialModel = 'none' | 'shop' | 'subscription' | 'marketplace' | 'unsure'

export interface PreflightPivots {
  buildTool: BuildTool
  businessModel: BusinessModel
  audienceRegion: GeoScope
  hosting: GeoScope
  stack: string            // kuratierte Auswahl, Freitext ("Anderes") oder '' = "weiß nicht"
  platform: Platform       // NEU
  commercialModel: CommercialModel  // NEU
}
```

Robustheit: Alt-Pivots ohne die neuen Felder → beim Lesen mit Defaults auffüllen (`platform: 'unsure'`, `commercialModel: 'none'`). Helper `normalizePivots(raw): PreflightPivots` in `types.ts` oder `ingest.ts`.

## 3. Validator (`src/lib/validators/preflight.ts`)

```typescript
export const pivotsSchema = z.object({
  buildTool: z.enum(['claude-code', 'cursor', 'lovable', 'bolt', 'other', 'unsure']),
  businessModel: z.enum(['b2c', 'b2b', 'internal', 'unsure']),
  audienceRegion: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  hosting: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  stack: z.string(),  // '' erlaubt = "weiß nicht"
  platform: z.enum(['web', 'native', 'both', 'unsure']).default('unsure'),
  commercialModel: z.enum(['none', 'shop', 'subscription', 'marketplace', 'unsure']).default('none'),
})
```
`.default(...)` macht die neuen Felder optional im Body (Rückwärtskompatibilität für Re-Analyse alter Projekte).

## 4. Neue Korsett-Knoten (`src/lib/preflight/korsett.ts`)

Anhängen (Domänen „Store" / „Recht"). `appliesWhen`-Tags werden vom LLM ausgewertet (kein Code-Evaluator).

```typescript
// J · Store (nur native)
{ id: 'ST1', domain: 'Store', frage: 'Store-Pflichtangaben (Apple Privacy Labels / Google Data Safety) geplant?', warum: 'Store-Freigabe; falsche/fehlende Angaben → Ablehnung', default: 'vor Submission ausfüllen', kosten: 'red', appliesWhen: 'native' },
{ id: 'ST2', domain: 'Store', frage: 'In-App-Account-Löschung vorhanden (wenn Accounts)?', warum: 'Apple-Pflicht seit 2022 bei Account-Erstellung', default: 'Lösch-Flow in der App', kosten: 'red', appliesWhen: 'native' },
{ id: 'ST3', domain: 'Store', frage: 'Digitale Käufe über IAP statt externem Checkout?', warum: 'Store-Zahlungsregeln; Verstoß → Ablehnung', default: 'digitale Güter → IAP', kosten: 'yellow', appliesWhen: 'native' },

// K · Fernabsatz (B2C-Verkauf an Verbraucher)
{ id: 'FA1', domain: 'Recht', frage: 'Widerrufsrecht + Widerrufsbelehrung + Muster-Formular?', warum: '§312g BGB; fehlend → Abmahnung + Widerrufsfrist verlängert sich auf 12 Monate', default: 'Belehrung + Muster bereitstellen', kosten: 'red', appliesWhen: 'fernabsatz' },
{ id: 'FA2', domain: 'Recht', frage: 'Button-Lösung ("zahlungspflichtig bestellen", §312j)?', warum: 'Ohne korrekt beschrifteten Button kommt kein Vertrag zustande', default: 'eindeutige Button-Beschriftung', kosten: 'red', appliesWhen: 'fernabsatz' },
{ id: 'FA3', domain: 'Recht', frage: 'AGB + korrekte Preisangaben (PAngV, ggf. Grundpreise)?', warum: 'Informations-/Transparenzpflichten', default: 'AGB + korrekte Preisauszeichnung', kosten: 'yellow', appliesWhen: 'fernabsatz' },

// L · Abo (zusätzlich zu Fernabsatz)
{ id: 'AB1', domain: 'Recht', frage: 'Kündigungsbutton ("Verträge online kündigen", §312k)?', warum: 'Pflicht bei Online-Abos; fehlend → jederzeitige Kündbarkeit + Abmahnung', default: 'Kündigungs-Button ohne Login-Zwang', kosten: 'red', appliesWhen: 'abo' },
{ id: 'AB2', domain: 'Recht', frage: 'Laufzeit/Verlängerung/Kündigungsfristen transparent vor Abschluss?', warum: 'Verbraucherschutz; intransparente Verlängerung unwirksam', default: 'klare Laufzeit-Hinweise', kosten: 'yellow', appliesWhen: 'abo' },
```

**Web** braucht keine neuen Knoten — `L3` (Impressum), `L5` (Cookie-Consent), `L4` (BFSG bei b2c) decken es ab; sie werden über den Prompt aktiviert.

## 5. Analyse-Prompt (`src/lib/preflight/analyze.ts`)

`buildSystemPrompt` erweitern:

**Bekannte Fakten** um die neuen Pivots ergänzen:
```
- Plattform: ${pivots.platform}
- Vertriebsmodell: ${pivots.commercialModel}
```

**Ableitungsregeln** ergänzen:
```
- platform = 'native' oder 'both' → ST1–ST3 (Store) gelten; Web-Performance-Audit (Lighthouse) ist für native n/a
- platform = 'web' oder 'both' → L3 (Impressum), L5 (Cookie-Consent), L4 (BFSG bei b2c) gelten
- commercialModel = 'shop' → FA1–FA3 (Fernabsatz) gelten — ABER nur wenn businessModel = 'b2c' (Verbraucher); bei 'b2b' → na
- commercialModel = 'subscription' → FA1–FA3 UND AB1–AB2 gelten (Abo ist auch Fernabsatz); businessModel='b2c'-Vorbehalt wie oben
- commercialModel = 'marketplace' → FA1–FA3 gelten (Verbraucher-Seite); Marktplatz-Betreiberpflichten kurz im plain/action erwähnen
- commercialModel = 'none' → ST*/FA*/AB*-Verkaufsknoten = na
- stack = '' (leer = "weiß nicht") → behandle den Stack-bezogenen Kontext als offen UND empfiehl im 'action'-Feld der betroffenen Knoten einen begründeten Default-Stack für den erkannten Projekttyp
```

Checkliste-Bau (`KORSETT.map`) unverändert — die neuen Knoten kommen automatisch rein.

## 6. IntakePanel (`_components/IntakePanel.tsx`)

- **stack**: `<input type=text>` → `<select>` mit kuratierten Optionen + „Anderes" + „weiß nicht".
  - Optionen: `Next.js + Supabase`, `Next.js + Postgres/Prisma`, `React + Firebase`, `Astro`, `Remix`, `SvelteKit`, `Plain HTML/CSS/JS`, `Anderes`, `Weiß nicht`.
  - Bei „Anderes" → Freitextfeld einblenden (steuert `stack`-Wert).
  - Bei „Weiß nicht" → `stack = ''`.
  - State: `stackChoice` (Select-Wert) + abgeleiteter `stack`-String an den Parent.
- **Plattform** (neuer Select): Web-App · Native App (Store) · Beides · Weiß nicht → `platform`.
- **Vertriebsmodell** (neuer Select): Kein Verkauf · Shop (Einmalkauf) · Abo · Marktplatz · Weiß nicht → `commercialModel`.
- `DEFAULT_PIVOTS` erweitern: `platform: 'unsure'`, `commercialModel: 'none'` (Stack-Default bleibt `'Next.js + Supabase'`).
- `IntakePanelProps`: keine neuen Callbacks nötig — `pivots`/`onPivotsChange` tragen die neuen Felder bereits.

## 7. Ehrlichkeits-Hinweis (`_components/PreflightResult.tsx`)

Fester Block (über oder unter dem ReifegradSignal), schlicht (App-Welt, kein Marketing):

> **Was Pre-Flight gut kann:** Architektur-Lücken, Konventionen, Sicherheit & rechtliche Trigger aus deinem Konzept erkennen.
> **Wo es an Grenzen stößt:** Es ersetzt keine Rechtsberatung, bewertet nicht deinen Markt oder dein Geschäftsmodell, und sieht nur, was du ins Konzept schreibst — je konkreter dein Input, desto besser.

Styling: `var(--surface-cool)`-Box, `var(--text-secondary)`, kleiner Info-Icon (Phosphor `Info`, `weight="bold"`). Nur `var(--…)`-Farben.

## 8. Generierung (`generate.ts`)

Kein neuer Code nötig: `generateStartpaket(text, nodes, pivots)` bekommt die neuen `nodes` (FA/AB/ST) automatisch und reflektiert sie im Startpaket (Decisions-Log / Konventionen). Optionaler Prompt-Hinweis, dass bei offenen FA*/AB*-Knoten die nötigen Rechtsdokumente als TODO im Decisions-Log erscheinen — minimal halten.

## 9. Tests

- **Validator** (`validators/__tests__/preflight.unit.test.ts`): `platform`/`commercialModel` akzeptiert; Defaults greifen bei fehlenden Feldern; ungültige Werte abgelehnt.
- **Korsett** (`__tests__/korsett.unit.test.ts`): neue Knoten-IDs vorhanden (ST1–3, FA1–3, AB1–2), korrekte `appliesWhen`-Tags, eindeutige IDs.
- **analyze-Prompt** (`__tests__/analyze.unit.test.ts`): `buildSystemPrompt` enthält `Plattform`, `Vertriebsmodell` + die neuen Ableitungsregeln (String-Assertions; LLM-Call gemockt).
- **normalizePivots**: Alt-Objekt ohne neue Felder → Defaults.
- Bestehende Preflight-Tests bleiben grün; `analyze`-Mock-Fixtures um die neuen Pivot-Felder ergänzen.
- Vor Commit: `tsc`, `eslint src`, `pnpm lint:design`.

## 10. Dateien

**Geändert:** `types.ts` (+Typen, normalizePivots) · `validators/preflight.ts` · `korsett.ts` (+8 Knoten) · `analyze.ts` (Prompt) · `_components/IntakePanel.tsx` · `_components/PreflightResult.tsx` · Tests.
**Keine** neue Migration, keine neue Route.

## 11. Offene Mini-Entscheidungen (Defaults gesetzt)

- Stack-„weiß nicht" = leerer String (kein eigenes Sentinel) — einfachster rückwärtskompatibler Weg.
- Marktplatz: Verbraucher-Pflichten wie Shop + kurzer Betreiberpflicht-Hinweis; tiefer Marktplatz-Recht (P2B-VO etc.) = später.
- Ehrlichkeits-Block: statisch (kein LLM); Position über GapsSection.
