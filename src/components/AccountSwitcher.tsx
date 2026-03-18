'use client'

import { useEffect, useRef, useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

export type AccountRole = 'superadmin' | 'org_admin' | 'member' | 'viewer'

interface AccountSwitcherProps {
  current: AccountRole
  onChange: (role: AccountRole) => void
}

const ACCOUNTS = [
  { role: 'superadmin' as const, label: 'Superadmin', shortLabel: 'Super',
    description: 'Vollzugriff auf alle Organisationen' },
  { role: 'org_admin'  as const, label: 'Admin',       shortLabel: 'Admin',
    description: 'Organisations-Administrator' },
  { role: 'member'     as const, label: 'Member',      shortLabel: 'Member',
    description: 'Normales Mitglied — Chat, Projekte' },
  { role: 'viewer'     as const, label: 'Viewer',      shortLabel: 'Viewer',
    description: 'Lese-Zugriff, keine Erstellung' },
]

// TODO: Account-Switcher Backend
// Wenn echter Multi-Account: onChange ruft Supabase setSession() mit dem
// entsprechenden User-Token auf. Bis dahin: lokaler State via sessionStorage.

export function AccountSwitcher({ current, onChange }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentAccount = ACCOUNTS.find(a => a.role === current)!

  // Escape closes dropdown
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Click outside closes
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Konto wechseln — aktuell: ${currentAccount.label}`}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(26,23,20,0.06)',
          color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
          fontFamily: 'var(--font-sans, system-ui)',
          transition: 'background var(--t-fast)',
        }}
      >
        <span aria-hidden="true">{currentAccount.shortLabel}</span>
        <CaretDown size={11} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div
            role="presentation"
            aria-hidden="true"
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="Konto wechseln"
            className="animate-dropdown"
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20,
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: 200, padding: 4,
              listStyle: 'none', margin: 0,
            }}
          >
            {ACCOUNTS.map(account => (
              <li
                key={account.role}
                role="option"
                aria-selected={account.role === current}
              >
                <button
                  type="button"
                  onClick={() => { onChange(account.role); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer',
                    borderRadius: 8, textAlign: 'left',
                    fontFamily: 'var(--font-sans, system-ui)',
                    background: account.role === current ? 'var(--active-bg)' : 'transparent',
                    color: account.role === current ? 'var(--active-text)' : 'var(--text-primary)',
                    transition: 'background var(--t-fast)',
                  }}
                  onMouseEnter={e => {
                    if (account.role !== current)
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-2)'
                  }}
                  onMouseLeave={e => {
                    if (account.role !== current)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{account.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{account.description}</div>
                  </div>
                  {account.role === current && (
                    <span aria-hidden="true" style={{ fontSize: 12 }}>✓</span>
                  )}
                  <span className="sr-only">{account.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
