# Tropen OS – Architektur & Konventionen

> Einzige Quelle der Wahrheit für Claude Code.

## Tech Stack

| Technologie | Version | Hinweis |
|-------------|---------|---------|
| Next.js | ^16.1.6 | App Router, `'use client'` wo nötig |
| React | ^19 | |
| TypeScript | ^5 | |
| Tailwind CSS | ^3.4 | nur global styles, Seiten nutzen inline `s`-Objekte |
| Supabase | @supabase/ssr + supabase-js | Auth + DB + Storage |
| pnpm | — | Package Manager |

## Code-Regeln

- Inline-Styles: alle Seiten nutzen `const s: Record<string, React.CSSProperties>`
- Farben: CSS-Variablen aus `globals.css` — `var(--bg-base)` Background, `var(--accent)` Gelbgrün (Primär), `var(--text-primary)` Text
- Farbpalette: Dschungel-Dunkelgrün (`--bg-base: #0d1f16`, `--bg-surface: #134e3a`), Akzent (`--accent: #a3b554`)
- DB-Zugriff Client: immer `createClient()` aus `@/utils/supabase/client`
- DB-Zugriff Server/API: `supabaseAdmin` aus `@/lib/supabase-admin` (Service Role, bypasses RLS)
- Migrations: `supabase/migrations/00X_name.sql` — fortlaufend nummeriert

## Dify Integration

- App-Typ: **Chatflow** (nicht Workflow) — App-Name: `tropen-os-chat-v2`
- Endpoint: `POST /v1/chat-messages`
- Gedächtnis: Dify-intern, Fenstergröße via `memory_size` Input (aus `user_preferences.memory_window`)
- `conversation_id`: wird von Dify in `message_end` zurückgegeben und in `conversations.dify_conversation_id` gespeichert
- Beim ersten Request: `conversation_id` weglassen (null) → Dify erstellt neues Gespräch
- Ab zweitem Request: `conversation_id` mitsenden → Dify erinnert sich
- Workflow-App `tropen-os-jungle-order` bleibt separat für Jungle Order Feature (eigener Key: `DIFY_JUNGLE_ORDER_KEY`)
- Env-Var: `DIFY_API_KEY` = Key der Chatflow-App `tropen-os-chat-v2` (in Supabase Secrets)

## Supabase-Schema (relevante Tabellen)

- `users`: id, organization_id, email, full_name, role
- `user_preferences`: user_id, chat_style, model_preference, onboarding_completed,
  `ai_act_acknowledged` BOOLEAN, `ai_act_acknowledged_at` TIMESTAMPTZ
- `organization_settings`: organization_id, organization_display_name, logo_url, primary_color, ai_guide_name
- `conversations`: id, workspace_id, user_id, title, task_type, project_id, created_at
- `projects`: id, workspace_id, name, display_order, created_at
- `messages`: id, conversation_id, role, content, model_used, cost_eur, created_at

## Compliance & AI Act

- User müssen AI Act Acknowledgement im Onboarding bestätigen (Schritt 4 von 5)
- Gespeichert in `user_preferences.ai_act_acknowledged` + `ai_act_acknowledged_at`
- Pflichtfeld: Weiter-Button bleibt deaktiviert bis Checkbox gesetzt
- Verweis auf Tropen Academy: https://tropen.de/academy
- Kurs: "KI-Dschungel Survival Pass"
- Rechtliche Grundlage: EU AI Act Artikel 4 (KI-Kompetenzpflicht)

## Onboarding-Schritte

| Schritt | Inhalt | Sichtbar für |
|---------|--------|-------------|
| 1 | Organisation (Name, Logo, Farbe, Guide-Name) | Admin/Owner |
| 2 | Team-Größe + Einladungen | Admin/Owner |
| 3 | Persönlicher Stil (Name, Antwortstil, Modell) | alle |
| 4 | AI Act & Verantwortungsvolle Nutzung (Pflicht-Checkbox) | alle |
| 5 | Fertig / Willkommen | alle |

Members starten bei Schritt 3 (totalSteps = 3), Admins bei Schritt 1 (totalSteps = 5).

## Ordnung im Dschungel

### Edge Function: jungle-order
- `action: "structure"` → analysiert ungrouped Conversations → Projektstruktur-Vorschlag via Dify
- `action: "merge"` → lädt Messages der ausgewählten Chats → Zusammenfassung via Dify → neuer Chat
- Separate Dify App: `tropen-os-jungle-order` (Workflow-Typ, nicht Chatflow)
- Setup-Anleitung: `docs/dify-jungle-order-setup.md`
- Env-Var: `DIFY_JUNGLE_ORDER_KEY=app-...` (in .env.local + Supabase Secrets)

