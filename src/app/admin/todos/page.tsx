'use client'

import { useState } from 'react'
import { ListChecks } from '@phosphor-icons/react'
import type { Status, Todo } from './todo.types'
import { TODOS } from './todoData'
import { STATUS_CONFIG, KATEGORIEN, s } from './todoConfig'
import { TodoCard } from './TodoCard'

// ── Komponente ────────────────────────────────────────────────────────────────

export default function TodoPage() {
  const [filterStatus, setFilterStatus] = useState<Status | 'alle'>('alle')
  const [filterKat, setFilterKat] = useState<string>('alle')
  const [hideErledigt, setHideErledigt] = useState(true)

  const filtered = TODOS.filter(t => {
    if (hideErledigt && t.status === 'erledigt') return false
    if (filterStatus !== 'alle' && t.status !== filterStatus) return false
    if (filterKat !== 'alle' && t.kategorie !== filterKat) return false
    return true
  })

  const grouped = KATEGORIEN.reduce<Record<string, Todo[]>>((acc, kat) => {
    const items = filtered.filter(t => t.kategorie === kat)
    if (items.length) acc[kat] = items
    return acc
  }, {})

  const total   = TODOS.length
  const offen   = TODOS.filter(t => t.status === 'offen').length
  const arbeit  = TODOS.filter(t => t.status === 'in_arbeit').length
  const erled   = TODOS.filter(t => t.status === 'erledigt').length
  const hoch    = TODOS.filter(t => t.prioritaet === 'hoch' && t.status !== 'erledigt').length

  return (
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ListChecks size={22} color="var(--text-primary)" weight="bold" />
            To-Do & Compliance Tracker
          </h1>
          <p className="page-header-sub">Alle Tasks aus CLAUDE.md + Roadmap · {total} Einträge gesamt · {erled} erledigt</p>
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        {[
          { value: offen,  label: 'Offen',     color: 'var(--text-secondary)' },
          { value: arbeit, label: 'In Arbeit',  color: 'var(--accent)' },
          { value: erled,  label: 'Erledigt',   color: 'var(--success)' },
          { value: hoch,   label: 'Hohe Prio',  color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter: Status */}
      <div style={s.controls}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</span>
        {(['alle', 'offen', 'in_arbeit', 'erledigt', 'blockiert', 'geplant'] as const).map(s_ => (
          <button key={s_} className={filterStatus === s_ ? 'chip chip--active' : 'chip'} onClick={() => { setFilterStatus(s_); if (s_ === 'erledigt') setHideErledigt(false) }}>
            {s_ === 'alle' ? 'Alle' : STATUS_CONFIG[s_ as Status]?.label ?? s_}
          </button>
        ))}
        <button
          className={hideErledigt ? 'chip chip--active' : 'chip'}
          style={{ marginLeft: 8 }}
          onClick={() => setHideErledigt(v => !v)}
        >
          {hideErledigt ? 'Erledigte ausgeblendet' : 'Erledigte sichtbar'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: 8 }}>Kategorie</span>
        <button className={filterKat === 'alle' ? 'chip chip--active' : 'chip'} onClick={() => setFilterKat('alle')}>Alle</button>
        {KATEGORIEN.map(k => (
          <button key={k} className={filterKat === k ? 'chip chip--active' : 'chip'} onClick={() => setFilterKat(k)}>{k}</button>
        ))}
      </div>

      {/* Liste */}
      {Object.keys(grouped).length === 0 ? (
        <div style={s.empty}>Keine Einträge für diese Filterauswahl.</div>
      ) : (
        Object.entries(grouped).map(([kat, items]) => (
          <div key={kat} style={s.section}>
            <div style={s.sectionTitle}>{kat} · {items.length}</div>
            {items.map(todo => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
