'use client'

import { useState } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr'
import type { AgentSource } from '@/lib/audit/types'
import CategoryRowItem from './CategoryRowItem'

type SortKey = 'score' | 'name' | 'weight'

interface DbCategoryScore {
  id: string
  category_id: number
  category_name: string
  category_weight: number
  score: number
  max_score: number
  weighted_score: number
  max_weighted_score: number
  automated_rule_count: number
  manual_rule_count: number
}

interface FindingSummary {
  category_id: number
  status: string
}

interface CategoryBreakdownProps {
  categories: DbCategoryScore[]
  findings?: FindingSummary[]
  onCategoryClick?: (categoryId: number) => void
  highlightedCategoryId?: number | null
  isExternalProject?: boolean
  /** When true, shows ⚠ live-check hint on DB and Security category rows */
  showLiveCheckHint?: boolean
}

/** Primary agent(s) for each audit category */
const CATEGORY_AGENTS: Record<number, AgentSource> = {
  1:  'architecture',
  3:  'security',
  5:  'security',
  12: 'observability',
  13: 'observability',
  18: 'architecture',
  22: 'security',
  25: 'architecture',
}

const AGENT_PILL: Record<AgentSource, { label: string; color: string }> = {
  architecture:     { label: 'Arch',    color: 'var(--accent-dark)' },
  security:         { label: 'Sec',     color: 'var(--error-dark)' },
  observability:    { label: 'Obs',     color: 'var(--text-secondary)' },
  core:             { label: 'Core',    color: 'var(--text-tertiary)' },
  'code-style':     { label: 'Style',   color: 'var(--text-secondary)' },
  'error-handling': { label: 'Err',     color: 'var(--text-secondary)' },
  database:         { label: 'DB',      color: 'var(--accent-dark)' },
  dependencies:     { label: 'Deps',    color: 'var(--text-secondary)' },
  'git-governance': { label: 'Git',     color: 'var(--text-secondary)' },
  'backup-dr':      { label: 'DR',      color: 'var(--text-secondary)' },
  testing:          { label: 'Test',    color: 'var(--accent-dark)' },
  performance:      { label: 'Perf',    color: 'var(--text-secondary)' },
  platform:         { label: 'CI/CD',   color: 'var(--text-secondary)' },
  api:              { label: 'API',     color: 'var(--text-secondary)' },
  'cost-awareness': { label: 'Cost',    color: 'var(--text-secondary)' },
  scalability:      { label: 'Scale',   color: 'var(--text-secondary)' },
  accessibility:    { label: 'A11y',    color: 'var(--accent-dark)' },
  'design-system':  { label: 'DS',      color: 'var(--text-secondary)' },
  content:          { label: 'i18n',    color: 'var(--text-secondary)' },
  legal:            { label: 'Legal',   color: 'var(--text-secondary)' },
  'ai-integration': { label: 'AI',      color: 'var(--accent)' },
  analytics:        { label: 'Track',   color: 'var(--text-secondary)' },
  'security-scan':  { label: 'SecScan', color: '#C42020' },
  dsgvo:            { label: 'DSGVO',   color: 'var(--text-secondary)' },
  bfsg:             { label: 'BFSG',    color: 'var(--text-secondary)' },
  'ai-act':                  { label: 'AI Act',    color: 'var(--accent)' },
  'lighthouse-performance':  { label: 'LH Perf',   color: 'var(--text-secondary)' },
  'lighthouse-accessibility':{ label: 'LH A11y',   color: 'var(--text-secondary)' },
  'lighthouse-best-practices':{ label: 'LH Best',  color: 'var(--text-secondary)' },
  'lighthouse-seo':          { label: 'LH SEO',    color: 'var(--text-secondary)' },
  'npm-audit':               { label: 'npm audit', color: 'var(--error-dark)' },
  'slop':                    { label: 'Slop',      color: 'var(--text-tertiary)' },
  'spec':                    { label: 'Spec',      color: 'var(--text-tertiary)' },
}

function SortBtn({ label, sortKey, active, dir, onClick }: {
  label: string; sortKey: SortKey; active: boolean; dir: 'asc' | 'desc'; onClick: (k: SortKey) => void
}) {
  return (
    <button onClick={() => onClick(sortKey)} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px',
      fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-tertiary)',
      fontWeight: active ? 700 : 400, display: 'inline-flex', alignItems: 'center', gap: 2,
    }}>
      {label}
      {active && (dir === 'asc' ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />)}
    </button>
  )
}

export default function CategoryBreakdown({
  categories,
  findings = [],
  onCategoryClick,
  highlightedCategoryId,
  isExternalProject = false,
  showLiveCheckHint = false,
}: CategoryBreakdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  const openCounts = new Map<number, number>()
  for (const cat of categories) {
    openCounts.set(
      cat.category_id,
      findings.filter(f => f.category_id === cat.category_id && f.status === 'open').length,
    )
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleCategoryClick(cat: DbCategoryScore) {
    onCategoryClick?.(cat.category_id)
    const agent = CATEGORY_AGENTS[cat.category_id] ?? 'all'
    const params = new URLSearchParams(window.location.search)
    params.set('agent', agent)
    params.set('status', 'open')
    router.push(`${pathname}?${params.toString()}`)
    setTimeout(() => {
      document.getElementById('findings-table')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function toggleExpand(categoryId: number) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const sorted = [...categories].sort((a, b) => {
    let v = 0
    if (sortKey === 'score')  v = a.score - b.score
    if (sortKey === 'name')   v = a.category_name.localeCompare(b.category_name)
    if (sortKey === 'weight') v = a.category_weight - b.category_weight
    return sortDir === 'asc' ? v : -v
  })

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>
          Kategorien
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 2 }}>Sortierung:</span>
          <SortBtn label="Score"   sortKey="score"  active={sortKey==='score'}  dir={sortDir} onClick={handleSort} />
          <SortBtn label="Name"    sortKey="name"   active={sortKey==='name'}   dir={sortDir} onClick={handleSort} />
          <SortBtn label="Gewicht" sortKey="weight" active={sortKey==='weight'} dir={sortDir} onClick={handleSort} />
        </div>
      </div>

      {isExternalProject && sorted.filter(c => c.automated_rule_count === 0).length > 2 && (
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, lineHeight: 1.5 }}>
          Einige Checks nur mit Deep Review verfügbar.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sorted.map((cat) => {
          const agentSource = CATEGORY_AGENTS[cat.category_id]
          const agentInfo = agentSource ? AGENT_PILL[agentSource] : undefined
          return (
            <CategoryRowItem
              key={cat.id}
              cat={cat}
              openCount={openCounts.get(cat.category_id) ?? 0}
              isHighlighted={highlightedCategoryId === cat.category_id}
              isExpanded={expandedCategories.has(cat.category_id)}
              agentSource={agentSource}
              agentInfo={agentInfo}
              onToggleExpand={() => toggleExpand(cat.category_id)}
              onCategoryClick={() => handleCategoryClick(cat)}
              hasFindings={findings.length > 0}
              showLiveCheckHint={showLiveCheckHint}
            />
          )
        })}
      </div>
    </div>
  )
}
