---
status: archived
updated: 2026-05-08
review_by: null
supersedes: []
---

# CONVENTIONS-Auslagerungs-Mini-Sprint — Hand-Over

## Status

Erfolgreich

## Aktion 1 — Migrations-Hinweis archiviert

Datei angelegt unter `docs/archive/2026-05/aufraeum-sprint-migrations-hinweis.md`.
CONVENTIONS-Sektion durch einzeiligen Verweis auf Archiv-Datei ersetzt.

## Aktion 2 — Tropen-Audit-Feature gemergt

### Diff-Tabelle (CONVENTIONS vs. v3 Achse 9)

| Inhalt | In CONVENTIONS | In v3 | Aktion |
|---|---|---|---|
| Findings 1–8 Tabelle | ✓ | ✓ | Identisch (minor: "deutsch+englisch parallel" vs. "deutsche+englische Varianten") — in CONVENTIONS gestrichen |
| Finding 9 (Außen-Sicht-Drift) | ✗ | ✓ | Nur in v3, bleibt dort |
| Severity-Differenzierung Finding 9 | ✗ | ✓ | Nur in v3, bleibt dort |
| Erkennung + Empirisch validiert | ✗ | ✓ | Nur in v3, bleibt dort |
| "Was Tropen nicht tut" | ✓ | ✓ | Identisch — in CONVENTIONS gestrichen |
| Substanz-Stand | ✗ | ✓ | Nur in v3, bleibt dort |

**Ergebnis:** CONVENTIONS war vollständige Untermenge von v3 — kein Inhalt musste nach v3 übertragen werden. Direkter Weg zu Schritt 5 (Verweis).

### Gemergt nach v3

Nichts — v3 hatte bereits alle Inhalte und mehr.

### Verbleibender Verweis in CONVENTIONS

Sektion durch einzeiligen Verweis ersetzt: *"Die Doku-Hygiene-Audit-Findings (Achse 9) werden in `docs/active/vision.md` Abschnitt 'Achse 9 — Doku-Hygiene als fünfte Wissens-Domäne' verwaltet."*

### 🟡-Eskalationen

Keine — CONVENTIONS war vollständige Untermenge, kein struktureller Mismatch.

## Aktion 3 — Querchecks

- **INDEX.md geprüft:** ✓ — keine Verweise auf entfernte Sektionen
- **Backlog geprüft:** ✓ — keine Verweise auf Migrations-Hinweis oder Tropen-Audit-Feature-Sektion
- **Active-Docs geprüft:** ✓ — keine Dangling References auf entfernte Sektionen

## Verbleibende Auffälligkeiten

- **v3 Achse 9 hat einen Header-Drift:** Sektion heißt "Acht Audit-Findings" aber die Tabelle hat 9 Rows (Finding 9 wurde nachträglich ergänzt). Kleiner Kosmetik-Fix, wurde nicht autonom durchgeführt (nicht im Auftrag).

## Empfehlung für nächsten Schritt

ADR-030 Profil-System Sparring oder Pause.
