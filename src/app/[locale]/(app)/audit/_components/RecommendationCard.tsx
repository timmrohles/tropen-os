'use client'

import React, { useState } from 'react'
import {
  CaretDown, CaretRight, ListChecks, Copy, CheckCircle, X, Eye,
} from '@phosphor-icons/react'
import type { FindingRecommendation } from '@/lib/audit/finding-recommendations'
import { FIX_APPROACH_LABEL } from '@/lib/audit/finding-recommendations'

interface FindingItem {
  id: string
  file_path: string | null
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  message: string
}

export interface FindingGroupInfo {
  ruleId: string
  baseMessage: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  findings: FindingItem[]
  count: number
}

interface RecommendationCardProps {
  group: FindingGroupInfo
  recommendation: FindingRecommendation | null
  isExternalProject: boolean
  groupTaskExists: boolean
  groupTaskToggling: boolean
  onAddGroupTask: (group: FindingGroupInfo) => void
  onDismissGroup: (group: FindingGroupInfo) => void
  onAcknowledgeGroup: (group: FindingGroupInfo) => void
  onCopyGroupPrompt: (group: FindingGroupInfo) => void
}

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


export default function RecommendationCard({
  group,
  recommendation,
  isExternalProject,
  groupTaskExists,
  groupTaskToggling,
  onAddGroupTask,
  onDismissGroup,
  onAcknowledgeGroup,
  onCopyGroupPrompt,
}: RecommendationCardProps) {
  const [filesExpanded, setFilesExpanded] = useState(false)
  const [confirmDismiss, setConfirmDismiss] = useState(false)
  const [contentExpanded, setContentExpanded] = useState(true)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  const filePaths = group.findings.map((f) => f.file_path).filter(Boolean) as string[]
  const uniqueFiles = [...new Set(filePaths)]

  async function handleCopyPrompt() {
    onCopyGroupPrompt(group)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  return (
    <div style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 14px', cursor: 'pointer', userSelect: 'none',
          borderBottom: contentExpanded ? '1px solid var(--border)' : 'none',
          gap: 8,
        }}
        onClick={() => setContentExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {contentExpanded
            ? <CaretDown size={12} weight="bold" aria-hidden="true" />
            : <CaretRight size={12} weight="bold" aria-hidden="true" />}
        </span>

        {/* Severity dot */}
        <span style={{
          display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
          background: SEV_COLOR[group.severity], flexShrink: 0,
        }} aria-hidden="true" />

        {/* Title */}
        <span style={{
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
        }}>
          {recommendation?.title ?? group.baseMessage}
        </span>

        {/* Rule ID */}
        <code style={{
          fontSize: 10, color: 'var(--text-tertiary)',
          padding: '1px 5px', borderRadius: 3, flexShrink: 0,
          border: '1px solid var(--border)',
        }}>
          {group.ruleId}
        </code>

        {/* Count + severity — plain text tags */}
        <span style={{
          fontSize: 11, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
          border: '1px solid var(--border)', color: 'var(--text-tertiary)',
        }}>
          {group.count} Dateien
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
          color: SEV_COLOR[group.severity],
          border: `1px solid ${SEV_COLOR[group.severity]}`,
        }}>
          {SEV_LABEL[group.severity]}
        </span>
      </div>

      {contentExpanded && (
        <div style={{ padding: '12px 16px 14px' }}>
          {recommendation ? (
            <>
              {/* Fix approach — small plain tag */}
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 3,
                  border: '1px solid var(--border)', color: 'var(--text-tertiary)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {FIX_APPROACH_LABEL[recommendation.fixApproach]}
                </span>
              </div>

              {/* Problem / Impact */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 4px' }}>
                  {recommendation.problem}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Auswirkung: </span>
                  {recommendation.impact}
                </p>
              </div>

              {/* Strategy — label + plain text, indented */}
              <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 10 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--text-tertiary)', margin: '0 0 3px',
                }}>
                  Strategie
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {recommendation.strategy}
                </p>
              </div>

              {/* First step — label + monospace block */}
              <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 12 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--text-tertiary)', margin: '0 0 3px',
                }}>
                  Erster Schritt
                </p>
                <p style={{
                  fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0,
                  whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono, monospace)',
                  background: 'var(--border)', padding: '6px 8px', borderRadius: 4,
                }}>
                  {recommendation.firstStep}
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              {group.baseMessage}
            </p>
          )}

          {/* Expandable file list */}
          {uniqueFiles.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setFilesExpanded((v) => !v)}
              >
                {filesExpanded
                  ? <CaretDown size={11} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
                  : <CaretRight size={11} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
                }
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {filesExpanded ? 'Dateien ausblenden' : `${uniqueFiles.length} betroffene Dateien anzeigen`}
                </span>
              </button>
              {filesExpanded && (
                <div style={{
                  marginTop: 8, padding: '8px 10px', borderRadius: 5,
                  background: 'var(--border)', display: 'flex', flexDirection: 'column', gap: 3,
                }}>
                  {uniqueFiles.map((fp) => (
                    <code key={fp} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>
                      {fp}
                    </code>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {confirmDismiss ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Alle {group.count} Findings ignorieren?
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, color: 'var(--error)' }}
                onClick={() => { setConfirmDismiss(false); onDismissGroup(group) }}
              >
                <X size={12} weight="bold" aria-hidden="true" /> Ja, ignorieren
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12 }}
                onClick={() => setConfirmDismiss(false)}
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Aufgabenliste — same for internal + external */}
              <button
                className="btn btn-ghost btn-sm"
                disabled={groupTaskToggling}
                onClick={() => onAddGroupTask(group)}
                style={{
                  fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
                  color: groupTaskExists ? 'var(--accent)' : undefined,
                  opacity: groupTaskToggling ? 0.5 : 1,
                }}
              >
                <ListChecks size={13} weight={groupTaskExists ? 'fill' : 'bold'} aria-hidden="true" />
                {groupTaskExists ? '✓ In Aufgabenliste' : 'Alle zur Aufgabenliste'}
              </button>

              {isExternalProject ? (
                /* External: Prompt kopieren instead of Acknowledge */
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopyPrompt}
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {copiedPrompt
                    ? <CheckCircle size={13} weight="fill" color="var(--accent)" aria-hidden="true" />
                    : <Copy size={13} weight="bold" aria-hidden="true" />
                  }
                  {copiedPrompt ? 'Kopiert' : 'Als Prompt kopieren'}
                </button>
              ) : (
                /* Internal: Als bekannt markieren */
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onAcknowledgeGroup(group)}
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Eye size={13} weight="bold" aria-hidden="true" />
                  Alle als bekannt
                </button>
              )}

              {/* Ignorieren — same for both */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDismiss(true)}
                style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <X size={13} weight="bold" aria-hidden="true" />
                Alle ignorieren
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
