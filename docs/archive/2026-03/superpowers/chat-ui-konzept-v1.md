# Chat-UI Konzept v1.0
## Drei Zonen — sauber getrennt

> **Status:** Finalisiert März 2026
> **Basis:** Informationsarchitektur v2.0
> **Gilt für:** Alle Chat-Build-Prompts

---

## Das Prinzip

```
Zone 1 — Antwort-Zone:    Was TU ich mit dieser Antwort?
Zone 2 — Input-Zone:      Wie gebe ich meinen nächsten Input?
Zone 3 — Kontext-Panel:   Wie konfiguriere ich diesen Chat?
```

Jede Funktion gehört genau in eine Zone.
Keine Überschneidungen, keine Dopplungen.

---

## Zone 1 — Antwort-Zone

Jede Toro-Antwort hat eine Aktionsleiste darunter.
Alles was mit **dieser spezifischen Antwort** zu tun hat.

### Standard-Antwort (Text/Markdown)

```
┌─────────────────────────────────────────────────────┐
│  Toro-Antwort                                       │
│  [gerendertes Markdown]                             │
│                                                     │
│  ── Aktionsleiste ──────────────────────────────    │
│  [👍] [👎]  ·  [📋 Kopieren]  [💾 Speichern]        │
│              [↗️ Teilen]  [👁️ Perspektiven]          │
│              [🔄 Neu generieren]                    │
└─────────────────────────────────────────────────────┘
[Quick-Chip 1]  [Quick-Chip 2]  [Quick-Chip 3]
```

### Artifact-Antwort (Dashboard, Chart, Präsentation)

```
┌─────────────────────────────────────────────────────┐
│  REACT · Online Marketing Dashboard    [Code] [⛶]  │
│  [interaktives Artifact]                            │
│                                                     │
│  ── Aktionsleiste ──────────────────────────────    │
│  [👍] [👎]  ·  [💾 Speichern]  [↗️ Teilen]          │
│              [📥 Exportieren]  [✏️ Bearbeiten]       │
│              [👁️ Perspektiven]  [🔄 Neu generieren] │
└─────────────────────────────────────────────────────┘
[💡 Verfeinern]  [🎨 Design ändern]  [📊 Als Chart]
```

### Aktionen — vollständige Definition

| Aktion | Icon | Wann sichtbar | Was passiert |
|--------|------|--------------|--------------|
| Daumen hoch | 👍 | immer | Positives Feedback |
| Daumen runter | 👎 | immer | Negatives Feedback |
| Kopieren | 📋 | Text-Antworten | Inhalt in Zwischenablage |
| Speichern | 💾 | immer | In Projekt/Collection speichern |
| Teilen | ↗️ | immer | In Workspace teilen |
| Exportieren | 📥 | nur Artifacts | Als Datei herunterladen (.pptx, .pdf, .png) |
| Bearbeiten | ✏️ | nur Artifacts | Artifact direkt editieren |
| Perspektiven | 👁️ | immer | Perspectives zu dieser Antwort befragen |
| Neu generieren | 🔄 | immer | Andere Version der Antwort |

### Quick-Chips

Direkt unter der Aktionsleiste — kontextuell generiert von Toro.
Max. 4 Chips. Verschwinden wenn neue Nachricht gesendet wird.

```
Standard nach Text:
[💡 Mehr Ideen]  [✏️ Ausarbeiten]  [→ Nächster Schritt]

Standard nach Artifact:
[🎨 Design ändern]  [📊 Daten anpassen]  [💾 Speichern]

Standard nach Analyse:
[🔍 Vertiefen]  [⚖️ Gegenargumente]  [📋 Zusammenfassen]
```

### Design-Regeln Aktionsleiste

- Standardmäßig dezent — kleine Icons, var(--text-tertiary)
- Hover: Icons werden deutlicher sichtbar
- Auf Mobile: nur 👍 👎 📋 💾 sichtbar, Rest hinter "···"
- Aktionsleiste erscheint erst nach vollständigem Streaming

---

## Zone 2 — Input-Zone

Nur was den **nächsten Input** betrifft.
So minimal wie möglich.

```
┌─────────────────────────────────────────────────────┐
│  Nachricht eingeben...                      [▶ Send] │
├─────────────────────────────────────────────────────┤
│  [📎]  [🎤]  [⚙️]                                   │
└─────────────────────────────────────────────────────┘
```

### Drei Icons — nicht mehr

| Icon | Funktion | Was passiert |
|------|---------|--------------|
| 📎 | Datei hochladen | Öffnet File-Picker (PDF, Bild, Dokument) |
| 🎤 | Voice Input | Startet Spracheingabe (bereits gebaut) |
| ⚙️ | Chat-Einstellungen | Öffnet/schließt rechtes Kontext-Panel |

### Was NICHT im Input ist

