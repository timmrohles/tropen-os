import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import ConditionalNavBar from '@/components/ConditionalNavBar'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tropen OS',
  description: 'Responsible AI Workspace für den Mittelstand'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <ConditionalNavBar />
        <Suspense>
          <ImpersonationBanner />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  )
}
