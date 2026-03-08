import type { ReactNode } from 'react'

export default function WorkspacePageLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
