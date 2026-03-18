import type { SupabaseClient } from '@supabase/supabase-js'
import type React from 'react'
import type { Conversation, ChatMessage } from './workspace-types'

export interface ChatActionsCtx {
  supabase: SupabaseClient
  workspaceId: string
  activeConvId: string | null
  activeAgentId: string | null
  input: string
  sending: boolean
  conversations: Conversation[]
  sendingRef: React.MutableRefObject<boolean>
  setInput: React.Dispatch<React.SetStateAction<string>>
  setSending: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string>>
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setRouting: React.Dispatch<React.SetStateAction<{ task_type: string; agent: string; model_class: string; model: string } | null>>
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  newConversation: (initialMessages?: ChatMessage[]) => Promise<string | null>
}

export function createChatActions(ctx: ChatActionsCtx) {
  const { supabase, workspaceId } = ctx

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!ctx.input.trim() || ctx.sending) return

    const currentInput = ctx.input.trim()
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: currentInput,
      model_used: null, cost_eur: null, tokens_input: null, tokens_output: null,
    }
    const pendingMsg: ChatMessage = {
      id: `pending-${crypto.randomUUID()}`, role: 'assistant', content: '',
      model_used: null, cost_eur: null, tokens_input: null, tokens_output: null, pending: true,
    }

    ctx.sendingRef.current = true
    let convId = ctx.activeConvId
    const isNewConv = !convId
    if (!convId) {
      convId = await ctx.newConversation([userMsg, pendingMsg])
      if (!convId) {
        ctx.sendingRef.current = false
        return
      }
    }

    if (!isNewConv) {
      ctx.setMessages((prev) => [...prev, userMsg, pendingMsg])
    }
    ctx.setInput('')
    ctx.setSending(true)
    // Fehler erst nach erfolgreichem Start zurücksetzen (nicht schon beim Versuch)
    ctx.setRouting(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Nicht eingeloggt')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            conversation_id: convId,
            message: currentInput,
            agent_id: ctx.activeAgentId ?? undefined,
          }),
          signal: AbortSignal.timeout(60_000),
        }
      )

      ctx.setError('')
      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText)
        let errMsg = `HTTP ${response.status}`
        try {
          const errData = JSON.parse(errText) as { error?: string; message?: string; msg?: string }
          errMsg = errData.error ?? errData.message ?? errData.msg ?? JSON.stringify(errData)
        } catch {
          errMsg = errText || response.statusText || `HTTP ${response.status}`
        }
        throw new Error(errMsg)
      }
      if (!response.body) throw new Error('Kein Stream erhalten')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          let parsed: {
            type: string; content?: string; message?: string
            routing?: { task_type: string; agent: string; model_class: string; model: string }
            usage?: { cost_eur: number; tokens_input?: number; tokens_output?: number }
          }
          try { parsed = JSON.parse(raw) as typeof parsed } catch { continue }

          if (parsed.type === 'chunk' && parsed.content) {
            ctx.setMessages((prev) =>
              prev.map((m) => (m.pending ? { ...m, content: m.content + parsed.content! } : m))
            )
          } else if (parsed.type === 'done') {
            if (parsed.routing) ctx.setRouting(parsed.routing)
            ctx.setMessages((prev) =>
              prev.map((m) => m.pending
                ? {
                    ...m,
                    pending: false,
                    cost_eur: parsed.usage?.cost_eur ?? null,
                    tokens_input: parsed.usage?.tokens_input ?? null,
                    tokens_output: parsed.usage?.tokens_output ?? null,
                    model_used: parsed.routing?.model ?? null,
                  }
                : m)
            )
            const conv = ctx.conversations.find((c) => c.id === convId)
            const isDefaultTitle = conv?.title?.startsWith('Chat · ')
            if (isDefaultTitle) {
              const wordArr = currentInput.trim().split(/\s+/)
              const title = wordArr.slice(0, 5).join(' ') + (wordArr.length > 5 ? '...' : '')
              await supabase.from('conversations').update({ title }).eq('id', convId)
              ctx.setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)))
            }
            const detectedType = parsed.routing?.task_type
            if (detectedType && conv && !conv.task_type) {
              await supabase.from('conversations').update({ task_type: detectedType }).eq('id', convId).is('task_type', null)
              ctx.setConversations((prev) =>
                prev.map((c) => c.id === convId && !c.task_type ? { ...c, task_type: detectedType } : c)
              )
            }
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message ?? 'Stream-Fehler')
          }
        }
      }
    } catch (err) {
      ctx.setMessages((prev) => prev.filter((m) => !m.pending))
      const msg = err instanceof Error ? err.message : String(err)
      ctx.setError(msg.includes('timed out') ? 'Zeitüberschreitung (60s). Bitte erneut versuchen.' : msg)
    } finally {
      ctx.sendingRef.current = false
      ctx.setSending(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    window.location.href = '/login'
  }

  return { sendMessage, logout, handleLogout }
}
