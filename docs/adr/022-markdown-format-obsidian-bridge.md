# ADR-008: Markdown-Format für Projektwissen mit Obsidian-Brücke

**Status:** Proposed
**Datum:** 2026-04-27
**Entscheider:** Timm Rotter
**Tags:** architecture · data-format · interoperability

---

## Context

Im Rahmen der Sechs-Schichten-Wissens-Architektur (ADR-006) muss das **Projektwissen** (Schicht 3) ein Format haben. Die Wahl dieses Formats ist eine fundamentale Architektur-Entscheidung mit weitreichenden Folgen für:

- Datenfluss zwischen den Schichten
- Bedienbarkeit für die Zielgruppe (Vibe-Coder, Solo-Entrepreneurs in DACH)
- Daten-Souveränität — kulturell wichtig für die EU-Compliance-Position
- Interoperabilität mit externen Tools
- KI-Verarbeitbarkeit für Toro und nachgelagerte Agenten

Drei wesentliche Beobachtungen flossen in die Entscheidung ein:

**1. Die Zielgruppe ist Markdown-vertraut.** Vibe-Coder arbeiten täglich mit Markdown — README-Dateien, CLAUDE.md, Issue-Beschreibungen. Markdown ist ihre Muttersprache.

**2. Tropen OS pflegt selbst bereits Markdown.** CLAUDE.md, ARCHITECT.md, das `docs/`-Verzeichnis — das Repository ist faktisch ein roher Wissens-Vault. Format-Bruch zu strukturierten DB-Records wäre stilistisch inkonsistent.

**3. Karpathys LLM-Wiki-Pattern (April 2026)** zeigt: KI-gepflegte, inkrementell wachsende Markdown-Sammlungen sind dem klassischen RAG-Ansatz überlegen, weil Wissen akkumuliert statt jedes Mal neu abgeleitet zu werden. Das passt exakt zur Tropen-OS-Vision des Konsequenz-Mechanismus.

**4. Obsidian** als Tool ist seit Februar 2025 auch für kommerzielle Nutzung kostenlos und hat eine breite Power-User-Basis in der DACH-Region. Es ist proprietär, aber lokal-first und arbeitet auf reinen Markdown-Dateien — keine Vendor-Bindung.

Die Entscheidung: Welches Format für Projektwissen? Welche Beziehung zu Obsidian?

---

## Decision

Projektwissen wird als **Plain Markdown mit YAML-Frontmatter und Wikilinks** strukturiert. Tropen OS bleibt die führende Quelle. Eine **optionale Obsidian-Brücke** ermöglicht Power-Usern den Vault-Sync.

### Format-Spezifikation

**Eine Wissens-Einheit ist eine Markdown-Datei.** Beispiel:

```markdown
---
type: capability
slug: multi-tenant-auth
status: active
created: 2026-04-27
updated: 2026-04-27
project: tropen-os
tags: [auth, security, dsgvo]
links:
  - "[[supabase-auth-setup]]"
  - "[[adr-003-tenancy-model]]"
---

# Multi-Tenant-Auth

Tropen OS nutzt Supabase Auth mit Row Level Security. Jede Tabelle, die
Org-spezifische Daten enthält, hat eine `organization_id`-Spalte und
RLS-Policies, die Cross-Tenant-Zugriffe verhindern.

## Konsequenzen

Jedes neue Feature, das Daten persistiert, muss:
- `organization_id` als Pflichtspalte führen
- RLS-Policy in derselben Migration anlegen
- Test-Coverage für Tenant-Isolation enthalten

Siehe [[engineering-standard-section-3]] für Auth-Härtung.
```

**Strukturelle Regeln:**

- **Plain Markdown** als Inhalt (lesbar in jedem Editor)
- **YAML-Frontmatter** für strukturierte Metadaten (Typ, Status, Daten, Tags)
- **Wikilinks** `[[slug]]` für Verbindungen zwischen Wissens-Einheiten
- **Stable Slugs** als Datei-Namen (nicht UUIDs in Pfaden)
- **Ordner-Struktur** menschen-lesbar (z.B. `projektwissen/auth/`, nicht `data/3a4b5c.../`)

### Tropen OS bleibt die führende Quelle

Das Markdown-Format ist die **Serialisierungsschicht** des Projektwissens. Die führende Quelle der Wahrheit ist die Tropen-OS-Datenbank — sie hält die Markdown-Dateien als Inhalts-Spalte (oder als Storage-Datei) und die strukturierten Metadaten als zusätzliche, abfragbare Felder.

**Hybride Architektur:**

