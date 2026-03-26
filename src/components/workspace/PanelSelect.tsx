'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

interface PanelSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

export function PanelSelect({ id, label, value, onChange, options }: PanelSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="panel-select-field" ref={ref}>
      <label className="right-panel-label" htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        className="panel-select-trigger"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        type="button"
      >
        <span>{current?.label ?? value}</span>
        <CaretDown size={12} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <div className="dropdown panel-select-dropdown" role="listbox">
          {options.map(option => (
            <button
              key={option.value}
              className={`dropdown-item${option.value === value ? ' dropdown-item--active' : ''}`}
              role="option"
              aria-selected={option.value === value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.value === value && (
                <Check size={14} weight="bold" aria-hidden="true" />
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
