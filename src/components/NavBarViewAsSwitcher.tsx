'use client'

import type { AccountRole } from './AccountSwitcher'

interface Props {
  viewAs: AccountRole
  viewAsOpen: boolean
  setViewAsOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  onViewAsChange: (role: AccountRole) => void
}

export default function NavBarViewAsSwitcher({ viewAs, viewAsOpen, setViewAsOpen, onViewAsChange }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      {viewAsOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          onClick={() => setViewAsOpen(false)}
        />
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={viewAsOpen}
        aria-label={`Ansicht als: ${viewAs}`}
        onClick={() => setViewAsOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(26,23,20,0.06)',
          color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
          fontFamily: 'var(--font-sans, system-ui)',
        }}
      >
        {({ superadmin: 'Super', org_admin: 'Admin', member: 'Member', viewer: 'Viewer' })[viewAs]}
        <span aria-hidden="true" style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>
      {viewAsOpen && (
        <ul
          role="listbox"
          aria-label="Ansicht wechseln"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 220, padding: 4,
            listStyle: 'none', margin: 0,
          }}
        >
          {([
            { role: 'superadmin' as const, label: 'Superadmin', desc: 'Vollzugriff auf alle Organisationen' },
            { role: 'org_admin'  as const, label: 'Admin',      desc: 'Organisations-Administrator' },
            { role: 'member'     as const, label: 'Member',     desc: 'Normales Mitglied — Chat, Projekte' },
            { role: 'viewer'     as const, label: 'Viewer',     desc: 'Lese-Zugriff, keine Erstellung' },
          ]).map(({ role, label, desc }) => {
            const active = viewAs === role
            return (
              <li key={role} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { onViewAsChange(role); setViewAsOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer',
                    borderRadius: 8, textAlign: 'left',
                    fontFamily: 'var(--font-sans, system-ui)',
                    background: active ? 'var(--active-bg)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-primary)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.04))' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{desc}</div>
                  </div>
                  {active && <span aria-hidden="true" style={{ fontSize: 12 }}>✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
