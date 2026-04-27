# ADR-006: Sechs-Schichten-Wissens-Architektur

**Status:** Proposed
**Datum:** 2026-04-27
**Entscheider:** Timm Rotter
**Tags:** architecture · knowledge-management · core

---

## Context

Tropen OS hat im April 2026 eine grundlegende Neuausrichtung vollzogen: vom Production-Readiness-Scanner für Vibe-Coder hin zu einer Begleitplattform für europäische Solo-Entrepreneurs, die mit Lovable, Bolt, Cursor und Claude Code bauen. Das Produkt ist nicht länger ein einzelnes Tool, sondern eine **Plattform**, die strukturiert, lehrt und User vor häufigen Fallen schützt.

Aus dieser Neuausrichtung entstand in einer Strategie-Session am 27. April 2026 die Erkenntnis, dass die bisherige Architektur das Problem **„Wissens-Leck im Chat"** nicht löst: User diskutieren mit Toro (Meta-Agent), Wissen entsteht im Diskurs — und scrollt mit dem Chatverlauf in die Vergessenheit. Ohne strukturelle Antwort darauf bleibt Tropen OS ein Chat-Tool mit Zusatzfeatures, statt eine Plattform, in der Projekte als zusammenhängende Organismen leben.

Die zentralen Anforderungen der Zielgruppe (Solo-Entrepreneurs, DACH-Region, KMU-Profil):

- **Niedrige Reibung** beim Erfassen von Ideen — auch unterwegs, auch zwischen Kontexten
- **Wissen, das nicht verschwindet** — weder durch Chat-Drift noch durch Tool-Abhängigkeit
- **Daten-Souveränität** als kulturelles Bedürfnis (DSGVO-Mindset, EU-Compliance als Moat)
- **Klarheit über Projekt-Zustand** — was ist erledigt, was offen, was schwebt
- **Bedienbarkeit ohne Setup-Overhead** — kein zweiter Tool-Stack neben Lovable/Cursor

Die Architektur-Frage war: Wie organisieren wir die Bestandteile so, dass diese Anforderungen alle erfüllt sind, ohne dass das System für Anfänger erschlägt oder für Power-User einsperrt?

---

## Decision

Tropen OS ist ab sofort als **Sechs-Schichten-Wissens-Architektur** strukturiert. Jede Schicht hat eine klar abgegrenzte Funktion, alle Schichten zusammen bilden den Projekt-Organismus.

### Die sechs Schichten

| Schicht | Funktion | Lebensdauer |
|---|---|---|
| **1. Chat (Toro)** | Diskurs, Bühne, geführte Konversation | Indiziert, durchsuchbar — Inhalte fließen in andere Schichten ab |
| **2. Inbox** | Auffangbecken für Ideen, externe Quellen, Schnipsel — niedrigschwellig | Temporär — wird verarbeitet und in andere Schichten verteilt |
| **3. Projektwissen** | Strukturierte, persistente Quelle der Wahrheit | Dauerhaft — wächst inkrementell |
| **4. Merker** | Manuell kuratierte Highlights aus Chats und Inbox | Dauerhaft — vom User gepflegt |
| **5. Artefakte** | Aus Projektwissen abgeleitete Zustände (CLAUDE.md, Repo-Soll, Reports) | Dauerhaft — versionierte aktuelle Zustände |
| **6. Projektboard** | Integrierende Sicht, Schaltzentrale — keine eigene Datenquelle | Sicht — kein Speicher |

### Die drei Bewegungen

Aus jedem Chat fließen **drei Ströme** ab:

1. **Automatisch** — Toro extrahiert strukturierte Fakten → Projektwissen → Artefakte werden aktualisiert
2. **Manuell** — User markiert wichtige Stellen → Merker → reaktivierbar in späteren Sitzungen
3. **Suche** — Der Chat-Verlauf bleibt indiziert (RAG-durchsuchbar) als Spur und Begründung

### Die drei Eingangstüren

In das System fließt Information über drei Kanäle:

