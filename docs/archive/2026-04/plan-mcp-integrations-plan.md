# Feature — MCP-Integrationen (Google Drive + Microsoft 365)
## Claude Code Build-Prompt

> Vollständiges Design aus 5 Abschnitten.
> Google Drive + Microsoft 365 (OneDrive/Teams/Outlook).
> OAuth mit google-auth-library + @azure/msal-node.
> MCP via @ai-sdk/mcp — konsistent mit AI SDK Stack.
> Inkrementelle Scopes, atomarer Token-Refresh, kein Redis.
> Design-Spec: docs/superpowers/specs/2026-03-26-mcp-integrations-design.md

---

## Pflicht: Vor dem Bauen lesen

```
1. CLAUDE.md                                         → Stack, AI SDK, supabaseAdmin
2. ARCHITECT.md                                      → Security-Regeln
3. src/app/settings/page.tsx                         → bestehende Tabs
4. src/app/api/chat/stream/route.ts                  → bestehende Chat-Route
5. supabase/functions/ai-chat/index.ts               → Edge Function (NICHT anfassen)
6. supabase/migrations/ letzte Migration             → Nächste Nummer
```

```bash
# Bestehende Integrations-Strukturen:
grep -rn "user_integrations\|mcp_connection" \
  supabase/migrations/ | grep "CREATE TABLE" | tail -5

# AI SDK Version prüfen:
grep "\"ai\"\|@ai-sdk" package.json

# Bestehende Settings-Tabs:
grep -n "tab\|Tab" src/app/settings/page.tsx | head -20
```

Danach: Ampel bestimmen. Committe mit Prefix `mcp:`.

---

## Manuelle Vorarbeit (durch Timm — VOR Claude Code)

```
1. Google Cloud Console (console.cloud.google.com):
   → OAuth 2.0 Client ID erstellen (Web Application)
   → Scopes REGISTRIEREN (nicht alle anfragen):
     - drive.file
     - drive.readonly
     - calendar.readonly  ← jetzt registrieren, später inkrementell anfragen
   → Redirect URI: https://app.tropen.io/api/auth/integrations/callback?provider=google
   → Auch: http://localhost:3000/api/auth/integrations/callback?provider=google

2. Azure Portal (portal.azure.com):
   → App-Registrierung erstellen
   → Scopes REGISTRIEREN:
     - Files.ReadWrite
     - User.Read
     - offline_access
     - Calendars.Read   ← jetzt registrieren, später inkrementell
     - Mail.Read        ← jetzt registrieren, später inkrementell
   → Redirect URI: https://app.tropen.io/api/auth/integrations/callback?provider=microsoft
   → Tenant: common (Multi-Tenant)

3. .env ergänzen:
   INTEGRATION_ENCRYPTION_KEY=   # openssl rand -base64 32
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   MICROSOFT_CLIENT_ID=
   MICROSOFT_CLIENT_SECRET=
```

---

## Neue Packages installieren

```bash
pnpm add google-auth-library @azure/msal-node @ai-sdk/mcp
```

---

## DSGVO-Constraints (nicht verhandelbar)

```
→ Rohe Datei-Inhalte NIEMALS in DB speichern
→ Tokens AES-256-GCM verschlüsselt (INTEGRATION_ENCRYPTION_KEY)
→ account_email unverschlüsselt (nicht sensibel, für UI) — NIEMALS in Logs (PII)
→ User kann jederzeit trennen → Token sofort gelöscht
→ Minimale Scopes — nur was für aktive Widgets nötig
→ Inkrementelle Auth: Calendar erst anfragen wenn Widget aktiviert
```

---

## Aufgabe 1 — Migration

