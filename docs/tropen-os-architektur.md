# Tropen OS – Gesamtarchitektur

Version 0.5 — Konzeptdokument
Status: Grundlage für CLAUDE.md und alle Build-Prompts

---

## Leitprinzipien

**Liberal by default.**
Tropen OS macht keine Annahmen über Domäne, Arbeitsweise oder Struktur.
Jede Einstellung hat einen sinnvollen Default — aber alles ist überschreibbar,
sofern die Org das erlaubt.

**Kontrolle ist ein Spektrum, keine Binärentscheidung.**
- `locked` — Org definiert, Member kann nicht abweichen
- `suggested` — Org definiert Default, Member kann überschreiben
- `open` — Org gibt nichts vor, Member entscheidet frei

**Best Practices sind sichtbar, nicht aufdringlich.**
Zu jeder Einstellung: "Was bedeutet das?", "Warum empfehlen wir X?"
Immer einen Klick entfernt, nie im Weg.

**Templates statt Felder.**
Kein System-Feld ist domänenspezifisch.
Alles Domänenspezifische kommt über Templates.

**Wissen nimmt Form an.**
Projekte akkumulieren Wissen. Dieses Wissen kann sich transformieren —
in Workspaces, Agenten, Feeds, oder Kombinationen davon.

**Wissen bleibt erhalten.**
Context-Window-Grenzen werden sichtbar gemacht.
Kein Wissen geht unbemerkt verloren.
Projekt-Gedächtnis friert Wissen ein und macht es wiederverwendbar.

---

## Navigation (stabil)

```
Tropen OS
├── Chat          → Direkter Chat ohne Projekt-Kontext
├── Projekte      → Smarte Projektordner (Wissensbasis + Chats)
├── Workspaces    → Karten-basierte Arbeitsbereiche
├── Feeds         → Feed-Management + Stream
└── Einstellungen
      ├── Org     → Identität, Konventionen, Ressourcen, Wissen
      ├── Dept    → Department-Einstellungen
      └── Profil  → Member-Einstellungen
```

Transformations-Schicht: kein Nav-Punkt, erscheint kontextuell.

---

## Ebenen-Modell

```
┌─────────────────────────────────────────────────────┐
│  ORG                                                │
│  Identität · Konventionen · Ressourcen · Wissen     │
│  definiert Kontroll-Spektrum für alles darunter     │
├─────────────────────────────────────────────────────┤
│  DEPARTMENT                                         │
│  Erbt Org-Wissen · ergänzt eigenes Wissen           │
│  kann Org-Einstellungen weiter einschränken         │
│  aber nie lockern (nur Org kann lockern)            │
├─────────────────────────────────────────────────────┤
│  MEMBER                                             │
│  arbeitet in Projekten und Workspaces               │
│  kann überschreiben was als "suggested"             │
│  oder "open" markiert ist                           │
└─────────────────────────────────────────────────────┘
```

---

## Org-Ebene

### Was die Org definiert

**Identität** (wer sind wir?)
Name, Beschreibung, Logo, Werte. Kontroll-Modus: locked.

**Konventionen** (wie arbeiten wir?)
Jede Konvention: { label, value, controlMode, explanation, bestPractice }
Felder sind nicht hardcoded — Org definiert selbst welche sie hat.
Beispiele: Sprache, Kommunikationsstil, Zitierstil — alle mit controlMode.

**Ressourcen** (was darf genutzt werden?)
Freigeschaltete Modelle, Features, Token-Budget. Kontroll-Modus: locked.

**Domänen-Wissen**
Frei definierbare Wissenseinträge. Kontroll-Modus pro Eintrag.

---

## Department-Ebene

Erbt alles von Org. Kann einschränken, nie lockern. Kann eigenes Wissen hinzufügen.

---

## Projekte — Smarte Projektordner

### Was ein Projekt ist

Eine **abgrenzbare Wissensbasis mit Chat-History und Gedächtnis**.
Analogie zu Claude Projects: Speicher + Anweisungen + Dateien.
Das Projekt erinnert sich. Es wird klüger je mehr es genutzt wird.

### Kern-Eigenschaften

