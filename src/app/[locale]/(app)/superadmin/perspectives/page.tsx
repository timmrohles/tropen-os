'use client'

import { useEffect, useState } from 'react'
import { Eye, Plus, Trash, FloppyDisk, PencilSimple, X } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

// ── Types ─────────────────────────────────────────────────────────────────────

type ContextDefault = 'last_5' | 'last_10' | 'last_20' | 'full' | 'none'

interface Avatar {
  id: string
  name: string
  emoji: string
  description: string | null
  system_prompt: string
  model_id: string
  context_default: ContextDefault
  is_tabula_rasa: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

type FormState = {
  name: string
  emoji: string
  description: string
  system_prompt: string
  model_id: string
  context_default: ContextDefault
  is_tabula_rasa: boolean
  is_active: boolean
  sort_order: number
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  filterBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  avatarCard: { padding: '16px 18px', textAlign: 'left', cursor: 'pointer', position: 'relative' },
  avatarEmoji: { fontSize: 28, lineHeight: 1, marginBottom: 8 },
  avatarName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  avatarDesc: { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 },
  metaRow: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  badge: {
    fontSize: 11, padding: '2px 7px', borderRadius: 4,
    background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
  },
  badgeActive: {
    fontSize: 11, padding: '2px 7px', borderRadius: 4,
    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    color: 'var(--accent)',
  },
  inactiveDot: {
    fontSize: 11, padding: '2px 7px', borderRadius: 4,
    background: 'color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
    color: 'var(--text-tertiary)',
  },
  editCard: { padding: 24, marginTop: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formRow: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 },
  input: {
    width: '100%', padding: '8px 10px', fontSize: 13,
    background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '8px 10px', fontSize: 12, lineHeight: 1.5,
    background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box',
    fontFamily: 'var(--font-mono)',
  },
  select: {
    width: '100%', padding: '8px 10px', fontSize: 13,
    background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text-primary)',
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' },
  formActions: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' },
  deleteConfirm: {
    marginTop: 12, padding: '12px 16px', borderRadius: 8,
    background: 'color-mix(in srgb, var(--error) 10%, transparent)',
    border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
    fontSize: 13, color: 'var(--text-primary)',
  },
  editHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  editTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1 },
}

// ── Empty form ────────────────────────────────────────────────────────────────

function emptyForm(): FormState {
  return {
    name: '',
    emoji: '🤖',
    description: '',
    system_prompt: '',
    model_id: 'claude-haiku-4-5-20251001',
    context_default: 'last_10',
    is_tabula_rasa: false,
    is_active: true,
    sort_order: 0,
  }
}

