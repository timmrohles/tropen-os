# Phase-2-Vision
## KMU-Substanz von Tropen OS — konzentriert für die spätere Aktivierung

> **Datum:** 2026-04-27
> **Charakter:** Backup-Konzept, kein Build-Plan
> **Quellen:** docs/tropen-os-architektur.md (v0.5), docs/product/architecture.md, docs/product/architecture-navigation.md (v1.0), docs/product/informationsarchitektur-v2.md (v2.0)
> **Status der Quell-Dokumente:** alle vier sind durch ADR-020/021/022/023 SUPERSEDED und liegen in `docs/_archive/2026-04-pre-pivot/`

---

## Warum es dieses Dokument gibt

Tropen OS hat zwischen März 2026 und April 2026 einen substanziellen Pivot vollzogen — von einer KMU-orientierten KI-Plattform zu einem **Production Readiness Guide für Vibe-Coder** (siehe `docs/product/roadmap-2026-q2.md`).

Im Zuge dieses Pivots werden viele Konzepte und Features eingefroren oder archiviert. Dieses Dokument bewahrt die **konzeptuelle Substanz** der KMU-Vision an einem zentralen Ort — als **Phase-2-Backup**. Wenn der KMU-Markt später relevant wird, ist die Substanz hier auffindbar, ohne die archivierten Dokumente einzeln durchsuchen zu müssen.

**Was dieses Dokument NICHT ist:**
- Kein Build-Plan — keine konkreten Spezifikationen oder Migrations
- Keine Strategie-Aussage — die Roadmap ist normativ, nicht dieses Dokument
- Kein Versprechen, dass diese Konzepte tatsächlich gebaut werden

**Was dieses Dokument IST:**
- Konzentrierter Pfeiler-Überblick über die KMU-Konzepte
- Verweis-Anker für Anhang C (Einfrier-Liste) und `feature-bestand.md`
- Erinnerung daran, was wertvoll genug war, nicht weggeworfen zu werden

---

## Spannungen zwischen den Quell-Dokumenten

Die vier Quell-Dokumente erzählen nicht einheitlich. Drei zentrale Spannungen, die Phase 2 auflösen muss, falls sie kommt:

**Spannung 1 — Workspace-Definition:**
- `tropen-os-architektur.md` und `architecture-navigation.md`: Workspace = **Karten-Graph für komplexe Vorhaben** - alt!
- `informationsarchitektur-v2.md`: Workspace = **geteilter Bereich für Zusammenarbeit** neu!

Das sind zwei verschiedene Konzepte mit dem gleichen Namen. Phase 2 muss einen der beiden Begriffe umbenennen — oder neu klären, ob das eine das andere subsumiert.

**Spannung 2 — Artefakte als Karten oder als eigene Entität:**
- `architecture-navigation.md`: Artefakte als statische Outputs aus Workspaces
- `informationsarchitektur-v2.md`: Artefakte als eigener Nav-Punkt mit zentraler Suche

Die zentrale Artefakt-Übersicht ist die produktive Auflösung — bleibt für Phase 2 erhalten.

**Spannung 3 — Hub vs. Live:**
- Frühere Konzepte sprachen von einem "Hub" für produktive Systeme
- `architecture-navigation.md` löst das auf: Hub entfällt, ersetzt durch **Live + Agenten + Community**

Diese Auflösung ist sauber und sollte in Phase 2 erhalten bleiben.

---

## Die fünf Pfeiler der KMU-Vision

Konsolidiert aus allen vier Quellen, was wirklich substanziell ist:

### Pfeiler 1 — Drei-Ebenen-Modell (Org → Department → Member)

Tropen OS hatte ein durchdachtes Multi-Tenant-Modell mit klarer Vererbungslogik:

```
ORG
  Identität · Konventionen · Ressourcen · Wissen
  definiert Kontroll-Spektrum für alles darunter
        │
        ▼
DEPARTMENT
  Erbt Org-Wissen · ergänzt eigenes
  kann Org-Einstellungen einschränken, nie lockern
        │
        ▼
MEMBER
  arbeitet in Projekten und Workspaces
  überschreibt was als 'suggested' oder 'open' markiert ist
```

**Warum das wertvoll bleibt:** Wenn der KMU-Markt aktiviert wird, ist Multi-Tenancy nicht "noch eine Aufgabe", sondern bereits durchdacht. Die Vererbungs-Semantik (eingeschränkt nach unten, nie gelockert) ist sauberer als bei den meisten KMU-SaaS-Tools.

