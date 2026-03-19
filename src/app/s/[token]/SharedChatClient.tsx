'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatCircle, ArrowLeft } from '@phosphor-icons/react'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

interface SharedData {
  conversation: { id: string; title: string | null; created_at: string }
  messages: Message[]
}

export default function SharedChatClient({ token }: { token: string }) {
  const router = useRouter()
  const [data, setData] = useState<SharedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/s/${token}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setError('Chat nicht gefunden oder kein Zugriff.')
      })
    return () => controller.abort()
  }, [token])

  async function handleReply() {
    if (!data) return
    setReplying(true)
    const res = await fetch('/api/conversations/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shared_from_id: data.conversation.id,
        title: `Antwort: ${data.conversation.title ?? 'Geteilter Chat'}`,
      }),
    })
    if (res.ok) {
      const newConv: { id: string } = await res.json()
      router.push(`/chat/${newConv.id}`)
    }
    setReplying(false)
  }

  const s: Record<string, React.CSSProperties> = {
    wrap: { maxWidth: 720, margin: '0 auto', padding: '32px 16px 48px' },
    header: { marginBottom: 32 },
    title: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' },
    meta: { fontSize: 13, color: 'var(--text-tertiary)' },
    badge: { display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginLeft: 8 },
    messages: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 },
    msgUser: { background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 16px', alignSelf: 'flex-end', maxWidth: '85%', border: '1px solid var(--border)' },
    msgAssistant: { background: 'transparent', maxWidth: '85%' },
    role: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
    content: { fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 },
    actions: { display: 'flex', gap: 12, justifyContent: 'center' },
  }

  if (error) {
    return (
      <div style={s.wrap}>
        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 80 }}>{error}</p>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/chat')}>
            <ArrowLeft size={14} weight="bold" /> Zurück
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div style={{ ...s.wrap, color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 80 }}>Lade…</div>
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => router.back()}>
          <ArrowLeft size={14} weight="bold" /> Zurück
        </button>
        <h1 style={s.title}>
          {data.conversation.title ?? 'Geteilter Chat'}
          <span style={s.badge}>Geteilt</span>
        </h1>
        <p style={s.meta}>{new Date(data.conversation.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div style={s.messages}>
        {data.messages.map(msg => (
          <div key={msg.id} style={msg.role === 'user' ? s.msgUser : s.msgAssistant}>
            <p style={s.role}>{msg.role === 'user' ? 'Du' : 'Toro'}</p>
            <p style={s.content}>{msg.content}</p>
          </div>
        ))}
      </div>

      <div style={s.actions}>
        <button className="btn btn-primary" onClick={handleReply} disabled={replying}>
          <ChatCircle size={15} weight="bold" />
          {replying ? 'Erstelle Chat…' : 'Im eigenen Chat antworten'}
        </button>
      </div>
    </div>
  )
}
