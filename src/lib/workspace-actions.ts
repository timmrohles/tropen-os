import type { SupabaseClient } from '@supabase/supabase-js'
import type React from 'react'
import type { Conversation, Project, ChatMessage } from './workspace-types'
import { defaultConvTitle } from './workspace-types'

export interface ConversationActionsCtx {
  supabase: SupabaseClient
  workspaceId: string
  activeConvId: string | null
  activeAgentId: string | null
  conversations: Conversation[]
  trashConvs: Conversation[]
  selectedIds: Set<string>
  newProjectName: string
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  setActiveConvId: React.Dispatch<React.SetStateAction<string | null>>
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setDeleting: React.Dispatch<React.SetStateAction<boolean>>
  setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>
  setTrashConvs: React.Dispatch<React.SetStateAction<Conversation[]>>
  setTrashCount: React.Dispatch<React.SetStateAction<number>>
  setTrashLoading: React.Dispatch<React.SetStateAction<boolean>>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  setCreatingProject: React.Dispatch<React.SetStateAction<boolean>>
  setNewProjectName: React.Dispatch<React.SetStateAction<string>>
  setEditingConvId: React.Dispatch<React.SetStateAction<string | null>>
  setEditingProjectId: React.Dispatch<React.SetStateAction<string | null>>
  setContextMenuId: React.Dispatch<React.SetStateAction<string | null>>
  setContextMenuSubmenu: React.Dispatch<React.SetStateAction<boolean>>
  setDragConvId: React.Dispatch<React.SetStateAction<string | null>>
  setDragOverId: React.Dispatch<React.SetStateAction<string | null>>
  setRouting: React.Dispatch<React.SetStateAction<{ task_type: string; agent: string; model_class: string; model: string } | null>>
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setError: React.Dispatch<React.SetStateAction<string>>
  setSearch: React.Dispatch<React.SetStateAction<string>>
  setPeriodFilter: React.Dispatch<React.SetStateAction<'all' | 'today' | 'week' | 'month'>>
  setTaskFilter: React.Dispatch<React.SetStateAction<'all' | 'chat' | 'summarize' | 'research' | 'create' | 'extract'>>
}

