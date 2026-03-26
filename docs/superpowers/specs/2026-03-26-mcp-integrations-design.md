# MCP-Integrationen — Design Spec
> Status: Approved 2026-03-26
> Ersetzt: `docs/plans/mcp-integrations-konzept.md`

---

## Entscheidungen

| Frage | Entscheidung | Begründung |
|---|---|---|
| OAuth-Management | DIY mit `google-auth-library` + `@azure/msal-node` | Nango zu teuer ($1/connection), volle Kontrolle |
| MCP-Client | `@ai-sdk/mcp` | Konsistent mit AI SDK v6 im Projekt |
| Wo läuft MCP | Neue Next.js Route `/api/chat/mcp` | Edge Function (Deno) hat Limitierungen; Edge Function bleibt für normale Chats |
| Governance | User-Level Tokens | Google/Microsoft sind persönliche Accounts, kein Sinn für Org-Level |
| Phase 1 Scope | Google Drive + Microsoft 365 | Höchste KMU-Reichweite |
| Tool-Kollisionen | Prefix `{provider}__{toolName}` | z.B. `google__search_files` vs `microsoft__search_files` |
| Scope-Strategie | Inkrementell | Erst Drive+Calendar, Mail erst wenn Widget aktiviert → mehr Vertrauen |
| stepCountIs | 5 (Start) | Konservativ, bei Bedarf hochdrehen |

---

## Gesamtarchitektur

```
User → /settings/integrations → OAuth (Google / Microsoft)
                                        ↓
                                user_integrations (DB, Tokens AES-256-GCM verschlüsselt)
                                        ↓
User schreibt im Chat → userHasActiveIntegrations?
                              ja → /api/chat/mcp (neue Next.js Route)
                              nein → supabase Edge Function (unverändert)
                                        ↓
                        buildMCPContext(userId):
                          → Tokens laden + entschlüsseln + ggf. refreshen (atomic)
                          → @ai-sdk/mcp Clients initialisieren
                          → Tool-Schemas mit Prefix mergen
                                        ↓
                        streamText({ tools, stopWhen: stepCountIs(5) })
                          finally: cleanup() + waitUntil
```

---

## DB-Schema

```sql
CREATE TABLE user_integrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  access_token     TEXT NOT NULL,   -- AES-256-GCM verschlüsselt
  refresh_token    TEXT,            -- AES-256-GCM verschlüsselt
  token_expires_at TIMESTAMPTZ,
  scopes           TEXT[],          -- aktuell gewährte Scopes
  account_email    TEXT,            -- z.B. "tim@firma.de" (PII — gespeichert auf Basis Einwilligung bei OAuth-Connect)
  is_active        BOOLEAN DEFAULT true,
  connected_at     TIMESTAMPTZ DEFAULT now(),
  last_used_at     TIMESTAMPTZ,
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
-- Policies: User sieht + verändert nur eigene Zeilen

-- Audit-Log (APPEND ONLY — kein Content, kein Token)
CREATE TABLE integration_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  provider        TEXT NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('connected', 'disconnected', 'token_refreshed', 'mcp_used')),
  created_at      TIMESTAMPTZ DEFAULT now()
  -- NIEMALS: Token-Felder, Content-Felder, PII über die Aktion hinaus
);
```

`integration_log` ist APPEND ONLY (kein UPDATE, kein DELETE — wie `agent_runs`, `feed_runs` etc.)

---

## OAuth-Flow

### CSRF-Schutz
- `state` = HMAC-signiertes JWT (user_id + timestamp + nonce)
- Zusätzlich als `httpOnly`-Cookie gespiegelt
- Callback verifiziert beide — `state`-Mismatch → 403

