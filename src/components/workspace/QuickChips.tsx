'use client'

import type { ChipItem } from '@/lib/workspace-types'

interface QuickChipsProps {
  chips: ChipItem[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export default function QuickChips({ chips, onSelect, disabled }: QuickChipsProps) {
  if (chips.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      padding: '8px 16px 4px',
    }}>
      {chips.map((chip, i) => (
        <button
          key={i}
          className="chip"
          onClick={() => onSelect(chip.prompt)}
          disabled={disabled}
          style={{ cursor: disabled ? 'default' : 'pointer' }}
          title={chip.prompt}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