export function createConversationActions(ctx: ConversationActionsCtx) {
  const { supabase, workspaceId } = ctx

  async function newConversation(initialMessages?: ChatMessage[]): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const now = new Date().toISOString()
    const tempId = `temp-${now}`
    const optimistic: Conversation = {
      id: tempId, title: defaultConvTitle(), created_at: now, task_type: null, project_id: null, agent_id: ctx.activeAgentId, deleted_at: null
    }
    ctx.setConversations((prev) => [optimistic, ...prev])
    ctx.setActiveConvId(tempId)
    ctx.setMessages(initialMessages ?? [])
    ctx.setSearch('')
    ctx.setPeriodFilter('all')
    ctx.setTaskFilter('all')

    const { data, error: convErr } = await supabase
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: defaultConvTitle(),
        agent_id: ctx.activeAgentId ?? null,
      })
      .select('id, title, created_at, project_id, task_type, agent_id, deleted_at')
      .single()

    if (data) {
      ctx.setConversations((prev) => prev.map((c) => (c.id === tempId ? data as Conversation : c)))
      ctx.setActiveConvId((data as Conversation).id)
      return (data as Conversation).id
    } else {
      ctx.setConversations((prev) => prev.filter((c) => c.id !== tempId))
      ctx.setActiveConvId(null)
      if (convErr) ctx.setError(`Fehler beim Erstellen: ${convErr.message}`)
      return null
    }
  }

  async function deleteConversation(id: string) {
    ctx.setDeleting(true)
    ctx.setConfirmDeleteId(null)
    try {
      await supabase.from('conversations').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      ctx.setConversations((prev) => prev.filter((c) => c.id !== id))
      ctx.setTrashCount((n) => n + 1)
      if (ctx.activeConvId === id) { ctx.setActiveConvId(null); ctx.setMessages([]); ctx.setRouting(null) }
    } finally {
      ctx.setDeleting(false)
    }
  }

  async function createProject() {
    const title = ctx.newProjectName.trim()
    ctx.setCreatingProject(false)
    ctx.setNewProjectName('')
    if (!title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .insert({ department_id: workspaceId, title, goal: null, instructions: null, meta: {}, created_by: user.id })
      .select('id, title, goal, instructions, meta, department_id, created_by, created_at, updated_at')
      .single()
    if (data) ctx.setProjects((prev) => [...prev, data as Project])
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    ctx.setProjects((prev) => prev.filter((p) => p.id !== id))
    ctx.setConversations((prev) => prev.map((c) => c.project_id === id ? { ...c, project_id: null } : c))
  }

  async function renameProject(id: string, name: string) {
    const trimmed = name.trim()
    ctx.setEditingProjectId(null)
    if (!trimmed) return
    await supabase.from('projects').update({ title: trimmed }).eq('id', id)
    ctx.setProjects((prev) => prev.map((p) => p.id === id ? { ...p, title: trimmed } : p))
  }

  async function renameConversation(id: string, title: string) {
    const trimmed = title.trim()
    ctx.setEditingConvId(null)
    if (!trimmed) return
    await supabase.from('conversations').update({ title: trimmed }).eq('id', id)
    ctx.setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: trimmed } : c))
  }

  async function assignToProject(convId: string, projectId: string | null) {
    await supabase.from('conversations').update({ project_id: projectId }).eq('id', convId)
    ctx.setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, project_id: projectId } : c))
    ctx.setContextMenuId(null)
    ctx.setContextMenuSubmenu(false)
    ctx.setDragConvId(null)
    ctx.setDragOverId(null)
  }

  async function loadTrash() {
    ctx.setTrashLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select('id, title, created_at, project_id, task_type, deleted_at')
      .eq('workspace_id', workspaceId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(50)
    ctx.setTrashConvs((data ?? []) as Conversation[])
    ctx.setTrashLoading(false)
  }

  async function restoreConv(id: string) {
    await supabase.from('conversations').update({ deleted_at: null, merged_into: null }).eq('id', id)
    const restored = ctx.trashConvs.find((c) => c.id === id)
    if (restored) ctx.setConversations((prev) => [{ ...restored, deleted_at: null }, ...prev])
    ctx.setTrashConvs((prev) => prev.filter((c) => c.id !== id))
    ctx.setTrashCount((n) => Math.max(0, n - 1))
  }

  async function hardDeleteConv(id: string) {
    await supabase.from('messages').delete().eq('conversation_id', id)
    await supabase.from('conversations').delete().eq('id', id)
    ctx.setTrashConvs((prev) => prev.filter((c) => c.id !== id))
    ctx.setTrashCount((n) => Math.max(0, n - 1))
  }

  function toggleSelect(id: string) {
    const next = new Set(ctx.selectedIds)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    ctx.setSelectedIds(next)
  }

  async function bulkSoftDelete() {
    const ids = [...ctx.selectedIds]
    const now = new Date().toISOString()
    await supabase.from('conversations').update({ deleted_at: now }).in('id', ids)
    ctx.setConversations((prev) => prev.filter((c) => !ctx.selectedIds.has(c.id)))
    if (ctx.activeConvId && ctx.selectedIds.has(ctx.activeConvId)) { ctx.setActiveConvId(null); ctx.setMessages([]) }
    ctx.setTrashCount((n) => n + ids.length)
    ctx.setSelectMode(false)
    ctx.setSelectedIds(new Set())
  }

  return {
    newConversation, deleteConversation, createProject, deleteProject,
    renameProject, renameConversation, assignToProject, loadTrash,
    restoreConv, hardDeleteConv, toggleSelect, bulkSoftDelete,
  }
}
