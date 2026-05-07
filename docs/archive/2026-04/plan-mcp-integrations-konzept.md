# MCP-Integrationen — Konzept v1.0
## Toro verbindet sich mit der Arbeitswelt der KMU

> **Status:** Konzept März 2026
> **Technologie:** Model Context Protocol (Anthropic, open standard)
> **Basis für:** Integrations-Feature, Agenten-System Phase 2

---

## Was MCP ist

Model Context Protocol ist ein offener Standard von Anthropic.
Jede App die einen MCP-Server betreibt kann mit jedem LLM
verbunden werden — nicht nur Claude.

```
Ohne MCP:
Toro → antwortet mit Text → User kopiert manuell in Figma/Slack/etc.

Mit MCP:
Toro → liest Figma direkt → schreibt in Notion → erstellt Jira-Ticket
       alles ohne Copy-Paste, alles im Chat
```

---

## Zwei Varianten

### Variante A — Fremde MCP-Server (Sofort möglich)
Figma, Slack, Google Drive etc. betreiben eigene MCP-Server.
Tropen OS verbindet sich via OAuth.
User autorisiert einmalig, Toro hat danach Zugriff.

### Variante B — Eigene MCP-Server (Später)
Für interne Tools ohne eigenen MCP-Server.
Tropen OS baut und hostet den Server.
Volle Kontrolle, aber mehr Aufwand.

**Start mit Variante A — keine eigene Infrastruktur nötig.**

---

## Welche Integrationen für KMU am wertvollsten

### Tier 1 — Sofort hoher Wert (bauen zuerst)

| Integration | Was Toro damit kann | MCP verfügbar |
|-------------|-------------------|---------------|
| **Google Drive** | Dokumente lesen, erstellen, bearbeiten | ✅ |
| **Google Calendar** | Termine lesen, erstellen, Verfügbarkeit prüfen | ✅ |
| **Slack** | Nachrichten lesen, senden, Kanäle durchsuchen | ✅ |
| **Notion** | Seiten lesen, erstellen, Datenbanken abfragen | ✅ |
| **GitHub** | Code lesen, Issues erstellen, PRs reviewen | ✅ |

### Tier 2 — Wichtig für B2B-KMU

| Integration | Was Toro damit kann | MCP verfügbar |
|-------------|-------------------|---------------|
| **HubSpot** | CRM-Daten, Deals, Kontakte, E-Mail-Kampagnen | ✅ |
| **Jira** | Tickets erstellen, Sprint-Status, Backlog | ✅ |
| **Linear** | Issues, Projekte, Roadmap | ✅ |
| **Figma** | Designs analysieren, Kommentare, Assets | ✅ |
| **Airtable** | Datenbanken lesen, Einträge erstellen | ✅ |

### Tier 3 — Branchenspezifisch (später)

| Integration | Zielgruppe |
|-------------|-----------|
| **Salesforce** | Vertrieb-lastige KMU |
| **Shopify** | E-Commerce |
| **Datev** | Deutsche KMU mit Buchhaltung |
| **Lexoffice** | Kleine deutsche Unternehmen |
| **Miro** | Kreativ-/Agentur-Teams |

---

## Wie es sich für den User anfühlt

### Im Chat — natürlich, kein Extra-Schritt

```
User: "Schreib das als Notion-Seite raus"
Toro: "Erledigt — hier ist der Link: notion.so/..."

User: "Erstell dazu einen Jira-Ticket für das Dev-Team"
Toro: "Ticket PROJ-142 erstellt: 'Dashboard-Feature Q2'"

User: "Wann haben wir das letzte Mal über Pricing gesprochen?"
Toro: [durchsucht Slack] "Am 12. März in #product mit Sarah und Tom"

User: "Schreib das als Google Doc und teile es mit meinem Team"
Toro: "Dokument erstellt und mit marketing@firma.de geteilt"
```

### Im Workspace — Karten mit Live-Daten

```
Workspace-Karte "Aktuelle Deals"
→ zieht Live-Daten aus HubSpot
→ aktualisiert sich täglich (Feed-Integration)
→ Toro kommentiert: "3 Deals stagnieren seit 2 Wochen"
```

