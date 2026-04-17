# SPEC_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-17
created_by: committee-sprint11
category: cat-18 (Dokumentation) — rules 9–12
agentSource: spec
related:
  - agent: content
    type: extends
    boundary: >
      CONTENT_AGENT (cat-18-rule-7, cat-18-rule-8) checks README length and CHANGELOG.
      SPEC_AGENT checks AI context file quality and cross-references between docs and code.
      They share the category but serve different audiences:
      content → "does documentation exist?", spec → "does it give AI tools real context?"
  - agent: architecture
    type: complements
    boundary: >
      ARCHITECTURE_AGENT (cat-1-rule-5) checks ADRs for technical decisions.
      SPEC_AGENT checks product requirements (PRD). Both are "context for AI tools"
      but at different levels: tech decisions vs product intent.
  - agent: slop
    type: complements
    boundary: >
      SLOP detects what is wrong in existing files (placeholders, fingerprints).
      SPEC detects what is missing (no .cursorrules, no PRD, no stack context).
```

## Zweck

Prüft die **Qualität** von KI-Kontext-Dateien und Projekt-Spezifikationen.

**Nicht** ob sie existieren (cat-18-rule-1/7 macht das bereits) —
**sondern** ob sie gut genug sind um KI-Tools echten Kontext zu geben.

**Kernthese (aus Konferenz-Konsens):**
> "Context Is the New Code."
> KI-Tools generieren Code basierend auf verfügbarem Kontext.
> Schlechter Kontext → generische Vermutungen.
> Guter Kontext (.cursorrules, CLAUDE.md, PRD) → projektspezifischer Code.

## Konferenz-Bestätigung

| Talk | Konferenz | Kernaussage |
|------|-----------|-------------|
| "Context Is the New Code" | Patrick Debois, AIE 2026 | Kontext-Qualität bestimmt Code-Qualität |
| "BDD ADR PRD WTF: Capturing Decisions for Humans and AI Alike" | AIE 2026 | Schriftliche Specs als AI-Kontext |
| "Skills, Templates and Components for Claude Code" | AI Coding Summit 2026 | CLAUDE.md als produktivitätskritisch |
| "Tools and Processes Supporting Vibe Coding" | VibeX 2026 | Context-Dateien als Vibe-Coder-Basis |

**Komitee-Entscheidung 2026-04-17:**
- SPEC_AGENT = zweiter neuer Agent nach SLOP
- Erwartete Hit-Rate: 40–60% (universell nützlich)
- ROI: Mittel-Hoch

## Ton-Richtlinie

```
NICHT: "Du hast keine Dokumentation"
NICHT: "Dein Projekt ist unstrukturiert"
SONDERN: "Ohne diesen Kontext arbeitet dein KI-Tool mit Vermutungen"
SONDERN: "Diese Datei fehlt → dein KI-Tool weiß nicht, welchen Stack du verwendest"
```

---

## Regeln

### R1 — KI-Kontext-Datei vorhanden und vollständig [ADVISORY]

**ID:** cat-18-rule-9 | **Gewicht:** ×2 | **FixType:** code-gen

**Geprüfte Dateien:** `.cursorrules`, `CLAUDE.md`, `.cursor/rules`, `docs/CLAUDE.md`, `.ai/rules.md`

**Score-Logik:**
- Datei vorhanden UND > 200 Zeichen → **Score 5** (pass)
- Datei vorhanden ABER < 200 Zeichen → **Score 2**, severity: medium
- Keine Datei gefunden → **Score 3**, severity: info

**Abgrenzung:**
- cat-18-rule-1 prüft: README vorhanden?
- cat-18-rule-7 prüft: README lang genug?
- Diese Regel prüft: Gibt es eine `.cursorrules` / `CLAUDE.md` und ist sie substantiell?

**Suggestion-Template (zu kurz):**
```
Cursor-Prompt: 'Expand .cursorrules to include: tech stack (framework, DB, auth),
coding conventions, forbidden patterns (e.g., no direct DB calls from frontend),
and the 5 most important project-specific rules'
```

---

### R2 — PRD oder Requirements-Dokument vorhanden [ADVISORY]

**ID:** cat-18-rule-10 | **Gewicht:** ×1 | **FixType:** code-gen

**Geprüfte Dateien:**
`docs/PRD.md`, `docs/spec.md`, `SPEC.md`, `PRD.md`,
`docs/requirements.md`, `docs/product.md`, `docs/product-spec.md`

**Skip:** Repos mit < 20 Dateien (Micro-Projekte)

**Severity:** info

**Warum:** Ohne schriftliche Anforderungen generiert KI was sie vermutet.
README-Implementation-Drift ist die häufigste Folge.

**Suggestion-Template:**
```
Cursor-Prompt: 'Create docs/PRD.md with:
- Problem statement (1 sentence)
- Target user (1 sentence)
- Core features (5 bullets)
- Out-of-scope (3 bullets)'
```

---

### R3 — README-Implementation-Drift [ADVISORY]

**ID:** cat-18-rule-11 | **Gewicht:** ×1 | **FixType:** code-gen

**Check:** Packages in Backticks im README (`` `react-query` ``) die NICHT in `package.json` vorhanden sind.

**Threshold:** ≥ 2 solche Packages → Finding

**Severity:** info

**Abgrenzung zu cat-18-rule-7 (checkReadmeQuality):**
cat-18-rule-7 prüft README-Länge (is it substantive?).
Diese Regel prüft README-Inhalt vs. tatsächlicher Tech-Stack (is it current?).

**False-Positive-Risiken:**
- READMEs die Peer-Dependencies erwähnen
- READMEs die Alternativen empfehlen ohne sie zu nutzen
- Mitigation: Threshold ≥ 2, only hyphenated package names

---

### R4 — .cursorrules enthält Tech-Stack [ADVISORY]

**ID:** cat-18-rule-12 | **Gewicht:** ×1 | **FixType:** code-fix

**Voraussetzung:** `.cursorrules` existiert UND > 200 Zeichen (sonst cat-18-rule-9)

**Stack-Keywords:** next, react, vue, svelte, angular, nuxt, remix, node, express,
fastify, hono, nestjs, supabase, prisma, postgres, mongodb, mysql, sqlite, drizzle,
typescript, python, rust, go, tailwind, shadcn, radix, vercel, railway

**Severity:** info

**Suggestion:** `'Add at the top of .cursorrules: "Tech Stack: [Next.js 15 / Supabase / TypeScript / Tailwind]"'`

---

## Erwartete Rate

| Repo-Typ | Erwartete Rate | Primäre Regeln |
|----------|---------------|----------------|
| Lovable | 50–70% | R1 (kein .cursorrules), R2 (kein PRD) |
| Bolt | 60–75% | R1 (.bolt/prompt ≠ .cursorrules), R2 |
| Cursor | 20–40% | R3 (README-Drift), R4 (kein Stack-Keyword) |
| Manual | 10–30% | R2 (kein PRD), R3 (veraltetes README) |

---

## Checker-Datei

`src/lib/audit/checkers/spec-checker.ts`

Exports:
- `checkAiContextFile` → cat-18-rule-9
- `checkPrdPresent` → cat-18-rule-10
- `checkReadmeDrift` → cat-18-rule-11
- `checkCursorrulesHasStack` → cat-18-rule-12

---

## Kalibrierungs-Plan

| Phase | Schritt | Trigger |
|-------|---------|---------|
| 1 | Benchmark v8 über 49 Repos | Sprint 12 (jetzt) |
| 2 | FP-Rate messen, besonders R3 (Drift) | Nach v8 |
| 3 | R3 Threshold ggf. auf ≥3 erhöhen wenn FP > 20% | Sprint 13 |
| 4 | R1 Gewicht ×2→×3 wenn Hit-Rate > 60% und FP < 10% | Sprint 13 |

---

_Agent v1.0 — implementiert Sprint 11 (2026-04-17)_
_Benchmark v8 geplant nach SLOP + SPEC + neuen Gewichten_
