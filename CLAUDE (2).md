# Tropen OS – CLAUDE.md
> Single source of truth für alle AI-Tools. Immer aktuell halten.
> Letzte Aktualisierung: März 2026

---

## Was ist Tropen OS?

**Responsible AI Workspace für den Mittelstand.**

Mittelständische Teams (20–200 MA) bekommen einen AI-Workspace, bei dem Geschäftsführung und IT jederzeit sehen, wer welches Modell wofür nutzt – und was es kostet.

**Kein Self-Hosting. Cloud-first. DSGVO-konform.**

---

## Zielkunde

- KMU / Mittelstand, 20–200 Mitarbeiter
- Kein eigenes AI-Team
- Bedenken: Datenschutz, Kosten, Kontrollverlust
- Entscheider: Geschäftsführung + IT-Leitung

---

## Kern-Versprechen

> "Tropen OS gibt Teams einen AI-Workspace, bei dem die Geschäftsführung jederzeit sieht, wer welches Modell wofür nutzt – und was es kostet."

---

## Tech Stack (MVP)

| Layer | Tool | Details |
|---|---|---|
| Frontend | Webflow | Später Designer, erstmal funktional |
| Auth + DB | Supabase | Cloud EU (Frankfurt), Row Level Security |
| AI-Workflows | Dify | Cloud, kein Self-Hosting |
| Modell-API | OpenAI / Anthropic direkt | Kein LiteLLM im MVP |
| Edge Functions | Supabase Edge Functions (Deno) | Governance-Logik |
| Hosting | Alles managed | Kein eigener Server |

**Später (ab Phase 2):** LiteLLM als Model-Gateway wenn Multi-Modell-Switching nötig.

---

## Rollen

| Rolle | Kann |
|---|---|
| **Owner** | Alles – Workspace einrichten, Abonnement, alle Daten |
| **Admin** | User verwalten, Modelle freigeben, Budget setzen |
| **Member** | AI-Workspace nutzen, eigene Nutzung sehen |
| **Viewer** | Lesen, nicht interagieren (z.B. Controlling) |

RLS in Supabase sichert diese Trennung auf DB-Ebene ab.

---

## Datenbankschema

### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  budget_limit NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### workspaces
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  allowed_models TEXT[] DEFAULT '{}',
  budget_limit NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### workspace_members
```sql
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  PRIMARY KEY (workspace_id, user_id)
);
```

### conversations
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model_used TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_eur NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### model_catalog
```sql
CREATE TABLE model_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  provider TEXT CHECK (provider IN ('openai', 'anthropic', 'mistral', 'google')),
  cost_per_1k_input NUMERIC(10,6) NOT NULL,
  cost_per_1k_output NUMERIC(10,6) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### usage_logs
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  model_id UUID REFERENCES model_catalog(id),
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_eur NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Seed-Daten (model_catalog)

```sql
INSERT INTO model_catalog (name, provider, cost_per_1k_input, cost_per_1k_output, description) VALUES
('gpt-4o', 'openai', 0.005, 0.015, 'OpenAI GPT-4o – leistungsstark, multimodal'),
('gpt-4o-mini', 'openai', 0.000150, 0.000600, 'OpenAI GPT-4o Mini – schnell & günstig'),
('claude-sonnet-4-5', 'anthropic', 0.003, 0.015, 'Anthropic Claude Sonnet – ausgewogen'),
('claude-haiku-4-5', 'anthropic', 0.00025, 0.00125, 'Anthropic Claude Haiku – sehr günstig');
```

---

## Row Level Security (RLS)

```sql
-- Users sehen nur ihre eigene Organisation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_org" ON users
  FOR ALL USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Workspaces nur innerhalb der Organisation
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_own_org" ON workspaces
  FOR ALL USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Workspace-Zugang nur für Mitglieder
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_members_access" ON workspace_members
  FOR ALL USING (user_id = auth.uid() OR (
    SELECT role FROM users WHERE id = auth.uid()
  ) IN ('admin', 'owner'));

