# n8n Integration — Konzept
## Tropen OS × n8n

> **Status:** Konzept März 2026 — aktualisiert nach Windmill-Analyse
> **Entschieden:** Kein Embedding nötig — Toro generiert Workflows, User sieht keinen Editor
> **Phase 2:** n8n self-hosted Community Edition (~$5-10/Monat), Toro als einziger Workflow-Builder
> **Phase 3:** Erweiterte Flows, komplexere Integrationen
> **Phase 4:** Embedding oder Windmill wenn Enterprise-Zielgruppe es rechtfertigt

---

## 1. Warum n8n?

Tropen OS automatisiert Wissensarbeit mit Toro-Agenten.
Aber manche Automatisierungen sind zu komplex für native Agenten:
- Externe APIs mit komplexer Auth (Salesforce, SAP, Legacy-Systeme)
- Mehrstufige Transformationen mit Bedingungslogik
- Integrationen die bereits in n8n existieren (500+ Nodes)

**n8n ist der Automatisierungs-Layer für alles was Tropen OS nicht nativ kann.**
Toro denkt, n8n handelt.

---

## 2. Kernprinzip: Toro baut, User sieht nur Ergebnisse

Der entscheidende Insight: wenn Toro der einzige Workflow-Builder ist, braucht der User den Editor nie zu sehen.

```
User: "Wenn ein neues Feed-Item von Heise kommt,
       schick mir eine Zusammenfassung per Slack"

Toro: versteht → generiert n8n Workflow JSON →
      POST /api/v1/workflows an n8n →
      Workflow läuft →
      Tropen OS zeigt: "✅ Workflow aktiv · Letzter Run: vor 2h"
```

Kein Editor. Kein Embedding. Keine Lizenzfrage.
n8n ist reine Execution Engine im Hintergrund — unsichtbar für den User.

---

## 3. Instanz-Modell

### Phase 2 — Einfach und günstig

```
Eine n8n Community Edition Instanz (self-hosted, Tropen-managed)
  → Läuft auf Hetzner VPS Frankfurt (~$5-10/Monat)
  → Frankfurt = EU, DSGVO-konform, konsistent mit Supabase EU
  → Jede Org bekommt einen eigenen n8n Workspace (Trennung per Scope)
  → Tropen OS spricht direkt mit n8n REST API
  → Toro generiert alle Workflows — kein manueller Editor
  → User sieht nur: Status, Pause, Löschen — alles in Tropen OS UI
```

`organization_settings.n8n_workspace_id` → UUID des n8n Workspace

### Phase 4 — Embedding wenn gerechtfertigt

Erst wenn:
- Enterprise-Kunden explizit nach eigenem Workflow-Editor fragen
- Tropen OS Developer-Teams als Hauptzielgruppe gewinnt
- n8n Embed ($50k/Jahr) oder Windmill-Lizenz wirtschaftlich tragbar ist

Bis dahin: **Toro ist der Editor.** Das ist für KMU-User sogar besser.

### Windmill als Alternative

Windmill hat günstigere Embedding-Lizenzen und ist explizit für SaaS-Wrapping designed.
- Vorteil für Phase 4 wenn Editor doch gebraucht wird
- Nachteil: weniger Integrationen, kleinere Community, zu technisch für KMU-User ohne Toro

Entscheidung Phase 4: Abwägen wenn der Zeitpunkt kommt — nicht jetzt.

---

## 4. Navigation & UI

n8n lebt unter Agenten — weil Workflows autonome Ausführung sind.

```
/agenten
├── [Tab] Toro-Agenten     → native Agenten
└── [Tab] Workflows        → Toro-generierte n8n Workflows
                             (kein Editor — nur Status + Verwaltung)
```

### Workflows-Tab (Phase 2)

Kein Editor. Nur Übersicht und Verwaltung:

```
┌────────────────────────────────────────────────────┐
│ Workflows                          [+ Toro fragen] │
├────────────────────────────────────────────────────┤
│ ✅ Heise → Slack Zusammenfassung                   │
│    Letzter Run: vor 2h · Nächster: in 22h          │
│    [Pausieren] [Details] [Löschen]                 │
├────────────────────────────────────────────────────┤
│ ⚠️ CRM → Weekly Report                             │
│    Letzter Run: Fehler · vor 3h                    │
│    [Details] [Neu starten] [Löschen]               │
└────────────────────────────────────────────────────┘
```

- "**+ Toro fragen**" → öffnet Chat: "Was soll der Workflow tun?"
- Details → zeigt Run-History, Logs, Output (aus n8n API gelesen)
- Fehler → Toro erklärt was schiefgelaufen ist und schlägt Fix vor

