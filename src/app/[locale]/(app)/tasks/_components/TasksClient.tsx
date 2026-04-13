'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  CheckSquare, Square, Trash, Copy, EyeSlash, Eye,
  CheckCircle, Circle, DownloadSimple, ListChecks,
  FunnelSimple, ArrowCounterClockwise,
} from '@phosphor-icons/react'
import type { AuditTask, ScanProject } from '../page'

type StatusFilter = 'all' | 'open' | 'completed' | 'dismissed'
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'

interface Strings {
  title: string; subtitle: string; exportMarkdown: string; exportPrompt: string
  filterStatus: string; filterProject: string; filterSeverity: string
  statusAll: string; statusOpen: string; statusCompleted: string; statusDismissed: string
  severityAll: string; projectAll: string; projectInternal: string
  noTasks: string; noTasksHint: string; noTasksFiltered: string
  completedLabel: string; dismissedLabel: string; copyPrompt: string
  dismiss: string; undoDismiss: string; markComplete: string; markOpen: string; deleteTask: string
  bulkComplete: string; bulkCopyPrompt: string; bulkDismiss: string; bulkDelete: string
  selectedCount: string; copied: string; promptHeader: string; noFilePath: string; createdAt: string
  severity_critical: string; severity_high: string; severity_medium: string
  severity_low: string; severity_info: string
}

interface Props {
  initialTasks: AuditTask[]
  scanProjects: ScanProject[]
  strings: Strings
}

function severityColor(s: AuditTask['severity']): string {
  switch (s) {
    case 'critical': return 'var(--error)'
    case 'high':     return '#E5A000'
    case 'medium':   return 'var(--text-secondary)'
    case 'low':      return 'var(--text-tertiary)'
    default:         return 'var(--text-tertiary)'
  }
}

function statusColor(task: AuditTask): string {
  if (task.dismissed_at) return 'var(--text-tertiary)'
  if (task.completed)    return 'var(--accent)'
  return '#E5A000'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'gerade eben'
  if (mins < 60)  return `vor ${mins} Min.`
  if (hours < 24) return `vor ${hours} Std.`
  if (days < 30)  return `vor ${days} Tagen`
  return new Date(iso).toLocaleDateString()
}

function buildPrompt(tasks: AuditTask[], header: string): string {
  return header + tasks.map((t, i) =>
    `${i + 1}. ${t.title}${t.file_path ? `\n   Datei: ${t.file_path}` : ''}${t.suggestion ? `\n   Empfehlung: ${t.suggestion}` : ''}`
  ).join('\n\n')
}

function buildMarkdown(tasks: AuditTask[], projectMap: Map<string, string>, internal: string): string {
  const lines: string[] = [
    '# Tasks Export — Tropen OS',
    `Erstellt: ${new Date().toLocaleString()}`,
    '',
  ]
  const groups: Record<string, AuditTask[]> = {}
  for (const t of tasks) {
    const key = t.scan_project_id ?? 'internal'
    ;(groups[key] ??= []).push(t)
  }
  for (const [key, items] of Object.entries(groups)) {
    const name = key === 'internal' ? internal : (projectMap.get(key) ?? key)
    lines.push(`## ${name}`, '')
    for (const t of items) {
      lines.push(
        `### ${t.severity ? `[${t.severity.toUpperCase()}] ` : ''}${t.title}`,
        t.file_path ? `**Datei:** \`${t.file_path}\`` : '',
        t.suggestion ? `**Empfehlung:** ${t.suggestion}` : '',
        `**Erstellt:** ${new Date(t.created_at).toLocaleDateString()}`,
        '',
      )
    }
  }
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n')
}

