# Tropen OS — Produkt-Architektur
## Navigationsdokument v1.0

> **Status:** März 2026 — Grundlage für alle weiteren Build-Entscheidungen
> **Gilt für:** Navigation, Hub-Neudenken, Workspace-Konzept, Build-Reihenfolge

---

## Das Leitbild

Tropen OS ist kein Chat-Tool mit Extras.
Es ist ein **KI-Betriebssystem für Wissensarbeit** — von der schnellen Frage bis zum
automatisierten Produktionssystem.

Der Unterschied zu Claude.ai, ChatGPT, Notion AI:

```
Andere Tools:   User → KI → Antwort
Tropen OS:      User → Kontext → Struktur → KI → Artefakt → Produktion
```

Tropen OS denkt in **Systemen**, nicht in Einzelgesprächen.

---

## Die zwei Aggregatzustände

Alles in Tropen OS ist entweder im **Aufbau** oder in der **Produktion**:

```
AUFBAU                          PRODUKTION
──────────────────────────────────────────────────────
Chat          → schnelle Arbeit
Projekte      → Wissen akkumulieren
Workspaces    → komplexe Vorhaben bauen
                                Hub → fertige Systeme laufen
                                Hub → Workspaces als Apps
                                Hub → Agenten arbeiten autonom
                                Dashboard → Controlling
```

Der **Workspace** ist die Brücke: Man baut darin — und veröffentlicht ins Hub.

---

## Die Navigation — Ist-Zustand vs. Ziel

### Finalisierte Navigation (März 2026)

| Nav-Punkt | Was es ist | Status |
|-----------|-----------|--------|
| Chat | Direkter Toro-Chat | ✅ existiert |
| Projekte | Chats + Wissen + Gedächtnis | ✅ existiert |
| Workspaces | Bauen — Karten, Briefing, Export | ⚠️ UI in Arbeit (Plan F) |
| Feeds | Externe Daten reinholen (RSS, Webhook, API) | ✅ existiert |
| Artefakte | **Statische** Outputs — Dokumente, PDFs, Snapshots, Code | ✅ existiert |
| **Live** | **Produktive Systeme die laufen** — Dashboards, APIs, Automatisierungen | 🔜 Phase 3 |
| **Agenten** | Autonome Toro-Instanzen (Scheduled, Reactive, Contextual) | ⚠️ Backend fertig, UI ausstehend |
| **Community** | Prompts, Agenten, Templates von Team / Org / extern | 🔜 Phase 3 |
| Wissen | RAG-Wissensbasis (Org / User / Projekt) | ✅ existiert |
| Dashboard | Kosten, Nutzung, Controlling (org-intern) | ✅ existiert |

**Hub entfällt** — war ein Fantasiebegriff. Agenten und Community ersetzen ihn präzise.

### Artefakte vs. Live — die Kernunterscheidung

| | Artefakte | Live |
|--|-----------|------|
| Zustand | Statisch — einmalig erstellt | Dynamisch — updated sich |
| Beispiel | Konkurenzanalyse als PDF | Konkurenzanalyse mit Live-Feed |
| Beispiel | Dashboard als Screenshot | Dashboard mit API-Verbindung |
| Beispiel | SCORM-Kurs (Export) | — (SCORM bleibt statisch) |
| Herkunft | Workspace → Exportieren | Workspace → Produktiv schalten |
| Überschneidung | Nie — ein Artefakt wird nicht zu Live | Ein Live-System kann Artefakt-Snapshot erstellen |

---

## Workspaces — Das erweiterte Konzept

### Was ein Workspace wirklich ist

Ein Workspace ist ein **programmierbarer Arbeitsbereich**.
Nicht nur ein Ort um Dokumente zu schreiben —
sondern ein System das gebaut, konfiguriert und dann produktiv eingesetzt wird.

**Spektrum möglicher Workspaces:**

| Workspace-Typ | Outcome | Karten-Typen |
|---------------|---------|-------------|
| Businessplan | Word-Dokument | Text, Tabelle, Chart |
| Marktanalyse | Strategie-Paper | Text, Tabelle, Chart, Mindmap |
| Interaktives Dashboard | Live-Dashboard im Hub | Chart (ECharts), Tabelle, Feed-Widget |
| CMS-Controller | Webflow/WordPress steuern | API-Connector, Text, Tabelle |
| LMS-Kurs-Generator | SCORM-Export | Text, Timeline, Code, Embed |
| API-Design | OpenAPI-Spec + Doku | Code, Text, Tabelle |
| n8n-Workflow-Builder | Automatisierungs-System | Workflow-Karte, Connector, Agent |

