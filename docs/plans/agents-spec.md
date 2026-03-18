# Agenten-Spec — Tropen OS
Definition, Konfiguration, Verhalten, Architektur

> **Version:** 1.0 — März 2026
> **Status:** Spezifikation — bereit zum Bauen nach Plan J1
> **Einzuordnen:** Plan J2 (nach J1: Feeds autonom)
> **Ablage:** `docs/plans/agents-spec.md`
> **Referenz:** ARCHITECT.md, CLAUDE.md, docs/phase2-plans.md

---

## 1. Definition

Ein Agent in Tropen OS ist eine Kombination aus:

- Spezialisierter Toro mit eigenem Fokus und System-Prompt
- Automatisierter Workflow der auf Trigger reagiert
- Autonomer Mitarbeiter der eine Aufgabe regelmäßig erledigt

```
Toro-Chat:   User fragt → Toro antwortet → fertig
Agent:       Trigger feuert → Agent arbeitet →
             Ergebnis landet wo es hingehört →
             User wird informiert
```

Der User muss nicht dabei sein.

### Drei Kernunterschiede zu Toro-Chat

| Eigenschaft | Toro-Chat | Agent |
|-------------|-----------|-------|
| Autonomie | User muss anwesend sein | Arbeitet ohne User-Input |
| Auftrag | Improvisiert pro Anfrage | Fester konfigurierter Auftrag |
| Ergebnis | Freier Text | Immer strukturiertes Artefakt |

### Unterschied zu Perspectives und Guided Workflows

```
Perspectives:    einmalig, zustandslos, auf Anfrage
                 "Was denkt der Kritiker dazu?"

Guided Workflow: einmalig, interaktiv, geführt
                 "Wie sollen wir vorgehen?"

Agent:           wiederkehrend, autonom, konfiguriert
                 "Mach das jeden Montag"
```

---

## 2. Die drei Agent-Typen

### Typ 1 — Reaktiv
```
Trigger: externes Ereignis (Feed-Item, Webhook, n8n)
Beispiel: "Wenn neuer Wettbewerber-Artikel erscheint
           → analysieren → in Wissenbasis speichern"
```

### Typ 2 — Scheduled
```
Trigger: Zeitplan (täglich/wöchentlich/monatlich/cron)
Beispiel: "Jeden Montag 9 Uhr: Markt-Zusammenfassung
           der letzten Woche erstellen"
```

### Typ 3 — Kontextuell
```
Trigger: Ereignis innerhalb Tropen OS
Beispiel: "Wenn Projekt-Gedächtnis 80% voll →
           automatisch zusammenfassen"
          "Wenn Chat abgeschlossen →
           Key Insights extrahieren"
```

---

## 3. Konfigurations-Hierarchie

### Wer konfiguriert was

```
Superadmin
→ Erstellt System-Agenten (scope: 'system') — für alle sichtbar
→ Erstellt Paket-Agenten (scope: 'package') — nur mit Paket aktiv
→ Kann Agenten direkt einer Org zuweisen
→ Verwaltet alle bestehenden System-Agenten

Org-Admin
→ Sieht alle System-Agenten + Paket-Agenten (wenn Paket aktiv)
→ Erstellt Org-Agenten (scope: 'org')
→ Kann System-Agenten als Basis kopieren + anpassen
→ Entscheidet welche Agenten Members sehen können
→ Kann User-Agenten der Org moderieren

Member
→ Sieht System + Org-Agenten
→ Erstellt eigene Agenten (scope: 'user')
→ Kann Org/System-Agenten als Basis kopieren
→ Verwaltet eigene Agenten

Toro (automatisch)
→ Schlägt Agenten vor aus Projekt-Kontext
→ "Basierend auf deinen letzten 20 Chats empfehle ich
   diesen Agenten: ..."
→ User bestätigt → wird als scope='user' Agent angelegt
→ created_by_role = 'toro'
```

