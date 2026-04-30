import React from 'react'

interface AppSectionProps {
  header: React.ReactNode
  headerRight?: React.ReactNode
  accent?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
  headerStyle?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export function AppSection({ header, headerRight, accent, children, style, headerStyle, bodyStyle }: AppSectionProps) {
  return (
    <div className="app-section" style={style}>
      <div className={`app-section__header${accent ? ' app-section__header--accent' : ''}`} style={headerStyle}>
        <span className="app-section__header-label">{header}</span>
        {headerRight && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>{headerRight}</span>}
      </div>
      <div className="app-section__body" style={bodyStyle}>{children}</div>
    </div>
  )
}
