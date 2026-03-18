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

## Superadmin To-Do (Stand 2026-03-18)

| Priorität | Feature | Status |
|-----------|---------|--------|
| ✅ Fertig | Phase 2 Plan C — Workspaces + Card Engine (Backend) | ✅ 2026-03-14 |
| ✅ Fertig | Phase 2 Plan G — Feeds (3-stufige Pipeline, Cron, Newscenter UI) | ✅ 2026-03-14 |
| ✅ Fertig | Feeds Quellen-Verwaltung UI (edit, copy, delete, pause) | ✅ 2026-03-16 |
| ✅ Fertig | Wissensbasis RAG-Fix (Knowledge-Search 401, direkte Einbettung in ai-chat) | ✅ 2026-03-16 |
| ✅ Fertig | Multi-Provider LLM-Routing (Anthropic + OpenAI direkt, kein Dify-Relay) | ✅ 2026-03-16 |
| ✅ Fertig | CodeQL Security-Fix Round 1 (file size, icon weight, CI-Failures) | ✅ 2026-03-16 |
| ✅ Fertig | Phase 2 Plan 1 — Capability + Outcome System + Guided Workflows | ✅ 2026-03-17 |
| ✅ Fertig | Phase 2 Plan D — Chat & Context Integration | ✅ 2026-03-17 |
| ✅ Fertig | Phase 2 Plan E — Transformations-Engine (analyze → preview → execute) | ✅ 2026-03-17 |
| ✅ Fertig | Phase 2 Plan F — UI: Projekte Memory-Tab, Workspaces-Liste | ✅ 2026-03-17 |
| ✅ Fertig | **Dify abgelöst** — jungle-order auf Anthropic direkt umgestellt | ✅ 2026-03-17 |
| ✅ Fertig | **Plan J spezifiziert** — Produktion: Dashboards, autonome Feeds, Agents | ✅ 2026-03-17 |
| ✅ Fertig | **Agenten-Spec** — docs/plans/agents-spec.md (Plan J2 Grundlage) | ✅ 2026-03-17 |
| ✅ Fertig | Design-System Consistency — alle Seiten auf Design-System migriert | ✅ 2026-03-17 |
| ✅ Fertig | Feed-Infrastruktur Round 2 — distributor, ttl-cleanup, digest, fetch-cron | ✅ 2026-03-17 |
| ✅ Fertig | Hub-Seite `/hub` — Agenten + Templates UI (Grundgerüst) | ✅ 2026-03-17 |
| ✅ Fertig | Artifacts API — `/api/artifacts` CRUD + conversationId-Filterung | ✅ 2026-03-17 |
| ✅ Fertig | Workspace Canvas `/ws/[id]/canvas` — Canvas-Route + Settings | ✅ 2026-03-17 |
| ✅ Fertig | CodeQL Security-Fix Round 2 — Edge-Function-Fehler sanitized, RLS für operators/workspace_templates (Migration 045) | ✅ 2026-03-18 |
| ✅ Fertig | TypeScript Build-Fehler behoben (mapCard, sendDigestNow, triggerFeedFetch) | ✅ 2026-03-18 |
| ✅ Fertig | CI/CD Pipeline vollständig grün — pnpm-Konflikt, OpenAI-Build, E2E-Server, Vercel-Deploy | ✅ 2026-03-18 |
| ✅ Fertig | Lighthouse CI konfiguriert — VERCEL_PRODUCTION_URL, nicht-fataler DB-Save | ✅ 2026-03-18 |
| ✅ Fertig | Rate-Limit Fix — Auth-Routes nur noch POST geblockt (kein Sperren beim Seitenaufruf) | ✅ 2026-03-18 |
| ✅ Fertig | **Plan J1** — Feeds autonom: feed_runs, feed_notifications, pause/resume, Cron via runFeedSource, Notification Bell | ✅ 2026-03-18 |
| ✅ Fertig | **Plan J2a** — skills-Tabelle + RLS + Seed, agent_skills, skill-resolver, /api/skills/* | ✅ 2026-03-18 |
| 🔴 Hoch | **Plan J2b** — agents ALTER + agent_runs + agent-engine | ⬜ Nach J2a |
| 🔴 Hoch | **Plan J2c** — Scheduled Trigger (Cron), Webhook, Paket-Seeds | ⬜ Nach J2b |
| 🟡 Mittel | **Plan K** — Geteilte Chats + Team-Antwort | ⬜ Offen |
| 🟢 Niedrig | Prompt-Bibliothek Phase 3 | ⬜ Offen |
| 🟢 Niedrig | Wissenschafts-Paket | ⬜ Offen |

---

## Impersonation

- Read-only Banner mit Countdown, vollständig geloggt (`impersonation_sessions`)
- Zeitlich begrenzt (15/30/60 Min), Ticket-Referenz Pflicht
- User sieht alle Sessions in Settings › Datenschutz
- Toggle "Support-Ansicht erlauben" in User-Settings
