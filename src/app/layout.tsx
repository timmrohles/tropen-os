import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import './globals.css'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // mono font used only in code blocks — not render-critical
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
  themeColor: '#3F4A55', // eslint-disable-line -- browser meta tag, kein CSS-Var möglich
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers()
  const locale = hdrs.get('x-locale') ?? 'de'

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
