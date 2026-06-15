# Pre-Flight — Korpus-Konsolidierung (Scheibe C2b)

**Datum:** 2026-06-08
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan
**Bezug:** C2-Spec (`2026-06-08-preflight-corpus-committee-c2-design.md`), ADR-034 (Compliance-Korpus).
**Branch-Basis:** `claude/preflight-corpus-c2`.

## 1. Problem

Der C2-Komitee-Lauf (29 Packs) produzierte **217 generierte Regeln** (+ 55 Seed = 272 total, **171 universell**) — geblähte, unbenutzbare CLAUDE.md (42 Pflege-Regeln etc.), plus **Domänen-Vermischung** (KI-/Compliance-Regeln aus Compliance-Packs als universelle code-rules). Ursache: pro-Pack ~8 Regeln, nur ID-Dedup, **keine globale Konsolidierung**, und alle 29 Packs (inkl. Compliance-Agenten) ungefiltert.

Der Roh-Output ist gesichert: `docs/superpowers/c2-committee-raw-2026-06-08.ts.txt` (217 Regeln, je mit `source: agent:<PACK>`).

## 2. Ziel

Aus dem Roh-Output einen **straffen, korrekt einsortierten Korpus** konsolidieren: **~85–120 total** (Seed 55 + ~30–65 generiert), Compliance-Regeln raus, KI-Engineering bedingt statt universell, Near-Dupes gemerged, ≤~6 universelle Regeln pro Sektion. **Kein** 29-Pack-Re-Run (reuse Roh).

## 3. Komponenten

### 3.1 Roh als Modul (`src/scripts/corpus-gen/raw-rules.ts`)
Der gesicherte Roh-Output wird ein importierbares Modul: `export const RAW_RULES: ConventionRule[] = [ … 217 … ]`, Import `@/lib/preflight/corpus/types`. (Einmalige mechanische Konvertierung aus der `.txt`.)

### 3.2 Vokabular +`ai:true` (`vocabulary.ts` + `render.ts`)
- `OTHER_TAGS` += `'ai:true'`.
- `deriveCorpusTags`: erkennt KI im Stack-String (`openai|anthropic|llm|ai-sdk|gpt|claude|gemini|langchain|vercel ai`) ODER ai-Node → `tags.add('ai:true')`. Deterministisch.

### 3.3 Quellen-Filter (`src/scripts/corpus-gen/consolidate.ts`)
```typescript
export const EXCLUDED_SOURCES = ['DSGVO', 'AI_ACT', 'BFSG', 'LEGAL', 'AGENT_QUALITY'] // → ADR-034 / meta
export function filterBySource(rules: ConventionRule[]): ConventionRule[]  // drop rules whose source contains an excluded pack
export function groupBySection(rules: ConventionRule[]): Record<ConventionSection, ConventionRule[]>
```
`filterBySource`: behält Regeln, deren `source` KEINEN der `EXCLUDED_SOURCES` enthält (case-insensitive Substring). Gemischte Packs (AI_INTEGRATION/ANALYTICS/CONTENT) bleiben — der Konsolidierungs-Pass droppt einzelne Compliance-Regeln.

### 3.4 Konsolidierungs-Skript (`src/scripts/generate-corpus-consolidate.ts`)
- Provider: `getAnthropicModel` **mit `baseURL: 'https://api.anthropic.com/v1'`**, Modell **`claude-opus-4-8`** (Konsolidierung = Urteilsarbeit). `load-env`-Import zuerst.
- Ablauf: `RAW_RULES` → `filterBySource` → `groupBySection`. Für jede **CONTENT_SECTION** (9): ein Opus-Call mit
  - System: „Du konsolidierst Konventions-Regeln. NUR diese Section: `<sec>`. NUR diese appliesWhen-Tags: `[ALL_TAGS]` (inkl. ai:true). Output: NUR ein JSON-Array von ConventionRule. Regeln: imperativ („tun"), prägnant; **ähnliche zusammenführen**; **max ~6 universelle** (kein appliesWhen) + relevante bedingte; **reine Rechts-/Compliance-/KI-Transparenz-Regeln WEGLASSEN** (gehören woanders hin); KI-Engineering → `appliesWhen:['ai:true']`."
  - User: „BEREITS IN DER BASELINE (nicht duplizieren): `[Seed-Regeln dieser Sektion, kompakt]`\n\nKANDIDATEN zum Konsolidieren: `[gefilterte Roh-Regeln dieser Sektion]`."
  - `parseRules` → `validateAgainstVocab` → sammeln.
- Nach allen Sektionen: `dedupeRules(all, seedIds)` → schreibe `rule-corpus.generated.ts` (wie C2: `JSON.stringify`, Header-Kommentar). Konsolen-Log: Anzahl + Total.
- Helfer `parseRules`/`validateAgainstVocab`/`dedupeRules` aus C2 (`corpus-gen/postprocess.ts`) wiederverwenden.

## 4. Run-Mechanik
`npx tsx src/scripts/generate-corpus-consolidate.ts` (env via load-env). ~9 Opus-Calls (klein, günstig). Controller/Timm fährt + reviewt das Ergebnis. Skript wird mit gemockten Helfern nicht-real getestet; der echte Lauf ist Controller-Schritt.

## 5. Qualitäts-Gates
- `filterBySource`/`groupBySection`-Tests (deterministisch).
- `deriveCorpusTags` ai:true-Test.
- Bestehende Integritäts-/Vokabular-Tests bleiben grün (nach echtem Lauf gegen die ECHTEN generierten Regeln).
- **Erfolgs-Kriterium nach dem Lauf:** Total **≤~120**, universelle Regeln **≤~6 pro Sektion**, keine Compliance-/KI-Transparenz-Regeln in den Konventionen. Menschlicher Review.

## 6. Dateien
**Neu:** `corpus-gen/raw-rules.ts` (Roh-Modul) · `corpus-gen/consolidate.ts` (Filter/Gruppieren + Tests) · `generate-corpus-consolidate.ts` (Skript).
**Geändert:** `vocabulary.ts` (+ai:true) · `render.ts` (deriveCorpusTags ai-Erkennung) · `corpus-integrity`-Test (ai:true im Vokabular-Sample) · `rule-corpus.generated.ts` (nach Lauf).

## 7. Draußen
Compliance-Korpus (ADR-034, die ausgefilterten Regeln) · Tool-Profile/Cube · 2b-Tour.
