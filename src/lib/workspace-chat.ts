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

// ── SSE types ──────────────────────────────────────────────────────────────────

interface SSEChunkEvent { type: 'chunk'; content: string }
interface SSEDoneEvent {
  type: 'done'
  routing?: { task_type: string; agent: string; model_class: string; model: string }
  usage?: { cost_eur: number; tokens_input?: number; tokens_output?: number }
  sources?: SearchSource[]
  link_previews?: boolean
  thinking?: string
}
type SSEEvent = SSEChunkEvent | SSEDoneEvent | { type: 'searching' } | { type: 'error'; message?: string }

interface SSECallbacks {
  onChunk: (content: string) => void
  onDone: (event: SSEDoneEvent) => Promise<void>
  onSearching: () => void
  onError: (message: string) => void
}

// ── Shared SSE stream processor ────────────────────────────────────────────────

function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith('data: ')) return null
  const raw = line.slice(6).trim()
  if (!raw) return null
  try { return JSON.parse(raw) as SSEEvent } catch { return null }
}

async function processSSEStream(response: Response, callbacks: SSECallbacks): Promise<void> {
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
      const event = parseSSELine(line)
      if (!event) continue
      if (event.type === 'searching') {
        callbacks.onSearching()
      } else if (event.type === 'chunk' && (event as SSEChunkEvent).content) {
        callbacks.onChunk((event as SSEChunkEvent).content)
      } else if (event.type === 'done') {
        await callbacks.onDone(event as SSEDoneEvent)
      } else if (event.type === 'error') {
        callbacks.onError((event as { type: 'error'; message?: string }).message ?? 'Stream-Fehler')
      }
    }
  }
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function fetchAIChat(
  session: { access_token: string },
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    }
  )
}

function buildRequestBody(
  workspaceId: string,
  convId: string,
  message: string,
  options: {
    attachment?: AttachmentData | null
    clientPrefs?: Record<string, unknown> | null
    overridePrefs?: Record<string, unknown>
  }
): Record<string, unknown> {
  const { attachment, clientPrefs, overridePrefs } = options
  const mergedPrefs = overridePrefs
    ? { ...(clientPrefs ?? {}), ...overridePrefs }
    : clientPrefs

  return {
    workspace_id: workspaceId,
    conversation_id: convId,
    message,
    ...(attachment ? { attachment: { name: attachment.name, mediaType: attachment.mediaType, base64: attachment.base64 } } : {}),
    ...(mergedPrefs ? { client_prefs: mergedPrefs } : {}),
  }
}

// ── ID sync helper (replaces transient pending ID with real DB ID) ─────────────

function syncMessageId(supabase: SupabaseClient, convId: string, pendingId: string, setMessages: ChatActionsCtx['setMessages']): void {
  void Promise.resolve(
    supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', convId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ).then(({ data }) => {
    if (data?.id) {
      setMessages(prev => prev.map(m => m.id === pendingId ? { ...m, id: data.id } : m))
    }
  }).catch(() => {})
}

// ── Done-event handler for full doSend (with chips + memory + title logic) ────

async function handleFullDoneEvent(
  event: SSEDoneEvent,
  ctx: ChatActionsCtx,
  convId: string,
  pendingId: string,
  conv: Conversation | undefined,
  currentInput: string,
  accumulatedContent: string,
): Promise<void> {
  const { supabase, setMessages, setRouting, setConversations, setChips, setMemoryExtracting } = ctx

  ctx.setIsSearching(false)
  if (event.routing) setRouting(event.routing)

  setMessages(prev => prev.map(m => m.pending ? finalisePendingMessage(m, event) : m))
  syncMessageId(supabase, convId, pendingId, setMessages)

  triggerMemoryExtractionIfNeeded(conv, convId, setMemoryExtracting)
  await updateConversationTitle(supabase, setConversations, conv, convId, currentInput)
  await updateTaskType(supabase, setConversations, conv, convId, event.routing?.task_type)
  loadChipsForContent(accumulatedContent, setChips)
}

