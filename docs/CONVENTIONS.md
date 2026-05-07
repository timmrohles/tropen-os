---
status: active
updated: 2026-05-07
review_by: 2026-08-07
supersedes: []
---

# Doku-Konvention — Tropen OS

> **Zweck:** Ende des Doku-Wildwuchses. Klare Regeln für jede Doku-Datei im Repo: wo sie liegt, welche Metadaten sie trägt, wie sie aktualisiert wird, wann sie archiviert wird.
> **Grundlage:** K0.6 Komitee-Sprint vom 2026-05-07 (5 Modelle + Opus-Judge), Familie A+C kombiniert.
> **Verbindlich seit:** 2026-05-07 (alle neuen Dokumente). Bestand wird im Aufräum-Sprint migriert.

---

## Pflicht-Sequenz für jeden Doku-Schreibvorgang

Jeder Bau-Agent (Claude Code, Cursor, Lovable, andere) und jeder Mensch hält diese Sequenz ein, bevor eine Doku-Datei angelegt oder geändert wird:

1. **`docs/INDEX.md` lesen.**
2. **Existenz-Check:** Gibt es bereits eine Datei zum gleichen Thema im aktiven Bestand?
3. **Wenn ja:** Bestehende Datei aktualisieren. Niemals neue Datei mit -v2/-new/-final-Suffix anlegen.
4. **Wenn nein:** Neue Datei anlegen, mit gültigem Frontmatter (siehe unten), und in `docs/INDEX.md` eintragen.
5. **Bei Pivot/Ablöse:** Alte Datei in selbem Schritt nach `docs/archive/YYYY-MM/` verschieben, Frontmatter auf `status: superseded` setzen, `superseded_by`-Feld füllen. Neue Datei trägt `supersedes`-Feld zurück auf alte Datei.

Wer diese Sequenz überspringt, verstößt gegen die Konvention. Der Verstoß ist auditierbar (siehe Tropen-Audit-Feature unten).

---

## Verzeichnis-Struktur

```
docs/
  INDEX.md                  # Pflicht-Eingang, listet alle aktiven Dokumente
  CONVENTIONS.md            # diese Datei
  active/                   # alle lebenden Dokumente, Singleton pro Thema
  decisions/                # nummerierte ADRs (unveränderliche Nummern)
  archive/
    YYYY-MM/                # archivierte Dokumente, gruppiert nach Monat
```

**Drei Funktionsordner statt Themenordner.** Begründung: Wenn Themen-Ordner (`product/`, `strategy/`, `roadmap/`) verwendet werden, entsteht das Wildwuchs-Problem zurück, weil dieselbe Datei oft zwei Themen berührt. Funktions-Ordner sind eindeutig: lebt sie? entscheidet sie? oder ist sie tot?

**Was nicht erlaubt ist:**
- Parallele Top-Level-Verzeichnisse (`documents/`, `notes/`, `wiki/`, `docs-old/`, `docs-new/`)
- Eigene Themen-Unterordner unterhalb von `active/` (alles flach)
- Verzeichnisse mit deutschen und englischen Varianten parallel (z.B. `docs/inventory/` und `docs/inventur/`)

**Tropen-Repo-Realität:** Vor Aufräum-Sprint existieren noch viele Themen-Ordner. Die Migration verschiebt sie in `active/` mit eindeutigen Datei-Namen.

---

## Frontmatter-Schema (Pflicht für jede Datei in `active/` und `decisions/`)

Jede Datei beginnt mit YAML-Frontmatter zwischen `---`-Zeilen:

```yaml
---
status: active            # active | draft | superseded | archived
updated: 2026-05-07       # ISO-Datum letzter inhaltlicher Update
review_by: 2026-08-07     # ISO-Datum, bis wann Re-Review fällig
supersedes: []            # Liste von Pfaden zu abgelösten Dateien
superseded_by: null       # nur wenn status=superseded: Pfad zur Nachfolge-Datei
---
```

**Status-Werte und ihre Bedeutung:**