**Code-Substanz heute:** `org_settings`, `dept_settings` Tabellen + RLS-Policies. Membership-Cluster aus M3 (Anhang B) konsolidiert das.

### Pfeiler 2 — Kontroll-Spektrum (locked/suggested/open)

Die wahrscheinlich wertvollste konzeptuelle Innovation der KMU-Vision. Kein anderes mir bekanntes Tool hat das so explizit modelliert:

```typescript
interface ControlledSetting<T> {
  value: T
  controlMode: 'locked' | 'suggested' | 'open'
  setBy: 'org' | 'dept' | 'member'
  explanation?: string
  bestPractice?: string
}
```

- **`locked`** — Org definiert, Member kann nicht abweichen
- **`suggested`** — Org definiert Default, Member kann überschreiben
- **`open`** — Org gibt nichts vor, Member entscheidet frei

**Warum das wertvoll bleibt:** Das ist die Antwort auf das KMU-SaaS-Dilemma "wie viel Kontrolle gebe ich der Org, wie viel Freiheit dem Member?". Statt einer binären Entscheidung gibt es ein Spektrum mit klaren Regeln.

**Konkret pro Konvention** (Sprache, Kommunikationsstil, Zitierstil etc.):
```
{ label: "Sprache",
  value: "Deutsch",
  controlMode: "suggested",
  explanation: "Standard-Sprache für KI-Antworten",
  bestPractice: "Member sollten nur abweichen wenn das Projekt explizit anderssprachig ist" }
```

**Code-Substanz heute:** `org_settings.controlMode`-Felder. UI-Pfade sind eingefroren, Schema bleibt.

### Pfeiler 3 — Karten mit drei Aggregatzuständen

Eine Karte in einem Workspace ist nicht statisch — sie kann drei Zustände haben:

```
1. STATISCH    → Inhalt einmal erstellt (Text, Tabelle, Chart aus Daten)
2. GENERATIV   → KI erstellt/aktualisiert den Inhalt (Toro-Chat pro Karte)
3. LIVE        → Karte ist verbunden mit externem System (Feed, API, Connector)
```

**Vollständige Karten-Typen** (aus architecture-navigation.md):

| Typ | Aggregatzustände | Besonderheit |
|-----|-----------------|--------------|
| `text` | statisch + generativ | Markdown, exportierbar |
| `table` | statisch + generativ + live | Feed-fähig, API-fähig |
| `chart` | statisch + generativ + live | ECharts, Org-Theme |
| `list` | statisch + generativ | einfachste Form |
| `code` | statisch + generativ | Syntax-Highlight |
| `kanban` | statisch + generativ | Status-Tracking |
| `timeline` | statisch + generativ | Meilensteine, Phasen |
| `mindmap` | statisch + generativ | Brainstorming |
| `embed` | live | iFrame, externe URL |
| `image` | statisch | Asset-Verbindung |
| `connector` | live | API-Call, Webhook, n8n-Trigger |
| `dashboard-widget` | live | Kombiniert mehrere Datenquellen |

**Warum das wertvoll bleibt:** Die Aggregatzustands-Logik ist konzeptuell elegant. "Eine Tabelle wird zu einer Live-Tabelle wenn sie an einen Feed angeschlossen ist" ist ein einfaches Mental-Modell für komplexes Verhalten.

**Code-Substanz heute:** `cards`-Tabelle + `card_history` (APPEND ONLY). UI ist eingefroren, Schema bleibt teilweise erhalten (in der PW-Cluster-Konsolidierung von M3 wird `card_history` migriert).

### Pfeiler 4 — Aufbau vs. Produktion (zwei Aggregatzustände)

Tropen OS hatte ein klares System-Modell mit zwei Phasen:

```
AUFBAU                          PRODUKTION
──────────────────────────────────────────────────────
Chat          → schnelle Arbeit
Projekte      → Wissen akkumulieren
Workspaces    → komplexe Vorhaben bauen
                                Live → fertige Systeme laufen
                                Live → Workspaces als Apps
                                Live → Agenten arbeiten autonom
                                Dashboard → Controlling
```

Der **Workspace** war die Brücke: Man baut darin — und veröffentlicht ins Live.

