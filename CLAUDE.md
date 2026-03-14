# Tropen OS – Architektur & Konventionen

> Einzige Quelle der Wahrheit für Claude Code.

## Arbeitsweise

### Autonomie-Level: Hoch

Wir arbeiten lokal. Kein Produktionssystem gefährdet. Claude darf ohne Rückfrage:

- Dateien erstellen, bearbeiten, löschen
- Dependencies installieren
- Git commits ausführen
- Datenbankmigrationen erstellen
- Konfigurationsdateien ändern
- Refactoring durchführen
- Bugs fixen

Claude fragt NUR bei:

- Destruktiven Aktionen die nicht rückgängig zu machen sind (z.B. Datenbank leeren)
- Grundlegenden Architekturentscheidungen die das Gesamtsystem betreffen
- Wenn zwei Lösungswege gleichwertig sind und Timms Präferenz wichtig ist

---

## Nutzerbedürfnisse & Konsequenzen

### Was Nutzer lieben – unser Status

| Bedürfnis | Status |
|-----------|--------|
| Gute Beratung statt nur Antwort | ✅ Erledigt – Toro ist Berater |
| Transparenz über Kosten und Modelle | ✅ Erledigt – SessionPanel |
| Memory mit Kontrolle | ✅ Erledigt – `user_preferences` editierbar |
| Breite Einsatzmöglichkeiten | ✅ Erledigt – Task-Modal und Pakete |
| Real-Time Websuche | 🔜 Geplant V2 |
| Voice Output | 🔜 Dify hat es, UI fehlt |
| Multimodalität und Dateiupload | 🔜 UI fehlt |

### Was Nutzer hassen – unsere Antwort

| Problem | Unsere Lösung |
|---------|---------------|
| Zerbrechliche Sessions | ✅ Gelöst – Dify-Gedächtnis ab Nachricht 2 |
| Unklare Datenschutz-Story | ✅ AVV, Training-Opt-Out, EU-Server |
| Intransparente Filter | ✅ Toro Guard erklärt Ablehnungen |
| Überaggressive Filter | 🔧 To-Do – Level-Slider statt alles/nichts |
| Kosten- und Modell-Kontrolle für B2B | 🔧 To-Do – Admin-Dashboard noch nicht gebaut |

### Drei konkrete To-Dos

#### 1. Unsicherheit aktiv markieren
Toro sagt explizit wenn er sich nicht sicher ist – niemals falsche Fakten selbstbewusst verkaufen.
Im System-Prompt verankern: *"Wenn du unsicher bist, sage es. Schlage nach oder empfehle Prüfung."*

#### 2. Proaktive aber abschaltbare Hilfe
Toro schlägt nächste Schritte vor – immer mit sichtbarem X zum Schließen.
- `user_preferences`: `proactive_hints BOOLEAN`, Default `true`
- In Settings sichtbar mit Erklärung

#### 3. Kosten-Forecast statt nur Verbrauch
SessionPanel zeigt nicht nur Verbrauch sondern hochgerechnet was der Monat kosten wird.
Warnung bei Annäherung an Schwellenwert: *"Du bist auf dem Weg zu 45€ diesen Monat – möchtest du auf Eco wechseln?"*

---

## Wissensbasis & RAG-Architektur

### Fundament
- Vector Store: **Supabase pgvector (EU)** — kein externer Vector Store
- Embedding-Modell: **OpenAI text-embedding-3-small** (1536 Dimensionen)
- Package: `openai` (bereits installiert)

### Drei Wissensebenen
| Ebene | Scope | Wer befüllt |
|-------|-------|-------------|
| Org | Alle Nutzer der Organisation | Admin |
| User | Nur der eigene Nutzer | Jeder |
| Projekt | Spezifisch für ein Projekt | Projekt-Mitglieder |

**Toro-Priorisierung beim Antworten:** Projekt → User → Org → eigenes Wissen

**Pflicht:** Quellenangabe bei jeder RAG-Antwort im Format: `Quelle: [Dokumentname] · [Datum]`

### Quellen-Roadmap
| Phase | Quellen |
|-------|---------|
| Phase 2 | Direkter Upload: PDF, DOCX, TXT, MD, CSV |
| Phase 3 | Google Drive Sync, Notion, RSS Feeds, Web-Seiten manuell |
| Phase 4 | Gmail Integration |

### Dokument-Limits pro Tier
| Tier | Max Dokumente | Max Dateigröße |
|------|--------------|----------------|
| Free | 10 | 10 MB |
| Pro User | 100 | 25 MB |
| Org Standard | 500 | 50 MB |
| Org Premium | Unbegrenzt | 100 MB |

### Phasierung
1. **Woche 1** — RAG-Fundament + Dokument-Upload
2. **Woche 2** — Wissenbasis-Struktur Org/User/Projekt
3. **Woche 3–4** — Externe Quellen (RSS, Web)

### DB-Schema (RAG)
- `knowledge_sources`: id, organization_id, user_id (null = Org), project_id (null = nicht projektspezifisch), name, type (upload/rss/web/google_drive/notion), url, sync_interval, last_synced_at, is_active, created_at
- `knowledge_documents`: id, source_id, organization_id, user_id, project_id, title, file_type, file_size, original_url, status (processing/ready/error), chunk_count, created_at
- `knowledge_chunks`: id, document_id, organization_id, user_id, project_id, content TEXT, embedding vector(1536), chunk_index, metadata JSONB, created_at
- `knowledge_citations`: id, message_id, chunk_id, relevance_score, created_at

### Edge Functions
- `knowledge-search`: query + context (org_id, user_id, project_id) → Embedding → Cosine Similarity → Top 5 Chunks mit Quellenangabe (Priorisierung: Projekt → User → Org)
- `knowledge-ingest`: Datei → Text-Extraktion → Chunking (800 Zeichen, 100 Overlap) → Embeddings → knowledge_chunks

### Migration
- **017_rag_foundation.sql** — pgvector Extension, 4 Tabellen, ivfflat Index, RLS Policies
- **018_rls_users_fix.sql** — `users_select_own` Policy + `user_org_id()` SECURITY DEFINER — behebt Knowledge Upload + NavBar Superadmin

---

## DB-ZUGRIFF: WICHTIGE CONSTRAINT

Drizzle ORM funktioniert in dieser Umgebung nicht für Queries.

