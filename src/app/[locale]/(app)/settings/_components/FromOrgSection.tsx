'use client'

import { useEffect, useState } from 'react'
import { FileText } from '@phosphor-icons/react'

interface OrgDoc {
  id: string
  title: string
  file_type: string | null
  file_size: number | null
  status: string
  created_at: string
}

interface OrgSettings {
  organization_display_name: string | null
  ai_guide_name: string | null
  ai_guide_description: string | null
}

interface OrgData {
  docs: OrgDoc[]
  settings: OrgSettings | null
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function FromOrgSection() {
  const [data, setData] = useState<OrgData>({ docs: [], settings: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/org')
      .then(r => r.json())
      .then((d: OrgData) => { setData(d); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  if (loading) return (
    <div className="card">
      <div className="card-body" style={{ padding: '16px 18px' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Lade…</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {data.settings && (
        <div className="card">
          <div className="card-header">
            <span className="card-header-label">Organisation</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Read-only</span>
          </div>
          <div className="card-body" style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 120, flexShrink: 0 }}>Name</span>
              <span style={{ fontSize: 13 }}>{data.settings.organization_display_name ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 120, flexShrink: 0 }}>KI-Guide</span>
              <span style={{ fontSize: 13 }}>{data.settings.ai_guide_name ?? 'Toro'}</span>
            </div>
            {data.settings.ai_guide_description && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 120, flexShrink: 0 }}>Beschreibung</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{data.settings.ai_guide_description}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-header-label">Org-Wissen</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Read-only</span>
        </div>
        <div className="card-body" style={{ padding: '12px 18px' }}>
          {data.docs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Noch keine Org-Dokumente hinterlegt.
            </p>
          ) : (
            data.docs.map(doc => (
              <div key={doc.id} className="settings-doc-row">
                <FileText size={16} weight="fill" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                <span className="settings-doc-name">{doc.title}</span>
                <span className="settings-doc-meta">
                  {doc.file_size ? formatBytes(doc.file_size) : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
