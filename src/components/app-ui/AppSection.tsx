import React from 'react'

interface AppSectionProps {
  header: React.ReactNode
  headerRight?: React.ReactNode
  accent?: boolean
  dark?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
  headerStyle?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export function AppSection({ header, headerRight, accent, dark, children, style, headerStyle, bodyStyle }: AppSectionProps) {
  const headerClass = [
    'app-section__header',
    accent ? 'app-section__header--accent' : '',
    dark   ? 'app-section__header--dark'   : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="app-section" style={style}>
      <div className={headerClass} style={headerStyle}>
        <span className="app-section__header-label">{header}</span>
        {headerRight && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: dark ? '#ffffff' : 'var(--text-tertiary)' }}>{headerRight}</span>}
      </div>
      <div className="app-section__body" style={bodyStyle}>{children}</div>
    </div>
  )
}