- **Schema-Definition:** Drizzle (für Typen + Migrations-Referenz)
- **Alle Queries:** `supabaseAdmin.from('table').select/insert/update/delete`
- Drizzle-Typen als Mapper nach Query-Result nutzen
- `supabaseAdmin` ist konfiguriert in `src/lib/supabase-admin.ts`

---

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
- Farben: **immer** CSS-Variablen aus `globals.css` — niemals Hex-Werte hardcoden
- Farbpalette (helles Theme, Stand März 2026):
  - Background: `var(--bg-base)` = `#EAE9E5` (Beige/Sand)
  - Surface: `var(--bg-surface)` = `rgba(255,255,255,0.80)` (weißes Glas)
  - Nav: `var(--bg-nav)` = `rgba(255,255,255,0.72)`
  - Text primär: `var(--text-primary)` = `#1A1714`
  - Text sekundär: `var(--text-secondary)` = `#4A4540`
  - Text tertiär: `var(--text-tertiary)` = `#6B6560`
  - Akzent (Grün): `var(--accent)` = `#2D7A50`
  - Akzent hell: `var(--accent-light)` = `#D4EDDE`
  - Active/Selected Pill: `var(--active-bg)` = `#1A2E23` (dunkelgrüne Pill, weißer Text)
  - Border: `var(--border)` = `rgba(26,23,20,0.08)`
- **Das alte Dunkelgrün-Theme (`#0d1f16`, `#134e3a`, `#a3b554`) ist abgelöst — nicht mehr verwenden.**
- Buttons primär: `background: var(--accent)`, `color: #fff`
- Active-States: `background: var(--active-bg)`, `color: var(--active-text)`
- DB-Zugriff Client: immer `createClient()` aus `@/utils/supabase/client`
- DB-Zugriff Server/API: `supabaseAdmin` aus `@/lib/supabase-admin` (Service Role, bypasses RLS)
- Migrations: `supabase/migrations/00X_name.sql` — fortlaufend nummeriert

## Komponenten-Patterns (verbindlich — immer diese Klassen verwenden)

### Cards
```tsx
<div className="card">
  <div className="card-header">
    <span className="card-header-label">Titel</span>
    <button className="btn btn-ghost btn-sm">Aktion</button>
  </div>
  <div className="card-body">
    <span className="card-section-label">Abschnitt</span>
    {/* list-rows */}
    <div className="card-divider" />
  </div>
</div>
```
- Immer `className="card"` — nie eigene box-styles erfinden
- `border-radius: var(--radius-lg)` (14px), Glasmorphismus, `box-shadow: var(--shadow-sm)`

### Buttons
```tsx
<button className="btn btn-primary">+ Quelle</button>   // Grün, Shadow
<button className="btn btn-ghost">Einstellungen</button>  // Weißes Glas
<button className="btn btn-danger">Löschen</button>       // Rot
<button className="btn btn-sm btn-ghost">Klein</button>   // Kleiner Variant
<button className="btn-icon"><Icon /></button>             // Icon-only
```
- Immer `className="btn"` als Basis + Modifier
- Primary: `var(--accent)` Hintergrund, weißer Text, grüner Shadow
- Ghost: `rgba(255,255,255,0.80)`, Border `var(--border-medium)`

### Page-Header (jede Seite)
```tsx
<div className="page-header">
  <div className="page-header-text">
    <h1 className="page-header-title">Feed</h1>
    <p className="page-header-sub">Untertitel</p>
  </div>
  <div className="page-header-actions">
    <button className="btn btn-ghost">⚙ Einstellungen</button>
    <button className="btn btn-primary">+ Neu</button>
  </div>
</div>
```
- `page-header-title` = Plus Jakarta Sans, 26px, weight 800, letter-spacing -0.03em
- Buttons rechts, `padding-top: 4px` für vertikale Ausrichtung

### List-Rows (Sidebar-Listen, Card-Listen)
```tsx
<button className="list-row list-row--active">
  Aktiver Eintrag <span className="badge">3</span>
</button>
<button className="list-row">Inaktiver Eintrag</button>
<button className="list-row list-row--add">
  <PlusIcon /> Hinzufügen
</button>
```
- Active: `var(--active-bg)` = `#1A2E23`, weißer Text
- Add-Zeile: `var(--accent)` Farbe, grüner Hover

### Chips / Filter-Pills
```tsx
<div className="chip chip--active">Alle</div>
<div className="chip">Hoch</div>
```
- Default: weißer Hintergrund, `var(--border-medium)`
- Active: `var(--accent-light)` = `#D4EDDE`, Border `var(--accent)`

### Icons
- **Phosphor Icons** (`@phosphor-icons/react`) — immer `weight="bold"` oder `weight="fill"`
- Größen: NavBar 18px, Cards/Listen 16px, Inline-Text 14px
- Nie Emoji als funktionale Icons verwenden

### Page-Layout
```tsx
<div className="content-wide" style={{ paddingTop: 32, paddingBottom: 48 }}>
  <div className="page-header">…</div>
  {/* grid / content */}
</div>
```

## Content-Breiten (verbindlich)

Jede Seite/Layout verwendet genau eine dieser Klassen. Root-`<main>` ist unstyled.

| Klasse | Max-Width | Verwendet für |
|--------|-----------|---------------|
| `.content-max` | 1200px | Standard-Seiten (Dashboard, Settings, Admin-Seiten, Knowledge, Projects) |
| `.content-narrow` | 720px | Formular-Seiten (Login, Onboarding, Forgot-Password, Reset-Password) |
| `.content-wide` | 1400px | Superadmin-Seiten |
| `.content-full` | 100% | Chat-Interface (Workspaces) |

Responsive Padding (auto via CSS): Desktop >1280px: 48px | Tablet >768px: 24px | Mobile: 16px.

Superadmin-Layout (`src/app/superadmin/layout.tsx`) setzt `bg-surface` als Page-Background + `content-wide`.
Alle anderen Layouts/Seiten: eigenes `className="content-max"` + inline `paddingTop/paddingBottom`.

## Drawer-System & UI-Architektur

- **Chat bleibt Zentrum** — keine neuen Features stören den Chat-Bereich
- **Alle neuen Features kommen als Drawer** (kein eigener Seitenaufruf wenn vermeidbar)
- Drawer-Konventionen:
  - Backdrop: `rgba(0,0,0,0.4)`, Klick auf Backdrop schließt
  - Escape schließt immer
  - Animation: `200ms ease-out`
  - Kein Inline-Style in Drawer-Komponenten — CSS-Klassen aus `globals.css`
