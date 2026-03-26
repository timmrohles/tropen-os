# Windmill Integration — Konzept
## Tropen OS × Windmill

> **Status:** Konzept Maerz 2026 — ersetzt n8n-Konzept (siehe ADR-006)
> **Entschieden:** Windmill CE self-hosted, Toro generiert TypeScript Scripts, User sieht keinen Editor
> **Phase 2:** Windmill Community Edition auf Hetzner VPS (~$5-10/Monat)
> **Phase 3:** Erweiterte Flows, Workspace-Karten-Integration
> **Phase 4:** Embedding wenn Enterprise-Zielgruppe es rechtfertigt

---

## 1. Warum Windmill?

Tropen OS automatisiert Wissensarbeit mit Toro-Agenten.
Manche Automatisierungen sind zu komplex fuer native Agenten:
- Externe APIs mit komplexer Auth (Salesforce, SAP, Legacy-Systeme)
- Mehrstufige Transformationen mit Bedingungslogik
- Geplante Jobs die unabhaengig vom Chat laufen

**Windmill ist die Execution Engine fuer alles was Tropen OS nicht nativ kann.**
Toro denkt, Windmill fuehrt aus.

### Warum Windmill statt n8n?

Toro ist der einzige Workflow-Builder. Die entscheidende Frage ist:
Was kann ein LLM zuverlaessiger generieren?

| | n8n | Windmill |
|---|-----|---------|
| **Was Toro generiert** | Proprietaeres JSON (Nodes + Connections Graph) | Standard TypeScript/Python |
| **Fehlerrate** | Hoch — Node-Typen, Parameter, Connection-Format muessen exakt stimmen | Niedrig — jedes LLM kann TypeScript |
| **Debugging** | "Node X hat einen Fehler" | Stack Traces, Logs, Unit Tests |
| **Integrationen** | 500+ Nodes | Unbegrenzt via `fetch()` + jede npm/pip Library |
| **Phase 4 Embedding** | $50k/Jahr | Guenstiger, explizit fuer SaaS designed |

Vollstaendige Entscheidung: `docs/adr/006-windmill-statt-n8n.md`

---

## 2. Kernprinzip: Toro baut, User sieht nur Ergebnisse

Wenn Toro der einzige Workflow-Builder ist, braucht der User den Editor nie zu sehen.

```
User: "Wenn ein neues Feed-Item von Heise kommt,
       schick mir eine Zusammenfassung per Slack"

Toro: versteht → generiert TypeScript Script →
      POST /api/w/org-workspace/jobs/run/f/... an Windmill →
      Script laeuft →
      Tropen OS zeigt: "Workflow aktiv · Letzter Run: vor 2h"
```

Kein Editor. Kein Embedding. Keine Lizenzfrage.
Windmill ist reine Execution Engine im Hintergrund — unsichtbar fuer den User.

---

## 3. Instanz-Modell

### Phase 2 — Einfach und guenstig

```
Eine Windmill Community Edition Instanz (self-hosted, Tropen-managed)
  → Laeuft auf Hetzner VPS Frankfurt (~$5-10/Monat)
  → Frankfurt = EU, DSGVO-konform, konsistent mit Supabase EU
  → Jede Org bekommt einen eigenen Windmill Workspace (Trennung per Scope)
  → Tropen OS spricht direkt mit Windmill REST API
  → Toro generiert TypeScript Scripts — kein manueller Editor
  → User sieht nur: Status, Pause, Loeschen — alles in Tropen OS UI
```

`organization_settings.windmill_workspace_id` → Workspace-Name in Windmill

### Phase 4 — Embedding wenn gerechtfertigt

Erst wenn:
- Enterprise-Kunden explizit nach eigenem Workflow-Editor fragen
- Windmill Embedding-Lizenz wirtschaftlich tragbar ist

Bis dahin: **Toro ist der Editor.** Das ist fuer KMU-User sogar besser.

---

## 4. Navigation & UI

Workflows leben unter Agenten — weil Workflows autonome Ausfuehrung sind.

```
/agenten
├── [Tab] Toro-Agenten     → native Agenten
└── [Tab] Workflows        → Toro-generierte Windmill Scripts
                             (kein Editor — nur Status + Verwaltung)
```

### Workflows-Tab (Phase 2)

Kein Editor. Nur Uebersicht und Verwaltung:

