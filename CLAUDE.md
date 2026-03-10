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
| 016_smart_projects.sql | projects um description, context, tone, language, target_audience, memory, updated_at erweitert |

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
1. ~~**🔴 Edge Function `workflow_finished`-Event**~~ → **✅ Behoben 2026-03-09** — `workflow_finished` und `message_end` getrennt behandelt; `dify_conversation_id` wird jetzt korrekt aus `message_end` gespeichert
2. ~~**Smarte Projekte Phase 2**~~ → **✅ Behoben 2026-03-09** — `/projects`-Seite (4 Tabs), erweitertes Schema, API-Route, LeftNav-Link
3. **Prompt-Bibliothek Phase 3** — DB-Tabelle `prompt_templates`, eigene Vorlagen speichern, Sidebar-Integration
4. **Agenten-System Phase 3** — `agents`-Tabelle, User-Agenten, Projekt-Zuweisungen, Community Phase 4

### Projekt-Gedächtnis (Roadmap)
- **Phase 2**: Manuelles Kontext-Textfeld im Projekt-Detail (Freitext, den Toro bei jedem Chat liest).
- **Phase 3**: Toro extrahiert automatisch Personen, Deadlines, Entscheidungen und offene Fragen aus dem Chat-Verlauf via eigenem Dify-Workflow und schreibt sie in `projects.memory`.