| Status | Bedeutung | Speicherort |
|---|---|---|
| `active` | Lebendes, normatives Dokument | `docs/active/` oder `docs/decisions/` |
| `draft` | Entwurf, noch nicht normativ — max. 14 Tage Lebensdauer | `docs/active/` mit Markierung im Index |
| `superseded` | Abgelöst durch Nachfolge-Dokument, im Archiv | `docs/archive/YYYY-MM/` |
| `archived` | Historisch relevant, nicht mehr aktiv, ohne Nachfolge | `docs/archive/YYYY-MM/` |

**Frontmatter ist Pflicht, nicht Empfehlung.** Eine Datei in `active/` oder `decisions/` ohne gültiges Frontmatter ist ein Verstoß gegen die Konvention.

---

## Datei-Namen-Konvention

**In `active/`:**
- Stabile Namen ohne Versionssuffix: `roadmap.md`, `zielbild.md`, `marken-brief.md`
- **Keine** `-v2`, `-new`, `-final`, `-copy`, `-old`, `-2026-q3`-Suffixe
- Versionierung läuft über Git-Historie, nicht über Dateinamen
- Eindeutiger Slug pro Thema — wenn das Thema sich ändert, ändert sich der Name (über Supersedes-Kette)

**In `decisions/`:**
- Format: `NNN-kurz-titel.md` mit dreistelliger Nummer
- Nummern sind unveränderlich, auch nach Verwerfen einer ADR
- Verworfene ADR-Nummern werden nicht wiederverwendet — Lücken in der Nummerierung sind erlaubt

**In `archive/YYYY-MM/`:**
- Originaler Dateiname bleibt, Status wird auf `superseded` oder `archived` gesetzt
- Nur eine Ausnahme: Wenn beim Archivieren bereits eine Datei mit gleichem Namen im selben Monats-Ordner liegt, Suffix `-1`, `-2` als Disambiguator

**In `docs/`-Root:**
- Nur `INDEX.md` und `CONVENTIONS.md` direkt am Top-Level — sonst nichts

---

## Drift-Schutz-Mechaniken

Drei Mechaniken laufen parallel:

**1. INDEX.md als Pflicht-Eingang.** Jede Datei in `active/` und `decisions/` hat einen Eintrag im Index. Eine Datei ohne Index-Eintrag ist eine "verwaiste Datei" — auditierbarer Verstoß.

**2. Supersedes-Kette mit atomarem Archivieren.** Eine Pivot-Aktion ist immer atomar: Alte Datei wird in `archive/` verschoben mit `status: superseded` und `superseded_by` gefüllt; gleichzeitig neue Datei in `active/` mit `supersedes`-Liste, die zurück zeigt. Strukturell ausgeschlossen, dass zwei "lebende" Versionen parallel existieren.

**3. `review_by`-Verfallsdatum + Quartals-Audit.** Default 90 Tage. Wenn das Datum überschritten ist, muss die Datei entweder aktualisiert (mit neuem `review_by`), als `superseded` markiert oder archiviert werden. Quartals-Audit-Prompt steht im Anhang dieser Datei.

---

## Verbindlichkeits-Schichtung

**Pflicht** — Verstoß ist Bug:
- Frontmatter mit gültigem `status`, `updated` auf jeder Datei in `docs/active/` und `docs/decisions/`
- Eintrag in `docs/INDEX.md` für jede Datei in `active/`
- Keine Datei-Suffixe `-v2`, `-new`, `-final`, `-copy`, `-old`
- Existenz-Check vor Neuanlage (Pflicht-Sequenz Schritt 2)
- Atomares Archivieren bei Pivot

**Empfehlung** — Verstoß ist Hinweis, nicht Bug:
- `review_by`-Feld für active-Dateien (default 90 Tage)
- ADR-Erstellung bei Entscheidungen mit >2 Wochen Tragweite
- 1 Bildschirmseite max. pro `active`-Datei (lange Inhalte aufteilen oder ADRs)

