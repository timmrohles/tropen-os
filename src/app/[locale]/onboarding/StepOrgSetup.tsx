'use client'

import { useRef, useState } from 'react'
import NextImage from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { PRESET_COLORS } from './onboarding.types'
import { s } from './onboarding.styles'

interface StepOrgSetupProps {
  orgId: string
  orgName: string
  setOrgName: (v: string) => void
  logoUrl: string | null
  setLogoUrl: (v: string | null) => void
  logoPreview: string | null
  setLogoPreview: (v: string | null) => void
  primaryColor: string
  setPrimaryColor: (v: string) => void
  guideName: string
  setGuideName: (v: string) => void
  error: string
  setError: (v: string) => void
  uploading: boolean
  setUploading: (v: boolean) => void
  onNext: () => void
}

export default function StepOrgSetup({
  orgId, orgName, setOrgName,
  logoUrl: _logoUrl, setLogoUrl, logoPreview, setLogoPreview,
  primaryColor, setPrimaryColor,
  guideName, setGuideName,
  error, setError, uploading, setUploading,
  onNext,
}: StepOrgSetupProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) { setError('Bitte ein Bild auswählen.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo max. 2 MB.'); return }
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${orgId || 'tmp'}/logo-${Date.now()}.${ext}`
    const { data, error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError('Upload fehlgeschlagen. Stelle sicher, dass der Bucket "organization-logos" existiert.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(data.path)
    setLogoUrl(publicUrl)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadLogo(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadLogo(file)
  }

  return (
    <div style={s.step}>
      <div style={s.stepLabel}>Schritt 1 von 5</div>
      <h1 style={s.h1}>Wie heißt deine Organisation?</h1>
      <p style={s.sub}>Richte dein Department-Branding ein. Du kannst alles später anpassen.</p>

      <div style={s.field}>
        <label style={s.label}>Firmenname *</label>
        <input
          style={s.input}
          placeholder="Muster GmbH"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          autoFocus
        />
      </div>

      <div style={s.field}>
        <label style={s.label}>Logo</label>
        <div
          style={{ ...s.dropZone, ...(dragging ? s.dropZoneActive : {}), ...(logoPreview ? s.dropZoneHasLogo : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {logoPreview ? (
            <NextImage src={logoPreview} alt="Logo" style={s.logoPreview} width={120} height={60} unoptimized />
          ) : uploading ? (
            <span style={s.dropHint}>Wird hochgeladen…</span>
          ) : (
            <>
              <span style={{ fontSize: 28 }}>📁</span>
              <span style={s.dropHint}>Logo ablegen oder klicken</span>
              <span style={s.dropSub}>PNG · SVG · JPG · max. 2 MB</span>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
        {logoPreview && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => { setLogoPreview(null); setLogoUrl(null) }}>
            Logo entfernen
          </button>
        )}
      </div>

      <div style={s.field}>
        <label style={s.label}>Primärfarbe</label>
        <div style={s.colorRow}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              style={{ ...s.colorSwatch, background: c, ...(primaryColor === c ? s.colorSwatchActive : {}) }}
              onClick={() => { setPrimaryColor(c); setShowColorPicker(false) }}
              title={c}
            />
          ))}
          <button
            style={{ ...s.colorSwatch, background: 'var(--accent)', border: '1px dashed var(--text-secondary)' }}
            onClick={() => setShowColorPicker((v) => !v)}
            title="Eigene Farbe"
          >
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>+</span>
          </button>
          {showColorPicker && (
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={s.colorInput}
            />
          )}
        </div>
        <div style={{ ...s.colorPreviewBar, background: primaryColor }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.7)', fontWeight: 600 }}>{primaryColor}</span>
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Name deines KI-Assistenten</label>
        <input
          style={s.input}
          placeholder="Toro"
          value={guideName}
          onChange={(e) => setGuideName(e.target.value)}
        />
        <span style={s.hint}>So heißt dein KI-Assistent im Department. Beliebig wählbar.</span>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <button
        style={{ ...s.btnPrimary, ...(!orgName.trim() || uploading ? s.btnDisabled : {}) }}
        disabled={!orgName.trim() || uploading}
        onClick={onNext}
      >
        Weiter →
      </button>
    </div>
  )
}