### Was eine Karte ist — erweitert

Eine Karte ist nicht nur ein Content-Block.
Eine Karte kann drei Aggregatzustände haben:

```
1. STATISCH    → Inhalt wird einmal erstellt (Text, Tabelle, Chart aus Daten)
2. GENERATIV   → KI erstellt/aktualisiert den Inhalt (Toro-Chat pro Karte)
3. LIVE        → Karte ist verbunden mit externem System (Feed, API, Connector)
```

**Karten-Typen (vollständig):**

| Typ | Aggregatzustand | Besonderheit |
|-----|----------------|-------------|
| `text` | Statisch + Generativ | Markdown, exportierbar |
| `table` | Statisch + Generativ + Live | Feed-fähig, API-fähig |
| `chart` | Statisch + Generativ + Live | ECharts, Org-Theme, Feed-fähig |
| `list` | Statisch + Generativ | Einfachste Form |
| `code` | Statisch + Generativ | Syntax-Highlight, ausführbar (Phase 3) |
| `kanban` | Statisch + Generativ | Status-Tracking |
| `timeline` | Statisch + Generativ | Meilensteine, Phasen |
| `mindmap` | Statisch + Generativ | Brainstorming |
| `embed` | Live | iFrame, externe URL |
| `image` | Statisch | Asset-Verbindung |
| `connector` | Live | API-Call, Webhook, n8n-Trigger (Phase 3) |
| `dashboard-widget` | Live | Kombiniert mehrere Datenquellen (Phase 3) |

### Workspace-Lebenszyklus

```
1. BRIEFING    → Toro versteht das Vorhaben (Gespräch)
2. AUFBAU      → Karten anlegen, befüllen, verknüpfen
3. VERFEINERN  → Karten-Chats, Stale-Propagation, Anpassungen
4. EXPORT      → Dokument / Präsentation / Spec
   oder
4. VERÖFFENTLICHEN → Workspace wird im Hub als System deployed
5. PRODUKTION  → Workspace läuft autonom (Feeds updaten Karten,
                  Agenten arbeiten, Dashboard zeigt Live-Daten)
```

---

## Live — Produktive Systeme

### Was Live ist

Live ist der Bereich wo fertige, dynamische Systeme laufen —
ohne dass der User täglich eingreifen muss.

**Kriterium:** Ein System gehört nach Live wenn es:
- Sich automatisch mit externen Daten updated (Feed, API, Webhook)
- Eigenständig läuft (Agent, Cron)
- Eine persistente URL hat die andere besuchen können

**Nicht nach Live:** Statische Exports (Dokumente, PDFs) → die gehen in Artefakte.

```
Live
├── Dashboards         → Live-Daten, Charts, Feed-connected
├── APIs & Webhooks    → eigene Endpoints die laufen
├── Automatisierungen  → Agenten + Crons im Produktionsbetrieb
└── Embeds & Webseiten → iFrame-fähige Live-Inhalte (Phase 3)
```

### Workspace → Live: Produktiv-Schalten-Flow

```
Workspace fertig (Karte mit Feed-Verbindung, Dashboard-Karte etc.)
  → Button: "Produktiv schalten"
  → Auswahl: welche Karten / welches Outcome soll live gehen?
  → Konfiguration: URL, Zugriffsrechte, Update-Frequenz, Budget-Limit
  → System bekommt eigene URL: /live/[id]
  → Ab jetzt: läuft eigenständig, User wird nur bei Problemen benachrichtigt
  → Erscheint in /live — NICHT in Artefakte
```

## Agenten — Eigenständiger Nav-Punkt

Agenten umfassen zwei Typen: native Toro-Agenten und n8n-Workflows.
Beides läuft unter demselben Nav-Punkt — weil beides autonome Ausführung ist.

