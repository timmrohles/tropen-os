# ADR-010: Rollen-Architektur — Superadmin, OrgRole, WorkspaceRole

**Datum:** 2026-03 — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Tropen OS ist eine Multi-Tenant-Applikation (eine Supabase-Instanz, viele Organisationen).
Innerhalb einer Organisation gibt es Hierarchien: Admins konfigurieren das System,
Member nutzen es, Viewer lesen nur mit. Zusätzlich gibt es einen plattform-weiten
Superadmin (Timm als Betreiber) der alle Organisationen einsehen und verwalten kann.

Innerhalb von Workspaces (Departments) gibt es nochmals separate Berechtigungen
(wer darf Workspace-Inhalte bearbeiten vs. nur lesen).

**Frage:** Wie modellieren wir ein dreistufiges Rollen-System (Platform / Org / Workspace)
ohne übermäßige Komplexität?

---

## Entscheidung

**Drei getrennte Rollen-Ebenen:**

### 1. Platform-Rolle (Superadmin)
- Gespeichert in: `users.role = 'superadmin'`
- Bedeutung: Zugriff auf alle Organisationen, `/superadmin/*` Routes
- Guard: `requireSuperadmin()` in `src/lib/auth/guards.ts`
- Einzig möglicher Superadmin aktuell: Timm (manuell in DB gesetzt)

### 2. Organisations-Rolle (OrgRole)
- Gespeichert in: `users.role` (dieselbe Spalte, aber org-scoped via RLS)
- Werte: `'admin'` | `'member'` | `'viewer'`
- `admin` = Owner + Admin zusammengeführt — kein separates Owner-Konzept
- Guard: `requireOrgAdmin()` prüft `['superadmin', 'admin']` — Superadmin kann alles
- Einsatz: `/admin/*` Layout, Budget-Management, User-Verwaltung, Branding

### 3. Workspace-Rolle (WorkspaceRole)
- Gespeichert in: `workspace_members.role`
- Werte: `'admin'` | `'member'` | `'viewer'`
- Unabhängig von OrgRole — ein Org-Member kann Workspace-Admin sein
- Workspace-Admins verwalten Mitglieder und Einstellungen des Workspace

### AccountSwitcher (Superadmin-only Feature)
Der Superadmin kann die Ansicht wechseln um Org-Rollen zu simulieren:
- Werte: `'superadmin'` | `'admin'` | `'member'` | `'viewer'`
- Gespeichert in `sessionStorage` unter Key `tropen_view_as`
- **Wichtig:** Wert `'admin'` (NICHT `'org_admin'` — Legacy-Wert wird migriert)
- Solo-Selbständige haben denselben Rollen-Typ wie reguläre Orgs — kein Sonder-Typ

### UI-Mapping
| Rolle | Sidebar-Inhalt |
|-------|---------------|
| superadmin | Superadmin-Nav |
| admin/owner | Dashboard, Projekte, Workspaces \| Modelle, Budget, Logs, User, Branding, Department |
| member | Dashboard \| Chat, Projekte, Artefakte, Workspaces \| Feeds, Agenten |
| viewer | Wie admin (read-only — Edit-Buttons TODO deaktivieren) |

---

## Konsequenzen

**Positiv:**
- Einfaches Modell: eine `role`-Spalte pro User, keine M:N-Rollen-Tabelle
- Superadmin-Fallthrough in Guards eliminiert Duplikation (`requireOrgAdmin()` erlaubt beide)
- Workspace-Rollen unabhängig — flexible Team-Struktur ohne Org-Umstrukturierung

**Negativ / Risiken:**
- `users.role` ist org-scoped via RLS aber die Spalte ist global — wenn Multi-Org-Membership
  nötig wird (ein User in mehreren Orgs), brauchen wir eine `org_memberships`-Tabelle
- `viewer`-Rolle ist aktuell UI-seitig noch nicht vollständig enforced (Edit-Buttons aktiv) — Tech Debt
- `'org_admin'` Legacy-Wert muss bei jedem Session-Start migriert werden (Sidebar + TopBar useEffect) — solange bis alle Sessions neu gestartet sind
