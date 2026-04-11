'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Buildings } from '@phosphor-icons/react'
import type { ImpModal, ImpForm, OrgRow, EditState } from './clients.types'
import { owner, onboardingDone, planStyle, s } from './clients.types'


export default function ClientsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editOrg, setEditOrg] = useState<OrgRow | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteOrg, setDeleteOrg] = useState<OrgRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activateOrg, setActivateOrg] = useState<OrgRow | null>(null)
  const [activateEmail, setActivateEmail] = useState('')
  const [activateRole, setActivateRole] = useState('member')
  const [activating, setActivating] = useState(false)
  const [activateMsg, setActivateMsg] = useState('')
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  const [impModal, setImpModal] = useState<ImpModal | null>(null)
  const [packages, setPackages] = useState<{ id: string; slug: string; name: string; description: string | null; icon: string | null }[]>([])
  const [orgPackages, setOrgPackages] = useState<Record<string, { id: string; package_id: string; is_active: boolean; activated_at: string }[]>>({})
  const [pkgTogglingKey, setPkgTogglingKey] = useState<string | null>(null)
  const [impForm, setImpForm] = useState<ImpForm>({ ticketRef: '', durationMinutes: 30 })
  const [impLoading, setImpLoading] = useState(false)

  function toggleExpand(orgId: string) {
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      next.has(orgId) ? next.delete(orgId) : next.add(orgId)
      return next
    })
  }

  async function openImpersonation() {
    if (!impModal) return
    setImpLoading(true)
    try {
      const res = await fetch('/api/superadmin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: impModal.userId,
          targetEmail: impModal.email,
          targetOrgId: impModal.orgId,
          ticketRef: impForm.ticketRef.trim() || null,
          durationMinutes: impForm.durationMinutes,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setImpModal(null)
        window.open(`/workspaces?_imp=${data.sessionId}`, '_blank')
      }
    } finally {
      setImpLoading(false)
    }
  }

  function loadOrgs() {
    setLoading(true)
    fetch('/api/superadmin/clients')
      .then((r) => r.json())
      .then((json: { data: OrgRow[] }) => setOrgs(json.data ?? []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrgs()
    fetch('/api/superadmin/packages')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPackages(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  async function loadOrgPackages(orgId: string) {
    const res = await fetch(`/api/superadmin/packages/${orgId}`)
    if (!res.ok) return
    const data = await res.json()
    setOrgPackages(prev => ({ ...prev, [orgId]: data }))
  }

  async function handleTogglePackage(orgId: string, packageId: string, currentActive: boolean) {
    const key = `${orgId}:${packageId}`
    setPkgTogglingKey(key)
    try {
      await fetch(`/api/superadmin/packages/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId, is_active: !currentActive }),
      })
      await loadOrgPackages(orgId)
    } finally {
      setPkgTogglingKey(null)
    }
  }

  function openEdit(org: OrgRow) {
    const ws = org.workspaces?.[0]
    setEditForm({
      org_name: org.name,
      plan: org.plan,
      org_budget_limit: org.budget_limit == null ? '' : String(org.budget_limit),
      workspace_name: ws?.name ?? '',
      workspace_budget_limit: ws?.budget_limit == null ? '' : String(ws.budget_limit),
      owner_email: owner(org),
    })
    setEditOrg(org)
  }

  async function handleSave() {
    if (!editOrg || !editForm) return
    setSaving(true)
    const res = await fetch(`/api/superadmin/clients/${editOrg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_name: editForm.org_name,
        plan: editForm.plan,
        org_budget_limit: editForm.org_budget_limit ? Number(editForm.org_budget_limit) : null,
        workspace_name: editForm.workspace_name,
        workspace_budget_limit: editForm.workspace_budget_limit ? Number(editForm.workspace_budget_limit) : null,
        owner_email: editForm.owner_email || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setEditOrg(null)
      setEditForm(null)
      loadOrgs()
    }
  }

  async function handleActivate() {
    if (!activateOrg || !activateEmail) return
    setActivating(true)
    setActivateMsg('')
    const res = await fetch(`/api/superadmin/clients/${activateOrg.id}/activate-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activateEmail, role: activateRole }),
    })
    const data = await res.json()
    setActivating(false)
    if (res.ok) {
      setActivateMsg(`✓ ${activateEmail} wurde als ${activateRole} aktiviert.`)
      setActivateEmail('')
      loadOrgs()
    } else {
      setActivateMsg(`Fehler: ${data.error}`)
    }
  }

  async function handleDelete() {
    if (!deleteOrg) return
    setDeleting(true)
    const res = await fetch(`/api/superadmin/clients/${deleteOrg.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      setDeleteOrg(null)
      loadOrgs()
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Buildings size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Clients
          </h1>
          <p className="page-header-sub">Organisationen, Workspaces und Pakete verwalten</p>
        </div>
        <div className="page-header-actions">
          <Link href="/superadmin/clients/new" className="btn btn-primary">+ Neuer Client</Link>
        </div>
      </div>

      <div className="table-scroll">
        {loading ? (
          <p style={s.muted}>Lade…</p>
        ) : orgs.length === 0 ? (
          <p style={s.muted}>Noch keine Clients angelegt.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Firma</th>
                <th style={s.th}>Plan</th>
                <th style={s.th}>Budget Org</th>
                <th style={s.th}>Department</th>
                <th style={s.th}>User</th>
                <th style={s.th}>Onboarding</th>
                <th style={s.th}>Pakete</th>
                <th style={s.th}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const ws = org.workspaces?.[0]
                return (
                  <tr key={org.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.orgName}>{org.name}</div>
                      <div style={s.orgId}>{org.id.slice(0, 8)}…</div>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...(planStyle[org.plan] ?? { background: '#4a5568', color: '#fff' }) }}>
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
                          {ws.budget_limit != null && (
                            <div style={s.orgId}>€{ws.budget_limit}/Mo</div>
                          )}
                        </div>
                      ) : '–'}
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.expandBtn}
                        onClick={() => toggleExpand(org.id)}
                      >
                        {expandedOrgs.has(org.id) ? '▴' : '▾'} {org.users.length} User
                      </button>
                      {expandedOrgs.has(org.id) && (
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
                                  onClick={() => {
                                    setImpModal({ orgId: org.id, userId: u.id, email: u.email })
                                    setImpForm({ ticketRef: '', durationMinutes: 30 })
                                  }}
                                >
                                  Ansicht öffnen
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      {onboardingDone(org) ? (
                        <span style={s.badgeDone}>Fertig</span>
                      ) : (
                        <span style={s.badgePending}>Ausstehend</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.expandBtn}
                        onClick={() => {
                          if (orgPackages[org.id]) {setOrgPackages(prev => { const n = { ...prev }; delete n[org.id]; return n })}
                          else {loadOrgPackages(org.id)}
                        }}
                      >
                        📦 Pakete
                      </button>
                      {orgPackages[org.id] && (
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
                                  onClick={() => handleTogglePackage(org.id, pkg.id, active)}
                                  disabled={pkgTogglingKey === key}
                                  style={{ background: active ? 'var(--accent)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                                >
                                  {pkgTogglingKey === key ? '…' : active ? 'Aktiv' : 'Inaktiv'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(org)}>Bearbeiten</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => { setActivateOrg(org); setActivateMsg('') }}>+ User</button>
                        {!org.users.some((u) => u.role === 'superadmin') && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteOrg(org)}>Löschen</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editOrg && editForm && (
        <div style={s.overlay} onClick={() => { setEditOrg(null); setEditForm(null) }}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Client bearbeiten</h2>

            <label style={s.label}>Firmenname</label>
            <input style={s.input} value={editForm.org_name}
              onChange={(e) => setEditForm({ ...editForm, org_name: e.target.value })} />

            <label style={s.label}>Plan</label>
            <select style={s.input} value={editForm.plan}
              onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}>
              <option value="free">free</option>
              <option value="pro">pro</option>
              <option value="enterprise">enterprise</option>
            </select>

            <label style={s.label}>Budget Org (€/Monat, leer = kein Limit)</label>
            <input style={s.input} type="number" value={editForm.org_budget_limit}
              onChange={(e) => setEditForm({ ...editForm, org_budget_limit: e.target.value })} />

            <label style={s.label}>Department-Name</label>
            <input style={s.input} value={editForm.workspace_name}
              onChange={(e) => setEditForm({ ...editForm, workspace_name: e.target.value })} />

            <label style={s.label}>Budget Department (€/Monat, leer = kein Limit)</label>
            <input style={s.input} type="number" value={editForm.workspace_budget_limit}
              onChange={(e) => setEditForm({ ...editForm, workspace_budget_limit: e.target.value })} />

            <label style={s.label}>Owner-Email</label>
            <input style={s.input} type="email" value={editForm.owner_email}
              onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })} />

            <div style={s.modalFooter}>
              <button className="btn btn-ghost" onClick={() => { setEditOrg(null); setEditForm(null) }}>
                Abbrechen
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Activate User Modal ── */}
      {activateOrg && (
        <div style={s.overlay} onClick={() => setActivateOrg(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>User aktivieren</h2>
            <p style={s.confirmText}>
              Org: <strong style={{ color: 'var(--text-primary)' }}>{activateOrg.name}</strong><br />
              User muss bereits in Supabase Dashboard angelegt sein.
            </p>

            <label style={s.label}>E-Mail des Users</label>
            <input style={s.input} type="email" placeholder="user@example.com"
              value={activateEmail}
              onChange={(e) => setActivateEmail(e.target.value)} />

            <label style={s.label}>Rolle</label>
            <select style={s.input} value={activateRole}
              onChange={(e) => setActivateRole(e.target.value)}>
              <option value="owner">owner</option>
              <option value="admin">admin</option>
              <option value="member">member</option>
              <option value="viewer">viewer</option>
            </select>

            {activateMsg && (
              <p style={{ ...s.confirmText, color: activateMsg.startsWith('✓') ? 'var(--accent)' : 'var(--error)', marginTop: 8 }}>
                {activateMsg}
              </p>
            )}

            <div style={s.modalFooter}>
              <button className="btn btn-ghost" onClick={() => setActivateOrg(null)}>Schließen</button>
              <button className="btn btn-primary" onClick={handleActivate} disabled={activating || !activateEmail}>
                {activating ? 'Aktivieren…' : 'Aktivieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Impersonation Modal ── */}
      {impModal && (
        <div style={s.overlay} onClick={() => setImpModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Ansicht öffnen</h2>
            <div style={s.impWarning}>
              Du siehst genau was <strong style={{ color: 'var(--text-primary)' }}>{impModal.email}</strong> sieht — nichts mehr.
              Kein Schreiben, Löschen oder Ändern. Diese Session wird protokolliert.
            </div>

            <label style={s.label}>Support-Ticket-Referenz</label>
            <input
              style={s.input}
              placeholder="z.B. TICKET-4321"
              value={impForm.ticketRef}
              onChange={(e) => setImpForm(f => ({ ...f, ticketRef: e.target.value }))}
            />

            <label style={{ ...s.label, marginTop: 12 }}>Dauer</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {[15, 30, 60].map(min => (
                <button
                  key={min}
                  onClick={() => setImpForm(f => ({ ...f, durationMinutes: min }))}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13,
                    cursor: 'pointer', fontWeight: impForm.durationMinutes === min ? 700 : 400,
                    background: impForm.durationMinutes === min ? 'var(--accent)' : 'var(--bg-input)',
                    color: impForm.durationMinutes === min ? '#fff' : 'var(--text-secondary)',
                    border: impForm.durationMinutes === min ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {min} Min
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12, marginBottom: 0 }}>
              Der User sieht in seinen Einstellungen, wann und wie lange seine Ansicht geöffnet wurde.
            </p>

            <div style={s.modalFooter}>
              <button className="btn btn-ghost" onClick={() => setImpModal(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={openImpersonation} disabled={impLoading}>
                {impLoading ? 'Öffne…' : 'In neuem Tab öffnen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteOrg && (
        <div style={s.overlay} onClick={() => setDeleteOrg(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Client löschen?</h2>
            <p style={s.confirmText}>
              <strong style={{ color: 'var(--text-primary)' }}>{deleteOrg.name}</strong> und alle zugehörigen
              Daten (Department, User, Einstellungen) werden unwiderruflich gelöscht.
            </p>
            <div style={s.modalFooter}>
              <button className="btn btn-ghost" onClick={() => setDeleteOrg(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Löschen…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