```
┌────────────────────────────────────────────────────┐
│ Workflows                          [+ Toro fragen] │
├────────────────────────────────────────────────────┤
│ ✅ Heise → Slack Zusammenfassung                   │
│    Letzter Run: vor 2h · Naechster: in 22h          │
│    [Pausieren] [Details] [Loeschen]                 │
├────────────────────────────────────────────────────┤
│ ⚠️ CRM → Weekly Report                             │
│    Letzter Run: Fehler · vor 3h                    │
│    [Details] [Neu starten] [Loeschen]               │
└────────────────────────────────────────────────────┘
```

- "**+ Toro fragen**" → oeffnet Chat: "Was soll der Workflow tun?"
- Details → zeigt Run-History, Logs, Output (aus Windmill API)
- Fehler → Toro erklaert was schiefgelaufen ist (liest Stack Trace aus Windmill)

### Was der User nie sieht
- Windmill Editor / Flow Builder
- Windmill Login / Dashboard
- TypeScript Source Code
- Windmill Workspace-Verwaltung

Alles laeuft in Tropen OS — Windmill ist Infrastruktur, kein UI.

---

## 5. Toro + Windmill — Wege nach Phase

### Phase 2 — Toro generiert TypeScript (MVP)

```
User im Chat oder Agenten-Tab:
"Wenn ein neues Feed-Item von Heise kommt,
 fass es zusammen und schick es per Slack"

Toro:
1. Versteht Absicht
2. Fragt nach fehlenden Infos (welcher Slack-Channel?)
3. Generiert TypeScript Script
4. POST Script an Windmill API → erstellt Script + Schedule
5. Zeigt Bestaetigung in Tropen OS: "Workflow aktiv"
```

**Technisch:**
- Toro generiert Standard TypeScript mit `fetch()` Calls
- Kein proprietaeres Schema noetig — nur TypeScript Best Practices
- Scripts werden vor Deployment via `tsc` validiert (Windmill macht das automatisch)
- Fehler → Toro liest Stack Trace und erklaert auf Deutsch

**Beispiel — Was Toro generiert:**

```typescript
// Heise RSS → Slack Zusammenfassung
import * as wmill from "windmill-client"

export async function main() {
  // 1. RSS Feed lesen
  const res = await fetch("https://www.heise.de/rss/heise-atom.xml")
  const xml = await res.text()
  const items = parseRssItems(xml).slice(0, 5)

  // 2. Zusammenfassung via Tropen OS API
  const summary = await fetch("https://app.tropen.os/api/agents/webhook/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": await wmill.getVariable("tropen_webhook_secret")
    },
    body: JSON.stringify({ items: items.map(i => i.title) })
  })
  const { text } = await summary.json()

  // 3. An Slack senden
  const slackToken = await wmill.getVariable("slack_bot_token")
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${slackToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channel: "#news",
      text: `📰 Heise Update\n\n${text}`
    })
  })

  return { status: "sent", items_count: items.length }
}

function parseRssItems(xml: string) {
  // Einfacher RSS Parser
  const entries: { title: string; link: string }[] = []
  const regex = /<entry>[\s\S]*?<title[^>]*>(.*?)<\/title>[\s\S]*?<link[^>]*href="(.*?)"[\s\S]*?<\/entry>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    entries.push({ title: match[1], link: match[2] })
  }
  return entries
}
```

→ Standard TypeScript. Kein proprietaeres Format. Jedes LLM kann das generieren.

**Org-Credentials (Phase 2):**
Credentials werden als Windmill Variables gespeichert (verschluesselt).
MCP-Tokens werden bei Paket-Aktivierung automatisch in Windmill provisioniert.
Kein per-User Credential-Management in Phase 2.

### Phase 3 — Workspace-Karte → Workflow

```
Karte im Workspace hat Output
  → Button: "Als automatisierten Workflow weiterfuehren"
  → Toro analysiert Karten-Output + Ziel
  → Generiert passenden TypeScript Script
  → Workflow-Status erscheint auf der Karte
```

`cards.windmill_script_path` → Pfad zum Windmill Script

### Phase 3 — Community-Templates

```
Community → Workflow-Templates (als TypeScript-Vorlagen gespeichert)
  → User waehlt Template: "Woechentlicher Newsletter aus RSS-Feed"
  → Toro konfiguriert Template mit org-spezifischen Werten
  → Deployment via Windmill API
```

Templates sind einfach TypeScript-Dateien mit Platzhaltern — kein proprietaeres Format.

