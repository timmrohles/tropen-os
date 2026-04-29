import React from 'react'

interface ColDef {
  key: string
  label: string
  mono?: boolean
  width?: number | string
  align?: 'left' | 'right'
}

interface AppTableProps {
  cols: ColDef[]
  rows: Array<Record<string, React.ReactNode>>
  onRowClick?: (row: Record<string, React.ReactNode>, idx: number) => void
  expandedIdx?: number
  expandedContent?: React.ReactNode
  emptyState?: React.ReactNode
}

export function AppTable({ cols, rows, onRowClick, expandedIdx, expandedContent, emptyState }: AppTableProps) {
  if (rows.length === 0 && emptyState) {
    return <div style={{ padding: '24px 16px' }}>{emptyState}</div>
  }

  return (
    <table className="app-table">
      <thead>
        <tr>
          {cols.map(col => (
            <th key={col.key} style={{ width: col.width, textAlign: col.align ?? 'left' }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <React.Fragment key={idx}>
            <tr
              onClick={() => onRowClick?.(row, idx)}
              style={{ cursor: onRowClick ? 'pointer' : undefined }}
            >
              {cols.map(col => (
                <td key={col.key} className={col.mono ? 'app-table-mono' : undefined} style={{ textAlign: col.align }}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
            {expandedIdx === idx && expandedContent && (
              <tr>
                <td colSpan={cols.length} style={{ padding: 0, background: 'var(--bg-base)' }}>
                  {expandedContent}
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  )
}
