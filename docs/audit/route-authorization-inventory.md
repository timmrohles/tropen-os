---
status: active
updated: 2026-06-11
review_by: 2026-09-11
related: [ADR-032]
---

# Route-Autorisierungs-Inventar

> Vollständige Karte aller API-Routen-Handler und ihrer Autorisierung — Faktenbasis für den `withAuth`/`withProjectAccess`-Rollout (ADR-032, Action Item 1) und die Allowlist des Audit-Checkers (Action Item 3).
>
> **Methode:** 197 `route.ts`-Dateien unter `src/app/api/`, erfasst am 2026-06-11 via 8 parallele Explore-Agenten (1 Lese-Pass pro Datei). Die Spalte „Vorgeschlagener Wrapper" ist ein Vorschlag, **keine** verifizierte Migration. Der Checker (#3) ist die autoritative Verifikation.

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| Routen-Dateien gesamt | 197 |
| Bereits migriert (Pilot) | 3 — `projects`, `projects/[id]`, `admin/branding` |
| **Sicherheits-Findings (⚠️ vor Rollout prüfen)** | siehe Abschnitt unten |
| Öffentlich by design (kein Auth nötig) | health, public/chat, beta/waitlist, s/[token], shared/[token], artifacts/transform? |

### Wrapper-Bedarf (Vorschlag)

