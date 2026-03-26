# Informationsarchitektur — Tropen OS v2.0
Single Source of Truth
> **Status:** Finalisiert März 2026
> **Ersetzt:** Workspace-Konzept v2.0, alle früheren Nav-Definitionen
> **Gilt für:** Navigation, Chat-UI, rechte Seitenleiste, alle Build-Prompts

---

## Die fünf Kern-Entitäten

### 1. Projekt
Was es ist: Thematischer Container für fokussierte Arbeit
```
Projekt "Businessplan Buchhandlung"
├── Chats          (alle Gespräche zu diesem Thema)
├── Artefakte      (alle Outputs aus diesen Chats)
├── Collections    (kuratierte Passagen — Phase 2)
├── Projekt-Wissen (spezifische Dokumente + RAG)
└── Projekt-Skills (spezifische Toro-Anweisungen — Phase 2)
```
- Jeder Chat kann einem Projekt zugeordnet sein
- Projekt-Gedächtnis wächst automatisch aus Chats
- Artefakte werden automatisch dem Projekt zugeordnet
- Projekt-Wissen ist nur in Chats dieses Projekts aktiv

---

### 2. Artefakt
Was es ist: Alles was Toro produziert hat das kein Chat ist

Typen:
```
Dokumente:      Word, PDF, Markdown
Code/HTML:      React-Komponenten, HTML-Seiten
Dashboards:     Interaktive Charts und KPI-Ansichten
Präsentationen: Reveal.js Slides
Charts:         ECharts-Visualisierungen
Tabellen:       Strukturierte Datensichten
Linksammlungen: Kuratierte URL-Listen
SCORMs:         Lernmodule (Phase 3)
```

Entstehung:
- Im Chat via "💾 Speichern" Button direkt am Artifact
- Automatisch dem aktiven Projekt zugeordnet
- Freistehend wenn kein Projekt aktiv

Aktionen direkt am Artifact im Chat:
```
[💾 In Projekt speichern]  [↗️ In Workspace teilen]  [📥 Exportieren]
```
Keine Artifact-Aktionen in der rechten Seitenleiste —
alles direkt am Artifact inline.

---

### 3. Collection
Was es ist: Kuratierte Sammlung von Chat-Passagen und Artefakten

Löst: Das Drift-Problem — gute Erkenntnisse aus langen Chats
gehen nicht verloren

Entstehung:
- User markiert Chat-Passage → "In Collection speichern"
- User zieht Artefakte in eine Collection
- Toro schlägt vor: "Das klingt wichtig — soll ich das festhalten?"

Lebt in: Projekt (immer einem Projekt zugeordnet)

**Phase: 2 — noch nicht implementieren**

---

### 4. Workspace
Was es ist: Geteilter Bereich für Zusammenarbeit

Neu definiert — nicht mehr Karten-Board:
```
Workspace = Alles was ich mit anderen teile
├── Geteilte Projekte
├── Geteilte Collections
├── Geteilte Artefakte
└── Wer hat Zugriff auf was?
```

Entstehung:
- User zieht Projekt/Collection/Artefakt in Workspace
- Oder: direkt am Artefakt → "↗️ In Workspace teilen"
- Workspace zeigt sofort was geteilt ist und was nicht

Eigenständiger Nav-Punkt: Workspace bleibt in der Navigation —
damit User sofort sieht was geteilt ist und den Überblick über
geteilte Inhalte hat.

---

### 5. Wissen (Wissensbasis)
Was es ist: Dokumente die Toro als Kontext nutzt

Drei Ebenen — transparent sichtbar:
```
Org-Wissen:
→ Unternehmensweites Wissen für alle Chats
→ Org-Admin pflegt
→ Beispiel: Produktbeschreibung, Brand Voice, Preisliste

User-Wissen:
→ Persönliche Dokumente nur für eigene Chats
→ Jeder pflegt selbst
→ Beispiel: persönliche Notizen, eigene Templates

Projekt-Wissen:
→ Spezifisch für ein Projekt
→ Im Projekt verwaltet
→ Erscheint in Wissen-Übersicht als Link (read-only, zur Transparenz)
```

---

## Die Navigation

```
Chat          → Einstieg, freier oder Projekt-Chat
Projekte      → Alle Projekte + ihre Inhalte
Artefakte     → Zentrale Übersicht aller Artefakte (suchbar)
Workspaces    → Alles was geteilt ist
Wissen        → Org + User + Projekt-Wissen (Übersicht)
Feeds         → Automatische Informationsquellen
Agenten       → Autonome Tasks + Meta-Agenten
Dashboard     → Cockpit: Insights, Signale, Rollen-spezifisch
```

