'use client'

import type { ChipItem } from '@/lib/workspace-types'

export default function SuggestionPillsSection({ suggestions, suggestionsEnabled, chips, isLastMessage, onSendDirect }: {
  suggestions: string[]
  suggestionsEnabled: boolean
  chips: ChipItem[]
  isLastMessage: boolean
  onSendDirect?: (text: string) => void
}) {
  return (
    <>
      {suggestionsEnabled && suggestions.length > 0 && (
        <div className="suggestion-pills" role="group" aria-label="Weiterführende Vorschläge">
          {suggestions.map((s, i) => (
            <button key={i} className="suggestion-pill" onClick={() => onSendDirect?.(s)}>
              {s} →
            </button>
          ))}
        </div>
      )}
      {isLastMessage && chips.length > 0 && (
        <div className="suggestion-pills" role="list" aria-label="Vorschläge">
          {chips.map(chip => (
            <button key={chip.label} className="suggestion-pill" role="listitem" onClick={() => onSendDirect?.(chip.prompt)}>
              {chip.label} →
            </button>
          ))}
        </div>
      )}
    </>
  )
}
