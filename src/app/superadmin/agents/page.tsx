'use client'

import { useEffect, useState } from 'react'
import { Robot, MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { AgentTable } from './_components/AgentTable'
import { AgentDetailDrawer } from './_components/AgentDetailDrawer'
import type { AgentTableRow } from './agents.types'

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  filterBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  searchWrap: { position: 'relative', flex: 1, minWidth: 200 },
  searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '8px 10px 8px 34px', fontSize: 13,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box',
  },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  stats: { display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, flexWrap: 'wrap' },
  statItem: { display: 'flex', gap: 4, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
}

type StatusFilter = 'all' | 'active' | 'draft' | 'outdated'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<AgentTableRow | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/agents')
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => setError('Agenten konnten nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = agents.filter((a) => {
    const matchesSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.themes.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      a.categoryNames.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const activeCount    = agents.filter((a) => a.status === 'active').length
  const draftCount     = agents.filter((a) => a.status === 'draft').length
  const totalRules     = agents.reduce((s, a) => s + a.ruleCount, 0)
  const totalFindings  = agents.reduce((s, a) => s + a.findingsCount, 0)

  return (
    <div className="content-wide">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Robot size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Agent Rule Packs
          </h1>
          <p className="page-header-sub">
            {agents.length} Agenten — Regelwerke für automatisierte Code-Reviews
          </p>
        </div>
        <div className="page-header-actions">
          {/* kein Button im MVP — Agenten werden via CLI erstellt */}
        </div>
      </div>

      {/* Stats strip */}
      {!loading && agents.length > 0 && (
        <div style={s.stats}>
          <span style={s.statItem}>
            <span style={{ ...s.dot, background: 'var(--accent)' }} />
            {activeCount} aktiv
          </span>
          <span style={s.statItem}>
            <span style={{ ...s.dot, background: '#d97706' }} />
            {draftCount} Entwurf
          </span>
          <span>·</span>
          <span>{totalRules} Regeln total</span>
          <span>·</span>
          <span style={{ color: totalFindings > 0 ? '#dc2626' : 'var(--text-secondary)' }}>
            {totalFindings} Findings (letzter Run)
          </span>
        </div>
      )}

      {/* Filter bar */}
      <div style={s.filterBar}>
        <div style={s.searchWrap}>
          <MagnifyingGlass size={14} color="var(--text-tertiary)" style={s.searchIcon} aria-hidden="true" />
          <input
            style={s.searchInput}
            type="search"
            placeholder="Agent, Theme oder Kategorie suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Agenten suchen"
          />
        </div>
        <div style={s.chips}>
          {(['all', 'active', 'draft', 'outdated'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              className={`chip${statusFilter === f ? ' chip--active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : f === 'draft' ? 'Entwurf' : 'Veraltet'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Agenten werden geladen…
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: '20px 24px', color: '#dc2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          {search || statusFilter !== 'all' ? 'Keine Agenten gefunden.' : 'Keine Agenten im Katalog.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <AgentTable
          agents={filtered}
          onSelect={(a) => setSelected(a.id === selected?.id ? null : a)}
          selectedId={selected?.id}
        />
      )}

      {/* Detail Drawer */}
      {selected && (
        <AgentDetailDrawer
          agent={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