### Sichtbarkeits-Logik

```
Member sieht:
→ scope='system' (is_active=true)
→ scope='package' (wenn Paket der Org aktiv)
→ scope='org' (wenn organization_id = eigene Org, is_active=true)
→ scope='user' (wenn user_id = eigene ID)

Org-Admin sieht zusätzlich:
→ Alle scope='user' Agenten der Org (für Moderation)

Superadmin sieht:
→ Alle Agenten aller Orgs
```

---

## 4. TypeScript-Interface

```typescript
interface Agent {
  // Identität
  id: string
  name: string
  description: string
  emoji: string
  scope: 'system' | 'package' | 'org' | 'user'
  organization_id?: string    // null für system/package
  user_id?: string            // nur bei scope=user
  requires_package?: string   // z.B. 'marketing'
  created_by_role: 'superadmin' | 'org_admin' | 'member' | 'toro'
  source_agent_id?: string    // wenn kopiert: Original-Agent
  is_template: boolean        // true = Vorlage zum Kopieren

  // Auftrag
  system_prompt: string       // Was der Agent tut und wie
  capability_steps: AgentStep[] // Sequenz von Capability+Outcome

  // Trigger
  trigger_type: 'scheduled' | 'reactive' | 'contextual'
  trigger_config: AgentTriggerConfig

  // Inputs
  input_sources: AgentInput[]

  // Outputs
  output_targets: AgentOutput[]

  // Kontrolle
  requires_approval: boolean  // User muss Output bestätigen
  max_cost_eur: number        // Budget-Limit pro Run
  is_active: boolean

  // Laufzeit (computed)
  last_run_at?: string
  next_run_at?: string
  run_count: number
}

interface AgentStep {
  order: number
  capability_id: string
  outcome_id: string
  input_from: 'trigger' | 'previous_step' | 'source'
  system_prompt_override?: string  // überschreibt Capability-Prompt
  model_override?: string          // überschreibt Capability-Modell
}

interface AgentTriggerConfig {
  // Scheduled
  schedule?: string            // cron: '0 9 * * 1' = Montag 9 Uhr

  // Reaktiv
  event_type?: 'feed_item' | 'webhook' | 'chat_end' |
               'project_memory_threshold' | 'n8n'
  event_filter?: Record<string, unknown>
  webhook_secret?: string      // für Webhook-Validierung

  // Kontextuell
  context_threshold?: number   // z.B. 80 für 80% Gedächtnis-Füllstand
}

interface AgentInput {
  type: 'feed' | 'knowledge' | 'webhook' | 'n8n' | 'manual'
  source_id?: string
  filter?: Record<string, unknown>
}

interface AgentOutput {
  type: 'artifact' | 'knowledge' | 'notification' | 'webhook' | 'n8n'
  target_id?: string           // z.B. project_id für Wissenbasis
  webhook_url?: string
  notification_user_ids?: string[]
}
```

---

## 5. Multi-Step Beispiel

```
Agent: "Wöchentlicher Markt-Report"
Trigger: Scheduled — Montag 9 Uhr
Input: Feed-Quellen der letzten 7 Tage

Step 1: capability=search    outcome=table
        input_from='source'
        "Sammle alle relevanten Artikel der letzten 7 Tage"

Step 2: capability=reasoning  outcome=report
        input_from='previous_step'
        "Analysiere Trends, extrahiere Top 5 Insights,
         bewerte Relevanz für unser Geschäft"

Step 3: capability=writing    outcome=email
        input_from='previous_step'
        "Formuliere als wöchentliche Zusammenfassung
         für das Management — präzise, max 300 Wörter"

Output:
→ Artefakt in Projekt (artifact)
→ Notification an Team (notification)
→ Optional: n8n → Slack-Kanal (n8n)

Kosten geschätzt: ~0.15€ pro Run (3x Sonnet)
Budget-Limit: 0.50€ als Sicherheitsnetz
```

