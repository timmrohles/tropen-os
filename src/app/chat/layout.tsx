import type { ReactNode } from 'react'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', top: 'var(--content-top)', right: 0, bottom: 0, left: 'var(--current-sidebar-offset)', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