**Freistil** — keine Konvention:
- Inhaltliche Struktur der Dokumente
- Sprache (deutsch / englisch — pro Datei konsistent)
- README-Format
- Code-Kommentare

---

## Tool-Adapter

**Eine Wahrheit, mehrere Pointer.**

Tropen-Doku-Wahrheit liegt in `docs/active/` und `docs/decisions/`. Bau-Agenten lesen sie über tool-spezifische Pointer-Dateien, die maximal 3 Zeilen lang sind und ausschließlich auf den Kern verweisen.

| Tool | Pointer-Datei | Inhalt |
|---|---|---|
| Claude Code | `CLAUDE.md` (Repo-Root) | Pointer auf `AGENTS.md` plus operativer Code-Inhalt (Tech-Stack, Code-Regeln) |
| Cursor / Codex / Aider / Cline | `AGENTS.md` (Repo-Root) | Vollständige Pflicht-Sequenz, Verweise auf `docs/CONVENTIONS.md` |
| Cursor (zusätzlich) | `.cursor/rules/main.mdc` | 3-Zeilen-Pointer auf `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` | 3-Zeilen-Pointer auf `AGENTS.md` |

**Bekannte Schwachstelle:** Cloud-Tools ohne Datei-Zugriff (Lovable, Bolt) können die Konvention nicht aus Repo-Dateien lesen. Der User muss die Konvention dort als System-Prompt einspeisen. Das ist Restrisiko, nicht durch die Konvention lösbar.

**Beim Tool-Wechsel:** Genau eine Aktion — neuen Pointer-Adapter anlegen, der auf den Kern verweist. Konvention selbst bleibt unberührt.

---

## Tropen-Audit-Feature (Achse 9 in Zielbild v3)

Tropen scannt User-Repos auf Doku-Wildwuchs. Die folgenden acht Findings sind die MVP-Substanz für Achse 9 — als neue Audit-Kategorie zu den heutigen 26 Kategorien.

| # | Finding | Severity |
|---|---|---|
| 1 | Mehrere `status: active`-Dateien gleichen Themas (Levenshtein/Wortstamm) | Critical |
| 2 | Datei in `active/`/`decisions/` ohne gültiges Frontmatter | Should |
| 3 | Verwaiste Datei (in `docs/`, nicht in `INDEX.md` eingetragen) | Should |
| 4 | Parallele Doku-Verzeichnisse (`docs/`, `documents/`, `notes/`, `wiki/`, deutsche+englische Varianten) | Critical |
| 5 | Datei-Suffixe `-v2`, `-new`, `-final`, `-copy`, `-old` | Should |
| 6 | Abgelaufenes `review_by` bei `status: active` | Info |
| 7 | Inkonsistente Status-Werte (außerhalb erlaubter Liste) | Should |
| 8 | Supersedes-Link zeigt auf nicht-existente Datei | Should |

**Was Tropen nicht tut:**
- Inhaltliche Bewertung ("schlechte Strategie")
- Automatische Datei-Löschung oder Merge ohne User-Bestätigung
- Eingriff in Code-Inline-Doku (JSDoc, Kommentare)

---

## Anhang — Quartals-Audit-Prompt

Alle 90 Tage diesen Prompt an Claude Code geben:

> Lies `docs/INDEX.md` und alle Dateien in `docs/active/` und `docs/decisions/`.
> Erzeuge einen Bericht mit:
> 1. Dateien mit abgelaufenem `review_by` (Datum < heute) — geordnet nach Alter
> 2. Dateien ohne Eintrag in `INDEX.md`
> 3. Index-Einträge ohne zugehörige Datei
> 4. Dateien mit ähnlichen Themen (mögliche Duplikate)
> 5. Empfohlene Aktionen pro Datei: aktualisieren, archivieren, mit anderer mergen
>
> Keine Aktion ausführen — nur Bericht.

Ergebnis-Bericht wird im Sparring mit Claude.ai bewertet, Aktionen werden einzeln entschieden.

---

## Migrations-Hinweis (für Aufräum-Sprint)

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
