---
status: archived
updated: 2026-05-07
review_by: null
supersedes: []
---

# Migrations-Hinweis — Aufräum-Sprint 2026-05-07

Migrations-Hinweis aus dem Aufräum-Sprint vom 2026-05-07. Ursprünglich Sektion in CONVENTIONS.md, archiviert am 2026-05-08 nach Sprint-Abschluss.

---

Beim ersten Inkraftsetzen dieser Konvention liegt der Tropen-Repo-Bestand in der alten Struktur (Themen-Ordner unter `docs/`). Der Aufräum-Sprint migriert wie folgt:

| Heute | Ziel | Aktion |
|---|---|---|
| `docs/product/*.md` | `docs/active/*.md` | Verschieben + Frontmatter ergänzen |
| `docs/adr/*.md` | `docs/decisions/NNN-*.md` | Verschieben, Nummerierung normalisieren |
| `docs/plans/*.md` | `docs/active/*.md` oder `docs/archive/` je nach Status | Pro Datei entscheiden |
| `docs/synthese/*.md` | `docs/archive/2026-04/` | Snapshot-Charakter, Archiv |
| `docs/handover/*.md` | `docs/archive/YYYY-MM/` | Übergaben sind per Definition Snapshots |
| `docs/audit-reports/*.md` | bleiben — eigene Domäne, nicht Doku im engen Sinn | Ausnahme |
| `docs/committee-reviews/*.md` | bleiben — eigene Domäne | Ausnahme |
| `docs/inventory/*.md` | `docs/archive/2026-04/` | Alte Inventur-Snapshots |
| `docs/inventur/*.md` | `docs/archive/2026-05/` | Aktuelle Inventur ist Snapshot, gehört archiviert |
| `docs/agents/*.md` | bleiben oder `docs/active/` — strukturelle Frage | Aufräum-Sprint klärt |

Die Ausnahmen (`audit-reports/`, `committee-reviews/`) sind keine Doku im engen Sinn, sondern Tool-Outputs mit eigener Verzeichnis-Logik. Für sie gilt die Konvention nicht 1:1.