### Was der User nie sieht
- n8n Editor / Flow Builder
- n8n Login / n8n Dashboard
- Workflow JSON
- n8n Workspace-Verwaltung

Alles läuft in Tropen OS — n8n ist Infrastruktur, kein UI.

---

## 5. Toro + n8n — Wege nach Phase

### Phase 2 — Toro generiert (MVP)

```
User im Chat oder Agenten-Tab:
"Wenn ein neues Feed-Item von Heise kommt,
 fass es zusammen und schick es per Slack"

Toro:
1. Versteht Absicht
2. Fragt nach fehlenden Infos (welcher Slack-Channel?)
3. Generiert valides n8n Workflow JSON
4. POST /api/v1/workflows an self-hosted n8n
5. POST /api/v1/workflows/{id}/activate
6. Zeigt Bestätigung in Tropen OS: "✅ Workflow aktiv"
```

**Technisch:**
- Toro bekommt n8n Workflow JSON Schema + Beispiele im System-Prompt
- Generiert nur einfache Flows: 1 Trigger, max 3 Actions
- Validierung via JSON Schema vor Deployment
- Fehler → Toro erklärt auf Deutsch was schiefging

**Org-Credentials (Phase 2):**
Toro nutzt org-weite Credentials (Slack-Token, API-Keys) —
kein per-User Credential-Management in Phase 2.
Credentials werden von Org-Admin in Settings hinterlegt.

### Phase 3 — Workspace-Karte → Workflow

```
Karte im Workspace hat Output
  → Button: "Als automatisierten Workflow weiterführen"
  → Toro analysiert Karten-Output + Ziel
  → Generiert passenden Workflow
  → Workflow-Status erscheint auf der Karte
```

`cards.n8n_workflow_id` → neue Spalte, zeigt verknüpften Workflow

### Phase 3 — Community-Templates

```
Community → Workflow-Templates (als Tropen OS Prompt gespeichert)
  → User wählt Template: "Wöchentlicher Newsletter aus RSS-Feed"
  → Toro konfiguriert Template mit org-spezifischen Werten
  → Deployment via n8n API
```

### Phase 4 — Manueller Editor (falls gewünscht)

Nur wenn Enterprise-Kunden explizit nach Editor fragen.
Dann: Windmill oder n8n Embed evaluieren.
Bis dahin: Toro ist der Editor.

---

## 6. Verbindung zu Live

n8n-Workflows die Daten in Tropen OS schreiben:

```
n8n Workflow
  → schreibt Feed-Items → erscheint in Feeds
  → updated Karten-Inhalt → Karte zeigt neuen Stand
  → erstellt Artefakt → erscheint in Artefakte
  → deployed Dashboard → erscheint in Live
```

Der Workflow selbst bleibt unter Agenten.
Sein Output erscheint dort wo er hingehört (Feeds, Karten, Live).

---

## 7. Technische Voraussetzungen

| Komponente | Was nötig ist | Wann | Kosten |
|------------|--------------|------|--------|
| n8n Community Edition | Self-hosted auf Hetzner VPS (Frankfurt) | Phase 2 | ~$5-10/Monat |
| n8n REST API | Toro spricht direkt mit n8n API | Phase 2 | $0 |
| `src/lib/n8n/client.ts` | Wrapper für n8n REST API | Phase 2 | $0 |
| organization_settings | `n8n_workspace_id` Spalte | Phase 2 Migration | $0 |
| Workflow JSON Schema | Als Toro System-Prompt Teil | Phase 2 | $0 |
| n8n Embed Lizenz | Nur wenn Editor nötig wird | Phase 4 | $50k/Jahr |

### `src/lib/n8n/client.ts` (Phase 2)

```typescript
// Einfacher Wrapper für n8n REST API
// Eine self-hosted Instanz, Trennung per Workspace-ID

const N8N_BASE_URL = process.env.N8N_BASE_URL  // intern, nie im Client
const N8N_API_KEY  = process.env.N8N_API_KEY

export class N8nClient {
  constructor(private orgWorkspaceId: string) {}

  async getWorkflows(): Promise<N8nWorkflow[]>
  async createAndActivate(json: N8nWorkflowJson): Promise<{ id: string }>
  async getWorkflowStatus(id: string): Promise<N8nWorkflowStatus>
  async getRecentRuns(workflowId: string, limit = 10): Promise<N8nRun[]>
  async pauseWorkflow(id: string): Promise<void>
  async activateWorkflow(id: string): Promise<void>
  async deleteWorkflow(id: string): Promise<void>
}
```

### Toro System-Prompt Ergänzung (Phase 2)

