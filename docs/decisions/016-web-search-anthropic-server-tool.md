# ADR-016: Web Search via Anthropic Server Tool

**Datum:** 2026-03-24 (Migration 067) — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Toro soll aktuelle Informationen aus dem Web abrufen können — Marktnews, aktuelle
Preise, Nachrichtenartikel, Wettbewerber-Updates. Nutzer erwarten, dass Toro
nicht nur auf Trainingsdaten zugreift sondern aktuelle Webinhalte einbeziehen kann.

**Optionen evaluiert:**

| Option | Kosten | Kontrolle | Aufwand |
|--------|--------|-----------|---------|
| Anthropic `web_search_20260209` Server Tool | Im API-Preis enthalten | Anthropic-managed | Minimal |
| Brave Search API | ~$5/1.000 Anfragen | Volle Kontrolle, eigenes UI | Mittel |
| Tavily API | ~$0.01/Anfrage | Gute AI-Integration | Gering |
| SerpAPI (Google) | ~$0.01/Anfrage | Maximale Abdeckung | Mittel |
| Bing Search API | Azure-Kosten | Microsoft-Ökosystem | Mittel |

---

## Entscheidung

**Anthropic's natives Server Tool `web_search_20260209`** als einzige Web-Search-Implementierung.

Aktivierung im Edge Function System-Prompt-Block:
```typescript
tools: [{ type: 'web_search_20260209', name: 'web_search' }]
```

Die Suche wird von Anthropic intern ausgeführt — kein eigener Search-API-Key,
kein Proxy, kein Rate-Limit-Management nötig.

**UI-Integration:**
- `isSearching`-State in `ChatArea.tsx` — zeigt Suchindikator während Web-Suche läuft
- `SourcesBar` Komponente (`src/components/workspace/SourcesBar.tsx`) — zeigt Quellen-Karten unter der Antwort
- Quellen-Daten: `SearchSource[]` mit `url`, `title`, `page_age` aus Anthropic-Response

**User-Einstellung:**
- `user_preferences.web_search_enabled` (Migration 067) — Default `false`
- User kann in Einstellungen Web-Suche aktivieren
- Org-Admin kann systemweit aktivieren/deaktivieren

---

## Konsequenzen

**Positiv:**
- Null zusätzliche Infrastruktur — kein eigener Search-Proxy, kein API-Key-Management
- Anthropic übernimmt Suche-Qualität, Quellen-Auswahl und Datenschutz
- Automatische Integration in Toro's Kontext-Management (Anthropic verwaltet Tool-Use-Loop)
- `SourcesBar` zeigt Quellen transparent im UI — Nachvollziehbarkeit für User

**Negativ / Risiken:**
- Keine Kontrolle über Suchergebnisse — Anthropic entscheidet welche Quellen verwendet werden
- Kein eigenes Ranking oder Filtering (z.B. nur deutsche Quellen)
- Beta-Feature (`web_search_20260209`) — API könnte sich ändern oder kostenpflichtig werden
- Nur im Haupt-Chat (Edge Function) verfügbar — nicht in Canvas/Card-Chat oder API-Chat
- Web-Suche erhöht Latenz und Token-Verbrauch — nicht für jede Anfrage geeignet (User-Opt-in sinnvoll)

**Revisit-Trigger:**
- Wenn Toro Quellen-Filtering (Domain-Whitelist, Sprache) braucht → eigene Search-API
- Wenn Anthropic Web Search kostenpflichtig wird → Tavily als günstigste Alternative
