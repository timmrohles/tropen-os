# AGENTS.md

> **Pflicht-Eingang für jeden Bau-Agent in diesem Repo.**
> Lies dieses Dokument vor jeder Aktion, die eine Doku-Datei anlegen oder ändern würde.
> Konvention im Detail: `docs/CONVENTIONS.md`.

---

## Pflicht-Sequenz vor jedem Doku-Schreibvorgang

Bevor du eine Doku-Datei anlegst oder änderst:

1. **Lies `docs/INDEX.md`.**
2. **Existenz-Check:** Gibt es schon eine Datei zum gleichen Thema im aktiven Bestand?
3. **Wenn ja:** Bestehende Datei aktualisieren. Niemals neue Datei mit `-v2`, `-new`, `-final`, `-copy`-Suffix anlegen.
4. **Wenn nein:** Neue Datei anlegen, mit gültigem Frontmatter, in `docs/INDEX.md` eintragen.
5. **Bei Pivot/Ablöse:** Atomar — alte Datei nach `docs/archive/YYYY-MM/` mit `status: superseded`, neue Datei mit `supersedes`-Verweis zurück.

Wenn du diese Sequenz überspringst, verstößt du gegen die Konvention. Verstöße sind auditierbar.

---

## Verzeichnis-Struktur

```
docs/
  INDEX.md                # Pflicht-Eingang
  CONVENTIONS.md          # vollständige Konvention
  active/                 # alle lebenden Dokumente, Singleton pro Thema
  decisions/              # nummerierte ADRs (NNN-titel.md)
  archive/YYYY-MM/        # archivierte Dokumente
```

**Verbotene Muster:**
- Parallele Top-Level-Verzeichnisse: `documents/`, `notes/`, `wiki/`, `docs-old/`
- Themen-Unterordner unterhalb von `active/` (alles flach)
- Deutsche und englische Verzeichnis-Varianten parallel (`inventory/` + `inventur/`)
- Versions-Suffixe in Dateinamen: `-v2`, `-new`, `-final`, `-copy`, `-old`

**Wenn du eines dieser Muster im Bestand findest, lege keinen weiteren Beitrag dazu an. Stattdessen: Hinweis an den User, dass das Verzeichnis migriert werden muss.**

---

## Frontmatter-Schema (Pflicht)

Jede Datei in `active/` und `decisions/` beginnt mit:

```yaml
---
status: active            # active | draft | superseded | archived
updated: YYYY-MM-DD
review_by: YYYY-MM-DD     # default: heute + 90 Tage
supersedes: []
superseded_by: null
---
```

**Status-Werte:**

- `active` — lebendes, normatives Dokument
- `draft` — Entwurf, max. 14 Tage Lebensdauer
- `superseded` — abgelöst, im Archiv
- `archived` — historisch, ohne Nachfolge, im Archiv

---

## Bei Unsicherheit

Wenn du nicht sicher bist, ob eine Datei aktualisiert oder neu angelegt werden sollte:

- **Frage den User**, bevor du Datei-Operationen ausführst.
- **Stelle die konkrete Wahl vor**: "Ich würde X aktualisieren oder Y neu anlegen — welches passt besser?"
- **Schlage niemals proaktiv vor, eine `-v2`-Datei oder ein neues Themen-Verzeichnis anzulegen.**

---

## Verbindlichkeits-Schichten

| Schicht | Verstoß = | Beispiele |
|---|---|---|
| **Pflicht** | Bug | Frontmatter, Index-Eintrag, atomares Archivieren, keine Versions-Suffixe |
| **Empfehlung** | Hinweis | `review_by`-Feld, ADR ab 2-Wochen-Tragweite, max. 1 Bildschirmseite |
| **Freistil** | egal | Inhaltliche Struktur, Sprache, Code-Kommentare |

---

## Bei Tool-Wechsel

Wenn du ein neuer Bau-Agent in diesem Repo bist (z.B. der User wechselt von Cursor zu Claude Code):

1. **Lies dieses `AGENTS.md` zuerst.** Es ist die Wahrheit, unabhängig von welchem Tool du gestartet wirst.
2. **Prüfe den tool-spezifischen Pointer:** `CLAUDE.md`, `.cursor/rules/main.mdc`, `.github/copilot-instructions.md` — er sollte auf diese `AGENTS.md` verweisen.
3. **Wenn der Pointer fehlt oder veraltet ist:** Vorschlag an den User, ihn zu erstellen oder zu aktualisieren. Lege ihn nicht eigenmächtig an, ohne den User zu fragen.

---

## Vollständige Konvention

Dieses `AGENTS.md` ist der Pflicht-Eingang. Die vollständige Doku-Konvention mit Migrations-Hinweisen, Quartals-Audit-Prompt und Tropen-Audit-Feature steht in `docs/CONVENTIONS.md`.

Lies sie, bevor du an der Konvention selbst arbeitest oder die Konvention für ein anderes Projekt adaptierst.
