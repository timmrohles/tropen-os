---
status: archived
updated: 2026-05-08
review_by: null
supersedes: []
---

# CONVENTIONS-Konsolidierungs-Lese-Sprint — Hand-Over

## Status

Erfolgreich

---

## CONVENTIONS-Bestand

- **Hauptsektionen:** 14
  1. Pflicht-Sequenz für jeden Doku-Schreibvorgang
  2. Verzeichnis-Struktur
  3. Frontmatter-Schema
  4. Datei-Namen-Konvention
  5. Sprache
  6. Tool-Memories als Wissens-Quelle
  7. Brainstorms und Roh-Material
  8. Drift-Schutz-Mechaniken
  9. Verbindlichkeits-Schichtung
  10. Tool-Adapter
  11. Tropen-Audit-Feature (Achse 9)
  12. Anhang — Quartals-Audit-Prompt
  13. Top-Level-Außen-Sicht-Dateien
  14. Migrations-Hinweis

- **Länge:** 304 Zeilen — ca. 6–8 Bildschirmseiten (oberhalb des informellen 3–4-Seiten-Schwellenwerts)

- **Seit 2026-05-07 (K0.6-Basis) hinzugekommen** (via git log verifiziert):
  - `Top-Level-Außen-Sicht-Dateien` (commit 8f20977)
  - `Sprache` (commit 09b55d7)
  - `Tool-Memories als Wissens-Quelle` (commit 0484085)
  - `Brainstorms und Roh-Material` (commit 6409f3b)
  - `extends`-Feld im Frontmatter-Schema (commit 8ac96e2, heute)

- **Logische Reihenfolge:** Mit Einschränkung (Details unter Strukturierungs-Empfehlungen)

---

## Drei Drifts

### Drift 1: must-Severity im Backlog

**Aktueller Zustand:**

- `backlog.md` enthält zwei Items mit `severity: must` (Ansatz C, ADR-030) — eingeführt heute
- `backlog.md` Header verweist auf: *"Konvention: Siehe `docs/active/CONVENTIONS.md` Abschnitt 'Backlog-Schema'"*
- **Dieser Abschnitt existiert nicht in CONVENTIONS.md** — der Verweis ist ein Dangling Pointer
- Das Backlog kennt also weder ein definiertes Severity-Vokabular noch einen definierten Schema-Aufbau aus der Konvention

**Optionen:**

- **Option A: `must` als vierte Stufe in CONVENTIONS-Backlog-Schema dokumentieren** — Begründung: `must` ist semantisch klarer als `critical` für "Voraussetzung für andere Items" vs. "blockiert Beta-Launch". Zwei verschiedene Konzepte, die unterschiedliche Wörter verdienen. Erfordert, dass zuerst der fehlende Backlog-Schema-Abschnitt in CONVENTIONS angelegt wird.

- **Option B: `must` zu `critical` zurückstufen** — Begründung: Einfacher, weil `critical` bereits als Severity-Wert in den Audit-Findings existiert und semantisch vertraut ist. Nachteil: "Voraussetzung für anderes Item" und "Beta-Launch-Blocker" teilen sich dann denselben Begriff.

- **Option C: `must` umbenennen** — Vorschlag: `blocker` — Begründung: Präzisiert, dass das Item etwas anderes blockiert (nicht: "so dringend wie critical"). Nachteil: dritte Terminologie neben Audit-Severities.

**Empfehlung:** Option A — aber erst nachdem der fehlende Backlog-Schema-Abschnitt in CONVENTIONS angelegt ist. Der Dangling Pointer ist das dringlichere Problem. Ohne Schema-Abschnitt ist jedes Severity-Vokabular schwebend.

---

### Drift 2: extends-Feld

**Aktueller Zustand:**

- `extends` wurde heute dem Frontmatter-Code-Block hinzugefügt (Zeile 64): `extends: null  # optional: Pfad zur übergeordneten ADR (für thematische Erweiterungen)`
- Das Feld ist damit in der Beispiel-Schema-Datei präsent — aber:
  - Es fehlt ein Eintrag in der **Status-Werte-Tabelle** (die nur `status`, keinen eigenen `extends`-Eintrag hat — richtig, aber die Tabelle erklärt nur `status`, nicht alle Felder)
  - Es gibt **keine Definition wann extends, wann supersedes** — der Unterschied ist in der Konvention nicht erklärt
  - `extends` erscheint nur im Code-Block, nicht in der Verbindlichkeits-Schichtung (Pflicht vs. Empfehlung vs. Freistil)

**Konkrete Lücken:**

1. Kein Erläuterungstext zu `extends` außerhalb des Kommentars im Code-Block
2. Keine Abgrenzung: "extends" = thematische Erweiterung ohne Ablösung; "supersedes" = vollständige Ablösung. Diese Unterscheidung fehlt.
3. Unklar ob `extends` Pflicht-Feld ist (wie `status`) oder optionales Feld. Aktuell nur durch den Kommentar "optional" signalisiert.

