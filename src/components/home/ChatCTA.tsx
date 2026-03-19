'use client'
import { useRouter } from 'next/navigation'
import { ArrowRight } from '@phosphor-icons/react'

export default function ChatCTA() {
  const router = useRouter()
  return (
    <div
      className="card"
      style={{ marginBottom: 24, background: 'var(--active-bg)', cursor: 'pointer', border: 'none' }}
      onClick={() => router.push('/chat')}
      onKeyDown={e => e.key === 'Enter' && router.push('/chat')}
      role="button"
      aria-label="Chat starten"
      tabIndex={0}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 28 }} aria-hidden="true">🦜</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-inverse)' }}>Chat starten</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Frag Toro — er hilft dir sofort weiter
            </div>
          </div>
        </div>
        <ArrowRight size={20} weight="bold" color="var(--text-secondary)" aria-hidden="true" />
      </div>
    </div>
  )
}