```sql
CREATE TABLE IF NOT EXISTS user_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  provider        TEXT NOT NULL
    CHECK (provider IN ('google', 'microsoft', 'slack', 'hubspot', 'notion')),

  -- Verschlüsselte Tokens (AES-256-GCM)
  access_token_enc  TEXT NOT NULL,
  refresh_token_enc TEXT,
  token_expires_at  TIMESTAMPTZ,

  -- Klartext (nicht sensibel)
  account_email   TEXT,           -- z.B. "tim@firma.de" — NIEMALS in Logs (PII)
  scopes          TEXT[] DEFAULT '{}',

  -- Status
  is_active       BOOLEAN DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  last_error      TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_integrations_user
  ON user_integrations(user_id)
  WHERE is_active = true;

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_integrations_own" ON user_integrations
  FOR ALL USING (user_id = auth.uid());

-- Audit-Log (APPEND ONLY — kein Content, kein Token)
CREATE TABLE IF NOT EXISTS integration_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  action          TEXT NOT NULL
    CHECK (action IN ('connected', 'disconnected', 'token_refreshed', 'mcp_used')),
  created_at      TIMESTAMPTZ DEFAULT now()
  -- NIEMALS: Token-Felder, Content-Felder, PII
);

-- APPEND ONLY: kein UPDATE, kein DELETE (wie agent_runs, feed_runs)
ALTER TABLE integration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_log_own" ON integration_log
  FOR SELECT USING (user_id = auth.uid());
-- INSERT via supabaseAdmin (server-only) — kein direkter Client-Zugriff
```

---

## Aufgabe 2 — Token-Verschlüsselung

`src/lib/integrations/crypto.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Fail-fast: schlägt bei Deploy ohne Key sofort fehl
const rawKey = process.env.INTEGRATION_ENCRYPTION_KEY
if (!rawKey) {
  throw new Error(
    'INTEGRATION_ENCRYPTION_KEY not configured — set in Vercel + Supabase Secrets'
  )
}
const KEY = Buffer.from(rawKey, 'base64')
const ALGORITHM = 'aes-256-gcm'

export function encryptToken(token: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decryptToken(enc: string): string {
  const [ivB64, tagB64, dataB64] = enc.split(':')
  const decipher = createDecipheriv(
    ALGORITHM, KEY,
    Buffer.from(ivB64, 'base64')
  )
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return decipher.update(Buffer.from(dataB64, 'base64')) + decipher.final('utf8')
}
```

---

## Aufgabe 3 — Google Token-Management

`src/lib/integrations/google.ts`

```typescript
import { OAuth2Client } from 'google-auth-library'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { encryptToken, decryptToken } from './crypto'
import { createLogger } from '@/lib/logger'

const logger = createLogger('integrations/google')

// Scopes Phase 1 — Drive
// Phase 1: Drive + Calendar zusammen registrieren
// Calendar wird inkrementell angefragt wenn Widget aktiviert
export const GOOGLE_SCOPES_PHASE1 = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'openid',
  'email',
]

// Inkrementell: erst anfragen wenn Kalender-Widget aktiviert
export const GOOGLE_SCOPES_CALENDAR = [
  'https://www.googleapis.com/auth/calendar.readonly',
]

export function getGoogleClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/integrations/callback?provider=google`
  )
}

export async function getValidGoogleToken(userId: string): Promise<string | null> {
  const { data: integration } = await supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

  if (!integration) return null

  // Token noch gültig?
  if (integration.token_expires_at && new Date(integration.token_expires_at) > new Date()) {
    return decryptToken(integration.access_token_enc)
  }

  // Atomarer Refresh — Race-Condition-sicher
  if (!integration.refresh_token_enc) return null

  try {
    const client = getGoogleClient()
    client.setCredentials({
      refresh_token: decryptToken(integration.refresh_token_enc),
    })
    const { credentials } = await client.refreshAccessToken()

    // Atomares DB-Update: nur wenn DIESER Request der erste ist
    const { data: updated } = await supabaseAdmin
      .from('user_integrations')
      .update({
        access_token_enc: encryptToken(credentials.access_token!),
        token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq('id', integration.id)
      .lt('token_expires_at', new Date().toISOString()) // nur wenn noch abgelaufen
      .select('id')
      .single()

    // Wenn 0 Rows → anderer Request hat bereits refreshed → neu lesen
    if (!updated) {
      const { data: fresh } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token_enc')
        .eq('id', integration.id)
        .single()
      return fresh ? decryptToken(fresh.access_token_enc) : null
    }

    return credentials.access_token!
  } catch (err) {
    logger.error('Google token refresh failed', { err, userId })
    return null
  }
}
```

---

## Aufgabe 4 — Microsoft Token-Management

`src/lib/integrations/microsoft.ts`

```typescript
import { ConfidentialClientApplication } from '@azure/msal-node'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { encryptToken, decryptToken } from './crypto'
import { createLogger } from '@/lib/logger'

const logger = createLogger('integrations/microsoft')

export const MICROSOFT_SCOPES_PHASE1 = [
  'Files.ReadWrite',
  'User.Read',
  'offline_access',
]

// Inkrementell später:
export const MICROSOFT_SCOPES_CALENDAR = ['Calendars.Read']
export const MICROSOFT_SCOPES_MAIL = ['Mail.Read']

export function getMSALClient() {
  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authority: 'https://login.microsoftonline.com/common',
    },
  })
}

