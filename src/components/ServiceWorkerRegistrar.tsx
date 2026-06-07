'use client'

import { useEffect } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('sw')

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // In Entwicklung KEINEN Service Worker: er cached /_next/static-Chunks cache-first,
    // und da Dev-Chunknamen stabil sind (Inhalt ändert sich via HMR), würde dauerhaft
    // veralteter Code serviert. Stattdessen vorhandene SWs + Caches aktiv entfernen (Selbstheilung).
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister())
      })
      if ('caches' in window) {
        void caches.keys().then((keys) =>
          keys.filter((k) => k.startsWith('tropen-os-')).forEach((k) => void caches.delete(k)),
        )
      }
      return
    }

    const version = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'v1'
    navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' }).catch((err) => {
      logger.warn('Registrierung fehlgeschlagen:', err)
    })
  }, [])

  return null
}
