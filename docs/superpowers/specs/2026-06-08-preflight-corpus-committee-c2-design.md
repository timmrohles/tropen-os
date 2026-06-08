# Pre-Flight — Komitee-Kuration des Regelkorpus (Scheibe C2)

**Datum:** 2026-06-08
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan
**Bezug:** C1-Spec (`2026-06-07-preflight-conventions-corpus-c1-design.md`), ADR-021 (Veredler — C2 ist dessen Vorarbeit), ADR-031 (Checker-Loop — gleiche Komitee-Maschinerie).
**Branch-Basis:** gestapelt auf `main` (C1 ist gelandet).

## 1. Problem & Ziel

C1 hat den Renderer + einen **hand-kuratierten 55-Regel-Seed** geliefert. C2 **skaliert den Korpus** aus den vorhandenen kuratierten Wissensquellen (Audit-Regeln + 21 Agent-Packs) — aber **kuratierend, nicht akkumulierend**. Ziel: ein **straffer, hochwertiger** Korpus, der mehr Abschnitte (Testing, Git, Do/Don't) und mehr Stacks abdeckt, ohne aufzublähen.

**Leitprinzip (verbindlich):** *Kuratieren & Konsolidieren, nicht transkribieren.* Der Mehrwert eines Komitees + Judge ist **Urteil** — auswählen, ähnliche Regeln zusammenführen, knapp „tun"-framen. Zielgröße **~80–120 Regeln total** (Seed 55 + ~30–65 generiert). Eine 200-Regeln-Wand ist so nutzlos wie die dünne Datei von früher.

## 2. Architektur

### 2.1 Quellen + Batching
- **Audit-Regeln:** Beschreibungen/Statements aus `src/lib/audit/checkers/rule-registry.ts` + den Checker-Modulen (nur die *Regel-Aussagen*, nicht die `check`-Funktionen).
- **Agent-Packs:** 21 Markdown-Dateien in `docs/agents/` (Prosa-Regeln).
- Verarbeitung in **Batches** (pro Audit-Kategorie bzw. pro Agent-Pack), damit kein Mega-Prompt entsteht. Je Batch ein Komitee-Lauf → Sammlung → globaler Dedup-/Konsolidierungs-Pass am Ende.
- Der **Hand-Seed** (`RULE_CORPUS`, 55 Regeln) wird jedem Batch als „BEREITS ABGEDECKT — nicht duplizieren, nur ergänzen" mitgegeben.

### 2.2 Komitee
Bestehendes **4-Modell + Opus-Judge**-Muster (analog `src/scripts/generate-agents.ts` / `committee-review.ts`), via AI Gateway:
Reviewer = `anthropic/claude-sonnet-4.6`, `openai/gpt-5.4`, `google/gemini-2.5-pro`, `deepseek/deepseek-chat`; Judge = `anthropic/claude-opus-4.6`.

### 2.3 Transformations-Auftrag (pro Quell-Regel → ConventionRule)
Das Komitee erzeugt `ConventionRule`-Objekte (C1-Typ):
- **„prüfen"→„tun"-Framing** (aus „erkenne fehlende X" wird „tue X").
- **`section`** aus dem geschlossenen Set zuweisen (§2.5).
- **`appliesWhen`** aus dem **geschlossenen Tag-Vokabular** (§2.5) — undefined = universell.
- **`severity`** (`must`/`should`).
- **`source`** (Herkunft, z.B. `audit:cat-3-rule-7` / `agent:TESTING`).
- **Ähnliche zusammenführen**, **gegen Seed + gegeneinander deduplizieren**, knapp halten.
- Judge konsolidiert/wählt → finale Liste.

### 2.4 Neue Abschnitte, die C2 abdecken soll
Die heute fehlenden, in den Packs vorhandenen Themen kommen dabei rein: **Testing** (TESTING_AGENT), **Git/Commits** (GIT_GOVERNANCE_AGENT), **Do/Don't**-Verdichtung. (Hinweis: Testing/Git brauchen ggf. eigene `section`-Werte — siehe §2.5 Erweiterung.)

### 2.5 Kontrolliertes Vokabular (kritisch)
Korpus-Tags **müssen Teilmenge** dessen sein, was `deriveCorpusTags` ausgibt — sonst **tote Regeln**. Beide Seiten werden in C2 **im Gleichschritt** erweitert. Das Komitee darf **nur** dieses Vokabular nutzen (nicht erfinden); Vorschläge für neue Tags → **menschliche Freigabe**, dann in beide Seiten.

**Sections** (Erweiterung des C1-Set um zwei): bestehend `overview`, `architecture`, `code-rules`, `naming`, `structure`, `db`, `error-handling`, `security`, `maintenance` — **neu:** `testing`, `git`. (Do/Don't wird *keine* eigene Section, sondern fließt verdichtet in die thematischen Abschnitte.)

**Stack-Tags** (`stack:`) — geschlossene Startliste:
`react` · `next` · `vue` · `nuxt` · `svelte` · `astro` · `remix` · `solid` · `angular` · `node` · `python` · `rails` · `go` · `php` · `java` · `dotnet` · `react-native` · `flutter` · `swift` · `kotlin`
(Granularität: Framework-Ebene im JS-Ökosystem, Sprach-Ebene sonst.)

**Weitere Tags:** `db:true` · `auth:true` · `platform:web` · `platform:native` · `commerce:true` (wie C1).

### 2.6 `deriveCorpusTags`-Erweiterung
`src/lib/preflight/corpus/render.ts` → `deriveCorpusTags` lernt die neuen Stack-Tags per Keyword-Match auf `pivots.stack` (z.B. `astro` → `stack:astro`, `django|fastapi|flask` → `stack:python`, `laravel` → `stack:php`, `rails` → `stack:rails`, `spring` → `stack:java`, `expo|react native` → `stack:react-native`, …). Deterministisch, kein LLM. Test ergänzt.

### 2.7 Output
- `src/lib/preflight/corpus/rule-corpus.generated.ts` → `export const GENERATED_CORPUS: ConventionRule[]`. **Startet als leeres Array** (`[]`) — so kompilieren Code/Merge/Tests schon, bevor der Komitee-Lauf es füllt (Seed-only läuft weiter). Der Lauf überschreibt die Datei mit den generierten Regeln.
- `render.ts` importiert beide und merged: `const FULL_CORPUS = [...RULE_CORPUS, ...GENERATED_CORPUS]`; `renderConventions` filtert über `FULL_CORPUS`.
- Beide Dateien committet → **klare Provenienz** (Hand vs. Komitee), diff-bar, C2 **re-runnable** ohne Hand-Regeln zu zerstören.

### 2.8 `SECTION_ORDER`/`SECTION_TITLE`-Ergänzung
`renderBaseline` (render.ts) um `testing` + `git` in `SECTION_ORDER` (sinnvolle Position, z.B. nach `error-handling`) + `SECTION_TITLE` erweitern.

## 3. Qualitäts-Gates
- **Struktur-Test** über `FULL_CORPUS`: IDs eindeutig über **beide** Dateien · jede `section` aus dem gültigen Set · jedes `appliesWhen`-Tag aus dem **Vokabular** (sonst tote Regel → Testfehler) · keine ID-Kollision Seed↔generiert.
- **Vokabular-Kohärenz-Test:** jedes im Korpus genutzte `stack:`-Tag wird auch von `deriveCorpusTags` für irgendeinen Beispiel-Stack ausgegeben (kein totes Tag).
- Bestehende Tests bleiben grün (`renderConventions`, `rule-corpus`, `render`).
- **Menschlicher Review** des generierten Korpus (Produkt-Inhalt — Komitee kann mis-taggen/halluzinieren). Timm überfliegt die ~30–65 generierten Regeln vor dem finalen Commit.

## 4. Run-Mechanik
- Script `src/scripts/generate-corpus.ts`, env-geladen (wie die anderen Komitee-Skripte: `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/generate-corpus.ts`).
- Ein Komitee-Lauf (~€, Größenordnung Agent-Generierung). Schreibt `rule-corpus.generated.ts`. Controller/Timm fährt es, dann Review + Tests.
- Idempotent: erneuter Lauf überschreibt `rule-corpus.generated.ts` (Hand-Seed unberührt).

## 5. Dateien
**Neu:** `src/scripts/generate-corpus.ts` (Komitee-Skript) · `src/lib/preflight/corpus/rule-corpus.generated.ts` (Output, committet) · `src/lib/preflight/corpus/vocabulary.ts` (geschlossenes Tag-/Section-Vokabular als Single Source — von Komitee-Skript, deriveCorpusTags und Tests genutzt).
**Geändert:** `render.ts` (deriveCorpusTags neue Stacks · SECTION_ORDER/TITLE +testing/git · FULL_CORPUS-Merge) · `corpus/types.ts` (`ConventionSection` +`testing`+`git`) · Struktur-Tests.

## 6. Bewusst draußen (Folge-Scheiben)
Tool-Profile / Cube (Einzel-Emit, erklärter Handover) · Audit-/Veredler-Renderer aus dem Korpus · Befehle/Setup-Projekt-Schicht + Arbeitsweise-Pivot · Checker-Verbesserungs-Loop (ADR-031).