**Lebenszyklus eines Workspace:**
```
1. BRIEFING    → Toro versteht das Vorhaben (Gespräch)
2. AUFBAU      → Karten anlegen, befüllen, verknüpfen
3. VERFEINERN  → Karten-Chats, Stale-Propagation, Anpassungen
4. EXPORT      → Dokument / Präsentation / Spec
   oder
4. VERÖFFENTLICHEN → Workspace wird als Live-System deployed
5. PRODUKTION  → Workspace läuft autonom (Feeds updaten Karten,
                  Agenten arbeiten, Dashboard zeigt Live-Daten)
```

**Warum das wertvoll bleibt:** Das ist die Antwort auf "wie wird ein KI-Output zum laufenden System?". Die Trennung Aufbau/Produktion ist klarer als bei vergleichbaren Tools, die das vermischen.

**Code-Substanz heute:** Workspaces, Cards, Stale-Propagation, Briefing-Flow — alles eingefroren. Live-Schicht ist nicht gebaut.

### Pfeiler 5 — Wissens-Hierarchie (8 Stufen)

Pro KI-Aufruf wurde eine klare Reihenfolge von Wissensquellen definiert:

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

**Warum das wertvoll bleibt:** Die Hierarchie ist deterministisch, hat klare Inklusions-Regeln und löst das KMU-Problem "wie kombiniere ich Org-Wissen, Team-Wissen und persönliches Wissen?".

**Code-Substanz heute:** Teilweise implementiert in `loadProjectContext()`, `workspace-context.ts`. Die volle 8-Stufen-Hierarchie ist nicht durchgezogen.

---

## Ergänzende Substanz (kürzer)

### Kontext-Window-Awareness

Das Projekt-Gedächtnis war eng mit Context-Window-Management verbunden:
- Token-Count nach jeder Message (lokal via tiktoken, kein API-Aufruf)
- Füllstand sichtbar im Chat-Header
- Warnung bei 85% mit Angebot zur Zusammenfassung
- Zusammenfassung via Haiku → APPEND in `project_memory`
- Beim nächsten Chat: "Letzte Session: ..." als Einstieg

**Warum das relevant bleibt:** Wandert teilweise ins MVP, weil auch Solo-User von Context-Awareness profitieren. Im Roadmap-MVP ist das aber nicht priorisiert.

### Transformations-Engine

Wissen sollte sich transformieren können — von Projekt zu Workspace zu Agent:

```
analyze(source)     → bewertet Inhalt, Gedächtnis, Struktur
suggest()           → schlägt Transformationen vor mit Begründung + Vorschau
build(type, source) → erstellt Workspace / Agent / Feed
link(source,target) → Verbindung bleibt aktiv, Wissen fließt weiter
```

Immer: Vorschau → Bestätigung → Ausführung. Nie destruktiv.

**Warum das wertvoll bleibt:** Wenn Workspaces in Phase 2 reaktiviert werden, ist die Transformation Projekt→Workspace ein zentraler Workflow.

**Code-Substanz heute:** `transformations`-Tabelle + `analyze` und `execute` API-Routes. Eingefroren.

### Connectors

Die Brücke zu externen Systemen war als **Karten-Typ + Agenten-Trigger** modelliert:

| Connector | Richtung | Was es kann |
|-----------|---------|-------------|
| n8n | bidirektional | Trigger empfangen + senden |
| Webhook (generic) | bidirektional | Beliebige HTTP-Endpoints |
| RSS/Atom | eingehend | Feed-Daten |
| Webflow | ausgehend | CMS-Items schreiben |
| WordPress | ausgehend | Posts/Pages erstellen |
| Custom API | bidirektional | REST-API mit Auth |

**Warum das wertvoll bleibt:** Connectors sind die Substanz für KMU-Workflow-Automatisierung. n8n ist als bevorzugter Workflow-Runner identifiziert (Hetzner Frankfurt, Self-hosted Community Edition).

**Code-Substanz heute:** `connections`-Tabelle. n8n-Integration nicht gebaut.

### Community-Marktplatz

Geplant für Phase 3, aber strukturell skizziert:

```
Community
├── Prompts            → von Teammitgliedern, Org, extern
├── Agenten            → fertige Agent-Konfigurationen
├── Workspace-Templates → Businessplan, Dashboard, Marktanalyse...
├── Skills             → Fach-Kompetenzen für Agenten
└── Filter:            Mein Team · Meine Org · Öffentlich
```