- Drawer-Typen: Top (Artefakte), Right (Settings), Bottom (tbd)

## Artefakte & Merkliste

- **Artefakte** entstehen aus Chat-Antworten (Code-Blöcke, Dokumente, strukturierte Outputs)
- **Chat-Header-Strip**: dünner Streifen über dem Chat, nur sichtbar wenn ≥1 Artefakt oder Lesezeichen existiert
  - Zeigt: Artefakt-Anzahl (Büroklammer-Icon), Lesezeichen-Anzahl, "→ Workspace"-Link
  - Klick öffnet Top-Drawer
- **Top-Drawer**: listet Artefakte des aktuellen Chats (Name, Typ-Icon, Datum, Download)
  - Link: "Alle Artefakte im Workspace →" am Ende
  - X-Button + Escape + Backdrop-Klick schließt
- **Lesezeichen**: Bookmark-Icon auf jeder Toro-Nachricht; Klick fügt zur Merkliste hinzu
- **`/workspace`-Seite** (neu): Grid aller Artefakte aller Chats, Filter (Typ/Projekt/Chat/Datum), Suche, Aktionen (Download, in KB, löschen)
- Icons: Phosphor Icons (`@phosphor-icons/react`)

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
- `projects`: id, workspace_id, name, description, context, tone, language, target_audience, memory, display_order, created_at, updated_at
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

### Superadmin To-Do (Stand 2026-03-12)

| Priorität | Feature | Status |
|-----------|---------|--------|
| 🔴 Hoch | Phase 2 Plan C — Workspaces + Card Engine | ⬜ Offen |
| 🔴 Hoch | Phase 2 Plan D — Chat & Context Integration | ⬜ Offen |
| 🟡 Mittel | Phase 2 Plan E — Transformations-Engine | ⬜ Offen |
| 🟡 Mittel | Phase 2 Plan F — UI (Projekte + Workspaces) | ⬜ Offen |
| 🟡 Mittel | Phase 2 Plan G — Feeds | ⬜ Offen |
| 🟢 Niedrig | Agenten-System Phase 2 (Zuweisung zu Projekten/Chats) | ⬜ Offen |
| 🟢 Niedrig | Prompt-Bibliothek Phase 3 (DB-backed, org-weit) | ⬜ Offen |
| 🟢 Niedrig | Wissenschafts-Paket | ⬜ Offen |

### Client anlegen – Ablauf
1. `/superadmin/clients/new` ausfüllen: Firma, Plan, Budget, Workspace, Owner-Email
2. API legt an: `organizations` → `workspaces` → `organization_settings` → `inviteUserByEmail`
3. Owner bekommt Einladungsmail (Resend via Supabase SMTP)
4. Owner klickt Link → `/auth/callback` → `/onboarding` (Schritte 1–5 als Admin)
5. Neu angelegte Org erscheint sofort in `/superadmin/clients`

---

## Datenbank-Migrations-Workflow

Supabase CLI ist global installiert und das Projekt ist verlinkt (Ref: `vlwivsjfmcejhiqluaav`).
Claude kann Migrationen direkt ausführen — kein manueller SQL-Editor nötig.

### Ablauf für neue Migrationen
1. Migration schreiben: `supabase/migrations/0XX_name.sql`
2. Pushen: `cd "/c/Users/timmr/tropen OS" && supabase db push`
3. Wenn eine Migration bereits manuell per SQL Editor angewendet wurde:
   `supabase migration repair --status applied <nummer>` → dann `db push`

### Bekannte Fallstricke
- `.env.local` muss Unix-Zeilenenden (LF) haben — CRLF bricht den Parser
- Alle Zeilen in `.env.local` müssen `KEY=VALUE`-Format oder `# Kommentar` sein
- Migration-Nummern sind einfache Zahlen (001, 002 ...), kein Timestamp-Format

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
| 016_smart_projects.sql | projects um description, context, tone, language, target_audience, memory, updated_at erweitert |
| 017_rag_foundation.sql | pgvector, knowledge_sources/documents/chunks/citations |
| 018_rls_users_fix.sql | users_select_own Policy + user_org_id() SECURITY DEFINER |
| 019_workspace_members_rls.sql | workspace_members RLS-Fix |
| 020_superadmin_workspace_member.sql | Superadmin als workspace_member eingetragen |
| 021_impersonation.sql | impersonation_sessions + support_access_enabled in user_preferences |
| 022_artifacts.sql | artifacts + bookmarks Tabellen |
| 023_proactive_hints.sql | proactive_hints BOOLEAN in user_preferences |
| 024_prompt_templates.sql | prompt_templates Tabelle (eigene Vorlagen) |
| 025_agents.sql | agents Tabelle (Agenten-System Phase 1) |
| 026_packages.sql | packages, package_agents, org_packages Tabellen + Marketing-Paket Seed-Daten |
| 027+ | diverse Fixes (RLS, workspace → department rename) |
| 030_projects_schema.sql | projects, project_participants, project_knowledge, project_memory (APPEND ONLY) |
| 031_workspaces_schema.sql | workspaces (Karten-basiert), workspace_participants, cards, card_history (APPEND ONLY), connections, knowledge_entries, outcomes |
| 032_support_tables.sql | dept_settings, org_knowledge, dept_knowledge, agent_assignments, transformations, transformation_links, templates |
| 033_feed_tables.sql | feed_sources, feed_schemas, feed_source_schemas, feed_items, feed_processing_log (APPEND ONLY), feed_distributions |

---

## 🗺️ Produkt-Roadmap (Stand 2026-03-12)

### ✅ Fertig

#### 🎨 Design-System
- Türkis/Teal vollständig entfernt, `var(--accent)` durchgängig
- Content-Breiten: `.content-max` 1200px · `.content-narrow` 720px · `.content-wide` 1400px — alle Seiten migriert
- Plan-Badges: Free `var(--text-tertiary)/white`, Pro `var(--accent)/white`, Enterprise `var(--active-bg)/white`
- Mindestschriftgröße 12px

#### 💬 Chat & Workspace
- Kimi-Style 3-Column Layout (LeftNav 240px, ChatArea flex, ProjectSidebar)
- Multi-Select mit iOS-"Bearbeiten"-Pattern, Merge, Soft-Delete, Papierkorb
- Jungle Order: Struktur-Vorschlag + Zusammenführen via Dify Workflow
- Prompt-Bibliothek Phase 1: 5 Core-Vorlagen + TemplateDrawer (clientseitig)