export async function getValidMicrosoftToken(userId: string): Promise<string | null> {
  const { data: integration } = await supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'microsoft')
    .eq('is_active', true)
    .single()

  if (!integration) return null

  if (integration.token_expires_at && new Date(integration.token_expires_at) > new Date()) {
    return decryptToken(integration.access_token_enc)
  }

  if (!integration.refresh_token_enc) return null

  try {
    const msalClient = getMSALClient()
    const result = await msalClient.acquireTokenByRefreshToken({
      refreshToken: decryptToken(integration.refresh_token_enc),
      scopes: MICROSOFT_SCOPES_PHASE1,
    })

    if (!result?.accessToken) return null

    // Atomares Update (gleiche Race-Condition-Lösung wie Google)
    const { data: updated } = await supabaseAdmin
      .from('user_integrations')
      .update({
        access_token_enc: encryptToken(result.accessToken),
        token_expires_at: result.expiresOn?.toISOString() ?? null,
      })
      .eq('id', integration.id)
      .lt('token_expires_at', new Date().toISOString())
      .select('id')
      .single()

    if (!updated) {
      const { data: fresh } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token_enc')
        .eq('id', integration.id)
        .single()
      return fresh ? decryptToken(fresh.access_token_enc) : null
    }

    return result.accessToken
  } catch (err) {
    logger.error('Microsoft token refresh failed', { err, userId })
    return null
  }
}
```

---

## Aufgabe 5 — OAuth-Flow

### Connect Route

`src/app/api/auth/integrations/connect/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getGoogleClient, GOOGLE_SCOPES_PHASE1 } from '@/lib/integrations/google'
import { getMSALClient, MICROSOFT_SCOPES_PHASE1 } from '@/lib/integrations/microsoft'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.INTEGRATION_ENCRYPTION_KEY)

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate Limiting: 5 OAuth-Starts pro User pro Minute
  const rateLimitResult = await ratelimit.limit(`oauth:${user.id}`)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Zu viele Verbindungsversuche. Bitte warte eine Minute.' },
      { status: 429 }
    )
  }

  const provider = req.nextUrl.searchParams.get('provider')
  if (!provider || !['google', 'microsoft'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  // HMAC-signiertes JWT als state (CSRF-Schutz)
  const state = await new SignJWT({
    userId: user.id,
    provider,
    nonce: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(JWT_SECRET)

  // State als httpOnly-Cookie spiegeln
  const response = NextResponse.redirect(
    await buildAuthUrl(provider, state)
  )
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 Minuten
    path: '/',
  })

  return response
}

async function buildAuthUrl(provider: string, state: string): Promise<string> {
  if (provider === 'google') {
    const client = getGoogleClient()
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES_PHASE1,
      state,
      prompt: 'consent',
    })
  }

  if (provider === 'microsoft') {
    const msalClient = getMSALClient()
    const result = await msalClient.getAuthCodeUrl({
      scopes: MICROSOFT_SCOPES_PHASE1,
      redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/integrations/callback?provider=microsoft`,
      state,
    })
    return result
  }

  throw new Error('Unknown provider')
}
```

### Callback Route

`src/app/api/auth/integrations/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { jwtVerify } from 'jose'
import { encryptToken } from '@/lib/integrations/crypto'
import { getGoogleClient } from '@/lib/integrations/google'
import { getMSALClient, MICROSOFT_SCOPES_PHASE1 } from '@/lib/integrations/microsoft'
import { createLogger } from '@/lib/logger'

const logger = createLogger('integrations/callback')
const JWT_SECRET = new TextEncoder().encode(process.env.INTEGRATION_ENCRYPTION_KEY)
const REDIRECT_BASE = `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=integrationen`

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const provider = url.searchParams.get('provider')

  if (error) {
    return NextResponse.redirect(`${REDIRECT_BASE}&error=${error}`)
  }

  if (!code || !stateParam || !provider) {
    return NextResponse.redirect(`${REDIRECT_BASE}&error=missing_params`)
  }

  // State aus Cookie vs. Query-Param verifizieren
  const cookieState = req.cookies.get('oauth_state')?.value
  if (!cookieState || cookieState !== stateParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}&error=state_mismatch`)
  }

  // JWT verifizieren
  let stateData: { userId: string; provider: string; nonce: string }
  try {
    const { payload } = await jwtVerify(stateParam, JWT_SECRET)
    stateData = payload as any
    if (stateData.provider !== provider) throw new Error('Provider mismatch')
  } catch {
    return NextResponse.redirect(`${REDIRECT_BASE}&error=invalid_state`)
  }

  // Tokens holen
  const tokens = await exchangeCode(provider, code)
  if (!tokens) {
    return NextResponse.redirect(`${REDIRECT_BASE}&error=token_exchange_failed`)
  }

  // User laden
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, organization_id')
    .eq('id', stateData.userId)
    .single()

  if (!user) {
    return NextResponse.redirect(`${REDIRECT_BASE}&error=user_not_found`)
  }

  // Speichern
  await supabaseAdmin
    .from('user_integrations')
    .upsert({
      user_id: user.id,
      organization_id: user.organization_id,
      provider,
      access_token_enc: encryptToken(tokens.accessToken),
      refresh_token_enc: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
      token_expires_at: tokens.expiresAt,
      account_email: tokens.email ?? null,
      scopes: tokens.scopes,
      is_active: true,
      last_error: null,
    }, { onConflict: 'user_id,provider' })

  logger.info('Integration connected', { provider, userId: user.id })

  // Cookie löschen
  const response = NextResponse.redirect(`${REDIRECT_BASE}&success=${provider}`)
  response.cookies.delete('oauth_state')
  return response
}