// ── Done-event helpers (extracted to reduce CC of handleFullDoneEvent) ────────

function finalisePendingMessage(m: ChatMessage, event: SSEDoneEvent): ChatMessage {
  return {
    ...m,
    pending: false,
    cost_eur: event.usage?.cost_eur ?? null,
    tokens_input: event.usage?.tokens_input ?? null,
    tokens_output: event.usage?.tokens_output ?? null,
    model_used: event.routing?.model ?? null,
    sources: event.sources?.length ? event.sources : undefined,
    link_previews: event.link_previews ?? true,
    ...(event.thinking ? { thinking: event.thinking } : {}),
  }
}

function triggerMemoryExtractionIfNeeded(
  conv: Conversation | undefined,
  convId: string,
  setMemoryExtracting: ChatActionsCtx['setMemoryExtracting'],
): void {
  if (!conv?.project_id) return
  setMemoryExtracting(true)
  fetch(`/api/conversations/${convId}/extract-memory`, { method: 'POST' }).catch(() => {})
  setTimeout(() => setMemoryExtracting(false), 3000)
}

async function updateConversationTitle(
  supabase: ChatActionsCtx['supabase'],
  setConversations: ChatActionsCtx['setConversations'],
  conv: Conversation | undefined,
  convId: string,
  currentInput: string,
): Promise<void> {
  if (!conv?.title?.startsWith('Chat · ')) return
  const words = currentInput.trim().split(/\s+/)
  const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '')
  await supabase.from('conversations').update({ title }).eq('id', convId)
  setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c))
}

async function updateTaskType(
  supabase: ChatActionsCtx['supabase'],
  setConversations: ChatActionsCtx['setConversations'],
  conv: Conversation | undefined,
  convId: string,
  detectedType: string | undefined,
): Promise<void> {
  if (!detectedType || !conv || conv.task_type) return
  await supabase.from('conversations').update({ task_type: detectedType }).eq('id', convId).is('task_type', null)
  setConversations(prev => prev.map(c =>
    c.id === convId && !c.task_type ? { ...c, task_type: detectedType } : c
  ))
}

function loadChipsForContent(
  accumulatedContent: string,
  setChips: ChatActionsCtx['setChips'],
): void {
  if (accumulatedContent.trim().length <= 20) return

  if (/type=["']presentation["']/.test(accumulatedContent)) {
    setChips([
      { label: 'Design ändern',    prompt: 'Ändere das Design auf einen dunkleren, professionelleren Stil' },
      { label: 'Slide hinzufügen', prompt: 'Füge eine weitere Slide mit den wichtigsten Erkenntnissen hinzu' },
      { label: 'Kürzen',           prompt: 'Kürze auf maximal 5 Slides — nur das Wesentliche' },
      { label: 'Auf Englisch',     prompt: 'Übersetze die gesamte Präsentation ins Englische' },
    ])
    return
  }

  fetch('/api/chat/generate-chips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastMessage: accumulatedContent }),
  })
    .then(r => r.ok ? r.json() as Promise<{ chips: ChipItem[] }> : null)
    .then(res => { if (res?.chips?.length) setChips(res.chips) })
    .catch(() => {})
}

// ── createChatActions ──────────────────────────────────────────────────────────