Toro bekommt als Teil seines System-Prompts:
- n8n Workflow JSON Schema (vereinfacht)
- 5-10 Beispiel-Workflows als Few-Shot Examples
- Liste der verfügbaren Org-Credentials (ohne Werte — nur Namen)
- Regel: "Generiere nur einfache Flows: 1 Trigger, max 3 Actions"

### organization_settings Erweiterung

```sql
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS n8n_workspace_id TEXT,
  ADD COLUMN IF NOT EXISTS n8n_credentials JSONB DEFAULT '{}';
  -- credentials: { slack: { configured: true }, gmail: { configured: false } }
  -- Nie echte Keys in n8n_credentials speichern — nur Konfigurationsstatus
  -- Echte Keys leben in n8n selbst (n8n Credentials Store)
```

---

## 8. Ergänzungen (Stand 2026-03-25)

### Ergänzung 1 — Agenten-Widgets

Agenten befüllen direkt Cockpit-Widgets — nicht nur Feeds/Karten/Live:

| Agent | Widget | Typ |
|-------|--------|-----|
| E-Mail-Agent (Haiku, tägl. 07:00) | W-10 `email_priority` | Stufe 3 |
| Kalender-Agent (Haiku, tägl. + 30min vor Meeting) | W-12 `meeting_prep` | Stufe 3 |
| Meeting-Scribe (Whisper + Sonnet, on-demand) | W-13 `meeting_notes` | Stufe 3 |

Mechanismus: `n8n Workflow → POST /api/agents/webhook/[type] → agent_runs speichern → Widget liest aus agent_runs`

### Ergänzung 2 — MCP vs. n8n (kein Widerspruch)

MCP und n8n sind keine Konkurrenten — sie ergänzen sich auf verschiedenen Ebenen:

| | MCP | n8n |
|---|-----|-----|
| **Wer verbindet** | User direkt (OAuth in Settings) | Agent im Hintergrund (Cron) |
| **Wann** | Live / on-demand | Geplant / automatisch |
| **Daten** | Einfache Anzeige | Verarbeitung + Transformation |
| **Beispiel Kalender** | "Zeig mir heutige Termine" (live) | "Bereite jedes Meeting vor" (Agent) |

Kalender-Widget nutzt beide Wege:
- MCP → Stufe 2 Widget: live-Anzeige heutiger Termine
- n8n → Stufe 3 Widget: Agent bereitet Meeting-Kontext vor

### Ergänzung 3 — Pakete konfigurieren n8n-Credentials automatisch

Das Konzept sprach von "Org-Credentials". Diese werden jetzt über MCP-Verbindungen + Paket-Aktivierung gesteuert:

- **Kommunikations-Paket** aktiviert → Gmail + Google Calendar Credentials auto-konfiguriert in n8n
- **Vertrieb-Paket** aktiviert → HubSpot + Slack Credentials
- `organization_settings.n8n_credentials` speichert nur Konfigurationsstatus (`{ gmail: { configured: true } }`) — nie echte Keys

n8n erhält dieselben Tokens wie MCP — kein doppeltes Credential-Management.

---

## 9. Offene Fragen

### Vor Phase 2 klären

| Frage | Priorität |
|-------|-----------|
| Hosting-Provider | ✅ Entschieden: Hetzner VPS Frankfurt (EU, DSGVO-konform, ~$5-10/Monat) |
| Welche Org-Credentials in Phase 2? | ✅ Entschieden: Gmail + Google Calendar (via MCP OAuth) + Slack (via MCP OAuth) |
| Wie komplex dürfen Toro-generierte Workflows sein? | 🟡 Mittel |
| Wie wird n8n Workspace bei Org-Löschung bereinigt? | 🟡 Mittel |

### Vor Phase 4 klären (nicht jetzt)


| Frage | Priorität |
|-------|-----------|
| n8n Embed ($50k/Jahr) vs. Windmill — wenn Editor gewünscht wird | 🟢 Niedrig |
| SSO wenn Editor embedded wird | 🟢 Niedrig |
| Dedicated Instanz pro Enterprise-Org — wann lohnt es sich? | 🟢 Niedrig |

---

## 9. Was NICHT gebaut wird

### Phase 2
- Kein manueller Workflow-Editor — Toro ist der einzige Builder
- Keine per-User Credentials — nur org-weite Credentials
- Keine komplexen Multi-Branch Workflows
- Kein n8n Dashboard für User

### Generell
- Kein eigener Workflow-Builder in Tropen OS — n8n führt aus
- Kein Ersatz für Toro-Agenten — n8n ergänzt, ersetzt nicht
- Windmill / n8n Embed nur wenn Enterprise-Kunden Editor explizit fordern