function avatarToForm(a: Avatar): FormState {
  return {
    name: a.name,
    emoji: a.emoji,
    description: a.description ?? '',
    system_prompt: a.system_prompt,
    model_id: a.model_id,
    context_default: a.context_default,
    is_tabula_rasa: a.is_tabula_rasa,
    is_active: a.is_active,
    sort_order: a.sort_order,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PerspectivesPage() {
  const t = useTranslations('superadmin')
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Avatar | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [filterActive, setFilterActive] = useState<'alle' | 'aktiv' | 'inaktiv'>('alle')

  function loadAvatars() {
    setLoading(true)
    fetch('/api/superadmin/perspectives')
      .then(r => r.json())
      .then(d => setAvatars(d.avatars ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAvatars() }, [])

  function openNew() {
    setSelected(null)
    setIsNew(true)
    setForm(emptyForm())
    setDeleteConfirm(false)
  }

  function openEdit(avatar: Avatar) {
    setSelected(avatar)
    setIsNew(false)
    setForm(avatarToForm(avatar))
    setDeleteConfirm(false)
  }

  function closeForm() {
    setSelected(null)
    setIsNew(false)
    setDeleteConfirm(false)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.system_prompt.trim()) return
    setSaving(true)
    try {
      if (isNew) {
        const res = await fetch('/api/superadmin/perspectives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) { loadAvatars(); closeForm() }
      } else if (selected) {
        const res = await fetch(`/api/superadmin/perspectives/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) { loadAvatars(); closeForm() }
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/perspectives/${selected.id}`, { method: 'DELETE' })
      if (res.ok) { loadAvatars(); closeForm() }
    } finally {
      setDeleting(false)
    }
  }

  const filtered = avatars.filter(a => {
    if (filterActive === 'aktiv') return a.is_active
    if (filterActive === 'inaktiv') return !a.is_active
    return true
  })

  const showForm = isNew || selected !== null

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Eye size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {t('perspectives.title')}
          </h1>
          <p className="page-header-sub">{t('perspectives.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={14} weight="bold" aria-hidden="true" />
            {t('perspectives.newBtn')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={s.filterBar}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['alle', 'aktiv', 'inaktiv'] as const).map(f => (
            <button
              key={f}
              className={filterActive === f ? 'chip chip--active' : 'chip'}
              onClick={() => setFilterActive(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          {filtered.length} Avatar{filtered.length !== 1 ? 'e' : ''}
        </span>
      </div>

      {/* Avatar Grid */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('perspectives.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {t('perspectives.noAvatars')}
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(avatar => (
            <button
              key={avatar.id}
              className="card"
              style={{
                ...s.avatarCard,
                outline: selected?.id === avatar.id ? '2px solid var(--accent)' : 'none',
                outlineOffset: 2,
              }}
              onClick={() => selected?.id === avatar.id ? closeForm() : openEdit(avatar)}
              aria-pressed={selected?.id === avatar.id}
            >
              <div style={s.avatarEmoji}>{avatar.emoji}</div>
              <div style={s.avatarName}>{avatar.name}</div>
              {avatar.description && (
                <div style={s.avatarDesc}>{avatar.description}</div>
              )}
              <div style={s.metaRow}>
                <span style={avatar.is_active ? s.badgeActive : s.inactiveDot}>
                  {avatar.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <span style={s.badge}>#{avatar.sort_order}</span>
                {avatar.is_tabula_rasa && <span style={s.badge}>Tabula Rasa</span>}
                <span style={{ ...s.badge, fontSize: 10 }}>
                  {avatar.model_id.includes('haiku') ? 'Haiku' : 'Sonnet'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Edit / New Form */}
      {showForm && (
        <div className="card" style={s.editCard}>
          <div style={s.editHeader}>
            <PencilSimple size={16} color="var(--accent)" weight="fill" aria-hidden="true" />
            <h2 style={s.editTitle}>
              {isNew ? 'Neuer System-Avatar' : `Bearbeiten: ${selected?.name}`}
            </h2>
            <button
              className="btn btn-ghost"
              onClick={closeForm}
              aria-label="Formular schliessen"
              style={{ padding: '4px 8px' }}
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>

          {/* Row 1: Emoji + Name */}
          <div style={s.formGrid}>
            <div style={s.formRow}>
              <label style={s.label}>{t('perspectives.emojiLabel')}</label>
              <input
                style={{ ...s.input, width: 80, textAlign: 'center', fontSize: 20 }}
                value={form.emoji}
                maxLength={4}
                onChange={e => setField('emoji', e.target.value)}
              />
            </div>
            <div style={s.formRow}>
              <label style={s.label}>{t('perspectives.nameLabel')}</label>
              <input
                style={s.input}
                value={form.name}
                placeholder="z.B. Kritiker"
                onChange={e => setField('name', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div style={s.formRow}>
            <label style={s.label}>{t('perspectives.descLabel')}</label>
            <input
              style={s.input}
              value={form.description}
              placeholder="Kurze Beschreibung des Avatars"
              onChange={e => setField('description', e.target.value)}
            />
          </div>

          {/* System Prompt */}
          <div style={s.formRow}>
            <label style={s.label}>{t('perspectives.promptLabel')}</label>
            <textarea
              style={s.textarea}
              rows={6}
              value={form.system_prompt}
              placeholder="Du bist ein kritischer Analyst..."
              onChange={e => setField('system_prompt', e.target.value)}
            />
          </div>

          {/* Row 2: Model + Context */}
          <div style={s.formGrid}>
            <div style={s.formRow}>
              <label style={s.label}>{t('perspectives.modelLabel')}</label>
              <select
                style={s.select}
                value={form.model_id}
                onChange={e => setField('model_id', e.target.value)}
              >
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (schnell)</option>
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (stark)</option>
              </select>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>{t('perspectives.contextLabel')}</label>
              <select
                style={s.select}
                value={form.context_default}
                onChange={e => setField('context_default', e.target.value as ContextDefault)}
              >
                <option value="last_5">Letzte 5 Nachrichten</option>
                <option value="last_10">Letzte 10 Nachrichten</option>
                <option value="last_20">Letzte 20 Nachrichten</option>
                <option value="full">Vollstandig</option>
                <option value="none">Kein Kontext</option>
              </select>
            </div>
          </div>

          {/* Row 3: Sort order + Checkboxes */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <label style={s.label}>Reihenfolge</label>
              <input
                type="number"
                style={{ ...s.input, width: 80 }}
                value={form.sort_order}
                min={0}
                onChange={e => setField('sort_order', parseInt(e.target.value) || 0)}
              />
            </div>
            <div style={{ paddingTop: 22, display: 'flex', gap: 24 }}>
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setField('is_active', e.target.checked)}
                />
                Aktiv
              </label>
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={form.is_tabula_rasa}
                  onChange={e => setField('is_tabula_rasa', e.target.checked)}
                />
                Tabula Rasa
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={s.formActions}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.system_prompt.trim()}
            >
              <FloppyDisk size={14} weight="fill" aria-hidden="true" />
              {saving ? t('perspectives.saving') : t('perspectives.save')}
            </button>
            {!isNew && (
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(true)}
                style={{ color: 'var(--error)', marginLeft: 'auto' }}
              >
                <Trash size={14} weight="fill" aria-hidden="true" />
                {t('perspectives.delete')}
              </button>
            )}
          </div>

          {/* Delete Confirmation */}
          {deleteConfirm && !isNew && (
            <div style={s.deleteConfirm}>
              <p style={{ margin: '0 0 10px', fontWeight: 500 }}>
                Avatar &ldquo;{selected?.name}&rdquo; wirklich löschen?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? t('perspectives.saving') : t('perspectives.deleteYes')}
                </button>
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(false)}>
                  {t('perspectives.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
