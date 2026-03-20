'use client'
// src/app/feeds/_components/DistributionsPanel.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash, FolderSimple, SquaresFour, Bell } from '@phosphor-icons/react'
import type { FeedDistribution } from '@/types/feeds'

interface Target {
  id: string
  name: string
}

interface Props {
  sourceId: string
  projects: Target[]
  workspaces: Target[]
}

const TARGET_TYPE_LABEL: Record<string, string> = {
  project:      'Projekt',
  workspace:    'Workspace',
  notification: 'Notification',
}

function targetIcon(type: string) {
  if (type === 'project')      return <FolderSimple size={14} weight="fill" color="var(--text-secondary)" />
  if (type === 'workspace')    return <SquaresFour size={14} weight="fill" color="var(--text-secondary)" />
  return <Bell size={14} weight="fill" color="var(--text-secondary)" />
}

export default function DistributionsPanel({ sourceId, projects, workspaces }: Props) {
  const [dists, setDists]         = useState<FeedDistribution[]>([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // Form state
  const [targetType, setTargetType] = useState<'project' | 'workspace' | 'notification'>('project')
  const [targetId, setTargetId]     = useState('')
  const [minScore, setMinScore]     = useState(7)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/feeds/${sourceId}/distributions`)
      const json = await res.json()
      setDists(json.distributions ?? [])
    } finally {
      setLoading(false)
    }
  }, [sourceId])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!targetId && targetType !== 'notification') return
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        target_type: targetType,
        target_id:   targetType === 'notification' ? '00000000-0000-0000-0000-000000000000' : targetId,
        min_score:   minScore,
      }
      const res = await fetch(`/api/feeds/${sourceId}/distributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Fehler beim Speichern')
        return
      }
      await load()
      setAdding(false)
      setTargetId('')
      setMinScore(7)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(distId: string) {
    await fetch(`/api/feeds/${sourceId}/distributions/${distId}`, { method: 'DELETE' })
    setDists((prev) => prev.filter((d) => d.id !== distId))
  }

  const targetOptions = targetType === 'project' ? projects : targetType === 'workspace' ? workspaces : []

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Outputs
        </span>
        {!adding && (
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
            <Plus size={14} weight="bold" /> Hinzufügen
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dists.length === 0 && !adding && (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Keine Outputs konfiguriert. Items werden nur im Newscenter angezeigt.
            </p>
          )}

          {dists.map((d) => {
            const targets = d.targetType === 'project' ? projects : d.targetType === 'workspace' ? workspaces : []
            const target = targets.find((t) => t.id === d.targetId)
            return (
              <div key={d.id} className="card" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                {targetIcon(d.targetType)}
                <span style={{ color: 'var(--text-primary)' }}>
                  {TARGET_TYPE_LABEL[d.targetType]}
                  {target ? `: ${target.name}` : d.targetType !== 'notification' ? ` (ID: ${d.targetId.slice(0, 8)}…)` : ''}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>ab Score {d.minScore}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => handleDelete(d.id)}
                  aria-label="Output entfernen"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
            )
          })}

          {adding && (
            <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['project', 'workspace', 'notification'] as const).map((t) => (
                  <button
                    key={t}
                    className={`chip${targetType === t ? ' chip--active' : ''}`}
                    onClick={() => { setTargetType(t); setTargetId('') }}
                  >
                    {TARGET_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>

              {targetType !== 'notification' && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">– {TARGET_TYPE_LABEL[targetType]} wählen –</option>
                  {targetOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Min. Score:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  style={{ width: 56, fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>(1–10)</span>
              </div>

              {error && <p style={{ fontSize: 12, color: 'var(--error, #e53e3e)', margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAdd}
                  disabled={saving || (targetType !== 'notification' && !targetId)}
                >
                  {saving ? 'Speichern…' : 'Hinzufügen'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setError('') }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
