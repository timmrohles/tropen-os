import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import ConditionalAppShell from '@/components/layout/ConditionalAppShell'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import './globals.css'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
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
  description: 'Responsible AI Department für den Mittelstand',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Tropen OS',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2D7A50',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
        <ServiceWorkerRegistrar />
        <Suspense>
          <ImpersonationBanner />
        </Suspense>
        <Suspense>
          <ConditionalAppShell>
            {children}
          </ConditionalAppShell>
        </Suspense>
      </body>
    </html>
  )
}