#### 📁 Smarte Projekte (Phase 1)
- `/projects` Seite mit 4 Tabs (Meine Projekte, Meine Agenten, Community, Vorlagen)
- Projekt-Felder: Kontext, Ton, Sprache, Zielgruppe, Gedächtnis (Phase 2: manuell)

#### 🧠 Phase 2 — DB-Fundament + Projekte CRUD (2026-03-12)
- **Plan A (Migrationen 030–033 + Fix-Migrationen):** projects, project_participants, project_knowledge, project_memory (APPEND ONLY), workspaces (Karten-basiert), workspace_participants, cards, card_history (APPEND ONLY), connections, knowledge_entries, outcomes, dept_settings, org_knowledge, dept_knowledge, agent_assignments, transformations, transformation_links, templates, feed_sources, feed_schemas, feed_source_schemas, feed_items, feed_processing_log (APPEND ONLY), feed_distributions — alle mit RLS deployed
- **Plan B (Projects CRUD + Gedächtnis + Context-Awareness):**
  - `GET/POST /api/projects` — department_id-basiert, auto-participant
  - `GET/PATCH/DELETE /api/projects/[id]` — Soft-Delete, meta-merge, title-Validierung
  - `GET/POST /api/projects/[id]/memory` — APPEND ONLY, type/importance/tags validiert
  - `POST /api/projects/[id]/memory/summary` — Haiku-Zusammenfassung, frozen=true, Ownership-Check
  - `src/lib/api/projects.ts` — getAuthUser() + verifyProjectAccess() shared helpers
  - `src/lib/token-counter.ts` — estimateTokens(), estimateConversationTokens(), MODEL_CONTEXT_LIMIT
  - `src/components/workspace/ContextBar.tsx` — Monospace █/░ Balken, amber ≥60%, rot ≥85%
  - `src/components/workspace/MemorySaveModal.tsx` — 2 Tabs: AI-Zusammenfassung + Manuell
  - `useWorkspaceState`: contextPercent, showMemoryModal, auto-trigger bei 85%
  - `ChatArea`: 🧠-Button + MemorySaveModal, nur sichtbar wenn Conv project_id hat
  - Commits: 4e7a2b1 … d9aecae (10 Commits)

#### 🧠 Wissensbasis & RAG
- pgvector EU, `text-embedding-3-small`, 3 Ebenen (Org/User/Projekt)
- Dokument-Upload UI + Edge Functions `knowledge-search` + `knowledge-ingest`
- Migrations 017-018 deployed

#### 🔒 Superadmin-Tool
- `/superadmin/clients`: Clients anlegen, bearbeiten, löschen, User aktivieren
- Role-Switcher im NavBar (Super / Admin / Solo) via sessionStorage
- Superadmin-Org unlöschbar

#### 👤 Impersonation (Admin-Ebenen & DSGVO)
- Read-only Banner mit Countdown, vollständig geloggt (`impersonation_sessions`)
- Zeitlich begrenzt (15/30/60 Min), Ticket-Referenz Pflicht
- User sieht alle Sessions in Settings › Datenschutz
- Toggle "Support-Ansicht erlauben"

#### 💬 Startseiten-Chat
- Anonym, 5 Nachrichten, localStorage, gpt-4o-mini
- Toro kennt Startseiten-Kontext, CTA nach Limit

#### 📎 Artefakte & Merkliste
- `artifacts` + `bookmarks` Tabellen (Migration 022)
- Chat-Header-Strip: Zähler für Artefakte + Lesezeichen, öffnet Drawer
- Artefakte-Drawer (oben, 200ms ease-out, Backdrop, Escape)
- Code-Blöcke: "Als Artefakt speichern" Button (Auto-Detect)
- Bookmark-Icon auf jeder Toro-Antwort (toggle)
- `/workspace` Seite: Grid aller Artefakte, Filter nach Typ, Suche, Download, Löschen

---

### 🔜 Nächste Schritte — Phase 2 Build-Reihenfolge

> Pläne liegen in `docs/superpowers/plans/`

#### Plan C — Workspaces + Card Engine
- `workspaces` CRUD (`GET/POST /api/workspaces`, `GET/PATCH/DELETE /api/workspaces/[id]`)
- `cards` CRUD mit `card_history` (APPEND ONLY)
- `connections` Graph-Links zwischen Karten
- `knowledge_entries` CRUD
- `workspace_messages` (Silo-Chat + Karten-Chat)
- `operators` + `operator_results` (Berechnungsknoten)
- `outcomes` CRUD
- Plan noch zu schreiben

#### Plan D — Chat & Context Integration
- Projekt-Kontext-Injection beim AI-Aufruf (Gedächtnis + Wissensbasis → System-Prompt)
- Memory-Warnung im Chat-Header (85%-Trigger sichtbar kommunizieren)
- Workspace-Chat-Context (knowledge_entries fließen in Chat)
- Plan noch zu schreiben

#### Plan E — Transformations-Engine
- `POST /api/transformations` — analyze + suggest + build + link
- Projekt → Workspace: AI analysiert Gedächtnis, schlägt Karten-Struktur vor
- Projekt → Agent: AI konfiguriert auf Basis Projekt-Gedächtnis
- Immer: Vorschau → Bestätigung → Ausführung, nie destruktiv
- Plan noch zu schreiben

#### Plan F — UI (Projekte + Workspaces)
- Projekte-Seite neu: Liste mit Gedächtnis-Zähler, Wissensbasis-Tab
- Workspaces-Seite: Karten-Graph-View, Outcome-Board
- Transformations-Trigger als kontextueller Hinweis (kein Nav-Punkt)
- Plan noch zu schreiben

#### Plan G — Feeds
- Feed-Quellen CRUD, Schemas, Stage-Pipeline (Stage 1 regelbasiert, Stage 2 Haiku, Stage 3 Sonnet)
- Feed-Distributions (→ Workspaces, Projekte, standalone)
- Plan noch zu schreiben

---

#### Weitere To-Dos (parallel möglich)

#### 🧠 SKILL.md System — Toro-Verbesserungen
- **Modellwahl-Optimierung:** Toro wählt automatisch das passende Modell je nach Aufgabentyp
- **Zusammenfassungs-Qualität:** Zusammenfassungen langer Gespräche verbessern
- **Workspace-Erstellung verbessern:** Onboarding-Flow für neue Workspaces optimieren

