'use client'

import { useState } from 'react'
import { CaretUp, CaretDown } from '@phosphor-icons/react'
import { AgentHealthBadge, type AgentStatus } from './AgentHealthBadge'
import type { AgentTableRow } from '../agents.types'

interface Props {
  agents: AgentTableRow[]
  onSelect: (agent: AgentTableRow) => void
  selectedId?: string
}

type SortKey = 'name' | 'status' | 'version' | 'ruleCount' | 'createdBy' | 'lastUpdated'

function sortAgents(agents: AgentTableRow[], key: SortKey, asc: boolean): AgentTableRow[] {
  return [...agents].sort((a, b) => {
    let av: string | number = a[key] ?? ''
    let bv: string | number = b[key] ?? ''
    if (key === 'ruleCount') { av = a.ruleCount; bv = b.ruleCount }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return asc ? cmp : -cmp
  })
}

const s: Record<string, React.CSSProperties> = {
  tableWrapper: { overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' },
  th: {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  },
  thInner: { display: 'flex', alignItems: 'center', gap: 4 },
  tr: { borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 100ms' },
  td: { padding: '10px 14px', color: 'var(--text-primary)', verticalAlign: 'middle' },
  tdSub: { fontSize: 12, color: 'var(--text-secondary)' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
    padding: '2px 7px', borderRadius: 4,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  catBadge: {
    display: 'inline-block', fontSize: 10, padding: '1px 5px', borderRadius: 3,
    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    color: 'var(--accent)', margin: '1px 2px',
  },
}

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== col) return null
  return sortAsc
    ? <CaretUp size={10} weight="bold" />
    : <CaretDown size={10} weight="bold" />
}

function ColHead({ col, label, sortKey, sortAsc, onSort }: {
  col: SortKey; label: string; sortKey: SortKey; sortAsc: boolean; onSort: (key: SortKey) => void
}) {
  return (
    <th style={s.th} onClick={() => onSort(col)}>
      <div style={s.thInner}>{label}<SortIcon col={col} sortKey={sortKey} sortAsc={sortAsc} /></div>
    </th>
  )
}

export function AgentTable({ agents, onSelect, selectedId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = sortAgents(agents, sortKey, sortAsc)

  return (
    <div style={s.tableWrapper}>
      <table style={s.table}>
        <thead style={s.thead}>
          <tr>
            <ColHead col="status" label="Status" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            <ColHead col="name" label="Agent" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            <ColHead col="version" label="Version" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            <ColHead col="ruleCount" label="Regeln" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            <th style={s.th}>Kategorien</th>
            <ColHead col="createdBy" label="Erstellt durch" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            <ColHead col="lastUpdated" label="Letztes Update" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
            <th style={s.th}>Letzter Check</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((agent) => (
            <tr
              key={agent.id}
              style={{
                ...s.tr,
                background: selectedId === agent.id
                  ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                  : undefined,
              }}
              onClick={() => onSelect(agent)}
              onMouseEnter={(e) => {
                if (selectedId !== agent.id)
                  (e.currentTarget as HTMLTableRowElement).style.background = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'
              }}
              onMouseLeave={(e) => {
                if (selectedId !== agent.id)
                  (e.currentTarget as HTMLTableRowElement).style.background = ''
              }}
            >
              <td style={s.td}>
                <AgentHealthBadge status={agent.status as AgentStatus} lastCheckAt={agent.lastCheckAt} />
              </td>
              <td style={s.td}>
                <span style={{ fontWeight: 500 }}>{agent.name}</span>
                {agent.findingsCount > 0 && (
                  <span style={{ ...s.badge, marginLeft: 8, color: agent.findingsCount > 5 ? '#dc2626' : 'var(--text-tertiary)' }}>
                    {agent.findingsCount} Findings
                  </span>
                )}
              </td>
              <td style={{ ...s.td, ...s.tdSub }}>v{agent.version}</td>
              <td style={{ ...s.td, ...s.tdSub, textAlign: 'center' }}>{agent.ruleCount}</td>
              <td style={s.td}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                  {agent.categoryNames.slice(0, 3).map((cat) => (
                    <span key={cat} style={s.catBadge}>{cat}</span>
                  ))}
                  {agent.categoryNames.length > 3 && (
                    <span style={s.catBadge}>+{agent.categoryNames.length - 3}</span>
                  )}
                </div>
              </td>
              <td style={{ ...s.td, ...s.tdSub }}>
                {agent.createdBy === 'manual' ? 'Manuell' : 'Komitee'}
              </td>
              <td style={{ ...s.td, ...s.tdSub }}>
                {agent.lastUpdated ? new Date(agent.lastUpdated).toLocaleDateString('de-DE') : '—'}
              </td>
              <td style={{ ...s.td, ...s.tdSub }}>
                {agent.lastCheckAt ? new Date(agent.lastCheckAt).toLocaleDateString('de-DE') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
