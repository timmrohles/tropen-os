'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface OrgRow {
  id: string
  name: string
  plan: string
  budget_limit: number | null
  created_at: string
  workspaces: { id: string; name: string; budget_limit: number | null }[]
  organization_settings: { onboarding_completed: boolean }[]
  users: { id: string; email: string; role: string }[]
}

const owner = (org: OrgRow) =>
  org.users.find((u) => u.role === 'owner')?.email ?? '–'

const onboardingDone = (org: OrgRow) =>
  org.organization_settings?.[0]?.onboarding_completed === true

const planBg: Record<string, string> = {
  free: '#1e1e1e',
  pro: '#1a2a3a',
  enterprise: '#1a3a2a',
}

interface EditState {
  org_name: string
  plan: string
  org_budget_limit: string
  workspace_name: string
  workspace_budget_limit: string
  owner_email: string
}

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

  function loadOrgs() {
    setLoading(true)
    fetch('/api/superadmin/clients')
      .then((r) => r.json())
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrgs() }, [])

  function openEdit(org: OrgRow) {
    const ws = org.workspaces?.[0]
    setEditForm({
      org_name: org.name,
      plan: org.plan,
      org_budget_limit: org.budget_limit != null ? String(org.budget_limit) : '',
      workspace_name: ws?.name ?? '',
      workspace_budget_limit: ws?.budget_limit != null ? String(ws.budget_limit) : '',
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
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Clients</h1>
          <p style={s.subtext}>
            {loading ? '' : `${orgs.length} Organisation${orgs.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <Link href="/superadmin/clients/new" style={s.newBtn}>
          + Neuer Client
        </Link>
      </div>

      <div style={s.tableWrapper}>
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
                <th style={s.th}>Workspace</th>
                <th style={s.th}>Owner-Email</th>
                <th style={s.th}>Onboarding</th>
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
                      <span style={{ ...s.badge, background: planBg[org.plan] ?? '#1e1e1e' }}>
                        {org.plan}
                      </span>
                    </td>
                    <td style={s.td}>
                      {org.budget_limit != null ? `€${org.budget_limit}/Mo` : '–'}
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
                    <td style={s.td}>{owner(org)}</td>
                    <td style={s.td}>
                      {onboardingDone(org) ? (
                        <span style={s.badgeDone}>Fertig</span>
                      ) : (
                        <span style={s.badgePending}>Ausstehend</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.editBtn} onClick={() => openEdit(org)}>Bearbeiten</button>
                        <button style={s.activateBtn} onClick={() => { setActivateOrg(org); setActivateMsg('') }}>+ User</button>
                        <button style={s.deleteBtn} onClick={() => setDeleteOrg(org)}>Löschen</button>
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

            <label style={s.label}>Workspace-Name</label>
            <input style={s.input} value={editForm.workspace_name}
              onChange={(e) => setEditForm({ ...editForm, workspace_name: e.target.value })} />

            <label style={s.label}>Budget Workspace (€/Monat, leer = kein Limit)</label>
            <input style={s.input} type="number" value={editForm.workspace_budget_limit}
              onChange={(e) => setEditForm({ ...editForm, workspace_budget_limit: e.target.value })} />

            <label style={s.label}>Owner-Email</label>
            <input style={s.input} type="email" value={editForm.owner_email}
              onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })} />

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => { setEditOrg(null); setEditForm(null) }}>
                Abbrechen
              </button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
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
              Org: <strong style={{ color: '#fff' }}>{activateOrg.name}</strong><br />
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
              <p style={{ ...s.confirmText, color: activateMsg.startsWith('✓') ? '#14b8a6' : '#ef4444', marginTop: 8 }}>
                {activateMsg}
              </p>
            )}

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setActivateOrg(null)}>Schließen</button>
              <button style={s.saveBtn} onClick={handleActivate} disabled={activating || !activateEmail}>
                {activating ? 'Aktivieren…' : 'Aktivieren'}
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
              <strong style={{ color: '#fff' }}>{deleteOrg.name}</strong> und alle zugehörigen
              Daten (Workspace, User, Einstellungen) werden unwiderruflich gelöscht.
            </p>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setDeleteOrg(null)}>Abbrechen</button>
              <button style={s.dangerBtn} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Löschen…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e5e5e5',
    padding: '40px 48px',
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  h1: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4 },
  subtext: { fontSize: 13, color: '#555', margin: 0 },
  newBtn: {
    background: '#14b8a6',
    color: '#000',
    padding: '10px 20px',
    borderRadius: 7,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 13,
    display: 'inline-block',
    flexShrink: 0,
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#e5e5e5' },
  th: {
    fontSize: 11,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid #1e1e1e',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #141414' },
  td: { padding: '12px 12px', verticalAlign: 'middle', color: '#e5e5e5' },
  orgName: { fontWeight: 500, color: '#fff' },
  orgId: { color: '#444', fontSize: 11, marginTop: 2 },
  wsName: { color: '#e5e5e5' },
  badge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#e5e5e5',
    textTransform: 'capitalize',
    letterSpacing: '0.03em',
  },
  badgeDone: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 600, background: '#14b8a620', color: '#14b8a6',
  },
  badgePending: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 4,
    fontSize: 11, fontWeight: 600, background: '#1e1e1e', color: '#666',
  },
  actions: { display: 'flex', gap: 8 },
  editBtn: {
    background: '#1e1e1e',
    border: '1px solid #2a2a2a',
    color: '#e5e5e5',
    padding: '5px 12px',
    borderRadius: 5,
    fontSize: 12,
    cursor: 'pointer',
  },
  activateBtn: {
    background: 'transparent',
    border: '1px solid #14b8a640',
    color: '#14b8a6',
    padding: '5px 12px',
    borderRadius: 5,
    fontSize: 12,
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'transparent',
    border: '1px solid #3f1414',
    color: '#ef4444',
    padding: '5px 12px',
    borderRadius: 5,
    fontSize: 12,
    cursor: 'pointer',
  },
  muted: { color: '#555', fontSize: 14, padding: '24px 0' },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: '32px 36px',
    width: 440,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 12px' },
  label: { fontSize: 11, color: '#666', marginTop: 8 },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '9px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#888',
    padding: '8px 18px',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
  saveBtn: {
    background: '#14b8a6',
    border: 'none',
    color: '#000',
    padding: '8px 18px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerBtn: {
    background: '#ef4444',
    border: 'none',
    color: '#fff',
    padding: '8px 18px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmText: { fontSize: 14, color: '#888', lineHeight: 1.6, margin: '0 0 8px' },
}
