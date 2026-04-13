'use client'

import React, { useState } from 'react'
import {
  CheckSquare, Square, Trash, DownloadSimple, Copy, CheckCircle, ListChecks,
} from '@phosphor-icons/react'

interface AuditTask {
  id: string
  finding_id: string | null
  audit_run_id: string | null
  scan_project_id: string | null
  title: string
  agent_source: string | null
  rule_id: string | null
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | null
  file_path: string | null
  description: string | null
  suggestion: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
}

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
const SEV_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high:     'var(--error)',
  medium:   'var(--text-secondary)',
  low:      'var(--text-tertiary)',
  info:     'var(--text-tertiary)',
}
const SEV_LABEL: Record<string, string> = {
  critical: 'Kritisch', high: 'Hoch', medium: 'Mittel', low: 'Niedrig', info: 'Info',
}

interface TaskListProps {
  initialTasks: AuditTask[]
}

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<AuditTask[]>(
    [...initialTasks].sort((a, b) =>
      (SEV_ORDER[a.severity ?? 'info'] ?? 4) - (SEV_ORDER[b.severity ?? 'info'] ?? 4)
    )
  )
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [copiedFormat, setCopiedFormat] = useState<'md' | 'prompt' | null>(null)

  if (tasks.length === 0) return null

  const openTasks = tasks.filter((t) => !t.completed)
  const doneTasks = tasks.filter((t) => t.completed)

  async function toggleCompleted(task: AuditTask) {
    if (togglingIds.has(task.id)) return
    setTogglingIds((prev) => new Set([...prev, task.id]))
    const newVal = !task.completed
    setTasks((prev) => prev.map((t) => t.id === task.id
      ? { ...t, completed: newVal, completed_at: newVal ? new Date().toISOString() : null }
      : t
    ))
    try {
      await fetch(`/api/audit/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newVal }),
      })
    } catch {
      // Revert
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: task.completed, completed_at: task.completed_at } : t))
    } finally {
      setTogglingIds((prev) => { const s = new Set(prev); s.delete(task.id); return s })
    }
  }

  async function deleteTask(task: AuditTask) {
    if (deletingIds.has(task.id)) return
    setDeletingIds((prev) => new Set([...prev, task.id]))
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await fetch(`/api/audit/tasks/${task.id}`, { method: 'DELETE' })
    } catch {
      setTasks((prev) => [...prev, task].sort((a, b) =>
        (SEV_ORDER[a.severity ?? 'info'] ?? 4) - (SEV_ORDER[b.severity ?? 'info'] ?? 4)
      ))
    } finally {
      setDeletingIds((prev) => { const s = new Set(prev); s.delete(task.id); return s })
    }
  }

  function buildMarkdown(): string {
    const lines: string[] = ['# Audit-Aufgabenliste\n']
    const sections: Array<{ label: string; items: AuditTask[] }> = [
      { label: 'Offen', items: openTasks },
      { label: 'Erledigt', items: doneTasks },
    ]
    for (const { label, items } of sections) {
      if (items.length === 0) continue
      lines.push(`## ${label}\n`)
      for (const t of items) {
        const check = t.completed ? '[x]' : '[ ]'
        const sev = t.severity ? ` (${SEV_LABEL[t.severity] ?? t.severity})` : ''
        lines.push(`- ${check} **${t.title}**${sev}`)
        if (t.rule_id) lines.push(`  - Regel: \`${t.rule_id}\``)
        if (t.file_path) lines.push(`  - Datei: \`${t.file_path}\``)
        if (t.suggestion) lines.push(`  - Vorschlag: ${t.suggestion}`)
      }
      lines.push('')
    }
    return lines.join('\n')
  }

  function buildPrompt(): string {
    const taskLines = openTasks.map((t, i) => {
      const parts = [`${i + 1}. ${t.title}`]
      if (t.severity) parts.push(`   Priorität: ${SEV_LABEL[t.severity] ?? t.severity}`)
      if (t.rule_id) parts.push(`   Regel: ${t.rule_id}`)
      if (t.file_path) parts.push(`   Datei: ${t.file_path}`)
      if (t.suggestion) parts.push(`   Maßnahme: ${t.suggestion}`)
      return parts.join('\n')
    }).join('\n\n')
    return `Du bist ein erfahrener Software-Architekt. Ich habe folgende offene Audit-Aufgaben in meinem Projekt:\n\n${taskLines}\n\nBitte hilf mir, diese systematisch abzuarbeiten. Beginne mit der wichtigsten Aufgabe und erkläre den besten Lösungsansatz.`
  }

  function buildJson(): string {
    return JSON.stringify(tasks.map((t) => ({
      id:           t.id,
      title:        t.title,
      severity:     t.severity,
      rule_id:      t.rule_id,
      agent_source: t.agent_source,
      file_path:    t.file_path,
      suggestion:   t.suggestion,
      completed:    t.completed,
      created_at:   t.created_at,
    })), null, 2)
  }

  async function copyToClipboard(text: string, format: 'md' | 'prompt') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch { /* ignore */ }
  }

  function downloadJson() {
    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([buildJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-tasks-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card" style={{ marginTop: 16, padding: 0 }}>
      {/* Header */}
      <div className="card-header" style={{ padding: '14px 18px' }}>
        <span className="card-header-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListChecks size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
          Aufgabenliste
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
            background: 'var(--accent-light)', color: 'var(--accent)',
          }}>
            {openTasks.length} offen
          </span>
          {doneTasks.length > 0 && (
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: 'var(--border)', color: 'var(--text-tertiary)',
            }}>
              {doneTasks.length} erledigt
            </span>
          )}
        </span>
        {/* Export actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => copyToClipboard(buildMarkdown(), 'md')}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Als Markdown kopieren"
          >
            {copiedFormat === 'md'
              ? <CheckCircle size={12} weight="fill" color="var(--accent)" aria-hidden="true" />
              : <Copy size={12} weight="bold" aria-hidden="true" />
            }
            Markdown
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => copyToClipboard(buildPrompt(), 'prompt')}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Als KI-Prompt kopieren"
          >
            {copiedFormat === 'prompt'
              ? <CheckCircle size={12} weight="fill" color="var(--accent)" aria-hidden="true" />
              : <Copy size={12} weight="bold" aria-hidden="true" />
            }
            KI-Prompt
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={downloadJson}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Als JSON herunterladen"
          >
            <DownloadSimple size={12} weight="bold" aria-hidden="true" />
            JSON
          </button>
        </div>
      </div>

      {/* Task rows */}
      <div style={{ padding: '0 0 8px' }}>
        {tasks.map((task) => (
          <div key={task.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 18px',
            borderBottom: '1px solid var(--border)',
            opacity: task.completed ? 0.55 : 1,
            transition: 'opacity 0.15s',
          }}>
            {/* Checkbox */}
            <button
              onClick={() => toggleCompleted(task)}
              disabled={togglingIds.has(task.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 2 }}
              aria-label={task.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
            >
              {task.completed
                ? <CheckSquare size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
                : <Square size={16} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
              }
            </button>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, margin: 0, lineHeight: 1.4, color: 'var(--text-primary)',
                textDecoration: task.completed ? 'line-through' : 'none',
                wordBreak: 'break-word',
              }}>
                {task.title}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
                {task.severity && (
                  <span style={{ fontSize: 11, color: SEV_COLOR[task.severity] ?? 'var(--text-tertiary)', fontWeight: 600 }}>
                    {SEV_LABEL[task.severity] ?? task.severity}
                  </span>
                )}
                {task.rule_id && (
                  <code style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'var(--border)', padding: '1px 4px', borderRadius: 3 }}>
                    {task.rule_id}
                  </code>
                )}
                {task.file_path && (
                  <code style={{ fontSize: 10, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                    {task.file_path}
                  </code>
                )}
              </div>
              {task.suggestion && !task.completed && (
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {task.suggestion}
                </p>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => deleteTask(task)}
              disabled={deletingIds.has(task.id)}
              className="btn btn-ghost btn-sm"
              title="Aufgabe entfernen"
              style={{ flexShrink: 0, padding: '2px 6px', opacity: deletingIds.has(task.id) ? 0.4 : 1 }}
              aria-label="Aufgabe entfernen"
            >
              <Trash size={13} weight="bold" color="var(--error)" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