```
- Titel
- Ziel (Freitext, optional)
- Anweisungen (wie soll AI in diesem Projekt antworten?)
- Wissensbasis
  ├── Dateien (Dokumente, PDFs, Tabellen)
  ├── Notizen (manuell oder aus Chats gespeichert)
  ├── Links (URLs, externe Quellen)
  └── Projekt-Gedächtnis (siehe unten)
- Chats
- Teilnehmer
- Zugeordneter Agent (optional)
- Zugeordneter Feed (optional)
- Zugeordneter Workspace (optional)
- Template (optional)
```

Keine hardcodierten Felder (Zielgruppe, Ton etc.) — das sind Template-Felder.

### Projekt-Gedächtnis

Das Projekt-Gedächtnis ist der Kern des smarten Projektordners.
Es akkumuliert automatisch Wissen aus Chats — wie Claude Memory,
aber abgegrenzt pro Projekt.

**Wie es entsteht:**
- Nach jedem Chat: AI extrahiert Key Insights, Entscheidungen, offene Fragen
- Bei Context-Window-Warnung: strukturierte Zusammenfassung wird eingefroren
- Manuell: Member markiert Aussagen als "merken"
- Automatisch: wenn ein Thema mehrfach auftaucht, wird es konsolidiert

**Wie es genutzt wird:**
- Beim Start jedes neuen Chats im Projekt: Gedächtnis als Kontext injiziert
- Im Workspace: Gedächtnis fließt in relevante Karten
- Bei Transformation: Gedächtnis ist Grundlage für Workspace-Struktur / Agent

**Struktur eines Gedächtnis-Eintrags:**
```typescript
interface MemoryEntry {
  id: string
  type: 'insight' | 'decision' | 'open_question' | 'summary' | 'fact'
  content: string
  sourceConversationId: string
  createdAt: string
  importance: 'high' | 'medium' | 'low'
  tags: string[]
  frozen: boolean  // eingefroren = wird nicht mehr automatisch überschrieben
}
```

### Context-Window-Awareness

Jeder Chat zeigt den Context-Füllstand sichtbar an.
Das System warnt bevor Wissen verloren geht.

**Füllstand-Anzeige (im Chat-Header):**
```
[████████████████░░░░] 80% Context genutzt
```

**Warnung bei ~85%:**
```
⚠ Bald verliere ich den Anfang unseres Gesprächs.
  Soll ich jetzt eine Zusammenfassung ins
  Projekt-Gedächtnis speichern?

  [Jetzt zusammenfassen]   [Ignorieren]
```

**Am Chat-Ende (automatisch):**
```
Soll ich die wichtigsten Erkenntnisse dieses
Gesprächs im Projekt-Gedächtnis speichern?

  [Ja, speichern]   [Auswählen]   [Nein]
```

**Beim nächsten Chat-Start im Projekt:**
```
Letzte Session: [Datum]
Wir haben besprochen: [kurze Zusammenfassung]
[Weitermachen]   [Vollständiges Gedächtnis anzeigen]
```

**Technisch:**
- Token-Count wird nach jeder Message berechnet
- Schwellenwert konfigurierbar (default: 85% des Modell-Limits)
- Zusammenfassung via claude-haiku-4-5-20251001 (token-sparend)
- Gespeichert als MemoryEntry mit type: 'summary', frozen: true

### Wissens-Hierarchie im Projekt-Chat

```
1. Org-Wissen (locked)                          → immer
2. Department-Wissen                             → immer
3. Projekt-Anweisungen                           → immer
4. Projekt-Gedächtnis (komprimiert)              → immer
5. Projekt-Wissensbasis (Dateien, Notizen)       → immer
6. suggested/open Konventionen                   → Member-Wert oder Default
```

### Transformations-Schicht im Projekt

Trigger: nach N Chats, Wissensbasis-Schwelle, oder explizit.

```
💡 Bereit für den nächsten Schritt?
Du hast 12 Chats und umfangreiches Gedächtnis gesammelt.
[Zeig mir Möglichkeiten]   [Später]
```

→ Workspace: AI analysiert Gedächtnis, schlägt Karten-Struktur vor
→ Agent: AI konfiguriert Assistent auf Basis des Projekt-Gedächtnisses
→ Feed: AI schlägt Quellen basierend auf Themen im Gedächtnis vor

---

## Workspaces — Strukturierte Arbeitsbereiche

Karten-basiert, graph-strukturiert, mit Outcomes.
Entsteht aus Projekt (via Transformation) oder direkt.