### Soft Delete
- `conversations.deleted_at` → NULL = aktiv, Timestamp = im Papierkorb
- `conversations.merged_into` → UUID des Ziel-Chats nach Zusammenführung
- Papierkorb: 30 Tage, dann `cleanup_deleted_conversations()` (Supabase Cron oder manuell)
- **Alle Conversation-Queries müssen `.is('deleted_at', null)` filtern** (Ausnahme: Papierkorb-Query)

### Multi-Select
- ☑ Button in Sidebar aktiviert Multi-Select-Modus
- Checkboxen ersetzen Drag-Handle; Escape beendet Modus
- Aktionsleiste (fixed, bottom) erscheint ab 2 ausgewählten Chats
- Aktionen: Zusammenführen (Merge-Modal) · Löschen (soft) · In Projekt verschieben

### Medien-Ordner
- Vorgemerkt für Phase 3 (wartet auf Datei-Upload Feature)
- `conversations.has_files` + `file_types` Spalten bereits vorhanden (010_jungle_order.sql)
- UI-Teaser in Sidebar eingebaut (kein Button, kein Click-Handler)

### Coming Soon (nicht bauen)
- Medien-Ordner (wartet auf Datei-Upload)
- Chat-Block-Sharing
- Gemeinsame Ordner im Team (Phase 3)

## Umgebungsvariablen (.env.local)

```env
# Supabase (öffentlich – sicher für Client)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase Service Role – NUR server-seitig (API Routes), nie im Client!
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Site URL (für Magic-Link Redirect bei Einladungen)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Dify Cloud
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-...

# Resend – für Supabase SMTP (Transaktions-E-Mails)
# Wert: API-Key aus resend.com Dashboard (beginnt mit re_...)
RESEND_API_KEY=re_...
```

> `RESEND_API_KEY` wird **nicht** direkt von Next.js verwendet – er wird im Supabase Dashboard
> unter Authentication → SMTP Settings als SMTP-Passwort eingetragen (siehe docs/email-setup.md).

---

## Supabase SMTP – Resend (manuell im Dashboard eintragen)

Unter **Supabase Dashboard → Authentication → Settings → SMTP**:

| Feld | Wert |
|------|------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `[RESEND_API_KEY]` (beginnt mit `re_...`) |
| Sender Email | `onboarding@resend.dev` *(Testdomain, später eigene Domain)* |
| Sender Name | `Tropen OS` |

→ Vollständige Setup-Anleitung inkl. Domain-Migration: `docs/email-setup.md`

---

## Email Templates (Supabase Dashboard → Authentication → Email Templates)

### Einladung (Invite user)

**Betreff:**
```
🦜 Du wurdest eingeladen – Tropen OS
```

**Body (HTML aus):**
```
Hallo,

du wurdest eingeladen, einem Workspace auf Tropen OS beizutreten.
Klicke auf den Link um dein Konto zu aktivieren:

{{ .ConfirmationURL }}

Toro freut sich auf dich. 🦜
– Das Tropen OS Team
```

### Passwort-Reset (Reset password)

**Betreff:**
```
🦜 Passwort zurücksetzen – Tropen OS
```

**Body (HTML aus):**
```
Hallo,

du hast einen Passwort-Reset angefordert.

{{ .ConfirmationURL }}

Falls du das nicht warst, ignoriere diese Mail.
– Das Tropen OS Team
```

---

## Superadmin-Tool (Tropen-intern)

- Route: `/superadmin/clients` – nur für `role = 'superadmin'`
- Kein Link in NavBar – direkte URL-Eingabe (`/superadmin/clients`)
- Layout-Guard: `src/app/superadmin/layout.tsx` prüft role auf Server-Seite
- Middleware: `/superadmin/*` bypassed Onboarding-Guard (Layout übernimmt Auth)
- Tropen-Account einmalig per SQL auf superadmin setzen:
  ```sql
  UPDATE users SET role = 'superadmin' WHERE email = 'hello@tropen.de';
  ```
- Migration: `011_superadmin.sql` – erweitert `users_role_check` um `'superadmin'`

### Was das Tool tut
- `GET /api/superadmin/clients` → alle Orgs mit Workspaces, Settings, Users
- `POST /api/superadmin/clients` → Org + Workspace + organization_settings anlegen + Owner einladen
- Kein öffentliches Signup – Owner-Accounts werden ausschließlich durch Tropen angelegt