```
Agenten
├── Toro-Agenten
│   ├── Meine Agenten      → aktive, pausierte, geplante Agenten
│   ├── Agent erstellen    → neuer Agent (Scheduled / Reactive / Contextual)
│   ├── Run-History        → Logs, Outputs, Kosten pro Run
│   └── Vorlagen           → eigene Agenten-Vorlagen (→ Community teilen)
│
└── n8n-Workflows (Toro-generiert)
    ├── Workflow-Liste     → Status, letzte Runs, Fehler
    ├── Toro fragen        → Chat: "Was soll der Workflow tun?"
    └── Workflow-Templates → aus Community importieren
```

### n8n Integration — Kernprinzip

**Toro baut, User sieht nur Ergebnisse.**

Kein manueller Editor. n8n ist reine Execution Engine im Hintergrund.
Vollständiges Konzept: `docs/superpowers/n8n-integration-konzept.md`

| Phase | Was gebaut wird |
|-------|----------------|
| Phase 2 | Toro generiert Workflows via n8n REST API (self-hosted, Hetzner Frankfurt) |
| Phase 3 | Workspace-Karte → Workflow, Community-Templates |
| Phase 4 | Manueller Editor nur wenn Enterprise-Kunden explizit fordern (Windmill/n8n Embed) |

### Verbindung zu Live

n8n-Workflows die Daten in Tropen OS schreiben erscheinen als Teil von Live-Systemen —
der Workflow selbst bleibt unter Agenten, sein Output ist in Live sichtbar.

## Community — Netzwerkeffekt

Community ist der Marktplatz für wiederverwendbare Bausteine.

```
Community
├── Prompts            → von Teammitgliedern, Org, extern
├── Agenten            → fertige Agent-Konfigurationen
├── Workspace-Templates → Businessplan, Dashboard, Marktanalyse...
├── Skills             → Fach-Kompetenzen für Agenten
└── Filter:            Mein Team · Meine Org · Öffentlich
```

**Scope-Hierarchie:**
- Team-Mitglied teilt → sichtbar für Team
- Org-Admin veröffentlicht → sichtbar für gesamte Org
- Tropen veröffentlicht → öffentlich für alle Kunden
- (Phase 3) User veröffentlicht öffentlich → Community-Marktplatz

### Connectors

Connectors sind die Brücke zu externen Systemen.
Jeder Connector kann als Karten-Quelle oder Karten-Output dienen.

**MVP-Connectors (Phase 2/3):**

| Connector | Richtung | Was es kann |
|-----------|---------|-------------|
| n8n | bidirektional | Trigger empfangen + senden |
| Webhook (generic) | bidirektional | Beliebige HTTP-Endpoints |
| RSS/Atom | eingehend | Feed-Daten (bereits vorhanden) |
| Webflow | ausgehend | CMS-Items schreiben (Phase 3) |
| WordPress | ausgehend | Posts/Pages erstellen (Phase 3) |
| Custom API | bidirektional | REST-API mit Auth (Phase 3) |

**Connector-Architektur:**
Connectors sind keine eigene Infrastruktur — sie sind
**Karten-Typen + Agenten-Trigger**:
- Eine `connector`-Karte hält die Verbindungskonfiguration
- Ein Agent nutzt die Verbindung als Input oder Output
- n8n bleibt der Haupt-Automatisierungs-Layer für komplexe Flows

---

## Die Systemarchitektur — Gesamtbild

