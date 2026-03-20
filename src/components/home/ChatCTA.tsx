'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowRight } from '@phosphor-icons/react'

export default function ChatCTA({ workspaceId }: { workspaceId: string | null }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleStart() {
    if (!workspaceId || creating) return
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }
    const { data } = await supabase
      .from('conversations')
      .insert({ workspace_id: workspaceId, user_id: user.id, title: 'Neuer Chat', conversation_type: 'chat' })
      .select('id')
      .single()
    if (data) {
      router.push(`/chat/${(data as { id: string }).id}`)
    } else {
      setCreating(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={creating || !workspaceId}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: creating || !workspaceId ? 'default' : 'pointer',
        marginBottom: 24,
        opacity: creating ? 0.7 : 1,
        transition: 'opacity 150ms ease',
      }}
      aria-label="Chat starten"
    >
      <div
        className="card"
        style={{ background: 'var(--active-bg)', border: 'none' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 28 }} aria-hidden="true">🦜</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-inverse)' }}>
                {creating ? 'Chat wird erstellt…' : 'Chat starten'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-inverse)', marginTop: 2, opacity: 0.8 }}>
                Frag Toro — er hilft dir sofort weiter
              </div>
            </div>
          </div>
          <ArrowRight size={20} weight="bold" color="var(--text-inverse)" aria-hidden="true" />
        </div>
      </div>
    </button>
  )
}