-- Conversations nur für Workspace-Mitglieder
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_workspace_members" ON conversations
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Messages folgen Conversations
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_via_conversations" ON messages
  FOR ALL USING (conversation_id IN (
    SELECT id FROM conversations WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

-- Usage Logs: Member sieht eigene, Admin/Owner sieht alle der Org
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_logs_member" ON usage_logs
  FOR SELECT USING (
    user_id = auth.uid() OR (
      organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'owner')
    )
  );
```

---

## Edge Function: ai-chat

Liegt in `supabase/functions/ai-chat/index.ts`

**Was sie macht (in Reihenfolge):**
1. JWT prüfen → User identifizieren
2. User-Profil + Organisation laden
3. Workspace-Mitgliedschaft prüfen (kein Viewer-Zugang)
4. Modell-Erlaubnis prüfen (allowed_models des Workspace)
5. Modell aus model_catalog laden (für Kosten)
6. Budget prüfen – Organisation UND Workspace
7. User-Nachricht in messages speichern
8. Dify API aufrufen
9. Kosten berechnen
10. Assistant-Antwort speichern
11. usage_logs schreiben
12. Antwort + Budget-Status zurückgeben

**Umgebungsvariablen (in Supabase Dashboard setzen):**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=...
```

---

## Projektstruktur

```
tropen-os/
├── CLAUDE.md                    ← diese Datei
├── supabase/
│   ├── functions/
│   │   └── ai-chat/
│   │       └── index.ts         ← Edge Function
│   └── migrations/
│       └── 001_initial.sql      ← alle CREATE TABLE + RLS
├── src/
│   ├── app/                     ← Next.js App Router (später)
│   ├── components/              ← UI Komponenten (später)
│   └── lib/
│       ├── supabase.ts          ← Supabase Client
│       └── types.ts             ← TypeScript Typen
└── .env.local                   ← Secrets (nie committen)
```

---

## MVP Phasen

### Phase 1 – Fundament (jetzt)
- [ ] Supabase Projekt erstellen (EU Frankfurt)
- [ ] SQL Migrations ausführen
- [ ] RLS Policies aktivieren
- [ ] model_catalog befüllen
- [ ] Edge Function deployen
- [ ] Edge Function lokal testen

### Phase 2 – Governance Dashboard
- [ ] Kosten-Übersicht pro Organisation
- [ ] Kosten pro User / Workspace
- [ ] Modellkatalog-Verwaltung (Admin)
- [ ] Budget-Limits setzen (Admin)
- [ ] Usage-Logs einsehen

### Phase 3 – Workspace UI
- [ ] Login / Auth Flow
- [ ] Workspace-Auswahl
- [ ] Chat-Interface
- [ ] Dokument-Upload (RAG)

### Phase 4 – Webflow + Designer
- Erst hier kommt das visuelle Design

---

## Was wir NICHT bauen (MVP)

- ❌ Self-Hosting / eigene Server
- ❌ LiteLLM (kommt später)
- ❌ OpenDesk / kompletter Arbeitsplatz
- ❌ Mobile App
- ❌ Eigene Modelle / Fine-Tuning
- ❌ CO₂-Tracking (Phase 6)

---

## Wichtige Entscheidungen (und warum)

| Entscheidung | Grund |
|---|---|
| Cloud-first, kein Self-Hosting | Sicherheit, Wartbarkeit, Speed to Market |
| Supabase statt eigenes Backend | Auth + DB + RLS + Edge Functions in einem |
| Dify Cloud statt self-hosted | Kein DevOps-Aufwand im MVP |
| Webflow als Frontend | Designer-Workflow, kein React-Chaos |
| Kein LiteLLM im MVP | Unnötige Komplexität bevor Kunden da sind |

---

## Developer Tools & Plugins

### MCP Server (global, läuft als separater Prozess)
- **Context7** – live Doku-Lookup für Next.js, Supabase, Tremor, Dify
  `npx @upstash/context7-mcp`

### Claude Code Plugins (user-scope, immer aktiv)
- **Frontend Design** – Production-grade UI, verhindert generisches AI-Look
- **Superpowers v4.3.1** – TDD, Debugging, Brainstorming, Subagent-Patterns
- **Code Review** – Security, RLS-Fehler, schlechte Patterns erkennen
- **Supabase Plugin** – RLS, Edge Functions, Migrations direkt
- **Vercel Plugin** – Deploy-Workflows

### Code-Qualität
- **ESLint 9** – eingerichtet (`eslint.config.mjs`, flat config, 0 errors)
- **Prettier** – eingerichtet (`.prettierrc`: single quotes, no semi, no trailing comma)
- Scripts: `npm run format`, `npm run lint:fix`

### Konventionen
- Jede Seite die angefasst wird gleichzeitig auf Tailwind migrieren
- Code Review Plugin vor jedem Vercel-Deploy ausführen
- Context7 nutzen wenn Supabase RLS oder Tremor-Doku unklar

---

## Toro – KI-Assistent

- Toro ist ein **Papagei** 🦜 – kein Baum-Icon, kein Toro-SVG mehr
- Überall wo Toro auftritt: `<span style={{ fontSize: Xpx }}>🦜</span>` verwenden
- Toro-Beschreibung: „Toro, dein KI-Papagei – er kennt jeden Pfad durch den Informationsdschungel."
- Guide-Name ist konfigurierbar über `organization_settings.ai_guide_name` (Default: „Toro")

---

## CO₂-Framework

### CO2_FACTORS (g CO₂ pro 1k gewichtete Tokens)
| Modellklasse | min | max |
|---|---|---|
| fast | 0.1 g | 0.3 g |
| deep | 0.5 g | 2.0 g |
| safe | 0.2 g | 0.8 g |

**Gewichtungsformel:** `weight = tokens_input + 2 × tokens_output`
**CO₂ je Log:** `(weight / 1000) × factor`
**Anzeige:** Range „X – Y g CO₂" im Dashboard (KPI-Karte, Zeitraum-Filter). Link → `/responsible-ai`.

### Route `/responsible-ai`
- Platzhalter-Seite: Titel, Text, Status-Badge, Toro-Zitat, Back-Link
- Kein eigenes Layout – Standard-NavBar

---

## Neue Datenbank-Tabellen (Migration 007)

### organization_settings
```sql
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#14b8a6',
  organization_display_name TEXT,
  ai_guide_name TEXT DEFAULT 'Toro',
  ai_guide_description TEXT DEFAULT 'Dein KI-Guide durch den Informationsdschungel',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
```

### user_preferences
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  chat_style TEXT DEFAULT 'structured'
    CHECK (chat_style IN ('clear', 'structured', 'detailed')),
  model_preference TEXT DEFAULT 'auto'
    CHECK (model_preference IN ('cheapest', 'eu_only', 'auto')),
  visible_tabs TEXT[] DEFAULT ARRAY['workspaces','dashboard','models','budget','logs','users'],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: user_id = auth.uid()
-- Zusätzliche Policy auf users: FOR INSERT WITH CHECK (id = auth.uid())
```

---

## Onboarding & Co-Branding

- Wizard `/onboarding` (4 Schritte): Schritt 1–2 Owner/Admin, 3–4 alle User
- Guard in `src/proxy.ts`: prüft `user_preferences.onboarding_completed`, Cookie `onboarding_done=1`
- NavBar: lädt `organization_settings`, zeigt Logo + Org-Name + CSS-Variable `--primary-color`
- Admin `/admin/branding`: Branding-Einstellungen + White-Label-Teaser

---

## Konventionen

- Sprache im Code: Englisch
- Kommentare: Deutsch ok
- Commits: Deutsch ok
- Alle Secrets in `.env.local`, nie committen
- Supabase Service Role Key nur in Edge Functions, nie im Client
