import type { SupabaseClient } from '@supabase/supabase-js'
import type React from 'react'
import type { Conversation, Project, ChatMessage, JungleProject } from './workspace-types'

export interface JungleActionsCtx {
  supabase: SupabaseClient
  workspaceId: string
  conversations: Conversation[]
  selectedIds: Set<string>
  jungleProjects: JungleProject[]
  jungleEditName: Record<number, string>
  mergeTitle: string
  mergeContent: string
  mergeProjectId: string | null
  mergeAfterAction: 'trash' | 'keep' | 'delete'
  setError: React.Dispatch<React.SetStateAction<string>>
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  setJungleModal: React.Dispatch<React.SetStateAction<boolean>>
  setJungleLoading: React.Dispatch<React.SetStateAction<boolean>>
  setJungleProjects: React.Dispatch<React.SetStateAction<JungleProject[]>>
  setJungleSummary: React.Dispatch<React.SetStateAction<string>>
  setJungleEditName: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setJungleSaving: React.Dispatch<React.SetStateAction<boolean>>
  setMergeModal: React.Dispatch<React.SetStateAction<boolean>>
  setMergeLoading: React.Dispatch<React.SetStateAction<boolean>>
  setMergeReady: React.Dispatch<React.SetStateAction<boolean>>
  setMergeTitle: React.Dispatch<React.SetStateAction<string>>
  setMergeContent: React.Dispatch<React.SetStateAction<string>>
  setMergeProjectId: React.Dispatch<React.SetStateAction<string | null>>
  setMergeAfterAction: React.Dispatch<React.SetStateAction<'trash' | 'keep' | 'delete'>>
  setActiveConvId: React.Dispatch<React.SetStateAction<string | null>>
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setToastMsg: React.Dispatch<React.SetStateAction<string>>
}

export function createJungleActions(ctx: JungleActionsCtx) {
  const { supabase, workspaceId } = ctx

  async function callJungleOrder(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Nicht eingeloggt')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jungle-order`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    const text = await res.text()
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(text) as Record<string, unknown> } catch { /* not JSON */ }
    if (!res.ok) throw new Error((parsed.error as string | undefined) ?? `HTTP ${res.status}: ${text.slice(0, 300)}`)
    return parsed
  }

  async function openJungleModal() {
    ctx.setJungleLoading(true)
    try {
      const ungrouped = ctx.conversations.filter((c) => !c.project_id && !c.deleted_at)
      const data = await callJungleOrder({ action: 'structure', conversations: ungrouped })
      ctx.setJungleProjects((data.projects as JungleProject[]) ?? [])
      ctx.setJungleSummary((data.summary as string) ?? '')
      ctx.setJungleEditName({})
      ctx.setJungleModal(true)
    } catch (e) {
      ctx.setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen')
    } finally {
      ctx.setJungleLoading(false)
    }
  }

  function jungleProjectName(i: number): string {
    return ctx.jungleEditName[i] ?? ctx.jungleProjects[i]?.name ?? ''
  }

  function jungleMoveConv(convId: string, toIndex: number) {
    ctx.setJungleProjects((prev) => {
      const next = prev.map((p) => ({ ...p, conversations: p.conversations.filter((id) => id !== convId) }))
      next[toIndex] = { ...next[toIndex], conversations: [...next[toIndex].conversations, convId] }
      return next
    })
  }

  function jungleRemoveConv(convId: string, fromIndex: number) {
    ctx.setJungleProjects((prev) => prev.map((p, i) =>
      i === fromIndex ? { ...p, conversations: p.conversations.filter((id) => id !== convId) } : p
    ))
  }

  function jungleRemoveProject(i: number) {
    ctx.setJungleProjects((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function jungleApply() {
    ctx.setJungleSaving(true)
    try {
      for (let i = 0; i < ctx.jungleProjects.length; i++) {
        const proj = ctx.jungleProjects[i]
        const name = (ctx.jungleEditName[i] ?? proj.name).trim()
        if (!name || proj.conversations.length === 0) continue
        const { data: { user: jUser } } = await supabase.auth.getUser()
        const { data: newProj } = await supabase
          .from('projects')
          .insert({ department_id: workspaceId, title: name, goal: null, instructions: null, meta: {}, created_by: jUser?.id ?? '' })
          .select('id, title, goal, instructions, meta, department_id, created_by, created_at, updated_at')
          .single()
        if (newProj) {
          ctx.setProjects((prev) => [...prev, newProj as Project])
          await supabase.from('conversations').update({ project_id: (newProj as Project).id }).in('id', proj.conversations)
          ctx.setConversations((prev) => prev.map((c) =>
            proj.conversations.includes(c.id) ? { ...c, project_id: (newProj as Project).id } : c
          ))
        }
      }
      ctx.setJungleModal(false)
    } finally {
      ctx.setJungleSaving(false)
    }
  }

  async function openMergeModal() {
    ctx.setMergeLoading(true)
    ctx.setMergeReady(false)
    ctx.setMergeModal(true)
    ctx.setMergeTitle('')
    ctx.setMergeContent('')
    ctx.setMergeProjectId(null)
    ctx.setMergeAfterAction('trash')
    try {
      const data = await callJungleOrder({ action: 'merge', conversation_ids: [...ctx.selectedIds] })
      ctx.setMergeTitle((data.title as string) ?? '')
      ctx.setMergeContent((data.content as string) ?? '')
      ctx.setMergeReady(true)
    } catch (e) {
      ctx.setError(e instanceof Error ? e.message : 'Fehler')
      ctx.setMergeModal(false)
    } finally {
      ctx.setMergeLoading(false)
    }
  }

  async function applyMerge() {
    if (!ctx.mergeTitle.trim() || !ctx.mergeContent) return
    ctx.setMergeLoading(true)
    try {
      const ids = [...ctx.selectedIds]
      const data = await callJungleOrder({
        action: 'merge', conversation_ids: ids, workspace_id: workspaceId,
        merge_title: ctx.mergeTitle.trim(), project_id: ctx.mergeProjectId, after_action: ctx.mergeAfterAction,
      })
      const newConv = data.conversation as Conversation
      const content = (data.content as string) ?? ''
      if (ctx.mergeAfterAction !== 'keep') {
        ctx.setConversations((prev) => prev.filter((c) => !ctx.selectedIds.has(c.id)))
      }
      ctx.setConversations((prev) => [newConv, ...prev])
      ctx.setActiveConvId(newConv.id)
      ctx.setMessages([{
        id: crypto.randomUUID(), role: 'assistant', content, pending: false,
        model_used: null, cost_eur: null, tokens_input: null, tokens_output: null,
      }])
      ctx.setSelectMode(false)
      ctx.setSelectedIds(new Set())
      ctx.setMergeModal(false)
      ctx.setToastMsg(`🦜 ${ids.length} Chat${ids.length === 1 ? '' : 's'} erfolgreich zusammengeführt`)
      setTimeout(() => ctx.setToastMsg(''), 4000)
    } catch (e) {
      ctx.setError(e instanceof Error ? e.message : 'Fehler beim Zusammenführen')
    } finally {
      ctx.setMergeLoading(false)
    }
  }

  return { openJungleModal, jungleProjectName, jungleMoveConv, jungleRemoveConv, jungleRemoveProject, jungleApply, openMergeModal, applyMerge }
}