Scope-Hierarchie: Team-Mitglied teilt → sichtbar für Team. Org-Admin veröffentlicht → sichtbar für Org. Tropen veröffentlicht → öffentlich. Phase 3: User → Marktplatz.

**Code-Substanz heute:** `scope='public'` als Marker in mehreren Library-Tabellen. UI nicht gebaut.

---

## Wieder-Anschalten — was wäre der Auslöser?

Phase 2 wäre relevant, wenn einer der folgenden Trigger erfüllt ist:

| Trigger | Wahrscheinlichkeit | Konsequenz |
|---------|--------------------|----|
| **Erster Agency-Kunde** mit klaren Multi-User-Anforderungen | mittel | Pfeiler 1 + 2 reaktivieren (Org/Dept-Modell + Kontroll-Spektrum) |
| **Solo-Markt erreicht Sättigung** und nächster Wachstumsschritt ist KMU | unklar | Vollständige Phase-2-Aktivierung |
| **Lovable/Cursor verlangt Partnership-Integration** mit Org-Features | niedrig | Pfeiler 1 + 5 (Multi-Tenancy + Wissens-Hierarchie) |
| **EU-Compliance-Markt fragt nach Multi-Org-Reports** | niedrig | Pfeiler 1 + Compliance-Stufe-3 (PDF-Nachweis) aus Tag 4 |

**Wenn ein Trigger erfüllt ist:**
1. ADR schreiben — was hat sich geändert?
2. Aufwand schätzen — pro Pfeiler aus dieser Vision
3. L2-Validierung — drei KMU-Gespräche bestätigen die Annahmen
4. Phase-2-Roadmap erstellen — eigenes Dokument, nicht in Q2/Q3-Roadmap

**Niemals:** Phase 2 starten, ohne ADR und ohne Validierung. Das wäre genau der Drift, den Tag 4 verhindern soll.

---

## Was dieses Dokument ersetzt — und was nicht

### Ersetzt

| Quell-Dokument | Status nach Tag 4.5 |
|----------------|---------------------|
| `tropen-os-architektur.md` | SUPERSEDED → archiviert in `docs/_archive/2026-04-pre-pivot/` |
| `architecture.md` (Phase-2-Architektur) | SUPERSEDED → archiviert |
| `architecture-navigation.md` (Hub-Konzept) | SUPERSEDED → archiviert |
| `informationsarchitektur-v2.md` | SUPERSEDED → archiviert |

### Ersetzt nicht

Die folgenden Dokumente bleiben aktuell und sind **nicht** Teil der Phase-2-Vision:

- `roadmap-2026-q2.md` — normativ
- `user-story-idea-to-production.md` — Marketing-Narrativ
- `feature-bestand.md` — technischer Bestand
- ADR-020/021/022/023 — strategische Architektur
- Alle Engineering-Standards (audit-system.md, engineering-standard.md)

---

## Anhang — was nicht in dieses Dokument gehört

Folgendes wurde im Pivot **explizit gestrichen** und gehört nicht in eine spätere Phase-2:

- **Pakete als Konzept** (Marketing-Paket etc.) — Roadmap-Kill-Liste
- **Hub als eigener Begriff** — durch Live + Agenten + Community ersetzt
- **Eigener Code-Editor** — Cursors Job
- **Echtzeit-Linting** — stört Flow
- **PR-basierter Review** — CodeRabbit hat das besser
- **Compliance-Zertifikate** — rechtliches Risiko
- **SSO/Enterprise als Year-1-Feature** — kommt mit erstem Enterprise-Kunden

Diese Punkte sind aus der KMU-Vision **bewusst entfernt** worden, weil sie nicht zum DACH-Solo-Vibe-Coder-Markt passen oder strategisch problematisch sind. Sie sollten auch in Phase 2 nicht zurückkehren ohne expliziten ADR-Schritt.

---

## Die wichtigste Erinnerung

> **Was hier steht, ist nicht "was wir bauen werden". Es ist "was wir wissen, dass es wertvoll war".**

Wer Phase 2 startet, fängt nicht von null an — aber auch nicht mit fertigen Spezifikationen. Diese fünf Pfeiler sind die **konzeptuelle Schwerkraft** der KMU-Vision. Wenn der Markt zeigt, dass es Zeit ist, ist die Substanz hier auffindbar.

Bis dahin: Solo-Vibe-Coder. Roadmap-MVP. Drei Features. Diszipliniert.
