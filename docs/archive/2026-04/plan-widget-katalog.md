# Tropen OS — Cockpit Widget-Katalog
> Stand: 2026-03-25

---

## Übersicht

| Widget | ID | Typ | Stufe | Status | Admin-Only |
|--------|----|-----|-------|--------|-----------|
| Feed-Neuigkeiten | W-01 | `feed_highlights` | 1 | ✅ gebaut | nein |
| Toro-Empfehlung | W-02 | `toro_recommendation` | 1 | ✅ gebaut | nein |
| Zuletzt aktiv | W-03 | `recent_activity` | 1 | ✅ gebaut | nein |
| Projekte | W-04 | `project_status` | 1 | ✅ gebaut | nein |
| Artefakte | W-05 | `artifact_overview` | 1 | ✅ gebaut | nein |
| Team-Aktivität | W-06 | `team_activity` | 1 | ✅ gebaut | ja |
| Kosten & Budget | W-07 | `budget_usage` | 1 | ✅ gebaut | ja |
| Schnellzugriff | W-08 | `quick_actions` | 1 | ✅ gebaut | nein |
| E-Mail Übersicht | W-09 | `email_summary` | 2 | geplant Q3 2026 | nein |
| E-Mail Prioritäten | W-10 | `email_priority` | 3 | geplant Q4 2026 | nein |
| Kalender Heute | W-11 | `calendar_today` | 2 | geplant Q3 2026 | nein |
| Meeting-Vorbereitung | W-12 | `meeting_prep` | 3 | geplant Q4 2026 | nein |
| Meeting-Notizen | W-13 | `meeting_notes` | 3 | geplant Q4 2026 | nein |
| Slack Updates | W-14 | `slack_updates` | 2 | geplant Q3 2026 | nein |
| HubSpot Pipeline | W-15 | `hubspot_pipeline` | 2 | geplant Q3 2026 | nein |
| Analytics | W-16 | `analytics_overview` | 2 | geplant Q3 2026 | ja |
| Drive Dokumente | W-17 | `drive_recent` | 2 | geplant Q3 2026 | nein |
| Custom Widget 1 | W-18 | `custom_1` | 3 | geplant Q4 2026 | nein |
| Custom Widget 2 | W-19 | `custom_2` | 3 | geplant Q4 2026 | nein |

---

## Stufen-System

### Stufe 1 — Tropen-intern (✅ gebaut)

Alle Daten kommen aus der Tropen OS Datenbank — kein MCP, kein Agent.

| Widget | Datenquelle | API-Route |
|--------|-------------|-----------|
| W-01 Feed-Neuigkeiten | `feed_items` (Score DESC, letzte 24h) | `/api/cockpit/feed-highlights` |
| W-02 Toro-Empfehlung | Regelbasiert: Budget → Feeds → Inaktivität | `/api/cockpit/recommendation` |
| W-03 Zuletzt aktiv | `conversations` + `artifacts` (max 6) | `/api/cockpit/recent-activity` |
| W-04 Projekte | `projects` mit Chat-Count (max 4) | `/api/cockpit/projects` |
| W-05 Artefakte | COUNT gesamt + diese Woche + letzte 3 | `/api/cockpit/artifact-stats` |
| W-06 Team-Aktivität | Org-weite Chats + Artefakte (letzte 2 Tage) | `/api/cockpit/team-activity` |
| W-07 Kosten & Budget | `usage_logs` SUM vs. `budget_limit` | `/api/cockpit/budget` |
| W-08 Schnellzugriff | Statisch (6 Links, kein API-Call) | — |

### Stufe 2 — MCP-Verbindungen (Q3 2026)

Erfordert OAuth-Verbindung des Users (Google / Slack / HubSpot).
Widget zeigt CTA "Verbinden" wenn MCP-Verbindung fehlt.
Daten werden live abgerufen — keine Hintergrund-Verarbeitung.