```
┌─────────────────────────────────────────────────────────────────┐
│                         TROPEN OS                               │
│                                                                 │
│  AUFBAU-SCHICHT                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │  Chat    │  │ Projekte │  │        Workspaces             │  │
│  │ (direkt) │  │ Gedächt- │  │  Briefing → Karten → Export  │  │
│  │          │  │ nis+RAG  │  │  oder → Hub veröffentlichen  │  │
│  └──────────┘  └──────────┘  └──────────────────────────────┘  │
│                                                                 │
│  DATEN-SCHICHT                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Feeds   │  │  Wissen  │  │ Artefakte│                      │
│  │ (extern) │  │  (RAG)   │  │ (Output) │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                 │
│  PRODUKTIONS-SCHICHT                                            │
│  ┌──────────────────────────────────────────┐  ┌────────────┐  │
│  │                  HUB                      │  │ Dashboard  │  │
│  │  Systeme · Agenten · Connectors           │  │ Controlling│  │
│  │  Templates · (Marktplatz Phase 3)         │  │            │  │
│  └──────────────────────────────────────────┘  └────────────┘  │
│                                                                 │
│  KI-SCHICHT (unsichtbar, überall)                               │
│  Toro · Capabilities · Skills · Guided Workflows · Router       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Build-Reihenfolge — aktualisiert

### Phase 2 (laufend)

```
✅ Plan A    DB-Fundament (Migrationen 030–033)
✅ Plan B    Projects CRUD + Gedächtnis
✅ Plan C    Workspace Backend (cards, card_history, connections)
✅ Plan D    Chat & Context Integration
✅ Plan E    Transformations-Engine
✅ Plan F    Workspace UI (Projekte Memory-Tab, Workspaces-Liste)
✅ Plan G    Feeds (Pipeline, Cron, UI)
✅ Plan J1   Feed-Runs + Pause/Resume
✅ Plan J2a  Skills-Fundament
✅ Plan J2b  Agent-Engine
✅ Plan J2c  Autonomie (Cron + Webhook)
✅ Plan K    Geteilte Chats (Share-Link, /s/[token], Team-Antwort)
```

### Phase 3 (geplant)

```
⬜ Agenten UI     /agenten Route, Run-History, Agenten-Konfiguration UI
⬜ Live v1        Produktiv-Schalten-Flow, /live Route, Live-Dashboards
⬜ n8n Phase 2    n8n self-hosted, N8nClient, Toro generiert Workflows
⬜ Community v1   /community Route, Teilen von Prompts/Agenten/Templates
⬜ Connectors     Webflow, WordPress, Custom API
⬜ Export v2      Word, PDF, Präsentation, SCORM
⬜ Dashboard v2   Workspace-Nutzung, Agenten-Performance
⬜ Extended Think Extended Thinking via API
⬜ Multimodal     Datei-Upload im Chat
```

### Phase 4 (geplant)

```
⬜ n8n Embed      Manueller Editor wenn Enterprise-Kunden es fordern
⬜ n8n Toro       Toro-Assistent im n8n Editor (mehrere Wege)
```

---

## Offene Entscheidungen

| Entscheidung | Priorität | Kontext |
|-------------|-----------|---------|
| Silo-Chat: `conversations`-Tabelle erweitern | ✅ Entschieden — Option A (conversations + conversation_type) | F-Canvas |
| Hub-Begriff | ✅ Entfällt — ersetzt durch Live + Agenten + Community | Navigation |
| Artefakte vs. Live | ✅ Entschieden — statisch vs. dynamisch, keine Überschneidung | Live v1 |
| Community-Scope | ✅ Team → Org → Öffentlich (Hierarchie) | Community v1 |
| n8n Integration | ✅ Entschieden — Toro generiert, kein Editor in Phase 2/3 | n8n Phase 2 |
| n8n Hosting | ✅ Entschieden — Hetzner VPS Frankfurt, self-hosted Community Edition | n8n Phase 2 |
| n8n Navigation | ✅ Unter Agenten — Workflows sind eine Art Agent | Navigation |
| Toro + n8n Wege | ✅ Konzept in `docs/superpowers/n8n-integration-konzept.md` | n8n Phase 2 |
| Workspace → Hub: wie wird deployed? (status-Flag oder eigene Tabelle?) | 🟡 Mittel | Vor Hub v2 |
| n8n Org-Credentials Phase 2: welche unterstützt? (Slack, Gmail, Webhook?) | 🔴 Hoch | Vor n8n Phase 2 |
| Connector-Architektur: Karten-Typ oder eigene Tabelle? | 🟡 Mittel | Vor Phase 3 |
| SCORM-Export: eigene Library oder über n8n? | 🟢 Niedrig | Phase 3 |
| Workspace-Templates: in DB oder als Code-Fixtures? | 🟢 Niedrig | Vor F4-Template |
| n8n Embed ($50k/Jahr) vs. Windmill | 🟢 Niedrig — Phase 4 | Nur wenn Enterprise-Kunden Editor fordern |

---

## Was dieses Dokument nicht ist

- Kein Build-Prompt — dafür gibt es separate Prompt-Dokumente
- Keine technische Spezifikation — die liegt in den jeweiligen Plan-Dokumenten
- Kein finales Produkt-Design — es entwickelt sich iterativ

Es ist der **gemeinsame Nordstern**: Wenn eine Entscheidung unklar ist,
hilft dieses Dokument zu fragen: "Passt das zum Gesamtbild?"