### Phase 4 — Manueller Editor (falls gewuenscht)

Nur wenn Enterprise-Kunden explizit nach Editor fragen.
Windmill hat guenstigere Embedding-Lizenzen als n8n ($50k/Jahr).
Bis dahin: Toro ist der Editor.

---

## 6. Verbindung zu Live

Windmill-Scripts die Daten in Tropen OS schreiben:

```
Windmill Script
  → schreibt Feed-Items → erscheint in Feeds
  → updated Karten-Inhalt → Karte zeigt neuen Stand
  → erstellt Artefakt → erscheint in Artefakte
  → deployed Dashboard → erscheint in Live
```

Der Workflow selbst bleibt unter Agenten.
Sein Output erscheint dort wo er hingehoert (Feeds, Karten, Live).

---

## 7. Technische Voraussetzungen

| Komponente | Was noetig ist | Wann | Kosten |
|------------|--------------|------|--------|
| Windmill CE | Self-hosted auf Hetzner VPS (Frankfurt) | Phase 2 | ~$5-10/Monat |
| Windmill REST API | Toro spricht direkt mit Windmill API | Phase 2 | $0 |
| `src/lib/windmill/client.ts` | Wrapper fuer Windmill REST API | Phase 2 | $0 |
| organization_settings | `windmill_workspace_id` Spalte | Phase 2 Migration | $0 |
| Windmill Embed Lizenz | Nur wenn Editor noetig wird | Phase 4 | Guenstiger als n8n |

### `src/lib/windmill/client.ts` (Phase 2)

```typescript
// Wrapper fuer Windmill REST API
// Eine self-hosted Instanz, Trennung per Workspace

const WINDMILL_BASE_URL = process.env.WINDMILL_BASE_URL  // intern, nie im Client
const WINDMILL_TOKEN    = process.env.WINDMILL_TOKEN

export class WindmillClient {
  constructor(private workspace: string) {}

  // Scripts
  async createScript(path: string, content: string, language?: string): Promise<void>
  async runScript(path: string, args?: Record<string, unknown>): Promise<{ jobId: string }>
  async getScriptByPath(path: string): Promise<WindmillScript>
  async listScripts(): Promise<WindmillScript[]>
  async archiveScript(path: string): Promise<void>

  // Schedules
  async createSchedule(path: string, cron: string, scriptPath: string, args?: Record<string, unknown>): Promise<void>
  async toggleSchedule(path: string, enabled: boolean): Promise<void>
  async listSchedules(): Promise<WindmillSchedule[]>

  // Jobs / Runs
  async getJob(jobId: string): Promise<WindmillJob>
  async listCompletedJobs(scriptPath: string, limit?: number): Promise<WindmillJob[]>
  async cancelJob(jobId: string): Promise<void>

  // Variables (Credentials)
  async setVariable(name: string, value: string, isSecret?: boolean): Promise<void>
  async getVariable(name: string): Promise<string>
}

// Types
interface WindmillScript {
  path: string
  content: string
  language: 'deno' | 'python3' | 'bash'
  created_at: string
  archived: boolean
}

interface WindmillSchedule {
  path: string
  schedule: string  // cron
  script_path: string
  enabled: boolean
  next_run_at: string
}

interface WindmillJob {
  id: string
  script_path: string
  success: boolean
  result: unknown
  started_at: string
  duration_ms: number
  logs: string  // Stack Trace bei Fehler
}
```

### Toro System-Prompt Ergaenzung (Phase 2)

Toro bekommt als Teil seines System-Prompts:
- Windmill Script-Konventionen (async main(), wmill.getVariable() fuer Secrets)
- 5-10 Beispiel-Scripts als Few-Shot Examples
- Liste der verfuegbaren Org-Variables (ohne Werte — nur Namen)
- Regel: "Generiere Standard TypeScript mit fetch(). Nutze wmill.getVariable() fuer Credentials."
- Keine proprietaeren Schemas — nur TypeScript Best Practices

### organization_settings Erweiterung

```sql
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS windmill_workspace_id TEXT,
  ADD COLUMN IF NOT EXISTS windmill_credentials JSONB DEFAULT '{}';
  -- credentials: { slack: { configured: true }, gmail: { configured: false } }
  -- Nie echte Keys hier speichern — nur Konfigurationsstatus
  -- Echte Keys leben in Windmill Variables (verschluesselt)
```

---

