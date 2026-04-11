'use client'

import React, { useState } from 'react'
import {
  CaretDown, CaretUp, ListChecks, Copy, CheckCircle, X, Eye,
  WarningOctagon, Warning, Info, Note,
} from '@phosphor-icons/react'
import type { FindingRecommendation } from '@/lib/audit/finding-recommendations'
import { FIX_APPROACH_LABEL, FIX_APPROACH_COLOR } from '@/lib/audit/finding-recommendations'

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

const SEV_ICON: Record<string, React.ReactNode> = {
  critical: <WarningOctagon size={14} weight="fill" aria-hidden="true" />,
  high:     <Warning size={14} weight="fill" aria-hidden="true" />,
  medium:   <Info size={14} weight="fill" aria-hidden="true" />,
  low:      <Note size={14} weight="fill" aria-hidden="true" />,
  info:     <Info size={14} weight="fill" aria-hidden="true" />,
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
    <div className="card" style={{ marginBottom: 12, padding: 0 }}>
      {/* Card header */}
      <div
        className="card-header"
        style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setContentExpanded((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {/* Severity icon */}
          <span style={{ color: SEV_COLOR[group.severity], flexShrink: 0 }}>
            {SEV_ICON[group.severity]}
          </span>

          {/* Title */}
          <span className="card-header-label" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recommendation?.title ?? group.baseMessage}
          </span>

          {/* Count badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 10, flexShrink: 0,
            background: 'var(--accent-light)', color: 'var(--accent)',
          }}>
            {group.count} Dateien
          </span>

          {/* Severity badge */}
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
            color: SEV_COLOR[group.severity],
          }}>
            {SEV_LABEL[group.severity]}
          </span>

          {/* Rule ID */}
          <code style={{
            fontSize: 10, color: 'var(--text-tertiary)', background: 'var(--border)',
            padding: '1px 5px', borderRadius: 3, flexShrink: 0,
          }}>
            {group.ruleId}
          </code>

          {contentExpanded
            ? <CaretUp size={12} weight="bold" style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} aria-hidden="true" />
            : <CaretDown size={12} weight="bold" style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} aria-hidden="true" />
          }
        </div>
      </div>

      {contentExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {recommendation ? (
            <>
              {/* Fix approach badge */}
              {(() => {
                const c = FIX_APPROACH_COLOR[recommendation.fixApproach]
                return (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 4,
                      background: c.bg, color: c.color,
                    }}>
                      {FIX_APPROACH_LABEL[recommendation.fixApproach]}
                    </span>
                  </div>
                )
              })()}

              {/* Problem / Impact */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 6px' }}>
                  {recommendation.problem}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  <strong style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Auswirkung: </strong>
                  {recommendation.impact}
                </p>
              </div>

              {/* Strategy */}
              <div style={{
                padding: '10px 12px', borderRadius: 6, marginBottom: 10,
                background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', margin: '0 0 4px' }}>
                  Strategie
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                  {recommendation.strategy}
                </p>
              </div>

              {/* First step */}
              <div style={{
                padding: '10px 12px', borderRadius: 6, marginBottom: 14,
                background: 'var(--border)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
                  Erster Schritt
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
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
                  ? <CaretUp size={11} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
                  : <CaretDown size={11} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
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