#### 🤖 Agenten-System Phase 2
- Agenten Projekten zuweisen (conversations.agent_id)
- Agenten im Chat aktivieren (Dropdown im ChatInput)
- System-Prompt als `agent_system_prompt` Input an Dify übergeben

#### 📚 Prompt-Bibliothek Phase 3
- Paket-Vorlagen je nach aktiviertem Paket
- Vorlagen org-weit teilen

#### 📦 Paket-System Phase 1 ✅
- Marketing-Paket: 5 Agenten (Campaign Planner, Brand Voice Writer, Social Adapter, Newsletter Spezialist, Copy Texter)
- Schnellstart-Chips (4 pro Agent) direkt im ChatInput
- Superadmin aktiviert Paket pro Org in /superadmin/clients
- Nächstes Paket: Wissenschafts-Paket

---

### ⬜ Geplant (später)

#### 📦 Paket-System
- Marketing-Paket: 10 Agenten, Hootsuite/Buffer/Mailchimp/Canva/HubSpot-Integration
- Wissenschafts-Paket: 10 Agenten, Zotero-Anbindung, DFG/Horizon-Anträge
- Risiko-Ranking: Marketing ✅ · Wissenschaft ⚠️ · Legal/Behörde 🔴 (nur mit Partner)

#### 🛡️ Toro Guard
- 4-Schichten: Automatisch → KI-Review (Risk Score 0–100) → Manuell → Community
- Status-System: In Review / Community / Verifiziert / Featured / Deaktiviert
- Immer bestes Modell, jede Entscheidung geloggt

#### 🔗 n8n/Make Integration
- Trigger aus Tropen OS, n8n als Agent-Tool, Tropen OS als n8n Node
- Automationen-Tab in Projekt-Einstellungen
- Community teilt Agent + Flow Templates

#### 🏗️ Architektur & Positionierung
- Wettbewerb durch Integration ersetzen: Elicit, Zotero, n8n einbinden
- Community-Netzwerkeffekt: Agenten teilen, forken, bewerten
- Tropen OS als KI-Betriebssystem positionieren, nicht als Wrapper

---

---

## Phase 2 — tropen_ System (Gesamtarchitektur v0.5)

> Vollständiges Konzeptdokument: `docs/tropen-os-architektur.md`
> Build-Reihenfolge: Prompt 00 → 08 (siehe unten)

### System-Architektur

#### Bestehend (NICHT anfassen)

| DB-Tabelle         | UI-Label     | Bedeutung                          |
|--------------------|--------------|-------------------------------------|
| departments        | "Department" | Org-weite Einheit (ex workspaces)  |
| department_members | —            | Mitgliedschaft in Department        |
| conversations      | "Chat"       | Einzelnes Gespräch                 |

#### Neu (werden ohne tropen_ Präfix angelegt)

| DB-Tabelle          | UI-Label       |
|---------------------|----------------|
| projects            | "Projekt"      |
| project_memory      | "Gedächtnis"   |
| workspaces          | "Workspace"    |
| cards               | "Karte"        |
| agents              | "Agent"        |
| feed_sources        | "Quelle"       |
| transformations     | (intern)       |

Hierarchie:
```
Department (departments)
  ├── Projekte (projects)    → Wissensbasis + Gedächtnis + Chats
  └── Workspaces (workspaces) → Karten-Graph + Outcomes
```

### Projekte: Kern-Konzept

Projekte sind smarte Projektordner mit Gedächtnis.
Wissensbasis (Dateien, Notizen, Links) + Chat-History + Projekt-Gedächtnis.
**Keine Aufgabenliste. Keine hardcodierten Felder.** Domänenspezifische Felder via Templates.

**Projekt-Gedächtnis:**
- Akkumuliert automatisch aus Chats (Key Insights, Entscheidungen, offene Fragen)
- Wird bei Context-Window-Warnung eingefroren (Zusammenfassung)
- Fließt in jeden neuen Chat im Projekt als Kontext
- Tabelle: `tropen_project_memory` (APPEND ONLY)

```typescript
interface MemoryEntry {
  id: string
  type: 'insight' | 'decision' | 'open_question' | 'summary' | 'fact'
  content: string
  sourceConversationId: string
  createdAt: string
  importance: 'high' | 'medium' | 'low'
  tags: string[]
  frozen: boolean
}
```

### Context-Window-Awareness

- Token-Count nach jeder Message berechnen (tiktoken, kein API-Aufruf)
- Füllstand im Chat-Header anzeigen: `[████████░░] 80%`
- **Warnung bei 85%:** Zusammenfassung ins Gedächtnis anbieten
- **Am Chat-Ende:** Key Insights speichern anbieten
- Zusammenfassung via `claude-haiku-4-5-20251001` (token-sparend)
- Gilt in Projekten (→ `tropen_project_memory`) UND Workspaces (→ `tropen_knowledge_entries`)

### Transformations-Schicht

Kein Nav-Punkt. Erscheint kontextuell als nicht-aufdringlicher Hinweis.
Trigger: nach N Chats, Gedächtnis-Schwelle, oder explizit vom Member.

- Projekt → Workspace: AI analysiert Gedächtnis, schlägt Karten-Struktur vor
- Projekt → Agent: AI konfiguriert auf Basis Projekt-Gedächtnis
- Projekt → Feed: AI schlägt Quellen basierend auf Themen vor

**Immer: Vorschau → Bestätigung → Ausführung. Nie destruktiv.**
Original bleibt nach Transformation erhalten. Verbindung aktiv via `tropen_transformation_links`.

### Wissens-Hierarchie (für jeden AI-Aufruf)

```
1. Org-Wissen (locked)               → immer
2. Department-Wissen                 → immer
3. Projekt-Gedächtnis                → wenn in Projekt
4. Projekt-Wissensbasis              → wenn in Projekt
5. Workspace-Wissen                  → wenn in Workspace
6. Karten-Wissen                     → wenn in Karten-Chat
7. Feed-Artefakte (relevant)         → wenn zugeordnet
8. suggested/open Konventionen       → Member-Wert oder Default
```

### Kontroll-Spektrum

```typescript
interface ControlledSetting<T> {
  value: T
  controlMode: 'locked' | 'suggested' | 'open'
  setBy: 'org' | 'dept' | 'member'
  explanation?: string
  bestPractice?: string
}
```

