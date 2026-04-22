'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'

interface ImpSession {
  sessionId: string
  targetEmail: string
  ticketRef: string | null
  expiresAt: string
}

const KEY = 'tropen_impersonation'

export default function ImpersonationBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<ImpSession | null>(null)
  const [remaining, setRemaining] = useState('')

  const endSession = useCallback(async () => {
    const stored = sessionStorage.getItem(KEY)
    if (stored) {
      const s: ImpSession = JSON.parse(stored)
      await fetch(`/api/superadmin/impersonate/${s.sessionId}`, { method: 'DELETE' })
    }
    sessionStorage.removeItem(KEY)
    setSession(null)
    router.push('/chat')
  }, [router])

  // On mount: check URL param, then sessionStorage
  useEffect(() => {
    const impId = searchParams.get('_imp')
    if (impId) {
      fetch(`/api/superadmin/impersonate/${impId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          sessionStorage.setItem(KEY, JSON.stringify(data))
          setSession(data)
          // Remove _imp from URL
          const params = new URLSearchParams(searchParams.toString())
          params.delete('_imp')
          const next = params.toString() ? `${pathname}?${params}` : pathname
          router.replace(next)
        })
        .catch(() => {})
      return
    }
    const stored = sessionStorage.getItem(KEY)
    if (stored) {
      const s: ImpSession = JSON.parse(stored)
      if (new Date(s.expiresAt) > new Date()) {
        setSession(s)
      } else {
        sessionStorage.removeItem(KEY)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!session) return
    const update = () => {
      const diff = Math.max(0, new Date(session.expiresAt).getTime() - Date.now())
      if (diff === 0) { endSession(); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${m}:${String(s).padStart(2, '0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [session, endSession])

  if (!session) return null

  return (
    <div style={{
      position: 'fixed', top: 52, left: 0, right: 0, zIndex: 200,
      background: 'var(--active-bg)', borderBottom: '1px solid var(--accent)',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
      height: 40, fontSize: 13,
    }}>
      <span style={{ color: 'var(--accent-light)', fontWeight: 700, letterSpacing: '0.05em', fontSize: 11 }}>
        READ-ONLY
      </span>
      <span style={{ color: '#fff' }}>
        Du siehst Tropen OS als{' '}
        <strong>{session.targetEmail}</strong>
        {session.ticketRef && (
          <> · Support-Ticket <strong>{session.ticketRef}</strong></>
        )}
        {' '}· {remaining} verbleibend
      </span>
      <button
        onClick={endSession}
        style={{
          marginLeft: 'auto', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', borderRadius: 5,
          padding: '3px 12px', fontSize: 12, cursor: 'pointer',
        }}
      >
        Ansicht beenden
      </button>
    </div>
  )
}