## 8. Ergaenzungen (Stand 2026-03-26)

### Ergaenzung 1 — Agenten-Widgets

Agenten befuellen direkt Cockpit-Widgets — nicht nur Feeds/Karten/Live:

| Agent | Widget | Typ |
|-------|--------|-----|
| E-Mail-Agent (Haiku, taegl. 07:00) | W-10 `email_priority` | Stufe 3 |
| Kalender-Agent (Haiku, taegl. + 30min vor Meeting) | W-12 `meeting_prep` | Stufe 3 |
| Meeting-Scribe (Whisper + Sonnet, on-demand) | W-13 `meeting_notes` | Stufe 3 |

Mechanismus: `Windmill Script → POST /api/agents/webhook/[type] → agent_runs speichern → Widget liest aus agent_runs`

### Ergaenzung 2 — MCP vs. Windmill (kein Widerspruch)

MCP und Windmill sind keine Konkurrenten — sie ergaenzen sich auf verschiedenen Ebenen:

| | MCP | Windmill |
|---|-----|---------|
| **Wer verbindet** | User direkt (OAuth in Settings) | Agent im Hintergrund (Cron) |
| **Wann** | Live / on-demand | Geplant / automatisch |
| **Daten** | Einfache Anzeige | Verarbeitung + Transformation |
| **Beispiel Kalender** | "Zeig mir heutige Termine" (live) | "Bereite jedes Meeting vor" (Agent) |

Kalender-Widget nutzt beide Wege:
- MCP → Stufe 2 Widget: live-Anzeige heutiger Termine
- Windmill → Stufe 3 Widget: Agent bereitet Meeting-Kontext vor

### Ergaenzung 3 — Pakete konfigurieren Windmill-Variables automatisch

Credentials werden ueber MCP-Verbindungen + Paket-Aktivierung gesteuert:

- **Kommunikations-Paket** aktiviert → Gmail + Google Calendar Tokens auto-provisioniert in Windmill
- **Vertrieb-Paket** aktiviert → HubSpot + Slack Tokens
- `organization_settings.windmill_credentials` speichert nur Konfigurationsstatus — nie echte Keys

Windmill erhaelt dieselben Tokens wie MCP — kein doppeltes Credential-Management.

### Ergaenzung 4 — Vorteil bei Fehlerbehandlung

Wenn ein Windmill Script fehlschlaegt, bekommt Toro den Stack Trace:

```
Error: fetch failed
  at main (script.ts:15:23)
  → 401 Unauthorized from https://slack.com/api/chat.postMessage
```

Toro kann das lesen und dem User erklaeren:
"Der Slack-Token ist abgelaufen. Geh in Einstellungen → Integrationen und verbinde Slack neu."

Bei n8n waere die Fehlermeldung: "Node 'Slack' hat einen Fehler" — wenig hilfreich.

---

## 9. Offene Fragen

### Vor Phase 2 klaeren

| Frage | Prioritaet |
|-------|-----------|
| Hosting-Provider | ✅ Entschieden: Hetzner VPS Frankfurt |
| Welche Org-Credentials in Phase 2? | ✅ Entschieden: Gmail + Google Calendar + Slack (via MCP OAuth) |
| Windmill CE Docker Setup | 🟡 Mittel — docker-compose mit PostgreSQL |
| Wie wird Windmill Workspace bei Org-Loeschung bereinigt? | 🟡 Mittel |

### Vor Phase 4 klaeren (nicht jetzt)

| Frage | Prioritaet |
|-------|-----------|
| Windmill Embedding-Lizenz — Kosten und Bedingungen | 🟢 Niedrig |
| SSO wenn Editor embedded wird | 🟢 Niedrig |
| Dedicated Instanz pro Enterprise-Org — wann lohnt es sich? | 🟢 Niedrig |

---

## 10. Was NICHT gebaut wird

### Phase 2
- Kein manueller Workflow-Editor — Toro ist der einzige Builder
- Keine per-User Credentials — nur org-weite Credentials
- Keine komplexen Multi-Branch Flows (Windmill kann das, aber Phase 2 braucht es nicht)
- Kein Windmill Dashboard fuer User

### Generell
- Kein eigener Workflow-Builder in Tropen OS — Windmill fuehrt aus
- Kein Ersatz fuer Toro-Agenten — Windmill ergaenzt, ersetzt nicht
- Windmill Embedding nur wenn Enterprise-Kunden Editor explizit fordern
