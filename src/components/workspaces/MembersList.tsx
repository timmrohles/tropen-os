'use client'

import { useEffect, useRef, useState } from 'react'
import { Trash, UserPlus, User, MagnifyingGlass } from '@phosphor-icons/react'

export type WorkspaceMember = {
  id: string
  user_id: string | null
  email: string | null
  role: 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending' | 'declined'
  invited_by: string | null
  created_at: string
  joined_at: string | null
  full_name?: string | null
}

type OrgUser = { id: string; full_name: string | null; email: string }

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', member: 'Mitglied', viewer: 'Leser' }
const STATUS_LABEL: Record<string, string> = { active: 'Aktiv', pending: 'Ausstehend', declined: 'Abgelehnt' }

const inp: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid var(--border-medium)',
  borderRadius: 7, background: 'var(--bg-surface-solid)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}

export default function MembersList({ workspaceId, members: initial, canAdmin }: {
  workspaceId: string
  members: WorkspaceMember[]
  canAdmin: boolean
}) {
  const [members, setMembers] = useState(initial)
  const [showInvite, setShowInvite] = useState(false)
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<OrgUser[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selected, setSelected] = useState<OrgUser | null>(null)
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load suggestions on query change
  useEffect(() => {
    if (!showInvite || selected) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoadingSuggestions(true)
      fetch(`/api/workspaces/${workspaceId}/members/suggestions?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { setSuggestions(Array.isArray(data) ? data : []); setLoadingSuggestions(false); setShowDropdown(true) })
        .catch(() => setLoadingSuggestions(false))
    }, q ? 250 : 0)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, showInvite, workspaceId, selected])

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  function selectUser(user: OrgUser) {
    setSelected(user)
    setQ(user.full_name ?? user.email)
    setShowDropdown(false)
  }

  function resetInvite() {
    setShowInvite(false); setQ(''); setSelected(null)
    setSuggestions([]); setError(''); setShowDropdown(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!selected && !q.trim()) return
    setInviting(true); setError('')
    try {
      const body = selected
        ? { user_id: selected.id, email: selected.email, role: inviteRole }
        : { email: q.trim(), role: inviteRole }
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const member = await res.json()
      setMembers(prev => [...prev.filter(m => m.id !== member.id), member])
      resetInvite()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setInviting(false)
    }
  }

  async function handleDelete(memberId: string) {
    setDeletingId(memberId)
    try {
      await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, { method: 'DELETE' })
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } finally {
      setDeletingId(null)
    }
  }

  function displayName(m: WorkspaceMember) {
    return m.full_name ?? m.email ?? m.user_id ?? '—'
  }

  return (
    <div>
      {canAdmin && (
        <div style={{ marginBottom: 16 }}>
          {showInvite ? (
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Person search */}
                <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <div className="search-bar-container">
                    <MagnifyingGlass
                      size={13} weight="bold" aria-hidden="true"
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
                    />
                    <input
                      autoFocus
                      className="input"
                      value={q}
                      onChange={e => { setQ(e.target.value); setSelected(null) }}
                      onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
                      placeholder="Name oder E-Mail suchen…"
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                  {showDropdown && (
                    <div className="dropdown" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                      {loadingSuggestions ? (
                        <div className="dropdown-item" style={{ pointerEvents: 'none', color: 'var(--text-tertiary)' }}>Lädt…</div>
                      ) : suggestions.length === 0 ? (
                        <div className="dropdown-item" style={{ pointerEvents: 'none', color: 'var(--text-tertiary)' }}>
                          Keine Treffer — E-Mail direkt eingeben
                        </div>
                      ) : (
                        suggestions.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            className="dropdown-item"
                            onClick={() => selectUser(u)}
                          >
                            <User size={13} weight="bold" aria-hidden="true" />
                            <span>{u.full_name ?? u.email}</span>
                            {u.full_name && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{u.email}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Role select */}
                <select style={{ ...inp, width: 110 }} value={inviteRole} onChange={e => setInviteRole(e.target.value as typeof inviteRole)}>
                  <option value="viewer">Leser</option>
                  <option value="member">Mitglied</option>
                  <option value="admin">Admin</option>
                </select>

                <button type="submit" className="btn btn-primary btn-sm" disabled={inviting || (!selected && !q.trim())}>
                  {inviting ? 'Hinzufügen…' : 'Hinzufügen'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetInvite}>
                  Abbrechen
                </button>
              </div>
              {error && <p role="alert" style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>}
            </form>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} weight="bold" aria-hidden="true" /> Mitglied hinzufügen
            </button>
          )}
        </div>
      )}

      {members.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 24px' }}>
          <User size={28} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
          <div className="empty-state-title">Keine Mitglieder</div>
          <div className="empty-state-text">Füge Personen aus deiner Organisation hinzu.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {members.map(m => (
            <div key={m.id} className="ws-item-row">
              <div className="ws-item-icon">
                <User size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
              </div>
              <div className="ws-item-body">
                <div className="ws-item-title">{displayName(m)}</div>
                {m.email && m.full_name && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.email}</div>
                )}
              </div>
              <div className="ws-item-meta">
                <span className="ws-item-type">{ROLE_LABEL[m.role]}</span>
                <span style={{ fontSize: 11, color: m.status === 'pending' ? 'var(--warning, #b45309)' : 'var(--text-tertiary)' }}>
                  {STATUS_LABEL[m.status]}
                </span>
              </div>
              {canAdmin && (
                <div className="ws-item-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    aria-label="Entfernen"
                    title="Entfernen"
                  >
                    <Trash size={13} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