### Kern-Eigenschaften

```
- Titel, Ziel
- Karten-Graph (Input → Prozess → Output)
- Wissensbasis
  ├── Org + Department Wissen (geerbt)
  ├── Karten-Inhalte (automatisch)
  ├── Knowledge Entries
  ├── Projekt-Gedächtnis (aus verknüpften Projekten)
  └── Feed-Artefakte
- Duale Chats (Silo + Karten-Chat)
- Context-Window-Awareness (auch hier aktiv)
- Agenten, Feeds, Outcomes
- Template
```

Context-Window-Awareness gilt auch in Workspace-Chats.
Zusammenfassungen landen in tropen_knowledge_entries statt Projekt-Gedächtnis.

---

## Agenten

Konfigurierte AI-Instanzen. Entstehen aus Projekten/Workspaces oder direkt.
Zuordnung zu Projekten, Workspaces, Karten.
Org-controlled, suggested-Modus möglich.

---

## Feeds

Drei-Stufen-Pipeline, token-sparend.
Entstehen aus Projekten (AI schlägt Quellen vor) oder direkt.
Zuordnung zu Workspaces, Projekten, oder standalone.

---

## Transformations-Engine (unsichtbare Infrastruktur)

```
analyze(source)     → bewertet Inhalt, Gedächtnis, Struktur
suggest()           → schlägt Transformationen vor mit Begründung + Vorschau
build(type, source) → erstellt Workspace / Agent / Feed
link(source,target) → Verbindung bleibt aktiv, Wissen fließt weiter
```

Immer: Vorschau → Bestätigung → Ausführung. Nie destruktiv.

---

## Feature-Liste Phase 2

- **Skills / SKILL.md System**: Meta-Intelligenz die verbessert wie das System
  arbeitet. Modellwahl-Optimierung, Zusammenfassungs-Qualität,
  Workspace-Erstellung verbessern. Erst sinnvoll wenn echte Nutzungsmuster
  aus Phase 1 vorliegen.

---

## Wissens-Hierarchie (für jeden AI-Aufruf)

```
1. Org-Wissen (Identität + locked Konventionen)  → immer
2. Department-Wissen                              → immer
3. Workspace-Wissen (falls relevant)              → wenn vorhanden
4. Projekt-Gedächtnis (falls in Projekt)          → wenn vorhanden
5. Projekt-Wissensbasis (falls in Projekt)        → wenn vorhanden
6. Karten-Wissen (falls in Karten-Chat)           → wenn vorhanden
7. Feed-Artefakte (falls zugeordnet + relevant)   → wenn vorhanden
8. suggested/open Konventionen                    → Member-Wert oder Default
```

---

## Datenbankstruktur (Übersicht)

### Bestehend (nicht anfassen)
```
departments         → Department-Einheit (ex workspaces)
department_members  → Mitgliedschaft
conversations       → Chats
```

### Neu (kein tropen_ Präfix — workspaces ist jetzt frei)
```
── Org + Department ──────────────────────────────────
org_settings
org_knowledge
dept_settings
dept_knowledge

── Projekte ──────────────────────────────────────────
projects
project_participants
project_knowledge     → Dateien, Notizen, Links
project_memory        → Gedächtnis-Einträge (APPEND ONLY)

── Workspaces ────────────────────────────────────────
workspaces
workspace_participants
cards
card_history          → APPEND ONLY
connections
knowledge_entries
workspace_messages
operators
operator_results
outcomes

── Agenten ───────────────────────────────────────────
agents
agent_assignments

── Feeds ─────────────────────────────────────────────
feed_sources
feed_schemas
feed_source_schemas
feed_items
feed_processing_log   → APPEND ONLY
feed_distributions

── Transformation ────────────────────────────────────
transformations
transformation_links

── Templates ─────────────────────────────────────────
templates
```

---

## Offene Entscheidungen (alle gelöst)

1. Aufgabenliste in Projekten → Nein. Struktur via Transformation.
2. Agent-Erstellung durch Members → Org-controlled, suggested möglich.
3. Feed-Zuordnung zu Projekten → Ja, direkt.
4. Wissens-Sichtbarkeit → Alles sichtbar, locked = nicht veränderbar.
5. Skills → Feature-Liste Phase 2.