async function exchangeCode(provider: string, code: string) {
  try {
    if (provider === 'google') {
      const client = getGoogleClient()
      const { tokens } = await client.getToken(code)

      let email: string | undefined
      if (tokens.id_token) {
        const ticket = await client.verifyIdToken({ idToken: tokens.id_token })
        email = ticket.getPayload()?.email
      }

      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scopes: tokens.scope?.split(' ') ?? [],
        email,
      }
    }

    if (provider === 'microsoft') {
      const msalClient = getMSALClient()
      const result = await msalClient.acquireTokenByCode({
        code,
        scopes: MICROSOFT_SCOPES_PHASE1,
        redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/integrations/callback?provider=microsoft`,
      })

      return {
        accessToken: result.accessToken,
        refreshToken: (result as any).refreshToken ?? null,
        expiresAt: result.expiresOn?.toISOString() ?? null,
        scopes: result.scopes,
        email: result.account?.username,
      }
    }
  } catch (err) {
    return null
  }
}
```

---

## Aufgabe 6 — MCP-Client

`src/lib/integrations/mcp-client.ts`

```typescript
import { experimental_createMCPClient as createMCPClient } from 'ai'
import { CoreTool } from 'ai'
import { getValidGoogleToken } from './google'
import { getValidMicrosoftToken } from './microsoft'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const logger = createLogger('integrations/mcp-client')

export async function buildMCPContext(userId: string): Promise<{
  tools: Record<string, CoreTool>
  cleanup: () => Promise<void>
}> {
  const { data: integrations } = await supabaseAdmin
    .from('user_integrations')
    .select('provider')
    .eq('user_id', userId)
    .eq('is_active', true)

  const clients: Array<{ client: any; name: string }> = []
  const allTools: Record<string, CoreTool> = {}

  for (const integration of integrations ?? []) {
    try {
      let token: string | null = null

      if (integration.provider === 'google') {
        token = await getValidGoogleToken(userId)
      } else if (integration.provider === 'microsoft') {
        token = await getValidMicrosoftToken(userId)
      }

      if (!token) continue

      // WICHTIG: genaue Transport-Konfiguration gegen offizielle
      // Google Drive MCP + Microsoft Graph MCP Docs verifizieren beim Build
      const client = await createMCPClient({
        transport: {
          type: 'http',
          url: getMCPServerUrl(integration.provider),
          headers: { Authorization: `Bearer ${token}` },
        },
      })

      const tools = await client.tools()

      // Tools mit Provider-Prefix mergen (verhindert Kollisionen)
      for (const [name, tool] of Object.entries(tools)) {
        allTools[`${integration.provider}__${name}`] = tool
      }

      clients.push({ client, name: integration.provider })
    } catch (err) {
      logger.error('MCP client init failed', { provider: integration.provider, err })
    }
  }

  return {
    tools: allTools,
    cleanup: async () => {
      for (const { client, name } of clients) {
        try {
          await client.close()
        } catch (err) {
          logger.error('MCP client cleanup failed', { name, err })
        }
      }
    },
  }
}

function getMCPServerUrl(provider: string): string {
  // URLs gegen offizielle MCP-Server-Dokumentation verifizieren
  const urls: Record<string, string> = {
    google: process.env.GOOGLE_DRIVE_MCP_URL ?? 'https://mcp.googleapis.com/drive',
    microsoft: process.env.MICROSOFT_GRAPH_MCP_URL ?? 'https://graph.microsoft.com/mcp',
  }
  return urls[provider] ?? ''
}
```

---

## Aufgabe 7 — /api/chat/mcp Route

`src/app/api/chat/mcp/route.ts`

```typescript
import { NextRequest, after } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { buildMCPContext } from '@/lib/integrations/mcp-client'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { getOrgSystemPrompt } from '@/lib/chat/system-prompt'
import { createLogger } from '@/lib/logger'

const logger = createLogger('chat/mcp')

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const budget = await checkBudget(user.organization_id, 'claude-sonnet')
  if (!budget.allowed) return budgetExhaustedResponse()

  const { messages } = await req.json()

  const { tools, cleanup } = await buildMCPContext(user.id)

  const systemPrompt = await getOrgSystemPrompt(user)

  // after() schließt Verbindungen nach Stream-Ende (Next.js 15+)
  after(cleanup())

  // VERIFY beim Build: convertToModelMessages API gegen AI SDK v6 Docs prüfen
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: convertToModelMessages(messages),
    tools,
    system: systemPrompt,
    maxOutputTokens: 8096,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
```

---

## Aufgabe 8 — Chat-Route Selektion

```typescript
// GET /api/integrations/route.ts
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  const { data: integrations } = await supabaseAdmin
    .from('user_integrations')
    .select('provider, account_email, is_active, created_at')
    .eq('user_id', user.id)

  return Response.json({
    hasActive: integrations?.some(i => i.is_active) ?? false,
    integrations: integrations ?? [],
  })
}

// DELETE /api/integrations?provider=google
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()

  const provider = req.nextUrl.searchParams.get('provider')
  if (!provider) return Response.json({ error: 'provider required' }, { status: 400 })

  await supabaseAdmin
    .from('user_integrations')
    .update({ is_active: false, access_token_enc: '', refresh_token_enc: null })
    .eq('user_id', user.id)
    .eq('provider', provider)

  return Response.json({ success: true })
}
```

Im WorkspaceLayout / useWorkspaceState:
```typescript
const chatEndpoint = hasActive
  ? '/api/chat/mcp'
  : '/supabase/functions/v1/ai-chat'  // Edge Function bleibt unverändert
```

---

## Aufgabe 9 — Settings UI

Tab "Integrationen" in `/settings`:

```tsx
// src/components/settings/IntegrationenSection.tsx

const INTEGRATIONS = [
  {
    provider: 'google',
    name: 'Google Drive',
    description: 'Lese und schreibe Dokumente direkt im Chat',
    widgets: ['Kalender Heute', 'Meeting-Vorbereitung'],
  },
  {
    provider: 'microsoft',
    name: 'Microsoft 365',
    description: 'OneDrive, Teams, Outlook',
    widgets: ['E-Mail Prioritäten', 'Meeting-Notizen'],
  },
]

const COMING_SOON = ['Notion', 'Slack', 'HubSpot']

export function IntegrationenSection() {
  const { data } = useIntegrations()

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Integrationen</h2>
      <p className="settings-hint" style={{ marginBottom: 24 }}>
        Verbinde deine Apps mit Toro.
      </p>

      <div className="integrations-list">
        {INTEGRATIONS.map(integration => {
          const connected = data?.integrations?.find(
            i => i.provider === integration.provider && i.is_active
          )

          return (
            <div key={integration.provider} className="integration-item">
              <div className="integration-item-info">
                <div>
                  <span className="integration-item-name">{integration.name}</span>
                  <span className="integration-item-desc">{integration.description}</span>
                  {connected && (
                    <span className="integration-item-email">{connected.account_email}</span>
                  )}
                </div>
              </div>

              <div className="integration-item-action">
                {connected ? (
                  <>
                    <span className="integration-status integration-status--active">
                      <Circle size={8} weight="fill" color="var(--accent)" />
                      Verbunden
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => disconnect(integration.provider)}
                    >
                      Trennen
                    </button>
                  </>
                ) : (
                  <a
                    href={`/api/auth/integrations/connect?provider=${integration.provider}`}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={13} weight="bold" />
                    Verbinden
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="integration-coming-soon">
        <span className="integration-coming-soon-label">Demnächst:</span>
        {COMING_SOON.map(name => (
          <span key={name} className="chip">{name}</span>
        ))}
      </div>

      <div className="settings-info-box">
        <Info size={14} weight="bold" color="var(--text-tertiary)" />
        <p>
          Toro liest nur was für deine Aktionen nötig ist.
          Datei-Inhalte werden nie gespeichert.
          Du kannst Verbindungen jederzeit trennen.
        </p>
      </div>
    </div>
  )
}
```

---

## .env.example ergänzen

```bash
# MCP-Integrationen
INTEGRATION_ENCRYPTION_KEY=   # openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
# MCP-Server URLs (gegen offizielle Docs verifizieren beim Build)
GOOGLE_DRIVE_MCP_URL=
MICROSOFT_GRAPH_MCP_URL=
```

---

## Abschluss-Checkliste

```bash
pnpm add google-auth-library @azure/msal-node @ai-sdk/mcp
pnpm tsc --noEmit
pnpm lint
supabase db push
```

OAuth:
- [ ] Google OAuth-App angelegt (manuell)
- [ ] Microsoft Azure App-Registrierung (manuell)
- [ ] INTEGRATION_ENCRYPTION_KEY in .env
- [ ] Crypto fail-fast beim Start ohne Key
- [ ] HMAC-JWT als state Parameter
- [ ] httpOnly-Cookie gespiegelt
- [ ] State-Verifikation im Callback
- [ ] Token-Exchange funktioniert
- [ ] account_email gespeichert

Token-Management:
- [ ] AES-256-GCM Verschlüsselung
- [ ] Atomares DB-Update beim Refresh
- [ ] Race-Condition getestet

MCP:
- [ ] buildMCPContext lädt aktive Integrationen
- [ ] Tool-Namen mit Provider-Prefix (google__search_files)
- [ ] cleanup() schließt alle Verbindungen
- [ ] stopWhen: stepCountIs(5) verhindert Loops

Chat-Route:
- [ ] /api/chat/mcp Route funktioniert
- [ ] Edge Function bleibt unverändert
- [ ] Chat-Client wählt richtige Route
- [ ] Budget-Check vor MCP-Call

Settings:
- [ ] Tab "Integrationen" in Settings
- [ ] Google: Verbinden/Trennen
- [ ] Microsoft: Verbinden/Trennen
- [ ] account_email sichtbar wenn verbunden
- [ ] "Demnächst" Sektion
- [ ] DSGVO-Hinweis

Sicherheit:
- [ ] after() statt waitUntil in /api/chat/mcp
- [ ] Rate Limiting auf /api/auth/integrations/connect (5/Min)
- [ ] integration_log Tabelle + RLS
- [ ] integration_log APPEND ONLY (kein UPDATE/DELETE)
- [ ] account_email NIEMALS in Logs (PII)
- [ ] CLAUDE.md aktualisiert

---

## Referenz

```
src/lib/integrations/
src/app/api/auth/integrations/
src/app/api/chat/mcp/route.ts
src/app/api/integrations/route.ts
src/components/settings/IntegrationenSection.tsx
docs/superpowers/specs/2026-03-26-mcp-integrations-design.md
```