| Wrapper | Status | grobe Anzahl | Beispiele |
|---------|--------|--------------|-----------|
| `withAuth` | ✅ gebaut | ~100+ | Großteil der user-scoped Routen |
| `withOrgAdmin` | ✅ gebaut | ~15 | admin/*, audit/fix/*, cockpit/budget, settings/org, usage/stats, announcements POST |
| `withProjectAccess` | ✅ gebaut | ~9 | projects/[id]/* Unterrouten |
| `withCronAuth` | ✅ gebaut | ~8 | cron/* (6), feeds/inbound/email, agents/webhook |
| `withWorkspaceAccess` | ✅ gebaut (2026-06-11) | ~20 | alle workspaces/[id]/* (Read/Write via `opts.write`) |
| `withSuperadmin` | ✅ gebaut (2026-06-11) | ~16 | superadmin/*, admin/qa/* |
| `manuell (Sonderfall)` | — | ~7 | öffentliche/Token-basierte Routen |

**Konsequenz für ADR-032:** Vor dem vollen Rollout müssen **zwei weitere Wrapper** gebaut werden — `withWorkspaceAccess` (Workspace-Ownership-Prüfung) und `withSuperadmin` (role==='superadmin'). Beide sind im Pilot nicht entstanden, weil die Pilot-Routen sie nicht brauchten. Empfehlung: als Action Item 2b nachziehen, analog `withProjectAccess` (mit eigenen Unit-Tests), bevor workspaces/* und superadmin/* migriert werden.

---

## ⚠️ Sicherheits-Findings — vor Rollout verifizieren

Diese sind beim Inventar aufgefallen und müssen **vor** der mechanischen Migration einzeln geprüft werden (echtes Problem vs. False Positive — P18-Disziplin):

| Route | Methode | Befund | Priorität |
|-------|---------|--------|-----------|
| [superadmin/impersonate/[id]](src/app/api/superadmin/impersonate/[id]/route.ts) | **GET** | ✅ **BEHOBEN 2026-06-11** — `requireSuperadmin()` + Scope auf eigene Session (`superadmin_id`) ergänzt. | ~~🔴 hoch~~ |
| [feeds/[id]/pause](src/app/api/feeds/[id]/pause/route.ts) · [resume](src/app/api/feeds/[id]/resume/route.ts) · [run](src/app/api/feeds/[id]/run/route.ts) · [runs](src/app/api/feeds/[id]/runs/route.ts) | POST/GET | ✅ **BEHOBEN 2026-06-11** — neuer Helfer `verifyFeedSourceAccess(id, me)` (`src/lib/api/feeds.ts`, org-scoped + Superadmin-Bypass) in allen vier Routen. | ~~🔴 hoch~~ |
| [workspaces/[id]/picker](src/app/api/workspaces/[id]/picker/route.ts) | GET | Workspace-`id` wird ignoriert; lädt User-eigene Daten (kein Leak, aber Logikfehler). | 🟠 mittel |
| [admin/budget](src/app/api/admin/budget/route.ts) | GET | Ignoriert `org_id`-Filter — Org-Admin könnte fremde Org-Budgets sehen? Verifizieren. | 🟠 mittel |
| [agents/[id]/run](src/app/api/agents/[id]/run/route.ts) | POST | Kein Ownership-Check in der Route (an Engine delegiert) — verifizieren, dass `runAgent` prüft. | 🟠 mittel |
| [artifacts/transform](src/app/api/artifacts/transform/route.ts) | POST | **Keine Auth** — stateless JS/TS-Transform. Öffentlich by design? Sonst Finding. | 🟠 mittel |
| audit-Routen ohne org_id-Filter | div. | `audit/compliance-data`, `audit/fix-prompt`, `audit/fix-session`, `audit/self-assessment`, `audit/export-rules`, `repo-map/generate`, `transformations*` — nur `getAuthUser`, keine Tenant-Isolation (RLS umgangen wegen supabaseAdmin). | 🟠 mittel |
| [agents/webhook/[agent_id]](src/app/api/agents/webhook/[agent_id]/route.ts) | POST | Public Webhook, HMAC-SHA256 via `webhook_secret`. Kein User-Auth — by design, aber `withCronAuth`-Äquivalent dokumentieren. | 🟢 niedrig |

---

## Inventar nach Feature

### workspaces

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|----------------------|---------|------------------------|-------|
| [workspaces](src/app/api/workspaces/route.ts) | GET, POST | getAuthUser | org_id-Filter manuell | nein | withAuth | GET: org-Filter für Nicht-Superadmins; POST: auto-Participant-Insert |
| [workspaces/[id]](src/app/api/workspaces/[id]/route.ts) | GET, PATCH, DELETE | getAuthUser | requireWorkspaceAccess / canWriteWorkspace | nein | withWorkspaceAccess | Workspace-spezifische Zugriffsprüfungen |
| [workspaces/[id]/assets](src/app/api/workspaces/[id]/assets/route.ts) | GET, POST | getAuthUser | requireWorkspaceAccess / canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/assets/[aid]](src/app/api/workspaces/[id]/assets/[aid]/route.ts) | DELETE | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/briefing](src/app/api/workspaces/[id]/briefing/route.ts) | POST | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | LLM-Briefing + Budget-Check |
| [workspaces/[id]/cards](src/app/api/workspaces/[id]/cards/route.ts) | GET, POST | getAuthUser | requireWorkspaceAccess / canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/cards/[cid]](src/app/api/workspaces/[id]/cards/[cid]/route.ts) | PATCH, DELETE | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/chat](src/app/api/workspaces/[id]/chat/route.ts) | GET, POST | getAuthUser | requireWorkspaceAccess / canWriteWorkspace | nein | withWorkspaceAccess | + Budget-Check |
| [workspaces/[id]/comments](src/app/api/workspaces/[id]/comments/route.ts) | GET, POST | getAuthUser | requireWorkspaceAccess | nein | withWorkspaceAccess | |
| [workspaces/[id]/comments/[commentId]](src/app/api/workspaces/[id]/comments/[commentId]/route.ts) | DELETE | getAuthUser | requireWorkspaceAccess + inline role | nein | withWorkspaceAccess | nur eigene Comments oder ['owner','admin','superadmin'] |
| [workspaces/[id]/connections](src/app/api/workspaces/[id]/connections/route.ts) | POST | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/connections/[connid]](src/app/api/workspaces/[id]/connections/[connid]/route.ts) | DELETE | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/copy](src/app/api/workspaces/[id]/copy/route.ts) | POST | getAuthUser | requireWorkspaceAccess | nein | withWorkspaceAccess | |
| [workspaces/[id]/export](src/app/api/workspaces/[id]/export/route.ts) | POST | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/exports](src/app/api/workspaces/[id]/exports/route.ts) | GET | getAuthUser | requireWorkspaceAccess | nein | withWorkspaceAccess | |
| [workspaces/[id]/items](src/app/api/workspaces/[id]/items/route.ts) | GET, POST | getAuthUser | requireWorkspaceAccess / canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/items/[itemId]](src/app/api/workspaces/[id]/items/[itemId]/route.ts) | DELETE | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/[id]/members](src/app/api/workspaces/[id]/members/route.ts) | GET, POST | getAuthUser | GET: requireWorkspaceAccess; POST: inline ['owner','admin','superadmin'] | nein | withWorkspaceAccess (GET) / ⚠️ REVIEW (POST) | POST: Org-Admin-Check, kein Workspace-Owner-Check |
| [workspaces/[id]/members/[memberId]](src/app/api/workspaces/[id]/members/[memberId]/route.ts) | PATCH, DELETE | getAuthUser | requireWorkspaceAccess + inline role | nein | withWorkspaceAccess | ⚠️ kein Workspace-Owner-Check |
| [workspaces/[id]/members/suggestions](src/app/api/workspaces/[id]/members/suggestions/route.ts) | GET | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | Org-Filter |
| [workspaces/[id]/picker](src/app/api/workspaces/[id]/picker/route.ts) | GET | getAuthUser | **keine Workspace-Prüfung** | nein | ⚠️ REVIEW | workspace-id ignoriert! |
| [workspaces/[id]/post-chat](src/app/api/workspaces/[id]/post-chat/route.ts) | POST | getAuthUser | requireWorkspaceAccess | nein | withWorkspaceAccess | + Budget-Check |
| [workspaces/[id]/share](src/app/api/workspaces/[id]/share/route.ts) | POST | getAuthUser | canWriteWorkspace | nein | withWorkspaceAccess | |
| [workspaces/briefing](src/app/api/workspaces/briefing/route.ts) | POST | getAuthUser | keine Workspace-Prüfung | nein | withAuth | globales Card-Suggestion-Briefing |

### library · skills · capabilities

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|------------------------|-------|
| [capabilities](src/app/api/capabilities/route.ts) | GET | getAuthUser | org_id-Filter inline + user settings | nein | withAuth | system + org capabilities |
| [capabilities/[id]/outcomes](src/app/api/capabilities/[id]/outcomes/route.ts) | GET | getAuthUser | keine | nein | withAuth | system outcomes |
| [capabilities/org-settings](src/app/api/capabilities/org-settings/route.ts) | GET, PATCH | getAuthUser + inline owner/admin | org_id-Filter inline | nein | withOrgAdmin | org-wide model overrides |
| [capabilities/resolve](src/app/api/capabilities/resolve/route.ts) | POST | getAuthUser | keine | nein | withAuth | |
| [capabilities/settings](src/app/api/capabilities/settings/route.ts) | PATCH | getAuthUser | user_id-Filter inline | nein | withAuth | user preference |
| [library/capabilities](src/app/api/library/capabilities/route.ts) | GET | getAuthUser | scope (system/package) | nein | withAuth | public catalog |
| [library/capabilities/[id]/outcomes](src/app/api/library/capabilities/[id]/outcomes/route.ts) | GET | getAuthUser | keine | nein | withAuth | |
| [library/org-settings](src/app/api/library/org-settings/route.ts) | GET, PATCH | getAuthUser + inline owner/admin | org_id-Filter inline | nein | withOrgAdmin | |
| [library/outcomes](src/app/api/library/outcomes/route.ts) | GET | getAuthUser | keine | nein | withAuth | system outcomes |
| [library/resolve](src/app/api/library/resolve/route.ts) | POST | getAuthUser | keine | nein | withAuth | |
| [library/roles](src/app/api/library/roles/route.ts) | GET, POST | getAuthUser + inline admin | scope-Sichtbarkeit + org_id inline | nein | withAuth + inline scope | create validiert scope |
| [library/roles/[id]](src/app/api/library/roles/[id]/route.ts) | GET, PATCH, DELETE | getAuthUser + inline checkOwnership | scope/owner via checkOwnership | nein | withAuth + manuell | read any; modify=ownership |
| [library/roles/[id]/adopt](src/app/api/library/roles/[id]/adopt/route.ts) | POST | getAuthUser + inline admin | scope/owner | nein | withAuth + inline scope | |
| [library/roles/[id]/import](src/app/api/library/roles/[id]/import/route.ts) | POST | getAuthUser | scope (system/public/package) | nein | withAuth | |
| [library/roles/[id]/publish](src/app/api/library/roles/[id]/publish/route.ts) | POST | getAuthUser + inline ownership | superadmin/owner/user | nein | withAuth + inline | |
| [library/roles/[id]/unpublish](src/app/api/library/roles/[id]/unpublish/route.ts) | POST | getAuthUser + inline ownership | revert scope | nein | withAuth + inline | |
| [library/skills](src/app/api/library/skills/route.ts) | GET, POST | getAuthUser + inline admin | scope + org_id inline | nein | withAuth + inline scope | |
| [library/skills/[id]](src/app/api/library/skills/[id]/route.ts) | GET, PATCH, DELETE | getAuthUser + inline checkOwnership | scope/owner | nein | withAuth + manuell | |
| [library/skills/[id]/adopt](src/app/api/library/skills/[id]/adopt/route.ts) | POST | getAuthUser + inline admin | scope/owner | nein | withAuth + inline scope | |
| [library/skills/[id]/import](src/app/api/library/skills/[id]/import/route.ts) | POST | getAuthUser | scope | nein | withAuth | |
| [library/skills/[id]/publish](src/app/api/library/skills/[id]/publish/route.ts) | POST | getAuthUser + inline ownership | superadmin/owner/user | nein | withAuth + inline | |
| [library/skills/[id]/unpublish](src/app/api/library/skills/[id]/unpublish/route.ts) | POST | getAuthUser + inline ownership | revert scope | nein | withAuth + inline | |
| [library/user-settings](src/app/api/library/user-settings/route.ts) | GET, PATCH | getAuthUser | user_id-Filter inline | nein | withAuth | |
| [library/versions/[entity_type]/[entity_id]](src/app/api/library/versions/[entity_type]/[entity_id]/route.ts) | GET | getAuthUser + inline superadmin | keine (audit log) | nein | withSuperadmin (NEU) | superadmin audit trail |
| [skills](src/app/api/skills/route.ts) | GET, POST | getAuthUser + inline scope | scope (system/org/user) + org_id inline | nein | withAuth + inline scope | |
| [skills/[id]](src/app/api/skills/[id]/route.ts) | GET, PATCH, DELETE | getAuthUser + resolveSkill/canModifySkill | scope via resolver | nein | manuell (resolveSkill) | |

### audit · scan-projects · repo-map · transformations

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|----------------------|-------|
| [audit/compliance-data](src/app/api/audit/compliance-data/route.ts) | GET, POST | getAuthUser inline | keine | nein | withAuth | ⚠️ keine org_id-Filter |
| [audit/export-rules](src/app/api/audit/export-rules/route.ts) | GET | getAuthUser inline | keine | nein | withAuth | ⚠️ keine org_id-Filter |
| [audit/findings/[id]](src/app/api/audit/findings/[id]/route.ts) | PATCH | getAuthUser inline + org_id manuell | org_id via run | nein | withOrgAdmin | |
| [audit/fix/apply](src/app/api/audit/fix/apply/route.ts) | POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | |
| [audit/fix/batch-generate](src/app/api/audit/fix/batch-generate/route.ts) | POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | |
| [audit/fix/consensus](src/app/api/audit/fix/consensus/route.ts) | GET, POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | |
| [audit/fix/generate](src/app/api/audit/fix/generate/route.ts) | POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | |
| [audit/fix/reject](src/app/api/audit/fix/reject/route.ts) | POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | |
| [audit/fix-prompt](src/app/api/audit/fix-prompt/route.ts) | POST | getAuthUser inline | keine | nein | withAuth | ⚠️ keine Tenant-Isolation |
| [audit/fix-session](src/app/api/audit/fix-session/route.ts) | POST | getAuthUser inline | keine | nein | withAuth | ⚠️ keine org_id-Filter |
| [audit/review](src/app/api/audit/review/route.ts) | POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | Rate-Limit pro User |
| [audit/review/status](src/app/api/audit/review/status/route.ts) | GET | getAuthUser inline | keine | nein | withAuth | nur User-Rate-Limit |
| [audit/run](src/app/api/audit/run/route.ts) | POST | requireSuperadmin() | keine | nein | withSuperadmin (NEU) | intern/lokal |
| [audit/runs](src/app/api/audit/runs/route.ts) | GET, POST | getAuthUser inline | org_id manuell (nur GET) | nein | withAuth | org_id-Filter nur im GET |
| [audit/runs/[id]](src/app/api/audit/runs/[id]/route.ts) | GET | getAuthUser inline | org_id manuell | nein | withAuth | |
| [audit/self-assessment](src/app/api/audit/self-assessment/route.ts) | POST | getAuthUser inline | keine | nein | withAuth | ⚠️ nur scanProjectId-basiert |
| [audit/tasks](src/app/api/audit/tasks/route.ts) | GET, POST | 410 Gone | — | nein | — | deprecated |
| [audit/tasks/[id]](src/app/api/audit/tasks/[id]/route.ts) | PATCH, DELETE | 410 Gone | — | nein | — | deprecated |
| [audit/trigger](src/app/api/audit/trigger/route.ts) | POST | inline ['admin','owner','superadmin'] | org_id manuell | nein | withOrgAdmin | lokal (IS_VERCEL-Check) |
| [repo-map/generate](src/app/api/repo-map/generate/route.ts) | POST | getAuthUser | keine | nein | withAuth | ⚠️ keine org_id-Filter |
| [scan-projects/[id]](src/app/api/scan-projects/[id]/route.ts) | PATCH | getAuthUser inline | org_id manuell | nein | withAuth + manuell | |
| [transformations](src/app/api/transformations/route.ts) | GET, POST | getAuthUser | created_by-Filter | nein | withAuth | ⚠️ keine org_id, nur User-Besitz |
| [transformations/[id]](src/app/api/transformations/[id]/route.ts) | GET, PATCH | getAuthUser | created_by-Filter | nein | withAuth | ⚠️ keine org_id, nur User-Besitz |
| [transformations/analyze](src/app/api/transformations/analyze/route.ts) | POST | getAuthUser | org_id (Budget) | nein | withAuth | Budget pro Org |

### feeds · cron · bookmarks · search · knowledge · messages

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|------------------------|-------|
| [bookmarks](src/app/api/bookmarks/route.ts) | GET, POST, DELETE | getAuthUser | user_id-Filter manuell | nein | withAuth | |
| [cron/agents](src/app/api/cron/agents/route.ts) | GET | CRON_SECRET | keine | ja | withCronAuth | täglich 7 Uhr |
| [cron/feed-cleanup](src/app/api/cron/feed-cleanup/route.ts) | GET | CRON_SECRET | keine | ja | withCronAuth | |
| [cron/feed-digest](src/app/api/cron/feed-digest/route.ts) | GET | CRON_SECRET | keine | ja | withCronAuth | |
| [cron/feed-fetch](src/app/api/cron/feed-fetch/route.ts) | GET | CRON_SECRET | keine | ja | withCronAuth | |
| [cron/feed-process](src/app/api/cron/feed-process/route.ts) | GET | CRON_SECRET | keine | ja | withCronAuth | |
| [cron/sync-feeds](src/app/api/cron/sync-feeds/route.ts) | GET | CRON_SECRET | keine | ja | withCronAuth | |
| [feeds/[id]/distributions](src/app/api/feeds/[id]/distributions/route.ts) | GET, POST | getAuthUser | org_id-Filter | nein | withAuth (GET) / withOrgAdmin (POST) | POST: owner/admin |
| [feeds/[id]/distributions/[distId]](src/app/api/feeds/[id]/distributions/[distId]/route.ts) | DELETE | getAuthUser | org_id (inner join) | nein | withOrgAdmin | |
| [feeds/[id]/pause](src/app/api/feeds/[id]/pause/route.ts) | POST | getAuthUser inline | nur user_id | nein | ⚠️ REVIEW | fehlender Org/Source-Ownership-Check |
| [feeds/[id]/resume](src/app/api/feeds/[id]/resume/route.ts) | POST | getAuthUser inline | nur user_id | nein | ⚠️ REVIEW | fehlender Org/Source-Ownership-Check |
| [feeds/[id]/run](src/app/api/feeds/[id]/run/route.ts) | POST | getAuthUser inline | nur user_id | nein | ⚠️ REVIEW | fehlender Org/Source-Ownership-Check |
| [feeds/[id]/runs](src/app/api/feeds/[id]/runs/route.ts) | GET | getAuthUser inline | keine | nein | ⚠️ REVIEW | fehlender Org/Source-Ownership-Check |
| [feeds/data-sources](src/app/api/feeds/data-sources/route.ts) | GET, POST | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [feeds/data-sources/[id]](src/app/api/feeds/data-sources/[id]/route.ts) | PATCH, DELETE | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [feeds/data-sources/[id]/fetch](src/app/api/feeds/data-sources/[id]/fetch/route.ts) | POST | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [feeds/data-sources/[id]/records](src/app/api/feeds/data-sources/[id]/records/route.ts) | GET | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [feeds/inbound/email](src/app/api/feeds/inbound/email/route.ts) | POST | RESEND_INBOUND_SECRET (Bearer) | org_id + source match | ja | withCronAuth | Resend inbound webhook |
| [feeds/notifications](src/app/api/feeds/notifications/route.ts) | GET, PATCH | getAuthUser | user_id-Filter | nein | withAuth | |
| [feeds/notifications/[id]](src/app/api/feeds/notifications/[id]/route.ts) | PATCH | getAuthUser | user_id-Filter manuell | nein | withAuth | |
| [knowledge](src/app/api/knowledge/route.ts) | GET, DELETE | getAuthUser inline | org_id + scope | nein | withAuth (GET) / manuell (DELETE) | DELETE: user/admin role + owner |
| [messages/[id]/flag](src/app/api/messages/[id]/flag/route.ts) | POST | getAuthUser inline | conversation.user_id (inner join) | nein | withAuth | IDOR-Schutz vorhanden |
| [search](src/app/api/search/route.ts) | GET | getAuthUser | workspace_id XOR user_id | nein | withAuth | |

### admin · superadmin

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|------------------------|-------|
| [admin/branding](src/app/api/admin/branding/route.ts) | GET, PATCH | ✅ withOrgAdmin | org_id via me.organization_id | nein | ✅ withOrgAdmin | **bereits migriert (Pilot)** |
| [admin/budget](src/app/api/admin/budget/route.ts) | GET, PATCH | getAdminUser(inline) ['owner','admin','superadmin'] | keine | nein | ⚠️ REVIEW | GET ignoriert org_id-Filter |
| [admin/logs](src/app/api/admin/logs/route.ts) | GET | getAdminUser(inline) ['owner','admin','superadmin'] | org_id manuell (searchParam) | nein | withOrgAdmin | |
| [admin/models](src/app/api/admin/models/route.ts) | GET, POST | getAdminUser(inline) ['owner','admin','superadmin'] | keine (systemweit) | nein | withOrgAdmin | systemweite Modelle, keine org-Isolation nötig |
| [admin/models/[id]](src/app/api/admin/models/[id]/route.ts) | PATCH, DELETE | getAdminUser(inline) ['owner','admin','superadmin'] | keine (systemweit) | nein | withOrgAdmin | |
| [admin/qa/compliance](src/app/api/admin/qa/compliance/route.ts) | GET | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/qa/compliance/[id]](src/app/api/admin/qa/compliance/[id]/route.ts) | PATCH | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/qa/overview](src/app/api/admin/qa/overview/route.ts) | GET | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/qa/performance](src/app/api/admin/qa/performance/route.ts) | GET | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/qa/quality](src/app/api/admin/qa/quality/route.ts) | GET | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/qa/routing](src/app/api/admin/qa/routing/route.ts) | GET | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/qa/runs](src/app/api/admin/qa/runs/route.ts) | POST | isSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [admin/users](src/app/api/admin/users/route.ts) | GET, POST | getAdminUser(inline) ['owner','admin','superadmin'] | org_id manuell (eq) | nein | withOrgAdmin | |
| [superadmin/agents](src/app/api/superadmin/agents/route.ts) | GET | requireSuperadmin (guards.ts) | cross-org | nein | withSuperadmin (NEU) | nutzt alten guard |
| [superadmin/clients](src/app/api/superadmin/clients/route.ts) | GET, POST | requireSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [superadmin/clients/[id]](src/app/api/superadmin/clients/[id]/route.ts) | PATCH, DELETE | requireSuperadmin(inline) | cross-org; org via params | nein | withSuperadmin (NEU) | |
| [superadmin/clients/[id]/activate-user](src/app/api/superadmin/clients/[id]/activate-user/route.ts) | POST | requireSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [superadmin/impersonate](src/app/api/superadmin/impersonate/route.ts) | POST | requireSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [superadmin/impersonate/[id]](src/app/api/superadmin/impersonate/[id]/route.ts) | GET, DELETE | DELETE: requireSuperadmin; **GET: KEINE ⚠️** | cross-org | nein | ⚠️ REVIEW | **GET ohne Auth — SECURITY FINDING** |
| [superadmin/packages](src/app/api/superadmin/packages/route.ts) | GET | inline role==='superadmin' | cross-org | nein | withSuperadmin (NEU) | |
| [superadmin/packages/[orgId]](src/app/api/superadmin/packages/[orgId]/route.ts) | GET, POST | guardSuperadmin(inline) | cross-org; org via params | nein | withSuperadmin (NEU) | |
| [superadmin/perspectives](src/app/api/superadmin/perspectives/route.ts) | GET, POST | requireSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |
| [superadmin/perspectives/[id]](src/app/api/superadmin/perspectives/[id]/route.ts) | PATCH, DELETE | requireSuperadmin(inline) | cross-org | nein | withSuperadmin (NEU) | |

### projects · conversations · perspectives · chat

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|------------------------|-------|
| [chat/generate-chips](src/app/api/chat/generate-chips/route.ts) | POST | getAuthUser | keine | nein | withAuth | |
| [chat/project-intro](src/app/api/chat/project-intro/route.ts) | POST | getAuthUser | keine | nein | withAuth | |
| [chat/stream](src/app/api/chat/stream/route.ts) | POST | getAuthUser | keine | nein | withAuth | + Budget-Check |
| [conversations/[id]/extract-memory](src/app/api/conversations/[id]/extract-memory/route.ts) | POST | getAuthUser | Conversation-Owner (user_id) | nein | withAuth | Owner-Check manuell |
| [conversations/[id]/set-intention](src/app/api/conversations/[id]/set-intention/route.ts) | POST | getAuthUser | Conversation-Owner (user_id) | nein | withAuth | Owner-Check manuell |
| [conversations/[id]/share](src/app/api/conversations/[id]/share/route.ts) | POST, DELETE | getAuthUser | Conversation-Owner (user_id) | nein | withAuth | Owner-Check manuell |
| [conversations/new-from-message](src/app/api/conversations/new-from-message/route.ts) | POST | getAuthUser | keine | nein | withAuth | |
| [conversations/reply](src/app/api/conversations/reply/route.ts) | POST | getAuthUser | Org-Match | nein | withAuth | Owner-Check manuell |
| [perspectives/avatars](src/app/api/perspectives/avatars/route.ts) | GET, POST | getAuthUser inline | Org-Match (scope=org) / user_id (scope=user) | nein | withAuth | POST: Admin für scope=org |
| [perspectives/avatars/[id]](src/app/api/perspectives/avatars/[id]/route.ts) | PATCH, DELETE | getAuthUser inline | Owner (user_id) | nein | withAuth | Owner-Check manuell |
| [perspectives/avatars/[id]/copy](src/app/api/perspectives/avatars/[id]/copy/route.ts) | POST | getAuthUser inline | keine | nein | withAuth | |
| [perspectives/post-to-chat](src/app/api/perspectives/post-to-chat/route.ts) | POST | getAuthUser inline | Conversation-Owner (user_id) | nein | withAuth | Owner-Check manuell |
| [perspectives/query](src/app/api/perspectives/query/route.ts) | POST | getAuthUser inline | keine | nein | withAuth | + Budget-Check |
| [perspectives/settings](src/app/api/perspectives/settings/route.ts) | GET, PATCH | getAuthUser inline | keine | nein | withAuth | |
| [projects](src/app/api/projects/route.ts) | GET, POST | ✅ withAuth | Department-Org-Match | nein | ✅ withAuth | **bereits migriert (Pilot)** |
| [projects/[id]](src/app/api/projects/[id]/route.ts) | GET, PATCH, DELETE | ✅ withProjectAccess | verifyProjectAccess | nein | ✅ withProjectAccess | **bereits migriert (Pilot)** |
| [projects/[id]/chats](src/app/api/projects/[id]/chats/route.ts) | GET | getAuthUser, verifyProjectAccess | verifyProjectAccess | nein | withProjectAccess | |
| [projects/[id]/documents](src/app/api/projects/[id]/documents/route.ts) | GET, POST | getAuthUser, verifyProjectAccess | verifyProjectAccess + Org-ID | nein | withProjectAccess | |
| [projects/[id]/documents/[docId]](src/app/api/projects/[id]/documents/[docId]/route.ts) | DELETE | getAuthUser, verifyProjectAccess | verifyProjectAccess | nein | withProjectAccess | |
| [projects/[id]/memory](src/app/api/projects/[id]/memory/route.ts) | GET, POST, DELETE | getAuthUser, verifyProjectAccess | verifyProjectAccess | nein | withProjectAccess | |
| [projects/[id]/memory/[memId]](src/app/api/projects/[id]/memory/[memId]/route.ts) | PATCH, DELETE | getAuthUser, verifyProjectAccess | verifyProjectAccess | nein | withProjectAccess | |
| [projects/[id]/memory/summary](src/app/api/projects/[id]/memory/summary/route.ts) | POST | getAuthUser, verifyProjectAccess | verifyProjectAccess | nein | withProjectAccess | |
| [projects/[id]/merge](src/app/api/projects/[id]/merge/route.ts) | POST | getAuthUser, verifyProjectAccess (2x) | verifyProjectAccess src+target | nein | withProjectAccess | 2 Projekte — Sonderfall |
| [projects/[id]/profile](src/app/api/projects/[id]/profile/route.ts) | GET, POST | getAuthUser inline + Org-Match | Scan-Projekt-Org-Match | nein | withAuth | Scan-Projekt, nicht Projekt |
| [projects/scan](src/app/api/projects/scan/route.ts) | POST | getAuthUser inline | Org-Match | nein | withAuth | |

### cockpit · agents · guided

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|------------------------|-------|
| [agents](src/app/api/agents/route.ts) | GET, POST | getAuthUser | scope-Filter (org/user/system) | nein | withAuth | POST: role-Check je scope |
| [agents/[id]](src/app/api/agents/[id]/route.ts) | GET, PATCH, DELETE | getAuthUser | scope + Ownership | nein | withAuth | modify=creator oder org-admin |
| [agents/[id]/copy](src/app/api/agents/[id]/copy/route.ts) | POST | getAuthUser | Kopie→user-scope | nein | withAuth | |
| [agents/[id]/run](src/app/api/agents/[id]/run/route.ts) | POST | getAuthUser | **keine in Route (an Engine delegiert)** | nein | ⚠️ REVIEW | verifizieren dass runAgent prüft |
| [agents/[id]/runs](src/app/api/agents/[id]/runs/route.ts) | GET | getAuthUser | scope/org_id/user_id | nein | withAuth | |
| [agents/runs/[run_id]](src/app/api/agents/runs/[run_id]/route.ts) | GET | getAuthUser | org_id/user_id-Match | nein | withAuth | |
| [agents/webhook/[agent_id]](src/app/api/agents/webhook/[agent_id]/route.ts) | POST | HMAC-SHA256 (webhook_secret) | keine User-Auth | ja | withCronAuth | Public Webhook by design |
| [cockpit/artifact-stats](src/app/api/cockpit/artifact-stats/route.ts) | GET | getAuthUser inline | org_id-Filter | nein | withAuth | |
| [cockpit/budget](src/app/api/cockpit/budget/route.ts) | GET | inline admin/owner/superadmin | org_id + role | nein | withOrgAdmin | Admin-only Widget |
| [cockpit/code-health](src/app/api/cockpit/code-health/route.ts) | GET | getAuthUser inline | org_id-Filter | nein | withAuth | |
| [cockpit/feed-highlights](src/app/api/cockpit/feed-highlights/route.ts) | GET | getAuthUser inline | org_id-Filter | nein | withAuth | |
| [cockpit/projects](src/app/api/cockpit/projects/route.ts) | GET | getAuthUser inline | org_id-Filter | nein | withAuth | |
| [cockpit/recent-activity](src/app/api/cockpit/recent-activity/route.ts) | GET | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [cockpit/recommendation](src/app/api/cockpit/recommendation/route.ts) | GET | getAuthUser inline | org_id + user_id | nein | withAuth | |
| [cockpit/setup](src/app/api/cockpit/setup/route.ts) | POST | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [cockpit/team-activity](src/app/api/cockpit/team-activity/route.ts) | GET | inline admin/owner/superadmin | org_id + role | nein | withOrgAdmin | Admin-only Widget |
| [cockpit/widgets](src/app/api/cockpit/widgets/route.ts) | GET, POST | getAuthUser inline | user_id-Filter; POST: adminOnly-meta | nein | withAuth | POST blockt Non-Admins per meta |
| [cockpit/widgets/[id]](src/app/api/cockpit/widgets/[id]/route.ts) | DELETE | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [guided/detect](src/app/api/guided/detect/route.ts) | POST | getAuthUser | keine | nein | withAuth | |
| [guided/resolve](src/app/api/guided/resolve/route.ts) | POST | getAuthUser | org_id + user_id an Resolver | nein | withAuth | |
| [guided/settings](src/app/api/guided/settings/route.ts) | PATCH | getAuthUser | user_id-Filter (upsert) | nein | withAuth | |
| [guided/workflows](src/app/api/guided/workflows/route.ts) | GET, POST | getAuthUser | scope (system/org/user) | nein | withAuth | |
| [guided/workflows/[id]](src/app/api/guided/workflows/[id]/route.ts) | PATCH | getAuthUser | Ownership (user/org-admin) | nein | withAuth | canEdit inline |
| [guided/workflows/[id]/copy](src/app/api/guided/workflows/[id]/copy/route.ts) | POST | getAuthUser | Kopie→user-scope | nein | withAuth | |

### settings · artifacts · sonstige

| Route | Methoden | Auth heute | Ownership/Tenant heute | Service? | Vorgeschlagener Wrapper | Notiz |
|-------|----------|-----------|------------------------|----------|------------------------|-------|
| [announcements](src/app/api/announcements/route.ts) | GET, POST | getAuthUser | org_id (GET); Rolle (POST) | nein | withOrgAdmin (POST) | GET öffentlich-org-weit by design |
| [announcements/[id]](src/app/api/announcements/[id]/route.ts) | PATCH, DELETE | getAuthUser + manuell (owner/org-admin/superadmin) | org_id + ownership | nein | withOrgAdmin (oder manuell) | |
| [artifacts](src/app/api/artifacts/route.ts) | GET, POST | getAuthUser inline | conversation/org/user-Kontext; POST: org-Membership | nein | withAuth | |
| [artifacts/[id]](src/app/api/artifacts/[id]/route.ts) | PATCH, DELETE | getAuthUser inline | org-Membership | nein | withAuth | |
| [artifacts/export-pptx](src/app/api/artifacts/export-pptx/route.ts) | POST | getAuthUser inline | user_id implizit | nein | withAuth | |
| [artifacts/save](src/app/api/artifacts/save/route.ts) | POST | getAuthUser inline | org-Membership | nein | withAuth | auto Workspace-Karten |
| [artifacts/transform](src/app/api/artifacts/transform/route.ts) | POST | **KEINE ⚠️** | keine | nein | ⚠️ REVIEW | stateless JS/TS-Transform — öffentlich by design? |
| [beta/feedback](src/app/api/beta/feedback/route.ts) | POST | getAuthUser inline | user_id implizit | nein | withAuth | |
| [beta/onboarding-complete](src/app/api/beta/onboarding-complete/route.ts) | POST | getAuthUser inline | user_id implizit | nein | withAuth | |
| [beta/waitlist](src/app/api/beta/waitlist/route.ts) | POST | KEINE | keine | ja | manuell (Sonderfall) | **öffentlich by design** — IP-Rate-Limit |
| [debug/feeds](src/app/api/debug/feeds/route.ts) | GET, POST | getAuthUser + assertSuperadmin | keine (404 in production) | nein | manuell (Sonderfall) | prod 404 + Superadmin |
| [health](src/app/api/health/route.ts) | GET | KEINE | keine | ja | manuell (Sonderfall) | **öffentlich by design** — Monitoring |
| [home/org-stats](src/app/api/home/org-stats/route.ts) | GET | getAuthUser inline + Rolle | org_id + Rolle | nein | withOrgAdmin | |
| [images/generate](src/app/api/images/generate/route.ts) | POST | getAuthUser inline | org implizit | nein | withAuth | + Budget-Check |
| [onboarding/complete](src/app/api/onboarding/complete/route.ts) | POST | getAuthUser inline | user_id + org | nein | withAuth | |
| [packages/agents](src/app/api/packages/agents/route.ts) | GET | getAuthUser inline | org_id-Filter | nein | withAuth | |
| [prompt-templates](src/app/api/prompt-templates/route.ts) | GET, POST | getAuthUser inline | user_id / org scope | nein | withAuth | |
| [prompt-templates/[id]](src/app/api/prompt-templates/[id]/route.ts) | PATCH, DELETE | getAuthUser inline | user_id-Filter | nein | withAuth | nur Owner |
| [public/chat](src/app/api/public/chat/route.ts) | POST | KEINE | keine | ja | manuell (Sonderfall) | **öffentlich by design** — Landing-Chatbot, Injection-Detection |
| [s/[token]](src/app/api/s/[token]/route.ts) | GET | getAuthUser + Org-Check | share_token + Org-Zugehörigkeit | nein | manuell (Sonderfall) | Share-Token, gleiche Org nötig |
| [settings/connections](src/app/api/settings/connections/route.ts) | GET, POST | getAuthUser inline | user_id + org (MCP) | nein | withAuth | |
| [settings/ki-context](src/app/api/settings/ki-context/route.ts) | GET, PATCH | getAuthUser inline | user_id-Filter | nein | withAuth | |
| [settings/org](src/app/api/settings/org/route.ts) | GET | getAuthUser inline + Rolle (isAdmin-Flag) | org_id-Filter | nein | withAuth (isAdmin im Body) | GET liest Org-Settings; Rolle nur fürs isAdmin-Flag |
| [settings/profile](src/app/api/settings/profile/route.ts) | GET, PATCH | getAuthUser inline | user_id | nein | withAuth | persönlich |
| [shared/[token]](src/app/api/shared/[token]/route.ts) | GET | KEINE | share_token + share_active | ja | manuell (Sonderfall) | **öffentlich by design** — Workspace-Share |
| [tts](src/app/api/tts/route.ts) | POST | getAuthUser inline | org implizit (Budget) | nein | withAuth | + Budget-Check |
| [usage/stats](src/app/api/usage/stats/route.ts) | GET | getAuthUser inline + Rolle | org_id (Superadmin: alle) | nein | withOrgAdmin | |
| [user/impersonation-sessions](src/app/api/user/impersonation-sessions/route.ts) | GET, PATCH | getAuthUser inline | user_id (target) | nein | withAuth | |

---

## Empfohlene nächste Schritte

1. **Action Item 2b — zwei fehlende Wrapper bauen:** `withWorkspaceAccess` (Workspace-Ownership, analog `withProjectAccess`) + `withSuperadmin` (role==='superadmin'), je mit Unit-Tests. Pflicht **vor** Migration von workspaces/* und superadmin/*.
2. **Findings triagieren** (Abschnitt oben) — die 🔴-Fälle (`superadmin/impersonate/[id]` GET, `feeds/[id]/pause|resume|run|runs`) sind potenzielle echte Lücken und sollten **vor** dem mechanischen Rollout gefixt werden, nicht erst migriert.
3. **Checker (#3)** bauen — die Allowlist „Service-Routen" (alle `cron/*`, `feeds/inbound/email`, `agents/webhook/*`) und „öffentlich by design" (health, public/chat, beta/waitlist, s/[token], shared/[token]) ergibt sich direkt aus diesem Inventar.
4. **Rollout (#5)** in Tranchen nach Feature-Gruppe, Checker als Gate.
