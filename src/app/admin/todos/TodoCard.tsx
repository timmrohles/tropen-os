'use client'

import type { Todo } from './todo.types'
import { STATUS_CONFIG, PRIO_CONFIG, s, badgeStyle } from './todoConfig'

interface TodoCardProps {
  todo: Todo
}

export function TodoCard({ todo }: TodoCardProps) {
  const st = STATUS_CONFIG[todo.status]
  const pr = PRIO_CONFIG[todo.prioritaet]

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardTitle}>{todo.titel}</div>
        <div style={s.badgeRow}>
          <span style={badgeStyle(st.bg, st.color)}>{st.label}</span>
          <span style={{ fontSize: 11, color: pr.color, fontWeight: 500 }}>{pr.label}</span>
        </div>
      </div>
      {todo.beschreibung && (
        <div style={s.cardDesc}>{todo.beschreibung}</div>
      )}
      <div style={s.cardMeta}>
        {todo.referenz && (
          <span style={s.ref}>{todo.referenz}</span>
        )}
      </div>
    </div>
  )
}
