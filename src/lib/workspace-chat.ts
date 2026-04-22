import type { SupabaseClient } from '@supabase/supabase-js'
import type React from 'react'
import type { Conversation, ChatMessage, ChipItem, AttachmentData, GuidedAction, SearchSource } from './workspace-types'
import { detectComplexity } from './chat/complexity-detector'
import { handleGuidedAction as _handleGuidedAction } from './workspace-chat-guided'

export interface ChatActionsCtx {
  supabase: SupabaseClient
  workspaceId: string
  activeConvId: string | null
  input: string
  sending: boolean
  messages: ChatMessage[]
  conversations: Conversation[]
  sendingRef: React.MutableRefObject<boolean>
  setInput: React.Dispatch<React.SetStateAction<string>>
  setSending: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string>>
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setRouting: React.Dispatch<React.SetStateAction<{ task_type: string; agent: string; model_class: string; model: string } | null>>
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  setMemoryExtracting: React.Dispatch<React.SetStateAction<boolean>>
  setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
  newConversation: (initialMessages?: ChatMessage[]) => Promise<string | null>
  attachmentRef: React.MutableRefObject<AttachmentData | null>
  chatPrefsRef: React.MutableRefObject<Record<string, unknown> | null>
}

export function createChatActions(ctx: ChatActionsCtx) {
  const { supabase, workspaceId } = ctx

  async function doSend(currentInput: string) {
    const attachment = ctx.attachmentRef.current
    ctx.attachmentRef.current = null  // consume immediately — one-time use

    const userMsgContent = attachment
      ? `[📎 ${attachment.name}]\n${currentInput}`
      : currentInput

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMsgContent,
      model_used: null, cost_eur: null, tokens_input: null, tokens_output: null,
    }
    const pendingMsg: ChatMessage = {
      id: `pending-${crypto.randomUUID()}`, role: 'assistant', content: '',
      model_used: null, cost_eur: null, tokens_input: null, tokens_output: null, pending: true,
    }

    let accumulatedContent = ''
    ctx.setChips([])

    ctx.sendingRef.current = true
    let convId = ctx.activeConvId
    const isNewConv = !convId
    if (!convId) {
      convId = await ctx.newConversation([userMsg, pendingMsg])
      if (!convId) {
        ctx.sendingRef.current = false
        return
      }
      // Auto-title from first 50 chars of the first user message
      const autoTitle = currentInput.trim().slice(0, 50)
      if (autoTitle) {
        supabase.from('conversations').update({ title: autoTitle }).eq('id', convId)
        ctx.setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: autoTitle } : c)))
      }
    }

    if (!isNewConv) {
      ctx.setMessages((prev) => {
        const existingIds = new Set(prev.map(m => m.id))
        const toAdd = [userMsg, pendingMsg].filter(m => !existingIds.has(m.id))
        return [...prev, ...toAdd]
      })
    }
    ctx.setInput('')
    ctx.setSending(true)
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
            ...(attachment ? { attachment: { name: attachment.name, mediaType: attachment.mediaType, base64: attachment.base64 } } : {}),
            ...(ctx.chatPrefsRef.current ? { client_prefs: ctx.chatPrefsRef.current } : {}),
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
            sources?: SearchSource[]
            link_previews?: boolean
            thinking?: string
          }
          try { parsed = JSON.parse(raw) as typeof parsed } catch { continue }

          if (parsed.type === 'searching') {
            ctx.setIsSearching(true)
          } else if (parsed.type === 'chunk' && parsed.content) {
            ctx.setIsSearching(false)
            accumulatedContent += parsed.content
            ctx.setMessages((prev) =>
              prev.map((m) => (m.pending ? { ...m, content: m.content + parsed.content! } : m))
            )
          } else if (parsed.type === 'done') {
            ctx.setIsSearching(false)
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
                    sources: parsed.sources?.length ? parsed.sources : undefined,
                    link_previews: parsed.link_previews ?? true,
                    ...(parsed.thinking ? { thinking: parsed.thinking } : {}),
                  }
                : m)
            )

            // Replace transient pending ID with real DB ID (non-blocking)
            if (convId) {
              const pendingId = pendingMsg.id
              void supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', convId)
                .eq('role', 'assistant')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
                .then(({ data }) => {
                  if (data?.id) {
                    ctx.setMessages(prev => prev.map(m =>
                      m.id === pendingId ? { ...m, id: data.id } : m
                    ))
                  }
                })
            }

            // Fire-and-forget memory extraction (only for project conversations)
            const conv = ctx.conversations.find((c) => c.id === convId)
            if (convId && conv?.project_id) {
              ctx.setMemoryExtracting(true)
              fetch(`/api/conversations/${convId}/extract-memory`, { method: 'POST' })
                .catch(() => {/* non-blocking */})
              setTimeout(() => ctx.setMemoryExtracting(false), 3000)
            }

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

            // Fire-and-forget chips generation
            if (accumulatedContent.trim().length > 20) {
              if (/type=["']presentation["']/.test(accumulatedContent)) {
                ctx.setChips([
                  { label: 'Design ändern',    prompt: 'Ändere das Design auf einen dunkleren, professionelleren Stil' },
                  { label: 'Slide hinzufügen', prompt: 'Füge eine weitere Slide mit den wichtigsten Erkenntnissen hinzu' },
                  { label: 'Kürzen',           prompt: 'Kürze auf maximal 5 Slides — nur das Wesentliche' },
                  { label: 'Auf Englisch',     prompt: 'Übersetze die gesamte Präsentation ins Englische' },
                ])
              } else {
                fetch('/api/chat/generate-chips', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lastMessage: accumulatedContent }),
                })
                  .then(r => r.ok ? r.json() as Promise<{ chips: ChipItem[] }> : null)
                  .then(res => { if (res?.chips?.length) ctx.setChips(res.chips) })
                  .catch(() => {/* non-blocking */})
              }
            }
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message ?? 'Stream-Fehler')
          }
        }
      }
    } catch (err) {
      ctx.setIsSearching(false)
      ctx.setMessages((prev) => prev.filter((m) => !m.pending))
      const msg = err instanceof Error ? err.message : String(err)
      ctx.setError(msg.includes('timed out') ? 'Zeitüberschreitung (60s). Bitte erneut versuchen.' : msg)
    } finally {
      ctx.sendingRef.current = false
      ctx.setSending(false)
    }
  }

  async function doSendWithConvId(currentInput: string, convId: string, overrideClientPrefs?: Record<string, unknown>) {
    const pendingMsg: ChatMessage = {
      id: `pending-${crypto.randomUUID()}`, role: 'assistant', content: '',
      model_used: null, cost_eur: null, tokens_input: null, tokens_output: null, pending: true,
    }

    ctx.setChips([])
    ctx.sendingRef.current = true
    ctx.setMessages(prev => [...prev, pendingMsg])
    ctx.setSending(true)
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
            ...((ctx.chatPrefsRef.current || overrideClientPrefs) ? {
              client_prefs: overrideClientPrefs
                ? { ...(ctx.chatPrefsRef.current ?? {}), ...overrideClientPrefs }
                : ctx.chatPrefsRef.current
            } : {}),
          }),
          signal: AbortSignal.timeout(60_000),
        }
      )

      ctx.setError('')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
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
          let parsed: { type: string; content?: string; routing?: { task_type: string; agent: string; model_class: string; model: string }; usage?: { cost_eur: number; tokens_input?: number; tokens_output?: number } }
          try { parsed = JSON.parse(raw) as typeof parsed } catch { continue }

          if (parsed.type === 'chunk' && parsed.content) {
            ctx.setMessages(prev => prev.map(m => m.pending ? { ...m, content: m.content + parsed.content! } : m))
          } else if (parsed.type === 'done') {
            if (parsed.routing) ctx.setRouting(parsed.routing)
            ctx.setMessages(prev => prev.map(m => m.pending ? { ...m, pending: false, cost_eur: parsed.usage?.cost_eur ?? null, tokens_input: parsed.usage?.tokens_input ?? null, tokens_output: parsed.usage?.tokens_output ?? null, model_used: parsed.routing?.model ?? null } : m))
            const pendingId2 = pendingMsg.id
            void Promise.resolve(supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', convId)
              .eq('role', 'assistant')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
              .then(({ data }) => {
                if (data?.id) ctx.setMessages(prev => prev.map(m => m.id === pendingId2 ? { ...m, id: data.id } : m))
              })).catch(() => {})
          }
        }
      }
    } catch (err) {
      ctx.setMessages(prev => prev.filter(m => !m.pending))
      const msg = err instanceof Error ? err.message : String(err)
      ctx.setError(msg)
    } finally {
      ctx.sendingRef.current = false
      ctx.setSending(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = ctx.input.trim()
    if (!trimmed || ctx.sending) return

    // Guided mode: detect complexity and show picker if appropriate
    const activeConv = ctx.conversations.find(c => c.id === ctx.activeConvId)
    const hasProjectContext = !!activeConv?.project_id
    const hasEnoughDetail = trimmed.length > 200
    const complexity = detectComplexity(trimmed, hasProjectContext, hasEnoughDetail)

    if (complexity.isComplex) {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(), role: 'user', content: trimmed,
        model_used: null, cost_eur: null, tokens_input: null, tokens_output: null,
      }
      const guidedPickerId = crypto.randomUUID()
      const guidedPickerMsg: ChatMessage = {
        id: guidedPickerId, role: 'guided_picker', content: '',
        model_used: null, cost_eur: null, tokens_input: null, tokens_output: null,
        guidedData: {
          type: 'picker',
          steps: complexity.suggestedSteps,
          currentStepIndex: 0,
          answers: [],
          originalMessage: trimmed,
          category: complexity.category ?? '',
          convId: '',  // filled after newConversation()
        },
      }
      ctx.setInput('')
      const convId = await ctx.newConversation([userMsg, guidedPickerMsg])
      if (!convId) return
      // Patch the real convId into the guided picker message
      ctx.setMessages(prev => prev.map(m =>
        m.id === guidedPickerId && m.guidedData
          ? { ...m, guidedData: { ...m.guidedData, convId } }
          : m
      ))
      return
    }

    await doSend(trimmed)
  }

  function handleGuidedAction(action: GuidedAction) {
    _handleGuidedAction({
      messages: ctx.messages,
      setMessages: ctx.setMessages,
      doSend,
      doSendWithConvId,
    }, action)
  }

  async function logout() {
    await supabase.auth.signOut()
    const locale = window.location.pathname.split('/')[1] || 'de'
    window.location.href = `/${locale}/login`
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    const locale = window.location.pathname.split('/')[1] || 'de'
    window.location.href = `/${locale}/login`
  }

  async function sendDirect(text: string) {
    const trimmed = text.trim()
    if (!trimmed || ctx.sending) return
    await doSend(trimmed)
  }

  async function sendDirectToConv(text: string, convId: string) {
    const trimmed = text.trim()
    if (!trimmed || ctx.sending) return
    await doSendWithConvId(trimmed, convId)
  }

  async function sendDirectToNewConv(text: string, convId: string, overrideClientPrefs?: Record<string, unknown>, displayText?: string) {
    const trimmed = text.trim()
    if (!trimmed || ctx.sending) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: displayText?.trim() ?? trimmed,
      model_used: null, cost_eur: null, tokens_input: null, tokens_output: null,
    }
    ctx.setMessages([userMsg])
    ctx.setChips([])
    await doSendWithConvId(trimmed, convId, overrideClientPrefs)
  }

  async function regenerate() {
    if (ctx.sending || !ctx.activeConvId) return

    const msgs = ctx.messages ?? []
    const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant' && !m.pending)
    const lastUser = [...msgs].reverse().find(m => m.role === 'user')
    if (!lastAssistant || !lastUser) return

    const convId = ctx.activeConvId

    // Delete old assistant message from DB (best-effort)
    if (lastAssistant.id && !lastAssistant.id.startsWith('pending-')) {
      void Promise.resolve(supabase.from('messages').delete().eq('id', lastAssistant.id).then(() => {/*non-blocking*/})).catch(() => {})
    }

    ctx.setMessages(prev => prev.filter(m => m.id !== lastAssistant.id))
    await doSendWithConvId(lastUser.content, convId)
  }

  return { sendMessage, sendDirect, sendDirectToConv, sendDirectToNewConv, regenerate, handleGuidedAction, logout, handleLogout }
}