Department kann einschränken, nie lockern. Member kann überschreiben was `'suggested'` oder `'open'` ist.

### AI-Modelle (Phase 2)

| Verwendung                    | Modell                       |
|-------------------------------|------------------------------|
| Projekt-Chat                  | claude-sonnet-4-20250514     |
| Workspace Silo + Karten-Chat  | claude-sonnet-4-20250514     |
| Transformations-Engine        | claude-sonnet-4-20250514     |
| Context-Zusammenfassung       | claude-haiku-4-5-20251001    |
| Feed Stage 2 (Scoring)        | claude-haiku-4-5-20251001    |
| Feed Stage 3 (Deep)           | claude-sonnet-4-20250514     |

Feed Stage 1: KEIN AI-Aufruf — regelbasiert.

**SDK:** Anthropic SDK direkt (`ANTHROPIC_API_KEY` in `.env.local`) — kein Dify für neue tropen_ Features.

### Token-Sparsamkeit

- Feed Stage 1: kein API-Aufruf
- Feed Stage 2: Haiku, max 300 Output-Tokens
- Feed Stage 3: Sonnet, max 10 Items pro Batch, Budget-Check vor Aufruf
- Context-Zusammenfassungen: Haiku (nicht Sonnet)
- Token-Count lokal berechnen (tiktoken), kein API-Aufruf dafür

### Migration (Prompt 00 — zuerst ausführen)

```
projects → tropen_projects
  name → title
  context, tone, language, target_audience, memory → meta (jsonb)
  migratedFromProjectId in meta
conversations → tropen_project_id Spalte ergänzen
projects Tabelle nach Migration droppen
```

### Was NICHT angefasst wird

- `workspaces` Tabelle (= Department)
- `conversations` Tabelle
- `/chat` Route
- `src/lib/supabase-admin.ts`
- Bestehende Department-UI und -Actions

### Toter Code — löschen wenn Build startet

- `/ws/` Route
- Altes `actions/workspaces.ts` (Canvas-System)
- Canvas-Tabellen ohne `tropen_` Präfix

### Design-Tokens (tropen_ Features — dunkles Theme)

Neue tropen_ Workspaces/Projekte verwenden ein dunkles Theme:

```javascript
tropen: {
  bg:      "#080808",
  surface: "#0e0e0e",
  border:  "#1e1e1e",
  text:    "#e0e0e0",
  muted:   "#444444",
  input:   "#00C9A7",
  process: "#7C6FF7",
  output:  "#F7A44A",
}
```

Font: `'DM Mono', monospace`

> Das bestehende helle Theme (`var(--bg-base)` = `#EAE9E5`) bleibt für alle vorhandenen Seiten.
> Die neuen tropen_ Features bekommen ihr eigenes dunkles Theme-Scope.

### Build-Reihenfolge

```
Prompt 00 → Migration projects → tropen_projects
Prompt 01 → Schema (alle tropen_ Tabellen)
Prompt 02 → Projekt CRUD + Gedächtnis + Context-Awareness
Prompt 03 → Workspace CRUD + Card Engine
Prompt 04 → Connection Graph
Prompt 05 → Chat & Context (Projekt + Workspace)
Prompt 06 → Transformations-Engine
Prompt 07 → UI (Projekte + Workspaces)
Prompt 08 → Feeds
```

### Phase-2-Konventionen (zusätzlich zu bestehenden Regeln)

- Neue Tabellen **ohne** `tropen_` Präfix (da `workspaces` jetzt frei ist)
- **APPEND ONLY**: `card_history`, `project_memory`, `feed_processing_log` — niemals UPDATE oder DELETE
- Meta-Felder: immer mergen, nie ersetzen (`{ ...existing.meta, ...newFields }`)
- Soft Delete: `deletedAt`, nie hard delete (außer explizit angefordert)
- Zod-Validierung am Anfang jeder Server Action

### Routen & Semantik

| Route | Bedeutung |
|-------|-----------|
| `/projects` | Smarte Projektordner — Gedächtnis + Chats + Wissensbasis |
| `/workspace` | Karten-System — Phase 2, API vollständig (Plan C) |
| `/chat` | Einzelnes Gespräch (bestehend, nicht anfassen) |
| `/dashboard` | Org-Übersicht |

## Workspace + Card Engine (Plan C)

Backend vollständig gebaut in Phase 2. UI kommt in Plan F.

**Core-Prinzip:** Ein Workspace ist für mehrstufige, komplexe Aufgaben.
Karten (`input` → `process` → `output`) produzieren zusammen ein Ergebnis.

**Stale-Propagation:** Änderung an Karte → direkte Abhängigkeiten werden auf
`status='stale'` gesetzt (nicht rekursiv). Logik: `src/lib/stale-propagation.ts`.

**Briefing-Flow:** `POST /api/workspaces/[id]/briefing` → Toro stellt Fragen →
gibt JSON `{ goal, cards[] }` zurück → Client bestätigt → Cards werden angelegt
via `POST /api/workspaces/[id]/cards`.

**Export:** `chat` und `markdown` implementiert.
`word` / `pdf` / `presentation` → 501 (kommt Plan F/G).

**Zeitdimension:** `getWorkspaceAt(id, date)` aus `src/lib/workspace-time.ts`
rekonstruiert Workspace-Zustand aus `context_snapshot` in `workspace_messages`.

**card_history ist APPEND ONLY.** Kein UPDATE, kein DELETE — weder in Code noch in Policies.

**Neue Tabellen:** `workspace_assets`, `workspace_exports`, `workspace_messages`
Migration: `supabase/migrations/20260314000035_workspace_plan_c.sql`

**Neue Routen:**
- `GET/POST /api/workspaces` — Liste + anlegen
- `GET/PATCH/DELETE /api/workspaces/[id]` — Einzelner Workspace
- `GET/POST /api/workspaces/[id]/cards` — Karten
- `PATCH/DELETE /api/workspaces/[id]/cards/[cid]` — Karte aktualisieren (+ snapshot + stale)
- `POST/DELETE /api/workspaces/[id]/connections/[connid]` — Verbindungen
- `GET/POST /api/workspaces/[id]/assets/[aid]` — Assets
- `GET/POST /api/workspaces/[id]/chat` — Silo- und Karten-Chat
- `POST /api/workspaces/[id]/briefing` — Briefing-Flow
- `POST /api/workspaces/[id]/export` — Export starten
- `GET /api/workspaces/[id]/exports` — Export-History

