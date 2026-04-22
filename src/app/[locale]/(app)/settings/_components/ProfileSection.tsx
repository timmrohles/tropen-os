'use client'

import { useEffect, useState } from 'react'
import { FloppyDisk } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

interface ProfileData {
  full_name?: string
  email?: string
  salutation?: string
  prefs?: { language?: string; chat_style?: string; toro_address?: string; language_style?: string }
}

export function ProfileSection() {
  const t = useTranslations('settings')
  const [data, setData] = useState<ProfileData>({})
  const [fullName, setFullName] = useState('')
  const [salutation, setSalutation] = useState('')
  const [language, setLanguage] = useState('de')
  const [chatStyle, setChatStyle] = useState('structured')
  const [toroAddress, setToroAddress] = useState('')
  const [languageStyle, setLanguageStyle] = useState('')
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
        setToroAddress(d.prefs?.toro_address ?? '')
        setLanguageStyle(d.prefs?.language_style ?? '')
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, salutation, language, chat_style: chatStyle, toro_address: toroAddress, language_style: languageStyle }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">{t('profile.title')}</span>
      </div>
      <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="settings-field">
          <label className="settings-label" htmlFor="full-name">{t('profile.nameLabel')}</label>
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
          <label className="settings-label" htmlFor="salutation">{t('profile.salutationLabel')}</label>
          <select id="salutation" className="settings-select" value={salutation} onChange={e => setSalutation(e.target.value)}>
            <option value="">{t('profile.salutationNone')}</option>
            <option value="herr">{t('profile.salutationMr')}</option>
            <option value="frau">{t('profile.salutationMs')}</option>
            <option value="divers">{t('profile.salutationOther')}</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label">{t('profile.emailLabel')}</label>
          <input type="email" className="settings-input settings-input--readonly" readOnly value={data.email ?? ''} />
          <p className="settings-hint">{t('profile.emailReadOnly')}</p>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="language">{t('profile.languageLabel')}</label>
          <select id="language" className="settings-select" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="de">{t('profile.languageDe')}</option>
            <option value="en">{t('profile.languageEn')}</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="chat-style">{t('profile.chatStyleLabel')}</label>
          <select id="chat-style" className="settings-select" value={chatStyle} onChange={e => setChatStyle(e.target.value)}>
            <option value="clear">{t('profile.chatStyleClear')}</option>
            <option value="structured">{t('profile.chatStyleStructured')}</option>
            <option value="detailed">{t('profile.chatStyleDetailed')}</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="toro-address">{t('profile.toroAddressLabel')}</label>
          <input
            id="toro-address"
            type="text"
            className="settings-input"
            placeholder='z. B. "du", "Sie", "Chef"'
            value={toroAddress}
            onChange={e => setToroAddress(e.target.value)}
          />
          <p className="settings-hint">Wie soll Toro dich ansprechen?</p>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="language-style">{t('profile.langStyleLabel')}</label>
          <textarea
            id="language-style"
            className="settings-input"
            style={{ minHeight: 80, resize: 'vertical' }}
            placeholder='z. B. "Kurz und direkt, keine Floskeln. Bullet Points bevorzugt."'
            value={languageStyle}
            onChange={e => setLanguageStyle(e.target.value)}
          />
          <p className="settings-hint">Persönliche Schreibstil-Hinweise für Toro</p>
        </div>

        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={handleSave}
          disabled={saving}
        >
          <FloppyDisk size={14} weight="bold" aria-hidden="true" />
          {saved ? t('profile.saved') : saving ? t('profile.saving') : t('profile.save')}
        </button>
      </div>
    </div>
  )
}