export function TasksClient({ initialTasks, scanProjects, strings: s }: Props) {
  const [tasks, setTasks]             = useState<AuditTask[]>(initialTasks)
  const [statusFilter, setStatus]     = useState<StatusFilter>('open')
  const [severityFilter, setSeverity] = useState<SeverityFilter>('all')
  const [projectFilter, setProject]   = useState<string>('all')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [copied, setCopied]           = useState(false)
  const [hoveredId, setHoveredId]     = useState<string | null>(null)

  const projectMap = useMemo(() =>
    new Map(scanProjects.map(p => [p.id, p.name])),
    [scanProjects]
  )

  const counts = useMemo(() => ({
    open:      tasks.filter(t => !t.completed && !t.dismissed_at).length,
    completed: tasks.filter(t => t.completed && !t.dismissed_at).length,
    dismissed: tasks.filter(t => !!t.dismissed_at).length,
  }), [tasks])

  const subtitleText = s.subtitle
    .replace('{open}', String(counts.open))
    .replace('{completed}', String(counts.completed))
    .replace('{dismissed}', String(counts.dismissed))

  const filtered = useMemo(() => tasks.filter(t => {
    if (statusFilter === 'open'      && (t.completed || t.dismissed_at)) return false
    if (statusFilter === 'completed' && (!t.completed || t.dismissed_at)) return false
    if (statusFilter === 'dismissed' && !t.dismissed_at) return false
    if (severityFilter !== 'all' && t.severity !== severityFilter) return false
    if (projectFilter === 'internal' && t.scan_project_id !== null) return false
    if (projectFilter !== 'all' && projectFilter !== 'internal' && t.scan_project_id !== projectFilter) return false
    return true
  }), [tasks, statusFilter, severityFilter, projectFilter])

  const allSelected = filtered.length > 0 && filtered.every(t => selected.has(t.id))
  const someSelected = selected.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(filtered.map(t => t.id)))
  }, [allSelected, filtered])

  async function patchTask(id: string, body: object) {
    const res = await fetch(`/api/audit/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/audit/tasks/${id}`, { method: 'DELETE' })
    return res.ok
  }

  async function handleToggleComplete(task: AuditTask) {
    const next = !task.completed
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: next, completed_at: next ? new Date().toISOString() : null } : t))
    await patchTask(task.id, { completed: next })
  }

  async function handleDismiss(task: AuditTask) {
    const isDismissed = !!task.dismissed_at
    const dismissed_at = isDismissed ? null : new Date().toISOString()
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, dismissed_at } : t))
    await patchTask(task.id, { dismissed: !isDismissed })
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    await deleteTask(id)
  }

  function handleCopyPrompt(tasks: AuditTask[]) {
    const text = buildPrompt(tasks, s.promptHeader)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleExportMarkdown(taskList: AuditTask[]) {
    const md = buildMarkdown(taskList, projectMap, s.projectInternal)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-export-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleBulkAction(action: 'complete' | 'dismiss' | 'delete' | 'copy') {
    const ids = Array.from(selected)
    const targetTasks = tasks.filter(t => ids.includes(t.id))
    if (action === 'copy') { handleCopyPrompt(targetTasks); return }
    if (action === 'complete') {
      setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, completed: true, completed_at: new Date().toISOString() } : t))
      await Promise.all(ids.map(id => patchTask(id, { completed: true })))
    }
    if (action === 'dismiss') {
      const now = new Date().toISOString()
      setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, dismissed_at: now } : t))
      await Promise.all(ids.map(id => patchTask(id, { dismissed: true })))
    }
    if (action === 'delete') {
      setTasks(prev => prev.filter(t => !ids.includes(t.id)))
      await Promise.all(ids.map(id => deleteTask(id)))
    }
    setSelected(new Set())
  }

  const severityLabel = (sev: AuditTask['severity']) => {
    if (!sev) return ''
    return (s as unknown as Record<string, string>)[`severity_${sev}`] ?? sev
  }

  const projectOptions = [
    { value: 'all', label: s.projectAll },
    { value: 'internal', label: s.projectInternal },
    ...scanProjects.map(p => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="content-max">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ListChecks size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {s.title}
          </h1>
          <p className="page-header-sub">{subtitleText}</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-ghost"
            onClick={() => handleExportMarkdown(filtered)}
            disabled={filtered.length === 0}
          >
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            {s.exportMarkdown}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => handleCopyPrompt(filtered.filter(t => !t.completed && !t.dismissed_at))}
            disabled={filtered.filter(t => !t.completed && !t.dismissed_at).length === 0}
          >
            <Copy size={16} weight="bold" aria-hidden="true" />
            {copied ? s.copied : s.exportPrompt}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FunnelSimple size={14} color="var(--text-tertiary)" weight="bold" aria-hidden="true" />
          {(['all', 'open', 'completed', 'dismissed'] as StatusFilter[]).map(v => (
            <button
              key={v}
              className={`chip${statusFilter === v ? ' chip--active' : ''}`}
              onClick={() => { setStatus(v); setSelected(new Set()) }}
            >
              {s[`status${v.charAt(0).toUpperCase() + v.slice(1)}` as keyof Strings] as string}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(['all', 'critical', 'high', 'medium', 'low'] as SeverityFilter[]).map(v => (
            <button
              key={v}
              className={`chip${severityFilter === v ? ' chip--active' : ''}`}
              onClick={() => setSeverity(v)}
              style={v !== 'all' && severityFilter === v ? { borderColor: severityColor(v) } : undefined}
            >
              {v === 'all' ? s.severityAll : severityLabel(v as AuditTask['severity'])}
            </button>
          ))}
        </div>

        <select
          value={projectFilter}
          onChange={e => setProject(e.target.value)}
          style={{
            fontSize: 13,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface-solid)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          aria-label={s.filterProject}
        >
          {projectOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', marginBottom: 12,
          background: 'var(--accent-light)',
          borderRadius: 8,
          border: '1px solid rgba(45,122,80,0.2)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginRight: 8 }}>
            {s.selectedCount.replace('{count}', String(selected.size))}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => handleBulkAction('complete')}>
            <CheckCircle size={14} weight="bold" aria-hidden="true" /> {s.bulkComplete}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleBulkAction('copy')}>
            <Copy size={14} weight="bold" aria-hidden="true" /> {copied ? s.copied : s.bulkCopyPrompt}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleBulkAction('dismiss')}>
            <EyeSlash size={14} weight="bold" aria-hidden="true" /> {s.bulkDismiss}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleBulkAction('delete')}
            style={{ color: 'var(--error)' }}
          >
            <Trash size={14} weight="bold" aria-hidden="true" /> {s.bulkDelete}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
          <ListChecks size={48} color="var(--border)" weight="bold" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{s.noTasks}</p>
          <p style={{ fontSize: 14 }}>{s.noTasksHint}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: 14 }}>{s.noTasksFiltered}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Select-all row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 12px', marginBottom: 4,
          }}>
            <button
              onClick={toggleAll}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
              aria-label={allSelected ? 'Alle abwählen' : 'Alle auswählen'}
            >
              {allSelected
                ? <CheckSquare size={16} weight="fill" color="var(--accent)" />
                : <Square size={16} weight="bold" />}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {filtered.length} {filtered.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          {/* Task rows */}
          {filtered.map(task => {
            const isDismissed = !!task.dismissed_at
            const isCompleted = task.completed && !isDismissed
            const isSelected  = selected.has(task.id)
            const isHovered   = hoveredId === task.id
            const projName = task.scan_project_id
              ? (projectMap.get(task.scan_project_id) ?? task.scan_project_id)
              : null

            return (
              <div
                key={task.id}
                onMouseEnter={() => setHoveredId(task.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 12px',
                  borderRadius: 8,
                  background: isSelected ? 'var(--accent-light)' : isHovered ? 'rgba(26,23,20,0.03)' : 'transparent',
                  opacity: isDismissed ? 0.45 : 1,
                  transition: 'background 100ms',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(task.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2, color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                  aria-label={isSelected ? 'Abwählen' : 'Auswählen'}
                >
                  {isSelected
                    ? <CheckSquare size={16} weight="fill" color="var(--accent)" />
                    : <Square size={16} weight="bold" />}
                </button>

                {/* Complete toggle */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2, color: statusColor(task), display: 'flex', alignItems: 'center' }}
                  aria-label={isCompleted ? s.markOpen : s.markComplete}
                  title={isCompleted ? s.markOpen : s.markComplete}
                >
                  {isCompleted
                    ? <CheckCircle size={18} weight="fill" />
                    : <Circle size={18} weight="bold" />}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: isDismissed ? 'var(--text-tertiary)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: isCompleted || isDismissed ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {/* Severity badge */}
                    {task.severity && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                        padding: '1px 7px', borderRadius: 4,
                        background: task.severity === 'critical' ? 'rgba(239,68,68,0.1)' : task.severity === 'high' ? 'rgba(229,160,0,0.12)' : 'rgba(26,23,20,0.06)',
                        color: severityColor(task.severity),
                        border: `1px solid ${task.severity === 'critical' ? 'rgba(239,68,68,0.25)' : task.severity === 'high' ? 'rgba(229,160,0,0.3)' : 'var(--border)'}`,
                      }}>
                        {severityLabel(task.severity)}
                      </span>
                    )}
                    {/* Project badge */}
                    {projName && (
                      <span style={{
                        fontSize: 11, padding: '1px 7px', borderRadius: 4,
                        background: 'rgba(45,122,80,0.08)', color: 'var(--accent)',
                        border: '1px solid rgba(45,122,80,0.2)',
                      }}>
                        {projName}
                      </span>
                    )}
                    {/* Status badge */}
                    {isCompleted && (
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
                        ✓ {s.completedLabel}
                      </span>
                    )}
                    {isDismissed && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {s.dismissedLabel}
                      </span>
                    )}
                    {/* File path */}
                    {task.file_path && (
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                        {task.file_path}
                      </span>
                    )}
                    {/* Time */}
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                      {relativeTime(task.created_at)}
                    </span>
                  </div>
                </div>

                {/* Hover actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
                  opacity: isHovered || isSelected ? 1 : 0,
                  transition: 'opacity 100ms',
                }}>
                  <button
                    onClick={() => handleCopyPrompt([task])}
                    className="btn-icon"
                    title={s.copyPrompt}
                    aria-label={s.copyPrompt}
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Copy size={14} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDismiss(task)}
                    className="btn-icon"
                    title={isDismissed ? s.undoDismiss : s.dismiss}
                    aria-label={isDismissed ? s.undoDismiss : s.dismiss}
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {isDismissed
                      ? <ArrowCounterClockwise size={14} weight="bold" />
                      : <EyeSlash size={14} weight="bold" />}
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="btn-icon"
                    title={s.deleteTask}
                    aria-label={s.deleteTask}
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
