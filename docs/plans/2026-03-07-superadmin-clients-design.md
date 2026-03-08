# Design: Superadmin Client Management

**Datum:** 2026-03-07
**Status:** Approved
**Scope:** Internes Tool für Tropen zum Anlegen neuer Kunden-Organisationen

---

## Entscheidungen

- Keine öffentliche Registrierung – kontrolliertes Wachstum (nur Tropen legt Owner-Accounts an)
- Superadmin-Route direkt in Tropen OS (`/superadmin/*`), kein separates Tool
- Neue Rolle `superadmin` in `users.role` CHECK constraint

---

## Datenmodell

### Migration 011_superadmin.sql
```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'owner', 'admin', 'member', 'viewer'));
```

Tropen-Account bekommt einmalig per SQL `UPDATE users SET role = 'superadmin' WHERE email = 'hello@tropen.de'`.

---

## Routen

| Route | Beschreibung |
|-------|-------------|
| `GET /superadmin/clients` | Übersicht aller Organisationen |
| `GET /superadmin/clients/new` | Formular neuen Client anlegen |
| `POST /api/superadmin/clients` | Client anlegen (org + workspace + invite) |
| `GET /api/superadmin/clients` | Alle Orgs mit Details laden |

---

## Formular-Felder (Client anlegen)

| Feld | Typ | Pflicht | Default |
|------|-----|---------|---------|
| Firmenname | Text | ✅ | – |
| Plan | Select: free/pro/enterprise | ✅ | free |
| Budget-Limit Org (€/Monat) | Zahl | – | kein Limit |
| Workspace-Name | Text | ✅ | „Haupt-Workspace" |
| Budget-Limit Workspace (€/Monat) | Zahl | – | kein Limit |
| Owner E-Mail | E-Mail | ✅ | – |

---

## API-Logik (POST /api/superadmin/clients)

Reihenfolge:
1. Superadmin-Check (Service Role + role = 'superadmin')
2. `organizations` INSERT (name, slug auto-generiert, plan, budget_limit)
3. `workspaces` INSERT (name, organization_id, budget_limit)
4. `organization_settings` INSERT (organization_id, primary_color: '#14b8a6', ai_guide_name: 'Toro')
5. `supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { organization_id, role: 'owner' }, redirectTo: SITE_URL + '/auth/callback' })`
6. Response: { organization, workspace, invited: true }

---

## Übersichts-Tabelle (/superadmin/clients)

Spalten: Firma | Plan | Budget | Workspace | Owner-E-Mail | Onboarding done? | Aktionen (Einladung erneut senden)

---

## Sicherheit

- Middleware: `/superadmin/*` → prüft role = 'superadmin', sonst 403
- Alle `/api/superadmin/*` Routes: `supabaseAdmin` holt User, prüft role in `public.users`
- Kein Link in der normalen NavBar – nur direkte URL

---

## Out of Scope (vorerst)

- Client deaktivieren / löschen
- Plan-Upgrade UI
- Mehrere Workspaces pro Org beim Anlegen
