'use client'

import { useState, useEffect, useRef } from 'react'
import { ICON_OPTIONS, getProjectIcon } from './types'

export function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const CurrentIcon = getProjectIcon(value)

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="project-emoji-picker-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Icon wählen"
        title="Icon wählen"
      >
        <CurrentIcon size={18} weight="fill" aria-hidden="true" />
      </button>
      {open && (
        <div className="project-emoji-grid" style={{ position: 'absolute', top: 42, left: 0, zIndex: 10 }}>
          {ICON_OPTIONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              className={`project-emoji-opt${value === name ? ' project-emoji-opt--active' : ''}`}
              onClick={() => { onChange(name); setOpen(false) }}
              aria-label={name}
              title={name}
            >
              <Icon size={18} weight="fill" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