- **Chat** — geführter Diskurs mit Toro
- **Inbox** — formloser Wurf, jederzeit, von überall (auch ohne offenen Chat)
- **Externe Quellen** — Repo-Anbindung, Dokument-Upload, später API-Integrationen

### Das Projektboard als integrierende Sicht

Das Projektboard (Schicht 6) speichert nichts — es **zeigt**. Es macht sichtbar:

- Status entlang der Phasen (vertikale Achse)
- Materie pro Phase (horizontale Achse): Inbox-Items, anstehende Entscheidungen, fertige Artefakte, gemerkte Threads, offene Findings
- Einstiegspunkt für neue Chat-Sitzungen mit Kontext

### Konsequenz-Mechanismus

Änderungen in einer Schicht propagieren in die abhängigen Schichten — gemäß der Vision-Komponente „Projektwissen mit Konsequenz-Mechanismus". Konkret:

- Änderung im Projektwissen → Artefakte werden neu abgeleitet
- Neuer Inbox-Eintrag → Toro schlägt Verknüpfungen vor
- Merker reaktiviert → Chat lädt den Kontext wieder

---

## Consequences

### Positive Konsequenzen

- **Wissen geht nicht verloren.** Der Chat darf voll laufen, weil das Wesentliche vorher abgezweigt wurde.
- **Konsistenz wird zur Eigenschaft des Systems.** Artefakte sind aus Projektwissen abgeleitet, nicht manuell gepflegt.
- **User sieht überall den aktuellen Zustand.** Das Projektboard liefert die Schaltzentrale.
- **Niedrige Eintrittshürde.** Inbox und Chat haben minimale Reibung; Strukturierung passiert im Hintergrund durch Toro.
- **Power-User werden nicht eingesperrt.** Optionaler Obsidian-Sync (siehe ADR-008) ermöglicht Daten-Souveränität.
- **Architektur-Konsistenz.** Alle bisherigen Komponenten (Chat, Cards, Bookmarks, Memory, Artifacts) ordnen sich klar zu.

### Negative Konsequenzen

- **Komplexität in der Datenflusslogik.** Sechs Schichten mit drei Strömen und Konsequenz-Mechanismus erfordern saubere Orchestrierung.
- **Toro wird zur kritischen Komponente.** Wenn die automatische Extraktion in Projektwissen schlecht ist, leidet das ganze System. Hohe Anforderung an Prompt-Engineering und Validierung.
- **Bestehende Tabellen müssen evaluiert werden.** Bookmarks, Cards, Memory existieren bereits — Mapping zu den neuen Schichten muss explizit erfolgen, sonst entstehen Doppelstrukturen.
- **UI-Komplexität.** Sechs Schichten plus drei Eingangstüren plus Projektboard erfordern durchdachte Informationsarchitektur. Risiko: User versteht das System nicht.
- **Migrations-Aufwand.** Bestehende Daten (insbesondere conversations, memory, artifacts) müssen in das neue Modell überführt werden.

### Neutrale Konsequenzen

- **Markdown als Format-Constraint** wird in ADR-008 separat festgelegt — die Sechs-Schichten-Architektur ist format-agnostisch.
- **Veredler-Architektur** wird in ADR-007 separat festgelegt — die Sechs-Schichten-Architektur stellt nur den Kontext bereit, in dem der Veredler operiert.

### Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| Toros Extraktion ist unzuverlässig | Mittel | Hoch | Pilot-Phase mit Validierungs-UI, User bestätigt jede Extraktion |
| User verstehen das Sechs-Schichten-Modell nicht | Mittel | Mittel | Progressive Tiefe — Anfänger sehen nur Chat + Inbox, weitere Schichten erscheinen kontextuell |
| Inbox füllt sich an, niemand sortiert | Hoch | Mittel | Toro-Reminder, „Inbox-Sichtung" als eigenes Ritual |
| Bestehende Daten passen nicht sauber zu | Hoch | Hoch | Explizite Migrations-ADR vor Implementierung |

---

## Alternatives Considered

### Alternative 1: Reine Chat-Plattform mit besserer Suche