| Aspekt | Quelle |
|---|---|
| Inhalts-Pflege durch Toro/User | Markdown (im DB-Feld oder als Datei) |
| Strukturierte Queries („alle aktiven Capabilities mit DSGVO-Tag") | Indizierte Spalten in DB |
| Verlinkung | Wikilinks in Markdown + abgeleitete Verknüpfungs-Tabelle für Performance |
| Versionierung | Append-Only-Tabelle (Markdown-Snapshot pro Änderung) |

### Obsidian-Brücke (optional)

Für Power-User wird ein **Obsidian-Sync** angeboten:

- Tropen OS exportiert das Projektwissen als Obsidian-Vault-Ordner-Struktur
- One-Way oder Bidirektional (zukünftige Detail-Entscheidung in eigener ADR)
- User aktiviert Sync explizit pro Projekt — kein Default
- Tropen OS funktioniert vollständig ohne Obsidian; die Brücke ist Add-on, nicht Fundament

**Der erste Schritt ist One-Way (Tropen OS → Vault):** Das adressiert Daten-Souveränität, ohne Konflikt-Auflösungs-Komplexität (Sync-Kollisionen, Concurrent Edits) zu erzeugen. Bidirektionaler Sync wird erst nach Validierung mit Pilot-Usern entschieden.

### Format-Constraint von Anfang an

Auch wenn die Obsidian-Brücke erst spät gebaut wird, gilt das Markdown-Format **ab sofort** für jeden neuen Projektwissens-Baustein. Die Datei-Topologie muss bereits jetzt Obsidian-Vault-fähig sein, sonst entsteht Migrationsschuld.

**Designprinzip:** Jeder neue Wissensbaustein muss die Frage bestehen: *„Funktioniert das auch als einzelne Markdown-Datei in einem Ordner?"*

---

## Consequences

### Positive Konsequenzen

- **Format-Kontinuität.** Tropen OS pflegt seit Anfang Markdown — die Zielgruppe pflegt Markdown — externe Tools verstehen Markdown. Eine Sprache durch alle Schichten.
- **KI-nativ.** Tools wie Claude Code können Markdown-Vaults direkt verarbeiten, ohne API-Anbindung an Tropen OS.
- **Daten-Souveränität.** User kann Markdown jederzeit exportieren, lesen, woanders nutzen. Konsistent mit der EU-Compliance-Position.
- **Niedrige Lock-in-Anmutung.** Auch wenn Tropen OS proprietär ist, sind die Daten es nicht.
- **Karpathy-Pattern direkt anwendbar.** Toro kann inkrementell ein wachsendes Wiki pflegen, ohne Format-Umweg.
- **Versionierung trivial.** Markdown-Diffs sind menschenlesbar, Git-kompatibel.
- **Onboarding leicht.** Vibe-Coder verstehen das Format intuitiv, kein Lernaufwand.

### Negative Konsequenzen

- **Strukturierte Queries sind aufwendiger.** „Alle Projekte mit DSGVO-Risiko hoch" ist in Markdown nicht trivial — braucht Indizierung in einer parallelen DB-Schicht.
- **Konflikt-Auflösung bei Sync ist komplex.** Sobald bidirektionaler Obsidian-Sync gewünscht wird, müssen Concurrent-Edits gelöst werden.
- **Größere Wissens-Vaults werden langsamer.** Markdown-Parsing skaliert schlechter als spezialisierte DBs. Bei sehr großen Projekten Performance-Risiko.
- **Schema-Drift möglich.** Wenn Frontmatter nicht streng validiert wird, entsteht Wildwuchs („type: capability" vs. „type: Capability" vs. „type: cap").
- **Markdown ist nicht beliebig erweiterbar.** Komplexe Datentypen (Bäume, Graphen, Binärdaten) brauchen separate Lösungen.

### Neutrale Konsequenzen

- **Obsidian-Brücke ist optional**, also keine Tool-Abhängigkeit für die Mehrheit der User.
- **Format-Entscheidung ist reversibel** im engen Sinn: Markdown lässt sich immer in andere Formate exportieren. Aber Migrations-Aufwand wäre hoch.

### Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| Schema-Drift im Frontmatter | Hoch | Mittel | Frontmatter-Validierung in Toros Extraktions-Pipeline + Linting in CI |
| Performance bei großen Vaults | Mittel | Mittel | Hybrid-Ansatz (DB-Index parallel zu Markdown), Pagination |
| Sync-Konflikte bei bidirektionaler Variante | Hoch | Hoch | Phase 1 nur One-Way; Bidirektional erst nach Pilot-Validierung |
| User missbraucht Markdown-Freiheit | Mittel | Niedrig | Toro normalisiert beim Schreiben, User-eigene Texte werden nicht überschrieben |
| Wikilinks zeigen ins Leere („broken links") | Hoch | Niedrig | Periodischer Link-Check, Toro repariert beim Schreiben |

---

## Alternatives Considered

### Alternative 1: Strukturierte JSON-Records in DB

**Beschreibung:** Projektwissen als JSON-Schema in Postgres, kein Markdown.

**Verworfen weil:**
- Format-Bruch zur restlichen Tropen-OS-Doku
- KI-Tools verarbeiten Markdown nativer als beliebiges JSON
- Vendor-Lock-in-Anmutung
- Karpathy-Pattern nicht direkt anwendbar

### Alternative 2: Notion-artiges Block-Modell

**Beschreibung:** Hierarchische Blöcke mit reichen Datentypen, ähnlich Notion-Pages.

**Verworfen weil:**
- Hohe Reibung beim Erfassen
- Schlecht KI-nativ
- Vendor-Lock-in-Anmutung verstärkt
- Nicht zur Vibe-Coder-Zielgruppe passend

### Alternative 3: Obsidian als primäres Backend

**Beschreibung:** Tropen OS schreibt direkt in einen User-Obsidian-Vault, kein eigenes Backend.

**Verworfen weil:**
- Mainstream-User wollen keinen zweiten Tool-Stack
- Tropen OS hätte keine Kontrolle über das Datenmodell
- Konflikt-Auflösung bei Multi-Device-Sync wäre Tropen-OS-Problem ohne Tropen-OS-Lösung
- Eine Tool-Abhängigkeit, die wir vermeiden wollen

### Alternative 4: Logseq oder anderes Open-Source-Tool als Backend

**Beschreibung:** Logseq oder ähnliches statt Obsidian, weil quelloffen.

**Verworfen weil:**
- Obsidian hat in der DACH-Region die größere Power-User-Basis
- Marktakzeptanz für Brücke wichtiger als Open-Source-Reinheit
- Wenn Logseq später relevant wird: Markdown-Format ist bereits kompatibel (gleiches Pattern)

### Alternative 5: Plain Markdown ohne Frontmatter

**Beschreibung:** Reine Inhalts-Markdown-Dateien ohne YAML-Header.

**Verworfen weil:**
- Strukturierte Queries werden unmöglich
- Toro hat keine zuverlässigen Anker für Verarbeitung
- Frontmatter ist branchenüblich, schadet niemandem, hilft enorm

---

## Implementation Notes

### Reihenfolge der Umsetzung

1. **Frontmatter-Schema** für die ersten Wissens-Typen definieren (Capability, Outcome, ADR, Tool-Profile, Projektwissen-Eintrag) — als ADR oder Engineering-Doku
2. **Datenbank-Schema** für Markdown-Storage entwerfen (Tabellen-Struktur: `knowledge_entries` mit `markdown_content`, indizierten Frontmatter-Spalten, `links`-Tabelle)
3. **Toro-Schreib-Pipeline** — wie schreibt Toro Markdown so, dass Frontmatter konsistent bleibt?
4. **Linting** für Frontmatter-Konsistenz (CI-Step)
5. **Obsidian-Export-Funktion** (One-Way) — Markdown-Dateien als Vault-Struktur ablegen
6. **Bidirektionaler Sync** — erst nach Pilot-Validierung

### Mapping auf bestehende Datenstrukturen

| Bestehend | Neue Rolle |
|---|---|
| `project_memory` (APPEND ONLY) | Versions-Historie der Markdown-Inhalte |
| `cards` | Werden teilweise zu Wissens-Einträgen, teilweise zu Artefakten — Mapping prüfen |
| `bookmarks` | Quellen-Anker, möglicherweise als Wissens-Einträge mit `type: source` |
| `artifacts` | Aus Projektwissen abgeleitete Outputs — bleiben separat (siehe ADR-006, Schicht 5) |

### Frontmatter-Felder (Initial-Vorschlag)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `type` | enum | Ja | Wissens-Typ (capability, outcome, adr, tool-profile, project-fact, source) |
| `slug` | string | Ja | Stabile ID, gleichzeitig Dateiname |
| `status` | enum | Ja | active, draft, deprecated, archived |
| `created` | date | Ja | ISO-Datum |
| `updated` | date | Ja | ISO-Datum |
| `project` | string | Ja | Projekt-ID |
| `tags` | string[] | Nein | Freie Tags |
| `links` | wikilink[] | Nein | Verbindungen zu anderen Einträgen |
| `source` | url | Nein | Wenn extern |

### Offene Fragen

- Speicherung: Markdown-Inhalt als DB-Spalte oder als Datei in Object Storage? (Performance vs. Konsistenz)
- Wie geht der Markdown-Inhalt in pgvector für RAG-Suche? (Chunking-Strategie nötig)
- Welche Wikilink-Resolution-Logik? Slug-basiert, ID-basiert, fuzzy?
- Bidirektionaler Sync mit Obsidian: Konflikt-Strategie?

---

## Related ADRs

- **ADR-006** — Sechs-Schichten-Wissens-Architektur (Schicht 3 ist die Heimat dieses Formats)
- **ADR-007** — Prompt-Veredler-Architektur (liest aus Schicht 3)

## References

- Strategie-Session 2026-04-27
- Karpathy LLM-Wiki-Pattern (April 2026) — Vorbild für inkrementell wachsendes KI-gepflegtes Wiki
- Obsidian Lizenz-Update Februar 2025 (kommerziell kostenlos)
- `engineering-standard.md` — Kategorie 18 (Dokumentation)
- `manifesto.md` — Principle 4 (Dependencies must be Replaceable), Principle 10 (Systems must survive their Creators)
- Memory: „No Drizzle for queries — supabaseAdmin als DB-Zugriff" — bleibt gültig, Markdown ist Inhalts-Format, nicht Query-Schicht
