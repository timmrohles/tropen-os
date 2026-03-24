'use client'

import { GearSix } from '@phosphor-icons/react'

export default function SettingsPage() {
  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <GearSix size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Einstellungen
          </h1>
          <p className="page-header-sub">Account, Profil und Präferenzen</p>
        </div>
      </div>

      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Einstellungen werden gerade aufgebaut. Kommt bald.
        </p>
      </div>
    </div>
  )
}
