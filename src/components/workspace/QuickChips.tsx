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
    <div className="suggestion-pills">
      {chips.map((chip, i) => (
        <button
          key={i}
          className="suggestion-pill"
          onClick={() => onSelect(chip.prompt)}
          disabled={disabled}
          title={chip.prompt}
        >
          {chip.label} →
        </button>
      ))}
    </div>
  )
}