### Google OAuth
```
GET /api/auth/integrations/connect?provider=google
  → state generieren + Cookie setzen
  → Redirect: accounts.google.com/o/oauth2/v2/auth
  → Scopes Phase 1: https://www.googleapis.com/auth/drive.file
                    https://www.googleapis.com/auth/drive.readonly
                    https://www.googleapis.com/auth/calendar.readonly
  → (Mail-Scope: erst anfragen wenn E-Mail-Widget aktiviert wird)

GET /api/auth/integrations/callback?code=X&state=Y
  → CSRF verifizieren
  → google-auth-library: code → access_token + refresh_token
  → account_email vom Profil-Endpoint lesen
  → AES-256-GCM verschlüsseln
  → user_integrations UPSERT
  → integration_log: action='connected'
  → Redirect /settings/integrations?success=google
```

### Microsoft OAuth
```
GET /api/auth/integrations/connect?provider=microsoft
  → @azure/msal-node: Auth-URL generieren
  → Redirect: login.microsoftonline.com/common/oauth2/v2.0/authorize
  → Scopes Phase 1: Files.ReadWrite, Calendars.Read, User.Read, offline_access
  → (Mail.Read: erst bei E-Mail-Widget — incremental auth)

GET /api/auth/integrations/callback?code=X&state=Y
  → CSRF verifizieren
  → @azure/msal-node: code → access_token + refresh_token
  → account_email aus id_token claims
  → Gleiche Verschlüsselung + UPSERT wie Google
```

### Token-Refresh (Race-Condition-sicher)
```sql
-- Atomic: nur der erste Request der die Expiry sieht, refresht
UPDATE user_integrations
  SET access_token = $new_encrypted, token_expires_at = $new_expiry, last_used_at = NOW()
  WHERE id = $id AND token_expires_at < NOW()
-- RETURNING id: 0 Rows → anderer Request hat bereits refreshed → neu lesen
```

---

## MCP-Client

### `src/lib/integrations/crypto.ts`
- AES-256-GCM, Key = `INTEGRATION_ENCRYPTION_KEY` (32 Bytes, Base64)
- Format: `{base64_iv}:{base64_ciphertext}`
- **Fail-fast beim Modul-Import** — wirft sofort wenn Key fehlt (nicht erst beim ersten Request)

### `src/lib/integrations/mcp-client.ts`
```typescript
export async function buildMCPContext(userId: string): Promise<{
  tools: Record<string, CoreTool>   // Prefix: google__*, microsoft__*
  cleanup: () => Promise<void>
}>
```

- Lädt aktive Integrationen aus DB
- Entschlüsselt Tokens, refresht bei Bedarf (atomic)
- Initialisiert `@ai-sdk/mcp` Client pro Integration
- Merged Tool-Schemas mit `{provider}__{toolName}` Prefix
- **Verify beim Build:** Genaue `@ai-sdk/mcp` API (Transport-Konfiguration, Tool-Schema-Format) gegen aktuelle Docs prüfen — MCP-Server-Typ (stdio vs. HTTP) je nach Provider unterschiedlich

### `src/lib/integrations/google.ts` + `microsoft.ts`
- Token-Management (load, decrypt, refresh, save)
- Provider-spezifische OAuth-Library-Initialisierung

---

## Chat-Route `/api/chat/mcp`

```typescript
export async function POST(req: Request) {
  // 1. Auth
  const user = await getAuthUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. Budget
  await checkAndReserveBudget(user.orgId, ...)  // → 402 bei Budget exhausted

  // 3. MCP Context
  const { tools, cleanup } = await buildMCPContext(user.id)

  try {
    // 4. Stream
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages,          // Format: prüfen gegen AI SDK v6 Docs (convertToModelMessages o.ä.)
      system: orgSystemPrompt,
      tools,             // MCP-Tools mit Prefix
      stopWhen: stepCountIs(5),
      maxOutputTokens: 4096,
    })

    return result.toUIMessageStreamResponse()

  } finally {
    // 5. Cleanup — via waitUntil damit Verbindungen nach Stream-Ende geschlossen werden
    waitUntil(cleanup())
  }
}
```

