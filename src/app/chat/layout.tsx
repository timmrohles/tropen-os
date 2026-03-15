import type { ReactNode } from 'react'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, top: 52, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}
