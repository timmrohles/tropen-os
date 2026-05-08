---
status: archived
updated: 2026-05-08
review_by: null
supersedes: []
---

# CONVENTIONS-Drift-Behebung — Hand-Over

## Status

Erfolgreich

## Vier Aktionen

| # | Aktion | Status |
|---|---|---|
| 1 | Backlog-Schema-Sektion eingebaut (+ must-Severity) | ✓ |
| 2 | extends-Feld vollständig dokumentiert | ✓ |
| 3 | INDEX.md mit thematischen ADR-Gruppen | ✓ |
| 4 | ADR-029 in Audit-Engine-Gruppe eingetragen | ✓ (Teil von Aktion 3) |

## ADR-Gruppen-Einsortierung

| Gruppe | ADRs | Anzahl |
|--------|------|--------|
| Strategie & Marke | 023, 024, 028 | 3 |
| Audit-Engine | 025, 026, 027, 029 | 4 |
| Stack & Infrastruktur | 001–019 | 19 |
| Wissens- & Doku-Architektur | 020, 021, 022 | 3 |

**Keine Gruppe "Tooling"** — keiner der 29 ADRs passt klar in "Komitee/Build-Prozess/Tool-Integrationen". Das ist kein Lücke, sondern Beobachtung: Tropen hat bisher keine ADRs zu Build-Prozessen geschrieben. Wenn ADR-030 (Profil-System) oder spätere ADRs Build-Prozess-Charakter haben, kann "Tooling" als fünfte Gruppe nachträglich eingeführt werden.

**Kein Superseded-Bereich** — alle 29 ADRs zeigen `status: active` oder `status: accepted` im INDEX. Keiner wurde als `superseded` markiert. Dieser Status sollte beim nächsten Quartals-Audit manuell geprüft werden (einige ältere ADRs könnten faktisch überholt sein).

## Verbleibende Auffälligkeiten

- **Migrations-Hinweis-Sektion in CONVENTIONS.md** ist one-time-Kontext für den Aufräum-Sprint, der bereits durchgeführt wurde. Die Sektion hat ihren Zweck erfüllt — Archivierung wäre sauber, wurde im Sprint aber nicht durchgeführt (nicht im Auftrag).
- **Tropen-Audit-Feature-Sektion in CONVENTIONS.md** hat Produkt-Inhalt-Charakter, nicht Konvention-Charakter — gehört perspektivisch in `audit-system.md`. Wurde im Sprint nicht durchgeführt (nicht im Auftrag).
- **Kein Inhaltsverzeichnis** in CONVENTIONS.md (nach Erweiterungen jetzt ~370 Zeilen). Empfehlung aus Lese-Sprint bleibt offen.

## Empfehlung für nächsten Schritt

ADR-030 (Profil-System) Sparring vorbereiten, oder Pause. CONVENTIONS-Strukturierungs-Empfehlungen (ToC, Auslagerung Tropen-Audit-Feature, Archivierung Migrations-Hinweis) können in einem späteren Mini-Sprint gebündelt werden.
