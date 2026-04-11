'use client'

import { useEffect, useState } from 'react'
import { Cube } from '@phosphor-icons/react'
import type { ModelCatalog } from '@/lib/types'

export default function ModelsPage() {
  const [models, setModels] = useState<ModelCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    provider: 'openai',
    cost_per_1k_input: '',
    cost_per_1k_output: '',
    description: ''
  })
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [membersCanSee, setMembersCanSee] = useState(false)
  const [accessSaving, setAccessSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/branding')
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, unknown>) => setMembersCanSee(!!d.members_see_models))
  }, [])

  async function toggleMembersAccess() {
    setAccessSaving(true)
    const next = !membersCanSee
    await fetch('/api/admin/branding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members_see_models: next }),
    })
    setMembersCanSee(next)
    setAccessSaving(false)
  }

  async function load() {
    const res = await fetch('/api/admin/models')
    setModels(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleActive(model: ModelCatalog) {
    await fetch(`/api/admin/models/${model.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !model.is_active })
    })
    await load()
  }

  async function saveEdit(id: string, data: Partial<ModelCatalog>) {
    setSaving(true)
    await fetch(`/api/admin/models/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setEditing(null)
    setSaving(false)
    await load()
  }

  async function createModel() {
    setSaving(true)
    await fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        cost_per_1k_input: parseFloat(form.cost_per_1k_input),
        cost_per_1k_output: parseFloat(form.cost_per_1k_output)
      })
    })
    setShowNew(false)
    setForm({
      name: '',
      provider: 'openai',
      cost_per_1k_input: '',
      cost_per_1k_output: '',
      description: ''
    })
    setSaving(false)
    await load()
  }

  async function deleteModel(id: string) {
    if (!confirm('Modell löschen?')) return
    await fetch(`/api/admin/models/${id}`, { method: 'DELETE' })
    await load()
  }

  const providers = ['openai', 'anthropic', 'mistral', 'google']

  return (
    <div className="content-wide" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Cube size={22} color="var(--text-primary)" weight="bold" />
            Modelle
          </h1>
          <p className="page-header-sub">AI-Modelle verwalten und Kosten konfigurieren</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>
            {showNew ? 'Abbrechen' : '+ Neues Modell'}
          </button>
        </div>
      </div>

      <div style={s.toggleRow}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Modelle für Members sichtbar
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Members können die Modell-Übersicht im Menü sehen (nur lesend)
          </div>
        </div>
        <button
          onClick={toggleMembersAccess}
          disabled={accessSaving}
          style={{
            position: 'relative',
            width: 44,
            height: 24,
            borderRadius: 999,
            background: membersCanSee ? 'var(--accent)' : 'var(--border-medium)',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          aria-checked={membersCanSee}
          role="switch"
          aria-label="Modelle für Members freischalten"
        >
          <span style={{
            position: 'absolute',
            top: 3,
            left: membersCanSee ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--bg-surface-solid)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {showNew && (
        <div style={s.newForm}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: 15 }}>
            Neues Modell
          </h3>
          <div style={{ ...s.formGrid, flexWrap: 'wrap' }}>
            <input
              style={s.input}
              placeholder="Name (z.B. gpt-4o)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              style={s.select}
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
            >
              {providers.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input
              style={s.input}
              placeholder="Kosten / 1k Input"
              type="number"
              step="0.000001"
              value={form.cost_per_1k_input}
              onChange={(e) => setForm((f) => ({ ...f, cost_per_1k_input: e.target.value }))}
            />
            <input
              style={s.input}
              placeholder="Kosten / 1k Output"
              type="number"
              step="0.000001"
              value={form.cost_per_1k_output}
              onChange={(e) => setForm((f) => ({ ...f, cost_per_1k_output: e.target.value }))}
            />
            <input
              style={{ ...s.input, gridColumn: '1 / -1' }}
              placeholder="Beschreibung"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={createModel} disabled={saving}>
              Speichern
            </button>
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ paddingTop: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Lade…</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Modell</th>
                  <th style={s.th}>Provider</th>
                  <th style={s.th}>Kosten / 1k Input</th>
                  <th style={s.th}>Kosten / 1k Output</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                      {m.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {m.description}
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.providerBadge, background: providerColor(m.provider) }}>
                        {m.provider}
                      </span>
                    </td>
                    <td style={s.td}>
                      {editing === m.id ? (
                        <InlineEdit
                          value={m.cost_per_1k_input}
                          onSave={(v) => saveEdit(m.id, { cost_per_1k_input: v })}
                        />
                      ) : (
                        <button style={s.priceBtn} onClick={() => setEditing(m.id)}>
                          €{m.cost_per_1k_input}
                        </button>
                      )}
                    </td>
                    <td style={s.td}>
                      {editing === m.id ? (
                        <InlineEdit
                          value={m.cost_per_1k_output}
                          onSave={(v) => saveEdit(m.id, { cost_per_1k_output: v })}
                        />
                      ) : (
                        <button style={s.priceBtn} onClick={() => setEditing(m.id)}>
                          €{m.cost_per_1k_output}
                        </button>
                      )}
                    </td>
                    <td style={s.td}>
                      <button
                        className={m.is_active ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                        onClick={() => toggleActive(m)}
                      >
                        {m.is_active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(m.id)}>
                          Bearbeiten
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteModel(m.id)}>
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function InlineEdit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [val, setVal] = useState(String(value))
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <input
        style={s.inlineInput}
        type="number"
        step="0.000001"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button className="btn btn-ghost btn-sm" onClick={() => onSave(parseFloat(val))}>
        OK
      </button>
    </div>
  )
}

function providerColor(p: string): string {
  const map: Record<string, string> = {
    openai: 'rgba(163,181,84,0.15)',
    anthropic: 'rgba(99,102,241,0.15)',
    mistral: 'rgba(251,191,36,0.15)',
    google: 'rgba(239,68,68,0.15)',
  }
  return map[p] ?? 'var(--bg-surface)'
}

const s: Record<string, React.CSSProperties> = {
  th: {
    textAlign: 'left' as const,
    fontSize: 12,
    color: 'var(--text-tertiary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  td: {
    fontSize: 13,
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle' as const,
  },
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  select: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  inlineInput: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    borderRadius: 6,
    outline: 'none',
    width: 100,
    padding: '2px 6px',
    fontSize: 12,
  },
  providerBadge: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 4,
    color: 'var(--text-secondary)',
  },
  priceBtn: {
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 13,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 24,
  },
  newForm: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
}
