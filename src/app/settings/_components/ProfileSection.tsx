'use client'

import { useEffect, useState } from 'react'
import { FloppyDisk } from '@phosphor-icons/react'

interface ProfileData {
  full_name?: string
  email?: string
  salutation?: string
  prefs?: { language?: string; chat_style?: string }
}

export function ProfileSection() {
  const [data, setData] = useState<ProfileData>({})
  const [fullName, setFullName] = useState('')
  const [salutation, setSalutation] = useState('')
  const [language, setLanguage] = useState('de')
  const [chatStyle, setChatStyle] = useState('structured')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then((d: ProfileData) => {
        setData(d)
        setFullName(d.full_name ?? '')
        setSalutation(d.salutation ?? '')
        setLanguage(d.prefs?.language ?? 'de')
        setChatStyle(d.prefs?.chat_style ?? 'structured')
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, salutation, language, chat_style: chatStyle }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Profil</span>
      </div>
      <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="settings-field">
          <label className="settings-label" htmlFor="full-name">Name</label>
          <input
            id="full-name"
            type="text"
            className="settings-input"
            placeholder="Dein Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="salutation">Anrede</label>
          <select id="salutation" className="settings-select" value={salutation} onChange={e => setSalutation(e.target.value)}>
            <option value="">Keine Angabe</option>
            <option value="herr">Herr</option>
            <option value="frau">Frau</option>
            <option value="divers">Divers</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label">E-Mail</label>
          <input type="email" className="settings-input settings-input--readonly" readOnly value={data.email ?? ''} />
          <p className="settings-hint">E-Mail kann nicht geändert werden</p>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="language">Sprache</label>
          <select id="language" className="settings-select" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="chat-style">Antwort-Stil</label>
          <select id="chat-style" className="settings-select" value={chatStyle} onChange={e => setChatStyle(e.target.value)}>
            <option value="clear">Klar und knapp</option>
            <option value="structured">Strukturiert</option>
            <option value="detailed">Ausführlich</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={handleSave}
          disabled={saving}
        >
          <FloppyDisk size={14} weight="bold" aria-hidden="true" />
          {saved ? 'Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