---

## 6. Verhältnis zu anderen Systemen

### Capabilities
```
Agent nutzt Capability + Outcome pro Step.
Capability-Resolver bestimmt Modell je Step.
Budget-Check vor jedem Step.
Org-Whitelist wird respektiert.
```

### Perspectives
```
Agent kann Perspectives-Step haben:
→ "Lass Kritiker + Stratege den Report prüfen"
→ Ergebnis fließt als Input in nächsten Step
→ Beide Perspektiven werden im Artefakt dokumentiert
```

### Feeds
```
Feed ist häufigster Input-Typ für reaktive Agenten.
Feed-Item triggert Agent → Agent verarbeitet → Output zurück.
Agent-Output kann wieder als Feed-Item gespeichert werden.
```

### n8n (bidirektional)
```
n8n → Agent:
  n8n sendet Webhook → Agent startet Run

Agent → n8n:
  Agent-Output geht als Webhook an n8n
  n8n sendet E-Mail, Slack, Teams, etc.
```

### Workspace-Karten
```
Karte hat optional agent_id.
Agent befüllt Karte bei jedem Run automatisch.
Stale-Logik: Karte wird bei Agent-Run als 'ready' markiert.
card_history wird bei jedem Agent-Run geschrieben (APPEND ONLY).
```

### Toro (Vorschlag-Logik)
```
Nach N Chats in einem Projekt analysiert Toro:
→ Welche Aufgaben wiederholen sich?
→ Welche könnten automatisiert werden?
→ Vorschlag: "Ich könnte das täglich für dich erledigen"
User bestätigt → Agent wird aus Projekt-Kontext konfiguriert
```

---

## 7. DB-Schema

### ⚠️ agents Tabelle — vor Migration prüfen

> **Hinweis (Architektur-Review):** Vor Plan J2 muss geprüft werden ob
> `agents` bereits als Tabelle existiert (ggf. Migration 025 oder früher).
> Falls nicht vorhanden: `CREATE TABLE agents` statt `ALTER TABLE`.
> Falls vorhanden: `ALTER TABLE agents ADD COLUMN IF NOT EXISTS` wie unten.
> Supabase CLI: `supabase db diff` vor der Migration ausführen.

```sql
-- Neue Spalten zu bestehender agents Tabelle
-- PRÜFEN: existiert agents bereits? → supabase db diff
ALTER TABLE agents ADD COLUMN IF NOT EXISTS
  trigger_type       TEXT CHECK (trigger_type IN
                       ('scheduled','reactive','contextual')),
  trigger_config     JSONB,
  capability_steps   JSONB,
  input_sources      JSONB,
  output_targets     JSONB,
  requires_approval  BOOLEAN DEFAULT false,
  max_cost_eur       NUMERIC DEFAULT 1.00,
  requires_package   TEXT,
  created_by_role    TEXT CHECK (created_by_role IN
                       ('superadmin','org_admin','member','toro')),
  source_agent_id    UUID REFERENCES agents(id),
  is_template        BOOLEAN DEFAULT false,
  last_run_at        TIMESTAMPTZ,
  next_run_at        TIMESTAMPTZ,
  run_count          INTEGER DEFAULT 0;

-- scope um 'package' erweitern
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_scope_check;
ALTER TABLE agents ADD CONSTRAINT agents_scope_check
  CHECK (scope IN ('system','package','org','user'));
```

### agent_runs (neu, APPEND ONLY)

