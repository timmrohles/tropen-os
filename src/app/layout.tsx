import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import type React from 'react'
import ConditionalNavBar from '@/components/ConditionalNavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tropen OS',
  description: 'Responsible AI Workspace für den Mittelstand'
}

const s = { main: { padding: 32, maxWidth: 1200, margin: '0 auto' } as React.CSSProperties }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body>
        <ConditionalNavBar />
        <main style={s.main}>{children}</main>
      </body>
    </html>
  )
}
