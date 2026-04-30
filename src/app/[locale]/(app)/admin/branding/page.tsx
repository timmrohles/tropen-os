'use client'

import { useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { PaintBrush, UploadSimple, X } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

const PRESET_COLORS = [
  'var(--accent)',
  'var(--brand-preset-indigo)',
  'var(--brand-preset-violet)',
  'var(--brand-preset-rose)',
  'var(--brand-preset-amber)',
  'var(--brand-preset-emerald)',
]

interface BrandingData {
  logo_url: string | null
  primary_color: string
  organization_display_name: string | null
  ai_guide_name: string
  ai_guide_description: string
  ai_assistant_image_url: string | null
}

export default function BrandingPage() {
  const t = useTranslations('adminBranding')
  const tc = useTranslations('common')

  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const assistantImageInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<BrandingData>({
    logo_url: null,
    primary_color: 'var(--accent)',
    organization_display_name: null,
    ai_guide_name: 'Toro',
    ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
    ai_assistant_image_url: null,
  })
  const [orgId, setOrgId] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingAssistant, setUploadingAssistant] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const meta = user.user_metadata as { organization_id?: string }
      if (meta.organization_id) {
        setOrgId(meta.organization_id)
      } else {
        const { data: userProfile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (userProfile?.organization_id) setOrgId(userProfile.organization_id)
      }
    }).catch(() => {})

    fetch('/api/admin/branding')
      .then((r) => r.json())
      .then((d: BrandingData) => {
        setData(d)
        if (d.logo_url) setLogoPreview(d.logo_url)
      }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) { setError('Bitte ein Bild auswaehlen.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo max. 2 MB.'); return }
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${orgId || 'tmp'}/logo-${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError('Upload fehlgeschlagen. Pruefe ob Bucket "organization-logos" existiert.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(uploadData.path)
    setData((prev) => ({ ...prev, logo_url: publicUrl }))
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(false)
  }

  async function uploadAssistantImage(file: File) {
    if (!file.type.startsWith('image/')) { setError('Bitte ein Bild auswaehlen.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Bild max. 2 MB.'); return }
    setUploadingAssistant(true)
    setError('')
    const path = `${orgId || 'tmp'}/assistant-image.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('org-assets')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      setError('Upload fehlgeschlagen. Pruefe ob Bucket "org-assets" existiert.')
      setUploadingAssistant(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('org-assets')
      .getPublicUrl(uploadData.path)
    setData((prev) => ({ ...prev, ai_assistant_image_url: publicUrl }))
    setUploadingAssistant(false)
  }

  async function save() {
    setSaving(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/admin/branding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      document.documentElement.style.setProperty('--primary-color', data.primary_color)
    } else {
      setError(t('saveFailed'))
    }
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <PaintBrush size={22} color="var(--text-primary)" weight="bold" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '20px 24px' }}>

          {/* Logo */}
          <div style={s.field}>
            <label style={s.label}>{t('logoLabel')}</label>
            <div style={s.logoRow}>
              <button
                type="button"
                style={s.dropZone}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <NextImage src={logoPreview} alt="Logo" style={s.logoImg} width={120} height={60} unoptimized />
                ) : uploading ? (
                  <span style={s.dropHint}>{t('uploading')}</span>
                ) : (
                  <span style={s.dropHint}>{t('uploadHint')}</span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
              />
              {logoPreview && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setLogoPreview(null); setData((d) => ({ ...d, logo_url: null })) }}
                >
                  {t('removeButton')}
                </button>
              )}
            </div>
          </div>

          {/* Anzeigename */}
          <div style={s.field}>
            <label style={s.label}>{t('orgNameLabel')}</label>
            <input
              style={s.input}
              placeholder="Muster GmbH"
              value={data.organization_display_name ?? ''}
              onChange={(e) => setData((d) => ({ ...d, organization_display_name: e.target.value || null }))}
            />
          </div>

          {/* Primärfarbe */}
          <div style={s.field}>
            <label style={s.label}>{t('primaryColor')}</label>
            <div style={s.colorRow}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  style={{
                    ...s.colorSwatch,
                    background: c,
                    ...(data.primary_color === c ? s.colorSwatchActive : {})
                  }}
                  onClick={() => { setData((d) => ({ ...d, primary_color: c })); setShowColorPicker(false) }}
                  title={c}
                />
              ))}
              <button
                style={{
                  ...s.colorSwatch,
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border-medium)'
                }}
                onClick={() => setShowColorPicker((v) => !v)}
                title="Eigene Farbe"
              >
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>+</span>
              </button>
              {showColorPicker && (
                <input
                  type="color"
                  value={data.primary_color}
                  onChange={(e) => setData((d) => ({ ...d, primary_color: e.target.value }))}
                  style={s.colorInput}
                />
              )}
            </div>
            <div style={{ ...s.colorBar, background: data.primary_color }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                {data.primary_color}
              </span>
            </div>
          </div>

          {/* Guide Name */}
          <div style={s.field}>
            <label style={s.label}>{t('aiAssistantName')}</label>
            <input
              style={s.input}
              placeholder="Toro"
              value={data.ai_guide_name}
              onChange={(e) => setData((d) => ({ ...d, ai_guide_name: e.target.value }))}
            />
          </div>

          {/* Guide Description */}
          <div style={s.field}>
            <label style={s.label}>{t('aiAssistantDesc')}</label>
            <input
              style={s.input}
              placeholder="Dein KI-Guide durch den Informationsdschungel"
              value={data.ai_guide_description}
              onChange={(e) => setData((d) => ({ ...d, ai_guide_description: e.target.value }))}
            />
          </div>

          {/* Assistent-Bild */}
          <div style={s.field}>
            <label style={s.label}>{t('aiAssistantLabel')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {data.ai_assistant_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.ai_assistant_image_url}
                  alt={data.ai_guide_name}
                  style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }}
                />
              ) : (
                <video
                  src="/animations/Parrot.webm"
                  autoPlay loop muted playsInline
                  style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, opacity: 0.6 }}
                />
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => assistantImageInputRef.current?.click()}
                disabled={uploadingAssistant}
              >
                <UploadSimple size={14} weight="bold" aria-hidden="true" />
                {uploadingAssistant ? t('uploading') : t('uploadImage')}
              </button>
              {data.ai_assistant_image_url && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setData((d) => ({ ...d, ai_assistant_image_url: null }))}
                >
                  <X size={14} weight="bold" aria-hidden="true" />
                  {t('resetToDefault')}
                </button>
              )}
              <input
                ref={assistantImageInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAssistantImage(f) }}
              />
            </div>
          </div>

          {error && <div style={s.errorBox}>{error}</div>}
          {success && <div style={s.successBox}>{t('saveSuccess')}</div>}

          <button className="btn btn-primary" onClick={save} disabled={saving || uploading} style={{ marginTop: 8 }}>
            {saving ? tc('saving') : t('saveChanges')}
          </button>
        </div>
      </div>

      {/* White-Label Premium (locked) */}
      <div className="card">
        <div style={{ padding: '20px 24px' }}>
          <div style={s.lockRow}>
            <span style={s.lockIcon} aria-hidden="true">&#128274;</span>
            <div>
              <div style={s.premiumTitle}>{t('whiteLabelTitle')}</div>
              <div style={s.premiumSub}>{t('whiteLabelSubtitle')}</div>
            </div>
          </div>
          <a
            href="mailto:hello@tropen.de?subject=Anfrage%20White-Label%20Tropen%20OS"
            className="btn btn-ghost"
          >
            {t('whiteLabelCta')}
          </a>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', marginBottom: 20 },
  label: {
    fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
  },
  input: {
    background: 'var(--bg-surface-solid)', border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)', padding: '9px 14px', borderRadius: 7,
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 12 },
  dropZone: {
    flex: 1, border: '1px dashed var(--border-medium)', borderRadius: 8,
    padding: '14px 20px', cursor: 'pointer', background: 'var(--bg-surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 54, font: 'inherit',
  },
  logoImg: { maxHeight: 36, maxWidth: '100%', objectFit: 'contain' } as React.CSSProperties,
  dropHint: { fontSize: 12, color: 'var(--text-tertiary)' },
  colorRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  colorSwatch: {
    width: 26, height: 26, borderRadius: '50%', border: '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s',
  },
  colorSwatchActive: { border: '2px solid var(--text-primary)', transform: 'scale(1.2)' },
  colorInput: { width: 26, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0 },
  colorBar: {
    height: 5, borderRadius: 3, transition: 'background 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6px'
  },
  errorBox: {
    fontSize: 13, color: 'var(--error)', background: 'var(--error-bg)',
    padding: '10px 14px', borderRadius: 6, marginBottom: 12
  },
  successBox: {
    fontSize: 13, color: 'var(--success)', background: 'var(--success-bg)',
    padding: '10px 14px', borderRadius: 6, marginBottom: 12
  },
  lockRow: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
  lockIcon: { fontSize: 20, flexShrink: 0, marginTop: 2 },
  premiumTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  premiumSub: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 },
  domainExample: { color: 'var(--text-tertiary)', fontFamily: 'monospace' },
}