**Selektion im Client:**
```typescript
const chatEndpoint = userHasActiveIntegrations
  ? '/api/chat/mcp'
  : '/supabase/functions/v1/ai-chat'
```
`userHasActiveIntegrations` → `GET /api/integrations` beim Session-Start (`{ hasActive: boolean }`).

---

## Settings-UI `/settings/integrations`

Tab in bestehenden Settings. Zwei Integrations-Karten:

```
● Google Drive          ← grüner Dot = verbunden
  Verbunden als tim@firma.de        [Trennen]

○ Microsoft 365         ← grauer Dot = nicht verbunden
  OneDrive, Teams, Outlook          [Verbinden →]

──────────────────────────────
Demnächst: Notion · Slack · HubSpot
```

- `[Verbinden]` → OAuth-Redirect (gleicher Tab, kein Popup)
- `[Trennen]` → DELETE `/api/integrations?provider=X` → Token-Zeile löschen + Log-Eintrag
- Kein Confirm-Dialog (nicht destruktiv — jederzeit neu verbindbar)

### API-Routen
```
GET  /api/integrations              → { integrations: [{provider, account_email, connected_at}] }
DELETE /api/integrations?provider=X → Token löschen, Log-Eintrag
```

---

## Neue Env-Variablen

```bash
INTEGRATION_ENCRYPTION_KEY=   # 32 Bytes, Base64 — Vercel + Supabase Secrets
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=          # https://app.tropen.de/api/auth/integrations/callback?provider=google
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=       # https://app.tropen.de/api/auth/integrations/callback?provider=microsoft
```

**Pflicht vor erstem Deploy:** `INTEGRATION_ENCRYPTION_KEY` — App crasht bei Cold Start ohne ihn.

---

## Sicherheit & DSGVO

- Tokens **niemals** in Logs (bestehende Logging-Regel gilt)
- `account_email` **niemals** in Logs — ist PII (E-Mail-Adresse des Users)
- `integration_log` speichert nur Metadaten (wer, wann, was) — kein Content
- Minimale Scopes (inkrementell — Mail erst bei Bedarf)
- User kann jederzeit trennen (Recht auf Löschung erfüllt)
- DSGVO: AVV mit Google und Microsoft abschließen (Standard-AVV verfügbar)
- RLS auf `user_integrations` + `integration_log`

---

## Neue Dateien

```
src/lib/integrations/
  crypto.ts          ← AES-256-GCM, fail-fast Guard
  google.ts          ← Token-Management + google-auth-library
  microsoft.ts       ← Token-Management + @azure/msal-node
  mcp-client.ts      ← buildMCPContext(), Tool-Prefix, Cleanup

src/app/api/
  auth/integrations/
    connect/route.ts       ← OAuth-Start (state + Cookie)
    callback/route.ts      ← OAuth-Callback (verify + token + DB)
  chat/
    mcp/route.ts           ← MCP-fähige Chat-Route
  integrations/
    route.ts               ← GET list + DELETE revoke

src/app/settings/integrations/
  page.tsx                 ← Settings-Tab UI

supabase/migrations/
  20260326XXXXXX_user_integrations.sql
```

---

## Offene Punkte (für Implementation klären)

| Punkt | Aktion |
|---|---|
| `@ai-sdk/mcp` genaue Transport-API | Gegen aktuelle Docs verifizieren beim Build |
| Google Drive MCP Server: stdio vs. HTTP | Offiziellen Server-Typ + URL bestätigen |
| Microsoft Graph MCP Server | Offiziellen Server-Typ + URL bestätigen |
| `convertToModelMessages` vs. v6 Format | AI SDK v6 Docs prüfen — möglicherweise direkt nutzbar |
| `after()` in Next.js App Router | `import { after } from 'next/server'` — ersetzt `waitUntil` in Next.js 15+ |
