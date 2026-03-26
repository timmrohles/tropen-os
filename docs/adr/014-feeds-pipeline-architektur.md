# ADR-014: Feeds-Pipeline-Architektur — Sources, Items, Runs, Distributions

**Datum:** 2026-03-18 (Migrations 033, 036, 046) — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Tropen OS soll Nutzer automatisch über relevante externe Informationen informieren:
Branchennews, Wettbewerber-Updates, Marktberichte. Die Informationen kommen aus
verschiedenen Quellen (RSS, Web-Scraping, Newsletter) und sollen gefiltert,
angereichert und an verschiedene Orte im System weitergeleitet werden.

**Frage:** Wie bauen wir ein skalierbares, transparentes Feed-Processing-System das
Fehler toleriert, Kosten kontrolliert und flexibel in andere System-Teile integrierbar ist?

---

## Entscheidung

**3-stufige Pipeline** mit klarer Trennung von Ingestion, Analyse und Distribution.

### Daten-Modell

```
feed_sources (Konfiguration)
    ↓ Sync (alle 6h via Cron)
feed_items (rohe + angereicherte Artikel)
    ↓ Processing (3 Stufen)
feed_runs (APPEND ONLY — Ausführungsprotokoll)
    ↓ Distribution (wenn Score hoch genug)
feed_distributions (Ziel-Konfiguration)
    ↓ Ziele
project_memory / workspace_items / feed_notifications
```

### 3 Processing-Stufen

| Stufe | Was | Modell | Kosten |
|-------|-----|--------|--------|
| Stage 1 | Regelbasiert: Keywords, Duplikate, Datum-Filter | Kein LLM-Call | Null |
| Stage 2 | Zusammenfassung, Score (1–10), Tags | Claude Haiku | Sehr gering |
| Stage 3 | Deep Analysis, Handlungsempfehlungen | Claude Sonnet | Höher |

Stage 3 wird nur für Items mit Score ≥ 7 ausgeführt (konfigurierbar per Feed).

### Distribution-Typen

| target_type | Beschreibung |
|-------------|--------------|
| `notification` | Benachrichtigung an alle Org-Member (target_id = Dummy-UUID) |
| `project` | Item landet in `project_memory` (memory_type='feed_item') |
| `workspace` | Item landet in `knowledge_entries` (entry_type='feed') |

`min_score` (1–10) pro Distribution: Items unter dem Schwellwert werden nicht weitergeleitet.

### Append-Only-Prinzip (ADR-003)
`feed_runs` und `feed_processing_log` sind APPEND ONLY — niemals UPDATE oder DELETE.
Dies ermöglicht vollständige Audit-Trail und Kosten-Nachvollziehbarkeit.

### Feed-Status-Management
`feed_sources.status`: `active` | `paused` | `error`
- Pause durch Admin: `paused_at`, `paused_by`, `pause_reason` dokumentiert
- Automatische Pause bei 3 aufeinanderfolgenden Fehler-Runs
- Reaktivierung nur manuell durch Admin

---

## Konsequenzen

**Positiv:**
- 3-Stufen-Trennung: Stage 1 ohne LLM-Kosten für bulk-Filterung
- `feed_runs` (APPEND ONLY) gibt vollständige Sichtbarkeit über Erfolg/Fehler/Kosten
- Distribution-Flexibilität: ein Feed kann gleichzeitig in mehrere Projekte und
  Workspaces fließen
- `min_score`-Filter verhindert Rauschen in Distribution-Zielen

**Negativ / Risiken:**
- Cron-Runs auf Vercel haben kein Retry bei Timeout — bei großen Feeds kann ein Run
  Timeout und der nächste Run startet neu (Items können doppelt verarbeitet werden)
  → `content_hash UNIQUE` in `feed_items` als Deduplication-Guard
- Stage 3 (Sonnet) kann teuer werden bei vielen hochscorigen Items —
  kein globales Token-Budget-Limit pro Feed-Run implementiert (Tech Debt)
- `feed_distributions` mit `target_type='workspace'` benötigt `knowledge_entries`-Tabelle
  die noch nicht existiert (aktuell nur `project_memory` vollständig implementiert)
- RSS-Parsing läuft ohne Timeout-Guard — langsame Feeds können den gesamten Sync-Job blockieren

**Revisit-Trigger:**
- Wenn > 100 Feed-Sources pro Org → Parallel-Processing pro Source nötig (aktuell sequenziell)
- Wenn Cron-Budget steigt → Dedicated Queue (Windmill, ADR-006) für Feed-Processing
