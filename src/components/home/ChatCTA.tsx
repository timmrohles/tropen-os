import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'

export default function ChatCTA() {
  return (
    <Link
      href="/chat"
      style={{ display: 'block', textDecoration: 'none', marginBottom: 24 }}
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
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-inverse)' }}>Chat starten</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Frag Toro — er hilft dir sofort weiter
              </div>
            </div>
          </div>
          <ArrowRight size={20} weight="bold" color="var(--text-inverse)" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}
