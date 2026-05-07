---
status: archived
updated: 2026-05-07
review_by: null
supersedes: []
---

# Hand-Over — README-Mini-Sprint 2026-05-07

3-Phasen-Sprint: Score-Schwellen-Klärung, CONVENTIONS-Erweiterung, README-Schrumpfung.

---

## Phase 1 — Score-Schwellen-Befund

**Frage:** Welcher Wert ist hardcoded als "Production Grade"-Schwelle — 85% oder 90%?

**Befund: 90%**

**Exakte Code-Stelle:**
- Datei: `src/lib/audit/scoring/score-calculator.ts`
- Zeile 27: `if (percentage >= 90) return 'production-grade'`

**Bestätigt durch:**
- `src/app/[locale]/(app)/dashboard/page.tsx` Zeile 13: `if (score >= 90) return 'production_grade'`
- `src/app/[locale]/(app)/dashboard/page.tsx` Zeile 53: `{ label: 'Production Grade', threshold: 90 }`
- `src/lib/audit/export-rules.ts` Zeile 150: `'- 90%+ Production Grade → Ziel für etablierte Produkte'`

**Drift entdeckt:**
- `docs/active/audit-system.md` (Zeile 48) zeigt die Tabelle mit `85–100 | Production Grade` — das ist der alte Wert
- README hatte `90–100% | Production Grade` — stimmte mit Code überein (wurde im Sprint entfernt)
- `CLAUDE.md` zeigt ebenfalls `90–100% | Production Grade` — stimmte mit Code überein

**Konsequenz:** `docs/active/audit-system.md` enthält veralteten Schwellwert (85% statt 90%). Dieser Befund wird als v3-Merge-Block (Finding 9) dokumentiert. Korrektur der audit-system.md ist separater Sprint (nicht Teil dieses Sprints — "Code ist Wahrheit für Score-Schwellen").

---

## Phase 2 — CONVENTIONS.md Bestätigung

Neuer Abschnitt "Top-Level-Außen-Sicht-Dateien" vor dem Migrations-Hinweis eingefügt.

Inhalt:
- Drei betroffene Dateien: README.md, CHANGELOG.md, package.json description
- 4 Pflicht-Punkte: Frontmatter, keine isolierten Zahlen, Verweis-Pattern, review_by 90 Tage
- Begründung: Drift-Schutz
- Achse-9-Audit-Regel: Finding 9 im Zielbild angekündigt

Frontmatter `updated: 2026-05-07` war bereits korrekt gesetzt.

Commit: `docs: CONVENTIONS.md — Abschnitt Top-Level-Außen-Sicht-Dateien`

---

## Phase 3 — README-Änderungstabelle

| Was | Vorher | Nachher |
|-----|--------|---------|
| Frontmatter | fehlte | `status: active / updated: 2026-05-07 / review_by: 2026-08-07` |
| Regelzahl in Tagline | "255 Regeln" | "umfangreichem Regelwerk (Kategorie-Details: `CLAUDE.md`)" |
| Agenten-Anzahl in Tagline | "Multi-Model-Review" (implizit) | "Multi-Model-Komitee-Agenten (Details: `docs/agents/`)" |
| Kategorienzahl "Was es tut" | "26 Kategorien" | "mehrere Kategorien" |
| Benchmark-Zahl | "49 öffentliche Repos" | "öffentliche Repos aus verschiedenen Kategorien" |
| Score-Tabelle | vollständige Tabelle mit 90%/80%/60%-Schwellen + "~96%" | entfernt, ersetzt durch Verweis auf `docs/active/audit-system.md` |
| Agent-Zahl Projektstruktur | "29 Agent Rule Packs" | "Agent Rule Packs" |
| Agent-Zahl Docs-Tabelle | "29 Agent Rule Packs" | "Agent Rule Packs" |
| Docs-Tabelle Beschreibung CLAUDE.md | "Vollständige Codebase-Referenz" | Zusatz "(Regelwerk, Kategorien, Scoring)" |

---

## CHANGELOG.md Status

Kein `CHANGELOG.md` am Repo-Root vorhanden (nur in node_modules). Kein Handlungsbedarf für diesen Sprint. Eigener Sprint wenn CHANGELOG eingeführt wird — dann Frontmatter-Pflicht und Konvention aus CONVENTIONS.md Abschnitt "Top-Level-Außen-Sicht-Dateien" anwenden.

---

## package.json Status

Kein `description`-Feld in `package.json` vorhanden. Keine Aktion nötig (Konvention greift nur wenn harte Zahlen enthalten — Feld fehlt ganz).

---

## v3-Merge-Block (Finding 9 für Achse 9)

Dieser Block gehört in `docs/active/zielbild.md` (Achse 9, Finding-Liste), aber nicht in diesem Sprint — nur dokumentieren.

```
| 9 | Außen-Sicht-Drift: Top-Level-Doku-Dateien (README, CHANGELOG, package.json) enthalten Fakten/Zahlen/Pfade die von normativen Quellen abweichen | Should |
```

**Severity-Differenzierung Finding 9:**
- **Critical:** Außen-Sicht und normative Quelle dokumentieren unterschiedliche Werte zum gleichen Schwellwert/Konzept
- **Should:** Außen-Sicht enthält veraltete Zahlen oder Pfade ohne direkten Widerspruch

**Erkennung:** Pattern-Match Zahlen/Pfade/Schwellwerte in README/CHANGELOG/package.json, Cross-Check gegen docs/active/ und CLAUDE.md. Falsifikation manuell — daher Should-Default.

**Was Tropen nicht tut:** Beurteilen welche Quelle richtig ist — Diskrepanz melden, User löst auf.

---

## Offener Drift (nicht in diesem Sprint korrigiert)

`docs/active/audit-system.md` Zeile 48: Tabelle zeigt `85–100 | Production Grade`.
Code (`score-calculator.ts` L27) sagt 90%.
Das ist ein aktiver Drift-Fall für Finding 9. Korrektur: separater Sprint, Timm entscheidet.