---

## Architektur

### OAuth-Flow (pro Integration)

```
1. Org-Admin: Settings → Integrationen → [+ Slack verbinden]
2. OAuth-Redirect zu Slack
3. User autorisiert
4. Token wird verschlüsselt in org_integrations gespeichert
5. Toro hat ab sofort Zugriff im Kontext dieser Org
```

### MCP-Client in Toro

```typescript
// Beim Chat-Start: welche Integrationen hat diese Org?
const integrations = await loadOrgIntegrations(orgId)

// MCP-Server-URLs in den Anthropic-SDK-Call:
tools: integrations.map(i => ({
  type: 'mcp',
  server_url: i.mcp_server_url,
  authorization_token: decrypt(i.access_token)
}))
```

### DB-Schema

```sql
CREATE TABLE org_integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,  -- 'slack', 'google_drive', 'notion', etc.
  access_token      TEXT NOT NULL,  -- verschlüsselt (AES-256)
  refresh_token     TEXT,           -- verschlüsselt
  token_expires_at  TIMESTAMPTZ,
  scopes            TEXT[],
  is_active         BOOLEAN DEFAULT true,
  connected_by      UUID REFERENCES users(id),
  connected_at      TIMESTAMPTZ DEFAULT now(),
  last_used_at      TIMESTAMPTZ
);

ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;
-- Nur org_admin und owner können Integrationen sehen/verwalten
```

---

## Governance — wer darf was

```
Superadmin:
→ Welche Integrationen sind für welche Pläne verfügbar
→ Neue MCP-Server aktivieren/deaktivieren

Org-Admin:
→ Integrationen für die Org verbinden/trennen
→ Welche Member dürfen welche Integrationen nutzen

Member:
→ Nutzt was der Org-Admin aktiviert hat
→ Keine eigenen OAuth-Verbindungen (Sicherheit)
→ Sieht im Chat welche Integrationen verfügbar sind
```

---

## Sicherheit

```
→ Tokens verschlüsselt in DB (AES-256, Key in Supabase Vault)
→ Token nie in Logs
→ Scope-Minimierung: nur was wirklich gebraucht wird
→ Widerruf jederzeit durch Org-Admin
→ User sieht in Settings welche Integrationen aktiv sind
→ Jede MCP-Aktion wird in integration_log geloggt (APPEND ONLY)
   ohne Inhalte — nur: wer, wann, welche Integration, welche Aktion
```

---

## Positionierung

Das ist das Feature das Tropen OS von einem KI-Chat zu einem
**KI-Betriebssystem** macht.

```
Andere Tools:        Chat + manuelle Integration via Zapier/n8n
Tropen OS:           Toro handelt direkt — kein Middleware nötig
```

Für KMU bedeutet das:
- Kein Copy-Paste zwischen Tools
- Kein Zapier-Abo für einfache Automationen
- Toro kennt den gesamten Arbeitskontext — nicht nur den Chat

---

## Build-Reihenfolge

```
Phase 1 (Tier 1 — sofort):
→ DB-Schema + OAuth-Flow (generisch, für alle Provider)
→ Google Drive Integration (größte Reichweite)
→ Slack Integration (tägliche Nutzung)
→ UI: Settings → Integrationen

Phase 2 (Tier 2):
→ Notion, GitHub, HubSpot, Jira
→ Workspace-Karten mit Live-Daten

Phase 3 (Tier 3):
→ Branchenspezifische Integrationen
→ Eigene MCP-Server für interne Tools
```

---

## Offene Fragen

| Frage | Priorität |
|-------|-----------|
| Token-Verschlüsselung: Supabase Vault oder eigener KMS? | Hoch |
| Rate-Limiting pro Integration (Kosten-Kontrolle) | Hoch |
| Was passiert wenn MCP-Server down ist? (Fallback) | Mittel |
| Audit-Log: wie granular? | Mittel |
| DSGVO: Datenverarbeitung durch Drittanbieter (AVV nötig) | Hoch |
