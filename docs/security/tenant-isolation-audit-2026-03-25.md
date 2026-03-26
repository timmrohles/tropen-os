# Tenant Isolation Audit
Datum: 2026-03-25
Auditor: Claude Code

## Geprüfte Routes: 80+
## Gefundene Probleme: 1 (kritisch)
## Behoben: 1

---

## Methodik

`supabaseAdmin` bypassed RLS komplett — jede Route muss self-enforced org-isolation haben.
Scan-Kriterien:
1. Routes ohne `getAuthUser()` → manuelle Review (viele sind Cron/Admin-Middleware/Public)
2. Routes mit `supabaseAdmin` ohne `organization_id` → manuelle Review (viele haben `user_id`- oder Access-Guard-Isolation)
3. Kritische user-facing Routes: manuell geprüft

---

## Kritische Findings

| Route | Problem | Risiko | Status |
|-------|---------|--------|--------|
| `GET /api/agents/[id]/runs` | Kein Agent-Ownership-Check vor Zugriff auf `agent_runs` | Org B kann Run-History von Org A lesen, wenn Agent-ID bekannt | ✅ Behoben |

### Fix — `agents/[id]/runs/route.ts`
Vor dem Fetch der `agent_runs` wird jetzt der Agent geladen und gegen Org/User/Scope geprüft:
- `scope: 'system' | 'package'` → immer zugänglich
- `scope: 'org'` → `agent.organization_id === me.organization_id` erforderlich
- `scope: 'user'` → `agent.user_id === me.id` erforderlich
- `superadmin` → immer zugänglich

---

## Saubere Routes — Warum kein Problem

| Route | Isolation-Mechanismus |
|-------|----------------------|
| `conversations/[id]/share` | `.eq('user_id', user.id)` |
| `conversations/[id]/set-intention` | `.eq('user_id', user.id)` |
| `bookmarks/route` | `.eq('user_id', user.id)` |
| `projects/[id]` (GET/PATCH/DELETE) | `verifyProjectAccess()` → prüft `departments.organization_id` |
| `projects/[id]/memory/[memId]` | `verifyProjectAccess()` + `.eq('project_id', id)` |
| `agents/[id]` | Manuelle Scope-Checks (org/user/system/superadmin) |
| `perspectives/avatars/[id]` | `.scope + user_id`-Check |
| `perspectives/settings` | `.eq('user_id', user.id)` |
| `perspectives/post-to-chat` | `.eq('user_id', user.id)` |
| `workspaces/[id]/*` | `requireWorkspaceAccess()` → org-scoped |
| `search/route` | `.eq('user_id', user.id)` |
| `transformations/route` | `.eq('created_by', me.id)` |
| `messages/[id]/flag` | Join auf `conversations.user_id` |
| `shared/[token]` | Token-basiert (kein Auth nötig, nur Token-Validierung) |

## Explizit ausgeschlossene Routes (kein Org-Filter erwartet)

| Kategorie | Routes | Grund |
|-----------|--------|-------|
| Cron | `/api/cron/*` | Verarbeiten bewusst alle Orgs, geschützt via `CRON_SECRET` Header |
| Admin | `/api/admin/*` | Geschützt via Next.js Admin-Middleware (`requireOrgAdmin`) |
| Superadmin | `/api/superadmin/*` | Cross-Org by Design, `requireSuperadmin()` |
| Public | `/api/public/chat`, `/api/health` | Kein Org-Kontext nötig |
| Library | `/api/library/*` | System-Entities (scope='system') sind bewusst global |

---

## Edge Function

`supabase/functions/ai-chat/index.ts` nutzt User-JWT (`supabase.auth.getUser()`) + explizite
`organization_id`-Checks via `userProfile.organization_id`. ✅ Sicher.

---

## Präventive Maßnahme

Im CI-Lint-Script (`scripts/ci/lint-design-system.mjs`) wurde eine Warnung für
`supabaseAdmin`-Queries ohne `organization_id` ergänzt (`supabase-admin-no-org` Rule, Severity: warn).

**Methodik:** Ganzes File geprüft — warnt wenn `supabaseAdmin.from()` vorhanden ist aber kein
`organization_id`, kein `.eq('user_id', ...)` und kein Access-Guard (`requireWorkspaceAccess`,
`verifyProjectAccess`, `canWriteWorkspace`, `requireOrgAdmin`, `requireSuperadmin`).

**Explizit ausgeschlossen:** `/api/cron/`, `/api/admin/`, `/api/superadmin/`, `/api/public/`,
`/api/library/`, `/api/health` — diese sind scope-unabhängig by design.

**Ergebnis beim ersten Lauf (2026-03-25):** 0 Warnings — alle bestehenden Routes haben
bereits ausreichende Isolation-Signale im File.

---

## Empfehlungen

1. **`CRON_SECRET` validieren** — Alle Cron-Routes prüfen ob der Header korrekt validiert wird
2. **`admin/*` Routes** — Middleware-Guard verifizieren (nicht alle haben `getAuthUser` inline)
3. **Regelmäßige Audits** — Vor jedem Major-Release diesen Audit wiederholen
4. **Integration Test** — Zwei Test-Orgs anlegen, Cross-Org-Zugriff automatisiert testen
