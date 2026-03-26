# ADR-013: Perspectives — Parallele KI-Antworten mit Perspektiven-Avataren

**Datum:** 2026-03-22 (Migration 065) — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Nutzer möchten zu einer Frage oder Situation mehrere Sichtweisen einholen —
z.B. "Wie würde ein CFO, ein Marketingexperte und ein Jurist dasselbe Problem
beurteilen?" Der klassische Chat-Ansatz (eine Antwort pro Anfrage) kann das nicht
erfüllen ohne mehrere manuelle Folge-Chats.

**Frage:** Wie ermöglichen wir strukturierte Mehrfach-Perspektiven ohne den
Haupt-Chat-Flow zu unterbrechen?

**Optionen evaluiert:**
- **Sequenzielle Abfragen**: Eine nach der anderen — einfach, aber langsam (3 Avatare × ~10s = 30s)
- **Paralleles Streaming** (gewählt): Alle Avatare gleichzeitig — schnellste UX
- **Separater Chat-Tab pro Avatar**: Zu fragmentiert, kein Vergleichs-View
- **Einzel-Prompt mit Rollen-Anweisung**: Toro simuliert mehrere Rollen in einer Antwort — weniger authentisch, schlechtere Qualität

---

## Entscheidung

**Paralleles SSE-Streaming via `Promise.all()`** für alle aktiven Perspektiven-Avatare.

### Daten-Modell (`perspective_avatars`)

| Feld | Bedeutung |
|------|-----------|
| `scope` | `system` / `org` / `user` — Hierarchie, system ist read-only |
| `is_tabula_rasa` | `true` → Avatar bekommt NUR den letzten User-Turn (kein Projektkontext) |
| `system_prompt` | Charakter-Beschreibung, Fachexpertise, Kommunikationsstil |
| `emoji` | Visuelle Identifikation im UI |

**5 System-Avatare** (seeded, read-only): Stratege, Kritiker, Optimist, Jurist, Zahlenmensch

### API-Layer (`/api/perspectives/query`)

```typescript
// Parallel für alle Avatare
const responses = await Promise.all(
  avatars.map(avatar => streamText({ model, system: avatar.system_prompt, ... }))
)
```

SSE-Event-Protokoll:
- `{ avatarId, delta }` — pro Text-Chunk
- `{ avatarId, done, tokensUsed }` — wenn Avatar fertig
- `{ done: true }` — wenn alle Avatare fertig

### UI-Schicht
- **`PerspectivesStrip`**: Avatar-Pills über ChatInput — Avatare wählen, "Befragen"-Button
- **`PerspectivesBottomSheet`**: Bottom Sheet mit Streaming-Antworten (60vh / 92vh mobile)
  - Kopieren, "In Chat posten" (als `assistant`-Nachricht einfügen)
- **`/perspectives`-Verwaltungsseite**: CRUD für eigene Avatare, Tab-Ansicht (System / Org / Meine)

### Tabula-Rasa-Guard
Avatare mit `is_tabula_rasa=true` bekommen server-seitig erzwungen nur den letzten
User-Turn als Kontext — kein Projekt-Memory, kein Chat-History. Verhindert ungewollten
Informationsfluss bei "unbeschriebenes Blatt"-Perspektiven.

### Budget-Check
Jede Perspectives-Abfrage löst `check_and_reserve_budget()` RPC aus.
Mehrere Avatare × Tokens können schnell budget-relevant werden.

---

## Konsequenzen

**Positiv:**
- Paralleles Streaming: 3 Avatare in ~10s statt ~30s sequenziell
- Klare Scope-Hierarchie: System-Avatare als Qualitäts-Baseline, Org/User für Anpassung
- "In Chat posten" ermöglicht Weiterverfolgung einer Perspektive im Haupt-Chat
- Tabula-Rasa-Guard verhindert Kontext-Leaks — wichtig für "frischer Blick"-Anwendungsfälle

**Negativ / Risiken:**
- `Promise.all()` bricht ab wenn ein Avatar-Call fehlschlägt — kein graceful partial failure
  (TODO: `Promise.allSettled()` mit individuellem Error-State pro Avatar)
- Token-Verbrauch: 3+ parallele Calls = 3× normale Token-Kosten — Budget-Check nötig
- Edge Function (Haupt-Chat) und Perspectives (`/api/perspectives/query`) haben separate
  System-Prompts — Inkonsistenz möglich wenn Charakter-Beschreibungen nicht sorgfältig gepflegt
- Bottom Sheet auf Mobile zeigt alle Avatare untereinander — bei 5+ Avataren wird Scroll lang