### Client anlegen – Ablauf
1. `/superadmin/clients/new` ausfüllen: Firma, Plan, Budget, Workspace, Owner-Email
2. API legt an: `organizations` → `workspaces` → `organization_settings` → `inviteUserByEmail`
3. Owner bekommt Einladungsmail (Resend via Supabase SMTP)
4. Owner klickt Link → `/auth/callback` → `/onboarding` (Schritte 1–5 als Admin)
5. Neu angelegte Org erscheint sofort in `/superadmin/clients`

---

## Migrations-Übersicht

| Datei | Inhalt |
|-------|--------|
| 001_initial.sql | Schema-Grundlage |
| 002_rls.sql | Row Level Security |
| 003_seed.sql | Seed-Daten |
| 004_invite_policies.sql | Einladungs-Policies |
| 005_budget_rpc.sql | Budget-Funktionen |
| 006_conversations_task_type.sql | task_type Spalte |
| 007_onboarding.sql | Onboarding-Felder |
| 008_projects.sql | projects-Tabelle + project_id in conversations |
| 009_ai_act.sql | ai_act_acknowledged + ai_act_acknowledged_at in user_preferences |
| 010_jungle_order.sql | deleted_at, deleted_by, merged_into, has_files, file_types in conversations + cleanup_deleted_conversations() |
| 011_superadmin.sql | role-Check um 'superadmin' erweitert |
| 012_fix_budget_rpc.sql | check_and_reserve_budget: FOR UPDATE von Aggregat auf Einzelzeile verschoben (PG-Fehler) |
| 013_memory_window.sql | memory_window INTEGER in user_preferences |
| 014_rls_audit.sql | RLS-Audit: messages auf SELECT-only, conversations granulare Policies (SELECT/INSERT/UPDATE/DELETE) |
| 015_thinking_mode.sql | thinking_mode BOOLEAN in user_preferences (experimentell, noch nicht in Edge Function) |

---

## Zwischenstand 2026-03-07 — Offene Bugs & nächste Schritte

### ✅ Erledigt heute
- **Workspace-Redesign**: page.tsx (2067 Zeilen) aufgeteilt in 13 Komponenten (useWorkspaceState, WorkspaceLayout, LeftNav, ChatArea, EmptyState, ChatMessage, ChatInput, ProjectSidebar, ConvItem, Papierkorb, JungleModal, MergeModal, ConditionalNavBar)
- **Phase-2-Redesign**: Kimi-Style 3-Column Layout, 240px LeftNav, Start Screen, Mobile
- **Bug Fix**: `check_and_reserve_budget` RPC — `FOR UPDATE` mit Aggregat-Funktion ist in PostgreSQL ungültig → Migration 012 deployed
- **Bug Fix**: `workspace_members`-Eintrag fehlte für neue Org-Owner nach Onboarding → `api/onboarding/complete` ergänzt
- **Dashboard**: Superadmin sieht jetzt alle Orgs (supabaseAdmin statt RLS-gefilterter Client)

### 🔴 Kritischer Bug: Edge Function speichert nichts nach Chat

**Symptom**: User sieht KI-Antworten im Chat, aber:
- Keine `role: 'assistant'` Einträge in `messages`
- Keine Einträge in `usage_logs`
- `dify_conversation_id` bleibt `null` → kein Gesprächsgedächtnis

**Root Cause (gefunden, noch nicht gefixt)**:
Die Dify-App ist ein **Workflow-Typ**, kein Chatflow. Workflow-Apps senden `workflow_finished` statt `message_end` am Ende des Streams. Die Edge Function (`supabase/functions/ai-chat/index.ts`) wartet auf `parsed.event === "message_end"` — dieser Event kommt bei Workflow-Apps nie.

**Beweis**: Direkter Dify-API-Test gibt zurück: `workflow_started`, `node_started`, `node_finished`, `message` (Chunks), aber kein `message_end`.

**Nächster Schritt**: In `ai-chat/index.ts` den `message_end`-Block durch `workflow_finished` ersetzen (oder ergänzen). Token-Nutzung bei Workflow-Apps liegt in `data.total_tokens` statt `metadata.usage.prompt_tokens`.

Dify `workflow_finished` Struktur:
```json
{
  "event": "workflow_finished",
  "data": {
    "outputs": {},
    "status": "succeeded",
    "elapsed_time": 1.5,
    "total_tokens": 150
  }
}
```

**Ebenfalls zu prüfen**: Neues `workspace_members`-Eintrag für info@coratiert.de wurde per SQL manuell eingefügt — funktioniert für bestehenden User. Onboarding-Route ist jetzt für zukünftige User gefixt.
