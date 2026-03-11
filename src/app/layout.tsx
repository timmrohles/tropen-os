import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import ConditionalNavBar from '@/components/ConditionalNavBar'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import './globals.css'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tropen OS',
  description: 'Responsible AI Workspace für den Mittelstand'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`} style={{ minHeight: '100vh' }}>
        <ConditionalNavBar />
        <Suspense>
          <ImpersonationBanner />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  )
}