| Widget | MCP-Provider | Scopes | Daten |
|--------|-------------|--------|-------|
| W-09 E-Mail Übersicht | Google (Gmail) | `gmail.readonly` | Ungelesen Count + Absender-Liste |
| W-11 Kalender Heute | Google (Calendar) | `calendar.readonly` | Heutige Termine (Metadaten) |
| W-14 Slack Updates | Slack | `channels:read` | Ungelesene Mentions + DMs Count |
| W-15 HubSpot Pipeline | HubSpot | CRM Read | Deal-Stages + offene Aufgaben |
| W-16 Analytics | Google Analytics | `analytics.readonly` | Sessions + Conversions heute |
| W-17 Drive Dokumente | Google (Drive) | `drive.readonly` | Zuletzt geänderte Dokumente |

DSGVO: Keine rohen Inhalte in DB — nur Metadaten + verarbeitete Ergebnisse im `mcp_widget_cache`.

### Stufe 3 — Agenten-Widgets (Q4 2026)

Agenten laufen im Hintergrund (Cron oder on-demand via n8n).
Ergebnis wird in `agent_runs` / `mcp_widget_cache` gespeichert.
Widget liest gecachtes Ergebnis — kein Live-API-Call.

| Widget | Agent | Trigger | Verarbeitung |
|--------|-------|---------|-------------|
| W-10 E-Mail Prioritäten | E-Mail-Agent | Tägl. 07:00 | Haiku: priorisiert Ungelesene, extrahiert Action-Items |
| W-12 Meeting-Vorbereitung | Kalender-Agent | Tägl. + 30min vor Meeting | Haiku: Kontext aus Projekten + Drive + Teilnehmer |
| W-13 Meeting-Notizen | Meeting-Scribe | On-demand | Whisper (Transkript) + Sonnet (Zusammenfassung + Actions) |
| W-18/W-19 Custom | Benutzerdefiniert | Konfigurierbar | User-definierter Agent-Typ |

Mechanismus: `n8n Workflow → POST /api/agents/webhook/[type] → agent_runs → Widget liest gecachtes Ergebnis`

---

## MCP vs. n8n — zwei Ebenen, kein Widerspruch

```
MCP (Stufe 2)          n8n + Agent (Stufe 3)
─────────────          ─────────────────────
User verbindet OAuth   Agent läuft im Hintergrund
Live / on-demand       Geplant (Cron) / on-demand
Einfache Anzeige       Verarbeitung + Transformation
"Zeig heute Termine"   "Bereite jedes Meeting vor"
```

Beispiel Kalender:
- **W-11** (Stufe 2, MCP): Live-Anzeige heutiger Termine via Google Calendar API
- **W-12** (Stufe 3, Agent): Kalender-Agent bereitet Meeting-Kontext auf (Haiku + n8n)

---

## Pakete

| Paket | Aktiviert | Widgets freigeschaltet |
|-------|-----------|----------------------|
| Kommunikation | Gmail + Calendar OAuth | W-09, W-10, W-11, W-12, W-13 |
| Vertrieb | HubSpot OAuth + Slack | W-14, W-15 |
| Marketing | Google Analytics | W-16 |
| Custom | — | W-18, W-19 |

Bei Paket-Aktivierung werden die entsprechenden MCP-Verbindungen in `organization_settings.n8n_credentials` auto-konfiguriert.

---

## Implementierungs-Reihenfolge

```
Stufe 1  ✅ 2026-03-25  W-01 bis W-08 — alle gebaut
Stufe 2  Q3 2026        Voraussetzung: mcp-02-build (OAuth + mcp_connections)
Stufe 3  Q4 2026        Voraussetzung: Stufe 2 + n8n VPS + Agent-Engine Erweiterung
```

---

## widgetCatalog.ts — Erweiterung für Stufe 2+

Bei Stufe 2+ müssen folgende Felder in `WidgetMeta` ergänzt werden:

```typescript
export interface WidgetMeta {
  type: string
  label: string
  size: WidgetSize
  adminOnly: boolean
  tier?: 1 | 2 | 3                    // Stufe (fehlt noch)
  requiresMcp?: 'google' | 'slack' | 'hubspot'  // MCP-Provider
  package?: 'kommunikation' | 'vertrieb' | 'marketing' | 'custom'
}
```
