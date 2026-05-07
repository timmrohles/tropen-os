/* eslint-disable unicorn/filename-case */
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { ParallelIntent } from '@/lib/chat/detect-parallel-intent'
import type { CompareModel } from '@/components/workspace/ModelComparePopover'

export interface ParallelTabItem {
  convId: string
  title: string
}

interface UseParallelTabsProps {
  workspaceId?: string
  input: string
  onSetInput?: (v: string) => void
  onOpenParallelTabs?: (items: ParallelTabItem[]) => void
  onSendDirectToNewConv?: (text: string, convId: string, overrideClientPrefs?: Record<string, unknown>, displayText?: string) => void
}

// ── Shared helpers ─────────────────────────────────────────

function buildTopicSnippet(text: string): string {
  const firstLine = text.split('\n').find(l => l.trim()) ?? text
  return firstLine.slice(0, 40).trim()
}

function withDirectInstruction(text: string): string {
  return `${text}\n\n[Bitte antworte direkt und vollständig ohne Rückfragen.]`
}

async function createConversation(title: string, extraBody?: Record<string, unknown>): Promise<{ conversation_id: string } | null> {
  try {
    const r = await fetch('/api/conversations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ...extraBody }),
    })
    if (!r.ok) return null
    return r.json() as Promise<{ conversation_id: string }>
  } catch {
    return null
  }
}

async function drainStream(r: Response): Promise<void> {
  if (!r.body) return
  const reader = r.body.getReader()
  while (true) {
    const { done } = await reader.read()
    if (done) break
  }
}

async function fireAndForgetChat(
  convId: string,
  message: string,
  accessToken: string,
  workspaceId?: string,
  clientPrefs?: Record<string, unknown>,
): Promise<void> {
  void fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      conversation_id: convId,
      message,
      ...(clientPrefs ? { client_prefs: clientPrefs } : {}),
    }),
  }).then(drainStream).catch(() => {})
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

// ── Hook ───────────────────────────────────────────────────

export function useParallelTabs({
  workspaceId,
  input,
  onOpenParallelTabs,
  onSendDirectToNewConv,
}: UseParallelTabsProps) {
  const [parallelConfirm, setParallelConfirm] = useState<{ intent: ParallelIntent; originalInput: string } | null>(null)
  const [parallelLoading, setParallelLoading] = useState(false)

  async function handleParallelConfirm() {
    if (!parallelConfirm || !onOpenParallelTabs || !onSendDirectToNewConv) return
    const { intent, originalInput } = parallelConfirm

    setParallelLoading(true)
    setParallelConfirm(null)

    try {
      const topicSnippet = buildTopicSnippet(originalInput)
      const messageWithInstruction = withDirectInstruction(originalInput)

      // 1. Create N empty conversations
      const results = await Promise.all(
        intent.labels.map((label: string) =>
          createConversation(`${label} — ${topicSnippet}`)
        )
      )

      const items = results
        .map((r, i) => r ? { convId: r.conversation_id, title: intent.labels[i] ?? `Tab ${i + 1}` } : null)
        .filter((x): x is ParallelTabItem => x !== null)

      if (!items.length) return

      // 2. Open tabs (first becomes active)
      onOpenParallelTabs(items)

      // 3. Active tab: initialise message list + stream response
      void onSendDirectToNewConv(messageWithInstruction, items[0].convId, undefined, originalInput)

      // 4. Non-active tabs: fire-and-forget
      if (items.length <= 1) return

      const accessToken = await getAccessToken()
      if (!accessToken) return

      for (const { convId } of items.slice(1)) {
        void fireAndForgetChat(convId, messageWithInstruction, accessToken, workspaceId)
      }
    } finally {
      setParallelLoading(false)
    }
  }

  async function handleModelCompare(selectedModels: CompareModel[]) {
    if (!onOpenParallelTabs || !onSendDirectToNewConv || selectedModels.length < 2) return
    const trimmed = input.trim()
    if (!trimmed) return

    const messageWithInstruction = withDirectInstruction(trimmed)
    const topicSnippet = buildTopicSnippet(trimmed)

    try {
      const results = await Promise.all(
        selectedModels.map(model =>
          createConversation(
            `${model.display_name ?? model.name} — ${topicSnippet}`,
            { selected_model_id: model.id },
          ).then(r => r ? { convId: r.conversation_id, model } : null)
        )
      )

      const items = results
        .filter((x): x is { convId: string; model: CompareModel } => x !== null)
        .map(x => ({ convId: x.convId, title: x.model.display_name ?? x.model.name, model: x.model }))

      if (!items.length) return

      onOpenParallelTabs(items.map(({ convId, title }) => ({ convId, title })))

      // Tab 1 — active tab with streaming, model injected via overrideClientPrefs
      void onSendDirectToNewConv(messageWithInstruction, items[0].convId, { selected_model_id: items[0].model.id }, trimmed)

      // Tabs 2+ — fire-and-forget with per-tab model in client_prefs
      if (items.length <= 1) return

      const accessToken = await getAccessToken()
      if (!accessToken) return

      for (const item of items.slice(1)) {
        void fireAndForgetChat(
          item.convId,
          messageWithInstruction,
          accessToken,
          workspaceId,
          { selected_model_id: item.model.id },
        )
      }
    } catch { /* non-critical — tabs may partially open */ }
  }

  return {
    parallelConfirm,
    setParallelConfirm,
    parallelLoading,
    handleParallelConfirm,
    handleModelCompare,
  }
}
