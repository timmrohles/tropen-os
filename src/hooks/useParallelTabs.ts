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
      const firstLine = originalInput.split('\n').find(l => l.trim()) ?? originalInput
      const topicSnippet = firstLine.slice(0, 40).trim()
      const messageWithInstruction = `${originalInput}\n\n[Bitte antworte direkt und vollständig ohne Rückfragen.]`

      // 1. Create N empty conversations
      const results = await Promise.all(
        intent.labels.map((label: string) =>
          fetch('/api/conversations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: `${label} — ${topicSnippet}` }),
          }).then(async r => {
            if (!r.ok) {
              return null
            }
            return r.json() as Promise<{ conversation_id: string }>
          }).catch(() => null)
        )
      )

      const items = results
        .map((r: { conversation_id: string } | null, i: number) => r ? { convId: r.conversation_id, title: intent.labels[i] ?? `Tab ${i + 1}` } : null)
        .filter((x: ParallelTabItem | null): x is ParallelTabItem => x !== null)

      if (!items.length) return

      // 2. Open tabs (first becomes active)
      onOpenParallelTabs(items)

      // 3. Active tab: initialise message list + stream response
      void onSendDirectToNewConv(messageWithInstruction, items[0].convId, undefined, originalInput)

      // 4. Non-active tabs: fire-and-forget — drain stream so edge function saves to DB
      if (items.length > 1) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          for (const { convId } of items.slice(1)) {
            void fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ workspace_id: workspaceId, conversation_id: convId, message: messageWithInstruction }),
            }).then(async r => {
              if (!r.body) return
              const reader = r.body.getReader()
              while (true) {
                const { done } = await reader.read()
                if (done) break
              }
            }).catch(() => {})
          }
        }
      }
    } finally {
      setParallelLoading(false)
    }
  }

  async function handleModelCompare(selectedModels: CompareModel[]) {
    if (!onOpenParallelTabs || !onSendDirectToNewConv || selectedModels.length < 2) return
    const trimmed = input.trim()
    if (!trimmed) return

    const messageWithInstruction = `${trimmed}\n\n[Bitte antworte direkt und vollständig ohne Rückfragen.]`
    const firstLine = trimmed.split('\n').find(l => l.trim()) ?? trimmed
    const topicSnippet = firstLine.slice(0, 40).trim()

    try {
      const results = await Promise.all(
        selectedModels.map(model =>
          fetch('/api/conversations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `${model.display_name ?? model.name} — ${topicSnippet}`,
              selected_model_id: model.id,
            }),
          }).then(async r => {
            if (!r.ok) return null
            const data = await r.json() as { conversation_id: string }
            return { convId: data.conversation_id, model }
          }).catch(() => null)
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
      if (items.length > 1) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          for (const item of items.slice(1)) {
            void fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workspace_id: workspaceId,
                conversation_id: item.convId,
                message: messageWithInstruction,
                client_prefs: { selected_model_id: item.model.id },
              }),
            }).then(async r => {
              if (!r.body) return
              const reader = r.body.getReader()
              while (true) {
                const { done } = await reader.read()
                if (done) break
              }
            }).catch(() => {})
          }
        }
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
