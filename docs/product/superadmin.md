# Tropen OS — Superadmin-Tool

---

## Grundlagen

- Route: `/superadmin/clients` — nur für `role = 'superadmin'`
- Kein Link in NavBar — direkte URL-Eingabe
- Layout-Guard: `src/app/superadmin/layout.tsx` prüft role server-seitig
- Middleware: `/superadmin/*` bypassed Onboarding-Guard

**Timm-Account auf superadmin setzen (einmalig):**
```sql
UPDATE users SET role = 'superadmin' WHERE email = 'hello@tropen.de';
```

Migration: `011_superadmin.sql` — erweitert `users_role_check` um `'superadmin'`

---

## Was das Tool tut

- `GET /api/superadmin/clients` → alle Orgs mit Workspaces, Settings, Users
- `POST /api/superadmin/clients` → Org + Workspace + organization_settings anlegen + Owner einladen
- Kein öffentliches Signup — Owner-Accounts werden ausschließlich durch Tropen angelegt

---

## Client anlegen — Ablauf

1. `/superadmin/clients/new` ausfüllen: Firma, Plan, Budget, Workspace, Owner-Email
2. API legt an: `organizations` → `workspaces` → `organization_settings` → `inviteUserByEmail`
3. Owner bekommt Einladungsmail (Resend via Supabase SMTP)
4. Owner klickt Link → `/auth/callback` → `/onboarding` (Schritte 1–5 als Admin)
5. Neu angelegte Org erscheint sofort in `/superadmin/clients`

---

## Superadmin To-Do (Stand 2026-03-17)

| Priorität | Feature | Status |
|-----------|---------|--------|
| ✅ Fertig | Phase 2 Plan C — Workspaces + Card Engine (Backend) | ✅ 2026-03-14 |
| ✅ Fertig | Phase 2 Plan G — Feeds | ✅ 2026-03-14 |
| ✅ Fertig | Feeds Quellen-Verwaltung UI (edit, copy, delete, pause) | ✅ 2026-03-16 |
| ✅ Fertig | Wissensbasis RAG-Fix (Knowledge-Search 401, direkte Einbettung in ai-chat) | ✅ 2026-03-16 |
| ✅ Fertig | Multi-Provider LLM-Routing (Anthropic + OpenAI direkt, kein Dify-Relay) | ✅ 2026-03-16 |
| ✅ Fertig | CodeQL Security-Fix + CI-Failures (file size, icon weight) | ✅ 2026-03-16 |
| ✅ Fertig | Phase 2 Plan 1 — Capability + Outcome System + Guided Workflows | ✅ 2026-03-17 |
| ✅ Fertig | Phase 2 Plan D — Chat & Context Integration | ✅ 2026-03-17 |
| ✅ Fertig | Phase 2 Plan E — Transformations-Engine (analyze → preview → execute) | ✅ 2026-03-17 |
| ✅ Fertig | Phase 2 Plan F — UI: Projekte Memory-Tab, Workspaces-Liste | ✅ 2026-03-17 |
| 🔴 Hoch | **Dify-Entscheidung** — Dify komplett ablösen oder parallel weiterführen? | ⏸ Offen |
| 🟢 Niedrig | Agenten-System Phase 2 | ⬜ Offen |
| 🟢 Niedrig | Prompt-Bibliothek Phase 3 | ⬜ Offen |
| 🟢 Niedrig | Wissenschafts-Paket | ⬜ Offen |

---

## Impersonation

- Read-only Banner mit Countdown, vollständig geloggt (`impersonation_sessions`)
- Zeitlich begrenzt (15/30/60 Min), Ticket-Referenz Pflicht
- User sieht alle Sessions in Settings › Datenschutz
- Toggle "Support-Ansicht erlauben" in User-Settings