**Empfehlung:** Einen kurzen Erläuterungsabschnitt unterhalb des Frontmatter-Code-Blocks ergänzen:
- Feld-Tabelle mit allen Frontmatter-Feldern (nicht nur Status-Werte-Tabelle)
- Explizite Abgrenzung: `supersedes` = vollständige Ablösung, `extends` = thematische Vertiefung ohne Ablösung der übergeordneten ADR
- Verbindlichkeit klären: `extends` ist optional, kein Pflicht-Feld

---

### Drift 3: decisions/INDEX.md

**ADR-Bestand:** 29 ADRs (001–029) in `docs/decisions/`

**Aktueller Stand:** `docs/INDEX.md` führt alle 29 ADRs im Abschnitt "Entscheidungen" — eine Zeile pro ADR. Die Sektion ist damit bereits die längste im INDEX.

**Einschätzung zur Übersichtlichkeit:**
Bei 29 ADRs ist der INDEX noch lesbar, aber spürbar gewachsen. Die ADR-Liste macht schätzungsweise 40–45% des gesamten INDEX-Inhalts aus. Wenn Tropen das Tempo hält (4–5 ADRs pro Monat), sind es bis Jahresende 60+ ADRs — dann ist die INDEX-Sektion kaum noch Überblick, sondern Auflistung.

**K0.6-Spannung:** Das K0.6-Prinzip "Single-Source" spricht gegen einen separaten `decisions/INDEX.md`. Ein Splitter würde die Pflicht-Sequenz ("docs/INDEX.md lesen vor jedem Schreibvorgang") unterhöhlen, weil dann unklar wäre welcher Index der Pflicht-Eingang ist.

**Empfehlung:** Kein separater `decisions/INDEX.md` — aber `docs/INDEX.md` umstrukturieren: ADR-Sektion auf eine Zeile pro ADR kürzen und eine separate Zusammenfassungs-Sektion ergänzen, die thematische Gruppen (001–010: Stack-Entscheidungen, 011–020: Feature-Entscheidungen, 021–029: Strategie-Entscheidungen) als 3-Zeilen-Überblick bietet. So bleibt Single-Source erhalten, aber INDEX wird wieder navigierbar.

---

## Strukturierungs-Empfehlungen

**1. Verbindlichkeits-Schichtung nach vorne ziehen.**
Aktuell steht diese Sektion an Position 9 — nach Tool-Memories und Brainstorms, die Randthemen sind. Die Schichtung (Pflicht / Empfehlung / Freistil) ist die wichtigste Orientierung für einen neuen Leser. Empfehlung: direkt nach Frontmatter-Schema an Position 4.

**2. Tropen-Audit-Feature auslagern.**
Sektion 11 ("Tropen-Audit-Feature, Achse 9") ist **Produkt-Inhalt, keine Konvention**. Sie erklärt was Tropen OS im Audit tut — das gehört in `audit-system.md` oder `engineering-standard.md`, nicht in eine Konventions-Datei. Auslagerung würde CONVENTIONS um ~20 Zeilen kürzen und semantisch sauberer machen.

**3. Migrations-Hinweis archivieren.**
Sektion 14 ("Migrations-Hinweis") ist one-time-Kontext für den Aufräum-Sprint, der laut Memory-Stand bereits durchgeführt wurde. Diese Sektion hat ihren Zweck erfüllt — sie sollte nach `docs/archive/2026-05/conventions-migrations-hinweis.md` ausgelagert werden.

**4. Inhaltsverzeichnis am Anfang.**
Mit 14 Sektionen und ~8 Bildschirmseiten würde ein kurzes TOC am Anfang helfen. Keine Nummerierung nötig — einfache Linkliste zu den Ankerpunkten.

**5. Backlog-Schema-Abschnitt anlegen.**
Der Dangling-Pointer-Bug aus Drift 1 erfordert einen neuen Abschnitt "Backlog-Schema" in CONVENTIONS.md, der das Severity-Vokabular, die Effort-Skala und das Item-Format definiert.

**Keine Restrukturierung nötig:** Grundstruktur (Pflicht-Sequenz → Verzeichnis → Frontmatter → Konventionen → Mechaniken) ist logisch und tragfähig. Die Empfehlungen sind Verfeinerungen, kein Umbau.

---

## Empfehlung für nächsten Schritt

**Reihenfolge der Drift-Behebungen (falls Founder zustimmt):**

1. **Drift 1 (Backlog-Schema)** — zuerst, weil der Dangling-Pointer-Bug akut ist und Ansatz C + ADR-030 heute als `must` eingetragen wurden. Erfordert: neuen Abschnitt in CONVENTIONS + Severity-Vokabular-Entscheidung (empfohlen: Option A mit `must`).

2. **Drift 2 (extends-Feld)** — zweites, weil ADR-029 bereits `extends` nutzt und die Definition fehlt. Kleiner Aufwand (Erläuterungstext + Feld-Tabelle).

3. **Drift 3 (INDEX umstrukturieren)** — drittes, niedrigste Dringlichkeit, höchster Aufwand. Kann warten bis ADR-Bestand auf ~40 angewachsen ist.

**Zusätzlich aufgefallener Drift:**
- `docs/INDEX.md` listet ADR-029 noch nicht (wurde heute angelegt, INDEX aber nicht aktualisiert). Kleiner Fix, kein Sprint nötig.
