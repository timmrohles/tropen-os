---
status: active
updated: 2026-05-08
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
extends: null             # optional: Pfad zur übergeordneten ADR (für thematische Erweiterungen)
---
```

**Status-Werte und ihre Bedeutung:**

| Status | Bedeutung | Speicherort |
|---|---|---|
| `active` | Lebendes, normatives Dokument | `docs/active/` oder `docs/decisions/` |
| `draft` | Entwurf, noch nicht normativ — max. 14 Tage Lebensdauer | `docs/active/` mit Markierung im Index |
| `superseded` | Abgelöst durch Nachfolge-Dokument, im Archiv | `docs/archive/YYYY-MM/` |
| `archived` | Historisch relevant, nicht mehr aktiv, ohne Nachfolge | `docs/archive/YYYY-MM/` |

**`extends`-Feld (optional):**

Wird gesetzt, wenn eine ADR thematisch auf einer anderen aufbaut, ohne sie abzulösen. Die referenzierte ADR bleibt aktiv und normativ.

**Abgrenzung zu `supersedes`:**

| Feld | Bedeutung | Wann benutzen |
|---|---|---|
| `supersedes` | Diese Datei löst eine andere vollständig ab. Die alte ist nicht mehr normativ. | Kompletter Ersatz oder Pivot |
| `extends` | Diese ADR baut thematisch auf einer anderen auf. Beide bleiben aktiv. | Thematische Vertiefung ohne Ablösung |

Beispiel: ADR-029 (Audit-Kategorie 27) setzt `extends: docs/decisions/028-pivot-to-companion-platform.md`, weil sie eine Kategorie-Entscheidung im Rahmen des Pivots ist — nicht weil sie ADR-028 ablöst.

`extends` ist optional. Nicht jede ADR braucht es — nur wenn die Lesbarkeit davon abhängt, dass die Vorgänger-ADR bekannt ist.

**Frontmatter ist Pflicht, nicht Empfehlung.** Eine Datei in `active/` oder `decisions/` ohne gültiges Frontmatter ist ein Verstoß gegen die Konvention.

---

## Datei-Namen-Konvention

**In `active/`:**
- Stabile Namen ohne Versionssuffix: `roadmap.md`, `vision.md`, `brand-brief.md`
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

## Sprache

**Datei- und Verzeichnis-Namen sind englisch.** Lowercase mit Bindestrichen, ohne Umlaute oder ß.

Begründung: AI-Bau-Tools sind primär englisch trainiert und finden englische Datei-Namen zuverlässiger. Deutsche Datei-Namen wie `dokumentation/` oder `architektur-entscheidungen/` produzieren Reibung mit der Tool-Welt.

**Doku-Inhalt darf deutsch sein** — und ist es bei Tropen OS auch (Marken-Position, Schiefer-Limette-Welt). Englischer Inhalt ist erlaubt, wenn er sich an internationale Zielgruppe richtet.

**Pro Datei eine Sprache.** Mischsprachige Inhalte innerhalb derselben Datei sind zu vermeiden, außer für Code-Beispiele oder zitierte Originaltexte.

**Beispiele für Datei-Namen:**

| Erlaubt | Verboten |
|---|---|
| `brand-brief.md` | `marken-brief.md` |
| `audit-system.md` | `audit-system.md` (auch erlaubt — Wort identisch) |
| `user-types.md` | `nutzer-typen.md` |
| `pricing-tiers.md` | `preisstruktur.md` |

**ADR-Datei-Namen folgen demselben Schema:** `028-pivot-companion-platform.md` statt `028-pivot-zur-begleitplattform.md`.

---

## Tool-Memories als Wissens-Quelle

Manche AI-Bau-Tools (Claude, Cursor, ChatGPT) bieten Memory-Systeme, die Projekt-Kontext über Sessions hinweg behalten. Tool-Memories sind eine wertvolle Hilfe — aber **sie sollten nicht alleinige Quelle für Projekt-Entscheidungen sein**.

**Begründung:**
- Memories sind tool-spezifisch und nicht-portabel — Tool-Wechsel verliert sie
- Memories sind kontext-abhängig und können bei Account-Wechsel verloren gehen
- Memories sind für Mit-Lesende unsichtbar — Co-Founder, externe Reviewer haben keinen Zugriff
- Memories können vom Tool selbst überschrieben oder verfälscht werden

**Empfohlene Praxis:** Wichtige Projekt-Entscheidungen, die im Tool-Chat besprochen werden, gehören als ADR oder Decision-Log-Eintrag ins Repo. Tool-Memories ergänzen das Repo, sie ersetzen es nicht.

**Was Tropen-Audit dazu prüft (perspektivisch, Phase 2):** Wenn ein Repo lebendig ist (häufige Commits) aber das Decision-Log über Wochen nicht wächst, ist das Indikator für Wissens-Versteck in Memories. Tropen kann nicht beweisen, dass Wissen in Memories liegt — aber den Verdacht melden.

---

## Brainstorms und Roh-Material

Brainstorms, Ideen-Sammlungen, Sparring-Notizen sind kein Singleton-Material — mehrere parallele Dateien zum gleichen Thema sind erlaubt, weil sie Roh-Material sind, keine normative Aussage.

**Sonderbereich:** `docs/active/brainstorms/[thema]/`

- Singleton-Regel ausgesetzt — mehrere Dateien zum gleichen Thema möglich
- Frontmatter trotzdem Pflicht (`status: draft` Default)
- `review_by` default 30 Tage (kürzer als bei sonstigen drafts) — Brainstorms sind Roh-Material, das schnell entweder zu einer normativen Datei reift oder ins Archive wandert
- Datei-Namen: `[YYYY-MM-DD]-[kurz-titel].md`

**Lifecycle:**
1. Brainstorm wird in `docs/active/brainstorms/[thema]/` angelegt (`status: draft`)
2. Wenn aus Brainstorms eine Entscheidung erwächst → ADR oder normative Datei in `docs/active/`
3. Brainstorm-Quelldatei nach Entscheidung: `status: archived`, nach `docs/archive/YYYY-MM/brainstorms/`
4. Wenn Brainstorm 30 Tage liegt ohne Aktion: archivieren oder löschen, kein "schwebendes Roh-Material"

**Was Brainstorms nicht sind:** keine Roadmaps, keine Strategien, keine Pläne. Wenn ein Dokument Roadmap-Charakter bekommt, gehört es nach `docs/active/`, nicht in den Brainstorm-Bereich.

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

## Top-Level-Außen-Sicht-Dateien

Drei Dateien am Repo-Root unterliegen einer abgeleiteten Form der Konvention, weil sie Doku-Charakter mit Außen-Sicht haben:

- `README.md` — Erstkontakt für Menschen, die das Projekt besuchen
- `CHANGELOG.md` — Versions-Historie für User
- `package.json` Feld `description` — npm/Tool-Discovery

**Pflicht für diese Dateien:**

1. **Frontmatter wo möglich.** README.md und CHANGELOG.md beginnen mit YAML-Frontmatter (status, updated, review_by). package.json kann kein Frontmatter — fällt aus diesem Punkt heraus.

2. **Keine isolierten konkreten Zahlen.** Folgende Werte gehören NICHT in die Außen-Sicht-Dateien als isolierte Aussage:
   - Anzahl von Regeln, Agenten, Kategorien, Skills, Tabellen
   - Score-Werte, Schwellen, Grade-Definitionen
   - Konkrete Datei-Pfade in `docs/`
   - Zahlen aus laufendem Audit-Stand

   Wenn diese Werte erwähnt werden müssen: Verweis auf normative Quelle, nicht eigene Zahl.

3. **Verweis-Pattern.** Statt "242 Regeln in 26 Kategorien" steht in README: "Regelwerk und Kategorien: siehe `CLAUDE.md`."

4. **review_by 90 Tage** wie bei jeder active-Datei.

**Begründung:** Außen-Sicht-Dateien driften erfahrungsgemäß schneller als interne Doku, weil sie weniger oft angefasst werden. Ohne Drift-Schutz entsteht Glaubwürdigkeits-Schaden.

**Achse-9-Audit-Regel:** Tropen scannt diese Dateien auf Drift gegenüber `docs/active/` und `CLAUDE.md` (Finding 9 im Zielbild).

---

## Backlog-Schema

`docs/active/backlog.md` ist die **Single-Source für alle Backlog-Items** in Tropen. Pro Repo genau eine Backlog-Datei.

**Was ins Backlog gehört:**

- Code-Schulden (konkrete TODOs mit Datei-Referenz)
- Phase-2-Features (Funktionen, die ADRs aus aktueller Phase ausgeschlossen haben)
- UX-Items (Anpassungen, die nicht akut sind)
- Technische Hygiene (Tests, Refactoring, Performance)
- Vor erstem Kunden (Beta-Voraussetzungen, Compliance, Backup-Disziplin)

**Was nicht ins Backlog gehört:**

- Aktive Sprint-Aufgaben (gehören in Sprint-Plan oder Build-Prompt)
- Strategische Entscheidungen (gehören in ADR)
- Vision-Items (gehören in `docs/active/vision.md`)
- Brainstorms (gehören in `docs/active/brainstorms/`)

**Format pro Item:**

```
### [Titel]