---

## Zwischenstand 2026-03-08 — Offene Bugs & nächste Schritte

### ✅ Erledigt 2026-03-07
- **Workspace-Redesign**: page.tsx (2067 Zeilen) aufgeteilt in 13 Komponenten (useWorkspaceState, WorkspaceLayout, LeftNav, ChatArea, EmptyState, ChatMessage, ChatInput, ProjectSidebar, ConvItem, Papierkorb, JungleModal, MergeModal, ConditionalNavBar)
- **Phase-2-Redesign**: Kimi-Style 3-Column Layout, 240px LeftNav, Start Screen, Mobile
- **Bug Fix**: `check_and_reserve_budget` RPC — `FOR UPDATE` mit Aggregat-Funktion ist in PostgreSQL ungültig → Migration 012 deployed
- **Bug Fix**: `workspace_members`-Eintrag fehlte für neue Org-Owner nach Onboarding → `api/onboarding/complete` ergänzt
- **Dashboard**: Superadmin sieht jetzt alle Orgs (supabaseAdmin statt RLS-gefilterter Client)

### ✅ Erledigt 2026-03-08

#### Design System
- **Globale Typografie-Klassen**: `.t-primary { color: #fff !important }`, `.t-secondary { color: rgba(255,255,255,0.7) !important }`, `.t-dezent { color: rgba(255,255,255,0.4) !important }`
- **Utility-Klassen**: `.chip`, `.chip--active`, `.dropdown`, `.dropdown-item` in globals.css
- **Türkis komplett entfernt**: `#89c4a8`, `#d4f0e4`, `#556b5a`, `#14b8a6` in Workspace-Komponenten ersetzt durch rgba(255,255,255,x) Hierarchie
- **CSS-Variable**: `--dropdown-bg: #071510` für dunkle Dropdown-Surfaces

#### Komponenten-Updates
- **ConvItem**: t-primary für Titel, t-secondary für Datum
- **SessionPanel**: t-dezent für Labels, t-primary für Werte, CaretDown-Farbe als CSS statt Inline
- **Papierkorb**: t-secondary für Item-Titel
- **JungleModal / MergeModal**: `#14b8a6` Icons → `rgba(255,255,255,0.7)`

#### Multi-Select Rebuild (LeftNav)
- iOS-Style "Bearbeiten" / "Fertig" Pattern im CHATS-Header
- Kein Context-Menu-Trigger mehr für Multi-Select
- Kontextsensitive Aktionsleiste: Zusammenführen (≥2 Chats), Verschieben (≥1), Löschen (≥1)
- Lösch-Bestätigung inline in Aktionsleiste

#### Prompt-Bibliothek Phase 2
- **`src/lib/prompt-templates.ts`**: 5 Core-Vorlagen mit FieldDef-Discriminated-Union und `assemble()`
- **`src/components/workspace/TemplateDrawer.tsx`**: Slide-down Drawer mit Live-Vorschau
- **`src/components/workspace/EmptyState.tsx`**: Pills → Drawer-Integration
- Vollständig clientseitig, keine DB-Anbindung

#### Bug Fixes
- **Chat-Button**: `sendMessage` in `useWorkspaceState.ts` auto-erstellt Conversation wenn keine aktiv (`!activeConvId` → `newConversation()` aufrufen, dann senden)
- `newConversation()` gibt jetzt `Promise<string | null>` zurück (vorher `Promise<void>`)

### ✅ Bug behoben: Edge Function `workflow_finished`

`ai-chat/index.ts` behandelt beide Events: `message_end || workflow_finished` (Zeile 333).
Token-Nutzung und `conversation_id` werden für beide Event-Typen korrekt ausgelesen.

### Komponenten über 300 Zeilen (zur Beobachtung)
| Datei | Zeilen | Status |
|-------|--------|--------|
| `src/hooks/useWorkspaceState.ts` | 1060 | OK — Logik-Hook, schwer sinnvoll zu teilen |
| `src/app/onboarding/page.tsx` | 787 | OK — viele Schritte, inline-s Konvention |
| `src/app/responsible-ai/page.tsx` | 602 | OK — statischer Content |
| `src/app/superadmin/clients/page.tsx` | 477 | OK — Admin-Tool |
| `src/components/workspace/ProjectSidebar.tsx` | 465 | Beobachten |
| `src/components/workspace/WorkspaceLayout.tsx` | 442 | Beobachten |
| `src/components/workspace/SessionPanel.tsx` | 332 | OK |
| `src/components/workspace/LeftNav.tsx` | 309 | OK |

### Nächste Schritte (Priorität)
1. ~~**🔴 Edge Function `workflow_finished`-Event**~~ → **✅ Behoben 2026-03-09**
2. ~~**Smarte Projekte Phase 2**~~ → **✅ Behoben 2026-03-09** — `/projects`-Seite (4 Tabs), erweitertes Schema, API-Route, LeftNav-Link
3. ~~**Phase 2 Plan A — DB-Fundament**~~ → **✅ Erledigt 2026-03-12** — Migrationen 030–033 + RLS-Fixes live
4. ~~**Phase 2 Plan B — Projects CRUD + Gedächtnis + Context-Awareness**~~ → **✅ Erledigt 2026-03-12** — API-Routes, MemorySaveModal, ContextBar, Token-Counter
5. **Phase 2 Plan C — Workspaces + Card Engine** → ⬜ Nächster Schritt
6. **Phase 2 Plan D — Chat & Context Integration** → ⬜ Danach
7. **Phase 2 Plan E/F/G** → ⬜ Folgt

### Projekt-Gedächtnis (Stand 2026-03-12)
- **✅ Implementiert:** `project_memory` Tabelle (APPEND ONLY), API `GET/POST /api/projects/[id]/memory`, AI-Zusammenfassung via Haiku (`POST /api/projects/[id]/memory/summary`), MemorySaveModal (2 Tabs: AI + Manuell), Auto-Trigger bei 85% Context, 🧠-Button im Chat
- **⬜ Offen:** Gedächtnis-Injection in AI-Aufruf (Plan D), Gedächtnis-Anzeige in Projekt-Detail (Plan F)

---

## Webstandards & Barrierefreiheit

> Gilt für alle UI-Komponenten, Seiten und Features. Claude prüft diese Standards bei jeder Änderung an Frontend-Dateien.

### W3C HTML-Standards

