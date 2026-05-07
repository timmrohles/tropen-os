'use client'

import { useTranslations } from 'next-intl'
import type { ImpModal, OrgRow } from '../clients.types'
import { onboardingDone, planStyle, s } from '../clients.types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PackageItem = {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
}

export type OrgPackageItem = {
  id: string
  package_id: string
  is_active: boolean
  activated_at: string
}

// ── PackagesCell ──────────────────────────────────────────────────────────────

function PackagesCell({ org, packages, orgPackages, pkgTogglingKey, onToggle, onLoadOrToggleView }: {
  org: OrgRow
  packages: PackageItem[]
  orgPackages: Record<string, OrgPackageItem[]>
  pkgTogglingKey: string | null
  onToggle: (orgId: string, packageId: string, active: boolean) => void
  onLoadOrToggleView: (orgId: string) => void
}) {
  const expanded = !!orgPackages[org.id]
  return (
    <td style={s.td}>
      <button style={s.expandBtn} onClick={() => onLoadOrToggleView(org.id)}>
        📦 Pakete
      </button>
      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {packages.map(pkg => {
            const orgPkg = orgPackages[org.id]?.find(p => p.package_id === pkg.id)
            const active = orgPkg?.is_active ?? false
            const key = `${org.id}:${pkg.id}`
            return (
              <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                <span style={{ fontSize: 14 }}>{pkg.icon}</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{pkg.name}</span>
                <button
                  onClick={() => onToggle(org.id, pkg.id, active)}
                  disabled={pkgTogglingKey === key}
                  style={{ background: active ? 'var(--accent)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: active ? 'var(--text-inverse)' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                >
                  {pkgTogglingKey === key ? '…' : active ? 'Aktiv' : 'Inaktiv'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </td>
  )
}

// ── UserCell ──────────────────────────────────────────────────────────────────

function UserCell({ org, expandedOrgs, onToggleExpand, onOpenImp, viewLabel }: {
  org: OrgRow
  expandedOrgs: Set<string>
  onToggleExpand: (id: string) => void
  onOpenImp: (modal: ImpModal) => void
  viewLabel: string
}) {
  const expanded = expandedOrgs.has(org.id)
  return (
    <td style={s.td}>
      <button style={s.expandBtn} onClick={() => onToggleExpand(org.id)}>
        {expanded ? '▴' : '▾'} {org.users.length} User
      </button>
      {expanded && (
        <div style={s.userList}>
          {org.users.map(u => (
            <div key={u.id} style={s.userRow}>
              <div>
                <div style={s.userEmail}>{u.email}</div>
                <div style={s.userRole}>{u.role}</div>
              </div>
              {u.role !== 'superadmin' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onOpenImp({ orgId: org.id, userId: u.id, email: u.email })}
                >
                  {viewLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </td>
  )
}

// ── OrgTableRow ───────────────────────────────────────────────────────────────

export function OrgTableRow({ org, expandedOrgs, orgPackages, packages, pkgTogglingKey, onToggleExpand, onOpenImp, onOpenEdit, onActivate, onDelete, onTogglePkg, onLoadOrToggleView }: {
  org: OrgRow
  expandedOrgs: Set<string>
  orgPackages: Record<string, OrgPackageItem[]>
  packages: PackageItem[]
  pkgTogglingKey: string | null
  onToggleExpand: (id: string) => void
  onOpenImp: (modal: ImpModal) => void
  onOpenEdit: (org: OrgRow) => void
  onActivate: (org: OrgRow) => void
  onDelete: (org: OrgRow) => void
  onTogglePkg: (orgId: string, packageId: string, active: boolean) => void
  onLoadOrToggleView: (orgId: string) => void
}) {
  const t = useTranslations('superadmin')
  const ws = org.workspaces?.[0]
  const canDelete = !org.users.some(u => u.role === 'superadmin')

  return (
    <tr style={s.tr}>
      <td style={s.td}>
        <div style={s.orgName}>{org.name}</div>
        <div style={s.orgId}>{org.id.slice(0, 8)}…</div>
      </td>
      <td style={s.td}>
        <span style={{ ...s.badge, ...(planStyle[org.plan] ?? { background: 'var(--text-secondary)', color: 'var(--text-inverse)' }) }}>
          {org.plan}
        </span>
      </td>
      <td style={s.td}>
        {org.budget_limit == null ? '–' : `€${org.budget_limit}/Mo`}
      </td>
      <td style={s.td}>
        {ws ? (
          <div>
            <div style={s.wsName}>{ws.name}</div>
            {ws.budget_limit != null && <div style={s.orgId}>€{ws.budget_limit}/Mo</div>}
          </div>
        ) : '–'}
      </td>
      <UserCell
        org={org}
        expandedOrgs={expandedOrgs}
        onToggleExpand={onToggleExpand}
        onOpenImp={onOpenImp}
        viewLabel={t('clients.viewOpen')}
      />
      <td style={s.td}>
        {onboardingDone(org) ? (
          <span style={s.badgeDone}>{t('clients.onboardingDone')}</span>
        ) : (
          <span style={s.badgePending}>{t('clients.onboardingPending')}</span>
        )}
      </td>
      <PackagesCell
        org={org}
        packages={packages}
        orgPackages={orgPackages}
        pkgTogglingKey={pkgTogglingKey}
        onToggle={onTogglePkg}
        onLoadOrToggleView={onLoadOrToggleView}
      />
      <td style={s.td}>
        <div style={s.actions}>
          <button className="btn btn-ghost btn-sm" onClick={() => onOpenEdit(org)}>{t('clients.bearbeiten')}</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => onActivate(org)}>+ User</button>
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(org)}>Löschen</button>
          )}
        </div>
      </td>
    </tr>
  )
}