- **Datei:** [optional, falls Code-Schuld]
- **Status:** open | in-progress | blocked | done
- **Severity:** must | critical | should | info
- **Effort:** S | M | L (optional)
- **Beschreibung:** [1-3 Sätze, was zu tun ist]
- **Wann lösen:** [Phase, Trigger oder Datum]
- **Abhängigkeit:** [optional, falls von ADR / Komitee / anderem Item abhängig]
- **Verknüpfung:** [optional, Verweis auf andere Backlog-Items oder ADRs]
```

**Vier Status-Werte:**

- `open` — noch nicht begonnen
- `in-progress` — aktiv in Bearbeitung in einem Sprint
- `blocked` — wartet auf Voraussetzung (mit Verweis im Item)
- `done` — abgeschlossen, bleibt sichtbar bis Quartals-Audit (Drift-Schutz)

**Vier Severity-Werte:**

- `must` — blockt einen anderen ADR oder Sprint-Item, das ohne diese Lösung nicht starten kann. Höchste Dringlichkeit, weil strukturelle Blockade.
- `critical` — blockiert Beta-Release oder substantielle Funktion. Ohne Lösung kein Live-Schalten.
- `should` — sollte vor Beta gelöst sein, aber nicht blocking. Beta läuft auch ohne, aber mit Schmerz.
- `info` — Nice-to-have, Polish, langfristig. Kein Beta-Bezug.

**Lifecycle:**

- **Anlegen:** Item entsteht aus Sparring, Sprint-Befund oder Code-TODO. `status: open`
- **Aktivierung:** Wird Item Teil eines Build-Prompts, wechselt es auf `in-progress` mit Verweis auf Sprint
- **Abschluss:** Nach Erfolg `status: done`. Bleibt im Backlog bis Quartals-Audit
- **Quartals-Audit (alle 90 Tage):** `done`-Items archivieren, `open`-Items mit hohem Alter prüfen

**Drift-Schutz:**

- Items ohne `wann lösen`-Feld sind unvollständig — Quartals-Audit fragt aktiv nach
- Items mit `blocked`-Status ohne `Abhängigkeit`-Feld sind unvollständig
- `must`- und `critical`-Items älter als 30 Tage werden im Quartals-Audit eskaliert
- Backlog-Datei ohne `updated`-Frontmatter-Update in 90 Tagen ist Indikator für unbearbeiteten Bestand

---

## Migrations-Hinweis

Der Aufräum-Sprint vom 2026-05-07 hat die Migrations-Tabelle abgearbeitet. Historischer Hinweis archiviert unter `docs/archive/2026-05/aufraeum-sprint-migrations-hinweis.md`.
