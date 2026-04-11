'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { updateCardPosition } from '@/actions/cards'
import type { Card, Connection } from '@/db/schema'
import type { WorkspaceWithDetails } from '@/types/workspace'

import ConnectionLines from '@/components/ws/ConnectionLines'
import WorkspaceCard from '@/components/ws/WorkspaceCard'
import DetailPanel from '@/components/ws/DetailPanel'
import CardForm from '@/components/ws/CardForm'
import TopBar from '@/components/ws/TopBar'
import SiloPanel from '@/components/ws/SiloPanel'
import WorkspaceBriefing from '@/components/workspace/WorkspaceBriefing'

interface DragState {
  cardId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

interface Props {
  initialCards: Card[]
  initialConnections: Connection[]
  workspaceId: string
  initialWorkspace: WorkspaceWithDetails
}

export default function Canvas({ initialCards, initialConnections, workspaceId, initialWorkspace }: Props) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [connections] = useState<Connection[]>(initialConnections)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [showCardForm, setShowCardForm] = useState(false)
  const [siloOpen, setSiloOpen] = useState(false)
  const [workspace, setWorkspace] = useState<WorkspaceWithDetails>(initialWorkspace)

  const dragRef = useRef<DragState | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const pendingPositionRef = useRef<{ id: string; x: number; y: number } | null>(null)

  const briefingSkipped = Boolean((workspace.meta as Record<string, unknown> | null)?.briefing_skipped)
  const briefingDone = Boolean((workspace.meta as Record<string, unknown> | null)?.briefing_done)
  const showBriefing = cards.length === 0 && !briefingSkipped && !briefingDone

  // Keep workspace.cards in sync with local card state
  useEffect(() => {
    setWorkspace((prev) => ({ ...prev, cards }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards])

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) ?? null : null

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((cardId: string, e: React.MouseEvent) => {
    e.preventDefault()
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    dragRef.current = {
      cardId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - card.positionX,
      offsetY: e.clientY - card.positionY,
    }
  }, [cards])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current
    if (!drag) return

    const newX = Math.max(0, e.clientX - drag.offsetX)
    const newY = Math.max(0, e.clientY - drag.offsetY)

    setCards((prev) =>
      prev.map((c) =>
        c.id === drag.cardId
          ? { ...c, positionX: newX, positionY: newY }
          : c
      )
    )

    pendingPositionRef.current = { id: drag.cardId, x: newX, y: newY }
  }, [])

  const handleMouseUp = useCallback(() => {
    const pending = pendingPositionRef.current
    if (pending) {
      updateCardPosition(pending.id, pending.x, pending.y).catch(() => {/* silent */})
      pendingPositionRef.current = null
    }
    dragRef.current = null
  }, [])

  // ── Card updates from DetailPanel ──────────────────────────────────────────

  const handleCardUpdate = useCallback((updatedCard: Card) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    )
  }, [])

  // ── New card added ─────────────────────────────────────────────────────────

  const handleCardCreated = useCallback((newCard: Card) => {
    setCards((prev) => [...prev, newCard])
    setShowCardForm(false)
    setSelectedCardId(newCard.id)
  }, [])

  // ── Briefing complete (multiple cards created) ─────────────────────────────

  const handleBriefingComplete = useCallback((newCards: Card[]) => {
    setCards(newCards)
    setWorkspace(prev => ({
      ...prev,
      meta: { ...((prev.meta ?? {}) as object), briefing_done: true } as WorkspaceWithDetails['meta'],
    }))
  }, [])

  const handleBriefingSkip = useCallback(() => {
    setWorkspace(prev => ({
      ...prev,
      meta: { ...((prev.meta ?? {}) as object), briefing_skipped: true } as WorkspaceWithDetails['meta'],
    }))
  }, [])

  // ── Canvas click (deselect) ────────────────────────────────────────────────

  const handleCanvasClick = useCallback(() => {
    setSelectedCardId(null)
  }, [])

  // ── Keyboard: Escape deselects ─────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !showCardForm) {
        setSelectedCardId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showCardForm])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      <TopBar
        workspace={workspace}
        onAddCard={() => setShowCardForm(true)}
        siloOpen={siloOpen}
        onToggleSilo={() => setSiloOpen((p) => !p)}
      />

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas */}
        <div
          ref={canvasRef}
          role="application"
          aria-label="Workspace Canvas"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            cursor: dragRef.current ? 'grabbing' : 'default',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {/* Grid background dots */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(26,23,20,0.15) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Briefing flow for empty workspaces */}
          {showBriefing && (
            <WorkspaceBriefing
              workspace={workspace}
              onComplete={handleBriefingComplete}
              onSkip={handleBriefingSkip}
            />
          )}

          {/* Minimum canvas size */}
          <div style={{ width: 4000, height: 4000, position: 'relative' }}>
            {/* Connection lines */}
            <ConnectionLines
              connections={connections}
              cards={cards}
              selectedCardId={selectedCardId ?? undefined}
            />

            {/* Cards */}
            {cards.map((card) => (
              <WorkspaceCard
                key={card.id}
                card={card}
                selected={card.id === selectedCardId}
                onSelect={() => setSelectedCardId(card.id)}
                onDragStart={(e) => handleDragStart(card.id, e)}
              />
            ))}

            {/* Empty state — only when briefing was skipped/done */}
            {cards.length === 0 && !showBriefing && (
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                aria-live="polite"
              >
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Noch keine Karten
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Klicke oben auf „+ Karte hinzufügen&ldquo; um zu starten.
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  Beispiele: Zielgruppenanalyse · Kampagnenbrief · Social-Media-Post
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Silo Panel */}
        {siloOpen && (
          <SiloPanel workspace={workspace} />
        )}

        {/* Detail Panel */}
        {selectedCard && (
          <DetailPanel
            card={selectedCard}
            workspaceId={workspaceId}
            onClose={() => setSelectedCardId(null)}
            onCardUpdate={handleCardUpdate}
          />
        )}
      </div>

      {/* Card Form Modal */}
      {showCardForm && (
        <CardForm
          workspaceId={workspaceId}
          onCreated={handleCardCreated}
          onClose={() => setShowCardForm(false)}
        />
      )}
    </div>
  )
}