```sql
CREATE TABLE agent_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID REFERENCES agents(id) ON DELETE CASCADE,
  organization_id   UUID REFERENCES organizations(id),
  user_id           UUID,
  triggered_by      TEXT NOT NULL
                    CHECK (triggered_by IN
                      ('schedule','event','manual','webhook','n8n')),
  trigger_payload   JSONB,
  status            TEXT NOT NULL
                    CHECK (status IN
                      ('running','success','error','skipped','cancelled')),
  steps_completed   INTEGER DEFAULT 0,
  steps_total       INTEGER DEFAULT 0,
  input_summary     JSONB,
  output_artifact_id UUID,
  output_summary    TEXT,
  token_usage       JSONB,
  cost_eur          NUMERIC,
  error_message     TEXT,
  error_step        INTEGER,
  started_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ
  -- APPEND ONLY — niemals UPDATE oder DELETE
);

CREATE INDEX idx_agent_runs_agent   ON agent_runs(agent_id);
CREATE INDEX idx_agent_runs_org     ON agent_runs(organization_id);
CREATE INDEX idx_agent_runs_status  ON agent_runs(status);
CREATE INDEX idx_agent_runs_started ON agent_runs(started_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_select ON agent_runs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
```

---

## 8. API Routes

```
GET    /api/agents
       → Alle für User sichtbaren Agenten
       → Filter: scope, package, is_active

POST   /api/agents
       → Neuen Agenten erstellen (org_admin oder member)

GET    /api/agents/[id]
       → Einzelner Agent mit letzten 5 Runs

PATCH  /api/agents/[id]
       → Agent bearbeiten

DELETE /api/agents/[id]
       → Soft Delete (deleted_at)

POST   /api/agents/[id]/copy
       → Als eigene Basis kopieren

POST   /api/agents/[id]/run
       → Manuellen Run starten (async, gibt run_id zurück)

GET    /api/agents/[id]/runs
       → Run-History mit Pagination

GET    /api/agents/runs/[run_id]
       → Einzelner Run mit Details

POST   /api/agents/webhook/[agent_id]
       → Eingehender Webhook triggert Agent
       → Validiert webhook_secret

GET    /api/agents/[id]/next-run
       → Nächster geplanter Run + geschätzte Kosten
```

---

## 9. Agent-Engine (src/lib/agent-engine.ts)

```typescript
// Startet einen Agent-Run (async)
async function runAgent(
  agentId: string,
  triggeredBy: string,
  triggerPayload?: unknown
): Promise<string>               // gibt run_id zurück

// Führt einen einzelnen Step aus
async function executeStep(
  run: AgentRun,
  step: AgentStep,
  previousOutput?: unknown
): Promise<StepResult>

// Prüft alle Scheduled Trigger (Vercel Cron, alle 5 Min)
// → aufgerufen via GET /api/cron/agents/check
async function checkScheduledTriggers(): Promise<void>

// Budget-Check vor Run
async function checkBudget(
  agentId: string,
  orgId: string
): Promise<{ sufficient: boolean; available_eur: number }>

// Nächsten Run berechnen
function calculateNextRun(
  triggerConfig: AgentTriggerConfig
): Date | null

// Toro-Vorschlag nach Chat-Ende
async function suggestAgent(
  projectId: string,
  conversationId: string
): Promise<AgentSuggestion | null>
```

---

## 10. Sicherheit & Kontrolle

### Budget
```
Hartes Limit: max_cost_eur pro Run.
Check vor JEDEM Run (nicht nur erstem Step).
Wenn überschritten: Run abgebrochen, Status='error'.
Notification an Owner.
```

### requires_approval
```
Wenn true:
→ Agent führt alle Steps aus
→ Artefakt erstellt aber status='pending_approval'
→ Owner-Notification: "Agent hat Ergebnis — bitte prüfen"
→ Bestätigt → status='published'
→ Abgelehnt → status='archived'
```

### Webhook-Sicherheit
```
Jeder Webhook-Agent hat webhook_secret.
Validierung via HMAC-SHA256.
Kein Secret = 401 Unauthorized.
```

### Rate Limiting
```
Max 1 gleichzeitiger Run pro Agent.
Wenn Run aktiv und Trigger feuert → Queue (max 3).
Queue voll → Trigger ignoriert (geloggt).
```

---

