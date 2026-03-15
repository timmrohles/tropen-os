import type { Connection, Card } from '@/db/schema'
import type { CardType } from '@/db/schema'

export interface ConnectionWithCards extends Connection {
  fromCard: { id: string; title: string; type: CardType }
  toCard: { id: string; title: string; type: CardType }
}

export interface AffectedCard {
  card: Card
  depth: number
  connectionPath: string[] // cardIds from start to this card
}