**Beschreibung:** Statt Sechs-Schichten-Modell den Chat zur einzigen Schicht machen, mit besserer RAG-basierter Suche und Tagging.

**Verworfen weil:**
- Wissen bleibt im Chat verstreut, nicht aktuell
- Keine ableitbaren Artefakte (CLAUDE.md, Repo-Soll) ohne strukturierte Quelle
- Kein Konsequenz-Mechanismus möglich
- Projektzustand bleibt unklar

### Alternative 2: Klassische Projekt-Management-Architektur (Notion-artig)

**Beschreibung:** Datenbank-basierte Pages mit Properties, Views, Linked Databases.

**Verworfen weil:**
- Hohe Reibung beim Erfassen — User muss strukturieren, bevor er einwirft
- Schlecht KI-nativ — Tools wie Notion sind primär für Menschen, nicht für LLMs
- Vendor-Lock-in-Anmutung widerspricht der Daten-Souveränität-Position
- Skaliert schlecht in den Bottom-Up-Erfassungs-Pattern (Inbox)

### Alternative 3: Einfache Drei-Schichten (Chat + Wissen + Artefakte)

**Beschreibung:** Reduzierte Architektur ohne Inbox, Merker und Projektboard.

**Verworfen weil:**
- Kein Auffang-Mechanismus für Ideen außerhalb des Chat-Kontexts (Inbox-Bedarf nachgewiesen)
- Keine kuratierte Notiz-Schicht (Merker-Bedarf nachgewiesen, ergänzt zu strukturiertem Projektwissen)
- Keine integrierende Sicht (Projektboard-Bedarf konsistent mit Vision)
- Verschmilzt Aspekte, die unterschiedliche Funktionen haben

---

## Implementation Notes

### Reihenfolge der Umsetzung

1. **Projektwissen-Datenmodell** (siehe ADR-008) — Vorbedingung für alles Weitere
2. **Inbox-Mechanik** mit niedrigschwelligen Eingängen (Quick-Capture, Shortcut, Slash-Command)
3. **Toro als automatischer Wissens-Extraktor** (Hintergrund-Agent)
4. **Merker-System** als manuelle Kuratierungs-Schicht
5. **Artefakt-Ableitungs-Pipeline** (Projektwissen → CLAUDE.md, Repo-Soll, etc.)
6. **Projektboard** als integrierende Sicht
7. **Optionaler Obsidian-Sync** (siehe ADR-008) — letzte Phase

### Mapping zu bestehenden Tabellen

| Schicht | Bestehende Tabellen | Status |
|---|---|---|
| Chat | `conversations`, `messages` | Vorhanden, passt |
| Inbox | — | Neu zu bauen |
| Projektwissen | `project_memory` (APPEND ONLY) | Erweiterung nötig (Markdown-Fähigkeit, Verlinkung) |
| Merker | `bookmarks` (?) | Mapping prüfen — möglicherweise neue Tabelle |
| Artefakte | `artifacts`, `cards` | Vorhanden, passt teilweise |
| Projektboard | — (Sicht, kein Speicher) | UI-Aufgabe |

### Offene Fragen

- Wie genau strukturiert Toro Inbox-Items in Projektwissen? (Detail-Spec nötig)
- Versionierung der Artefakte: jede Änderung speichern oder nur Snapshots?
- Performance der Konsequenz-Propagation bei großen Projekten

---

## Related ADRs

- **ADR-007** — Prompt-Veredler-Architektur (operiert auf den Schichten 3 und 5)
- **ADR-008** — Markdown-Format mit Obsidian-Brücke (Format-Entscheidung für Schicht 3)

## References

- Strategie-Session 2026-04-27 (interne Diskussion)
- `manifesto.md` — Principle 5 (Data is a Liability), Principle 10 (Systems must survive their Creators)
- `engineering-standard.md` — Kategorie 9 (State Management), Kategorie 18 (Dokumentation)
- Tropen-OS-Vision Teil 5 (Multi-Agenten-Architektur)
- Karpathy LLM-Wiki-Pattern (April 2026) — konzeptionelle Inspiration für inkrementell wachsendes Wissen
