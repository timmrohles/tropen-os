'use client'

import type { Connection, Card } from '@/db/schema'

// Card dimensions used to compute center anchor points
const CARD_WIDTH = 200
const CARD_HEIGHT = 120 // approximate — used for vertical center

interface Props {
  connections: Connection[]
  cards: Card[]
  selectedCardId?: string
}

function getCardCenter(card: Card): { x: number; y: number } {
  return {
    x: card.positionX + CARD_WIDTH / 2,
    y: card.positionY + CARD_HEIGHT / 2,
  }
}

function cubicBezierPath(
  x1: number, y1: number,
  x2: number, y2: number
): string {
  const dx = Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

export default function ConnectionLines({ connections, cards, selectedCardId }: Props) {
  const cardMap = new Map(cards.map((c) => [c.id, c]))

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4000px',
        height: '4000px',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="arrow-default"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#1e1e1e" />
        </marker>
        <marker
          id="arrow-selected"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#7C6FF7" />
        </marker>
      </defs>

      {connections.map((conn) => {
        const fromCard = cardMap.get(conn.fromCardId)
        const toCard = cardMap.get(conn.toCardId)
        if (!fromCard || !toCard) return null

        const from = getCardCenter(fromCard)
        const to = getCardCenter(toCard)
        const path = cubicBezierPath(from.x, from.y, to.x, to.y)

        const isHighlighted =
          conn.fromCardId === selectedCardId || conn.toCardId === selectedCardId

        const isDashed = toCard.status === 'draft'

        return (
          <path
            key={conn.id}
            d={path}
            fill="none"
            stroke={isHighlighted ? '#7C6FF7' : '#1e1e1e'}
            strokeWidth={isHighlighted ? 2 : 1.5}
            strokeDasharray={isDashed ? '6 4' : undefined}
            markerEnd={`url(#arrow-${isHighlighted ? 'selected' : 'default'})`}
            opacity={isHighlighted ? 1 : 0.7}
          />
        )
      })}
    </svg>
  )
}