- **Valides HTML**: Kein deprecated HTML (z.B. `<center>`, `<font>`, `<b>` statt `<strong>`)
- **Semantische Struktur**: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>` korrekt verwenden
- **Heading-Hierarchie**: Nur eine `<h1>` pro Seite, keine Heading-Ebenen überspringen (h1 → h2 → h3)
- **Landmark Roles**: Jede Seite hat genau eine `main` Landmark
- **Listen**: Navigation immer als `<ul>/<li>`, nie als `<div>`-Kette
- **Buttons vs. Links**: `<button>` für Aktionen, `<a href>` für Navigation — nie `<div onClick>`
- **Formulare**: Jedes `<input>` hat ein zugehöriges `<label>` (htmlFor/id Paar) oder `aria-label`

### WCAG 2.1 AA (Barrierefreiheit)

#### Kontrast (Minimum AA)
- **Normaler Text** (unter 18px / unter 14px bold): Kontrastverhältnis ≥ 4.5:1
- **Großer Text** (ab 18px / ab 14px bold): Kontrastverhältnis ≥ 3:1
- **UI-Komponenten & Icons**: Kontrastverhältnis ≥ 3:1 gegen Hintergrund
- Prüftool: https://webaim.org/resources/contrastchecker/
- Aktuelle Palette: `var(--accent)` #2D7A50 auf `var(--bg-base)` #EAE9E5 → **prüfen bei neuen Kombinationen**

#### Tastaturnavigation
- Alle interaktiven Elemente per Tab erreichbar
- Fokus-Indikator immer sichtbar — nie `outline: none` ohne Alternative
- Fokus-Reihenfolge logisch (DOM-Reihenfolge = visuelle Reihenfolge)
- Modals/Drawer: Fokus-Trap (Tab bleibt im Modal), Escape schließt, Fokus kehrt zum Auslöser zurück

#### ARIA & Screenreader
- Icons ohne sichtbaren Text: `aria-label` oder `aria-hidden="true"` + visuell versteckter Text
- Dynamische Inhalte (Chat-Nachrichten, Toasts): `aria-live="polite"` oder `aria-live="assertive"`
- Loading-States: `aria-busy="true"` auf dem Container
- Expanded/Collapsed (Drawer, Accordion): `aria-expanded` auf dem Trigger
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` auf den Titel
- Fehlermeldungen: `aria-describedby` verknüpft Input mit Fehlermeldung
- **Nie ARIA-Rollen auf falsche Elemente setzen** (kein `role="button"` auf `<div>` — richtiges Element verwenden)

#### Bilder & Medien
- `<img>` immer mit `alt`-Attribut (leer `alt=""` für dekorative Bilder)
- SVG-Icons die Bedeutung tragen: `<title>` oder `aria-label`

#### Formulare & Eingaben
- Pflichtfelder: `required` + `aria-required="true"`
- Fehler: Fehlermeldung programmatisch mit Input verknüpft (`aria-describedby`)
- Autocomplete-Attribute für Standard-Felder setzen (`name`, `email`, `current-password`)

#### Bewegung & Animationen
- `prefers-reduced-motion` respektieren:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
- Bestehende Drawer-Animation (200ms ease-out): bereits konform, beibehalten

#### Texte & Lesbarkeit
- Mindestschriftgröße: 12px (bereits in Design System verankert)
- Zeilenhöhe: mindestens 1.4 für Fließtext
- Textabstand muss ohne Inhaltsverlust anpassbar sein (WCAG 1.4.12)
- Kein Text in Bildern (außer Logos)

### BFSG / EAA (Barrierefreiheitsstärkungsgesetz)

**Gilt seit 28. Juni 2025** — Pflicht bereits aktiv. Tropen OS ist als B2B-SaaS mit Chat-Interface direkt betroffen.

- **Konformitätserklärung**: Vor Launch eine Barrierefreiheitserklärung veröffentlichen (Seite `/accessibility` oder Footer-Link)
- **Feedbackmechanismus**: Nutzer müssen Barrieren melden können — mindestens eine E-Mail-Adresse im Footer
- **Durchsetzungsverfahren**: Schlichtungsstelle muss benannt werden (Ombudsstelle BFSG beim BMAS)
- **Scope**: Betrifft alle Kernfunktionen — Chat-Interface, Onboarding, Settings, Wissensbasis
- WCAG 2.1 AA Konformität ist die technische Grundlage für BFSG-Compliance

### Art. 50 KI-VO — KI-Kennzeichnung (Marking / Framing)

**Pflicht seit Februar 2025** (Art. 50 Abs. 1 KI-VO trat vor den Hochrisiko-Anforderungen in Kraft).

- **Transparenzpflicht**: Nutzer müssen wissen dass sie mit einem KI-System interagieren
- **Implementierung**: Deutlich sichtbarer Hinweis vor oder beim ersten Chat-Einstieg
  - Onboarding Schritt 4 (AI Act Acknowledgement) deckt dies teilweise ab — prüfen ob ausreichend
  - Zusätzlich: persistenter Hinweis im Chat-Interface (z.B. Subtext unter Toro-Antworten)
- **Synthetische Inhalte** (Art. 50 Abs. 2): KI-generierte Texte, Audio, Bilder müssen als solche erkennbar sein
- **Implementierung im Code**:
  - `user_preferences.ai_act_acknowledged` bereits vorhanden (Migration 009)
  - Noch fehlend: UI-Banner / persistente Kennzeichnung im Chat (offener Bug)
- **Pflichtfeld in jedem neuen Feature**: Wenn ein Feature KI-Outputs an Nutzer ausgibt → KI-Kennzeichnung prüfen

### Checkliste für neue UI-Features

Claude prüft bei jedem neuen Feature oder jeder UI-Änderung:

- [ ] Semantisches HTML verwendet (kein `<div>` für interaktive Elemente)
- [ ] Alle interaktiven Elemente per Tastatur erreichbar
- [ ] Fokus-Indikator sichtbar
- [ ] ARIA-Labels auf Icons ohne sichtbaren Text
- [ ] Kontrast AA-konform (bei neuen Farb-Kombinationen prüfen)
- [ ] `aria-live` auf dynamische Inhalte (Chat-Nachrichten, Fehler, Loading)
- [ ] Modals/Drawer: Fokus-Trap + Escape + Rückkehr-Fokus
- [ ] `prefers-reduced-motion` berücksichtigt
- [ ] KI-Outputs klar als KI-generiert erkennbar (Art. 50 KI-VO)
