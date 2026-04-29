// BP6 — Tasks-Schicht entfernt (2026-04-28). Findings tragen Status selbst via not_relevant_reason.
// DROP TABLE audit_tasks folgt in Sprint 4.
import { NextResponse } from 'next/server'

export async function PATCH() {
  return NextResponse.json({ error: 'Gone — Tasks-Schicht entfernt', code: 'GONE' }, { status: 410 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Gone — Tasks-Schicht entfernt', code: 'GONE' }, { status: 410 })
}