## 11. Toro-Vorschlag-Logik

Toro analysiert nach N Chats in einem Projekt:
- Wiederkehrende Aufgaben
- Muster in genutzten Capabilities
- Projekt-Gedächtnis Einträge

Schlägt nur vor wenn Confidence > 0.7.

User sieht:
```
💡 Toro-Vorschlag
"Ich habe bemerkt dass du jeden Montag nach
 Branchen-News fragst. Soll ich das automatisieren?

 Agent: Wöchentlicher Branchen-Scout
 Trigger: Montag 9 Uhr
 Geschätzte Kosten: ~0.08€/Woche

 [Agent anlegen] [Anpassen] [Ignorieren]"
```

MVP: opt-in (`user_preferences: agent_suggestions BOOLEAN DEFAULT false`)
Phase 2: nach positivem Feedback → opt-out

---

## 12. Paket-Agenten (Superadmin)

Superadmin erstellt Agenten als Vorlagen für Kunden:

```
scope: 'package'
requires_package: 'marketing'
is_template: true

Bei Paket-Aktivierung für Org:
→ Alle package-Agenten mit requires_package='marketing'
   werden für Org sichtbar
→ Org-Admin aktiviert und konfiguriert
→ Member nutzt und kopiert
```

### Bestehende Marketing-Paket-Agenten

| Agent | Trigger | Steps | Output |
|-------|---------|-------|--------|
| Campaign Planner | Manuell | reasoning → report | Artefakt |
| Brand Voice Writer | Manuell | writing → text | Artefakt |
| Social Adapter | Manuell | writing → text | Artefakt |
| Newsletter Spezialist | Manuell | writing → email | Artefakt |
| Copy Texter | Manuell | writing → text | Artefakt |

> **Hinweis (Architektur-Review):** Diese Agenten sind in Migration 040/041
> als *Capabilities* geseedet, nicht als `agents`-Rows. Plan J2 muss sie
> explizit als Agent-Records migrieren — als eigener Migrations-Schritt
> **vor** dem ersten Agent-Run.

---

## 13. Plan J2 Build-Scope

```
✅ agents Tabelle prüfen + erweitern (neue Migration — supabase db diff zuerst)
✅ Marketing-Paket-Agenten als agents-Rows migrieren
✅ agent_runs Tabelle anlegen (APPEND ONLY)
✅ Agent-Engine (src/lib/agent-engine.ts)
✅ Alle API Routes
✅ Scheduled Trigger via Vercel Cron Jobs
   → vercel.json: "*/5 * * * *" → GET /api/cron/agents/check
✅ Reaktiver Trigger (Webhook-Endpoint)
✅ Budget-Check + requires_approval Flow
✅ Toro-Vorschlag-Logik (nach Chat-Ende)
✅ n8n Webhook bidirektional

Nicht in J2:
❌ UI (kommt mit Hub / Plan J3+)
❌ Kontextueller Trigger (wird nachgerüstet nach J2)
❌ Perspectives-Steps (kommt nach Perspectives-Build)
```

---

## 14. Offene Entscheidungen

```
✅ Cron-Runner: Vercel Cron Jobs (alle 5 Min → /api/cron/agents/check)
   Kein pg_cron nötig — gleicher Runtime-Stack wie Rest der App.

❓ Queue-System für parallele Runs?
   → MVP: kein Queue, max 1 Run pro Agent
   → Phase 3: BullMQ oder Supabase Queue

❓ Maximale Step-Anzahl?
   → Empfehlung: 5 Steps pro Agent
   → Superadmin kann Limit erhöhen

✅ Toro-Vorschlag: opt-in im MVP
   → user_preferences: agent_suggestions BOOLEAN DEFAULT false
   → Nach positivem Feedback: opt-out (Phase 2)
```

---

**Nächster Schritt:** Plan J1 (Feeds autonom) bauen,
dann Plan J2 auf Basis dieser Spec.
