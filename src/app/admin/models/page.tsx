'use client'

import { useEffect, useState } from 'react'
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
    <div className="content-max">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24
        }}
      >
        <h1 style={s.h1}>Modellkatalog</h1>
        <button style={s.btn} onClick={() => setShowNew(true)}>
          + Modell hinzufügen
        </button>
      </div>

      {showNew && (
        <div style={s.newForm}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: 15 }}>Neues Modell</h3>
          <div style={s.formGrid}>
            <input
              style={s.input}
              placeholder="Name (z.B. gpt-4o)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              style={s.input}
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
            >
              {providers.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <input
              style={s.input}
              placeholder="Kosten / 1k Input (€)"
              type="number"
              step="0.000001"
              value={form.cost_per_1k_input}
              onChange={(e) => setForm((f) => ({ ...f, cost_per_1k_input: e.target.value }))}
            />
            <input
              style={s.input}
              placeholder="Kosten / 1k Output (€)"
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
            <button style={s.btn} onClick={createModel} disabled={saving}>
              Speichern
            </button>
            <button style={s.btnGhost} onClick={() => setShowNew(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#555' }}>Lade…</p>
      ) : (
        <table style={s.table}>
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
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{m.description}</div>
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
                    <span style={s.price} onClick={() => setEditing(m.id)}>
                      €{m.cost_per_1k_input} ✎
                    </span>
                  )}
                </td>
                <td style={s.td}>
                  {editing === m.id ? (
                    <InlineEdit
                      value={m.cost_per_1k_output}
                      onSave={(v) => saveEdit(m.id, { cost_per_1k_output: v })}
                    />
                  ) : (
                    <span style={s.price} onClick={() => setEditing(m.id)}>
                      €{m.cost_per_1k_output} ✎
                    </span>
                  )}
                </td>
                <td style={s.td}>
                  <span
                    style={{
                      ...s.badge,
                      background: m.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: m.is_active ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {m.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={s.btnSm} onClick={() => toggleActive(m)}>
                      {m.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      style={{ ...s.btnSm, color: '#ef4444' }}
                      onClick={() => deleteModel(m.id)}
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function InlineEdit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [val, setVal] = useState(String(value))
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <input
        style={{ ...s.input, width: 100, padding: '2px 6px', fontSize: 12 }}
        type="number"
        step="0.000001"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button style={s.btnSm} onClick={() => onSave(parseFloat(val))}>
        ✓
      </button>
    </div>
  )
}

function providerColor(p: string) {
  return (
    { openai: 'rgba(163,181,84,0.15)', anthropic: 'rgba(99,102,241,0.15)', mistral: 'rgba(251,191,36,0.15)', google: 'rgba(239,68,68,0.15)' }[p] ??
    'var(--bg-surface)'
  )
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: 12,
    color: 'var(--text-secondary)',
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)'
  },
  td: {
    fontSize: 13,
    color: 'var(--text-primary)',
    padding: '10px 10px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle'
  },
  btn: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
  btnSm: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12
  },
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none'
  },
  badge: { fontSize: 11, padding: '3px 8px', borderRadius: 4 },
  providerBadge: { fontSize: 11, padding: '3px 8px', borderRadius: 4, color: 'var(--text-secondary)' },
  price: { cursor: 'pointer', color: 'var(--text-secondary)' },
  newForm: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
}