Was wegfällt:
```
✗ Pakete      → ersetzt durch Rollen + Cockpit-Logik
✗ Workspace als Karten-Board → ersetzt durch Artefakte + Collections
```

---

## Die rechte Seitenleiste

Nicht mehr: Session-Statistiken, Kosten, Hochrechnung
→ Die gehören ins Dashboard (historische Übersicht)

Jetzt: Chat-Konfiguration + Verbindungen

```
┌─────────────────────────────────────────┐
│  KONTEXT                                │
│  ● Projekt: Businessplan        [→]     │
│  (oder: Freier Chat / Workspace X)      │
├─────────────────────────────────────────┤
│  TORO KONFIGURIEREN                     │
│                                         │
│  Skills              [+ Hinzufügen]     │
│  [📊 Analyst] [✍️ Texter]              │
│                                         │
│  Gedächtnis          20 Nachr.  [⚙]    │
│                                         │
│  Antwort-Stil        [Strukturiert ▾]   │
│                                         │
│  Proaktive Hinweise  [●──────────]      │
│                                         │
├─────────────────────────────────────────┤
│  VERBINDUNGEN (MCP)                     │
│                                         │
│  ✅ Google Drive      verbunden         │
│  ✅ HubSpot           verbunden         │
│  ○  Slack             nicht verbunden   │
│  [+ Weitere verbinden →]                │
│                                         │
├─────────────────────────────────────────┤
│  ANSICHT                                │
│                                         │
│  Geteilter Bildschirm  [Aktivieren]     │
│  Chat links · Artefakt/Dok. rechts      │
│                                         │
│  Links anzeigen        [●──────────]    │
│  URL-Vorschauen im Chat                 │
└─────────────────────────────────────────┘
```

Vier Bereiche:
1. **Kontext** — wo bin ich? (Projekt/Workspace/Frei)
2. **Toro konfigurieren** — wie soll Toro arbeiten?
3. **Verbindungen** — welche MCP-Integrationen sind aktiv?
4. **Ansicht** — Split-View, Link-Vorschauen

Dateien: Bleiben unten im Chat-Input (hat sich bewährt)

---

## Was sich ändert — Übersicht

| Was | Vorher | Nachher |
|-----|--------|---------|
| Workspaces | Karten-Board, manuell | Geteilter Bereich, automatisch |
| Artefakte | In Workspaces als Karten | Eigener Nav-Punkt, suchbar |
| Pakete | Marketing-Paket etc. | Entfällt — Rollen + Cockpit |
| Rechte Seite | Statistiken + Einstellungen | Chat-Konfig + MCP |
| Artifact-Aktionen | Rechte Seite | Direkt am Artifact inline |
| Wissen | Separater Bereich | Bleibt, klarer 3-Ebenen-Struktur |

---

## Artefakte — zentrale Suchseite

```
/artefakte

Filterbar nach:
→ Typ (Dashboard, Präsentation, Dokument, Code...)
→ Projekt (aus welchem Projekt?)
→ Datum (diese Woche, dieser Monat...)
→ Freitext-Suche: "Marketing Dashboard" findet es sofort

Jede Karte zeigt:
→ Typ-Icon + Titel
→ Projekt-Zuordnung (oder "Freistehend")
→ Erstellt am
→ [Öffnen] [Teilen] [Exportieren]
```

Löst: "In welchem Chat hatte ich nochmal das Dashboard?"

---

## Offene Entscheidungen

| Frage | Priorität |
|-------|-----------|
| Collections: wann implementieren? | 🟡 Phase 2 |
| Projekt-Skills: eigene Skills pro Projekt? | 🟡 Phase 2 |
| Geteilter Bildschirm: Split-View Implementierung | 🟡 Mittel |
| MCP-Panel: welche Integrationen zuerst? | 🔴 Hoch |
| Artefakte-Suchseite: wann bauen? | 🔴 Hoch |
| Dashboard → Cockpit Umbau | 🔴 Hoch |

---

## Build-Reihenfolge

```
1. Rechte Seitenleiste umbauen
   → Statistiken raus, Chat-Konfig rein
   → MCP-Panel als Placeholder

2. Artefakte-Suchseite
   → /artefakte mit Filter + Suche
   → Artefakte aus Projekten + freistehend

3. Workspace neu definieren
   → Teilen-Mechanismus
   → "Rein ziehen" UX

4. MCP-Integrationen
   → Google Drive + HubSpot zuerst
   → OAuth-Flow

5. Dashboard → Cockpit
   → Rollen-spezifische Insights
   → Statistiken hierher verschieben
```