export function createChatActions(ctx: ChatActionsCtx) {
  const { supabase, workspaceId } = ctx

  async function doSend(currentInput: string) {
    const attachment = ctx.attachmentRef.current
    ctx.attachmentRef.current = null

    const userMsgContent = attachment ? `[📎 ${attachment.name}]\n${currentInput}` : currentInput
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
      if (!convId) { ctx.sendingRef.current = false; return }
      const autoTitle = currentInput.trim().slice(0, 50)
      if (autoTitle) {
        supabase.from('conversations').update({ title: autoTitle }).eq('id', convId)
        ctx.setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: autoTitle } : c))
      }
    }

    if (!isNewConv) {
      ctx.setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        return [...prev, ...[userMsg, pendingMsg].filter(m => !existingIds.has(m.id))]
      })
    }
    ctx.setInput('')
    ctx.setSending(true)
    ctx.setRouting(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Nicht eingeloggt')

      const response = await fetchAIChat(session, buildRequestBody(workspaceId, convId, currentInput, {
        attachment,
        clientPrefs: ctx.chatPrefsRef.current,
      }))
      ctx.setError('')
      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText)
        let errMsg = `HTTP ${response.status}`
        try {
          const errData = JSON.parse(errText) as { error?: string; message?: string; msg?: string }
          errMsg = errData.error ?? errData.message ?? errData.msg ?? JSON.stringify(errData)
        } catch { errMsg = errText || response.statusText || `HTTP ${response.status}` }
        throw new Error(errMsg)
      }

      const conv = ctx.conversations.find(c => c.id === convId)
      const pendingId = pendingMsg.id as string
      const resolvedConvId = convId as string

      await processSSEStream(response, {
        onSearching: () => ctx.setIsSearching(true),
        onChunk: (content) => {
          ctx.setIsSearching(false)
          accumulatedContent += content
          ctx.setMessages(prev => prev.map(m => m.pending ? { ...m, content: m.content + content } : m))
        },
        onDone: (event) => handleFullDoneEvent(event, ctx, resolvedConvId, pendingId, conv, currentInput, accumulatedContent),
        onError: (msg) => { throw new Error(msg) },
      })
    } catch (err) {
      ctx.setIsSearching(false)
      ctx.setMessages(prev => prev.filter(m => !m.pending))
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

      const response = await fetchAIChat(session, buildRequestBody(workspaceId, convId, currentInput, {
        clientPrefs: ctx.chatPrefsRef.current,
        overridePrefs: overrideClientPrefs,
      }))

      ctx.setError('')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const pendingId = pendingMsg.id as string

      await processSSEStream(response, {
        onSearching: () => {},
        onChunk: (content) => {
          ctx.setMessages(prev => prev.map(m => m.pending ? { ...m, content: m.content + content } : m))
        },
        onDone: async (event) => {
          if (event.routing) ctx.setRouting(event.routing)
          ctx.setMessages(prev => prev.map(m => m.pending
            ? { ...m, pending: false, cost_eur: event.usage?.cost_eur ?? null, tokens_input: event.usage?.tokens_input ?? null, tokens_output: event.usage?.tokens_output ?? null, model_used: event.routing?.model ?? null }
            : m
          ))
          syncMessageId(supabase, convId as string, pendingId, ctx.setMessages)
        },
        onError: (msg) => { throw new Error(msg) },
      })
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

    const activeConv = ctx.conversations.find(c => c.id === ctx.activeConvId)
    const complexity = detectComplexity(trimmed, !!activeConv?.project_id, trimmed.length > 200)

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
          convId: '',
        },
      }
      ctx.setInput('')
      const convId = await ctx.newConversation([userMsg, guidedPickerMsg])
      if (!convId) return
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
    _handleGuidedAction({ messages: ctx.messages, setMessages: ctx.setMessages, doSend, doSendWithConvId }, action)
  }

  async function logout() {
    await supabase.auth.signOut()
    const locale = window.location.pathname.split('/')[1] || 'de'
    window.location.href = `/${locale}`
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    const locale = window.location.pathname.split('/')[1] || 'de'
    window.location.href = `/${locale}`
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
    if (lastAssistant.id && !lastAssistant.id.startsWith('pending-')) {
      void Promise.resolve(supabase.from('messages').delete().eq('id', lastAssistant.id).then(() => {})).catch(() => {})
    }
    ctx.setMessages(prev => prev.filter(m => m.id !== lastAssistant.id))
    await doSendWithConvId(lastUser.content, convId)
  }

  return { sendMessage, sendDirect, sendDirectToConv, sendDirectToNewConv, regenerate, handleGuidedAction, logout, handleLogout }
}
