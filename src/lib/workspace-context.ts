// src/lib/workspace-context.ts
// Builds system prompts and context snapshots for Workspace Silo-Chat and Card-Chat.
// Not a Server Action — plain async lib module.
// All queries use supabaseAdmin.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type { CardPlanC, WorkspacePlanC } from '@/types/workspace-plan-c.types'

const log = createLogger('workspace-context')

// Raw DB row shapes (snake_case from Supabase)
interface CardDbRow {
  id: string
  title: string
  role: string
  status: string
  content_type: string
  content: Record<string, unknown> | null
  stale_reason: string | null
}

interface ConnectionDbRow {
  source_card_id: string
  target_card_id: string
  label: string | null
}

// ---------------------------------------------------------------------------
// buildWorkspaceContext — system prompt for Silo-Chat
// ---------------------------------------------------------------------------
export async function buildWorkspaceContext(workspaceId: string): Promise<string> {
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, goal, domain, status')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!workspace) throw new Error(`Workspace ${workspaceId} nicht gefunden`)

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('id, title, role, status, content_type, content, stale_reason')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const { data: connRows } = await supabaseAdmin
    .from('connections')
    .select('source_card_id, target_card_id, label')
    .eq('workspace_id', workspaceId)

  const cards = (cardRows ?? []) as CardDbRow[]
  const connections = (connRows ?? []) as ConnectionDbRow[]

  const cardSummaries = cards.map((c) => {
    const staleNote = c.status === 'stale'
      ? ` [VERALTET: ${c.stale_reason ?? 'Abhängigkeit geändert'}]`
      : ''
    const contentPreview = c.content
      ? JSON.stringify(c.content).slice(0, 200)
      : '(leer)'
    return `- [${c.role.toUpperCase()}] "${c.title}" (${c.content_type})${staleNote}: ${contentPreview}`
  }).join('\n')

  const connectionSummaries = connections.map((conn) => {
    const src = cards.find((c) => c.id === conn.source_card_id)?.title ?? conn.source_card_id
    const tgt = cards.find((c) => c.id === conn.target_card_id)?.title ?? conn.target_card_id
    const lbl = conn.label ? ` (${conn.label})` : ''
    return `  ${src} → ${tgt}${lbl}`
  }).join('\n')

  log.debug('buildWorkspaceContext', { workspaceId, cardCount: cards.length })

  return `Du bist Toro, ein KI-Assistent von Tropen OS. Du hilfst im Workspace "${workspace.title}".

Ziel: ${workspace.goal ?? '(kein Ziel definiert)'}
Bereich: ${workspace.domain ?? '(kein Bereich)'}
Status: ${workspace.status}

Aktuelle Karten (${cards.length}):
${cardSummaries || '(keine Karten)'}

Verbindungen:
${connectionSummaries || '(keine Verbindungen)'}

Antworte präzise und auf Deutsch. Beziehe dich auf konkrete Karten wenn du Empfehlungen gibst.`
}

// ---------------------------------------------------------------------------
// buildCardContext — system prompt for Card-Chat
// ---------------------------------------------------------------------------
export async function buildCardContext(cardId: string): Promise<string> {
  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!card) throw new Error(`Karte ${cardId} nicht gefunden`)

  const { data: historyRows } = await supabaseAdmin
    .from('card_history')
    .select('snapshot, change_reason, created_at')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: incomingConns } = await supabaseAdmin
    .from('connections')
    .select('source_card_id')
    .eq('target_card_id', cardId)

  const upstreamIds = (incomingConns ?? []).map(
    (c: Record<string, unknown>) => c.source_card_id as string
  )
  let upstreamCards: CardDbRow[] = []

  if (upstreamIds.length > 0) {
    const { data: upstreamRows } = await supabaseAdmin
      .from('cards')
      .select('id, title, role, content_type, content, status')
      .in('id', upstreamIds)
    upstreamCards = (upstreamRows ?? []) as CardDbRow[]
  }

  const upstreamSummary = upstreamCards.length > 0
    ? upstreamCards.map((c) =>
        `- "${c.title}" (${c.role}): ${JSON.stringify(c.content ?? {}).slice(0, 300)}`
      ).join('\n')
    : '(keine upstream Karten)'

  const historySummary = (historyRows ?? []).map((h: Record<string, unknown>) => {
    const snap = h.snapshot as Record<string, unknown>
    return `- ${h.created_at as string}: ${(h.change_reason as string) ?? 'geändert'} → "${snap.title ?? '?'}"`
  }).join('\n') || '(keine History)'

  const currentContent = card.content
    ? JSON.stringify(card.content).slice(0, 500)
    : '(leer)'

  log.debug('buildCardContext', { cardId })

  return `Du bist Toro. Du arbeitest an der Karte "${card.title as string}" (${card.role as string} / ${card.content_type as string}).

Aktueller Inhalt:
${currentContent}

Upstream-Karten (Eingaben für diese Karte):
${upstreamSummary}

Letzte 5 Änderungen:
${historySummary}

Hilf dem User dabei, den Inhalt dieser Karte zu verbessern oder zu generieren. Antworte auf Deutsch.`
}

// ---------------------------------------------------------------------------
// buildContextSnapshot — compressed snapshot for workspace_messages storage
// ---------------------------------------------------------------------------
export function buildContextSnapshot(
  workspaceId: string,
  workspace: Pick<WorkspacePlanC, 'title' | 'goal' | 'status'>,
  cards: Pick<CardPlanC, 'id' | 'title' | 'role' | 'status'>[],
  cardId?: string
): Record<string, unknown> {
  return {
    workspaceId,
    workspaceTitle: workspace.title,
    workspaceGoal: workspace.goal,
    workspaceStatus: workspace.status,
    cardCount: cards.length,
    cardId: cardId ?? null,
    cardStatuses: cards.reduce<Record<string, string>>((acc, c) => {
      acc[c.id] = c.status
      return acc
    }, {}),
    capturedAt: new Date().toISOString(),
  }
}