```
✗ Perspectives-Strip     → gehört an Antwort-Zone (👁️)
✗ Rollen-Dropdown        → implizit via detectRole()
✗ Modus-Dropdown         → implizit via detectCapability()
✗ "Prompt verfeinern"    → gehört an Antwort-Zone (Quick-Chip)
✗ Workspace-Button       → gehört an Antwort-Zone (↗️ Teilen)
✗ Artifact-Aktionen      → gehören an Antwort-Zone
```

### Kontextuelle Ergänzungen über dem Input

Wenn Projekt aktiv:
```
┌─────────────────────────────────────────────────────┐
│  📁 Businessplan Buchhandlung          [→ Öffnen]   │
└─────────────────────────────────────────────────────┘
```

Wenn Perspectives aktiv (nach Klick auf 👁️):
```
┌─────────────────────────────────────────────────────┐
│  👁️ [🔴 Kritiker ×] [😈 A.D. ×]      [Befragen →] │
└─────────────────────────────────────────────────────┘
```

Perspectives-Leiste erscheint NUR wenn User aktiv 👁️ angeklickt hat.
Verschwindet nach "Befragen" oder nach nächster gesendeter Nachricht.

---

## Zone 3 — Kontext-Panel (rechte Seite)

Öffnet sich über ⚙️ Icon im Input oder ist standardmäßig offen.
Konfiguration des Chats — nicht der einzelnen Antwort.

```
┌─────────────────────────────────────────┐
│  KONTEXT                           [×]  │
│  ● Projekt: Businessplan        [→]     │
│  (oder: Freier Chat / Workspace X)      │
├─────────────────────────────────────────┤
│  TORO KONFIGURIEREN                     │
│  Skills, Gedächtnis, Stil, Hinweise     │
├─────────────────────────────────────────┤
│  VERBINDUNGEN (MCP)                     │
│  Google Drive, HubSpot, Slack           │
├─────────────────────────────────────────┤
│  ANSICHT                                │
│  Split-View, Link-Vorschauen            │
└─────────────────────────────────────────┘
```

### Was NICHT im Kontext-Panel ist

```
✗ Nachrichten-Zähler    → Dashboard
✗ Token-Verbrauch       → Dashboard
✗ Kosten Session/Monat  → Dashboard
✗ Hochrechnung          → Dashboard
✗ CO₂ Schätzung         → Dashboard
```

---

## Responsive Verhalten

### Desktop (> 1200px)
```
[Sidebar 180px] [Chat-Bereich flex] [Kontext-Panel 300px]
```

### Tablet (768-1200px)
```
[Chat-Bereich full] [Kontext-Panel als Overlay]
Sidebar: Icons only
```

### Mobile (< 768px)
```
[Chat-Bereich full]
Kontext-Panel: Bottom-Sheet
Aktionsleiste: nur Kernaktionen (👍 👎 📋 💾)
```

---

## Chat-Breite

Chat-Bereich hat eine max-width von **800px** — zentriert.
Auch wenn Kontext-Panel eingeklappt ist.
Grund: Lesbarkeit — zu breite Textspalten sind anstrengend.

---

## Zusammenfassung: Was wohin gehört

| Funktion | Zone |
|---------|------|
| 👍 👎 Feedback | Antwort-Zone |
| 📋 Kopieren | Antwort-Zone |
| 💾 Speichern | Antwort-Zone |
| ↗️ Teilen | Antwort-Zone |
| 📥 Exportieren | Antwort-Zone (nur Artifacts) |
| ✏️ Bearbeiten | Antwort-Zone (nur Artifacts) |
| 👁️ Perspectives | Antwort-Zone |
| 🔄 Neu generieren | Antwort-Zone |
| Quick-Chips | Antwort-Zone (unter Aktionsleiste) |
| 📎 Datei hochladen | Input-Zone |
| 🎤 Voice Input | Input-Zone |
| ⚙️ Einstellungen öffnen | Input-Zone |
| Projekt-Kontext | Input-Zone (kontextuell über Input) |
| Perspectives-Leiste | Input-Zone (kontextuell, nur wenn aktiv) |
| Skills | Kontext-Panel |
| Gedächtnis-Slider | Kontext-Panel |
| Antwort-Stil | Kontext-Panel |
| Proaktive Hinweise | Kontext-Panel |
| MCP-Verbindungen | Kontext-Panel |
| Split-View | Kontext-Panel |
| Link-Vorschauen | Kontext-Panel |
| Kosten/Tokens/CO₂ | Dashboard |

---

## Build-Priorität

```
1. Input-Zone aufräumen                     ✅ erledigt
   → "Prompt verfeinern" weg

2. Aktionsleiste an Antworten
   → 👍 👎 📋 💾 ↗️ 👁️ 🔄
   → Quick-Chips direkt darunter

3. Kontext-Panel umbauen                    ✅ erledigt
   → Statistiken raus
   → 4 Bereiche: Kontext / Konfigurieren / MCP / Ansicht

4. Perspectives an Antworten
   → Strip entfernen
   → 👁️ Icon an jeder Antwort
   → Perspectives-Leiste über Input wenn aktiv
```
