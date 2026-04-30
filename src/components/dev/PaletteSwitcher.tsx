'use client'
import { useEffect, useState } from 'react'

// Dev-only — kleines schwebendes Toggle-Button unten rechts.
// Wird nur in development gerendert (siehe Layout).
export function PaletteSwitcher() {
  const [isWarm, setIsWarm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('tropen-palette')
    if (saved === 'warm') {
      document.documentElement.classList.add('palette-warm')
      setIsWarm(true)
    }
  }, [])

  function toggle() {
    const warm = document.documentElement.classList.toggle('palette-warm')
    localStorage.setItem('tropen-palette', warm ? 'warm' : 'mixed')
    setIsWarm(warm)
  }

  return (
    <button
      onClick={toggle}
      title={`Palette: ${isWarm ? 'Warm' : 'Mixed'} — klicken zum Wechseln`}
      style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
        padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)',
        background: isWarm ? '#EFEAE0' : '#EDF3EE',
        color: 'var(--text-primary)', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        fontFamily: 'monospace', lineHeight: 1,
      }}
    >
      {isWarm ? 'Warm' : 'Mixed'}
    </button>
  )
}
